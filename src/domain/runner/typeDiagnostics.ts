import type { EditorLanguage, TypeDiagnostic } from '@/types/runner'
import ts from 'typescript'

const libraryModules = import.meta.glob(
  [
    '/node_modules/typescript/lib/lib.es5.d.ts',
    '/node_modules/typescript/lib/lib.es2015*.d.ts',
    '/node_modules/typescript/lib/lib.es2016*.d.ts',
    '/node_modules/typescript/lib/lib.es2017*.d.ts',
    '/node_modules/typescript/lib/lib.es2018*.d.ts',
    '/node_modules/typescript/lib/lib.es2019*.d.ts',
    '/node_modules/typescript/lib/lib.es2020*.d.ts',
    '/node_modules/typescript/lib/lib.es2021*.d.ts',
    '/node_modules/typescript/lib/lib.es2022*.d.ts',
    '/node_modules/typescript/lib/lib.decorators*.d.ts',
    '/node_modules/typescript/lib/lib.webworker.d.ts',
  ],
  { eager: true, import: 'default', query: '?raw' },
) as Record<string, string>

const libraries = new Map<string, string>()
for (const [path, source] of Object.entries(libraryModules)) {
  if (path.includes('.full.d.ts')) continue
  libraries.set(`/${path.slice(path.lastIndexOf('/') + 1)}`, source)
}

const libraryNames = [...libraries.keys()].sort()
const librarySnapshots = new Map(
  [...libraries].map(([fileName, source]) => [fileName, ts.ScriptSnapshot.fromString(source)]),
)

export class TypeScriptDiagnosticsService {
  private language: EditorLanguage = 'typescript'
  private source = ''
  private sourceVersion = 0
  private projectVersion = 0
  private readonly service: ts.LanguageService

  constructor() {
    const host: ts.LanguageServiceHost = {
      getCompilationSettings: () => this.compilerOptions(),
      getCurrentDirectory: () => '/',
      getDefaultLibFileName: () => '/lib.es2022.d.ts',
      getProjectVersion: () => String(this.projectVersion),
      getScriptFileNames: () => [this.sourceFileName(), ...libraryNames],
      getScriptKind: (fileName) => {
        if (fileName === '/main.js') return ts.ScriptKind.JS
        return ts.ScriptKind.TS
      },
      getScriptSnapshot: (fileName) => {
        if (fileName === this.sourceFileName()) return ts.ScriptSnapshot.fromString(this.source)
        return librarySnapshots.get(fileName)
      },
      getScriptVersion: (fileName) =>
        fileName === this.sourceFileName() ? String(this.sourceVersion) : '1',
      fileExists: (fileName) => fileName === this.sourceFileName() || libraries.has(fileName),
      readFile: (fileName) =>
        fileName === this.sourceFileName() ? this.source : libraries.get(fileName),
      readDirectory: () => [],
    }

    this.service = ts.createLanguageService(host, ts.createDocumentRegistry())
  }

  getDiagnostics(source: string, language: EditorLanguage): TypeDiagnostic[] {
    if (language !== 'typescript' && language !== 'javascript') return []

    if (source !== this.source || language !== this.language) {
      this.source = source
      this.language = language
      this.sourceVersion += 1
      this.projectVersion += 1
    }

    const fileName = this.sourceFileName()
    const diagnostics = [
      ...this.service.getSyntacticDiagnostics(fileName),
      ...(language === 'typescript' ? this.service.getSemanticDiagnostics(fileName) : []),
    ]
    const seen = new Set<string>()

    return diagnostics
      .filter(
        (diagnostic) =>
          diagnostic.category === ts.DiagnosticCategory.Error &&
          diagnostic.file?.fileName === fileName,
      )
      .flatMap((diagnostic) => {
        const from = Math.max(0, Math.min(diagnostic.start ?? 0, source.length))
        const length = Math.max(0, diagnostic.length ?? 0)
        const to = Math.max(from, Math.min(from + length, source.length))
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
        const key = `${diagnostic.code}:${from}:${to}:${message}`
        if (seen.has(key)) return []
        seen.add(key)

        const position = diagnostic.file!.getLineAndCharacterOfPosition(from)
        return [
          {
            from,
            to,
            line: position.line + 1,
            column: position.character + 1,
            code: diagnostic.code,
            message,
          },
        ]
      })
      .sort((left, right) => left.from - right.from || left.code - right.code)
      .slice(0, 100)
  }

  private sourceFileName() {
    return this.language === 'javascript' ? '/main.js' : '/main.ts'
  }

  private compilerOptions(): ts.CompilerOptions {
    return {
      allowJs: true,
      checkJs: false,
      module: ts.ModuleKind.ESNext,
      moduleDetection: ts.ModuleDetectionKind.Force,
      noEmit: true,
      noLib: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
      types: [],
      useDefineForClassFields: true,
    }
  }
}
