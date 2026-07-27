import { apiRequest } from '@/services/api'
import type { CodeSnippet, SaveCodeSnippetInput } from '@/types/snippet'

export async function requestSnippets() {
  const response = await apiRequest<{ snippets: CodeSnippet[] }>('/api/snippets')
  return response.snippets
}

export async function requestSnippet(id: string) {
  const response = await apiRequest<{ snippet: CodeSnippet }>(`/api/snippets/${id}`)
  return response.snippet
}

export async function createSnippet(input: SaveCodeSnippetInput) {
  const response = await apiRequest<{ snippet: CodeSnippet }>('/api/snippets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.snippet
}

export async function updateSnippet(id: string, input: SaveCodeSnippetInput) {
  const response = await apiRequest<{ snippet: CodeSnippet }>(`/api/snippets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.snippet
}

export function removeSnippet(id: string) {
  return apiRequest<Record<string, never>>(`/api/snippets/${id}`, { method: 'DELETE' })
}
