import { normalizeSnippetName, suggestLocalSnippetName, validateSnippetDraft } from './codeSnippets'

describe('code snippets', () => {
  it('normalizes and validates a snippet draft', () => {
    expect(normalizeSnippetName('  Result   类型  ')).toBe('Result 类型')
    expect(validateSnippetDraft('Result 类型', 'type Result = string')).toBe('Result 类型')
  })

  it('rejects empty names and code', () => {
    expect(() => validateSnippetDraft(' ', 'const value = 1')).toThrow('请输入片段名称')
    expect(() => validateSnippetDraft('有效名称', ' ')).toThrow('没有可保存的代码')
  })

  it('suggests a readable local name without AI', () => {
    expect(suggestLocalSnippetName('// 防抖函数\nconst debounce = () => {}', 'typescript')).toBe(
      '防抖函数',
    )
    expect(suggestLocalSnippetName('interface User { id: number }', 'typescript')).toBe('User · TS')
  })
})
