<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import PageHeading from '@/components/ui/PageHeading.vue'
import { useClaudeConfig } from '@/composables/useClaudeConfig'
import { checkClaudeConnection } from '@/services/aiReview'
import type { ClaudeConfig } from '@/types/ai'
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Server,
  ShieldCheck,
  Trash2,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'

const { config, serverStatus, statusLoading, loadServerStatus, updateConfig, clearKey } =
  useClaudeConfig()

const form = reactive<ClaudeConfig>({ ...config.value })
const showKey = ref(false)
const checking = ref(false)
const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const baseUrlLocked = computed(() => Boolean(serverStatus.value && !serverStatus.value.allowClientBaseUrl))
const upstreamDisplay = computed(() => {
  try {
    const url = new URL(form.baseUrl)
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return '地址未配置'
  }
})

watch(config, (value) => Object.assign(form, value))

function save() {
  notice.value = null
  const model = form.model.trim()
  if (!model) {
    notice.value = { type: 'error', text: '模型 ID 不能为空。' }
    return
  }
  const hasControlCharacter = [...model].some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })
  if (model.length > 120 || hasControlCharacter) {
    notice.value = { type: 'error', text: '模型 ID 格式无效。' }
    return
  }
  let baseUrl = form.baseUrl.trim()
  if (!baseUrlLocked.value) {
    try {
      const parsed = new URL(baseUrl)
      if (parsed.protocol !== 'https:') throw new Error('上游地址必须使用 HTTPS。')
      if (parsed.username || parsed.password) throw new Error('上游地址不能包含用户名或密码。')
      if (parsed.search || parsed.hash) throw new Error('上游地址不能包含查询参数或片段。')
      baseUrl = parsed.toString().replace(/\/+$/, '')
    } catch (error) {
      notice.value = {
        type: 'error',
        text: error instanceof Error && error.message.startsWith('上游地址')
          ? error.message
          : '请输入完整的 HTTPS 上游地址。',
      }
      return
    }
  }
  updateConfig({ apiKey: form.apiKey.trim(), model, baseUrl })
  notice.value = { type: 'success', text: '配置已保存到当前浏览器会话。' }
}

async function testConnection() {
  save()
  if (notice.value?.type === 'error') return
  checking.value = true
  notice.value = null
  try {
    await checkClaudeConnection(config.value)
    notice.value = { type: 'success', text: 'AI 上游连接正常。' }
  } catch (error) {
    notice.value = {
      type: 'error',
      text: error instanceof Error ? error.message : '连接检查失败。',
    }
  } finally {
    checking.value = false
  }
}

function removeKey() {
  form.apiKey = ''
  clearKey()
  notice.value = { type: 'success', text: '临时密钥已从会话中移除。' }
}

onMounted(() => loadServerStatus().catch(() => undefined))
</script>

<template>
  <div class="settings-page">
    <PageHeading
      eyebrow="INTEGRATION"
      title="AI 提供商配置"
      description="配置 Anthropic 官方服务或兼容 Messages API 的第三方提供商。"
    />

    <div class="settings-layout">
      <section class="settings-form panel">
        <div class="section-heading">
          <span class="section-icon"><Bot :size="19" /></span>
          <div>
            <h2>连接设置</h2>
            <p>Anthropic Messages API 兼容</p>
          </div>
        </div>

        <div class="form-fields">
          <label class="field-label" for="claude-base-url">上游地址</label>
          <div class="field-control url-field">
            <Globe2 :size="17" />
            <input
              id="claude-base-url"
              v-model="form.baseUrl"
              type="url"
              :disabled="baseUrlLocked"
              maxlength="500"
              autocomplete="url"
              spellcheck="false"
              placeholder="https://api.anthropic.com"
            />
          </div>
          <p class="field-help">
            <template v-if="baseUrlLocked">当前部署由服务端锁定上游地址。</template>
            <template v-else>仅支持公开 HTTPS 地址，并使用 Anthropic Messages API 协议。</template>
          </p>

          <label class="field-label" for="claude-model">模型 ID</label>
          <div class="field-control">
            <input
              id="claude-model"
              v-model="form.model"
              type="text"
              maxlength="120"
              list="claude-models"
              autocomplete="off"
              placeholder="provider/model-name"
            />
            <datalist id="claude-models">
              <option value="claude-sonnet-4-20250514" />
              <option value="claude-opus-4-20250514" />
              <option value="claude-3-7-sonnet-20250219" />
            </datalist>
          </div>

          <label class="field-label" for="claude-key">临时 API Key</label>
          <div class="field-control key-field">
            <KeyRound :size="17" />
            <input
              id="claude-key"
              v-model="form.apiKey"
              :type="showKey ? 'text' : 'password'"
              :disabled="Boolean(serverStatus?.serverConfigured)"
              maxlength="300"
              autocomplete="off"
              placeholder="第三方或 Anthropic API Key"
            />
            <button
              type="button"
              :title="showKey ? '隐藏密钥' : '显示密钥'"
              :aria-label="showKey ? '隐藏密钥' : '显示密钥'"
              @click="showKey = !showKey"
            >
              <EyeOff v-if="showKey" :size="17" />
              <Eye v-else :size="17" />
            </button>
          </div>
          <p class="field-help">
            <template v-if="serverStatus?.serverConfigured"
              >已启用服务端密钥，无需在浏览器填写。</template
            >
            <template v-else-if="serverStatus?.allowClientKey"
              >仅保存在 sessionStorage，关闭标签页后自动清除。</template
            >
            <template v-else>当前部署不接受浏览器密钥，请联系管理员配置服务端环境变量。</template>
          </p>
        </div>

        <div v-if="notice" class="form-notice" :class="notice.type">
          <CheckCircle2 v-if="notice.type === 'success'" :size="16" />
          <span>{{ notice.text }}</span>
        </div>

        <div class="form-actions">
          <AppButton variant="primary" @click="save">保存配置</AppButton>
          <AppButton :loading="checking" @click="testConnection">测试连接</AppButton>
          <button
            v-if="form.apiKey"
            class="remove-key"
            type="button"
            title="移除临时密钥"
            aria-label="移除临时密钥"
            @click="removeKey"
          >
            <Trash2 :size="17" />
          </button>
        </div>
      </section>

      <aside class="settings-aside">
        <section class="status-panel panel">
          <div class="status-heading">
            <Server :size="18" />
            <h2>服务状态</h2>
          </div>
          <div class="status-row">
            <span>API 代理</span>
            <strong :class="statusLoading ? 'pending' : 'online'">
              {{ statusLoading ? '检查中' : serverStatus ? '在线' : '离线' }}
            </strong>
          </div>
          <div class="status-row">
            <span>密钥来源</span>
            <strong>{{ serverStatus?.serverConfigured ? '服务端' : '浏览器会话' }}</strong>
          </div>
          <div class="status-row">
            <span>上游地址</span>
            <strong :title="form.baseUrl">{{ upstreamDisplay }}</strong>
          </div>
        </section>

        <section class="security-note">
          <ShieldCheck :size="20" />
          <div>
            <h2>密钥边界</h2>
            <p>服务端密钥始终使用管理员地址；自定义上游只与当前浏览器提供的密钥配套使用。</p>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              管理 Anthropic 密钥 <ExternalLink :size="13" />
            </a>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.settings-layout {
  display: grid;
  align-items: start;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 22px;
}

.settings-form {
  padding: 26px;
}

.section-heading,
.status-heading,
.security-note,
.form-actions,
.form-notice {
  display: flex;
  align-items: center;
}

.section-heading {
  gap: 12px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.section-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  color: var(--green-dark);
  background: #dff1e7;
  border-radius: 6px;
}

h2,
p {
  margin: 0;
}

.section-heading h2,
.status-heading h2,
.security-note h2 {
  font-size: 15px;
  line-height: 1.3;
}

.section-heading p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 12px;
}

.form-fields {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px 16px;
  padding: 28px 0 22px;
}

.field-label {
  padding-top: 10px;
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
}

.field-control {
  position: relative;
  min-width: 0;
}

.field-control input {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  color: var(--ink);
  background: #fbfcfa;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font:
    400 13px/1 'DM Mono',
    monospace;
}

.field-control input:disabled {
  color: #849087;
  background: var(--surface-muted);
}

.key-field > svg,
.url-field > svg {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  color: #78867d;
}

.key-field input,
.url-field input {
  padding: 0 42px 0 39px;
}

.key-field button {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  place-items: center;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.key-field button:hover {
  background: var(--surface-muted);
}

.field-help {
  grid-column: 2;
  margin-top: -4px;
  color: var(--ink-soft);
  font-size: 11px;
  line-height: 1.6;
}

.form-notice {
  gap: 8px;
  margin-bottom: 18px;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 5px;
  font-size: 12px;
}

.form-notice.success {
  color: var(--green-dark);
  background: #e5f4eb;
  border-color: #bedfcb;
}

.form-notice.error {
  color: #9d3322;
  background: #fff0ed;
  border-color: #e8b6ac;
}

.form-actions {
  justify-content: flex-end;
  gap: 8px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.remove-key {
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  place-items: center;
  color: #a54131;
  background: transparent;
  border: 1px solid #e7bcb4;
  border-radius: 6px;
  cursor: pointer;
}

.settings-aside {
  display: grid;
  gap: 18px;
}

.status-panel {
  padding: 20px;
}

.status-heading {
  gap: 9px;
  margin-bottom: 18px;
}

.status-heading svg {
  color: var(--green);
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-top: 1px solid var(--line);
  font-size: 12px;
}

.status-row span {
  color: var(--ink-soft);
}

.status-row strong {
  min-width: 0;
  overflow: hidden;
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-row strong.online {
  color: var(--green);
}

.status-row strong.pending {
  color: #9a6a18;
}

.security-note {
  align-items: flex-start;
  gap: 12px;
  padding: 4px 2px;
}

.security-note > svg {
  flex: 0 0 auto;
  color: var(--green);
}

.security-note p {
  margin-top: 7px;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.7;
}

.security-note a {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 10px;
  color: var(--green-dark);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 950px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }

  .settings-aside {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .settings-form {
    padding: 20px 16px;
  }

  .form-fields {
    grid-template-columns: 1fr;
  }

  .field-label {
    padding: 0;
  }

  .field-help {
    grid-column: 1;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .remove-key {
    width: 100%;
  }

  .settings-aside {
    grid-template-columns: 1fr;
  }
}
</style>
