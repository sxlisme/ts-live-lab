import type { PracticeQuestion } from '@/types/practice'

export const advancedQuestionBank: PracticeQuestion[] = [
  {
    id: 'typeof-narrowing-limit',
    title: 'typeof null 的收窄陷阱',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'choice',
    prompt: '为什么 typeof value === "object" 后仍然需要判断 value !== null？',
    options: [
      { id: 'a', text: '因为 typeof null 在 JavaScript 中也是 "object"' },
      { id: 'b', text: '因为 TypeScript 不支持 typeof' },
      { id: 'c', text: '因为 object 一定是数组' },
      { id: 'd', text: '只在 strict=false 时需要' },
    ],
    correctOptionId: 'a',
    keyPoints: ['JavaScript 历史行为', 'null 的 typeof 是 object', '需要显式排除'],
    referenceAnswer:
      'JavaScript 中 typeof null 的结果是 "object"，TypeScript 会保留这个真实语义。因此访问属性前还需判断 value !== null。',
  },
  {
    id: 'in-operator-narrowing',
    title: 'in 运算符如何收窄',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'short',
    prompt: 'in 运算符对联合类型如何收窄？可选属性会出现在哪一侧？',
    keyPoints: [
      'true 分支保留拥有必需或可选属性的成员',
      'false 分支保留缺少或可选该属性的成员',
      '可选属性可能两侧都出现',
    ],
    referenceAnswer:
      '"key" in value 的 true 分支保留声明必需或可选 key 的成员；false 分支保留未声明或只可选声明 key 的成员，所以带可选属性的类型可能同时出现在两侧。',
  },
  {
    id: 'user-defined-guard',
    title: '类型谓词会被验证吗',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'choice',
    prompt: '函数声明为 value is User 时，TypeScript 会证明函数实现完整检查了 User 吗？',
    options: [
      { id: 'a', text: '会，编译器会验证全部字段' },
      { id: 'b', text: '不会，谓词是实现者对调用方的承诺' },
      { id: 'c', text: '只验证 string 字段' },
      { id: 'd', text: '只有 interface 才验证' },
    ],
    correctOptionId: 'b',
    keyPoints: ['谓词不自动证明实现', '错误谓词会造成不安全收窄', '复杂数据应使用 schema'],
    referenceAnswer:
      '编译器会按谓词声明收窄调用方类型，但不会证明实现真的检查了所有字段。因此错误谓词可能制造不安全类型，复杂输入更适合 schema 校验。',
  },
  {
    id: 'assertion-functions',
    title: '断言函数是什么',
    category: '类型进阶',
    difficulty: '高级',
    kind: 'short',
    prompt: '解释 asserts condition 和 asserts value is T 的用途与控制流效果。',
    keyPoints: [
      '失败时应抛错或终止',
      '成功后条件被视为成立',
      '可把 unknown 收窄为具体类型',
      '返回类型不是 boolean',
    ],
    referenceAnswer:
      '断言函数在失败时必须中断控制流。asserts condition 表示返回后条件成立；asserts value is T 表示返回后 value 已收窄为 T，适合集中实现前置条件。',
  },
  {
    id: 'discriminant-design',
    title: '判别联合字段设计',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'choice',
    prompt: '判别联合最适合作为判别字段的类型是什么？',
    options: [
      { id: 'a', text: '宽泛的 string' },
      { id: 'b', text: '每个成员不同的字面量类型' },
      { id: 'c', text: 'unknown' },
      { id: 'd', text: '任意可选对象' },
    ],
    correctOptionId: 'b',
    keyPoints: ['共享字段', '不同字面量值', '控制流可精确收窄'],
    referenceAnswer:
      '所有成员应共享同一字段名，并为每个成员提供不同的字符串或数字字面量，这样检查字段值时才能精确收窄。',
  },
  {
    id: 'exhaustive-switch',
    title: '如何做穷尽性检查',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'short',
    prompt: '如何利用 never 让 switch 在新增联合成员后产生编译错误？',
    keyPoints: [
      'default 分支接收剩余值',
      '把剩余值赋给 never 或传给 assertNever',
      '新增未处理成员时不再兼容 never',
    ],
    referenceAnswer:
      '在 default 分支将变量赋给 never，或传给参数为 never 的 assertNever。所有成员处理完时剩余类型是 never；新增成员未处理时就会报错。',
  },
  {
    id: 'const-assertion',
    title: 'as const 的三个效果',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'short',
    prompt: 'as const 对字面量表达式通常产生哪三个类型层面的效果？',
    keyPoints: ['阻止字面量拓宽', '对象属性变 readonly', '数组变只读元组'],
    referenceAnswer:
      '它保留字符串和数字的字面量类型，把对象字面量属性标记为 readonly，并把数组字面量推断为只读元组。它不会运行时冻结对象。',
  },
  {
    id: 'satisfies-vs-as',
    title: 'satisfies 为什么优于 as',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'choice',
    prompt: '校验配置对象时，satisfies 相比 as 的主要优势是什么？',
    options: [
      { id: 'a', text: '会把对象冻结' },
      { id: 'b', text: '既检查兼容性，又保留表达式的精确推断' },
      { id: 'c', text: '会在运行时抛出验证错误' },
      { id: 'd', text: '能自动发送网络请求' },
    ],
    correctOptionId: 'b',
    keyPoints: ['检查目标兼容性', '保留原始精确推断', 'as 可能掩盖错误'],
    referenceAnswer:
      'satisfies 会验证值满足目标类型，同时保留对象自身的字面量和属性推断；as 主要是开发者要求编译器按某类型看待值，可能掩盖问题。',
  },
  {
    id: 'implement-is-defined',
    title: '实现 isDefined',
    category: '类型进阶',
    difficulty: '进阶',
    kind: 'code',
    prompt: '实现 isDefined，用于过滤数组中的 null 和 undefined，并在类型层收窄为 T。',
    starterCode: `function isDefined<T>(value: T | null | undefined): value is T {
  // 在这里实现
}
`,
    testCode: `
const values = [1, null, 2, undefined, 3].filter(isDefined)
if (JSON.stringify(values) !== '[1,2,3]') throw new Error('过滤结果错误')
console.log('✓ isDefined 测试通过')`,
    hint: '显式同时排除 null 与 undefined。',
    keyPoints: ['返回类型谓词 value is T', '排除 null', '排除 undefined', '可用于 filter'],
    referenceAnswer:
      'function isDefined<T>(value: T | null | undefined): value is T { return value !== null && value !== undefined }',
  },
]
