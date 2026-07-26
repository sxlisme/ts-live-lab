<script setup lang="ts">
import type { AiReview } from '@/types/ai'
import { CheckCircle2, Lightbulb, SearchX, Sparkles } from 'lucide-vue-next'

defineProps<{ review: AiReview }>()
</script>

<template>
  <section class="ai-review">
    <header class="review-header">
      <div>
        <span><Sparkles :size="15" /> CLAUDE REVIEW</span>
        <h3>答案审查</h3>
      </div>
      <strong>{{ review.score }}<small>/100</small></strong>
    </header>
    <p class="review-summary">{{ review.summary }}</p>
    <div class="review-columns">
      <div v-if="review.strengths.length" class="review-group strengths">
        <h4><CheckCircle2 :size="15" /> 做得好的地方</h4>
        <ul>
          <li v-for="item in review.strengths" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div v-if="review.issues.length" class="review-group issues">
        <h4><SearchX :size="15" /> 需要修正</h4>
        <ul>
          <li v-for="item in review.issues" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div v-if="review.suggestions.length" class="review-group suggestions">
        <h4><Lightbulb :size="15" /> 改进建议</h4>
        <ul>
          <li v-for="item in review.suggestions" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ai-review {
  margin-top: 20px;
  padding: 20px;
  background: #f2f8f4;
  border: 1px solid #c7ddce;
  border-radius: 7px;
}

.review-header,
.review-header span,
.review-group h4 {
  display: flex;
  align-items: center;
}

.review-header {
  justify-content: space-between;
  gap: 20px;
}

.review-header span {
  gap: 6px;
  color: var(--green);
  font:
    500 10px/1.4 'DM Mono',
    monospace;
}

.review-header h3 {
  margin: 4px 0 0;
  font-size: 17px;
}

.review-header > strong {
  color: var(--green-dark);
  font:
    600 31px/1 'DM Mono',
    monospace;
}

.review-header small {
  color: var(--ink-soft);
  font-size: 11px;
}

.review-summary {
  margin: 14px 0 18px;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.7;
}

.review-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.review-group {
  padding: 13px 14px;
  background: rgb(255 255 255 / 72%);
  border-left: 3px solid;
  border-radius: 4px;
}

.review-group h4 {
  gap: 7px;
  margin: 0;
  font-size: 12px;
}

.review-group ul {
  margin: 10px 0 0;
  padding-left: 17px;
  color: var(--ink-soft);
  font-size: 12px;
  line-height: 1.7;
}

.strengths {
  border-color: var(--green);
}

.issues {
  border-color: var(--coral);
}

.suggestions {
  grid-column: 1 / -1;
  border-color: var(--amber);
}

@media (max-width: 640px) {
  .review-columns {
    grid-template-columns: 1fr;
  }

  .suggestions {
    grid-column: auto;
  }
}
</style>
