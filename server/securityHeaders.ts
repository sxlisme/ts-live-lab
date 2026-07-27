import type { RequestHandler } from 'express'
import helmet from 'helmet'

const CODE_RUNNER_WORKER_PATH = /^\/assets\/codeRunner\.worker-[A-Za-z0-9_-]+\.js$/
const PREVIEW_SANDBOX_PATH = '/preview-sandbox.html'

export function isCodeRunnerWorkerPath(path: string) {
  return CODE_RUNNER_WORKER_PATH.test(path)
}

export function isPreviewSandboxPath(path: string) {
  return path === PREVIEW_SANDBOX_PATH
}

export function contentSecurityPolicyDirectives(httpsOnly: boolean, allowEval: boolean) {
  return {
    'script-src': allowEval ? ["'self'", "'unsafe-eval'"] : ["'self'"],
    'worker-src': ["'self'"],
    'upgrade-insecure-requests': httpsOnly ? [] : null,
  }
}

export function createContentSecurityPolicy(httpsOnly: boolean): RequestHandler {
  const pagePolicy = helmet.contentSecurityPolicy({
    directives: contentSecurityPolicyDirectives(httpsOnly, false),
  })
  const codeRunnerWorkerPolicy = helmet.contentSecurityPolicy({
    directives: contentSecurityPolicyDirectives(httpsOnly, true),
  })
  const previewSandboxPolicy = helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'unsafe-inline'"],
      styleSrc: ["'unsafe-inline'"],
      imgSrc: ['data:', 'blob:'],
      fontSrc: ['data:'],
      mediaSrc: ['data:', 'blob:'],
      connectSrc: ["'none'"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: httpsOnly ? [] : null,
    },
  })

  return (request, response, next) => {
    const policy = isPreviewSandboxPath(request.path)
      ? previewSandboxPolicy
      : isCodeRunnerWorkerPath(request.path)
        ? codeRunnerWorkerPolicy
        : pagePolicy
    policy(request, response, next)
  }
}
