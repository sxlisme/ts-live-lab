import { apiRequest } from '@/services/api'
import type { AiServerStatus, ClaudeConfig } from '@/types/ai'
import { createGlobalState, useSessionStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'
const DEFAULT_BASE_URL = 'https://api.anthropic.com'

export const useClaudeConfig = createGlobalState(() => {
  const config = useSessionStorage<ClaudeConfig>('typeroom:claude-config', {
    apiKey: '',
    model: DEFAULT_MODEL,
    baseUrl: DEFAULT_BASE_URL,
  })
  if (!config.value.baseUrl) {
    config.value = { ...config.value, baseUrl: DEFAULT_BASE_URL }
  }
  const serverStatus = ref<AiServerStatus | null>(null)
  const statusLoading = ref(false)

  const canReview = computed(() =>
    Boolean(
      serverStatus.value?.serverConfigured ||
      (serverStatus.value?.allowClientKey && config.value.apiKey),
    ),
  )

  async function loadServerStatus() {
    statusLoading.value = true
    try {
      serverStatus.value = await apiRequest<AiServerStatus>('/api/ai/status')
      if (config.value.model === DEFAULT_MODEL && serverStatus.value.defaultModel) {
        config.value.model = serverStatus.value.defaultModel
      }
      if (
        !serverStatus.value.allowClientBaseUrl ||
        config.value.baseUrl === DEFAULT_BASE_URL
      ) {
        config.value.baseUrl = serverStatus.value.defaultBaseUrl
      }
    } finally {
      statusLoading.value = false
    }
  }

  function updateConfig(next: ClaudeConfig) {
    config.value = { ...next }
  }

  function clearKey() {
    config.value = { ...config.value, apiKey: '' }
  }

  return {
    config,
    serverStatus,
    statusLoading,
    canReview,
    loadServerStatus,
    updateConfig,
    clearKey,
  }
})
