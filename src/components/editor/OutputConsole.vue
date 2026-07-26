<script setup lang="ts">
import type { ConsoleEntry, RunnerStatus } from '@/types/runner'
import { CircleAlert, CircleCheck, Clock3, TerminalSquare, Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  logs: ConsoleEntry[]
  diagnostics: string[]
  status: RunnerStatus
  duration: number | null
}>()

defineEmits<{ clear: [] }>()

const statusText = computed(() => {
  const labels: Record<RunnerStatus, string> = {
    idle: '等待运行',
    compiling: '正在编译',
    running: '正在执行',
    success: '执行完成',
    error: '执行失败',
    timeout: '已超时终止',
    stopped: '已手动停止',
  }
  return labels[props.status]
})
</script>

<template>
  <section class="output-console" aria-live="polite">
    <header class="console-header">
      <div class="console-title">
        <TerminalSquare :size="16" />
        <span>控制台</span>
        <span class="console-count">{{ logs.length }}</span>
      </div>
      <div class="console-actions">
        <span class="run-state" :class="`state-${status}`">
          <Clock3 v-if="status === 'compiling' || status === 'running'" :size="13" />
          <CircleCheck v-else-if="status === 'success'" :size="13" />
          <CircleAlert v-else-if="status === 'error' || status === 'timeout'" :size="13" />
          {{ statusText }}<template v-if="duration !== null"> · {{ duration }}ms</template>
        </span>
        <button
          class="console-clear"
          type="button"
          title="清空输出"
          aria-label="清空输出"
          @click="$emit('clear')"
        >
          <Trash2 :size="15" />
        </button>
      </div>
    </header>

    <div class="console-body">
      <div v-if="diagnostics.length" class="diagnostics">
        <div v-for="(item, index) in diagnostics" :key="`${item}-${index}`" class="diagnostic-item">
          <CircleAlert :size="15" />
          <pre>{{ item }}</pre>
        </div>
      </div>

      <div
        v-for="entry in logs"
        :key="entry.id"
        class="console-line"
        :class="`line-${entry.level}`"
      >
        <span class="line-marker" />
        <pre>{{ entry.text }}</pre>
      </div>

      <div v-if="!logs.length && !diagnostics.length" class="console-empty">
        <TerminalSquare :size="24" />
        <span>运行代码后，输出会出现在这里</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.output-console {
  display: grid;
  min-height: 0;
  grid-template-rows: 47px minmax(0, 1fr);
  color: #dce6df;
  background: #131915;
}

.console-header,
.console-title,
.console-actions,
.run-state {
  display: flex;
  align-items: center;
}

.console-header {
  justify-content: space-between;
  gap: 10px;
  padding: 0 14px 0 16px;
  border-bottom: 1px solid #29332d;
}

.console-title {
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.console-title svg {
  color: #9fe3c2;
}

.console-count {
  min-width: 20px;
  padding: 2px 5px;
  color: #9cacaa;
  background: #252e29;
  border-radius: 4px;
  font:
    500 10px/1.4 'DM Mono',
    monospace;
  text-align: center;
}

.console-actions {
  min-width: 0;
  gap: 8px;
}

.run-state {
  min-width: 0;
  gap: 5px;
  color: #9cacaa;
  font-size: 11px;
  white-space: nowrap;
}

.state-success {
  color: #9fe3c2;
}

.state-error,
.state-timeout {
  color: #ef9a87;
}

.console-clear {
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  color: #86968c;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
}

.console-clear:hover {
  color: #ffffff;
  background: #242d28;
  border-color: #334139;
}

.console-body {
  min-height: 0;
  padding: 10px 0 28px;
  overflow: auto;
}

.console-line,
.diagnostic-item {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 8px;
  padding: 6px 16px;
}

.console-line pre,
.diagnostic-item pre {
  margin: 0;
  overflow-wrap: anywhere;
  color: inherit;
  font:
    400 12px/1.6 'DM Mono',
    monospace;
  white-space: pre-wrap;
}

.line-marker {
  width: 5px;
  height: 5px;
  margin-top: 7px;
  background: #65736a;
  border-radius: 50%;
}

.line-info {
  color: #9cc9ed;
}

.line-warn {
  color: #e7c477;
}

.line-error,
.diagnostics {
  color: #ef9a87;
}

.line-info .line-marker {
  background: #65a2d0;
}

.line-warn .line-marker {
  background: #d9a83c;
}

.line-error .line-marker {
  background: #d9684f;
}

.diagnostics {
  margin-bottom: 8px;
  background: rgb(217 104 79 / 8%);
  border-top: 1px solid rgb(217 104 79 / 16%);
  border-bottom: 1px solid rgb(217 104 79 / 16%);
}

.diagnostic-item {
  grid-template-columns: 18px minmax(0, 1fr);
}

.diagnostic-item svg {
  margin-top: 2px;
}

.console-empty {
  display: grid;
  min-height: 130px;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: #647269;
  font-size: 12px;
}

@media (max-width: 520px) {
  .run-state {
    max-width: 112px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
