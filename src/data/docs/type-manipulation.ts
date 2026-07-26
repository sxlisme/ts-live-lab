import type { DocsGroup } from '@/types/docs'

export const typeManipulationDocs: DocsGroup = {
  id: 'type-manipulation',
  title: '类型进阶',
  description: '从现有类型派生新类型，建立可复用的类型工具。',
  sections: [
    {
      id: 'type-operators',
      groupId: 'type-manipulation',
      title: 'keyof、typeof 与索引访问',
      shortTitle: '类型运算符',
      description: '从对象值和已有类型中提取键、属性与元素类型。',
      paragraphs: [
        '类型运算符让契约跟随真实数据和 API 演进，减少手工复制。它们只存在于类型位置，不会读取或改变运行时值。',
      ],
      topics: [
        {
          id: 'keyof',
          title: 'keyof 运算符',
          paragraphs: [
            'keyof T 产生 T 的已知属性键联合。带 string 索引签名的对象会得到 string | number，因为 JavaScript 会把数字属性键转换为字符串。',
          ],
          examples: [
            {
              title: '限制可访问的属性',
              code: `interface User {
  id: string
  name: string
  active: boolean
}

type UserKey = keyof User
// 'id' | 'name' | 'active'`,
            },
          ],
        },
        {
          id: 'type-query',
          title: '类型位置的 typeof',
          paragraphs: [
            'typeof value 在类型位置取得一个变量或属性的静态类型。它只能查询可引用的标识符或属性访问，通常与 ReturnType、keyof 和 as const 一起使用。',
          ],
          examples: [
            {
              title: '从配置值派生类型',
              code: `const defaults = {
  theme: 'light',
  pageSize: 20,
  features: ['search', 'export'],
} as const

type Defaults = typeof defaults
type Feature = Defaults['features'][number]`,
            },
          ],
        },
        {
          id: 'indexed-access',
          title: '索引访问类型',
          paragraphs: [
            'T[K] 取得属性 K 对应的类型。K 可以是键的联合，此时结果也是对应属性类型的联合。数组元素类型可通过 T[number] 提取。',
          ],
          examples: [
            {
              title: '提取数组元素',
              code: `const events = [
  { type: 'login', userId: 'u1' },
  { type: 'logout', userId: 'u2' },
] as const

type Event = (typeof events)[number]
type EventType = Event['type']`,
            },
          ],
        },
        {
          id: 'satisfies',
          title: 'satisfies 运算符',
          paragraphs: [
            'satisfies 检查表达式兼容目标类型，同时保留表达式本身更精确的推断。它比类型注解更少拓宽信息，也比 as 断言更能发现错误。',
          ],
          examples: [
            {
              title: '校验配置并保留字面量',
              code: `type Routes = Record<string, { method: 'GET' | 'POST'; path: string }>

const routes = {
  users: { method: 'GET', path: '/users' },
  createUser: { method: 'POST', path: '/users' },
} satisfies Routes

routes.users.method // 仍推断为 'GET'`,
            },
          ],
        },
      ],
      relatedIds: ['generics', 'mapped-template-types'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/typeof-types.html',
    },
    {
      id: 'mapped-template-types',
      groupId: 'type-manipulation',
      title: '映射类型与模板字面量',
      shortTitle: '映射与模板',
      description: '遍历键集合，修改属性并用字符串模式生成新键。',
      paragraphs: [
        '映射类型基于 PropertyKey 联合逐个生成属性，模板字面量类型则在类型层组合字符串。二者结合可以从一个领域模型派生事件名、访问器或表单状态。',
      ],
      topics: [
        {
          id: 'mapped-basics',
          title: '映射类型基础',
          paragraphs: [
            '语法 [K in keyof T] 遍历属性键，并通过 T[K] 读取对应值类型。readonly 和 ? 前的加减号可以添加或移除修饰符。',
          ],
          examples: [
            {
              title: '递归只读',
              code: `type DeepReadonly<T> =
  T extends (...args: any[]) => unknown
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T`,
            },
          ],
        },
        {
          id: 'key-remapping',
          title: '通过 as 重映射键',
          paragraphs: [
            '映射类型中的 as 子句可以重命名键，产生 never 则会过滤该键。键重映射适合从模型生成 getters、事件处理器或去除内部字段。',
          ],
          examples: [
            {
              title: '生成 getter API',
              code: `type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
}

type UserGetters = Getters<{ name: string; age: number }>
// { getName(): string; getAge(): number }`,
            },
          ],
        },
        {
          id: 'template-literals',
          title: '模板字面量类型',
          paragraphs: [
            '模板字面量类型会对插值位置的联合执行笛卡尔积，生成所有可能字符串。内置 Uppercase、Lowercase、Capitalize 和 Uncapitalize 可调整字符大小写。',
          ],
          examples: [
            {
              title: '类型安全的事件名',
              code: `type Field = 'name' | 'email'
type EventName = \`\${Field}Changed\`

function on(event: EventName, handler: () => void) {}

on('emailChanged', () => {})`,
            },
          ],
          callout: {
            kind: 'warning',
            title: '控制联合规模',
            content: '多个大型联合交叉组合会显著增加编译成本；庞大字符串集合更适合由构建脚本生成。',
          },
        },
      ],
      relatedIds: ['type-operators', 'conditional-infer', 'utility-types'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/mapped-types.html',
    },
    {
      id: 'conditional-infer',
      groupId: 'type-manipulation',
      title: '条件类型与 infer',
      shortTitle: '条件与 infer',
      description: '在类型层匹配结构、选择分支并提取内部类型。',
      paragraphs: [
        '条件类型 T extends U ? X : Y 根据可赋值关系选择结果。它们适合封装重复类型逻辑，但过深递归会让诊断难以理解，应给中间结果起名。',
      ],
      topics: [
        {
          id: 'conditional-basics',
          title: '条件类型基础',
          paragraphs: [
            '泛型条件类型会根据调用方的具体类型得到不同结果。约束决定哪些输入允许，条件分支决定结果如何变化，这两者职责不同。',
          ],
          examples: [
            {
              title: '根据输入选择返回类型',
              code: `type Flatten<T> = T extends readonly (infer Item)[] ? Item : T

type A = Flatten<string[]> // string
type B = Flatten<number>   // number`,
            },
          ],
        },
        {
          id: 'infer',
          title: '用 infer 提取结构',
          paragraphs: [
            'infer 只能出现在条件类型的 extends 模式中，它声明一个由匹配结果决定的类型变量。可以从函数、Promise、数组、模板字符串等结构提取部分类型。',
          ],
          examples: [
            {
              title: '提取异步函数结果',
              code: `type AsyncResult<T> =
  T extends (...args: any[]) => Promise<infer Result>
    ? Result
    : never

type User = AsyncResult<typeof fetchUser>`,
            },
          ],
        },
        {
          id: 'distributive-types',
          title: '分布式条件类型',
          paragraphs: [
            '当检查位置是裸类型参数 T 时，联合类型会逐成员进入条件分支，再把结果合并。用 [T] extends [U] 包裹两侧可关闭分发，让联合整体参与判断。',
          ],
          examples: [
            {
              title: '分发与整体判断',
              code: `type ToArray<T> = T extends unknown ? T[] : never
type Distributed = ToArray<string | number>
// string[] | number[]

type ToArrayWhole<T> = [T] extends [unknown] ? T[] : never
type Whole = ToArrayWhole<string | number>
// (string | number)[]`,
            },
          ],
        },
        {
          id: 'recursive-types',
          title: '递归条件类型',
          paragraphs: [
            '条件类型可以递归展开嵌套结构，例如 Awaited。递归需要明确终止分支，并警惕极深输入触发实例化深度限制。',
          ],
          callout: {
            kind: 'tip',
            title: '保持可读性',
            content:
              '如果错误信息只剩多层条件表达式，先提取命名辅助类型，而不是继续把逻辑压进一行。',
          },
        },
      ],
      relatedIds: ['generics', 'mapped-template-types', 'utility-types'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html',
    },
    {
      id: 'utility-types',
      groupId: 'type-manipulation',
      title: '标准工具类型',
      shortTitle: '工具类型',
      description: '使用标准库提供的常见类型转换，清晰表达派生意图。',
      paragraphs: [
        '标准工具类型本质上由映射类型和条件类型实现。优先使用通用名称能减少自定义代码，也让其他开发者更快理解转换目的。',
      ],
      topics: [
        {
          id: 'object-utilities',
          title: '对象属性工具',
          paragraphs: [
            'Partial、Required、Readonly 修改属性修饰符；Pick 与 Omit 选择或排除属性；Record 根据键和值构造对象。它们只改变静态类型，不会复制、过滤或冻结运行时对象。',
          ],
          examples: [
            {
              title: '围绕领域模型派生 DTO',
              code: `interface User {
  id: string
  name: string
  email: string
  passwordHash: string
}

type PublicUser = Omit<User, 'passwordHash'>
type UserPatch = Partial<Pick<User, 'name' | 'email'>>`,
            },
          ],
        },
        {
          id: 'union-utilities',
          title: '联合类型工具',
          paragraphs: [
            'Exclude 从联合中移除可赋给某类型的成员，Extract 保留匹配成员，NonNullable 移除 null 和 undefined。它们操作联合成员，不是对象属性。',
          ],
          examples: [
            {
              title: '筛选事件成员',
              code: `type AppEvent =
  | { type: 'click'; x: number; y: number }
  | { type: 'submit'; formId: string }
  | { type: 'close' }

type InteractiveEvent = Exclude<AppEvent, { type: 'close' }>`,
            },
          ],
        },
        {
          id: 'function-utilities',
          title: '函数与构造函数工具',
          paragraphs: [
            'Parameters 和 ReturnType 提取函数参数与返回值，ConstructorParameters 和 InstanceType 对构造函数执行类似操作。ThisParameterType 与 OmitThisParameter 可处理显式 this。',
          ],
          examples: [
            {
              title: '复用服务函数契约',
              code: `async function loadUser(id: string, includePosts = false) {
  return { id, includePosts }
}

type LoadUserArgs = Parameters<typeof loadUser>
type LoadedUser = Awaited<ReturnType<typeof loadUser>>`,
            },
          ],
        },
        {
          id: 'awaited',
          title: 'Awaited 与 Promise',
          paragraphs: [
            'Awaited 模拟 await 的递归展开行为，能处理嵌套 Promise 和联合中的 null、undefined。获取异步函数最终值时常与 ReturnType 组合。',
          ],
          callout: {
            kind: 'note',
            title: '避免平行类型',
            content:
              '如果 DTO 可以稳定地从公共函数或领域类型派生，就不要再维护一份容易漂移的手写副本。',
          },
        },
      ],
      relatedIds: ['mapped-template-types', 'conditional-infer'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/utility-types.html',
    },
  ],
}
