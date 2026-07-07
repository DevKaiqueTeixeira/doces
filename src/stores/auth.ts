import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { loginWithPassword } from '../services/auth'
import type { AuthStatus, AuthUser, LoginCredentials } from '../types/auth'

const storageKey = 'jessydoces.auth.user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const status = ref<AuthStatus>('idle')
  const errorMessage = ref('')
  const hydrated = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  function hydrate() {
    if (hydrated.value || typeof window === 'undefined') {
      return
    }

    const savedUser = window.localStorage.getItem(storageKey)

    if (!savedUser) {
      status.value = 'guest'
      hydrated.value = true
      return
    }

    try {
      user.value = JSON.parse(savedUser) as AuthUser
      status.value = 'authenticated'
    } catch {
      window.localStorage.removeItem(storageKey)
      status.value = 'guest'
    }

    hydrated.value = true
  }

  function persistUser(nextUser: AuthUser | null) {
    if (typeof window === 'undefined') {
      return
    }

    if (!nextUser) {
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(nextUser))
  }

  async function login(credentials: LoginCredentials) {
    status.value = 'loading'
    errorMessage.value = ''

    try {
      const nextUser = await loginWithPassword(credentials)
      user.value = nextUser
      status.value = 'authenticated'
      persistUser(nextUser)
      return nextUser
    } catch (error) {
      user.value = null
      status.value = 'guest'
      persistUser(null)
      errorMessage.value =
        error instanceof Error ? error.message : 'Nao foi possivel entrar agora.'
      return null
    }
  }

  function logout() {
    user.value = null
    status.value = 'guest'
    errorMessage.value = ''
    persistUser(null)
  }

  return {
    errorMessage,
    hydrate,
    isAuthenticated,
    login,
    logout,
    status,
    user,
  }
})
