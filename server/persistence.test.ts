// @vitest-environment node

import { randomUUID } from 'node:crypto'
import type { Request } from 'express'
import {
  chinaStandardDayRange,
  createSession,
  createUser,
  deleteRequestSession,
  sessionTokenHash,
  userForRequest,
  verifyUser,
} from './auth.js'
import { config } from './config.js'
import { database, initializeDatabase } from './database.js'
import {
  createSnippet,
  deleteSnippet,
  findSnippet,
  listSnippets,
  updateSnippet,
} from './snippets.js'

describe('database persistence', () => {
  beforeAll(() => initializeDatabase())
  beforeEach(async () => {
    await database.query('DELETE FROM sessions')
    await database.query('DELETE FROM code_snippets')
    await database.query('DELETE FROM users')
  })

  async function seedUsers(count: number, createdAt: Date, prefix: string) {
    for (let index = 0; index < count; index += 1) {
      await database.query(
        `INSERT INTO users (id, username, username_normalized, password_hash, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), `${prefix}${index}`, `${prefix}${index}`, 'test-hash', createdAt],
      )
    }
  }

  it('stores password hashes and resolves opaque sessions', async () => {
    const user = await createUser('SessionUser', 'sessionuser', 'password123')
    await expect(verifyUser('sessionuser', 'password123')).resolves.toMatchObject({ id: user.id })
    await expect(verifyUser('sessionuser', 'wrong-password')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    })

    const token = await createSession(user.id)
    expect(sessionTokenHash(token)).toMatch(/^[a-f0-9]{64}$/)
    const request = { cookies: { typeroom_session: token } } as Request
    await expect(userForRequest(request)).resolves.toMatchObject({ id: user.id })
    await deleteRequestSession(request)
    await expect(userForRequest(request)).resolves.toBeNull()
  })

  it('isolates snippets by user ownership', async () => {
    const owner = await createUser('SnippetOwner', 'snippetowner', 'password123')
    const other = await createUser('OtherUser', 'otheruser', 'password123')
    const snippet = await createSnippet(owner.id, {
      name: '类型守卫',
      language: 'typescript',
      code: 'const value: number = 1',
    })

    await expect(listSnippets(owner.id)).resolves.toHaveLength(1)
    await expect(listSnippets(other.id)).resolves.toHaveLength(0)
    await expect(findSnippet(other.id, snippet.id)).resolves.toBeNull()
    await expect(
      updateSnippet(other.id, snippet.id, {
        name: '越权更新',
        language: 'javascript',
        code: 'console.log(1)',
      }),
    ).rejects.toMatchObject({ code: 'SNIPPET_NOT_FOUND' })
    await expect(deleteSnippet(other.id, snippet.id)).rejects.toMatchObject({
      code: 'SNIPPET_NOT_FOUND',
    })

    await expect(
      updateSnippet(owner.id, snippet.id, {
        name: '更新后的类型守卫',
        language: 'typescript',
        code: 'const value: number = 2',
      }),
    ).resolves.toMatchObject({ name: '更新后的类型守卫', createdAt: snippet.createdAt })
    await deleteSnippet(owner.id, snippet.id)
    await expect(listSnippets(owner.id)).resolves.toHaveLength(0)
  })

  it('calculates registration days using China Standard Time', () => {
    const beforeMidnight = chinaStandardDayRange(new Date('2026-07-27T15:59:59.000Z'))
    expect(beforeMidnight.start.toISOString()).toBe('2026-07-26T16:00:00.000Z')
    expect(beforeMidnight.end.toISOString()).toBe('2026-07-27T16:00:00.000Z')

    const atMidnight = chinaStandardDayRange(new Date('2026-07-27T16:00:00.000Z'))
    expect(atMidnight.start.toISOString()).toBe('2026-07-27T16:00:00.000Z')
    expect(atMidnight.end.toISOString()).toBe('2026-07-28T16:00:00.000Z')
  })

  it('uses a generic response after the daily registration ceiling is reached', async () => {
    await seedUsers(config.DAILY_REGISTRATION_LIMIT, new Date(), 'daily-user-')

    await expect(
      createUser('BlockedDailyUser', 'blockeddailyuser', 'password123'),
    ).rejects.toMatchObject({
      status: 429,
      code: 'REGISTRATION_UNAVAILABLE',
      message: '今日注册人数过多，请明日再试。',
    })
  })

  it('uses the same generic response after the total user ceiling is reached', async () => {
    await seedUsers(
      config.MAX_REGISTERED_USERS,
      new Date('2020-01-01T00:00:00.000Z'),
      'total-user-',
    )

    await expect(
      createUser('BlockedTotalUser', 'blockedtotaluser', 'password123'),
    ).rejects.toMatchObject({
      status: 429,
      code: 'REGISTRATION_UNAVAILABLE',
      message: '今日注册人数过多，请明日再试。',
    })
  })
})
