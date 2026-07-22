import axios from 'axios'
import { message } from 'ant-design-vue'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor - attach token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - error handling
request.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response) {
      // Server returned an error status
      const status = error.response.status

      if (status === 401) {
        // Token expired or invalid — clear and redirect
        localStorage.removeItem('token')
        const currentPath = window.location.pathname
        if (!currentPath.includes('/login')) {
          message.error('登录已过期，请重新登录')
          setTimeout(() => {
            window.location.href = '/login'
          }, 800)
        }
      }

      // rate limiting (if implemented later)
      if (status === 429) {
        message.warning('请求过于频繁，请稍后再试')
      }
    } else if (error.request) {
      // Network error (no response received)
      message.error('网络连接失败，请检查服务器是否运行')
    }

    return Promise.reject(error)
  },
)

// Auth API
export function loginApi(username: string, password: string) {
  return request.post('/auth/login', { username, password })
}

export function getProfileApi() {
  return request.get('/auth/profile')
}

// Config API
export function checkInitializedApi() {
  return request.get('/config/initialized')
}

export function getConfigsApi() {
  return request.get('/config')
}

export function getConfigApi(key: string) {
  return request.get(`/config/${key}`)
}

export function updateConfigApi(key: string, value: string, category?: string) {
  return request.put(`/config/${key}`, { configKey: key, configValue: value, category })
}

export function createConfigApi(configKey: string, configValue: string, category?: string) {
  return request.post('/config', { configKey, configValue, category })
}

export function deleteConfigApi(key: string) {
  return request.delete(`/config/${key}`)
}

export function getGroupedConfigsApi() {
  return request.get('/config/grouped')
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
  return request.post('/auth/forgot-password', { username })
}

export function resetPasswordApi(token: string, newPassword: string) {
  return request.post('/auth/reset-password', { token, newPassword })
}

export function hasUsersApi() {
  return request.get('/auth/has-users')
}

export function createFirstAdminApi(username: string, password: string, setupToken?: string) {
  return request.post(
    '/auth/create-first-admin',
    { username, password },
    setupToken ? { headers: { 'X-Setup-Token': setupToken } } : undefined,
  )
}

// Profile
export function updateProfileApi(data: { avatarUrl?: string }) {
  return request.put('/auth/profile', data)
}

// Audit API
export function getAuditLogsApi(
  page = 1,
  limit = 20,
  filters?: { action?: string; operator?: string; startDate?: string; endDate?: string },
) {
  return request.get('/audit', { params: { page, limit, ...filters } })
}

export interface LoginResponse {
  accessToken: string
}

export default request
