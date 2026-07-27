<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue'
import { useAuth } from '@/composables/useAuth'
import type { AuthDialogMode } from '@/types/auth'
import { LockKeyhole, LogIn, UserPlus, X } from 'lucide-vue-next'
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const { dialogOpen, dialogMode, login, register, closeAuthDialog } = useAuth()
const username = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const usernameInput = ref<HTMLInputElement | null>(null)
const submitting = ref(false)
const errorMessage = ref('')

function selectMode(mode: AuthDialogMode) {
  dialogMode.value = mode
  errorMessage.value = ''
  password.value = ''
  passwordConfirmation.value = ''
}

async function submit() {
  errorMessage.value = ''
  if (dialogMode.value === 'register' && password.value !== passwordConfirmation.value) {
    errorMessage.value = '两次输入的密码不一致。'
    return
  }
  submitting.value = true
  try {
    const credentials = { username: username.value, password: password.value }
    if (dialogMode.value === 'login') await login(credentials)
    else await register(credentials)
    password.value = ''
    passwordConfirmation.value = ''
    closeAuthDialog()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '登录失败，请稍后重试。'
  } finally {
    submitting.value = false
  }
}

function close() {
  if (!submitting.value) closeAuthDialog()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && dialogOpen.value) close()
}

watch(dialogOpen, (open) => {
  if (!open) return
  errorMessage.value = ''
  void nextTick(() => usernameInput.value?.focus())
})

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="auth-dialog-fade">
      <div v-if="dialogOpen" class="auth-backdrop" @mousedown.self="close">
        <form
          class="auth-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          @submit.prevent="submit"
        >
          <header>
            <div>
              <span>ACCOUNT</span>
              <h2 id="auth-dialog-title">
                {{ dialogMode === 'login' ? '登录 TypeRoom' : '创建账号' }}
              </h2>
            </div>
            <button type="button" title="关闭" aria-label="关闭登录窗口" @click="close">
              <X :size="18" />
            </button>
          </header>

          <div class="auth-modes" role="tablist" aria-label="账号操作">
            <button
              type="button"
              role="tab"
              :aria-selected="dialogMode === 'login'"
              :class="{ active: dialogMode === 'login' }"
              @click="selectMode('login')"
            >
              登录
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="dialogMode === 'register'"
              :class="{ active: dialogMode === 'register' }"
              @click="selectMode('register')"
            >
              注册
            </button>
          </div>

          <label for="auth-username">用户名</label>
          <input
            id="auth-username"
            ref="usernameInput"
            v-model="username"
            type="text"
            minlength="3"
            maxlength="24"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
            placeholder="3–24 个字符"
          />

          <label for="auth-password">密码</label>
          <div class="password-field">
            <LockKeyhole :size="16" />
            <input
              id="auth-password"
              v-model="password"
              type="password"
              minlength="8"
              maxlength="72"
              :autocomplete="dialogMode === 'login' ? 'current-password' : 'new-password'"
              required
              placeholder="至少 8 个字符"
            />
          </div>

          <template v-if="dialogMode === 'register'">
            <label for="auth-password-confirmation">确认密码</label>
            <div class="password-field">
              <LockKeyhole :size="16" />
              <input
                id="auth-password-confirmation"
                v-model="passwordConfirmation"
                type="password"
                minlength="8"
                maxlength="72"
                autocomplete="new-password"
                required
                placeholder="再次输入密码"
              />
            </div>
          </template>

          <p v-if="errorMessage" class="auth-error" role="alert">{{ errorMessage }}</p>

          <footer>
            <AppButton @click="close">取消</AppButton>
            <AppButton
              variant="primary"
              type="submit"
              :icon="dialogMode === 'login' ? LogIn : UserPlus"
              :loading="submitting"
            >
              {{ dialogMode === 'login' ? '登录' : '注册并登录' }}
            </AppButton>
          </footer>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-backdrop {
  position: fixed;
  z-index: 150;
  inset: 0;
  display: grid;
  padding: 20px;
  place-items: center;
  background: rgb(8 14 10 / 58%);
}

.auth-dialog {
  width: min(440px, 100%);
  padding: 24px;
  color: var(--ink);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 24px 70px rgb(8 18 12 / 28%);
}

.auth-dialog header,
.auth-dialog footer,
.password-field {
  display: flex;
  align-items: center;
}

.auth-dialog header {
  justify-content: space-between;
  gap: 16px;
}

.auth-dialog header span {
  color: var(--green);
  font:
    500 10px/1.4 'DM Mono',
    monospace;
}

.auth-dialog h2 {
  margin: 3px 0 0;
  font-size: 20px;
  letter-spacing: 0;
}

.auth-dialog header button {
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

.auth-dialog header button:hover {
  color: var(--ink);
  background: var(--surface-muted);
}

.auth-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  margin: 22px 0;
  padding: 3px;
  background: var(--surface-muted);
  border-radius: 6px;
}

.auth-modes button {
  height: 34px;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.auth-modes button.active {
  color: var(--ink);
  background: #ffffff;
  box-shadow: var(--shadow-sm);
}

.auth-dialog > label {
  display: block;
  margin: 14px 0 7px;
  font-size: 13px;
  font-weight: 700;
}

.auth-dialog > input,
.password-field {
  width: 100%;
  height: 42px;
  color: var(--ink);
  background: #ffffff;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
}

.auth-dialog > input {
  padding: 0 12px;
  outline: 0;
}

.password-field {
  gap: 8px;
  padding: 0 11px;
}

.password-field svg {
  flex: 0 0 auto;
  color: var(--ink-soft);
}

.password-field input {
  min-width: 0;
  height: 100%;
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
}

.auth-dialog > input:focus,
.password-field:focus-within {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgb(29 107 79 / 12%);
}

.auth-error {
  margin: 13px 0 0;
  color: #a13d2c;
  font-size: 12px;
  line-height: 1.5;
}

.auth-dialog footer {
  justify-content: flex-end;
  gap: 9px;
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.auth-dialog-fade-enter-active,
.auth-dialog-fade-leave-active {
  transition: opacity 150ms ease;
}

.auth-dialog-fade-enter-from,
.auth-dialog-fade-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .auth-dialog {
    padding: 20px;
  }
}
</style>
