import type { RequestHandler } from 'express'
import helmet from 'helmet'

const CODE_RUNNER_WORKER_PATH = /^\/assets\/codeRunner\.worker-[A-Za-z0-9_-]+\.js$/

export function isCodeRunnerWorkerPath(path: string) {
  return CODE_RUNNER_WORKER_PATH.test(path)
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

  return (request, response, next) => {
    const policy = isCodeRunnerWorkerPath(request.path) ? codeRunnerWorkerPolicy : pagePolicy
    policy(request, response, next)
  }
}
