import type { DocsGroup } from '@/types/docs'

export const engineeringDocs: DocsGroup = {
  id: 'engineering',
  title: '工程实践',
  description: '把类型系统接入异步边界、库声明、配置和大型项目。',
  sections: [
    {
      id: 'async-errors',
      groupId: 'engineering',
      title: '异步代码与错误边界',
      shortTitle: '异步与错误',
      description: '正确描述 Promise、并发结果和无法信任的异常值。',
      paragraphs: [
        'async 函数始终返回 Promise。类型能描述成功值，却不能证明网络请求会成功，也不能自动验证响应结构；异步边界仍需要超时、取消、重试和运行时校验。',
      ],
      topics: [
        {
          id: 'promise-types',
          title: 'Promise 与 async 返回值',
          paragraphs: [
            'async 函数的显式返回类型写成 Promise<T>。Promise.all 会保留元组位置关系；Promise.allSettled 用判别联合表达每项成功或失败。',
          ],
          examples: [
            {
              title: '保留并发任务结果类型',
              code: `async function loadPage() {
  const [user, settings] = await Promise.all([
    fetchUser(),
    fetchSettings(),
  ] as const)

  return { user, settings }
}

type PageData = Awaited<ReturnType<typeof loadPage>>`,
            },
          ],
        },
        {
          id: 'catch-unknown',
          title: 'catch 中的 unknown',
          paragraphs: [
            'JavaScript 可以抛出任意值，因此 useUnknownInCatchVariables 会把 catch 变量视为 unknown。记录或展示错误前，先判断 Error、领域错误或其他值。',
          ],
          examples: [
            {
              title: '规范化未知异常',
              code: `function toError(value: unknown): Error {
  if (value instanceof Error) return value
  if (typeof value === 'string') return new Error(value)
  return new Error('Unknown failure', { cause: value })
}

try {
  await runTask()
} catch (cause) {
  logger.error(toError(cause))
}`,
            },
          ],
        },
        {
          id: 'result-pattern',
          title: '可预期失败与 Result',
          paragraphs: [
            '异常适合不可恢复或跨层传播的失败；业务中预期存在的失败可以用判别联合显式返回，让调用方在类型层看到所有分支。',
          ],
          examples: [
            {
              title: '显式业务失败',
              code: `type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

type LoginError = 'invalid_credentials' | 'locked'

async function login(input: Credentials): Promise<Result<User, LoginError>> {
  // ...
}`,
            },
          ],
        },
        {
          id: 'runtime-validation',
          title: '运行时数据校验',
          paragraphs: [
            'fetch().json() 返回的数据来自信任边界。先以 unknown 接收并通过 schema 解析，可以让运行时证据与静态输出类型保持一致。',
          ],
          callout: {
            kind: 'warning',
            title: '断言不会保护生产数据',
            content:
              'const user = await response.json() as User 不会检查字段；服务端响应变化后代码仍可能在运行时崩溃。',
          },
        },
      ],
      relatedIds: ['unions-narrowing', 'utility-types'],
      sourceUrl:
        'https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#defaulting-to-the-unknown-type-in-catch-variables',
    },
    {
      id: 'declaration-files',
      groupId: 'engineering',
      title: '声明文件与库类型',
      shortTitle: '声明文件',
      description: '用 .d.ts 描述现有 JavaScript 的公开类型表面。',
      paragraphs: [
        '声明文件不包含运行实现，只告诉 TypeScript 某段 JavaScript 如何被使用。声明必须与运行时行为同步，否则它比缺少类型更危险。',
      ],
      topics: [
        {
          id: 'declaration-sources',
          title: '声明从哪里来',
          paragraphs: [
            '库可以自带声明，也可以由 DefinitelyTyped 的 @types 包补充。项目内部的无类型模块可写最小声明作为迁移边界，并逐步替换为从源码生成的类型。',
          ],
          points: [
            '优先使用库自带且与版本一起发布的声明。',
            '安装 @types/package 前先确认库本身没有 types。',
            '不要用 declare module "*" 长期屏蔽所有模块问题。',
          ],
        },
        {
          id: 'module-declarations',
          title: '模块声明',
          paragraphs: [
            '环境模块声明用字符串名称描述无法由源码推断的模块。相对模块名通常由真实 .ts/.d.ts 文件提供，而不是写在环境模块中。',
          ],
          examples: [
            {
              title: '为资源模块补充类型',
              code: `declare module '*.svg?raw' {
  const source: string
  export default source
}

declare module 'legacy-parser' {
  export function parse(input: string): unknown
}`,
            },
          ],
        },
        {
          id: 'global-augmentation',
          title: '全局与模块扩充',
          paragraphs: [
            '声明合并可以扩充已有接口。全局扩充必须位于模块文件的 declare global 中；模块扩充通过原模块名添加成员，但不能新增默认导出。',
          ],
          examples: [
            {
              title: '扩充全局 Window',
              code: `export {}

declare global {
  interface Window {
    analytics: {
      track(event: string): void
    }
  }
}`,
            },
          ],
        },
        {
          id: 'library-publishing',
          title: '发布声明',
          paragraphs: [
            '库通常开启 declaration 和 declarationMap，从源码生成 .d.ts 与映射。package.json 的 exports 应同时指向正确的运行代码和类型入口，并在打包测试中从消费者角度导入。',
          ],
          callout: {
            kind: 'tip',
            title: '为声明写测试',
            content: '使用消费者示例和预期错误用例验证公共类型，避免实现测试通过但发布类型不可用。',
          },
        },
      ],
      relatedIds: ['modules', 'project-structure'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html',
    },
    {
      id: 'tsconfig',
      groupId: 'engineering',
      title: 'tsconfig 严格配置指南',
      shortTitle: 'tsconfig',
      description: '根据执行环境选择模块策略，并逐层提升类型安全。',
      paragraphs: [
        'tsconfig 既是编译器输入，也是团队对目标环境和安全级别的共同约定。配置应有明确原因，并在 CI 中验证，而不是从其他项目整份复制。',
      ],
      topics: [
        {
          id: 'strict-family',
          title: 'strict 选项族',
          paragraphs: [
            'strict 是多个严格检查的总开关，包括空值、隐式 any、函数参数、类字段初始化和 catch 变量等。可以在遗留项目中逐项迁移，新项目则应直接开启。',
          ],
          examples: [
            {
              title: '推荐的安全补充项',
              language: 'json',
              code: `{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}`,
            },
          ],
        },
        {
          id: 'target-lib',
          title: 'target 与 lib',
          paragraphs: [
            'target 控制输出 JavaScript 语法级别，并决定默认 lib。lib 声明可用的运行时 API，但不会添加 polyfill。若代码类型检查通过却在旧环境报错，需要补充实现或降低使用范围。',
          ],
        },
        {
          id: 'module-options',
          title: 'module 与 moduleResolution',
          paragraphs: [
            '前端打包项目通常使用 ESNext + Bundler，Node.js 使用 NodeNext，库作者则需要同时考虑消费者和输出格式。verbatimModuleSyntax 能减少导入擦除带来的隐式行为。',
          ],
          examples: [
            {
              title: 'Vite 应用配置片段',
              language: 'json',
              code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noEmit": true
  }
}`,
            },
          ],
        },
        {
          id: 'include-exclude',
          title: '文件边界与配置继承',
          paragraphs: [
            'files、include 和 exclude 决定根文件集合，但导入到根文件的依赖仍会进入程序。共享配置可通过 extends 继承，应用和测试应在独立配置中声明各自环境类型。',
          ],
          callout: {
            kind: 'note',
            title: '检查最终配置',
            content:
              '复杂继承关系可用 tsc --showConfig 查看合并结果，用 tsc --explainFiles 追踪文件为何进入项目。',
          },
        },
      ],
      relatedIds: ['getting-started', 'modules', 'project-structure'],
      sourceUrl: 'https://www.typescriptlang.org/tsconfig/',
    },
    {
      id: 'project-structure',
      groupId: 'engineering',
      title: '大型项目与渐进迁移',
      shortTitle: '项目组织',
      description: '建立模块边界、增量构建、类型测试和 JavaScript 迁移路径。',
      paragraphs: [
        '类型系统不能替代架构边界。大型项目需要控制公共 API、避免循环依赖，并让构建图与业务模块所有权保持一致。',
      ],
      topics: [
        {
          id: 'project-references',
          title: 'Project References',
          paragraphs: [
            'references 与 composite 把仓库拆成可独立构建的子项目。tsc --build 会按依赖顺序增量检查，编辑器也能减少一次加载的项目规模。',
          ],
          examples: [
            {
              title: '根构建配置',
              language: 'json',
              code: `{
  "files": [],
  "references": [
    { "path": "./packages/domain" },
    { "path": "./packages/api" },
    { "path": "./apps/web" }
  ]
}`,
            },
          ],
        },
        {
          id: 'public-boundaries',
          title: '公共 API 与类型所有权',
          paragraphs: [
            '每个模块通过明确入口导出稳定契约，内部辅助类型不应被深路径引用。类型应靠近拥有其业务含义的模块，而不是集中到一个无边界的全局 types 文件。',
          ],
          points: [
            '从模块 index 导出公共契约。',
            '避免跨层导入内部实现类型。',
            'DTO、领域实体和数据库模型承担不同职责时应分开。',
          ],
        },
        {
          id: 'js-migration',
          title: '从 JavaScript 渐进迁移',
          paragraphs: [
            'allowJs 允许 JS 与 TS 共存，checkJs 或 // @ts-check 可先对高价值文件启用检查。优先修复模块边界和输入输出，不要一开始追求所有内部变量都有注解。',
          ],
          examples: [
            {
              title: '用 JSDoc 建立过渡契约',
              language: 'javascript',
              code: `// @ts-check

/**
 * @param {{ id: string, name: string }} user
 * @returns {string}
 */
export function formatUser(user) {
  return user.id + ': ' + user.name
}`,
            },
          ],
        },
        {
          id: 'type-testing',
          title: '类型测试与质量门禁',
          paragraphs: [
            '运行时测试验证行为，类型测试验证调用契约。可通过示例编译、@ts-expect-error 和专用断言库覆盖公共类型，并把 tsc、lint、单元测试与构建放入 CI。',
          ],
          callout: {
            kind: 'warning',
            title: '只用 skipLibCheck 解决速度问题不够',
            content:
              '它跳过声明文件内部检查，但不会修复重复类型、错误包入口或应用自身的类型不兼容。',
          },
        },
      ],
      relatedIds: ['tsconfig', 'declaration-files', 'modules'],
      sourceUrl: 'https://www.typescriptlang.org/docs/handbook/project-references.html',
    },
  ],
}
