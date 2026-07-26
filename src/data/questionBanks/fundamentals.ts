import type { PracticeQuestion } from '@/types/practice'

export const fundamentalsQuestionBank: PracticeQuestion[] = [
  {
    id: 'primitive-wrapper-types',
    title: 'string 与 String 的区别',
    category: '类型基础',
    difficulty: '基础',
    kind: 'choice',
    prompt: '日常 TypeScript 类型注解中，为什么通常应使用 string 而不是 String？',
    options: [
      { id: 'a', text: 'string 是原始值类型，String 表示包装对象类型' },
      { id: 'b', text: 'String 只能在浏览器中使用' },
      { id: 'c', text: 'string 会在运行时自动校验输入' },
      { id: 'd', text: '两者完全相同' },
    ],
    correctOptionId: 'a',
    keyPoints: ['小写类型描述原始值', '大写类型描述包装对象', '避免使用包装对象类型'],
    referenceAnswer:
      'string 描述 JavaScript 字符串原始值；String 描述很少直接使用的包装对象。number、boolean 也遵循相同规则，类型注解应优先使用小写形式。',
  },
  {
    id: 'null-undefined',
    title: 'null 与 undefined 如何建模',
    category: '类型基础',
    difficulty: '基础',
    kind: 'short',
    prompt: '在 strictNullChecks 下，null 和 undefined 有什么区别？API 设计时如何保持一致？',
    keyPoints: [
      '两者是独立类型',
      '可选属性通常产生 undefined',
      'null 可表达显式空值',
      '团队应统一边界语义',
    ],
    referenceAnswer:
      'strictNullChecks 下二者都不能自动赋给其他类型。缺失参数和可选属性通常对应 undefined，null 常表示显式清空。API 应明确一种语义，避免同一字段同时随意返回两者。',
  },
  {
    id: 'tuple-vs-array',
    title: '元组与数组的选择',
    category: '类型基础',
    difficulty: '基础',
    kind: 'choice',
    prompt: '下面哪个场景最适合使用元组而不是普通数组？',
    options: [
      { id: 'a', text: '任意数量的用户列表' },
      { id: 'b', text: '固定为经度和纬度的两个数字' },
      { id: 'c', text: '未知数量的日志记录' },
      { id: 'd', text: '分页接口的所有结果' },
    ],
    correctOptionId: 'b',
    keyPoints: ['固定长度', '每个位置含义明确', '位置类型可不同'],
    referenceAnswer:
      '元组适合固定长度且每个位置语义明确的数据，例如 [longitude: number, latitude: number]。可变数量的同类元素应使用数组。',
  },
  {
    id: 'readonly-runtime',
    title: 'readonly 会冻结对象吗',
    category: '类型基础',
    difficulty: '基础',
    kind: 'choice',
    prompt: '给接口属性添加 readonly 后，运行时会发生什么？',
    options: [
      { id: 'a', text: '对象会自动调用 Object.freeze' },
      { id: 'b', text: '只阻止通过该类型重新赋值，不改变运行时对象' },
      { id: 'c', text: '所有嵌套属性都会变为只读' },
      { id: 'd', text: '属性会从 JavaScript 产物中删除' },
    ],
    correctOptionId: 'b',
    keyPoints: ['编译期约束', '不自动冻结', '默认不是深度只读'],
    referenceAnswer:
      'readonly 是静态约束，不会调用 Object.freeze，也不会递归处理嵌套对象。若需要运行时不可变，必须采用冻结或不可变数据策略。',
  },
  {
    id: 'optional-property',
    title: '可选属性的读取类型',
    category: '类型基础',
    difficulty: '基础',
    kind: 'choice',
    prompt: 'interface User { avatar?: string } 中，读取 user.avatar 通常得到什么类型？',
    options: [
      { id: 'a', text: 'string' },
      { id: 'b', text: 'string | undefined' },
      { id: 'c', text: 'string | null' },
      { id: 'd', text: 'unknown' },
    ],
    correctOptionId: 'b',
    keyPoints: ['属性可能不存在', '读取时包含 undefined', '需要空值处理'],
    referenceAnswer:
      '可选属性可能不存在，因此在严格空值检查下读取结果是 string | undefined。可使用可选链、空值合并或显式判断处理。',
  },
  {
    id: 'object-vs-record',
    title: 'object、{} 与 Record 的差异',
    category: '类型基础',
    difficulty: '进阶',
    kind: 'short',
    prompt: '解释 object、{} 和 Record<string, unknown> 各自适合表达什么。',
    keyPoints: [
      'object 排除原始值',
      '{} 接受大多数非空值',
      'Record 描述字符串键对象',
      '未知对象需根据用途建模',
    ],
    referenceAnswer:
      'object 表示非原始值；{} 在严格空值检查下接收除 null/undefined 外的大多数值；Record<string, unknown> 表示可用字符串索引的键值对象。应根据是否需要访问键来选择。',
  },
  {
    id: 'excess-property-check',
    title: '多余属性检查何时触发',
    category: '类型基础',
    difficulty: '进阶',
    kind: 'short',
    prompt: '为什么对象字面量直接赋值可能报多余属性错误，而先保存到变量后又可能通过？',
    keyPoints: [
      '对象字面量有新鲜度检查',
      '结构类型允许额外成员',
      '检查用于捕获拼写错误',
      '不是精确对象类型',
    ],
    referenceAnswer:
      '对象字面量直接进入目标上下文时会执行额外的多余属性检查；普通变量则按结构兼容，只要包含必需成员即可。这是错误提示机制，不代表 TypeScript 使用精确对象类型。',
  },
  {
    id: 'type-assertion-risk',
    title: '类型断言的风险',
    category: '类型基础',
    difficulty: '基础',
    kind: 'short',
    prompt: 'as User 类型断言做了什么？为什么不能用它验证接口响应？',
    keyPoints: ['只影响编译器', '不生成运行时检查', '可能掩盖不匹配数据', '外部输入应运行时校验'],
    referenceAnswer:
      '断言告诉编译器按指定类型看待表达式，不会转换或验证真实值。接口响应可能缺字段或类型错误，应以 unknown 接收并通过 schema 或守卫校验。',
  },
  {
    id: 'implement-compact',
    title: '实现 compact',
    category: '类型基础',
    difficulty: '进阶',
    kind: 'code',
    prompt: '实现 compact，移除数组中的 null 和 undefined，同时保留其他假值与元素类型。',
    starterCode: `function compact<T>(items: readonly (T | null | undefined)[]): T[] {
  // 在这里实现
}
`,
    testCode: `
const result = compact([0, null, 1, undefined, false, ''] as const)
if (JSON.stringify(result) !== JSON.stringify([0, 1, false, ''])) {
  throw new Error('必须只移除 null 和 undefined')
}
console.log('✓ compact 测试通过')`,
    hint: '不要直接使用 filter(Boolean)，因为 0、false 和空字符串都应保留。',
    keyPoints: ['显式判断 null 与 undefined', '返回 T[]', '保留其他假值', '不修改原数组'],
    referenceAnswer:
      'function compact<T>(items: readonly (T | null | undefined)[]): T[] { return items.filter((item): item is T => item !== null && item !== undefined) }',
  },
]
