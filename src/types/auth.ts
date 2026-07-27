export interface AuthUser {
  id: string
  username: string
  createdAt: string
}

export type AuthDialogMode = 'login' | 'register'

export interface AuthCredentials {
  username: string
  password: string
}
