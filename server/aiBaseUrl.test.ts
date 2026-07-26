// @vitest-environment node

import {
  createPinnedLookup,
  isPrivateNetworkAddress,
  normalizeAiBaseUrl,
  validateClientBaseUrl,
} from './aiBaseUrl.js'

describe('AI base URL policy', () => {
  it('pins both single-address and all-address DNS lookups', () => {
    const pinnedLookup = createPinnedLookup({ address: '93.184.216.34', family: 4 })
    const singleCallback = vi.fn()
    const allCallback = vi.fn()

    pinnedLookup('gateway.example.com', { all: false }, singleCallback)
    pinnedLookup('gateway.example.com', { all: true }, allCallback)

    expect(singleCallback).toHaveBeenCalledWith(null, '93.184.216.34', 4)
    expect(allCallback).toHaveBeenCalledWith(null, [{ address: '93.184.216.34', family: 4 }])
  })

  it('normalizes compatible API base URLs', () => {
    expect(normalizeAiBaseUrl('https://gateway.example.com/anthropic/v1/')).toBe(
      'https://gateway.example.com/anthropic/v1',
    )
    expect(() => normalizeAiBaseUrl('https://user:secret@example.com')).toThrow('用户名或密码')
    expect(() => normalizeAiBaseUrl('https://example.com?target=internal')).toThrow('查询参数')
    expect(() => normalizeAiBaseUrl('http://example.com', true)).toThrow('必须使用 HTTPS')
  })

  it('recognizes private and reserved IPv4 and IPv6 addresses', () => {
    for (const address of [
      '127.0.0.1',
      '10.0.0.1',
      '169.254.169.254',
      '192.168.1.2',
      '::1',
      'fd00::1',
      'fe80::1',
      '::ffff:127.0.0.1',
    ]) {
      expect(isPrivateNetworkAddress(address), address).toBe(true)
    }
    expect(isPrivateNetworkAddress('93.184.216.34')).toBe(false)
    expect(isPrivateNetworkAddress('2606:2800:220:1:248:1893:25c8:1946')).toBe(false)
  })

  it('rejects local hosts and domains that resolve to private addresses', async () => {
    await expect(validateClientBaseUrl('https://localhost:8787', [])).rejects.toMatchObject({
      code: 'INVALID_AI_BASE_URL',
    })
    await expect(
      validateClientBaseUrl('https://gateway.example.com', [], async () => ['10.20.30.40']),
    ).rejects.toThrow('私有或保留 IP')
  })

  it('accepts public HTTPS hosts and enforces an optional allowlist', async () => {
    const publicResolver = async () => ['93.184.216.34']
    await expect(
      validateClientBaseUrl('https://gateway.example.com/v1/', [], publicResolver),
    ).resolves.toEqual({
      baseUrl: 'https://gateway.example.com/v1',
      address: '93.184.216.34',
      family: 4,
    })
    await expect(
      validateClientBaseUrl(
        'https://other.example.com',
        ['https://gateway.example.com/v1'],
        publicResolver,
      ),
    ).rejects.toThrow('不在服务端允许列表')
  })
})
