import type { RunnerLanguage } from '@/types/runner'

export async function formatRunnerCode(code: string, _language: RunnerLanguage) {
  const [prettier, typescriptPlugin, estreePlugin] = await Promise.all([
    import('prettier/standalone'),
    import('prettier/plugins/typescript'),
    import('prettier/plugins/estree'),
  ])

  return prettier.format(code, {
    parser: 'typescript',
    plugins: [typescriptPlugin.default, estreePlugin.default],
    printWidth: 90,
    semi: false,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    useTabs: false,
  })
}
