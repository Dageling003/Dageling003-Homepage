<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useTabStore } from '@/stores/tabs'
import { useAdminThemeStore } from '@/stores/theme'
import { useRouter, useRoute } from 'vue-router'
import { ref, computed, h, watch } from 'vue'
import {
  DashboardOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
  AuditOutlined,
  IdcardOutlined,
  LinkOutlined,
  CodeOutlined,
  CheckSquareOutlined,
  MessageOutlined,
} from '@ant-design/icons-vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppTab from '@/components/AppTab.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'

const authStore = useAuthStore()
const tabStore = useTabStore()
const themeStore = useAdminThemeStore()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const avatarStyle = { backgroundColor: '#1677ff' }
const noSidebar = computed(() => route.meta?.noSidebar === true)

// Route title map for tabs
const ROUTE_TITLES: Record<string, string> = {
  dashboard: '仪表盘',
  'config-personal': '个人信息',
  'config-links': '快捷链接',
  'config-techs': '技术栈',
  'config-todos': 'ToDo',
  'config-typewriter': '打字机',
  account: '账号设置',
  audit: '操作日志',
}

// Sync tabs with route changes
watch(
  () => route.path,
  (path) => {
    const name = route.name as string
    const key = name || path.split('/').filter(Boolean).pop() || 'dashboard'
    const title = ROUTE_TITLES[key] || (route.meta?.title as string) || key
    tabStore.addTab({ key, title, path, closable: key !== 'dashboard' })
  },
  { immediate: true },
)

function toggleTheme() {
  themeStore.toggleDark()
}

function getTheme() {
  return themeStore.isDark ? 'dark' : 'light'
}

const menuItems = [
  {
    key: '/dashboard',
    icon: () => h(DashboardOutlined),
    label: '仪表盘',
  },
  {
    key: 'config-group',
    icon: () => h(SettingOutlined),
    label: '配置管理',
    children: [
      { key: '/config/personal',   icon: () => h(IdcardOutlined),     label: '个人信息' },
      { key: '/config/links',      icon: () => h(LinkOutlined),       label: '快捷链接' },
      { key: '/config/techs',      icon: () => h(CodeOutlined),       label: '技术栈' },
      { key: '/config/todos',      icon: () => h(CheckSquareOutlined),label: 'ToDo' },
      { key: '/config/typewriter', icon: () => h(MessageOutlined),    label: '打字机' },
    ],
  },
  {
    key: '/account',
    icon: () => h(UserOutlined),
    label: '账号设置',
  },
  {
    key: '/audit',
    icon: () => h(AuditOutlined),
    label: '操作日志',
  },
]

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <a-layout class="al-root" :class="{ 'al-dark': themeStore.isDark }">
    <!-- ====== SIDEBAR (hidden for setup) ====== -->
    <template v-if="!noSidebar">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :theme="getTheme()"
      :width="220"
      collapsed-width="64"
      class="al-sider"
    >
      <div class="al-logo">
        <span class="al-logo-icon">🧩</span>
        <span v-show="!collapsed" class="al-logo-text">homepage 管理</span>
      </div>

      <a-menu
        mode="inline"
        :theme="getTheme()"
        :selected-keys="[route.path]"
        :open-keys="route.path.startsWith('/config/') ? ['config-group'] : []"
        :items="menuItems"
        @click="handleMenuClick"
      />

      <!-- Collapse trigger at bottom -->
      <template #trigger>
        <div class="al-sider-trigger">
          <MenuFoldOutlined v-if="!collapsed" />
          <MenuUnfoldOutlined v-else />
        </div>
      </template>
    </a-layout-sider>
    </template>

    <!-- ====== MAIN AREA ====== -->
    <a-layout>
      <!-- ====== HEADER (hidden for setup) ====== -->
      <template v-if="!noSidebar">
      <!-- ====== HEADER ====== -->
      <a-layout-header class="al-header">
        <div class="al-header-left">
          <AppBreadcrumb />
        </div>

        <div class="al-header-right">
          <a-button type="text" @click="toggleTheme" :title="themeStore.isDark ? '切换亮色' : '切换暗色'">
            <template #icon>
              <BulbFilled v-if="themeStore.isDark" style="color: #fbbf24; font-size: 1.1rem" />
              <BulbOutlined v-else style="font-size: 1.1rem" />
            </template>
          </a-button>

          <a-dropdown :trigger="['click']">
            <div class="al-user">
              <a-avatar size="small" :style="avatarStyle">
                <template v-if="authStore.avatarUrl">
                  <img :src="authStore.avatarUrl" alt="avatar" />
                </template>
                <template v-else>
                  {{ authStore.username?.charAt(0)?.toUpperCase() }}
                </template>
              </a-avatar>
              <span class="al-username">{{ authStore.username }}</span>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="account" @click="router.push('/account')">
                  <UserOutlined /> 账号设置
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout" danger>
                  <LogoutOutlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- ====== TABS ====== -->
      <AppTab />

      </template>

      <!-- ====== CONTENT (always visible) ====== -->
      <a-layout-content class="al-content" :class="{ 'al-content-full': noSidebar }">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>

      <!-- ====== FOOTER ====== -->
      <a-layout-footer class="al-footer">
        <span>© 2026 homepage</span>
        <span class="al-footer-ver">v0.6.1</span>
      </a-layout-footer>
    </a-layout>

    <!-- ====== THEME SETTINGS PANEL ====== -->
    <ThemeSettings />
  </a-layout>
</template>

<style scoped>
/* ========== ROOT ========== */
.al-root {
  height: 100vh;
}

/* ========== SIDEBAR ========== */
.al-sider {
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.03);
  z-index: 10;
}

.al-logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 700;
  font-size: 1rem;
}

.al-logo-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.al-logo-text {
  white-space: nowrap;
}

/* ========== HEADER ========== */
.al-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  line-height: 48px;
}

.al-header-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.al-header-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.al-sider-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  font-size: 1rem;
  color: #8c8c8c;
  cursor: pointer;
  transition: all 0.2s;
  border-top: 1px solid #f0f0f0;
}

.al-sider-trigger:hover {
  color: #1677ff;
}

.al-user {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  padding: 0 0.4rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.al-user:hover {
  background: #f5f5f5;
}

.al-username {
  font-size: 0.85rem;
  color: #262626;
}

/* ========== CONTENT ========== */
.al-content {
  margin: 16px;
  min-height: 0;
  overflow-y: auto;
}

.al-content-full {
  margin: 0;
  height: 100vh;
  overflow-y: auto;
  background: #f0f2f5;
}

/* ========== PAGE TRANSITION ========== */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ========== FOOTER ========== */
.al-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 12px 16px;
  font-size: 0.78rem;
  color: #bfbfbf;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.al-footer-ver {
  font-family: 'SF Mono', monospace;
  font-size: 0.72rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #d9d9d9;
}
</style>
