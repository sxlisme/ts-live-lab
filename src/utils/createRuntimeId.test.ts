import { createRuntimeId } from './createRuntimeId'

const deterministicGetRandomValues = ((target: Uint8Array) => {
  target.set(Array.from({ length: 16 }, (_, index) => index))
  return target
}) as Crypto['getRandomValues']

describe('createRuntimeId', () => {
  it('uses native randomUUID when it is available', () => {
    const nativeId = '9506928e-8c6a-4b69-8427-09052ce16378'
    const randomUUID = vi.fn(() => nativeId) as Crypto['randomUUID']

    expect(createRuntimeId({ randomUUID })).toBe(nativeId)
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it('uses getRandomValues when randomUUID is unavailable on HTTP', () => {
    expect(createRuntimeId({ getRandomValues: deterministicGetRandomValues })).toBe(
      '00010203-0405-4607-8809-0a0b0c0d0e0f',
    )
  })

  it('falls back when a browser exposes randomUUID but rejects the call', () => {
    const randomUUID = vi.fn(() => {
      throw new DOMException('Secure context required', 'SecurityError')
    }) as Crypto['randomUUID']

    expect(createRuntimeId({ randomUUID, getRandomValues: deterministicGetRandomValues })).toBe(
      '00010203-0405-4607-8809-0a0b0c0d0e0f',
    )
  })

  it('uses a non-security fallback only when Web Crypto is absent', () => {
    expect(createRuntimeId(null, () => 0)).toBe('00000000-0000-4000-8000-000000000000')
  })
})
