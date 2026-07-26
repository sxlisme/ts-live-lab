import { inspectSourceRestrictions } from './security'

describe('runner source restrictions', () => {
  it('accepts self-contained TypeScript', () => {
    expect(
      inspectSourceRestrictions('const value: number = 42; console.log(value)', 'typescript'),
    ).toEqual([])
  })

  it.each([
    ["import value from 'pkg'", 'import'],
    ["fetch('https://example.com')", '网络'],
    ["const socket = new WebSocket('wss://example.com')", '网络连接'],
    ["import('pkg')", '动态 import'],
  ])('blocks restricted source: %s', (source, expectedMessage) => {
    expect(inspectSourceRestrictions(source, 'typescript').join(' ')).toContain(expectedMessage)
  })
})
