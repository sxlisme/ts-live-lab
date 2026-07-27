import { apiRequest } from '@/services/api'
import type { AuthCredentials, AuthUser } from '@/types/auth'

export function requestSession() {
  return apiRequest<{ user: AuthUser | null }>('/api/auth/session')
}

export function requestLogin(credentials: AuthCredentials) {
  return apiRequest<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function requestRegistration(credentials: AuthCredentials) {
  return apiRequest<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function requestLogout() {
  return apiRequest<Record<string, never>>('/api/auth/logout', { method: 'POST' })
}
