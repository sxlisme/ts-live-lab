export interface PreviewSource {
  html: string
  css: string
  javascript: string
}

export interface PreviewConsoleEntry {
  id: number
  level: 'log' | 'info' | 'warn' | 'error'
  text: string
}

export interface PreviewMessage {
  marker: 'typeroom-preview'
  previewId: string
  type: 'ready' | 'heartbeat' | 'console' | 'error'
  level?: PreviewConsoleEntry['level']
  text?: string
}
