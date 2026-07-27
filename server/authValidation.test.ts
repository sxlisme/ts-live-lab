// @vitest-environment node

import { credentialsSchema, normalizeUsername } from './authValidation.js'

describe('auth validation', () => {
  it('normalizes usernames and accepts Unicode letters', () => {
    expect(normalizeUsername('  Alice_01  '.trim())).toBe('alice_01')
    expect(credentialsSchema.parse({ username: '小明_01', password: 'password123' })).toMatchObject(
      {
        username: '小明_01',
      },
    )
  })

  it('rejects weak credentials', () => {
    expect(() => credentialsSchema.parse({ username: 'ab', password: 'password123' })).toThrow(
      '至少需要 3 个字符',
    )
    expect(() => credentialsSchema.parse({ username: 'valid-user', password: 'short' })).toThrow(
      '至少需要 8 个字符',
    )
    expect(() =>
      credentialsSchema.parse({ username: 'invalid user', password: 'password123' }),
    ).toThrow('只能包含')
  })
})
