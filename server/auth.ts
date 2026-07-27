import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import type { QueryResultRow } from 'pg'
import { config } from './config.js'
import { database } from './database.js'
import { ApiError } from './types.js'

const SESSION_COOKIE = 'typeroom_session'
const SESSION_MAX_AGE_MS = config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1_000
const PASSWORD_ROUNDS = config.NODE_ENV === 'test' ? 4 : 12

interface UserRow extends QueryResultRow {
  id: string
  username: string
  password_hash: string
  created_at: Date | string
}

export interface AuthUser {
  id: string
  username: string
  createdAt: string
}

function isoDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function publicUser(row: UserRow): AuthUser {
  return { id: row.id, username: row.username, createdAt: isoDate(row.created_at) }
}

export function sessionTokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function createUser(username: string, usernameNormalized: string, password: string) {
  const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS)
  try {
    const result = await database.query<UserRow>(
      `INSERT INTO users (id, username, username_normalized, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, password_hash, created_at`,
      [randomUUID(), username, usernameNormalized, passwordHash],
    )
    return publicUser(result.rows[0]!)
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      throw new ApiError(409, '该用户名已被使用。', 'USERNAME_TAKEN')
    }
    throw error
  }
}

export async function verifyUser(usernameNormalized: string, password: string) {
  const result = await database.query<UserRow>(
    `SELECT id, username, password_hash, created_at
     FROM users WHERE username_normalized = $1`,
    [usernameNormalized],
  )
  const row = result.rows[0]
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new ApiError(401, '用户名或密码错误。', 'INVALID_CREDENTIALS')
  }
  return publicUser(row)
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS)
  await database.query('DELETE FROM sessions WHERE expires_at <= $1', [new Date()])
  await database.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [sessionTokenHash(token), userId, expiresAt],
  )
  return token
}

function sessionCookie(request: Request) {
  const cookies = request.cookies as Record<string, unknown> | undefined
  const value = cookies?.[SESSION_COOKIE]
  return typeof value === 'string' && value.length <= 200 ? value : ''
}

export function setSessionCookie(response: Response, token: string) {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.HTTPS_ONLY,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  })
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: config.HTTPS_ONLY,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteRequestSession(request: Request) {
  const token = sessionCookie(request)
  if (token) {
    await database.query('DELETE FROM sessions WHERE token_hash = $1', [sessionTokenHash(token)])
  }
}

export async function userForRequest(request: Request): Promise<AuthUser | null> {
  const token = sessionCookie(request)
  if (!token) return null
  const result = await database.query<UserRow>(
    `SELECT users.id, users.username, users.password_hash, users.created_at
     FROM sessions
     INNER JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = $1 AND sessions.expires_at > $2`,
    [sessionTokenHash(token), new Date()],
  )
  return result.rows[0] ? publicUser(result.rows[0]) : null
}

export async function requireUser(request: Request) {
  const user = await userForRequest(request)
  if (!user) throw new ApiError(401, '请先登录后再保存代码片段。', 'AUTH_REQUIRED')
  return user
}
