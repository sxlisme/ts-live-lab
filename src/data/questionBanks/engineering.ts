import type { PracticeQuestion } from '@/types/practice'

export const engineeringQuestionBank: PracticeQuestion[] = [
  {
    id: 'no-unchecked-indexed-access',
    title: 'noUncheckedIndexedAccess 的作用',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'choice',
    prompt: '开启 noUncheckedIndexedAccess 后，读取 Record<string, User>[key] 通常有什么变化？',
    options: [
      { id: 'a', text: '结果从 User 变为 User | undefined' },
      { id: 'b', text: '所有键都会自动创建' },
      { id: 'c', text: 'Record 变成只读' },
      { id: 'd', text: '运行时会检查键是否存在' },
    ],
    correctOptionId: 'a',
    keyPoints: ['未声明索引可能不存在', '结果加入 undefined', '迫使调用方检查'],
    referenceAnswer:
      '未明确声明的索引访问会包含 undefined，提醒代码处理键不存在的情况。它只改变静态检查，不添加运行时保护。',
  },
  {
    id: 'exact-optional-properties',
    title: 'exactOptionalPropertyTypes',
    category: '工程实践',
    difficulty: '高级',
    kind: 'short',
    prompt: 'exactOptionalPropertyTypes 开启后，属性缺失与显式赋值 undefined 有何区别？',
    keyPoints: [
      '可选表示属性可以不存在',
      '不自动允许显式 undefined',
      '需要在属性类型中写 undefined 才能赋值',
    ],
    referenceAnswer:
      '开启后 prop?: T 精确表示属性可以缺失，但存在时必须是 T。若要允许 { prop: undefined }，需要显式写成 prop?: T | undefined。',
  },
  {
    id: 'isolated-modules',
    title: 'isolatedModules 为什么重要',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'short',
    prompt: '使用 Vite、Babel 或 SWC 逐文件转译时，为什么应开启 isolatedModules？',
    keyPoints: [
      '逐文件工具没有完整程序类型信息',
      '标记无法安全单文件转译的语法',
      '不执行额外类型检查',
    ],
    referenceAnswer:
      '逐文件转译器看不到整个类型程序，isolatedModules 会报告依赖跨文件类型信息、无法可靠转译的写法。它不替代 tsc 的完整类型检查。',
  },
  {
    id: 'module-resolution-bundler',
    title: 'Bundler 与 NodeNext 的选择',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'choice',
    prompt: 'Vite 前端应用通常更适合哪一种 moduleResolution？',
    options: [
      { id: 'a', text: 'Classic' },
      { id: 'b', text: 'Bundler' },
      { id: 'c', text: 'Node10' },
      { id: 'd', text: 'None' },
    ],
    correctOptionId: 'b',
    keyPoints: [
      'Bundler 匹配现代打包器',
      'NodeNext 匹配 Node.js ESM/CJS 规则',
      '配置要与运行时一致',
    ],
    referenceAnswer:
      '现代 Vite 应用通常使用 Bundler，它匹配打包器对扩展名、package exports 等行为；直接由现代 Node.js 执行的项目通常选择 NodeNext。',
  },
  {
    id: 'import-type',
    title: 'import type 的价值',
    category: '工程实践',
    difficulty: '基础',
    kind: 'short',
    prompt: 'import type 与普通 import 有何不同？为什么在 verbatimModuleSyntax 下更重要？',
    keyPoints: ['只用于类型', '输出时删除', '明确值与类型边界', '避免意外运行时依赖'],
    referenceAnswer:
      'import type 明确导入只在类型位置使用，编译后删除。verbatimModuleSyntax 按显式 type 修饰符决定导入是否保留，使运行时依赖和副作用更可预测。',
  },
  {
    id: 'skip-lib-check',
    title: 'skipLibCheck 的边界',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'choice',
    prompt: 'skipLibCheck=true 主要跳过什么？',
    options: [
      { id: 'a', text: '项目所有 TypeScript 文件' },
      { id: 'b', text: '声明文件内部的完整类型检查' },
      { id: 'c', text: '所有 node_modules 运行代码' },
      { id: 'd', text: 'ESLint 检查' },
    ],
    correctOptionId: 'b',
    keyPoints: [
      '跳过 .d.ts 内部检查',
      '项目使用声明的方式仍会检查',
      '可能改善构建速度但会隐藏声明冲突',
    ],
    referenceAnswer:
      '它跳过 .d.ts 文件内部的完整检查，但项目代码如何使用这些声明仍会被检查。它能缩短时间，也可能暂时隐藏重复或不一致的库声明。',
  },
  {
    id: 'runtime-schema',
    title: '为什么还需要运行时 Schema',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'short',
    prompt: '已经有 TypeScript 接口时，为什么接口响应仍应使用 Zod 等运行时 schema？',
    keyPoints: [
      '类型在编译后擦除',
      '外部数据不可信',
      'schema 提供运行时证据',
      '可从解析结果获得可靠类型',
    ],
    referenceAnswer:
      '接口只检查源码，不会验证网络数据。schema 会在运行时检查字段、转换或拒绝无效输入，成功解析后的值才有证据满足业务类型。',
  },
  {
    id: 'project-reference-composite',
    title: 'composite 配置要求',
    category: '工程实践',
    difficulty: '高级',
    kind: 'choice',
    prompt: '一个被 Project References 引用的项目通常需要开启哪个选项？',
    options: [
      { id: 'a', text: 'allowJs' },
      { id: 'b', text: 'composite' },
      { id: 'c', text: 'removeComments' },
      { id: 'd', text: 'noLib' },
    ],
    correctOptionId: 'b',
    keyPoints: ['被引用项目开启 composite', '支持增量构建信息', '约束项目文件边界'],
    referenceAnswer:
      '被引用项目需要 composite，以便 tsc --build 可靠确定输出、声明和增量构建信息。composite 也会强化 rootDir 与文件包含规则。',
  },
  {
    id: 'implement-retry',
    title: '实现异步 retry',
    category: '工程实践',
    difficulty: '高级',
    kind: 'code',
    prompt: '实现 retry：任务失败时最多重试 retries 次，成功返回 T，全部失败后抛出最后一次错误。',
    starterCode: `async function retry<T>(task: () => Promise<T>, retries: number): Promise<T> {
  // 在这里实现
}
`,
    testCode: `
let attempts = 0
const value = await retry(async () => {
  attempts += 1
  if (attempts < 3) throw new Error('temporary')
  return 42
}, 2)
if (value !== 42 || attempts !== 3) throw new Error('重试次数或结果错误')
console.log('✓ retry 测试通过')`,
    hint: '总尝试次数是 retries + 1；只在仍有机会时继续循环。',
    keyPoints: ['泛型保留成功值类型', '总尝试次数正确', '成功立即返回', '最终抛出最后错误'],
    referenceAnswer:
      'async function retry<T>(task: () => Promise<T>, retries: number): Promise<T> { let lastError: unknown; for (let attempt = 0; attempt <= retries; attempt++) { try { return await task() } catch (error) { lastError = error } } throw lastError }',
  },
]
