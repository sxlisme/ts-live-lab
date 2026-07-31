export type RunnerLanguage = 'typescript' | 'javascript'
export type EditorLanguage = RunnerLanguage | 'html' | 'css'
export type RunnerStatus =
  'idle' | 'compiling' | 'running' | 'success' | 'error' | 'timeout' | 'stopped'
export type ConsoleLevel = 'log' | 'info' | 'warn' | 'error'

export interface ConsoleEntry {
  id: number
  level: ConsoleLevel
  text: string
  timestamp: number
}

export type WorkerResponse =
  | { type: 'status'; runId: string; status: 'compiling' | 'running' }
  | { type: 'log'; runId: string; entry: ConsoleEntry }
  | { type: 'error'; runId: string; message: string; diagnostics?: string[] }
  | { type: 'done'; runId: string; duration: number }

export interface WorkerRequest {
  type: 'run'
  runId: string
  code: string
  language: RunnerLanguage
}

export interface TypeDiagnostic {
  from: number
  to: number
  line: number
  column: number
  code: number
  message: string
}

export interface TypeDiagnosticsWorkerRequest {
  type: 'check'
  requestId: number
  code: string
  language: EditorLanguage
}

export interface TypeDiagnosticsWorkerResponse {
  type: 'diagnostics'
  requestId: number
  diagnostics: TypeDiagnostic[]
}
