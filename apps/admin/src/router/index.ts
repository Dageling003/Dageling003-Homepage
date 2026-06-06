import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false },
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

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
