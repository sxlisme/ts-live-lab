import { requestLogin, requestLogout, requestRegistration, requestSession } from '@/services/auth'
import type { AuthCredentials, AuthDialogMode, AuthUser } from '@/types/auth'
import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useAuth = createGlobalState(() => {
  const user = ref<AuthUser | null>(null)
  const sessionLoaded = ref(false)
  const sessionLoading = ref(false)
  const dialogOpen = ref(false)
  const dialogMode = ref<AuthDialogMode>('login')
  let sessionRequest: Promise<AuthUser | null> | null = null

  async function loadSession(force = false) {
    if (sessionLoaded.value && !force) return user.value
    if (sessionRequest && !force) return sessionRequest
    sessionLoading.value = true
    sessionRequest = requestSession()
      .then((response) => {
        user.value = response.user
        sessionLoaded.value = true
        return response.user
      })
      .finally(() => {
        sessionLoading.value = false
        sessionRequest = null
      })
    return sessionRequest
  }

  async function login(credentials: AuthCredentials) {
    const response = await requestLogin(credentials)
    user.value = response.user
    sessionLoaded.value = true
    return response.user
  }

  async function register(credentials: AuthCredentials) {
    const response = await requestRegistration(credentials)
    user.value = response.user
    sessionLoaded.value = true
    return response.user
  }

  async function logout() {
    await requestLogout()
    user.value = null
    sessionLoaded.value = true
  }

  function expireSession() {
    user.value = null
    sessionLoaded.value = true
  }

  function openAuthDialog(mode: AuthDialogMode = 'login') {
    dialogMode.value = mode
    dialogOpen.value = true
  }

  function closeAuthDialog() {
    dialogOpen.value = false
  }

  return {
    user,
    sessionLoaded,
    sessionLoading,
    dialogOpen,
    dialogMode,
    loadSession,
    login,
    register,
    logout,
    expireSession,
    openAuthDialog,
    closeAuthDialog,
  }
})
