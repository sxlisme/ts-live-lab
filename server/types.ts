export interface ReviewResult {
  score: number
  summary: string
  strengths: string[]
  issues: string[]
  suggestions: string[]
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message)
  }
}
