// @vitest-environment node

import type { Request } from 'express'
import {
  createSession,
  createUser,
  deleteRequestSession,
  sessionTokenHash,
  userForRequest,
  verifyUser,
} from './auth.js'
import { initializeDatabase } from './database.js'
import {
  createSnippet,
  deleteSnippet,
  findSnippet,
  listSnippets,
  updateSnippet,
} from './snippets.js'

describe('database persistence', () => {
  beforeAll(() => initializeDatabase())

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
})
