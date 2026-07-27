import { useAuth } from '@/composables/useAuth'
import {
  createSnippet,
  removeSnippet,
  requestSnippet,
  requestSnippets,
  updateSnippet,
} from '@/services/snippets'
import { ApiClientError } from '@/services/api'
import type { CodeSnippet, SaveCodeSnippetInput } from '@/types/snippet'
import { createGlobalState } from '@vueuse/core'
import { ref, watch } from 'vue'

export const useCodeSnippets = createGlobalState(() => {
  const { user, expireSession } = useAuth()
  const snippets = ref<CodeSnippet[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  let loadRequest: Promise<CodeSnippet[]> | null = null

  function handleRequestError(requestError: unknown) {
    if (requestError instanceof ApiClientError && requestError.status === 401) expireSession()
    return requestError
  }

  function findSnippet(id: string) {
    return snippets.value.find((snippet) => snippet.id === id)
  }

  async function loadSnippets(force = false) {
    if (!user.value) {
      snippets.value = []
      loaded.value = true
      return []
    }
    if (loaded.value && !force) return snippets.value
    if (loadRequest && !force) return loadRequest
    loading.value = true
    error.value = ''
    loadRequest = requestSnippets()
      .then((value) => {
        snippets.value = value
        loaded.value = true
        return value
      })
      .catch((requestError: unknown) => {
        handleRequestError(requestError)
        error.value = requestError instanceof Error ? requestError.message : '代码片段加载失败。'
        throw requestError
      })
      .finally(() => {
        loading.value = false
        loadRequest = null
      })
    return loadRequest
  }

  async function loadSnippet(id: string) {
    const existing = findSnippet(id)
    if (existing) return existing
    try {
      const snippet = await requestSnippet(id)
      snippets.value = [snippet, ...snippets.value.filter((item) => item.id !== snippet.id)]
      return snippet
    } catch (requestError) {
      throw handleRequestError(requestError)
    }
  }

  async function saveSnippet(input: SaveCodeSnippetInput, id?: string) {
    try {
      const snippet = id ? await updateSnippet(id, input) : await createSnippet(input)
      snippets.value = [snippet, ...snippets.value.filter((item) => item.id !== snippet.id)]
      loaded.value = true
      return snippet
    } catch (requestError) {
      throw handleRequestError(requestError)
    }
  }

  async function deleteSnippet(id: string) {
    try {
      await removeSnippet(id)
      snippets.value = snippets.value.filter((snippet) => snippet.id !== id)
    } catch (requestError) {
      throw handleRequestError(requestError)
    }
  }

  watch(
    () => user.value?.id,
    (userId) => {
      snippets.value = []
      error.value = ''
      loaded.value = false
      if (userId) loadSnippets().catch(() => undefined)
    },
    { immediate: true },
  )

  return {
    snippets,
    loading,
    loaded,
    error,
    findSnippet,
    loadSnippet,
    loadSnippets,
    saveSnippet,
    deleteSnippet,
  }
})
