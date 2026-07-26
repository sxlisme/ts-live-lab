import { apiRequest } from '@/services/api'
import type { AiReview, ClaudeConfig, ReviewRequest } from '@/types/ai'

function headers(config: ClaudeConfig): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(config.apiKey ? { 'X-Claude-Key': config.apiKey } : {}),
  }
}

export async function requestAiReview(input: ReviewRequest, config: ClaudeConfig) {
  const response = await apiRequest<{ review: AiReview }>('/api/ai/review', {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({ ...input, model: config.model, baseUrl: config.baseUrl }),
  })
  return response.review
}

export async function checkClaudeConnection(config: ClaudeConfig) {
  return apiRequest<{ ok: boolean }>('/api/ai/check', {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify({ model: config.model, baseUrl: config.baseUrl }),
  })
}
