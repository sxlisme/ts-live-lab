<script setup lang="ts">
import CodeEditor from '@/components/editor/CodeEditor.vue'
import OutputConsole from '@/components/editor/OutputConsole.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHeading from '@/components/ui/PageHeading.vue'
import { useAuth } from '@/composables/useAuth'
import { useClaudeConfig } from '@/composables/useClaudeConfig'
import { useCodeSnippets } from '@/composables/useCodeSnippets'
import { useCodeRunner } from '@/composables/useCodeRunner'
import { playgroundSamples } from '@/data/playgroundSamples'
import { suggestLocalSnippetName, validateSnippetDraft } from '@/domain/snippets/codeSnippets'
import { ApiClientError } from '@/services/api'
import { requestSnippetName } from '@/services/aiReview'
import type { RunnerLanguage } from '@/types/runner'
import { useDebounceFn, useLocalStorage } from '@vueuse/core'
import {
  BookmarkCheck,
  Library,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Square,
  X,
} from 'lucide-vue-next'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const initialSample = playgroundSamples[0]!
const route = useRoute()
const router = useRouter()
const code = useLocalStorage('typeroom:playground:code', initialSample.code)
const language = useLocalStorage<RunnerLanguage>(
  'typeroom:playground:language',
  initialSample.language,
)
const autoRun = useLocalStorage('typeroom:playground:auto-run', true)
const { status, logs, diagnostics, duration, isRunning, run, stop, clear } = useCodeRunner()
const { findSnippet, loadSnippet: requestSavedSnippet, saveSnippet } = useCodeSnippets()
const { user, loadSession, expireSession, openAuthDialog } = useAuth()
const { config: claudeConfig, canUseAi, loadServerStatus } = useClaudeConfig()
const activeSnippetId = ref('')
const saveDialogOpen = ref(false)
const snippetName = ref('')
const snippetNameInput = ref<HTMLInputElement | null>(null)
const saveError = ref('')
const namingWithAi = ref(false)
const savingSnippet = ref(false)
const saveNotice = ref('')
const resumeSaveAfterAuth = ref(false)
const pendingSnippetId = ref('')
let noticeTimeoutId: number | null = null

const activeSnippet = computed(() =>
  activeSnippetId.value ? findSnippet(activeSnippetId.value) : undefined,
)
const editingSavedSnippet = computed(() => Boolean(activeSnippetId.value))

function routeSnippetId(value: unknown) {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : ''
  return typeof value === 'string' ? value : ''
}

async function loadSavedSnippet(id: string) {
  pendingSnippetId.value = id
  await loadSession()
  if (!user.value) {
    openAuthDialog('login')
    return false
  }
  try {
    const snippet = await requestSavedSnippet(id)
    activeSnippetId.value = snippet.id
    code.value = snippet.code
    language.value = snippet.language
    pendingSnippetId.value = ''
    return true
  } catch {
    activeSnippetId.value = ''
    pendingSnippetId.value = ''
    return false
  }
}

function detachSnippet() {
  activeSnippetId.value = ''
  if (!route.query.snippet) return
  const query = { ...route.query }
  delete query.snippet
  void router.replace({ name: 'playground', query })
}

const initialSnippetId = routeSnippetId(route.query.snippet)

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
  detachSnippet()
  code.value = sample.code
  language.value = sample.language
}

function resetEditor() {
  detachSnippet()
  code.value = initialSample.code
  language.value = initialSample.language
}

function showSaveDialog() {
  snippetName.value =
    activeSnippet.value?.name ?? suggestLocalSnippetName(code.value, language.value)
  saveError.value = ''
  saveDialogOpen.value = true
  void nextTick(() => {
    snippetNameInput.value?.focus()
    snippetNameInput.value?.select()
  })
}

async function openSaveDialog() {
  await loadSession().catch(() => null)
  if (!user.value) {
    resumeSaveAfterAuth.value = true
    openAuthDialog('login')
    return
  }
  showSaveDialog()
}

function closeSaveDialog() {
  if (namingWithAi.value || savingSnippet.value) return
  saveDialogOpen.value = false
  saveError.value = ''
}

function showSaveNotice(text: string) {
  saveNotice.value = text
  if (noticeTimeoutId !== null) window.clearTimeout(noticeTimeoutId)
  noticeTimeoutId = window.setTimeout(() => {
    saveNotice.value = ''
    noticeTimeoutId = null
  }, 3_000)
}

async function persistSnippet() {
  saveError.value = ''
  savingSnippet.value = true
  try {
    const name = validateSnippetDraft(snippetName.value, code.value)
    const wasUpdate = editingSavedSnippet.value
    const saved = await saveSnippet(
      { name, language: language.value, code: code.value },
      activeSnippetId.value || undefined,
    )
    activeSnippetId.value = saved.id
    saveDialogOpen.value = false
    void router.replace({
      name: 'playground',
      query: { ...route.query, snippet: saved.id },
    })
    showSaveNotice(wasUpdate ? '片段已更新' : '片段已保存')
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      expireSession()
      saveError.value = '登录状态已过期，请重新登录后继续保存。'
      openAuthDialog('login')
      return
    }
    saveError.value = error instanceof Error ? error.message : '片段保存失败。'
  } finally {
    savingSnippet.value = false
  }
}

async function generateNameWithAi() {
  if (!canUseAi.value || !code.value.trim()) return
  namingWithAi.value = true
  saveError.value = ''
  try {
    snippetName.value = await requestSnippetName(
      { language: language.value, code: code.value.slice(0, 8_000) },
      claudeConfig.value,
    )
    await nextTick()
    snippetNameInput.value?.focus()
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'AI 命名失败，请稍后重试。'
  } finally {
    namingWithAi.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && saveDialogOpen.value) closeSaveDialog()
}

watch(
  () => route.query.snippet,
  (value) => {
    const id = routeSnippetId(value)
    if (!id) {
      activeSnippetId.value = ''
      return
    }
    void loadSavedSnippet(id)
  },
)

watch(user, (value) => {
  if (!value) return
  if (pendingSnippetId.value) void loadSavedSnippet(pendingSnippetId.value)
  if (resumeSaveAfterAuth.value) {
    resumeSaveAfterAuth.value = false
    showSaveDialog()
  }
})

onMounted(() => {
  execute()
  if (initialSnippetId) void loadSavedSnippet(initialSnippetId)
  else loadSession().catch(() => undefined)
  loadServerStatus().catch(() => undefined)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  if (noticeTimeoutId !== null) window.clearTimeout(noticeTimeoutId)
})
</script>

<template>
  <div class="playground-page">
    <PageHeading
      eyebrow="PLAYGROUND"
      title="TS / JS 运行台"
      description="草稿保存在当前浏览器；登录后可持久保存片段。运行任务超过 15 秒会被强制终止。"
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
          <span v-if="activeSnippet" class="active-snippet" :title="activeSnippet.name">
            <BookmarkCheck :size="14" />{{ activeSnippet.name }}
          </span>
        </div>

        <div class="toolbar-actions">
          <RouterLink
            class="toolbar-icon"
            to="/snippets"
            title="查看已保存片段"
            aria-label="查看已保存片段"
          >
            <Library :size="16" />
          </RouterLink>
          <button
            class="toolbar-icon"
            type="button"
            title="重置代码"
            aria-label="重置代码"
            @click="resetEditor"
          >
            <RotateCcw :size="16" />
          </button>
          <button class="save-snippet-button" type="button" @click="openSaveDialog">
            <Save :size="15" />{{ editingSavedSnippet ? '更新片段' : '保存片段' }}
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

    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="saveDialogOpen" class="dialog-backdrop" @mousedown.self="closeSaveDialog">
          <form
            class="snippet-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="snippet-dialog-title"
            @submit.prevent="persistSnippet"
          >
            <header>
              <div>
                <span>{{ editingSavedSnippet ? 'UPDATE SNIPPET' : 'NEW SNIPPET' }}</span>
                <h2 id="snippet-dialog-title">
                  {{ editingSavedSnippet ? '更新代码片段' : '保存代码片段' }}
                </h2>
              </div>
              <button
                type="button"
                title="关闭"
                aria-label="关闭保存对话框"
                :disabled="namingWithAi || savingSnippet"
                @click="closeSaveDialog"
              >
                <X :size="18" />
              </button>
            </header>

            <label for="snippet-name">片段名称</label>
            <div class="snippet-name-row">
              <input
                id="snippet-name"
                ref="snippetNameInput"
                v-model="snippetName"
                type="text"
                maxlength="80"
                autocomplete="off"
                placeholder="输入一个容易识别的名称"
              />
              <AppButton
                v-if="canUseAi"
                :icon="Sparkles"
                :loading="namingWithAi"
                :disabled="!code.trim()"
                @click="generateNameWithAi"
              >
                AI 命名
              </AppButton>
            </div>
            <p v-if="!canUseAi" class="ai-config-hint">
              <RouterLink to="/settings" @click="closeSaveDialog">配置 AI</RouterLink>
              后可根据代码内容自动命名
            </p>

            <div class="snippet-summary">
              <span>{{ language === 'typescript' ? 'TypeScript' : 'JavaScript' }}</span>
              <span>{{ code.length.toLocaleString('zh-CN') }} 个字符</span>
            </div>
            <p v-if="saveError" class="save-error" role="alert">{{ saveError }}</p>

            <footer>
              <AppButton :disabled="namingWithAi || savingSnippet" @click="closeSaveDialog">
                取消
              </AppButton>
              <AppButton variant="primary" type="submit" :icon="Save" :loading="savingSnippet">
                {{ editingSavedSnippet ? '保存更新' : '保存片段' }}
              </AppButton>
            </footer>
          </form>
        </div>
      </Transition>

      <Transition name="notice-fade">
        <div v-if="saveNotice" class="save-notice" role="status">
          <BookmarkCheck :size="17" />{{ saveNotice }}
        </div>
      </Transition>
    </Teleport>
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

.active-snippet {
  display: inline-flex;
  min-width: 0;
  max-width: 190px;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: var(--green-dark);
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-snippet svg {
  flex: 0 0 auto;
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
  text-decoration: none;
}

.toolbar-icon:hover {
  color: var(--ink);
  background: var(--surface-muted);
}

.save-snippet-button {
  display: inline-flex;
  height: 36px;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  color: var(--green-dark);
  background: #edf6f0;
  border: 1px solid #c7ddce;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.save-snippet-button:hover {
  background: #e1f0e6;
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

.dialog-backdrop {
  position: fixed;
  z-index: 100;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgb(8 14 10 / 55%);
}

.snippet-dialog {
  width: min(520px, 100%);
  padding: 24px;
  color: var(--ink);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 24px 70px rgb(8 18 12 / 25%);
}

.snippet-dialog header,
.snippet-dialog footer,
.snippet-name-row,
.snippet-summary,
.save-notice {
  display: flex;
  align-items: center;
}

.snippet-dialog header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 25px;
}

.snippet-dialog header span {
  color: var(--green);
  font:
    500 10px/1.4 'DM Mono',
    monospace;
}

.snippet-dialog h2 {
  margin: 3px 0 0;
  font-size: 20px;
  letter-spacing: 0;
}

.snippet-dialog header button {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  color: var(--ink-soft);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
}

.snippet-dialog header button:hover {
  color: var(--ink);
  background: var(--surface-muted);
}

.snippet-dialog > label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
}

.snippet-name-row {
  align-items: stretch;
  gap: 9px;
}

.snippet-name-row input {
  min-width: 0;
  height: 42px;
  flex: 1;
  padding: 0 12px;
  color: var(--ink);
  background: #ffffff;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  outline: 0;
}

.snippet-name-row input:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgb(29 107 79 / 12%);
}

.ai-config-hint {
  margin: 8px 0 0;
  color: var(--ink-soft);
  font-size: 12px;
}

.ai-config-hint a {
  color: var(--green-dark);
  font-weight: 700;
}

.snippet-summary {
  gap: 8px;
  margin-top: 18px;
  color: var(--ink-soft);
  font-size: 11px;
}

.snippet-summary span {
  padding: 5px 7px;
  background: var(--surface-muted);
  border-radius: 4px;
}

.save-error {
  margin: 13px 0 0;
  color: #a13d2c;
  font-size: 12px;
  line-height: 1.5;
}

.snippet-dialog footer {
  justify-content: flex-end;
  gap: 9px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.save-notice {
  position: fixed;
  z-index: 120;
  right: 24px;
  bottom: 24px;
  gap: 8px;
  padding: 12px 15px;
  color: #ffffff;
  background: var(--green-dark);
  border-radius: 6px;
  box-shadow: var(--shadow-md);
  font-size: 13px;
  font-weight: 700;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active,
.notice-fade-enter-active,
.notice-fade-leave-active {
  transition: opacity 150ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to,
.notice-fade-enter-from,
.notice-fade-leave-to {
  opacity: 0;
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

  .toolbar-actions {
    flex-wrap: wrap;
  }

  .active-snippet {
    display: none;
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

  .snippet-dialog {
    padding: 20px;
  }

  .snippet-name-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
