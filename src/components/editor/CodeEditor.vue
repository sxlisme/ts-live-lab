<script setup lang="ts">
import type {
  EditorLanguage,
  TypeDiagnosticsWorkerRequest,
  TypeDiagnosticsWorkerResponse,
} from '@/types/runner'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import {
  lintGutter,
  lintKeymap,
  linter,
  type Diagnostic as CodeMirrorDiagnostic,
} from '@codemirror/lint'
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
let diagnosticsWorker: Worker | null = null
let diagnosticRequestId = 0
const pendingDiagnostics = new Map<
  number,
  (diagnostics: readonly CodeMirrorDiagnostic[]) => void
>()

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
    '.cm-activeLine': { backgroundColor: 'rgb(116 163 139 / 10%)' },
    '.cm-activeLineGutter': { backgroundColor: '#18231d' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
      backgroundColor: '#315744 !important',
    },
    '.cm-line::selection, .cm-line *::selection': { color: '#f4fbf7' },
    '.cm-cursor': { borderLeftColor: '#9fe3c2' },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-tooltip': { border: '1px solid #39483f', backgroundColor: '#1a241e' },
    '.cm-tooltip-lint': { maxWidth: 'min(520px, calc(100vw - 32px))' },
    '.cm-diagnosticText': {
      color: '#eef4f0',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      lineHeight: '1.5',
    },
    '.cm-lintRange-error': {
      backgroundImage: 'none',
      textDecoration: 'underline wavy #ff716a',
      textDecorationThickness: '1.5px',
      textUnderlineOffset: '3px',
    },
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
      linter(requestDiagnostics, { delay: 350 }),
      lintGutter({ hoverTime: 150 }),
      editorTheme,
      syntaxHighlighting(editorHighlightStyle),
      EditorState.readOnly.of(props.readOnly),
      EditorView.contentAttributes.of({ 'aria-label': props.ariaLabel }),
      keymap.of([
        ...lintKeymap,
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

function requestDiagnostics(editor: EditorView): Promise<readonly CodeMirrorDiagnostic[]> {
  if (props.language !== 'typescript' && props.language !== 'javascript') {
    return Promise.resolve([])
  }

  if (!diagnosticsWorker) {
    diagnosticsWorker = new Worker(new URL('../../workers/typeDiagnostics.worker.ts', import.meta.url), {
      type: 'module',
    })
    diagnosticsWorker.onmessage = (event: MessageEvent<TypeDiagnosticsWorkerResponse>) => {
      const response = event.data
      const resolve = pendingDiagnostics.get(response.requestId)
      if (!resolve) return
      pendingDiagnostics.delete(response.requestId)
      resolve(
        response.diagnostics.map((item) => ({
          from: item.from,
          to: item.to,
          severity: 'error',
          source: `TypeScript TS${item.code}`,
          message: item.message,
        })),
      )
    }
    diagnosticsWorker.onerror = () => {
      for (const resolve of pendingDiagnostics.values()) resolve([])
      pendingDiagnostics.clear()
    }
  }

  const requestId = ++diagnosticRequestId
  return new Promise((resolve) => {
    pendingDiagnostics.set(requestId, resolve)
    const request: TypeDiagnosticsWorkerRequest = {
      type: 'check',
      requestId,
      code: editor.state.doc.toString(),
      language: props.language,
    }
    diagnosticsWorker!.postMessage(request)
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

onBeforeUnmount(() => {
  view?.destroy()
  diagnosticsWorker?.terminate()
  for (const resolve of pendingDiagnostics.values()) resolve([])
  pendingDiagnostics.clear()
})
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
