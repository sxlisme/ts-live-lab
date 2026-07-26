<script setup lang="ts">
import CodeEditor from '@/components/editor/CodeEditor.vue'
import OutputConsole from '@/components/editor/OutputConsole.vue'
import PageHeading from '@/components/ui/PageHeading.vue'
import { useCodeRunner } from '@/composables/useCodeRunner'
import { playgroundSamples } from '@/data/playgroundSamples'
import type { RunnerLanguage } from '@/types/runner'
import { useDebounceFn, useLocalStorage } from '@vueuse/core'
import { Play, RotateCcw, ShieldCheck, Square } from 'lucide-vue-next'
import { onMounted, watch } from 'vue'

const initialSample = playgroundSamples[0]!
const code = useLocalStorage('typeroom:playground:code', initialSample.code)
const language = useLocalStorage<RunnerLanguage>(
  'typeroom:playground:language',
  initialSample.language,
)
const autoRun = useLocalStorage('typeroom:playground:auto-run', true)
const { status, logs, diagnostics, duration, isRunning, run, stop, clear } = useCodeRunner()

function execute() {
  run(code.value, language.value)
}

const debouncedExecute = useDebounceFn(execute, 650)

watch([code, language], () => {
  if (autoRun.value) debouncedExecute()
})

function selectSample(event: Event) {
  const sample = playgroundSamples.find(
    (item) => item.id === (event.target as HTMLSelectElement).value,
  )
  if (!sample) return
  code.value = sample.code
  language.value = sample.language
}

function resetEditor() {
  code.value = initialSample.code
  language.value = initialSample.language
}

onMounted(execute)
</script>

<template>
  <div class="playground-page">
    <PageHeading
      eyebrow="PLAYGROUND"
      title="TS / JS 运行台"
      description="代码保存在当前浏览器。运行任务超过 2 秒会被强制终止。"
    >
      <template #actions>
        <span class="sandbox-badge"><ShieldCheck :size="15" /> 隔离执行</span>
        <label class="auto-run-control">
          <input v-model="autoRun" type="checkbox" />
          <span class="toggle-track"><span /></span>
          自动运行
        </label>
      </template>
    </PageHeading>

    <section class="workspace-panel panel">
      <header class="workspace-toolbar">
        <div class="toolbar-left">
          <div class="language-tabs" aria-label="运行语言">
            <button
              type="button"
              :class="{ active: language === 'typescript' }"
              @click="language = 'typescript'"
            >
              TypeScript
            </button>
            <button
              type="button"
              :class="{ active: language === 'javascript' }"
              @click="language = 'javascript'"
            >
              JavaScript
            </button>
          </div>
          <select class="sample-select" aria-label="选择示例" @change="selectSample">
            <option value="" selected disabled>载入示例</option>
            <option v-for="sample in playgroundSamples" :key="sample.id" :value="sample.id">
              {{ sample.label }}
            </option>
          </select>
        </div>

        <div class="toolbar-actions">
          <button
            class="toolbar-icon"
            type="button"
            title="重置代码"
            aria-label="重置代码"
            @click="resetEditor"
          >
            <RotateCcw :size="16" />
          </button>
          <button v-if="isRunning" class="run-button stop-button" type="button" @click="stop()">
            <Square :size="14" fill="currentColor" /> 停止
          </button>
          <button v-else class="run-button" type="button" @click="execute">
            <Play :size="15" fill="currentColor" /> 运行
            <kbd>⌘ ↵</kbd>
          </button>
        </div>
      </header>

      <div class="workspace-grid">
        <div class="editor-pane">
          <CodeEditor v-model="code" :language="language" @execute="execute" />
        </div>
        <OutputConsole
          :logs="logs"
          :diagnostics="diagnostics"
          :status="status"
          :duration="duration"
          @clear="clear"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.playground-page {
  width: min(1500px, 100%);
  margin: 0 auto;
}

.sandbox-badge,
.auto-run-control {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-soft);
  font-size: 12px;
  white-space: nowrap;
}

.sandbox-badge {
  height: 34px;
  padding: 0 10px;
  color: var(--green-dark);
  background: #e2f3ea;
  border: 1px solid #c2e0d0;
  border-radius: 5px;
  font-weight: 600;
}

.auto-run-control {
  cursor: pointer;
}

.auto-run-control input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.toggle-track {
  position: relative;
  width: 34px;
  height: 19px;
  background: #bdc7c0;
  border-radius: 10px;
  transition: 140ms ease;
}

.toggle-track span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 13px;
  height: 13px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgb(0 0 0 / 20%);
  transition: 140ms ease;
}

.auto-run-control input:checked + .toggle-track {
  background: var(--green);
}

.auto-run-control input:checked + .toggle-track span {
  transform: translateX(15px);
}

.workspace-panel {
  overflow: hidden;
}

.workspace-toolbar {
  display: flex;
  min-height: 58px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 9px 12px 9px 16px;
  border-bottom: 1px solid var(--line);
}

.toolbar-left,
.toolbar-actions,
.language-tabs {
  display: flex;
  align-items: center;
}

.toolbar-left,
.toolbar-actions {
  min-width: 0;
  gap: 10px;
}

.language-tabs {
  flex: 0 0 auto;
  padding: 3px;
  background: var(--surface-muted);
  border-radius: 6px;
}

.language-tabs button {
  min-height: 31px;
  padding: 0 11px;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.language-tabs button.active {
  color: var(--ink);
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(20 35 27 / 12%);
}

.sample-select {
  height: 37px;
  max-width: 150px;
  padding: 0 30px 0 10px;
  color: var(--ink-soft);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 5px;
  font-size: 12px;
}

.toolbar-icon {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 5px;
  cursor: pointer;
}

.toolbar-icon:hover {
  color: var(--ink);
  background: var(--surface-muted);
}

.run-button {
  display: inline-flex;
  min-width: 116px;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 11px;
  color: #ffffff;
  background: var(--green);
  border: 1px solid var(--green);
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.run-button:hover {
  background: var(--green-dark);
}

.run-button kbd {
  padding: 3px 5px;
  color: #d8eee3;
  background: rgb(0 0 0 / 16%);
  border-radius: 3px;
  font:
    500 9px/1 'DM Mono',
    monospace;
}

.stop-button {
  color: #9d3322;
  background: #fff3f0;
  border-color: #e8b6ac;
}

.stop-button:hover {
  background: #fee7e2;
}

.workspace-grid {
  display: grid;
  height: max(600px, calc(100vh - 220px));
  min-height: 600px;
  max-height: 850px;
  grid-template-columns: minmax(0, 3fr) minmax(330px, 2fr);
}

.editor-pane {
  min-width: 0;
  min-height: 0;
  background: #101713;
  border-right: 1px solid #2a352e;
}

@media (max-width: 1050px) {
  .workspace-grid {
    height: auto;
    max-height: none;
    grid-template-columns: 1fr;
    grid-template-rows: 520px 300px;
  }

  .editor-pane {
    border-right: 0;
    border-bottom: 1px solid #2a352e;
  }
}

@media (max-width: 600px) {
  .workspace-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-left,
  .toolbar-actions {
    justify-content: space-between;
  }

  .sample-select {
    flex: 1;
    max-width: none;
  }

  .workspace-grid {
    min-height: 0;
    grid-template-rows: 470px 280px;
  }

  .run-button {
    flex: 1;
  }
}
</style>
