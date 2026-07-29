import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, getProfileApi, hasUsersApi } from '@/api'

/**
 * SEC-002: the JWT now lives in an HttpOnly cookie set by /auth/login.
 * JavaScript can no longer read it, so we cannot use it as the source of
 * truth for `isAuthenticated`. Instead we probe /auth/profile — a 200
 * means the cookie is present and valid, a 401 means we need to log in.
 *
 * `checkAuth` is called at the first navigation from the router guard.
 * Subsequent guards await the same promise so we only hit the network
 * once per page load.
 *
 * Bootstrap short-circuit: on a fresh deploy the users table is empty,
 * so probing /auth/profile is guaranteed to return 401 and leaves a red
 * line in DevTools. We ask /auth/has-users first (cheap, public) and
 * skip the probe entirely when no users exist. The probe itself is
 * marked `_silent` so any residual 401 is not surfaced as a toast.
 */

// Module-level caches shared with router.beforeEach. Reset in tests via
// `__resetAuthCaches` (see stores/auth.spec.ts).
let hasUsersCache: boolean | null = null

export function primeHasUsersCache(value: boolean): void {
  hasUsersCache = value
}

export function readHasUsersCache(): boolean | null {
  return hasUsersCache
}

export function __resetAuthCaches(): void {
  hasUsersCache = null
}

async function resolveHasUsers(): Promise<boolean> {
  if (hasUsersCache !== null) return hasUsersCache
  try {
    const r = await hasUsersApi()
    hasUsersCache = !!r.data?.data?.hasUsers
  } catch {
    // Network error: assume users exist so we still attempt the probe
    // (fail-closed on the "hide UI" question but not on functionality).
    hasUsersCache = true
  }
  return hasUsersCache
}

export const useAuthStore = defineStore('auth', () => {
  const username = ref('')
  const avatarUrl = ref('')
  const authenticated = ref(false)
  const isAuthenticated = computed(() => authenticated.value)
  let checkPromise: Promise<void> | null = null

  function checkAuth(): Promise<void> {
    if (checkPromise) return checkPromise
    checkPromise = (async () => {
      // Bootstrap short-circuit: no users → no session possible → skip probe.
      const hasUsers = await resolveHasUsers()
      if (!hasUsers) {
        authenticated.value = false
        username.value = ''
        avatarUrl.value = ''
        return
      }
      try {
        const res = await getProfileApi({ silent: true })
        const data = res.data.data
        username.value = data?.username || ''
        avatarUrl.value = data?.avatarUrl || ''
        authenticated.value = true
      } catch {
        authenticated.value = false
        username.value = ''
        avatarUrl.value = ''
      }
    })()
    return checkPromise
  }

  async function login(usernameInput: string, password: string) {
    const res = await loginApi(usernameInput, password)
    username.value = usernameInput
    authenticated.value = true
    // A successful login proves users exist; refresh the cache so any
    // later route guard (and post-login checkAuth) skips the has-users
    // round-trip.
    hasUsersCache = true
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
