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
  ExportOutlined,
} from '@ant-design/icons-vue'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import AppTab from '@/components/AppTab.vue'
import ThemeSettings from '@/components/ThemeSettings.vue'

const authStore = useAuthStore()
const tabStore = useTabStore()
const themeStore = useAdminThemeStore()

const avatarBroken = ref(false)
watch(
  () => authStore.avatarUrl,
  () => {
    avatarBroken.value = false
  },
)
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
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
  {
    key: 'visit-site',
    icon: () => h(ExportOutlined),
    label: '访问站点',
  },
]

function visitSite() {
  const url = import.meta.env.VITE_FRONTEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '/site/')
  window.open(url, '_blank', 'noopener,noreferrer')
}

function handleMenuClick({ key }: { key: string }) {
  if (key === 'visit-site') {
    visitSite()
    return
  }
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
        :width="232"
        collapsed-width="72"
        class="al-sider"
      >
        <div class="al-logo">
          <span class="al-logo-icon">◈</span>
          <span v-show="!collapsed" class="al-logo-text">Homepage</span>
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
        <a-layout-header class="al-header">
          <div class="al-header-left">
            <AppBreadcrumb />
          </div>

          <div class="al-header-right">
            <button
              class="al-icon-btn"
              @click="toggleTheme"
              :aria-label="themeStore.isDark ? '切换亮色' : '切换暗色'"
              :title="themeStore.isDark ? '切换亮色' : '切换暗色'"
            >
              <BulbFilled v-if="themeStore.isDark" class="al-sun-icon" />
              <BulbOutlined v-else class="al-moon-icon" />
            </button>

            <a-dropdown :trigger="['click']" placement="bottomRight">
              <div class="al-user" role="button" tabindex="0">
                <div class="al-avatar">
                  <img
                    v-if="authStore.avatarUrl && !avatarBroken"
                    :src="authStore.avatarUrl"
                    :alt="`${authStore.username}的头像`"
                    @error="avatarBroken = true"
                  />
                  <span v-else class="al-avatar-letter">
                    {{ authStore.username?.charAt(0)?.toUpperCase() }}
                  </span>
                </div>
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
      <a-layout-footer v-if="!noSidebar" class="al-footer">
        <span>Dageling003-Homepage</span>
        <span class="al-footer-ver">v1.0.0</span>
      </a-layout-footer>
    </a-layout>

    <!-- ====== THEME SETTINGS PANEL ====== -->
    <ThemeSettings />
  </a-layout>
</template>

<style scoped>
/* ============================================================
   AdminLayout — Apple design language:
   translucent sider + hairline header + capsule chrome
   ============================================================ */

.al-root {
  min-height: 100vh;
  background: transparent;
}

/* ============================================================
   SIDEBAR — translucent glass panel with a bright top edge
   ============================================================ */
.al-sider {
  background: var(--admin-material-thick) !important;
  backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  border-right: 1px solid var(--admin-hairline);
  box-shadow: none;
  z-index: 10;
  position: relative;
}

/* Bright top edge — glass catching light */
.al-sider::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.55),
    transparent);
  pointer-events: none;
}

[theme='dark'] .al-sider::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.16),
    transparent);
}

.al-logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-bottom: 1px solid var(--admin-hairline);
  font-weight: 700;
  font-size: 1.02rem;
  color: var(--admin-text);
  letter-spacing: -0.01em;
}

.al-logo-icon {
  font-size: 1.35rem;
  line-height: 1;
  color: var(--admin-primary);
  font-weight: 800;
  filter: drop-shadow(0 2px 8px var(--admin-primary-soft));
}

.al-logo-text {
  white-space: nowrap;
  background: linear-gradient(135deg,
    var(--admin-text) 0%,
    var(--admin-text-secondary) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.al-sider-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  font-size: 1rem;
  color: var(--admin-text-secondary);
  cursor: pointer;
  transition: color var(--admin-duration-fast) var(--admin-ease-out),
              background-color var(--admin-duration-fast) var(--admin-ease-out);
  border-top: 1px solid var(--admin-hairline);
}

.al-sider-trigger:hover {
  color: var(--admin-primary);
  background: var(--admin-primary-softer);
}

/* ============================================================
   HEADER — sticky-feel glass strip with hairline bottom
   ============================================================ */
.al-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--admin-material-thick) !important;
  backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  border-bottom: 1px solid var(--admin-hairline);
  line-height: 56px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.al-header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
}

.al-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ----- Icon button (capsule) ----- */
.al-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--admin-material-thin);
  backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: 999px;
  cursor: pointer;
  color: var(--admin-text);
  transition:
    transform var(--admin-duration-medium) var(--admin-ease-spring),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
  padding: 0;
  outline: none;
}

.al-icon-btn:hover {
  transform: translate3d(0, -1px, 0);
  box-shadow: var(--admin-shadow-1);
  background: var(--admin-material-thick);
}

.al-icon-btn:active { transform: translate3d(0, 0, 0) scale(0.94); }

.al-sun-icon { color: #ff9500; font-size: 1rem; }
.al-moon-icon { color: #af52de; font-size: 1rem; }

/* ----- User capsule ----- */
.al-user {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  transition:
    background-color var(--admin-duration-fast) var(--admin-ease-out),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out),
    transform var(--admin-duration-medium) var(--admin-ease-spring);
}

.al-user:hover {
  background: var(--admin-material-thick);
  box-shadow: var(--admin-shadow-1);
  transform: translate3d(0, -1px, 0);
}

.al-user:focus-visible {
  outline: 2px solid var(--admin-primary);
  outline-offset: 2px;
}

.al-avatar {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--admin-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(var(--admin-primary-rgb), 0.35);
}

.al-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.al-avatar-letter { letter-spacing: 0; }

.al-username {
  font-size: 0.86rem;
  color: var(--admin-text);
  font-weight: 500;
  letter-spacing: -0.005em;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================================================
   CONTENT
   ============================================================ */
.al-content {
  margin: 16px 20px;
  min-height: 0;
  overflow-y: auto;
  position: relative;
}

.al-content-full {
  margin: 0;
  height: 100vh;
  overflow-y: auto;
  background: transparent;
}

/* ============================================================
   PAGE TRANSITION — soft cross-fade (Apple's default)
   ============================================================ */
.page-fade-enter-active,
.page-fade-leave-active {
  transition:
    opacity var(--admin-duration-medium) var(--admin-ease-out),
    transform var(--admin-duration-medium) var(--admin-ease-out);
}

.page-fade-enter-from {
  opacity: 0;
  transform: translate3d(0, 6px, 0);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translate3d(0, -4px, 0);
}

/* ============================================================
   FOOTER
   ============================================================ */
.al-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 14px 16px;
  font-size: 0.76rem;
  color: var(--admin-text-tertiary);
  text-align: center;
  border-top: 1px solid var(--admin-hairline);
  background: transparent;
  letter-spacing: 0.01em;
}

.al-footer-ver {
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  color: var(--admin-text-tertiary);
}

/* ============================================================
   MOBILE
   ============================================================ */
@media (max-width: 768px) {
  .al-header { padding: 0 14px; height: 52px; line-height: 52px; }
  .al-username { display: none; }
  .al-user { padding-right: 4px; }
  .al-content { margin: 12px; }
}
</style>
