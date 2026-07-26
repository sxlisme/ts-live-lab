import { lookup } from 'node:dns/promises'
import { isIP, type LookupFunction } from 'node:net'
import { ApiError } from './types.js'

type AddressResolver = (hostname: string) => Promise<string[]>

export interface ValidatedAiBaseUrl {
  baseUrl: string
  address: string
  family: 4 | 6
}

export function createPinnedLookup(
  target: Pick<ValidatedAiBaseUrl, 'address' | 'family'>,
): LookupFunction {
  return (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [{ address: target.address, family: target.family }])
      return
    }
    callback(null, target.address, target.family)
  }
}

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
])

function invalidBaseUrl(message: string): never {
  throw new ApiError(400, message, 'INVALID_AI_BASE_URL')
}

export function normalizeAiBaseUrl(value: string, requireHttps = false) {
  if (!value || value.length > 500) invalidBaseUrl('AI 上游地址格式无效。')

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    invalidBaseUrl('AI 上游地址必须是完整 URL。')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    invalidBaseUrl('AI 上游地址只支持 HTTP 或 HTTPS。')
  }
  if (requireHttps && parsed.protocol !== 'https:') {
    invalidBaseUrl('浏览器配置的 AI 上游地址必须使用 HTTPS。')
  }
  if (parsed.username || parsed.password) {
    invalidBaseUrl('AI 上游地址不能包含用户名或密码。')
  }
  if (parsed.search || parsed.hash) {
    invalidBaseUrl('AI 上游地址不能包含查询参数或片段。')
  }

  const path = parsed.pathname.replace(/\/+$/, '')
  return `${parsed.origin}${path === '/' ? '' : path}`
}

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true
  }
  const [a, b, c] = parts as [number, number, number, number]
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  )
}

function mappedIpv4(address: string) {
  const normalized = address.toLowerCase()
  const marker = normalized.lastIndexOf(':')
  const dotted = normalized.slice(marker + 1)
  if (dotted.includes('.')) return dotted
  if (!normalized.startsWith('::ffff:')) return null
  const groups = normalized.slice(7).split(':')
  if (groups.length !== 2) return null
  const high = Number.parseInt(groups[0] ?? '', 16)
  const low = Number.parseInt(groups[1] ?? '', 16)
  if (!Number.isInteger(high) || !Number.isInteger(low)) return null
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`
}

export function isPrivateNetworkAddress(address: string) {
  if (isIP(address) === 4) return isPrivateIpv4(address)
  if (isIP(address) !== 6) return true

  const normalized = address.toLowerCase()
  const mapped = mappedIpv4(normalized)
  if (mapped) return isPrivateIpv4(mapped)

  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized) ||
    /^fe[c-f]/.test(normalized) ||
    normalized.startsWith('ff') ||
    normalized.startsWith('2001:db8:') ||
    normalized === '2001:db8::'
  )
}

async function resolveAddresses(hostname: string) {
  const results = await lookup(hostname, { all: true, verbatim: true })
  return results.map((result) => result.address)
}

export async function validateClientBaseUrl(
  value: string,
  allowedBaseUrls: string[],
  resolver: AddressResolver = resolveAddresses,
) {
  const normalized = normalizeAiBaseUrl(value, true)
  const parsed = new URL(normalized)
  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase()

  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    invalidBaseUrl('AI 上游地址不能指向本机或内部网络。')
  }

  if (allowedBaseUrls.length > 0) {
    const normalizedAllowed = allowedBaseUrls.map((item) => normalizeAiBaseUrl(item, true))
    if (!normalizedAllowed.includes(normalized)) {
      invalidBaseUrl('AI 上游地址不在服务端允许列表中。')
    }
  }

  if (isIP(hostname)) {
    if (isPrivateNetworkAddress(hostname)) {
      invalidBaseUrl('AI 上游地址不能指向私有或保留 IP。')
    }
    return { baseUrl: normalized, address: hostname, family: isIP(hostname) as 4 | 6 }
  }

  let addresses: string[]
  try {
    addresses = await resolver(hostname)
  } catch {
    invalidBaseUrl('AI 上游域名无法解析。')
  }
  if (addresses.length === 0 || addresses.some(isPrivateNetworkAddress)) {
    invalidBaseUrl('AI 上游域名解析到了私有或保留 IP。')
  }
  const address = addresses[0]!
  return { baseUrl: normalized, address, family: isIP(address) as 4 | 6 }
}
