import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
} from '@anthropic-ai/sdk'

export interface AiErrorResponse {
  status: number
  code: string
  message: string
}

export function mapAiUpstreamError(error: unknown): AiErrorResponse | null {
  if (error instanceof AuthenticationError) {
    return { status: 401, code: 'AI_AUTH_FAILED', message: '上游拒绝了 API Key，请检查密钥。' }
  }
  if (error instanceof PermissionDeniedError) {
    return { status: 403, code: 'AI_PERMISSION_DENIED', message: '当前 API Key 无权使用该模型。' }
  }
  if (error instanceof NotFoundError) {
    return {
      status: 404,
      code: 'AI_NOT_FOUND',
      message: '上游接口或模型不存在，请检查 API 根地址和模型 ID。',
    }
  }
  if (error instanceof BadRequestError) {
    return {
      status: 400,
      code: 'AI_BAD_REQUEST',
      message: '上游拒绝了请求，请确认模型 ID 以及 Anthropic Messages API 兼容性。',
    }
  }
  if (error instanceof RateLimitError) {
    return { status: 429, code: 'AI_RATE_LIMITED', message: '上游触发限流，请稍后重试。' }
  }
  if (error instanceof APIConnectionTimeoutError) {
    return { status: 504, code: 'AI_TIMEOUT', message: '连接 AI 上游超时，请检查地址或稍后重试。' }
  }
  if (error instanceof APIConnectionError) {
    return { status: 502, code: 'AI_CONNECTION_FAILED', message: '无法连接 AI 上游，请检查地址和网络。' }
  }
  if (error instanceof APIError) {
    return { status: 502, code: 'AI_UPSTREAM_ERROR', message: 'AI 上游返回错误，请稍后重试。' }
  }
  return null
}
