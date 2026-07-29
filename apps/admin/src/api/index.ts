import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'

export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

/**
 * `_silent`: opt-in flag for auth probe requests. Requests marked silent
 * suppress the global 401 toast/redirect and are not `console.error`-logged
 * by callers. Used for the startup /auth/profile probe to avoid a noisy
 * red line in DevTools on first-boot (no users yet) and on the login page.
 */
export interface SilentRequestConfig extends AxiosRequestConfig {
  _silent?: boolean
}

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  // SEC-002: session is carried by the HttpOnly `hp_token` cookie set by
  // POST /api/auth/login. `withCredentials: true` ensures the browser sends
  // the cookie on every same-origin request. `X-Requested-With` is a
  // belt-and-suspenders CSRF hint: cross-site <form> POSTs cannot set custom
  // headers, so a matching cookie without this header is a signal to reject.
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// Response interceptor - error handling
request.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: unknown) => {
    const axiosError = error as {
      response?: { status: number }
      request?: unknown
      config?: SilentRequestConfig
    }
    const silent = axiosError.config?._silent === true

    if (axiosError.response) {
      const status = axiosError.response.status

      if (status === 401) {
        if (!silent) {
          const currentPath = window.location.pathname
          if (!currentPath.includes('/login') && !currentPath.includes('/setup')) {
            message.error('登录已过期,请重新登录')
            setTimeout(() => {
              // admin bundle 挂载在 /admin/ 前缀下（见 vite.config.ts base）。
              // 之前写 '/login' 会跳到 frontend 主页并触发 404，用户会误以为
              // "登录失败" —— 实际上 login 本身 200，只是这里带偏了。
              window.location.href = '/admin/login'
            }, 800)
          }
        }
      }

      if (status === 403) {
        const currentPath = window.location.pathname
        if (!currentPath.includes('/403') && !currentPath.includes('/login')) {
          message.error('权限不足,无法执行此操作')
          window.location.href = '/admin/403'
        }
      }

      if (status === 429) {
        message.warning('请求过于频繁,请稍后再试')
      }
    } else if (axiosError.request) {
      if (!silent) {
        message.error('网络连接失败,请检查服务器是否运行')
      }
    }

    return Promise.reject(error)
  },
)

// Auth API
export function loginApi(username: string, password: string) {
  return request.post<ApiResponse>('/auth/login', { username, password })
}

export function logoutApi() {
  return request.post('/auth/logout')
}

export function getProfileApi(options?: { silent?: boolean }) {
  return request.get<ApiResponse<{ username: string; role?: string; avatarUrl?: string; email?: string | null }>>(
    '/auth/profile',
    // Startup probe passes `silent: true` so the global 401 handler skips
    // the toast + redirect (see interceptor above). Explicit user actions
    // like AccountView.load() omit it and get default UX.
    { _silent: options?.silent === true } as SilentRequestConfig,
  )
}

// Config API
export function checkInitializedApi() {
  return request.get<ApiResponse<{ initialized: boolean }>>('/config/initialized')
}

export function getConfigsApi() {
  return request.get<ApiResponse<Array<{ configKey: string; configValue: string; category: string }>>>('/config')
}

export function getConfigApi(key: string) {
  return request.get<ApiResponse<{ configKey: string; configValue: string; category: string }>>(`/config/${key}`)
}

export function updateConfigApi(key: string, value: string, category?: string) {
  return request.put<ApiResponse<{ configKey: string; configValue: string; category: string }>>(`/config/${key}`, { configKey: key, configValue: value, category })
}

export function createConfigApi(configKey: string, configValue: string, category?: string) {
  return request.post<ApiResponse<{ configKey: string; configValue: string; category: string }>>('/config', { configKey, configValue, category })
}

export function deleteConfigApi(key: string) {
  return request.delete(`/config/${key}`)
}

export function getGroupedConfigsApi() {
  return request.get<ApiResponse<Record<string, Array<{ configKey: string; configValue: string; category: string }>>>>('/config/grouped')
}

export function exportConfigJsonUrl() {
  return '/api/config/export/json'
}

// Auth
export function changePasswordApi(oldPassword: string, newPassword: string) {
  return request.put('/auth/change-password', { oldPassword, newPassword })
}

// Password recovery (public)
export function forgotPasswordApi(username: string) {
  return request.post<ApiResponse>('/auth/forgot-password', { username })
}

export function resetPasswordApi(token: string, newPassword: string) {
  return request.post<ApiResponse>('/auth/reset-password', { token, newPassword })
}

export function hasUsersApi() {
  return request.get<ApiResponse<{ hasUsers: boolean; setupTokenRequired: boolean }>>('/auth/has-users')
}

export function createFirstAdminApi(username: string, password: string, setupToken?: string) {
  return request.post<ApiResponse>(
    '/auth/create-first-admin',
    { username, password },
    setupToken ? { headers: { 'X-Setup-Token': setupToken } } : undefined,
  )
}

// Profile
export function updateProfileApi(data: { avatarUrl?: string; email?: string }) {
  return request.put<ApiResponse>('/auth/profile', data)
}

// Audit API
export function getAuditLogsApi(
  page = 1,
  limit = 20,
  filters?: { action?: string; operator?: string; startDate?: string; endDate?: string },
) {
  return request.get<ApiResponse<{ items: Array<{ id: number; action: string; entity: string; entityKey: string; detail: string; operator: string; createdAt: string }>; total: number }>>('/audit', { params: { page, limit, ...filters } })
}

export interface LoginResponse {
  accessToken: string
  username: string
}

export default request
