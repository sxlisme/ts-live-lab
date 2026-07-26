import type { RunnerLanguage } from '@/types/runner'

export interface PlaygroundSample {
  id: string
  label: string
  language: RunnerLanguage
  code: string
}

export const playgroundSamples: PlaygroundSample[] = [
  {
    id: 'type-narrowing',
    label: '类型收窄',
    language: 'typescript',
    code: `type ApiResult =
  | { ok: true; data: { name: string; score: number } }
  | { ok: false; error: string }

function printResult(result: ApiResult) {
  if (result.ok) {
    console.log(\`\${result.data.name}: \${result.data.score}\`)
  } else {
    console.error(result.error)
  }
}

printResult({ ok: true, data: { name: 'TypeScript', score: 100 } })`,
  },
  {
    id: 'generics',
    label: '泛型工具',
    language: 'typescript',
    code: `interface Identifiable {
  id: number
}

function indexById<T extends Identifiable>(items: T[]): Record<number, T> {
  return Object.fromEntries(items.map(item => [item.id, item]))
}

const users = [
  { id: 1, name: 'Ada', role: 'admin' },
  { id: 2, name: 'Linus', role: 'member' },
]

console.log(indexById(users))`,
  },
  {
    id: 'async',
    label: '异步任务',
    language: 'typescript',
    code: `type Task<T> = () => Promise<T>

async function sequence<T>(tasks: Task<T>[]): Promise<T[]> {
  const results: T[] = []
  for (const task of tasks) results.push(await task())
  return results
}

const result = await sequence([
  async () => 21,
  async () => 21,
])

console.log('结果:', result.reduce((sum, value) => sum + value, 0))`,
  },
  {
    id: 'javascript',
    label: 'JavaScript',
    language: 'javascript',
    code: `const orders = [
  { product: 'Keyboard', amount: 599 },
  { product: 'Mouse', amount: 299 },
  { product: 'Monitor', amount: 1599 },
]

const total = orders.reduce((sum, order) => sum + order.amount, 0)
console.table?.(orders)
console.log('订单总额:', total)`,
  },
]
