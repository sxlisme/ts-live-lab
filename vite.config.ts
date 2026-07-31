import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

interface PackageManifest {
  version: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface PackageLock {
  packages?: Record<string, { version?: string }>
}

function readJson<T>(url: URL) {
  return JSON.parse(readFileSync(url, 'utf8')) as T
}

const packageManifest = readJson<PackageManifest>(new URL('./package.json', import.meta.url))
const packageLock = readJson<PackageLock>(new URL('./package-lock.json', import.meta.url))
const technologyPackages = [
  { name: 'Vue', packageName: 'vue', category: '前端核心', role: '界面框架' },
  { name: 'Vue Router', packageName: 'vue-router', category: '前端核心', role: '客户端路由' },
  { name: 'TypeScript', packageName: 'typescript', category: '前端核心', role: '类型系统与编译器' },
  { name: 'Vite', packageName: 'vite', category: '前端核心', role: '开发与构建工具' },
  { name: 'CodeMirror', packageName: 'codemirror', category: '编辑体验', role: '代码编辑器' },
  { name: 'VueUse', packageName: '@vueuse/core', category: '编辑体验', role: '浏览器组合式工具' },
  { name: 'Lucide', packageName: 'lucide-vue-next', category: '编辑体验', role: '界面图标' },
  { name: 'Prettier', packageName: 'prettier', category: '编辑体验', role: '代码格式化' },
  { name: 'Express', packageName: 'express', category: '服务端', role: 'HTTP API 服务' },
  { name: 'PostgreSQL Driver', packageName: 'pg', category: '服务端', role: '数据持久化' },
  { name: 'Zod', packageName: 'zod', category: '服务端', role: '输入校验' },
  { name: 'Anthropic SDK', packageName: '@anthropic-ai/sdk', category: 'AI 集成', role: 'AI 审查接口' },
  { name: 'Vitest', packageName: 'vitest', category: '工程质量', role: '单元测试' },
  { name: 'Playwright', packageName: '@playwright/test', category: '工程质量', role: '浏览器测试' },
].map((dependency) => ({
  ...dependency,
  version:
    packageLock.packages?.[`node_modules/${dependency.packageName}`]?.version ??
    packageManifest.dependencies?.[dependency.packageName] ??
    packageManifest.devDependencies?.[dependency.packageName] ??
    'unknown',
}))

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(packageManifest.version),
    __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __APP_DEPENDENCIES__: JSON.stringify(technologyPackages),
  },
  optimizeDeps: {
    include: ['prettier/standalone', 'prettier/plugins/typescript', 'prettier/plugins/estree'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': 'http://127.0.0.1:8787',
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/@codemirror/') ||
            id.includes('/node_modules/codemirror/')
          ) {
            return 'editor'
          }
          if (id.includes('/node_modules/lucide-vue-next/')) return 'icons'
        },
      },
    },
  },
})
