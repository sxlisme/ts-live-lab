import type { RunnerLanguage } from '@/types/runner'
import ts from 'typescript'

export function inspectSourceRestrictions(code: string, language: RunnerLanguage): string[] {
  const source = ts.createSourceFile(
    language === 'typescript' ? 'main.ts' : 'main.js',
    code,
    ts.ScriptTarget.ESNext,
    true,
    language === 'typescript' ? ts.ScriptKind.TS : ts.ScriptKind.JS,
  )
  const problems = new Set<string>()

  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node)) {
      problems.add('在线沙箱不支持 import，请直接编写独立代码。')
    }
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
      problems.add('在线沙箱不支持 export，请直接编写独立代码。')
    }
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        problems.add('在线沙箱已禁用动态 import。')
      }
      if (
        ts.isIdentifier(node.expression) &&
        ['fetch', 'importScripts'].includes(node.expression.text)
      ) {
        problems.add('在线沙箱已禁用网络与外部脚本。')
      }
    }
    if (
      ts.isNewExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'XMLHttpRequest'].includes(
        node.expression.text,
      )
    ) {
      problems.add('在线沙箱已禁用网络连接和嵌套 Worker。')
    }
    ts.forEachChild(node, visit)
  }

  visit(source)
  return [...problems]
}
