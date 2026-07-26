import type { PracticeQuestion } from '@/types/practice'

export const genericsQuestionBank: PracticeQuestion[] = [
  {
    id: 'generic-parameter-once',
    title: '只出现一次的泛型参数',
    category: '泛型工具',
    difficulty: '进阶',
    kind: 'short',
    prompt: '一个泛型参数只在函数参数中出现一次、未参与其他位置时，通常说明什么？',
    keyPoints: [
      '没有建立类型关系',
      '可能不需要泛型',
      '可考虑具体约束或 unknown',
      '泛型价值在连接多个位置',
    ],
    referenceAnswer:
      '泛型的主要价值是连接多个类型位置。若 T 只出现一次，它没有保留输入输出关系，通常可以直接使用约束类型或 unknown，让签名更简单。',
  },
  {
    id: 'generic-constraint-purpose',
    title: '泛型约束解决什么问题',
    category: '泛型工具',
    difficulty: '基础',
    kind: 'choice',
    prompt: 'T extends { length: number } 的直接作用是什么？',
    options: [
      { id: 'a', text: '把 T 固定成数组' },
      { id: 'b', text: '限制 T 必须有 number 类型的 length，并允许实现读取它' },
      { id: 'c', text: '在运行时添加 length' },
      { id: 'd', text: '让 T 变成 any' },
    ],
    correctOptionId: 'b',
    keyPoints: ['限制允许输入', '实现可使用约束成员', '不改变运行时值'],
    referenceAnswer:
      '约束要求传入类型至少具有 number 类型的 length，并允许泛型实现安全读取该属性；它不会把值转换成数组或添加运行时属性。',
  },
  {
    id: 'indexed-access-generic',
    title: 'T[K] 表示什么',
    category: '泛型工具',
    difficulty: '进阶',
    kind: 'choice',
    prompt: '在 K extends keyof T 的前提下，T[K] 表示什么？',
    options: [
      { id: 'a', text: 'T 的所有键' },
      { id: 'b', text: 'T 在键 K 上对应的属性类型' },
      { id: 'c', text: '运行时属性值' },
      { id: 'd', text: 'T 的构造函数' },
    ],
    correctOptionId: 'b',
    keyPoints: ['索引访问类型', '键与返回类型保持关系', 'K 可为键联合'],
    referenceAnswer:
      'T[K] 是索引访问类型，得到 T 中键 K 对应的值类型。若 K 是多个键的联合，结果是这些属性类型的联合。',
  },
  {
    id: 'mapped-modifiers',
    title: '映射类型修饰符',
    category: '泛型工具',
    difficulty: '高级',
    kind: 'short',
    prompt: '映射类型中的 -readonly 和 -? 分别有什么作用？',
    keyPoints: ['移除 readonly', '移除可选修饰符', '对遍历的每个属性生效'],
    referenceAnswer:
      '-readonly 移除属性的只读修饰符，-? 移除可选修饰符。相应的 +readonly 与 +? 可显式添加，省略加号时添加是默认行为。',
  },
  {
    id: 'key-remapping-never',
    title: '键重映射中的 never',
    category: '泛型工具',
    difficulty: '高级',
    kind: 'choice',
    prompt: '映射类型的 as 子句把某个键映射为 never 时会发生什么？',
    options: [
      { id: 'a', text: '该属性值变成 never 但属性保留' },
      { id: 'b', text: '该属性会从结果类型中过滤掉' },
      { id: 'c', text: '整个类型变成 never' },
      { id: 'd', text: '产生运行时异常' },
    ],
    correctOptionId: 'b',
    keyPoints: ['as 重映射键', 'never 过滤属性', '可实现 OmitByValue 类工具'],
    referenceAnswer:
      '键重映射结果为 never 的属性不会出现在最终映射类型中，因此可按键名或值类型过滤属性。',
  },
  {
    id: 'template-union-product',
    title: '模板字面量如何组合联合',
    category: '泛型工具',
    difficulty: '高级',
    kind: 'short',
    prompt: '模板字面量类型的两个插值位置都是联合时，结果如何生成？有什么性能风险？',
    keyPoints: ['生成笛卡尔积', '每种组合成为联合成员', '大型联合可能增加编译成本'],
    referenceAnswer:
      'TypeScript 会生成两个联合所有可能组合的笛卡尔积。成员数量会相乘，多个大型联合可能显著拖慢检查，过大的集合更适合代码生成。',
  },
  {
    id: 'return-type-overload',
    title: 'ReturnType 与重载函数',
    category: '泛型工具',
    difficulty: '高级',
    kind: 'choice',
    prompt: 'ReturnType 作用于有多个重载签名的函数时，通常从哪一个签名推断？',
    options: [
      { id: 'a', text: '第一个重载' },
      { id: 'b', text: '最后一个通常最宽泛的签名' },
      { id: 'c', text: '随机选择' },
      { id: 'd', text: '一定返回 never' },
    ],
    correctOptionId: 'b',
    keyPoints: ['从最后签名推断', '通常是实现前的宽泛重载', '不能按参数列表执行重载解析'],
    referenceAnswer:
      '条件类型从重载函数推断时使用最后一个签名，通常也是最宽泛的兜底签名；它不会根据某组参数执行一次重载解析。',
  },
  {
    id: 'implement-chunk',
    title: '实现泛型 chunk',
    category: '泛型工具',
    difficulty: '进阶',
    kind: 'code',
    prompt: '实现 chunk，把只读数组按 size 分组并保留元素类型；size 小于 1 时抛出错误。',
    starterCode: `function chunk<T>(items: readonly T[], size: number): T[][] {
  // 在这里实现
}
`,
    testCode: `
const grouped = chunk([1, 2, 3, 4, 5], 2)
if (JSON.stringify(grouped) !== '[[1,2],[3,4],[5]]') throw new Error('分组结果错误')
let threw = false
try { chunk([1], 0) } catch { threw = true }
if (!threw) throw new Error('无效 size 应抛出错误')
console.log('✓ chunk 测试通过')`,
    hint: '按 size 步进循环，并使用 slice 取得每组。',
    keyPoints: ['泛型保留元素类型', '接受 readonly 数组', '校验 size', '不修改原数组'],
    referenceAnswer:
      'function chunk<T>(items: readonly T[], size: number): T[][] { if (size < 1) throw new RangeError("size must be positive"); const result: T[][] = []; for (let i = 0; i < items.length; i += size) result.push(items.slice(i, i + size)); return result }',
  },
]
