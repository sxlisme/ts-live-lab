import type { DocsGroup } from '@/types/docs'

export const typeSystemDocs: DocsGroup = {
  id: 'type-system',
  title: '核心类型系统',
  description: '用收窄、泛型、类和模块表达真实程序结构。',
  sections: [
    {
      id: 'unions-narrowing',
      groupId: 'type-system',
      title: '联合类型与类型收窄',
      shortTitle: '联合与收窄',
      description: '先表达所有可能性，再提供运行时证据缩小类型范围。',
      paragraphs: [
        '联合类型 A | B 表示值可能属于多个成员之一。TypeScript 的控制流分析会跟踪条件判断、提前返回和赋值，在每条路径上推导更精确的类型。',
      ],
      topics: [
        {
          id: 'built-in-guards',
          title: '内置类型守卫',
          paragraphs: [
            'typeof 适合原始值，instanceof 检查原型链，in 判断属性存在，等值比较可以收窄字面量和共享值。truthiness 能过滤部分空值，但要小心空字符串和数字 0 也会被过滤。',
          ],
          examples: [
            {
              title: '根据运行时证据收窄',
              code: `function normalize(value: string | string[] | null) {
  if (value === null) return []
  if (Array.isArray(value)) return value.map(item => item.trim())
  return [value.trim()]
}`,
            },
          ],
        },
        {
          id: 'type-predicates',
          title: '自定义类型谓词',
          paragraphs: [
            '返回值写成 value is T 的函数可以把业务检查告知控制流分析。谓词实现必须与声明保持一致；编译器不会证明函数内部真的完成了所有检查。',
          ],
          examples: [
            {
              title: '可复用的领域守卫',
              code: `interface User { id: string; name: string }

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false
  return 'id' in value && 'name' in value
}

const users = values.filter(isUser)`,
            },
          ],
          callout: {
            kind: 'warning',
            title: '谓词是一份承诺',
            content:
              '复杂外部数据优先交给运行时 schema；手写谓词遗漏字段时，静态类型仍会被错误地收窄。',
          },
        },
        {
          id: 'discriminated-unions',
          title: '判别联合',
          paragraphs: [
            '让每个成员共享一个字面量判别字段，可以把状态和其有效数据绑定起来。相比大量可选属性，这种建模能让非法状态无法表示。',
          ],
          examples: [
            {
              title: '请求状态建模',
              code: `type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

function render<T>(state: RequestState<T>) {
  if (state.status === 'success') return state.data
  if (state.status === 'error') return state.error.message
  return state.status
}`,
            },
          ],
        },
        {
          id: 'exhaustiveness',
          title: 'never 穷尽性检查',
          paragraphs: [
            '当所有联合成员都已被排除，剩余值的类型是 never。把 default 分支的值交给 assertNever，可在新增成员却忘记处理时得到编译错误。',
          ],
          examples: [
            {
              title: '检查所有分支',
              code: `function assertNever(value: never): never {
  throw new Error('Unexpected value: ' + String(value))
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2
    case 'square': return shape.size ** 2
    default: return assertNever(shape)
  }
}`,
            },
          ],
        },
      ],
      relatedIds: ['everyday-types', 'conditional-infer'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
    },
    {
      id: 'generics',
      groupId: 'type-system',
      title: '泛型、约束与类型关系',
      shortTitle: '泛型',
      description: '让输入和输出之间保持类型关系，而不是简单接受任意类型。',
      paragraphs: [
        '泛型参数是类型层面的变量。一个好的泛型 API 会保留调用者传入的具体信息，并限制实现只能使用约束允许的能力。',
      ],
      topics: [
        {
          id: 'generic-relations',
          title: '建立类型关系',
          paragraphs: [
            '当同一个类型参数出现在多个位置时，它们之间形成可验证的关系。只出现一次的类型参数通常没有带来约束，可能用 unknown 或具体类型更清楚。',
          ],
          examples: [
            {
              title: '保留输入元素类型',
              code: `function first<T>(items: readonly T[]): T | undefined {
  return items[0]
}

const value = first([{ id: 1, name: 'Ada' }])
// { id: number; name: string } | undefined`,
            },
          ],
        },
        {
          id: 'generic-constraints',
          title: '泛型约束',
          paragraphs: [
            'T extends Constraint 限制调用方可传入的类型，并允许实现安全使用约束上的成员。K extends keyof T 是最常见的组合之一。',
          ],
          examples: [
            {
              title: '类型安全的属性读取',
              code: `function getProperty<T, K extends keyof T>(object: T, key: K): T[K] {
  return object[key]
}

const user = { id: 1, name: 'Ada' }
const name = getProperty(user, 'name')`,
            },
          ],
        },
        {
          id: 'generic-defaults',
          title: '默认类型参数',
          paragraphs: [
            '默认类型参数能减少常见调用的显式配置。必需参数不能放在有默认值的参数之后；推断能得到类型时，推断结果优先于默认值。',
          ],
          examples: [
            {
              title: '带默认错误类型的结果',
              code: `type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

type UserResult = Result<User>
type ApiResult = Result<User, { code: string }>`,
            },
          ],
        },
        {
          id: 'variance',
          title: '协变与逆变直觉',
          paragraphs: [
            '只输出 T 的容器通常可以把更具体类型交给更宽类型使用；消费 T 的函数参数方向相反。strictFunctionTypes 会检查这类函数赋值，避免回调假设了调用方无法保证的更窄输入。',
          ],
          callout: {
            kind: 'tip',
            title: '先设计调用关系',
            content:
              '大多数业务代码无需写显式 variance 标记，但理解生产者和消费者方向有助于解释复杂赋值错误。',
          },
        },
      ],
      notes: ['类型参数应尽量靠近使用位置。', '优先推断，只有调用者需要控制时才暴露额外参数。'],
      relatedIds: ['functions', 'type-operators', 'conditional-infer'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/generics.html',
    },
    {
      id: 'classes',
      groupId: 'type-system',
      title: '类、可见性与抽象',
      shortTitle: '类',
      description: '使用类的实例侧、静态侧、继承和访问控制。',
      paragraphs: [
        'TypeScript 类沿用 JavaScript class 运行时语义，并增加参数属性、访问修饰符、抽象成员和 override 检查。类同时产生构造函数值和实例类型。',
      ],
      topics: [
        {
          id: 'class-members',
          title: '字段、构造函数与参数属性',
          paragraphs: [
            'strictPropertyInitialization 要求实例字段在声明处或构造函数中初始化。把可见性修饰符写在构造参数前会直接声明同名字段，适合简单依赖注入。',
          ],
          examples: [
            {
              title: '参数属性',
              code: `class UserService {
  constructor(
    private readonly repository: UserRepository,
    public readonly namespace = 'users',
  ) {}

  find(id: string) {
    return this.repository.findById(id)
  }
}`,
            },
          ],
        },
        {
          id: 'visibility',
          title: 'public、protected、private 与 #private',
          paragraphs: [
            'TypeScript 的 private 主要是编译期约束，JavaScript 的 #field 则在运行时真正私有。protected 允许子类访问。公开 API 默认 public，一般无需重复书写。',
          ],
          points: [
            '库需要运行时强封装时使用 #private。',
            '依赖测试替换或框架反射时，编译期 private 更灵活。',
            'readonly 只限制重新赋值，不代表对象深层不可变。',
          ],
        },
        {
          id: 'abstract-implements',
          title: 'abstract、implements 与 override',
          paragraphs: [
            'abstract 类可共享实现并要求子类完成特定成员。implements 只检查实例公开表面，不会改变类本身的推断。override 配合 noImplicitOverride 能捕获父类成员改名后意外产生的新方法。',
          ],
          examples: [
            {
              title: '抽象仓储',
              code: `abstract class Repository<T> {
  abstract findById(id: string): Promise<T | null>
}

class MemoryRepository<T extends { id: string }> extends Repository<T> {
  constructor(private readonly items: T[]) { super() }

  override async findById(id: string) {
    return this.items.find(item => item.id === id) ?? null
  }
}`,
            },
          ],
        },
        {
          id: 'class-static-side',
          title: '实例侧与静态侧',
          paragraphs: [
            '类名在类型位置通常指实例类型，typeof Class 才是构造函数及静态成员的类型。描述可实例化能力时，需要显式写 new 调用签名。',
          ],
          examples: [
            {
              title: '构造函数约束',
              code: `type Constructor<T> = new (...args: any[]) => T

function create<T>(Type: Constructor<T>): T {
  return new Type()
}`,
            },
          ],
        },
      ],
      relatedIds: ['object-types', 'generics'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/classes.html',
    },
    {
      id: 'modules',
      groupId: 'type-system',
      title: '模块、导入与解析',
      shortTitle: '模块',
      description: '让 TypeScript 的模块配置与真实运行时和打包工具保持一致。',
      paragraphs: [
        '包含顶层 import 或 export 的文件是模块，拥有独立作用域。模块解析决定一个导入字符串如何映射到文件，它必须与最终运行代码的工具保持一致。',
      ],
      topics: [
        {
          id: 'esm-cjs',
          title: 'ES Modules 与 CommonJS',
          paragraphs: [
            '现代浏览器和打包器优先使用 ESM。Node.js 项目应结合 package.json 的 type 字段、文件扩展名和 NodeNext 配置决定 ESM/CJS 边界，不要依赖开发环境碰巧可用的解析方式。',
          ],
          examples: [
            {
              title: '显式模块边界',
              code: `// math.ts
export function add(a: number, b: number) {
  return a + b
}

// app.ts
import { add } from './math.js'`,
            },
          ],
        },
        {
          id: 'type-only-imports',
          title: '仅类型导入与导出',
          paragraphs: [
            'import type 明确导入只用于类型，产物中会被删除。verbatimModuleSyntax 开启后，TypeScript 按你写下的 type 修饰符决定是否保留导入，模块行为更可预测。',
          ],
          examples: [
            {
              title: '区分类型和值',
              code: `import { createClient } from './client.js'
import type { ClientOptions, ApiResponse } from './types.js'

export type { ApiResponse }
export { createClient }`,
            },
          ],
        },
        {
          id: 'module-resolution',
          title: 'moduleResolution',
          paragraphs: [
            'Bundler 适合 Vite 等打包环境，NodeNext 模拟现代 Node.js 的 package exports 和扩展名规则。paths 只帮助编译器解析，并不会自动改写运行时路径，必须由打包器或运行环境提供同样映射。',
          ],
          callout: {
            kind: 'warning',
            title: '不要只修复编辑器红线',
            content: '如果 TypeScript 能解析而运行时不能加载，说明模块配置与真实执行环境不一致。',
          },
        },
        {
          id: 'package-exports',
          title: '包的类型入口',
          paragraphs: [
            '发布包可通过 package.json 的 exports 和 types 声明公开入口。消费者只能依赖公开子路径，内部目录不应成为隐式 API。不同模块格式需要分别验证类型和运行时代码能对应。',
          ],
        },
      ],
      relatedIds: ['declaration-files', 'tsconfig', 'project-structure'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/modules.html',
    },
  ],
}
