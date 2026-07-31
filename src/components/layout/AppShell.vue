<script setup lang="ts">
import AuthDialog from '@/components/auth/AuthDialog.vue'
import { useAuth } from '@/composables/useAuth'
import {
  BookOpenText,
  Bot,
  Braces,
  Code2,
  LayoutPanelTop,
  Library,
  Info,
  Menu,
  LogIn,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

const isCollapsed = ref(false)
const isMobileOpen = ref(false)
const loggingOut = ref(false)
const { user, loadSession, logout, openAuthDialog } = useAuth()

const navItems = [
  { to: '/', label: '运行台', icon: Code2 },
  { to: '/snippets', label: '代码片段', icon: Library },
  { to: '/web-preview', label: 'Web 预览', icon: LayoutPanelTop },
  { to: '/practice', label: '面试练习', icon: Braces },
  { to: '/docs', label: 'TS 文档', icon: BookOpenText },
  { to: '/settings', label: 'AI 配置', icon: Bot },
  { to: '/about', label: '关于', icon: Info },
]

function closeMobile() {
  isMobileOpen.value = false
}

async function confirmLogout() {
  if (loggingOut.value || !window.confirm('确定退出当前账号吗？')) return
  loggingOut.value = true
  try {
    await logout()
    closeMobile()
  } catch {
    window.alert('退出登录失败，请稍后重试。')
  } finally {
    loggingOut.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMobile()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  loadSession().catch(() => undefined)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': isCollapsed }">
    <button
      class="mobile-menu-button icon-button"
      type="button"
      title="打开导航"
      aria-label="打开导航"
      @click="isMobileOpen = true"
    >
      <Menu :size="20" />
    </button>

    <div v-if="isMobileOpen" class="sidebar-scrim" @click="closeMobile" />

    <aside class="sidebar" :class="{ 'mobile-open': isMobileOpen }">
      <div class="brand-row">
        <RouterLink class="brand" to="/" @click="closeMobile">
          <span class="brand-mark"><Braces :size="20" /></span>
          <span v-if="!isCollapsed" class="brand-copy">
            <strong>TypeRoom</strong>
            <small>TS LAB</small>
          </span>
        </RouterLink>
        <button
          class="mobile-close icon-button"
          type="button"
          title="关闭导航"
          aria-label="关闭导航"
          @click="closeMobile"
        >
          <X :size="19" />
        </button>
      </div>

      <nav class="primary-nav" aria-label="主导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :title="isCollapsed ? item.label : undefined"
          @click="closeMobile"
        >
          <component :is="item.icon" :size="19" />
          <span v-if="!isCollapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-account">
        <div v-if="user" class="account-user" :title="isCollapsed ? user.username : undefined">
          <span>{{ [...user.username][0]?.toUpperCase() }}</span>
          <strong v-if="!isCollapsed">{{ user.username }}</strong>
          <button
            v-if="!isCollapsed"
            type="button"
            title="退出登录"
            aria-label="退出登录"
            :disabled="loggingOut"
            @click="confirmLogout"
          >
            <LogOut :size="16" />
          </button>
        </div>
        <button
          v-else
          class="account-login"
          type="button"
          :title="isCollapsed ? '登录' : undefined"
          @click="openAuthDialog('login')"
        >
          <LogIn :size="17" />
          <span v-if="!isCollapsed">登录</span>
        </button>
      </div>

      <div class="sidebar-footer">
        <div v-if="!isCollapsed" class="runtime-note">
          <span class="status-dot" />
          <span>浏览器沙箱</span>
        </div>
        <button
          class="collapse-button icon-button"
          type="button"
          :title="isCollapsed ? '展开侧栏' : '收起侧栏'"
          :aria-label="isCollapsed ? '展开侧栏' : '收起侧栏'"
          @click="isCollapsed = !isCollapsed"
        >
          <PanelLeftOpen v-if="isCollapsed" :size="19" />
          <PanelLeftClose v-else :size="19" />
        </button>
      </div>
    </aside>

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <AuthDialog />
  </div>
</template>
