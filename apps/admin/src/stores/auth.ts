import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, getProfileApi } from '@/api'
import type { LoginResponse } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref('')
  const avatarUrl = ref('')
  const isAuthenticated = computed(() => !!token.value)

  function checkAuth() {
    if (token.value) {
      getProfileApi().then((res) => {
        const data = res.data.data
        username.value = data?.username || ''
        avatarUrl.value = data?.avatarUrl || ''
      }).catch(() => {
        token.value = ''
        localStorage.removeItem('token')
      })
    }
  }

  async function login(usernameInput: string, password: string) {
    const res = await loginApi(usernameInput, password)
    const data = res.data as unknown as LoginResponse
    token.value = data.accessToken
    username.value = usernameInput
    localStorage.setItem('token', data.accessToken)
    return data
  }

  function logout() {
    token.value = ''
    username.value = ''
    avatarUrl.value = ''
    localStorage.removeItem('token')
  }

  return { token, username, avatarUrl, isAuthenticated, checkAuth, login, logout }
})
