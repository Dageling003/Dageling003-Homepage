import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { checkInitializedApi, hasUsersApi } from '@/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

/**
 * 路由 meta 约定：
 * - requiresAuth = false  → 公开访问
 * - guestOnly = true      → 仅未登录时显示（如登录页、首次 setup）
 * - allowInBootstrap      → 当数据库无用户时，绕过登录直接放行（用于首次 setup）
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/login/ForgotPasswordView.vue'),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/login/ResetPasswordView.vue'),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '仪表盘' },
      },
      {
        path: 'config',
        redirect: '/config/personal',
        meta: { title: '配置管理' },
      },
      {
        path: 'config/personal',
        name: 'config-personal',
        component: () => import('@/views/config/ConfigView.vue'),
        meta: { title: '个人信息', category: 'info', parent: 'config' },
      },
      {
        path: 'config/links',
        name: 'config-links',
        component: () => import('@/views/config/ConfigView.vue'),
        meta: { title: '快捷链接', category: 'links', parent: 'config' },
      },
      {
        path: 'config/techs',
        name: 'config-techs',
        component: () => import('@/views/config/ConfigView.vue'),
        meta: { title: '技术栈', category: 'techs', parent: 'config' },
      },
      {
        path: 'config/todos',
        name: 'config-todos',
        component: () => import('@/views/config/ConfigView.vue'),
        meta: { title: 'ToDo', category: 'todos', configKey: 'todos', parent: 'config' },
      },
      {
        path: 'config/typewriter',
        name: 'config-typewriter',
        component: () => import('@/views/config/ConfigView.vue'),
        meta: { title: '打字机', category: 'todos', configKey: 'typewriterWords', parent: 'config' },
      },
      {
        path: 'setup',
        name: 'setup',
        component: () => import('@/views/setup/SetupWizard.vue'),
        meta: { title: '初始设置', noSidebar: true, allowInBootstrap: true },
      },
      {
        path: 'account',
        name: 'account',
        component: () => import('@/views/account/AccountView.vue'),
        meta: { title: '账号设置' },
      },
      {
        path: 'audit',
        name: 'audit',
        component: () => import('@/views/audit/AuditLogView.vue'),
        meta: { title: '操作日志' },
      },
    ],
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: { title: '403 禁止访问' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: { title: '404 页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // 1) guestOnly（登录/找回/重置）页面：已登录就跳到 dashboard
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // 2) 公开页面（已 includes guestOnly）：直接放行
  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  // 3) 启动态判断：数据库是否已有用户
  let hasUsers = true
  try {
    const res = await hasUsersApi()
    hasUsers = !!(res.data as any)?.data?.hasUsers
  } catch {
    // 接口挂了兜底为有用户，避免误放行到 setup
    hasUsers = true
  }

  // 4) 数据库无用户：仅放行到 setup，其它全部重定向到 setup 创建管理员
  if (!hasUsers) {
    if (to.name === 'setup') {
      next()
      return
    }
    next({ name: 'setup' })
    return
  }

  // 5) 已有用户：常规鉴权
  if (!authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // 6) 已登录但站点未初始化完成（_initialized != 1）→ 跳到 setup
  const skipInitCheckRoutes = ['setup']
  if (!skipInitCheckRoutes.includes(to.name as string)) {
    try {
      const res = await checkInitializedApi()
      const initialized = (res.data as any)?.data?.initialized
      if (!initialized) {
        next({ name: 'setup' })
        return
      }
    } catch {
      // API 不可用 — 放行，避免误伤
    }
  }

  next()
})

export default router
