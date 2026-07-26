<script setup lang="ts">
import type { PreviewMessage } from '@/types/preview'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  sourceDocument: string
  previewId: string
}>()

const emit = defineEmits<{
  message: [message: PreviewMessage]
  timeout: []
  loaded: []
}>()

const frame = ref<HTMLIFrameElement | null>(null)
let watchdogId: number | null = null
let startedAt = 0
let lastHeartbeat = 0
let timedOut = false

function loadDocument() {
  if (!frame.value) return
  timedOut = false
  startedAt = Date.now()
  lastHeartbeat = 0
  frame.value.srcdoc = props.sourceDocument
}

function onMessage(event: MessageEvent<unknown>) {
  if (event.source !== frame.value?.contentWindow) return
  if (!event.data || typeof event.data !== 'object') return
  const message = event.data as Partial<PreviewMessage>
  if (message.marker !== 'typeroom-preview' || message.previewId !== props.previewId) return
  if (!message.type) return
  if (message.type === 'heartbeat' || message.type === 'ready') lastHeartbeat = Date.now()
  emit('message', message as PreviewMessage)
}

function checkHeartbeat() {
  if (timedOut || !startedAt) return
  const lastSignal = lastHeartbeat || startedAt
  if (Date.now() - lastSignal <= 2_200) return
  timedOut = true
  if (frame.value) {
    frame.value.srcdoc = '<!doctype html><body></body>'
  }
  emit('timeout')
}

watch(() => props.sourceDocument, loadDocument)

onMounted(() => {
  window.addEventListener('message', onMessage)
  watchdogId = window.setInterval(checkHeartbeat, 300)
  loadDocument()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  if (watchdogId !== null) window.clearInterval(watchdogId)
})
</script>

<template>
  <iframe
    ref="frame"
    class="preview-frame"
    sandbox="allow-scripts"
    title="网页预览"
    @load="$emit('loaded')"
  />
</template>

<style scoped>
.preview-frame {
  display: block;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border: 0;
}
</style>
