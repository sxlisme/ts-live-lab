import type { PracticeQuestion, QuestionCategory } from '@/types/practice'
import { advancedQuestionBank } from './questionBanks/advanced'
import { engineeringQuestionBank } from './questionBanks/engineering'
import { fundamentalsQuestionBank } from './questionBanks/fundamentals'
import { genericsQuestionBank } from './questionBanks/generics'

export const questionCategories: QuestionCategory[] = [
  '类型基础',
  '类型进阶',
  '泛型工具',
  '工程实践',
]

const coreQuestions: PracticeQuestion[] = [
  {
    id: 'unknown-vs-any',
    title: 'unknown 与 any 的区别',
    category: '类型基础',
    difficulty: '基础',
    kind: 'short',
    prompt: '请说明 unknown 和 any 在赋值、属性访问和类型安全方面的区别，并给出适用场景。',
    keyPoints: [
      'any 会关闭类型检查',
      'unknown 使用前必须收窄',
      'unknown 可接收任意值',
      '优先使用 unknown 表示未知输入',
    ],
    referenceAnswer:
      'any 会绕过静态检查，可以任意访问和调用；unknown 同样能接收任意值，但在访问属性、调用或赋给具体类型之前必须先做类型收窄。因此外部输入、catch 值等未知数据应优先用 unknown，只有迁移遗留代码等明确场景才使用 any。',
  },
  {
    id: 'never-meaning',
    title: 'never 类型表示什么',
    category: '类型基础',
    difficulty: '基础',
    kind: 'choice',
    prompt: '下面哪一项最准确地描述 never？',
    options: [
      { id: 'a', text: '任意 JavaScript 值的父类型' },
      { id: 'b', text: '永远不会产生值的类型，可用于穷尽性检查' },
      { id: 'c', text: 'null 与 undefined 的联合类型' },
      { id: 'd', text: '返回值被忽略的函数类型' },
    ],
    correctOptionId: 'b',
    keyPoints: ['never 表示不可达值', '抛错或无限循环函数', '联合类型穷尽性检查'],
    referenceAnswer:
      'never 表示不可能出现的值。始终抛错或无法结束的函数可返回 never；在判别联合的 default 分支中把剩余值赋给 never，可以检查分支是否穷尽。',
  },
  {
    id: 'interface-vs-type',
    title: 'interface 与 type 如何选择',
    category: '类型基础',
    difficulty: '进阶',
    kind: 'short',
    prompt: 'interface 和 type 都能描述对象类型。它们的核心差异是什么？项目中你会如何选择？',
    keyPoints: [
      'interface 支持声明合并',
      'type 可表达联合与映射类型',
      '两者都支持扩展',
      '团队一致性比机械选择更重要',
    ],
    referenceAnswer:
      'interface 支持同名声明合并，适合公开、可扩展的对象契约；type 能表达联合、元组、条件类型、映射类型等更广泛的类型运算。描述普通对象时二者都可以，库的扩展点常用 interface，组合和类型计算常用 type，并保持项目约定一致。',
  },
  {
    id: 'keyof-result',
    title: '理解 keyof',
    category: '类型基础',
    difficulty: '基础',
    kind: 'choice',
    prompt: '给定 type User = { id: number; name: string }，keyof User 的结果是什么？',
    options: [
      { id: 'a', text: 'string' },
      { id: 'b', text: 'number | string' },
      { id: 'c', text: '"id" | "name"' },
      { id: 'd', text: '{ id: number; name: string }' },
    ],
    correctOptionId: 'c',
    keyPoints: ['keyof 产生属性键的联合类型', '结果是字符串字面量联合'],
    referenceAnswer:
      'keyof User 会得到 User 已知属性键组成的联合类型，即 "id" | "name"。它常与泛型约束 TKey extends keyof TObject 配合，实现类型安全的属性访问。',
  },
  {
    id: 'narrowing',
    title: '判别联合与类型收窄',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'short',
    prompt: '什么是判别联合？为什么它通常比大量可选属性更可靠？',
    keyPoints: ['共享字面量判别字段', '控制流自动收窄', '非法状态不可表示', '支持 never 穷尽检查'],
    referenceAnswer:
      '判别联合让多个成员共享一个字面量类型字段，例如 status: "success" | "error"。分支判断该字段后，TypeScript 会把对象收窄到对应成员。每种状态只携带自己有效的数据，避免多个可选属性组合出非法状态，并可用 never 检查分支完整性。',
  },
  {
    id: 'conditional-distribute',
    title: '条件类型为什么会分发',
    category: '类型进阶',
    difficulty: '高级',
    kind: 'short',
    prompt: '解释 T extends U ? X : Y 在什么情况下会对联合类型分发，以及如何关闭分发。',
    keyPoints: ['T 是裸类型参数时分发', '逐个联合成员计算', '用元组包裹两侧关闭分发'],
    referenceAnswer:
      '当检查位置的 T 是裸类型参数时，传入 A | B 会分别计算条件并合并结果。把检查两侧包进单元素元组，例如 [T] extends [U] ? X : Y，就会把联合整体参与判断，从而关闭分发。',
  },
  {
    id: 'infer-keyword',
    title: 'infer 的作用',
    category: '类型进阶',
    difficulty: '高级',
    kind: 'choice',
    prompt: '条件类型中的 infer 主要用来做什么？',
    options: [
      { id: 'a', text: '在运行时推断变量类型' },
      { id: 'b', text: '在条件匹配位置声明待推断的类型变量' },
      { id: 'c', text: '强制 TypeScript 忽略类型错误' },
      { id: 'd', text: '把类型转换为接口' },
    ],
    correctOptionId: 'b',
    keyPoints: ['infer 只能在条件类型 extends 子句中使用', '从结构中提取类型'],
    referenceAnswer:
      'infer 在条件类型的 extends 模式中声明一个待推断变量，可从函数返回值、Promise 内部值、数组元素等结构中提取类型。标准工具 ReturnType 就使用了这一机制。',
  },
  {
    id: 'satisfies',
    title: 'satisfies 与类型注解',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'short',
    prompt: 'satisfies 运算符解决了什么问题？它与直接写类型注解或 as 断言有何不同？',
    keyPoints: [
      '校验表达式满足目标类型',
      '保留表达式自身的精确推断',
      'as 可能掩盖不安全转换',
      '不改变运行时值',
    ],
    referenceAnswer:
      'satisfies 会检查表达式是否兼容目标类型，同时保留表达式自身更精确的字面量和属性推断。类型注解可能把值拓宽为注解类型，as 则是在告诉编译器相信开发者，可能绕过真实问题。satisfies 只参与静态检查，不改变运行时值。',
  },
  {
    id: 'generic-first',
    title: '实现类型安全的 first',
    category: '泛型工具',
    difficulty: '基础',
    kind: 'code',
    prompt: '实现 first：接收只读数组，返回第一个元素；空数组返回 undefined，并保留元素类型。',
    starterCode: `function first<T>(items: readonly T[]): T | undefined {
  // 在这里实现
}
`,
    testCode: `
const numberResult = first([3, 5, 8] as const)
const emptyResult = first([])
if (numberResult !== 3) throw new Error('非空数组测试未通过')
if (emptyResult !== undefined) throw new Error('空数组测试未通过')
console.log('✓ 2 项测试通过')`,
    hint: '数组的第 0 项已经是 T | undefined 的语义。',
    keyPoints: ['使用泛型保留元素类型', '参数接受 readonly 数组', '返回 items[0]', '处理空数组'],
    referenceAnswer: 'function first<T>(items: readonly T[]): T | undefined { return items[0] }',
  },
  {
    id: 'group-by',
    title: '实现泛型 groupBy',
    category: '泛型工具',
    difficulty: '进阶',
    kind: 'code',
    prompt: '实现 groupBy：根据回调返回的 string 键分组，并保持每组元素类型。',
    starterCode: `function groupBy<T>(
  items: readonly T[],
  getKey: (item: T) => string,
): Record<string, T[]> {
  // 在这里实现
}
`,
    testCode: `
const grouped = groupBy(
  [{ name: 'Ada', team: 'A' }, { name: 'Linus', team: 'B' }, { name: 'Grace', team: 'A' }],
  item => item.team,
)
if (grouped.A?.length !== 2) throw new Error('A 组数量错误')
if (grouped.B?.[0]?.name !== 'Linus') throw new Error('B 组内容错误')
console.log('✓ 2 项测试通过')`,
    hint: 'reduce 或普通循环都可以；首次遇到键时需要初始化数组。',
    keyPoints: ['泛型 T 贯穿输入输出', '回调提取键', '正确初始化分组', '不修改原数组'],
    referenceAnswer:
      'function groupBy<T>(items: readonly T[], getKey: (item: T) => string): Record<string, T[]> { return items.reduce<Record<string, T[]>>((result, item) => { (result[getKey(item)] ??= []).push(item); return result }, {}) }',
  },
  {
    id: 'deep-readonly',
    title: '实现 DeepReadonly',
    category: '泛型工具',
    difficulty: '高级',
    kind: 'short',
    prompt: '请写出递归只读工具类型 DeepReadonly<T>，并解释如何处理基本类型、对象和函数类型。',
    keyPoints: [
      '函数类型直接返回',
      '对象属性添加 readonly',
      '递归应用 DeepReadonly',
      '数组也能通过映射递归',
    ],
    referenceAnswer:
      'type DeepReadonly<T> = T extends (...args: any[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T',
  },
  {
    id: 'utility-types',
    title: '选择合适的工具类型',
    category: '泛型工具',
    difficulty: '基础',
    kind: 'choice',
    prompt: '要从 User 类型中选出 id 和 name 两个属性，应使用哪个内置工具类型？',
    options: [
      { id: 'a', text: 'Partial<User>' },
      { id: 'b', text: 'Pick<User, "id" | "name">' },
      { id: 'c', text: 'Exclude<User, "id" | "name">' },
      { id: 'd', text: 'ReturnType<User>' },
    ],
    correctOptionId: 'b',
    keyPoints: ['Pick 从对象类型选取属性', '第二参数受 keyof 约束'],
    referenceAnswer:
      'Pick<User, "id" | "name"> 会构造只包含这两个属性的新类型。相反操作可使用 Omit<User, "id" | "name">。',
  },
  {
    id: 'strict-mode',
    title: 'strict 模式包含什么',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'short',
    prompt: '为什么新项目应开启 strict？请至少说出两个它覆盖的重要检查。',
    keyPoints: [
      'strict 是严格检查选项集合',
      'strictNullChecks',
      'noImplicitAny',
      'strictFunctionTypes',
      '逐步迁移遗留项目',
    ],
    referenceAnswer:
      'strict 会开启一组严格类型检查，例如 strictNullChecks、noImplicitAny、strictFunctionTypes、strictPropertyInitialization 等，能在编译期暴露空值、隐式 any 和不安全函数赋值。新项目应默认开启；遗留项目可逐项启用并设置迁移边界。',
  },
  {
    id: 'declaration-files',
    title: '什么时候需要 .d.ts',
    category: '工程实践',
    difficulty: '进阶',
    kind: 'short',
    prompt: '声明文件 .d.ts 的职责是什么？项目中常见的来源和维护风险有哪些？',
    keyPoints: [
      '只描述类型不输出运行时代码',
      '库自带或 @types',
      '可为无类型 JS 补充声明',
      '声明必须与运行时行为一致',
    ],
    referenceAnswer:
      '.d.ts 只描述现有 JavaScript 的类型表面，不生成运行时代码。声明可由库自带、来自 DefinitelyTyped 的 @types，或由项目自行编写。最大的风险是声明与真实运行时实现漂移，因此应尽量从源码生成、写类型测试并跟随版本发布。',
  },
  {
    id: 'project-references',
    title: 'Project References 的价值',
    category: '工程实践',
    difficulty: '高级',
    kind: 'choice',
    prompt: '大型 TypeScript 仓库使用 Project References 的主要收益是什么？',
    options: [
      { id: 'a', text: '让 TypeScript 可以在浏览器直接运行' },
      { id: 'b', text: '提供项目边界、增量构建和更好的构建顺序' },
      { id: 'c', text: '自动把所有依赖打包到一个文件' },
      { id: 'd', text: '替代 package.json 管理依赖' },
    ],
    correctOptionId: 'b',
    keyPoints: ['项目边界', '增量构建', '依赖构建顺序', 'composite 配置'],
    referenceAnswer:
      'Project References 通过 references 与 composite 把大工程拆成有边界的子项目，tsc --build 可以按依赖顺序进行增量构建，减少重复检查并改善编辑器在大型仓库中的性能。',
  },
]

export const questions: PracticeQuestion[] = [
  ...coreQuestions,
  ...fundamentalsQuestionBank,
  ...advancedQuestionBank,
  ...genericsQuestionBank,
  ...engineeringQuestionBank,
]
