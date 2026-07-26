// @vitest-environment node

import { modelIdSchema } from './aiValidation.js'

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
