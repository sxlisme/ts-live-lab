interface ApiErrorPayload {
  error?: { code?: string; message?: string }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = 'UNKNOWN_ERROR',
  ) {
    super(message)
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload
  if (!response.ok) {
    throw new ApiClientError(
      payload.error?.message ?? '请求失败，请稍后重试。',
      response.status,
      payload.error?.code,
    )
  }
  return payload
}
