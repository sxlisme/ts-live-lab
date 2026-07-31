import { describe, expect, it } from 'vitest'
import { formatRunnerCode } from './codeFormatter'

describe('formatRunnerCode', () => {
  it('formats TypeScript with the runner style', async () => {
    await expect(
      formatRunnerCode('type User={name:string};const user:User={name:"Ada"}', 'typescript'),
    ).resolves.toBe(`type User = { name: string }
const user: User = { name: 'Ada' }
`)
  })

  it('formats JavaScript with the same stable style', async () => {
    await expect(
      formatRunnerCode('const values=[1,2,3];console.log(values)', 'javascript'),
    ).resolves.toBe(`const values = [1, 2, 3]
console.log(values)
`)
  })

  it('rejects invalid syntax instead of changing the source', async () => {
    await expect(formatRunnerCode('const value =', 'typescript')).rejects.toThrow()
  })
})
