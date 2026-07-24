import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, getProfileApi } from '@/api'

/**
 * SEC-002: the JWT now lives in an HttpOnly cookie set by /auth/login.
 * JavaScript can no longer read it, so we cannot use it as the source of
 * truth for `isAuthenticated`. Instead we probe /auth/profile — a 200
 * means the cookie is present and valid, a 401 means we need to log in.
 *
 * `checkAuth` is called at the first navigation from the router guard.
 * Subsequent guards await the same promise so we only hit the network
 * once per page load.
 */
export const useAuthStore = defineStore('auth', () => {
  const username = ref('')
  const avatarUrl = ref('')
  const authenticated = ref(false)
  const isAuthenticated = computed(() => authenticated.value)
  let checkPromise: Promise<void> | null = null

  function checkAuth(): Promise<void> {
    if (checkPromise) return checkPromise
    checkPromise = getProfileApi()
      .then((res) => {
        const data = res.data.data
        username.value = data?.username || ''
        avatarUrl.value = data?.avatarUrl || ''
        authenticated.value = true
      })
      .catch(() => {
        authenticated.value = false
        username.value = ''
        avatarUrl.value = ''
      })
    return checkPromise
  }

  async function login(usernameInput: string, password: string) {
    const res = await loginApi(usernameInput, password)
    username.value = usernameInput
    authenticated.value = true
    // Force the next checkAuth to refetch the profile now that we're logged in.
    checkPromise = null
    return res.data
  }

  async function logout() {
    try {
      await logoutApi()
    } catch {
      // ignore network errors — we still want to reset local state
    }
    username.value = ''
    avatarUrl.value = ''
    authenticated.value = false
    checkPromise = null
  }

  return { username, avatarUrl, isAuthenticated, checkAuth, login, logout }
})
