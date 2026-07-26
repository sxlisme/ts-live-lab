/// <reference lib="webworker" />

import ts from 'typescript'
import { inspectSourceRestrictions } from '@/domain/runner/security'
import type { ConsoleEntry, ConsoleLevel, WorkerRequest, WorkerResponse } from '@/types/runner'

const workerScope = self as DedicatedWorkerGlobalScope
const safePostMessage = workerScope.postMessage.bind(workerScope)
const MAX_LOGS = 200
const MAX_OUTPUT_LENGTH = 4_000
let logSequence = 0
let logCount = 0

function post(message: WorkerResponse) {
  safePostMessage(message)
}

function serialize(value: unknown, depth = 0, seen = new WeakSet<object>()): string {
  if (typeof value === 'string') return value
  if (typeof value === 'undefined') return 'undefined'
  if (typeof value === 'bigint') return `${value}n`
  if (typeof value === 'symbol') return value.toString()
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
  if (value instanceof Error) return `${value.name}: ${value.message}`
  if (value === null || typeof value !== 'object') return String(value)
  if (depth >= 4) return '[Max depth]'
  if (seen.has(value)) return '[Circular]'

  seen.add(value)
  try {
    const normalized = Array.isArray(value)
      ? value.slice(0, 50).map((item) => serialize(item, depth + 1, seen))
      : Object.fromEntries(
          Object.entries(value)
            .slice(0, 50)
            .map(([key, item]) => [key, serialize(item, depth + 1, seen)]),
        )
    return JSON.stringify(normalized, null, 2)
  } catch {
    return Object.prototype.toString.call(value)
  } finally {
    seen.delete(value)
  }
}

function emitLog(runId: string, level: ConsoleLevel, values: unknown[]) {
  if (logCount >= MAX_LOGS) return
  logCount += 1
  const rawText = values.map((value) => serialize(value)).join(' ')
  const entry: ConsoleEntry = {
    id: ++logSequence,
    level,
    text: rawText.length > MAX_OUTPUT_LENGTH ? `${rawText.slice(0, MAX_OUTPUT_LENGTH)}…` : rawText,
    timestamp: Date.now(),
  }
  post({ type: 'log', runId, entry })

  if (logCount === MAX_LOGS) {
    post({
      type: 'log',
      runId,
      entry: {
        id: ++logSequence,
        level: 'warn',
        text: `输出已达到 ${MAX_LOGS} 条，后续日志被截断。`,
        timestamp: Date.now(),
      },
    })
  }
}

function blockCapability(name: string) {
  try {
    Object.defineProperty(globalThis, name, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: () => {
        throw new Error(`沙箱内禁止使用 ${name}`)
      },
    })
  } catch {
    // Some browser globals are not configurable; the worker still has no DOM or cookies.
  }
}

for (const capability of [
  'fetch',
  'WebSocket',
  'EventSource',
  'XMLHttpRequest',
  'Worker',
  'SharedWorker',
  'importScripts',
]) {
  blockCapability(capability)
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  if (request.type !== 'run') return

  const { code, language, runId } = request
  const startedAt = performance.now()
  logCount = 0

  if (code.length > 50_000) {
    post({ type: 'error', runId, message: '代码不能超过 50,000 个字符。' })
    return
  }

  post({ type: 'status', runId, status: 'compiling' })
  const forbidden = inspectSourceRestrictions(code, language)
  if (forbidden.length > 0) {
    post({
      type: 'error',
      runId,
      message: forbidden[0] ?? '代码包含受限能力。',
      diagnostics: forbidden,
    })
    return
  }

  const result = ts.transpileModule(code, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
      strict: true,
      noEmitOnError: false,
    },
    fileName: language === 'typescript' ? 'main.ts' : 'main.js',
    reportDiagnostics: true,
  })

  const diagnostics = (result.diagnostics ?? [])
    .filter((item) => item.category === ts.DiagnosticCategory.Error)
    .map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n'))

  if (diagnostics.length > 0) {
    post({ type: 'error', runId, message: '编译失败，请先修复 TypeScript 错误。', diagnostics })
    return
  }

  post({ type: 'status', runId, status: 'running' })
  const sandboxConsole = {
    log: (...values: unknown[]) => emitLog(runId, 'log', values),
    info: (...values: unknown[]) => emitLog(runId, 'info', values),
    warn: (...values: unknown[]) => emitLog(runId, 'warn', values),
    error: (...values: unknown[]) => emitLog(runId, 'error', values),
    assert: (condition: unknown, ...values: unknown[]) => {
      if (!condition) emitLog(runId, 'error', ['Assertion failed:', ...values])
    },
    clear: () => undefined,
  }

  try {
    const execute = new Function(
      'console',
      `"use strict"; return (async () => {\n${result.outputText}\n})()`,
    ) as (consoleObject: typeof sandboxConsole) => Promise<unknown>
    const returned = await execute(sandboxConsole)
    if (returned !== undefined) emitLog(runId, 'info', ['返回值:', returned])
    post({ type: 'done', runId, duration: Math.round(performance.now() - startedAt) })
  } catch (error) {
    post({
      type: 'error',
      runId,
      message: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })
  }
}

export {}
