import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the API module before importing the store. All named exports the
// store touches must be provided, otherwise Vitest's automocker will throw.
vi.mock('@/api', () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getProfileApi: vi.fn(),
  hasUsersApi: vi.fn(),
}))

import * as api from '@/api'
import {
  useAuthStore,
  __resetAuthCaches,
  readHasUsersCache,
  primeHasUsersCache,
} from './auth'

const mockedApi = api as unknown as {
  loginApi: ReturnType<typeof vi.fn>
  logoutApi: ReturnType<typeof vi.fn>
  getProfileApi: ReturnType<typeof vi.fn>
  hasUsersApi: ReturnType<typeof vi.fn>
}

describe('stores/auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetAuthCaches()
    vi.clearAllMocks()
  })

  it('skips the /auth/profile probe when hasUsers=false (bootstrap short-circuit)', async () => {
    // First-boot scenario: DB has no users yet. checkAuth must NOT hit
    // /auth/profile — that would 401 and leave a red line in DevTools.
    mockedApi.hasUsersApi.mockResolvedValueOnce({ data: { data: { hasUsers: false, setupTokenRequired: false } } })

    const store = useAuthStore()
    await store.checkAuth()

    expect(mockedApi.hasUsersApi).toHaveBeenCalledTimes(1)
    expect(mockedApi.getProfileApi).not.toHaveBeenCalled()
    expect(store.isAuthenticated).toBe(false)
    expect(store.username).toBe('')
  })

  it('sends a silent /auth/profile probe when users exist and marks state on 200', async () => {
    mockedApi.hasUsersApi.mockResolvedValueOnce({ data: { data: { hasUsers: true, setupTokenRequired: false } } })
    mockedApi.getProfileApi.mockResolvedValueOnce({
      data: { data: { username: 'alice', avatarUrl: '/avatar.png' } },
    })

    const store = useAuthStore()
    await store.checkAuth()

    // getProfileApi must be called with { silent: true } so the axios
    // interceptor suppresses the toast/redirect on 401.
    expect(mockedApi.getProfileApi).toHaveBeenCalledWith({ silent: true })
    expect(store.isAuthenticated).toBe(true)
    expect(store.username).toBe('alice')
    expect(store.avatarUrl).toBe('/avatar.png')
  })

  it('login() primes the hasUsers cache so subsequent guards skip the round-trip', async () => {
    mockedApi.loginApi.mockResolvedValueOnce({ data: { data: { username: 'bob' } } })

    const store = useAuthStore()
    expect(readHasUsersCache()).toBeNull()

    await store.login('bob', 'super-secret-passphrase')

    // A successful login proves users exist — the module cache should be
    // primed to `true`, and no hasUsersApi round-trip should be needed.
    expect(readHasUsersCache()).toBe(true)
    expect(store.isAuthenticated).toBe(true)
    expect(store.username).toBe('bob')
    expect(mockedApi.hasUsersApi).not.toHaveBeenCalled()
  })

  it('primeHasUsersCache() lets the router feed the store from its own probe', () => {
    // The router.beforeEach guard fetches /auth/has-users once at startup
    // and shares the result with the store via primeHasUsersCache().
    primeHasUsersCache(false)
    expect(readHasUsersCache()).toBe(false)

    __resetAuthCaches()
    expect(readHasUsersCache()).toBeNull()
  })
})
