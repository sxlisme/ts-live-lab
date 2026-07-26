export interface ClaudeConfig {
  apiKey: string
  model: string
  baseUrl: string
}

export interface AiServerStatus {
  serverConfigured: boolean
  allowClientKey: boolean
  allowClientBaseUrl: boolean
  defaultModel: string
  defaultBaseUrl: string
}

export interface AiReview {
  score: number
  summary: string
  strengths: string[]
  issues: string[]
  suggestions: string[]
}

export interface ReviewRequest {
  question: string
  questionType: string
  keyPoints: string[]
  answer: string
}
