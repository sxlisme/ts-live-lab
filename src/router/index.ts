import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'playground',
      component: () => import('@/views/PlaygroundView.vue'),
      meta: { title: '运行台' },
    },
    {
      path: '/web-preview',
      name: 'web-preview',
      component: () => import('@/views/WebPreviewView.vue'),
      meta: { title: 'Web 预览' },
    },
    {
      path: '/snippets',
      name: 'snippets',
      component: () => import('@/views/SnippetsView.vue'),
      meta: { title: '代码片段' },
    },
    {
      path: '/practice',
      name: 'practice',
      component: () => import('@/views/PracticeView.vue'),
      meta: { title: '面试练习' },
    },
    {
      path: '/docs',
      name: 'docs',
      component: () => import('@/views/DocsView.vue'),
      meta: { title: 'TS 文档' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { title: 'AI 配置' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: '关于' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'TypeRoom')} · TypeRoom`
})
