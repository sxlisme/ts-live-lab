<script setup lang="ts">
import type { EditorLanguage } from '@/types/runner'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import { basicSetup } from 'codemirror'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: EditorLanguage
    readOnly?: boolean
    ariaLabel?: string
  }>(),
  {
    language: 'typescript',
    readOnly: false,
    ariaLabel: '代码编辑器',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  execute: []
}>()

const editorHost = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

const editorTheme = EditorView.theme(
  {
    '&': {
      height: '100%',
      color: '#e7eee9',
      backgroundColor: '#101713',
      fontSize: '14px',
    },
    '.cm-content': {
      padding: '16px 0 40px',
      caretColor: '#9fe3c2',
      fontFamily: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
      lineHeight: '1.75',
    },
    '.cm-gutters': {
      color: '#68776e',
      backgroundColor: '#101713',
      border: 'none',
      paddingLeft: '6px',
    },
    '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#18231d' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: '#315744 !important',
    },
    '.cm-cursor': { borderLeftColor: '#9fe3c2' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-tooltip': { border: '1px solid #39483f', backgroundColor: '#1a241e' },
  },
  { dark: true },
)

const editorHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.modifier, tags.controlKeyword], color: '#8fc6a9' },
  { tag: [tags.typeName, tags.className, tags.namespace], color: '#d9b276' },
  { tag: tags.tagName, color: '#8fc6a9' },
  { tag: [tags.attributeName, tags.className], color: '#d9b276' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#e2c47f' },
  { tag: [tags.definition(tags.variableName), tags.labelName], color: '#c8ddd1' },
  { tag: tags.variableName, color: '#e2e9e4' },
  { tag: tags.propertyName, color: '#b2d0c0' },
  { tag: [tags.string, tags.special(tags.string)], color: '#b9ca91' },
  { tag: [tags.number, tags.bool, tags.null], color: '#dda077' },
  { tag: [tags.regexp, tags.escape], color: '#d89183' },
  { tag: [tags.operator, tags.logicOperator, tags.compareOperator], color: '#a9b9af' },
  { tag: [tags.punctuation, tags.bracket], color: '#b9c2bc' },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment],
    color: '#718077',
    fontStyle: 'italic',
  },
  { tag: [tags.meta, tags.annotation], color: '#c0a578' },
  { tag: tags.invalid, color: '#f0a08f', textDecoration: 'underline' },
])

function createState(document: string) {
  return EditorState.create({
    doc: document,
    extensions: [
      basicSetup,
      languageExtension(props.language),
      editorTheme,
      syntaxHighlighting(editorHighlightStyle),
      EditorState.readOnly.of(props.readOnly),
      EditorView.contentAttributes.of({ 'aria-label': props.ariaLabel }),
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => {
            emit('execute')
            return true
          },
        },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
      }),
    ],
  })
}

function languageExtension(language: EditorLanguage) {
  if (language === 'html') return html()
  if (language === 'css') return css()
  return javascript({ typescript: language === 'typescript' })
}

onMounted(() => {
  if (!editorHost.value) return
  view = new EditorView({ state: createState(props.modelValue), parent: editorHost.value })
})

watch(
  () => props.modelValue,
  (value) => {
    if (!view || value === view.state.doc.toString()) return
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } })
  },
)

watch(
  () => [props.language, props.readOnly] as const,
  () => {
    if (!view) return
    const document = view.state.doc.toString()
    view.setState(createState(document))
  },
)

onBeforeUnmount(() => view?.destroy())
</script>

<template>
  <div ref="editorHost" class="code-editor" />
</template>

<style scoped>
.code-editor {
  width: 100%;
  max-width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.code-editor :deep(.cm-editor),
.code-editor :deep(.cm-scroller) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}
</style>
