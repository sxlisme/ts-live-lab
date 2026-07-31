import { playgroundSamples } from '@/data/playgroundSamples'
import { describe, expect, it } from 'vitest'
import { TypeScriptDiagnosticsService } from './typeDiagnostics'

describe('TypeScriptDiagnosticsService', () => {
  const service = new TypeScriptDiagnosticsService()

  it('reports semantic type errors with their source position', () => {
    const diagnostics = service.getDiagnostics(
      `const label = 'age'\nconst age: number = '18'\nconsole.log(label, age)`,
      'typescript',
    )

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: 2322,
        line: 2,
        column: 7,
        message: "Type 'string' is not assignable to type 'number'.",
      }),
    ])
  })

  it('reports syntax errors', () => {
    expect(service.getDiagnostics('const value: number =', 'typescript')).toEqual([
      expect.objectContaining({ code: 1109, line: 1 }),
    ])
  })

  it('supports ES2022 and worker standard library types', () => {
    const code = `const values = [1, 2, 3].map(value => value * 2)
const entries = Object.fromEntries(values.map(value => [String(value), value]))
console.log(entries)`

    expect(service.getDiagnostics(code, 'typescript')).toEqual([])
  })

  it('accepts top-level await because the runner wraps code in an async function', () => {
    expect(
      service.getDiagnostics(
        `const value = await Promise.resolve(42)\nconsole.log(value)`,
        'typescript',
      ),
    ).toEqual([])
  })

  it.each(playgroundSamples)('keeps the "$label" sample valid', (sample) => {
    expect(service.getDiagnostics(sample.code, sample.language)).toEqual([])
  })
})
