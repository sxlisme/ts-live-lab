<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import { Check, Copy } from 'lucide-vue-next'
import { computed, ref } from 'vue'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)

const props = withDefaults(
  defineProps<{
    title: string
    code: string
    language?: 'typescript' | 'javascript' | 'json'
  }>(),
  { language: 'typescript' },
)
const copied = ref(false)
const highlightedCode = computed(
  () => hljs.highlight(props.code, { language: props.language }).value,
)
const languageLabel = computed(() => {
  const labels = { typescript: 'TS', javascript: 'JS', json: 'JSON' }
  return labels[props.language]
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1_500)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <figure class="code-block">
    <figcaption>
      <span
        ><b>{{ languageLabel }}</b
        >{{ title }}</span
      >
      <button
        type="button"
        :title="copied ? '已复制' : '复制代码'"
        :aria-label="copied ? '已复制' : '复制代码'"
        @click="copyCode"
      >
        <Check v-if="copied" :size="15" />
        <Copy v-else :size="15" />
      </button>
    </figcaption>
    <!-- eslint-disable-next-line vue/no-v-html -- Highlight.js escapes trusted local source. -->
    <pre><code v-html="highlightedCode" /></pre>
  </figure>
</template>

<style scoped>
.code-block {
  margin: 20px 0;
  overflow: hidden;
  color: #e5ece7;
  background: #111713;
  border: 1px solid #2c3831;
  border-radius: 7px;
}

figcaption {
  display: flex;
  height: 41px;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 0 14px;
  color: #96a49b;
  border-bottom: 1px solid #2c3831;
  font-size: 11px;
}

figcaption > span {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

figcaption b {
  padding: 3px 5px;
  color: #b8cfbf;
  background: #26322b;
  border-radius: 3px;
  font:
    600 9px/1 'DM Mono',
    monospace;
}

button {
  display: grid;
  width: 30px;
  height: 30px;
  padding: 0;
  place-items: center;
  color: #96a49b;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  color: #ffffff;
  background: #253029;
}

pre {
  margin: 0;
  padding: 17px 19px 21px;
  overflow: auto;
}

code {
  font:
    400 12px/1.75 'DM Mono',
    ui-monospace,
    monospace;
  tab-size: 2;
}

code :deep(.hljs-keyword),
code :deep(.hljs-selector-tag),
code :deep(.hljs-literal) {
  color: #8fc6a9;
}

code :deep(.hljs-title.function_),
code :deep(.hljs-function .hljs-title) {
  color: #e2c47f;
}

code :deep(.hljs-title.class_),
code :deep(.hljs-type),
code :deep(.hljs-built_in) {
  color: #d9b276;
}

code :deep(.hljs-string),
code :deep(.hljs-template-variable) {
  color: #b9ca91;
}

code :deep(.hljs-number),
code :deep(.hljs-symbol) {
  color: #dda077;
}

code :deep(.hljs-property),
code :deep(.hljs-attr),
code :deep(.hljs-params) {
  color: #b2d0c0;
}

code :deep(.hljs-comment),
code :deep(.hljs-quote) {
  color: #718077;
  font-style: italic;
}

code :deep(.hljs-meta),
code :deep(.hljs-doctag) {
  color: #c0a578;
}
</style>
