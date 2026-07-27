import type { RunnerLanguage } from '@/types/runner'

export const MAX_SNIPPETS = 30
export const MAX_SNIPPET_NAME_LENGTH = 80
export const MAX_SNIPPET_CODE_LENGTH = 50_000

export function normalizeSnippetName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function validateSnippetDraft(nameValue: string, code: string) {
  const name = normalizeSnippetName(nameValue)
  if (!name) throw new Error('请输入片段名称。')
  if ([...name].length > MAX_SNIPPET_NAME_LENGTH) {
    throw new Error(`片段名称不能超过 ${MAX_SNIPPET_NAME_LENGTH} 个字符。`)
  }
  if (!code.trim()) throw new Error('没有可保存的代码。')
  if (code.length > MAX_SNIPPET_CODE_LENGTH) {
    throw new Error(`代码不能超过 ${MAX_SNIPPET_CODE_LENGTH.toLocaleString('en-US')} 个字符。`)
  }
  return name
}

export function suggestLocalSnippetName(code: string, language: RunnerLanguage) {
  const firstMeaningfulLine = code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean)
  const commentName = /^\/[/*]/.test(firstMeaningfulLine ?? '')
    ? firstMeaningfulLine
        ?.replace(/^\/\/[\s/]*/, '')
        .replace(/^\/\*[\s*]*/, '')
        .replace(/[\s*]*\*\/$/, '')
        .trim()
    : ''

  if (commentName && [...commentName].length <= 40) return commentName

  const declaration = code.match(
    /\b(?:async\s+function|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
  )
  if (declaration?.[1]) return `${declaration[1]} · ${language === 'typescript' ? 'TS' : 'JS'}`

  return language === 'typescript' ? 'TypeScript 代码片段' : 'JavaScript 代码片段'
}
