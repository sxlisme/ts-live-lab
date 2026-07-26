<script setup lang="ts">
import CodeEditor from '@/components/editor/CodeEditor.vue'
import OutputConsole from '@/components/editor/OutputConsole.vue'
import AiReviewPanel from '@/components/practice/AiReviewPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import PageHeading from '@/components/ui/PageHeading.vue'
import { useClaudeConfig } from '@/composables/useClaudeConfig'
import { useCodeRunner } from '@/composables/useCodeRunner'
import { usePracticeProgress } from '@/composables/usePracticeProgress'
import { questionCategories, questions } from '@/data/questions'
import { requestAiReview } from '@/services/aiReview'
import type { AiReview } from '@/types/ai'
import type { QuestionCategory } from '@/types/practice'
import {
  Bot,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleHelp,
  Code2,
  ListChecks,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  XCircle,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const search = ref('')
const activeCategory = ref<QuestionCategory | '全部'>('全部')
const activeQuestionId = ref(questions[0]!.id)
const localFeedback = ref<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
const review = ref<AiReview | null>(null)
const reviewLoading = ref(false)
const reviewError = ref('')

const {
  progress,
  completedCount,
  correctCount,
  completionRate,
  answerFor,
  setAnswer,
  markCompleted,
  reset,
} = usePracticeProgress()
const { config, canReview, loadServerStatus } = useClaudeConfig()
const runner = useCodeRunner()

const filteredQuestions = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return questions.filter((question) => {
    const matchesCategory =
      activeCategory.value === '全部' || question.category === activeCategory.value
    const matchesSearch =
      !keyword || `${question.title} ${question.prompt}`.toLowerCase().includes(keyword)
    return matchesCategory && matchesSearch
  })
})

const activeQuestion = computed(
  () => questions.find((question) => question.id === activeQuestionId.value) ?? questions[0]!,
)
const activeIndex = computed(() =>
  questions.findIndex((item) => item.id === activeQuestion.value.id),
)
const answer = computed({
  get: () => answerFor(activeQuestion.value.id),
  set: (value: string) => setAnswer(activeQuestion.value.id, value),
})
const activeProgress = computed(() => progress.value[activeQuestion.value.id])

function selectQuestion(questionId: string) {
  activeQuestionId.value = questionId
}

function initializeAnswer() {
  const question = activeQuestion.value
  if (question.kind === 'code' && !answerFor(question.id)) {
    setAnswer(question.id, question.starterCode ?? '')
  }
}

watch(activeQuestionId, () => {
  localFeedback.value = null
  review.value = null
  reviewError.value = ''
  runner.stop(false)
  runner.clear()
  initializeAnswer()
})

watch([activeCategory, search], () => {
  if (!filteredQuestions.value.some((question) => question.id === activeQuestionId.value)) {
    const firstMatch = filteredQuestions.value[0]
    if (firstMatch) activeQuestionId.value = firstMatch.id
  }
})

watch(
  () => runner.status.value,
  (status) => {
    if (status === 'success' && activeQuestion.value.kind === 'code') {
      markCompleted(activeQuestion.value.id, true)
      localFeedback.value = { type: 'success', text: '内置测试已通过，答案已记录。' }
    }
  },
)

function submitAnswer() {
  const question = activeQuestion.value
  if (!answer.value.trim()) {
    localFeedback.value = { type: 'error', text: '请先填写答案。' }
    return
  }
  if (question.kind === 'code') {
    runCodeAnswer()
    return
  }
  if (question.kind === 'choice') {
    const correct = answer.value === question.correctOptionId
    markCompleted(question.id, correct)
    localFeedback.value = {
      type: correct ? 'success' : 'error',
      text: correct ? '回答正确。' : '这次没有选对，可以结合参考解析再想一次。',
    }
    return
  }
  markCompleted(question.id)
  localFeedback.value = { type: 'info', text: '答案已记录，可对照参考要点或交给 Claude 审查。' }
}

function runCodeAnswer() {
  const question = activeQuestion.value
  if (!answer.value.trim()) {
    localFeedback.value = { type: 'error', text: '请先编写代码。' }
    return
  }
  localFeedback.value = null
  runner.run(`${answer.value}\n${question.testCode ?? ''}`, 'typescript')
}

function resetCodeAnswer() {
  answer.value = activeQuestion.value.starterCode ?? ''
  localFeedback.value = null
  runner.clear()
}

async function reviewAnswer() {
  if (!answer.value.trim()) {
    reviewError.value = '请先填写答案。'
    return
  }
  reviewLoading.value = true
  reviewError.value = ''
  review.value = null
  try {
    review.value = await requestAiReview(
      {
        question: activeQuestion.value.prompt,
        questionType: activeQuestion.value.kind,
        keyPoints: activeQuestion.value.keyPoints,
        answer: answer.value,
      },
      config.value,
    )
  } catch (error) {
    reviewError.value = error instanceof Error ? error.message : 'AI 审查失败。'
  } finally {
    reviewLoading.value = false
  }
}

function moveQuestion(offset: number) {
  const next = questions[activeIndex.value + offset]
  if (next) activeQuestionId.value = next.id
}

function resetAllProgress() {
  if (!window.confirm('确定清空全部练习进度吗？')) return
  reset()
  initializeAnswer()
}

onMounted(() => {
  initializeAnswer()
  loadServerStatus().catch(() => undefined)
})
</script>

<template>
  <div class="practice-page">
    <PageHeading
      eyebrow="INTERVIEW KIT"
      title="TypeScript 面试练习"
      :description="`${questions.length} 道常见题，答案和进度仅保存在当前浏览器。`"
    >
      <template #actions>
        <div class="progress-summary">
          <span
            ><strong>{{ completedCount }}</strong
            >/{{ questions.length }} 已完成</span
          >
          <span
            ><strong>{{ correctCount }}</strong> 道客观题正确</span
          >
        </div>
      </template>
    </PageHeading>

    <div class="practice-toolbar">
      <div class="category-tabs">
        <button
          :class="{ active: activeCategory === '全部' }"
          type="button"
          @click="activeCategory = '全部'"
        >
          全部
        </button>
        <button
          v-for="category in questionCategories"
          :key="category"
          :class="{ active: activeCategory === category }"
          type="button"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>
      <label class="question-search">
        <Search :size="16" />
        <input v-model="search" type="search" placeholder="搜索题目" />
      </label>
    </div>

    <div class="practice-layout">
      <aside class="question-sidebar panel">
        <div class="progress-block">
          <div class="progress-label">
            <span>总进度</span><strong>{{ completionRate }}%</strong>
          </div>
          <div class="progress-track"><span :style="{ width: `${completionRate}%` }" /></div>
        </div>
        <div class="question-list">
          <button
            v-for="question in filteredQuestions"
            :key="question.id"
            type="button"
            :class="{ active: activeQuestion.id === question.id }"
            @click="selectQuestion(question.id)"
          >
            <CheckCircle2 v-if="progress[question.id]?.completed" :size="17" class="done-icon" />
            <Circle v-else :size="17" />
            <span>
              <strong>{{ question.title }}</strong>
              <small>{{ question.category }} · {{ question.difficulty }}</small>
            </span>
          </button>
          <div v-if="!filteredQuestions.length" class="no-questions">没有匹配的题目</div>
        </div>
        <button class="reset-progress" type="button" @click="resetAllProgress">
          <RotateCcw :size="14" /> 重置进度
        </button>
      </aside>

      <main class="question-panel panel">
        <header class="question-header">
          <div class="question-meta">
            <span class="kind-badge">
              <Code2 v-if="activeQuestion.kind === 'code'" :size="13" />
              <ListChecks v-else-if="activeQuestion.kind === 'choice'" :size="13" />
              <CircleHelp v-else :size="13" />
              {{
                activeQuestion.kind === 'code'
                  ? '编程题'
                  : activeQuestion.kind === 'choice'
                    ? '选择题'
                    : '简答题'
              }}
            </span>
            <span :class="`difficulty-${activeQuestion.difficulty}`">{{
              activeQuestion.difficulty
            }}</span>
            <span class="question-number"
              >{{ String(activeIndex + 1).padStart(2, '0') }} / {{ questions.length }}</span
            >
          </div>
          <h2>{{ activeQuestion.title }}</h2>
          <p>{{ activeQuestion.prompt }}</p>
        </header>

        <section class="answer-section">
          <div v-if="activeQuestion.kind === 'choice'" class="choice-list">
            <label
              v-for="option in activeQuestion.options"
              :key="option.id"
              :class="{ selected: answer === option.id }"
            >
              <input v-model="answer" type="radio" :value="option.id" />
              <span class="choice-letter">{{ option.id.toUpperCase() }}</span>
              <span>{{ option.text }}</span>
              <Check v-if="answer === option.id" :size="17" />
            </label>
          </div>

          <textarea
            v-else-if="activeQuestion.kind === 'short'"
            v-model="answer"
            class="short-answer"
            maxlength="12000"
            placeholder="在这里组织你的答案…"
            aria-label="简答题答案"
          />

          <div v-else class="code-answer">
            <div class="code-answer-toolbar">
              <span class="mono">answer.ts</span>
              <button type="button" title="重置代码" aria-label="重置代码" @click="resetCodeAnswer">
                <RotateCcw :size="15" />
              </button>
            </div>
            <div class="practice-editor">
              <CodeEditor v-model="answer" language="typescript" @execute="runCodeAnswer" />
            </div>
            <details v-if="activeQuestion.hint" class="hint-box">
              <summary>查看提示</summary>
              <p>{{ activeQuestion.hint }}</p>
            </details>
            <div
              v-if="
                runner.logs.value.length ||
                runner.diagnostics.value.length ||
                runner.status.value !== 'idle'
              "
              class="practice-output"
            >
              <OutputConsole
                :logs="runner.logs.value"
                :diagnostics="runner.diagnostics.value"
                :status="runner.status.value"
                :duration="runner.duration.value"
                @clear="runner.clear"
              />
            </div>
          </div>

          <div v-if="localFeedback" class="local-feedback" :class="localFeedback.type">
            <CheckCircle2 v-if="localFeedback.type === 'success'" :size="16" />
            <XCircle v-else-if="localFeedback.type === 'error'" :size="16" />
            <CircleHelp v-else :size="16" />
            {{ localFeedback.text }}
          </div>

          <div class="answer-actions">
            <AppButton
              variant="primary"
              :icon="activeQuestion.kind === 'code' ? Play : Send"
              :disabled="runner.isRunning.value"
              @click="submitAnswer"
            >
              {{ activeQuestion.kind === 'code' ? '运行测试' : '提交答案' }}
            </AppButton>
            <AppButton
              v-if="canReview"
              :icon="Sparkles"
              :loading="reviewLoading"
              @click="reviewAnswer"
            >
              AI 审查
            </AppButton>
            <RouterLink v-else class="configure-ai-link" to="/settings"
              ><Bot :size="16" /> 配置 AI 审查</RouterLink
            >
          </div>

          <p v-if="reviewError" class="review-error">{{ reviewError }}</p>
          <AiReviewPanel v-if="review" :review="review" />

          <section v-if="activeProgress?.completed" class="reference-answer">
            <span>REFERENCE</span>
            <h3>参考解析</h3>
            <p>{{ activeQuestion.referenceAnswer }}</p>
            <div class="key-points">
              <span v-for="point in activeQuestion.keyPoints" :key="point">{{ point }}</span>
            </div>
          </section>
        </section>

        <footer class="question-footer">
          <AppButton :icon="ChevronLeft" :disabled="activeIndex === 0" @click="moveQuestion(-1)"
            >上一题</AppButton
          >
          <AppButton :disabled="activeIndex === questions.length - 1" @click="moveQuestion(1)">
            下一题 <ChevronRight :size="17" />
          </AppButton>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
.practice-page {
  width: min(1350px, 100%);
  margin: 0 auto;
}

.progress-summary {
  display: flex;
  gap: 8px;
}

.progress-summary span {
  padding: 8px 10px;
  color: var(--ink-soft);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 5px;
  font-size: 11px;
  white-space: nowrap;
}

.progress-summary strong {
  color: var(--green-dark);
  font:
    600 13px/1 'DM Mono',
    monospace;
}

.practice-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.category-tabs {
  display: flex;
  gap: 4px;
  padding: 3px;
  overflow-x: auto;
  background: #e5e9e4;
  border-radius: 6px;
}

.category-tabs button {
  height: 33px;
  padding: 0 12px;
  color: var(--ink-soft);
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}

.category-tabs button.active {
  color: var(--ink);
  background: #ffffff;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

.question-search {
  display: flex;
  width: 220px;
  height: 40px;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  color: var(--ink-soft);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 6px;
}

.question-search input {
  min-width: 0;
  flex: 1;
  background: transparent;
  border: 0;
  outline: 0;
  font-size: 12px;
}

.practice-layout {
  display: grid;
  align-items: start;
  grid-template-columns: 290px minmax(0, 1fr);
  gap: 16px;
}

.question-sidebar {
  position: sticky;
  top: 18px;
  max-height: calc(100vh - 36px);
  overflow: hidden;
}

.progress-block {
  padding: 17px 16px;
  border-bottom: 1px solid var(--line);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
  color: var(--ink-soft);
  font-size: 11px;
}

.progress-label strong {
  color: var(--ink);
  font-family: 'DM Mono', monospace;
}

.progress-track {
  height: 5px;
  overflow: hidden;
  background: #dfe5df;
  border-radius: 3px;
}

.progress-track span {
  display: block;
  height: 100%;
  background: var(--green);
  transition: width 220ms ease;
}

.question-list {
  max-height: calc(100vh - 185px);
  padding: 7px;
  overflow-y: auto;
}

.question-list button {
  display: grid;
  width: 100%;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 8px;
  padding: 10px 9px;
  color: #77857c;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  text-align: left;
}

.question-list button:hover {
  background: var(--surface-muted);
}

.question-list button.active {
  color: var(--green-dark);
  background: #e7f2eb;
  border-color: #c6ddcf;
}

.question-list button > svg {
  margin-top: 2px;
}

.question-list .done-icon {
  color: var(--green);
}

.question-list button span {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.question-list button strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 12px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-list button small {
  color: var(--ink-soft);
  font-size: 10px;
}

.no-questions {
  padding: 40px 12px;
  color: var(--ink-soft);
  font-size: 12px;
  text-align: center;
}

.reset-progress {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ink-soft);
  background: #fafbfa;
  border: 0;
  border-top: 1px solid var(--line);
  cursor: pointer;
  font-size: 11px;
}

.question-panel {
  overflow: hidden;
}

.question-header {
  padding: 27px 30px 25px;
  background: #fbfcfa;
  border-bottom: 1px solid var(--line);
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 13px;
}

.question-meta > span {
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.kind-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #325f83;
  background: #e4eff7;
}

.difficulty-基础 {
  color: var(--green-dark);
  background: #dff1e7;
}

.difficulty-进阶 {
  color: #835c17;
  background: #f7eacb;
}

.difficulty-高级 {
  color: #9c3c2b;
  background: #f8dfda;
}

.question-number {
  margin-left: auto;
  color: var(--ink-soft);
  background: transparent;
  font-family: 'DM Mono', monospace;
}

.question-header h2 {
  margin: 0;
  font-size: 23px;
  line-height: 1.35;
}

.question-header p {
  margin: 11px 0 0;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.75;
}

.answer-section {
  padding: 26px 30px 30px;
}

.choice-list {
  display: grid;
  gap: 9px;
}

.choice-list label {
  display: grid;
  min-height: 52px;
  align-items: center;
  grid-template-columns: 30px minmax(0, 1fr) 20px;
  gap: 10px;
  padding: 8px 13px;
  color: var(--ink-soft);
  background: #fafbfa;
  border: 1px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.choice-list label:hover,
.choice-list label.selected {
  color: var(--ink);
  background: #edf6f0;
  border-color: #a9cbb6;
}

.choice-list input {
  position: absolute;
  opacity: 0;
}

.choice-letter {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--ink-soft);
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 4px;
  font:
    500 11px/1 'DM Mono',
    monospace;
}

.choice-list label.selected .choice-letter {
  color: #ffffff;
  background: var(--green);
  border-color: var(--green);
}

.choice-list label > svg {
  color: var(--green);
}

.short-answer {
  display: block;
  width: 100%;
  min-height: 210px;
  padding: 15px;
  resize: vertical;
  color: var(--ink);
  background: #fafbfa;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.75;
}

.code-answer {
  overflow: hidden;
  background: #101713;
  border: 1px solid #2d3b33;
  border-radius: 7px;
}

.code-answer-toolbar {
  display: flex;
  height: 41px;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 14px;
  color: #9caaa1;
  border-bottom: 1px solid #2d3b33;
  font-size: 11px;
}

.code-answer-toolbar button {
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  color: inherit;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

.code-answer-toolbar button:hover {
  color: #ffffff;
  background: #242e28;
}

.practice-editor {
  height: 340px;
}

.hint-box {
  color: #bdc8c0;
  border-top: 1px solid #2d3b33;
}

.hint-box summary {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 11px;
}

.hint-box p {
  margin: 0;
  padding: 0 14px 13px;
  color: #93a298;
  font-size: 11px;
}

.practice-output {
  height: 210px;
  border-top: 1px solid #2d3b33;
}

.local-feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid;
  border-radius: 5px;
  font-size: 12px;
}

.local-feedback.success {
  color: var(--green-dark);
  background: #e8f4ec;
  border-color: #c0ddca;
}

.local-feedback.error,
.review-error {
  color: #9d3322;
  background: #fff0ed;
  border-color: #e8b6ac;
}

.local-feedback.info {
  color: #315c7d;
  background: #eaf2f7;
  border-color: #c5d8e5;
}

.answer-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 18px;
}

.configure-ai-link {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  color: var(--ink);
  background: #ffffff;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}

.review-error {
  margin: 12px 0 0;
  padding: 9px 11px;
  border: 1px solid;
  border-radius: 5px;
  font-size: 12px;
}

.reference-answer {
  margin-top: 22px;
  padding: 18px;
  background: #f6f2e8;
  border-left: 3px solid var(--amber);
  border-radius: 5px;
}

.reference-answer > span {
  color: #956818;
  font:
    500 9px/1.4 'DM Mono',
    monospace;
}

.reference-answer h3 {
  margin: 3px 0 8px;
  font-size: 14px;
}

.reference-answer p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.75;
}

.key-points {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 13px;
}

.key-points span {
  padding: 4px 7px;
  color: #72551f;
  background: rgb(255 255 255 / 65%);
  border: 1px solid #e0cfaa;
  border-radius: 4px;
  font-size: 10px;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fafbfa;
  border-top: 1px solid var(--line);
}

@media (max-width: 1050px) {
  .practice-layout {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .question-header,
  .answer-section {
    padding-right: 22px;
    padding-left: 22px;
  }
}

@media (max-width: 820px) {
  .practice-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .question-search {
    width: 100%;
  }

  .practice-layout {
    grid-template-columns: 1fr;
  }

  .question-sidebar {
    position: static;
    max-height: 260px;
  }

  .question-list {
    max-height: 150px;
  }
}

@media (max-width: 560px) {
  .progress-summary {
    width: 100%;
  }

  .progress-summary span {
    flex: 1;
    text-align: center;
  }

  .question-header,
  .answer-section {
    padding-right: 16px;
    padding-left: 16px;
  }

  .question-header h2 {
    font-size: 20px;
  }

  .answer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .configure-ai-link {
    justify-content: center;
  }

  .practice-editor {
    height: 400px;
  }
}
</style>
