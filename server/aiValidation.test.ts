// @vitest-environment node

import { modelIdSchema, snippetNameRequestSchema } from './aiValidation.js'

describe('AI request validation', () => {
  it('accepts third-party model identifiers without a Claude prefix', () => {
    expect(modelIdSchema.parse('third-party/model-v2')).toBe('third-party/model-v2')
    expect(modelIdSchema.parse('  qwen-plus  ')).toBe('qwen-plus')
  })

  it('rejects empty or control-character model identifiers', () => {
    expect(() => modelIdSchema.parse('   ')).toThrow('不能为空')
    expect(() => modelIdSchema.parse('model\nInjected')).toThrow('控制字符')
  })
})

describe('AI snippet name request validation', () => {
  it('accepts a bounded TypeScript snippet', () => {
    expect(
      snippetNameRequestSchema.parse({
        model: 'third-party/model-v2',
        language: 'typescript',
        code: 'const value: number = 1',
      }),
    ).toMatchObject({ language: 'typescript' })
  })

  it('rejects unsupported languages and oversized source', () => {
    expect(() =>
      snippetNameRequestSchema.parse({ model: 'model', language: 'html', code: '<main />' }),
    ).toThrow()
    expect(() =>
      snippetNameRequestSchema.parse({
        model: 'model',
        language: 'typescript',
        code: 'a'.repeat(8_001),
      }),
    ).toThrow()
  })
})
