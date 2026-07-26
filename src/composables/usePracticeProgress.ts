import { questions } from '@/data/questions'
import type { QuestionProgress } from '@/types/practice'
import { createGlobalState, useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export const usePracticeProgress = createGlobalState(() => {
  const progress = useLocalStorage<Record<string, QuestionProgress>>(
    'typeroom:practice-progress',
    {},
  )

  const completedCount = computed(
    () => questions.filter((question) => progress.value[question.id]?.completed).length,
  )
  const correctCount = computed(
    () => questions.filter((question) => progress.value[question.id]?.correct === true).length,
  )
  const completionRate = computed(() => Math.round((completedCount.value / questions.length) * 100))

  function answerFor(questionId: string) {
    return progress.value[questionId]?.answer ?? ''
  }

  function setAnswer(questionId: string, answer: string) {
    const previous = progress.value[questionId]
    progress.value = {
      ...progress.value,
      [questionId]: {
        answer,
        completed: previous?.completed ?? false,
        correct: previous?.correct,
        updatedAt: Date.now(),
      },
    }
  }

  function markCompleted(questionId: string, correct?: boolean) {
    const previous = progress.value[questionId]
    progress.value = {
      ...progress.value,
      [questionId]: {
        answer: previous?.answer ?? '',
        completed: true,
        correct,
        updatedAt: Date.now(),
      },
    }
  }

  function reset() {
    progress.value = {}
  }

  return {
    progress,
    completedCount,
    correctCount,
    completionRate,
    answerFor,
    setAnswer,
    markCompleted,
    reset,
  }
})
