import type {
  ConsoleEntry,
  RunnerLanguage,
  RunnerStatus,
  WorkerRequest,
  WorkerResponse,
} from '@/types/runner'
import { createRuntimeId } from '@/utils/createRuntimeId'
import { computed, onUnmounted, ref } from 'vue'

const RUN_TIMEOUT_MS = 2_000
const STARTUP_TIMEOUT_MS = 15_000
const COMPILE_TIMEOUT_MS = 5_000

export function useCodeRunner() {
  const status = ref<RunnerStatus>('idle')
  const logs = ref<ConsoleEntry[]>([])
  const diagnostics = ref<string[]>([])
  const duration = ref<number | null>(null)
  let worker: Worker | null = null
  let timeoutId: number | null = null
  let currentRunId = ''

  const isRunning = computed(() => status.value === 'compiling' || status.value === 'running')

  function cleanupWorker() {
    if (timeoutId !== null) window.clearTimeout(timeoutId)
    timeoutId = null
    worker?.terminate()
    worker = null
  }

  function stop(markStopped = true) {
    const wasRunning = isRunning.value
    cleanupWorker()
    if (markStopped && wasRunning) status.value = 'stopped'
  }

  function armTimeout(milliseconds: number, message: string) {
    if (timeoutId !== null) window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      cleanupWorker()
      status.value = 'timeout'
      logs.value.push({
        id: Date.now(),
        level: 'error',
        text: message,
        timestamp: Date.now(),
      })
    }, milliseconds)
  }

  function run(code: string, language: RunnerLanguage) {
    stop(false)
    logs.value = []
    diagnostics.value = []
    duration.value = null
    status.value = 'compiling'
    currentRunId = createRuntimeId()

    worker = new Worker(new URL('../workers/codeRunner.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.runId !== currentRunId) return

      if (message.type === 'status') {
        status.value = message.status
        if (message.status === 'compiling') {
          armTimeout(COMPILE_TIMEOUT_MS, 'TypeScript 编译超时，任务已终止。')
        } else {
          armTimeout(
            RUN_TIMEOUT_MS,
            `执行超过 ${RUN_TIMEOUT_MS / 1_000} 秒，已自动终止。请检查死循环或高开销计算。`,
          )
        }
      }
      if (message.type === 'log') logs.value.push(message.entry)
      if (message.type === 'error') {
        status.value = 'error'
        diagnostics.value = message.diagnostics ?? [message.message]
        if (!message.diagnostics) {
          logs.value.push({
            id: Date.now(),
            level: 'error',
            text: message.message,
            timestamp: Date.now(),
          })
        }
        cleanupWorker()
      }
      if (message.type === 'done') {
        status.value = 'success'
        duration.value = message.duration
        cleanupWorker()
      }
    }
    worker.onerror = (event) => {
      status.value = 'error'
      logs.value.push({
        id: Date.now(),
        level: 'error',
        text: event.message || '沙箱发生未知错误。',
        timestamp: Date.now(),
      })
      cleanupWorker()
    }

    const request: WorkerRequest = { type: 'run', runId: currentRunId, code, language }
    worker.postMessage(request)
    armTimeout(STARTUP_TIMEOUT_MS, '运行沙箱加载超时，请刷新页面后重试。')
  }

  function clear() {
    logs.value = []
    diagnostics.value = []
    if (!isRunning.value) status.value = 'idle'
  }

  onUnmounted(() => cleanupWorker())

  return { status, logs, diagnostics, duration, isRunning, run, stop, clear }
}
