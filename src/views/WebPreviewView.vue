<script setup lang="ts">
import CodeEditor from '@/components/editor/CodeEditor.vue'
import PreviewFrame from '@/components/preview/PreviewFrame.vue'
import PageHeading from '@/components/ui/PageHeading.vue'
import { buildPreviewDocument } from '@/domain/preview/buildPreviewDocument'
import { defaultWebPreview } from '@/data/webPreviewSample'
import type { EditorLanguage } from '@/types/runner'
import type { PreviewConsoleEntry, PreviewMessage, PreviewSource } from '@/types/preview'
import { useDebounceFn, useLocalStorage } from '@vueuse/core'
import {
  Braces,
  CodeXml,
  Expand,
  Maximize2,
  Monitor,
  Paintbrush,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'

type EditorTab = keyof PreviewSource
type PreviewViewport = 'desktop' | 'mobile'

const source = useLocalStorage<PreviewSource>('typeroom:web-preview:source', {
  ...defaultWebPreview,
})
const autoPreview = useLocalStorage('typeroom:web-preview:auto', true)
const activeTab = ref<EditorTab>('html')
const viewport = ref<PreviewViewport>('desktop')
const previewId = ref('')
const sourceDocument = ref('')
const previewStatus = ref<'loading' | 'ready' | 'timeout' | 'error'>('loading')
const logs = ref<PreviewConsoleEntry[]>([])
const previewShell = ref<HTMLElement | null>(null)
let logId = 0

const tabs: Array<{
  id: EditorTab
  label: string
  language: EditorLanguage
  icon: typeof CodeXml
}> = [
  { id: 'html', label: 'HTML', language: 'html', icon: CodeXml },
  { id: 'css', label: 'CSS', language: 'css', icon: Paintbrush },
  { id: 'javascript', label: 'JavaScript', language: 'javascript', icon: Braces },
]

const currentLanguage = computed(
  () => tabs.find((tab) => tab.id === activeTab.value)?.language ?? 'html',
)
const statusText = computed(() => {
  const labels = { loading: '正在渲染', ready: '预览就绪', timeout: '已终止', error: '运行错误' }
  return labels[previewStatus.value]
})

function renderPreview() {
  try {
    previewId.value = crypto.randomUUID()
    previewStatus.value = 'loading'
    logs.value = []
    sourceDocument.value = buildPreviewDocument(source.value, previewId.value)
  } catch (error) {
    previewStatus.value = 'error'
    logs.value = []
    pushLog('error', error instanceof Error ? error.message : 'JavaScript 解析失败。')
  }
}

const debouncedRender = useDebounceFn(renderPreview, 550)

watch(
  source,
  () => {
    if (autoPreview.value) debouncedRender()
  },
  { deep: true },
)

watch(autoPreview, (enabled) => {
  if (enabled) renderPreview()
})

function handlePreviewMessage(message: PreviewMessage) {
  if (message.type === 'ready') previewStatus.value = 'ready'
  if (message.type === 'error') {
    previewStatus.value = 'error'
    pushLog('error', message.text ?? '预览运行错误')
  }
  if (message.type === 'console') {
    if (message.level === 'error') previewStatus.value = 'error'
    pushLog(message.level ?? 'log', message.text ?? '')
  }
}

function pushLog(level: PreviewConsoleEntry['level'], text: string) {
  if (logs.value.length >= 100) return
  logs.value.push({ id: ++logId, level, text })
}

function handleTimeout() {
  previewStatus.value = 'timeout'
  pushLog('error', '预览脚本超过 2 秒未响应，iframe 已被销毁。请检查死循环。')
}

function resetSource() {
  if (!window.confirm('确定恢复 Web 预览的默认示例吗？')) return
  source.value = { ...defaultWebPreview }
  renderPreview()
}

async function enterFullscreen() {
  await previewShell.value?.requestFullscreen?.()
}

onMounted(renderPreview)
</script>

<template>
  <div class="web-preview-page">
    <PageHeading
      eyebrow="WEB SANDBOX"
      title="HTML / CSS / JS 快速预览"
      description="草稿保存在当前浏览器，预览环境禁止网络与父页面访问。"
    >
      <template #actions>
        <span class="preview-security"><ShieldCheck :size="15" /> 隔离预览</span>
        <label class="auto-preview-control">
          <input v-model="autoPreview" type="checkbox" />
          <span class="toggle-track"><span /></span>
          自动刷新
        </label>
      </template>
    </PageHeading>

    <section class="web-workspace panel">
      <div class="web-editor-column">
        <header class="web-editor-toolbar">
          <div class="web-tabs" role="tablist" aria-label="Web 文件">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              role="tab"
              :aria-selected="activeTab === tab.id"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" :size="15" />{{ tab.label }}
            </button>
          </div>
          <button
            class="tool-icon"
            type="button"
            title="恢复示例"
            aria-label="恢复示例"
            @click="resetSource"
          >
            <RotateCcw :size="16" />
          </button>
        </header>
        <div class="web-code-editor">
          <CodeEditor
            v-model="source[activeTab]"
            :language="currentLanguage"
            @execute="renderPreview"
          />
        </div>
      </div>

      <div class="preview-column">
        <header class="preview-toolbar">
          <div class="preview-state" :class="`state-${previewStatus}`">
            <span />{{ statusText }}
          </div>
          <div class="preview-tools">
            <div class="viewport-switcher" aria-label="预览尺寸">
              <button
                type="button"
                title="桌面预览"
                aria-label="桌面预览"
                :class="{ active: viewport === 'desktop' }"
                @click="viewport = 'desktop'"
              >
                <Monitor :size="15" />
              </button>
              <button
                type="button"
                title="移动预览"
                aria-label="移动预览"
                :class="{ active: viewport === 'mobile' }"
                @click="viewport = 'mobile'"
              >
                <Smartphone :size="15" />
              </button>
            </div>
            <button
              class="tool-icon"
              type="button"
              title="全屏预览"
              aria-label="全屏预览"
              @click="enterFullscreen"
            >
              <Maximize2 :size="16" />
            </button>
            <button class="refresh-button" type="button" @click="renderPreview">
              <RefreshCw :size="15" />刷新预览
            </button>
          </div>
        </header>

        <div ref="previewShell" class="preview-shell" :class="`viewport-${viewport}`">
          <div class="preview-device">
            <PreviewFrame
              :source-document="sourceDocument"
              :preview-id="previewId"
              @message="handlePreviewMessage"
              @timeout="handleTimeout"
            />
          </div>
        </div>

        <section class="preview-console">
          <header>
            <span
              ><Expand :size="14" /> 控制台 <b>{{ logs.length }}</b></span
            >
            <button type="button" title="清空控制台" aria-label="清空控制台" @click="logs = []">
              <Trash2 :size="14" />
            </button>
          </header>
          <div class="preview-console-body">
            <p v-if="!logs.length">暂无输出</p>
            <pre v-for="entry in logs" :key="entry.id" :class="`log-${entry.level}`">{{
              entry.text
            }}</pre>
          </div>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.web-preview-page {
  width: min(1520px, 100%);
  margin: 0 auto;
}

.preview-security,
.auto-preview-control {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--ink-soft);
  font-size: 12px;
  white-space: nowrap;
}

.preview-security {
  height: 34px;
  padding: 0 10px;
  color: var(--green-dark);
  background: #e2f3ea;
  border: 1px solid #c2e0d0;
  border-radius: 5px;
  font-weight: 600;
}

.auto-preview-control {
  cursor: pointer;
}

.auto-preview-control input {
  position: absolute;
  opacity: 0;
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

.auto-preview-control input:checked + .toggle-track {
  background: var(--green);
}

.auto-preview-control input:checked + .toggle-track span {
  transform: translateX(15px);
}

.web-workspace {
  display: grid;
  min-height: 680px;
  overflow: hidden;
  grid-template-columns: minmax(430px, 1fr) minmax(500px, 1.15fr);
}

.web-editor-column,
.preview-column {
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 52px minmax(0, 1fr);
}

.web-editor-column {
  background: #101713;
  border-right: 1px solid #2b362f;
}

.web-editor-toolbar,
.preview-toolbar,
.preview-tools,
.web-tabs,
.viewport-switcher,
.preview-state {
  display: flex;
  align-items: center;
}

.web-editor-toolbar,
.preview-toolbar {
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px 0 12px;
}

.web-editor-toolbar {
  border-bottom: 1px solid #2b362f;
}

.web-tabs {
  min-width: 0;
  gap: 3px;
}

.web-tabs button {
  display: inline-flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: #89988e;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
}

.web-tabs button:hover,
.web-tabs button.active {
  color: #edf4ef;
  background: #222d27;
  border-color: #334139;
}

.web-tabs button.active svg {
  color: var(--mint);
}

.tool-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  padding: 0;
  place-items: center;
  color: #7b8980;
  background: transparent;
  border: 1px solid #d0d8d2;
  border-radius: 5px;
  cursor: pointer;
}

.web-editor-toolbar .tool-icon {
  border-color: #334139;
}

.tool-icon:hover {
  color: var(--ink);
  background: #edf0ec;
}

.web-editor-toolbar .tool-icon:hover {
  color: #ffffff;
  background: #27332c;
}

.web-code-editor {
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.preview-column {
  grid-template-rows: 52px minmax(420px, 1fr) 150px;
  background: #e5eae5;
}

.preview-toolbar {
  background: #ffffff;
  border-bottom: 1px solid var(--line);
}

.preview-state {
  gap: 7px;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 600;
}

.preview-state > span {
  width: 7px;
  height: 7px;
  background: var(--amber);
  border-radius: 50%;
}

.state-ready > span {
  background: var(--green);
}

.state-timeout > span,
.state-error > span {
  background: var(--coral);
}

.preview-tools {
  gap: 7px;
}

.viewport-switcher {
  padding: 2px;
  background: var(--surface-muted);
  border-radius: 5px;
}

.viewport-switcher button {
  display: grid;
  width: 30px;
  height: 29px;
  padding: 0;
  place-items: center;
  color: #738178;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.viewport-switcher button.active {
  color: var(--green-dark);
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.refresh-button {
  display: inline-flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  color: #ffffff;
  background: var(--green);
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
}

.preview-shell {
  display: grid;
  min-height: 0;
  padding: 16px;
  place-items: center;
  overflow: auto;
  background: #e5eae5;
}

.preview-shell:fullscreen {
  padding: 24px;
  background: #dfe5df;
}

.preview-device {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #c7d0c9;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgb(23 32 27 / 8%);
  transition: width 180ms ease;
}

.viewport-mobile .preview-device {
  width: min(390px, 100%);
}

.preview-console {
  display: grid;
  min-height: 0;
  grid-template-rows: 37px minmax(0, 1fr);
  color: #dbe5de;
  background: #131a16;
  border-top: 1px solid #2c3730;
}

.preview-console header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 13px;
  border-bottom: 1px solid #2c3730;
}

.preview-console header span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
}

.preview-console header b {
  padding: 2px 5px;
  color: #91a197;
  background: #28322c;
  border-radius: 3px;
  font:
    500 9px/1 'DM Mono',
    monospace;
}

.preview-console header button {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  place-items: center;
  color: #839188;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.preview-console-body {
  min-height: 0;
  padding: 8px 13px 18px;
  overflow: auto;
}

.preview-console-body p {
  margin: 4px 0;
  color: #64736a;
  font-size: 10px;
}

.preview-console-body pre {
  margin: 0;
  padding: 4px 0;
  overflow-wrap: anywhere;
  color: #cdd8d0;
  font:
    400 10px/1.5 'DM Mono',
    monospace;
  white-space: pre-wrap;
}

.preview-console-body .log-warn {
  color: #dfbf72;
}

.preview-console-body .log-error {
  color: #e7917f;
}

.preview-console-body .log-info {
  color: #9fcbb4;
}

@media (max-width: 1100px) {
  .web-workspace {
    grid-template-columns: 1fr;
  }

  .web-editor-column {
    min-height: 520px;
    border-right: 0;
    border-bottom: 1px solid #2b362f;
  }

  .preview-column {
    min-height: 640px;
  }
}

@media (max-width: 560px) {
  .web-tabs button {
    padding: 0 8px;
  }

  .preview-toolbar {
    align-items: flex-start;
    height: auto;
    flex-direction: column;
    padding: 9px 10px;
  }

  .preview-tools {
    width: 100%;
  }

  .refresh-button {
    flex: 1;
    justify-content: center;
  }

  .preview-column {
    min-height: 670px;
    grid-template-rows: 90px minmax(420px, 1fr) 150px;
  }

  .preview-shell {
    padding: 10px;
  }
}
</style>
