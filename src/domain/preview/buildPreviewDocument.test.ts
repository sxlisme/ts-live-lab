import {
  buildPreviewDocument,
  instrumentPreviewJavaScript,
  sanitizePreviewHtml,
} from './buildPreviewDocument'

describe('web preview document', () => {
  it('removes scripts, nested frames, and inline event handlers from HTML', () => {
    const source = sanitizePreviewHtml(`
      <button onclick="fetch('/attack')">Run</button>
      <script>parent.location = 'https://example.com'</script>
      <iframe src="https://example.com"></iframe>
    `)

    expect(source).toContain('<button>Run</button>')
    expect(source).not.toContain('onclick')
    expect(source).not.toContain('<script')
    expect(source).not.toContain('<iframe')
  })

  it('injects a restrictive CSP and escapes closing tags in editable source', () => {
    const document = buildPreviewDocument(
      {
        html: '<main>Preview</main>',
        css: 'body::after { content: "</style>"; }',
        javascript: 'console.log("</script>")',
      },
      'preview-1',
    )

    expect(document).toContain("default-src 'none'")
    expect(document).toContain("connect-src 'none'")
    expect(document).toContain('预览沙箱内禁止使用')
    expect(document).not.toContain('content: "</style>"')
    expect(document).not.toContain('console.log("</script>")')
  })

  it('injects a time guard into every JavaScript loop body', () => {
    const result = instrumentPreviewJavaScript(
      'for (;;) work(); while (ready) { work() } for (const item of items) work(item)',
      'loop-test',
    )

    expect(result.code.match(/__typeroom_guard_loop_test\(\)/g)).toHaveLength(3)
    expect(result.code).toContain('for (;;) {__typeroom_guard_loop_test();work();}')
  })
})
