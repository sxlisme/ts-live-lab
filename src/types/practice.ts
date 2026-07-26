export type QuestionKind = 'choice' | 'short' | 'code'
export type QuestionDifficulty = '基础' | '进阶' | '高级'
export type QuestionCategory = '类型基础' | '类型进阶' | '泛型工具' | '工程实践'

export interface QuestionOption {
  id: string
  text: string
}

export interface PracticeQuestion {
  id: string
  title: string
  category: QuestionCategory
  difficulty: QuestionDifficulty
  kind: QuestionKind
  prompt: string
  options?: QuestionOption[]
  correctOptionId?: string
  starterCode?: string
  testCode?: string
  hint?: string
  keyPoints: string[]
  referenceAnswer: string
}

export interface QuestionProgress {
  answer: string
  completed: boolean
  correct?: boolean
  updatedAt: number
}
