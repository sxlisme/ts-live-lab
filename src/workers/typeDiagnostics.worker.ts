/// <reference lib="webworker" />

import { TypeScriptDiagnosticsService } from '@/domain/runner/typeDiagnostics'
import type {
  TypeDiagnosticsWorkerRequest,
  TypeDiagnosticsWorkerResponse,
} from '@/types/runner'

const workerScope = self as DedicatedWorkerGlobalScope
const service = new TypeScriptDiagnosticsService()

workerScope.onmessage = (event: MessageEvent<TypeDiagnosticsWorkerRequest>) => {
  const { requestId, code, language } = event.data
  const response: TypeDiagnosticsWorkerResponse = {
    type: 'diagnostics',
    requestId,
    diagnostics: service.getDiagnostics(code, language),
  }
  workerScope.postMessage(response)
}

export {}
