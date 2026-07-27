import type { RunnerLanguage } from '@/types/runner'

export interface CodeSnippet {
  id: string
  name: string
  language: RunnerLanguage
  code: string
  createdAt: string
  updatedAt: string
}

export interface SaveCodeSnippetInput {
  name: string
  language: RunnerLanguage
  code: string
}
