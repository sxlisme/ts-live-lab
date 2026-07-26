type RuntimeCrypto = Partial<Pick<Crypto, 'getRandomValues' | 'randomUUID'>>

function currentCrypto(): RuntimeCrypto | null {
  return typeof globalThis.crypto === 'undefined' ? null : globalThis.crypto
}

function fillWithFallbackRandom(bytes: Uint8Array, random: () => number) {
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(random() * 256)
  }
}

function toHex(byte: number) {
  return byte.toString(16).padStart(2, '0')
}

export function createRuntimeId(
  runtimeCrypto: RuntimeCrypto | null = currentCrypto(),
  fallbackRandom: () => number = Math.random,
) {
  if (runtimeCrypto?.randomUUID) {
    try {
      return runtimeCrypto.randomUUID()
    } catch {
      // Some browsers expose randomUUID but reject it outside a secure context.
    }
  }

  const bytes = new Uint8Array(16)
  if (runtimeCrypto?.getRandomValues) {
    runtimeCrypto.getRandomValues(bytes)
  } else {
    fillWithFallbackRandom(bytes, fallbackRandom)
  }

  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80

  const hex = Array.from(bytes, toHex)
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
    .slice(6, 8)
    .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}
