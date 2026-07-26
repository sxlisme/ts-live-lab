import type { PreviewSource } from '@/types/preview'
import { parse, type Node } from 'acorn'
import { full } from 'acorn-walk'
import MagicString from 'magic-string'

const BLOCKED_ELEMENTS = 'script, iframe, frame, object, embed, link, base, meta[http-equiv]'

export function sanitizePreviewHtml(source: string) {
  const parsed = new DOMParser().parseFromString(`<body>${source}</body>`, 'text/html')
  parsed.body.querySelectorAll(BLOCKED_ELEMENTS).forEach((element) => element.remove())
  parsed.body.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.toLowerCase().startsWith('on')) element.removeAttribute(attribute.name)
    }
  })
  return parsed.body.innerHTML
}

function escapeClosingTag(source: string, tag: 'script' | 'style') {
  return source.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`)
}

interface LoopNode extends Node {
  body: Node
}

const LOOP_TYPES = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
])

export function instrumentPreviewJavaScript(source: string, previewId: string) {
  if (source.length > 100_000) throw new Error('JavaScript 不能超过 100,000 个字符。')
  const ast = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    allowAwaitOutsideFunction: true,
  })
  const guardName = `__typeroom_guard_${previewId.replace(/[^a-z0-9]/gi, '_')}`
  const output = new MagicString(source)
  const loops: LoopNode[] = []

  full(ast, (node) => {
    if (LOOP_TYPES.has(node.type) && 'body' in node) loops.push(node as LoopNode)
  })

  for (const loop of loops) {
    if (loop.body.type === 'BlockStatement') {
      output.appendLeft(loop.body.start + 1, `\n${guardName}();`)
    } else {
      output.appendLeft(loop.body.start, `{${guardName}();`)
      output.appendRight(loop.body.end, '}')
    }
  }

  return { code: output.toString(), guardName }
}

function createBootstrap(previewId: string, guardName: string) {
  return `(() => {
  'use strict'
  const previewId = ${JSON.stringify(previewId)}
  const send = (type, payload = {}) => parent.postMessage({
    marker: 'typeroom-preview', previewId, type, ...payload
  }, '*')
  const serialize = (value) => {
    if (typeof value === 'string') return value
    if (value instanceof Error) return value.name + ': ' + value.message
    try {
      const seen = new WeakSet()
      return JSON.stringify(value, (key, item) => {
        if (typeof item === 'bigint') return String(item) + 'n'
        if (typeof item === 'object' && item !== null) {
          if (seen.has(item)) return '[Circular]'
          seen.add(item)
        }
        return item
      }, 2)
    } catch { return String(value) }
  }
  for (const level of ['log', 'info', 'warn', 'error']) {
    const original = console[level].bind(console)
    console[level] = (...values) => {
      original(...values)
      send('console', { level, text: values.map(serialize).join(' ').slice(0, 4000) })
    }
  }
  const blocked = (name) => () => { throw new Error('预览沙箱内禁止使用 ' + name) }
  for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'eval', 'Function']) {
    try { Object.defineProperty(globalThis, name, { value: blocked(name), writable: false }) } catch {}
  }
  let guardDeadline = performance.now() + 1600
  let guardOperations = 0
  setInterval(() => {
    guardDeadline = performance.now() + 1600
    guardOperations = 0
  }, 50)
  globalThis.${guardName} = () => {
    guardOperations += 1
    if ((guardOperations & 255) === 0 && performance.now() > guardDeadline) {
      throw new Error('预览执行超过 1.6 秒，已终止可能的死循环。')
    }
  }
  addEventListener('error', event => send('error', { text: event.message || '运行错误' }))
  addEventListener('unhandledrejection', event => send('error', { text: serialize(event.reason) }))
  setInterval(() => send('heartbeat'), 400)
  send('ready')
})()`
}

export function buildPreviewDocument(source: PreviewSource, previewId: string) {
  const html = sanitizePreviewHtml(source.html)
  const css = escapeClosingTag(source.css, 'style')
  const instrumented = instrumentPreviewJavaScript(source.javascript, previewId)
  const javascript = escapeClosingTag(instrumented.code, 'script')
  const bootstrap = createBootstrap(previewId, instrumented.guardName)

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; child-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <style>html,body{min-height:100%;margin:0}${css}</style>
</head>
<body>
${html}
<script>${bootstrap}</script>
<script>(async function(${instrumented.guardName}) {
'use strict'
${javascript}
})(globalThis.${instrumented.guardName}).catch(error => console.error(error))</script>
</body>
</html>`
}
