import { docsSections } from './docs'
import { questions } from './questions'

describe('maintained content', () => {
  it('keeps at least 50 question identifiers unique and question data complete', () => {
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    expect(questions.length).toBeGreaterThanOrEqual(50)
    for (const question of questions) {
      expect(question.keyPoints.length).toBeGreaterThan(0)
      expect(question.referenceAnswer).toBeTruthy()
      if (question.kind === 'choice') {
        expect(question.options?.some((option) => option.id === question.correctOptionId)).toBe(
          true,
        )
      }
    }
    for (const question of questions.filter((item) => item.kind === 'code')) {
      expect(question.starterCode).toBeTruthy()
      expect(question.testCode).toBeTruthy()
    }
  })

  it('links every handbook chapter to an official TypeScript source', () => {
    expect(new Set(docsSections.map((section) => section.id)).size).toBe(docsSections.length)
    for (const section of docsSections) {
      expect(section.sourceUrl).toMatch(/^https:\/\/www\.typescriptlang\.org\//)
      expect(section.topics.length).toBeGreaterThanOrEqual(3)
      expect(new Set(section.topics.map((topic) => topic.id)).size).toBe(section.topics.length)
    }
  })
})
