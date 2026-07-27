import {
  contentSecurityPolicyDirectives,
  isCodeRunnerWorkerPath,
  isPreviewSandboxPath,
} from './securityHeaders'

describe('security headers', () => {
  it('recognizes only the hashed production code runner worker path', () => {
    expect(isCodeRunnerWorkerPath('/assets/codeRunner.worker-CrUQCbYT.js')).toBe(true)
    expect(isCodeRunnerWorkerPath('/assets/codeRunner.worker.js')).toBe(false)
    expect(isCodeRunnerWorkerPath('/assets/index-CrUQCbYT.js')).toBe(false)
    expect(isCodeRunnerWorkerPath('/api/codeRunner.worker-CrUQCbYT.js')).toBe(false)
  })

  it('matches only the dedicated preview sandbox document', () => {
    expect(isPreviewSandboxPath('/preview-sandbox.html')).toBe(true)
    expect(isPreviewSandboxPath('/preview-sandbox.html.js')).toBe(false)
    expect(isPreviewSandboxPath('/assets/preview-sandbox.html')).toBe(false)
  })

  it('keeps unsafe-eval disabled for the main application policy', () => {
    const directives = contentSecurityPolicyDirectives(false, false)

    expect(directives['script-src']).toEqual(["'self'"])
    expect(directives['worker-src']).toEqual(["'self'"])
    expect(directives['upgrade-insecure-requests']).toBeNull()
  })

  it('allows eval only for the code runner worker policy', () => {
    const directives = contentSecurityPolicyDirectives(false, true)

    expect(directives['script-src']).toEqual(["'self'", "'unsafe-eval'"])
  })

  it('restores HTTPS upgrades when HTTPS-only mode is enabled', () => {
    const directives = contentSecurityPolicyDirectives(true, false)

    expect(directives['upgrade-insecure-requests']).toEqual([])
  })
})
