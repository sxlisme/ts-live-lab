<script setup lang="ts">
import PageHeading from '@/components/ui/PageHeading.vue'
import { useAuth } from '@/composables/useAuth'
import { useCodeSnippets } from '@/composables/useCodeSnippets'
import type { CodeSnippet } from '@/types/snippet'
import { ArrowUpRight, FileCode2, LogIn, Plus, RefreshCw, Search, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const { user, sessionLoading, loadSession, openAuthDialog } = useAuth()
const { snippets, loading, loaded, error, loadSnippets, deleteSnippet } = useCodeSnippets()
const search = ref('')
const actionError = ref('')
const deletingId = ref('')
const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const filteredSnippets = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  if (!keyword) return snippets.value
  return snippets.value.filter((snippet) =>
    `${snippet.name}\n${snippet.code}`.toLowerCase().includes(keyword),
  )
})

const pageLoading = computed(
  () => sessionLoading.value || Boolean(user.value && loading.value && !loaded.value),
)

function formatDate(timestamp: string) {
  return dateFormatter.format(new Date(timestamp))
}

function previewCode(code: string) {
  return code.split(/\r?\n/).slice(0, 4).join('\n')
}

async function removeSnippet(snippet: CodeSnippet) {
  if (!window.confirm(`确定删除“${snippet.name}”吗？此操作无法撤销。`)) return
  deletingId.value = snippet.id
  actionError.value = ''
  try {
    await deleteSnippet(snippet.id)
  } catch (requestError) {
    actionError.value = requestError instanceof Error ? requestError.message : '删除失败。'
  } finally {
    deletingId.value = ''
  }
}

function retrySnippets() {
  loadSnippets(true).catch(() => undefined)
}

onMounted(() => loadSession().catch(() => undefined))
</script>

<template>
  <div class="snippets-page">
    <PageHeading
      eyebrow="CODE LIBRARY"
      title="代码片段"
      :description="
        user ? `已持久保存 ${snippets.length} 个片段。` : '登录后跨设备持久保存和管理代码片段。'
      "
    >
      <template #actions>
        <RouterLink class="new-snippet-link" to="/"> <Plus :size="16" />新建片段 </RouterLink>
      </template>
    </PageHeading>

    <section v-if="pageLoading" class="library-state panel" aria-live="polite">
      <span class="state-spinner" />
      <strong>正在加载代码片段</strong>
    </section>

    <section v-else-if="!user" class="auth-required panel">
      <span><LogIn :size="24" /></span>
      <h2>登录后查看代码片段</h2>
      <p>运行、预览、题库和文档无需登录；只有持久保存和管理片段需要账号。</p>
      <button type="button" @click="openAuthDialog('login')"><LogIn :size="16" />登录或注册</button>
    </section>

    <section v-else-if="error" class="library-state error-state panel">
      <strong>片段加载失败</strong>
      <span>{{ error }}</span>
      <button type="button" @click="retrySnippets"><RefreshCw :size="15" />重新加载</button>
    </section>

    <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>

    <section v-if="user && snippets.length" class="snippet-library panel">
      <header class="library-toolbar">
        <div>
          <strong>片段列表</strong>
          <span>{{ filteredSnippets.length }} / {{ snippets.length }}</span>
        </div>
        <label class="snippet-search">
          <Search :size="16" />
          <input v-model="search" type="search" placeholder="搜索名称或代码" />
        </label>
      </header>

      <div v-if="filteredSnippets.length" class="snippet-list">
        <article v-for="snippet in filteredSnippets" :key="snippet.id" class="snippet-row">
          <RouterLink
            class="snippet-content"
            :to="{ name: 'playground', query: { snippet: snippet.id } }"
          >
            <div class="snippet-title-row">
              <span class="snippet-icon"><FileCode2 :size="17" /></span>
              <div>
                <h2>{{ snippet.name }}</h2>
                <div class="snippet-meta">
                  <span class="language-label" :class="snippet.language">
                    {{ snippet.language === 'typescript' ? 'TypeScript' : 'JavaScript' }}
                  </span>
                  <span>创建于 {{ formatDate(snippet.createdAt) }}</span>
                  <span v-if="snippet.updatedAt !== snippet.createdAt">
                    更新于 {{ formatDate(snippet.updatedAt) }}
                  </span>
                </div>
              </div>
            </div>
            <pre><code>{{ previewCode(snippet.code) }}</code></pre>
            <span class="open-snippet">查看并编辑 <ArrowUpRight :size="14" /></span>
          </RouterLink>
          <button
            class="delete-snippet"
            type="button"
            :title="`删除 ${snippet.name}`"
            :aria-label="`删除 ${snippet.name}`"
            :disabled="deletingId === snippet.id"
            @click="removeSnippet(snippet)"
          >
            <Trash2 :size="17" />
          </button>
        </article>
      </div>

      <div v-else class="no-search-results">
        <Search :size="20" />
        <strong>没有匹配的片段</strong>
        <span>换一个名称或代码关键词试试</span>
      </div>
    </section>

    <section v-else-if="user && !error && !pageLoading" class="empty-library panel">
      <span><FileCode2 :size="25" /></span>
      <h2>还没有保存代码片段</h2>
      <p>在运行台完成代码后保存，之后可以从这里继续查看和编辑。</p>
      <RouterLink to="/"><Plus :size="16" />打开运行台</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.snippets-page {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.new-snippet-link,
.empty-library a,
.auth-required button,
.library-state button {
  display: inline-flex;
  height: 38px;
  align-items: center;
  gap: 7px;
  padding: 0 13px;
  color: #ffffff;
  background: var(--green);
  border: 1px solid var(--green);
  border-radius: 5px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.new-snippet-link:hover,
.empty-library a:hover,
.auth-required button:hover,
.library-state button:hover {
  background: var(--green-dark);
}

.snippet-library {
  overflow: hidden;
}

.library-toolbar,
.library-toolbar > div,
.snippet-search,
.snippet-title-row,
.snippet-meta,
.open-snippet {
  display: flex;
  align-items: center;
}

.library-toolbar {
  min-height: 64px;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 16px 11px 20px;
  border-bottom: 1px solid var(--line);
}

.library-toolbar > div {
  gap: 9px;
}

.library-toolbar strong {
  font-size: 14px;
}

.library-toolbar > div span {
  color: var(--ink-soft);
  font:
    500 10px/1 'DM Mono',
    monospace;
}

.snippet-search {
  width: min(280px, 100%);
  height: 38px;
  gap: 8px;
  padding: 0 10px;
  color: var(--ink-soft);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 5px;
}

.snippet-search input {
  min-width: 0;
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 12px;
}

.snippet-list {
  display: grid;
}

.snippet-row {
  position: relative;
  min-width: 0;
  border-bottom: 1px solid var(--line);
}

.snippet-row:last-child {
  border-bottom: 0;
}

.snippet-content {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(250px, 0.9fr) minmax(260px, 1.1fr) 100px;
  align-items: center;
  gap: 22px;
  padding: 17px 62px 17px 20px;
  color: inherit;
  text-decoration: none;
  transition: background 140ms ease;
}

.snippet-content:hover {
  background: #f4f7f4;
}

.snippet-title-row {
  min-width: 0;
  align-items: flex-start;
  gap: 11px;
}

.snippet-title-row > div {
  min-width: 0;
}

.snippet-icon {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  color: var(--green-dark);
  background: #e1f0e7;
  border-radius: 5px;
}

.snippet-title-row h2 {
  margin: 0;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.4;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-meta {
  flex-wrap: wrap;
  gap: 5px 9px;
  margin-top: 7px;
  color: #75837a;
  font-size: 10px;
}

.language-label {
  padding: 3px 5px;
  color: #6c5316;
  background: #f5ebce;
  border-radius: 3px;
  font:
    600 9px/1 'DM Mono',
    monospace;
}

.language-label.javascript {
  color: #8b4738;
  background: #f7e3dd;
}

.snippet-content pre {
  min-width: 0;
  max-height: 66px;
  margin: 0;
  padding: 9px 11px;
  overflow: hidden;
  color: #cad8cf;
  background: #121a15;
  border: 1px solid #26332b;
  border-radius: 5px;
  font:
    500 10px/1.55 'DM Mono',
    monospace;
  white-space: pre-wrap;
}

.open-snippet {
  justify-content: flex-end;
  gap: 5px;
  color: var(--green-dark);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.delete-snippet {
  position: absolute;
  top: 50%;
  right: 16px;
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  place-items: center;
  color: #8b6c65;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  transform: translateY(-50%);
}

.delete-snippet:hover {
  color: #a13d2c;
  background: #fff1ee;
  border-color: #edcbc3;
}

.delete-snippet:disabled {
  opacity: 0.45;
  cursor: wait;
}

.empty-library,
.no-search-results,
.auth-required,
.library-state {
  display: grid;
  place-items: center;
  text-align: center;
}

.empty-library {
  min-height: 380px;
  padding: 48px 20px;
}

.auth-required,
.library-state {
  min-height: 340px;
  align-content: center;
  padding: 42px 20px;
}

.auth-required > span {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  color: var(--green-dark);
  background: #e2f1e8;
  border-radius: 7px;
}

.auth-required h2 {
  margin: 17px 0 0;
  font-size: 18px;
  letter-spacing: 0;
}

.auth-required p {
  max-width: 480px;
  margin: 8px 0 22px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.65;
}

.library-state {
  gap: 9px;
  color: var(--ink-soft);
  font-size: 12px;
}

.library-state strong {
  color: var(--ink);
  font-size: 15px;
}

.state-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #b9c7be;
  border-right-color: var(--green);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.error-state button {
  margin-top: 10px;
}

.action-error {
  margin: -12px 0 14px;
  padding: 10px 12px;
  color: #9d3b2b;
  background: #fff1ee;
  border: 1px solid #edcbc3;
  border-radius: 5px;
  font-size: 12px;
}

.empty-library > span {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  color: var(--green-dark);
  background: #e2f1e8;
  border-radius: 7px;
}

.empty-library h2 {
  margin: 18px 0 0;
  font-size: 18px;
  letter-spacing: 0;
}

.empty-library p {
  max-width: 420px;
  margin: 8px 0 22px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.65;
}

.no-search-results {
  min-height: 250px;
  align-content: center;
  gap: 7px;
  color: var(--ink-soft);
}

.no-search-results strong {
  color: var(--ink);
  font-size: 14px;
}

.no-search-results span {
  font-size: 12px;
}

@media (max-width: 900px) {
  .snippet-content {
    grid-template-columns: minmax(0, 1fr) 90px;
  }

  .snippet-content pre {
    display: none;
  }
}

@media (max-width: 600px) {
  .library-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .snippet-search {
    width: 100%;
  }

  .snippet-content {
    grid-template-columns: 1fr;
    gap: 10px;
    padding-right: 60px;
  }

  .open-snippet {
    justify-content: flex-start;
    padding-left: 45px;
  }
}
</style>
