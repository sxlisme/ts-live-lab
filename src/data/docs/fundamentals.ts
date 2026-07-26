import type { DocsGroup } from '@/types/docs'

export const fundamentalsDocs: DocsGroup = {
  id: 'fundamentals',
  title: '快速入门',
  description: '建立 TypeScript 的编译、推断和基础语法模型。',
  sections: [
    {
      id: 'getting-started',
      groupId: 'fundamentals',
      title: '从 JavaScript 到 TypeScript',
      shortTitle: '开始使用',
      description: '理解 TypeScript 做了什么、没有做什么，以及如何建立第一个严格项目。',
      paragraphs: [
        'TypeScript 是 JavaScript 的静态类型超集。它在开发和构建阶段检查程序，随后擦除类型并输出普通 JavaScript。浏览器和 Node.js 最终执行的仍然是 JavaScript。',
        '采用 TypeScript 的核心收益不是多写注解，而是让数据关系、状态变化和模块边界可以被工具验证。类型推断会承担大量工作，你只需在公共 API 和不明确的边界补充信息。',
      ],
      topics: [
        {
          id: 'compile-model',
          title: '编译模型',
          paragraphs: [
            'tsc 会解析源码、建立类型关系、报告诊断并按配置输出 JavaScript。类型注解、interface 和大部分类型运算不会出现在产物中，因此它们不能替代运行时校验。',
            '来自接口、文件、表单或消息队列的数据在运行时仍是 unknown。先校验，再把结果交给业务代码，是比直接断言更可靠的边界策略。',
          ],
          examples: [
            {
              title: '类型在编译后被擦除',
              code: `function double(value: number): number {
  return value * 2
}

const result = double(21)`,
            },
          ],
          callout: {
            kind: 'warning',
            title: '类型不等于校验',
            content: '把 JSON.parse 的结果写成 User 只是在告诉编译器相信你，并没有检查真实数据。',
          },
        },
        {
          id: 'first-project',
          title: '建立严格项目',
          paragraphs: [
            '新项目建议从 strict 开始，并让构建工具负责转译、让 tsc --noEmit 专注类型检查。Vite 前端通常使用 ESNext 与 Bundler 模块策略，Node.js 服务则应匹配实际 Node 版本和模块格式。',
          ],
          examples: [
            {
              title: '最小严格配置',
              language: 'json',
              code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}`,
            },
          ],
        },
        {
          id: 'annotation-strategy',
          title: '什么时候写注解',
          paragraphs: [
            '局部变量已有清晰初始值时，推断通常比重复注解更准确。函数参数、导出的公共 API、递归函数和空集合则适合显式标注。',
          ],
          points: [
            '让 const count = 0 自然推断为 number。',
            '为函数参数和对外返回值写清楚契约。',
            '为空数组和空对象提供目标类型，避免得到过窄或不明确的推断。',
            '不要用 any 作为消除错误的默认方案。',
          ],
        },
      ],
      notes: ['先保护数据边界，再逐步覆盖内部实现。', '在 CI 中运行 tsc --noEmit。'],
      relatedIds: ['everyday-types', 'tsconfig'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html',
    },
    {
      id: 'everyday-types',
      groupId: 'fundamentals',
      title: '日常类型与字面量',
      shortTitle: '基础类型',
      description: '原始类型、数组、元组、字面量与 unknown 构成日常编码的基础词汇。',
      paragraphs: [
        'TypeScript 的类型应描述 JavaScript 值真实可能出现的形态。尽量使用小写原始类型，让字面量和 const 推断保留有用信息，并用 unknown 表示尚未确认的输入。',
      ],
      topics: [
        {
          id: 'primitives',
          title: '原始类型与空值',
          paragraphs: [
            '常见原始类型包括 string、number、boolean、bigint、symbol、null 和 undefined。strictNullChecks 开启后，null 与 undefined 不会自动兼容其他类型，调用方必须明确处理缺失值。',
          ],
          examples: [
            {
              title: '明确处理缺失值',
              code: `function formatName(name: string | undefined) {
  return name?.trim() || '匿名用户'
}

const label = formatName(undefined)`,
            },
          ],
        },
        {
          id: 'arrays-tuples',
          title: '数组与元组',
          paragraphs: [
            'T[] 和 Array<T> 都表示同类元素数组。元组固定每个位置的含义和类型，适合坐标、函数返回对或协议记录；如果字段需要名称和频繁演进，对象通常更易维护。',
          ],
          examples: [
            {
              title: '只读数组与命名元组',
              code: `const ports: readonly number[] = [3000, 5173]

type Entry = [name: string, port: number]
const api: Entry = ['api', 8787]`,
            },
          ],
          callout: {
            kind: 'tip',
            title: '优先接受 readonly',
            content:
              '只读取数组的函数把参数写成 readonly T[]，既能接收普通数组，也能接收只读数组。',
          },
        },
        {
          id: 'literal-types',
          title: '字面量类型与 as const',
          paragraphs: [
            '字面量类型把可能值限制为具体字符串、数字或布尔值。as const 会阻止字面量拓宽，并把对象属性与数组元素标记为只读，常用于从数据派生联合类型。',
          ],
          examples: [
            {
              title: '从常量派生联合',
              code: `const roles = ['admin', 'member', 'guest'] as const
type Role = (typeof roles)[number]

function canEdit(role: Role) {
  return role === 'admin'
}`,
            },
          ],
        },
        {
          id: 'unknown-any',
          title: 'unknown、any 与 never',
          paragraphs: [
            'any 关闭后续类型检查，适合极少数迁移边界；unknown 可以接收任意值，但使用前必须收窄。never 表示不可能出现的值，常用于不会返回的函数和穷尽性检查。',
          ],
          examples: [
            {
              title: '安全处理未知输入',
              code: `function readMessage(value: unknown): string {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return String(value.message)
  }
  return '未知错误'
}`,
            },
          ],
        },
      ],
      relatedIds: ['unions-narrowing', 'type-operators'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html',
    },
    {
      id: 'object-types',
      groupId: 'fundamentals',
      title: '对象、interface 与 type',
      shortTitle: '对象类型',
      description: '描述属性、可选性、只读约束和开放键集合。',
      paragraphs: [
        'JavaScript 大部分数据都以对象组织。好的对象类型会明确哪些字段必需、哪些字段可缺失、谁能修改它们，以及是否允许额外键。',
      ],
      topics: [
        {
          id: 'interface-type',
          title: 'interface 与 type 如何选择',
          paragraphs: [
            '二者都能描述对象并支持扩展。interface 支持声明合并，适合库的公开扩展点；type 能表达联合、元组和类型运算。普通业务对象选择团队统一的写法即可。',
          ],
          examples: [
            {
              title: '扩展对象契约',
              code: `interface User {
  readonly id: string
  name: string
}

interface Admin extends User {
  permissions: string[]
}

type UserId = User['id']`,
            },
          ],
        },
        {
          id: 'optional-readonly',
          title: '可选属性与只读属性',
          paragraphs: [
            'prop?: T 表示属性可以不存在；读取时需要考虑 undefined。readonly 阻止通过当前类型写入，但不会在运行时冻结对象，也不代表嵌套对象自动只读。',
          ],
          examples: [
            {
              title: '精确的更新输入',
              code: `interface UserPatch {
  name?: string
  avatarUrl?: string | null
}

function updateUser(id: string, patch: Readonly<UserPatch>) {
  // patch 顶层属性不可被重新赋值
}`,
            },
          ],
        },
        {
          id: 'index-signatures',
          title: '索引签名与 Record',
          paragraphs: [
            '当属性名在运行时确定时，可使用索引签名或 Record。显式属性必须兼容索引签名的值类型；如果键集合是有限联合，Record 通常能提供更完整的缺失键检查。',
          ],
          examples: [
            {
              title: '有限键集合',
              code: `type Locale = 'zh-CN' | 'en-US'
type Messages = Record<Locale, Record<string, string>>

const messages: Messages = {
  'zh-CN': { save: '保存' },
  'en-US': { save: 'Save' },
}`,
            },
          ],
        },
        {
          id: 'excess-properties',
          title: '多余属性检查与结构类型',
          paragraphs: [
            'TypeScript 使用结构类型：只要值拥有目标类型所需成员，就可以兼容。对象字面量直接赋给目标类型时还会触发多余属性检查，用来捕获拼写错误，但它不是严格的“只能有这些键”。',
          ],
          callout: {
            kind: 'note',
            title: '需要精确对象时',
            content:
              '静态类型无法自动拒绝运行时额外字段。API 边界应由运行时 schema 决定是否 strip 或 reject。',
          },
        },
      ],
      relatedIds: ['mapped-template-types', 'utility-types'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/objects.html',
    },
    {
      id: 'functions',
      groupId: 'fundamentals',
      title: '函数类型与调用契约',
      shortTitle: '函数',
      description: '掌握参数、回调、重载、this 和不会返回的函数。',
      paragraphs: [
        '函数类型不仅描述参数和返回值，还表达调用方式、可选参数、this 上下文和输入输出之间的对应关系。让签名贴近调用者看到的行为，而不是实现细节。',
      ],
      topics: [
        {
          id: 'function-signatures',
          title: '调用签名与函数类型',
          paragraphs: [
            '函数类型可用箭头语法表达；当函数本身还带属性时，可在对象类型中写调用签名。回调参数应只要求实现真正需要的最小能力。',
          ],
          examples: [
            {
              title: '带属性的可调用对象',
              code: `type Parser = {
  (input: string): unknown
  version: string
}

function useParser(parser: Parser) {
  return parser('{"ok":true}')
}`,
            },
          ],
        },
        {
          id: 'optional-rest',
          title: '可选、默认与剩余参数',
          paragraphs: [
            '可选参数必须位于必需参数之后。默认参数对调用方表现为可选。剩余参数把不定数量实参收集为数组，也可以使用元组精确描述每个位置。',
          ],
          examples: [
            {
              title: '元组剩余参数',
              code: `function createUser(...args: [name: string, age?: number]) {
  const [name, age = 18] = args
  return { name, age }
}`,
            },
          ],
        },
        {
          id: 'overloads',
          title: '函数重载',
          paragraphs: [
            '当不同输入对应不同输出时，重载能给调用方精确信息。实现签名必须兼容所有重载，但对调用方不可见。若一个联合参数已经能准确表达行为，就不必增加重载。',
          ],
          examples: [
            {
              title: '输入决定输出',
              code: `function parse(value: string): Date
function parse(value: number): Date
function parse(value: string | number): Date {
  return new Date(value)
}`,
            },
          ],
        },
        {
          id: 'void-never-this',
          title: 'void、never 与 this',
          paragraphs: [
            'void 回调表示调用方不会使用返回值，不意味着实现绝不能返回内容。never 表示函数无法正常完成。显式 this 参数只参与类型检查，不会出现在输出 JavaScript 中。',
          ],
          examples: [
            {
              title: '声明 this 上下文',
              code: `interface Counter {
  value: number
  increment(this: Counter, step?: number): void
}

function fail(message: string): never {
  throw new Error(message)
}`,
            },
          ],
        },
      ],
      relatedIds: ['generics', 'conditional-infer'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/functions.html',
    },
  ],
}
