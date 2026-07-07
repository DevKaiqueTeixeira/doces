import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { loginWithPassword, verifySessionToken } from '../services/auth'
import type { AuthSession, AuthStatus, AuthUser, LoginCredentials } from '../types/auth'

const storageKey = 'jessydoces.auth.session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const token = ref('')
  const status = ref<AuthStatus>('idle')
  const errorMessage = ref('')
  const hydrated = ref(false)
  const sessionValidated = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value && token.value))

  function hydrate() {
    if (hydrated.value || typeof window === 'undefined') {
      return
    }

    const savedSession = window.localStorage.getItem(storageKey)

    if (!savedSession) {
      status.value = 'guest'
      hydrated.value = true
      return
    }

    try {
      const parsedSession = JSON.parse(savedSession) as AuthSession
      user.value = parsedSession.user
      token.value = parsedSession.token
      status.value = 'authenticated'
    } catch {
      window.localStorage.removeItem(storageKey)
      status.value = 'guest'
    }

    hydrated.value = true
  }

  function persistSession(nextSession: AuthSession | null) {
    if (typeof window === 'undefined') {
      return
    }

    if (!nextSession) {
      window.localStorage.removeItem(storageKey)
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(nextSession))
  }

  function applySession(nextSession: AuthSession | null) {
    user.value = nextSession?.user ?? null
    token.value = nextSession?.token ?? ''
    sessionValidated.value = nextSession !== null
    persistSession(nextSession)
  }

  async function login(credentials: LoginCredentials) {
    status.value = 'loading'
    errorMessage.value = ''

    try {
      const nextSession = await loginWithPassword(credentials)
      applySession(nextSession)
      status.value = 'authenticated'
      return nextSession.user
    } catch (error) {
      applySession(null)
      status.value = 'guest'
      errorMessage.value =
        error instanceof Error ? error.message : 'Nao foi possivel entrar agora.'
      return null
    }
  }

  async function ensureValidSession(force = false) {
    if (!hydrated.value) {
      hydrate()
    }

    if (!token.value || !user.value) {
      status.value = 'guest'
      return false
    }

    if (sessionValidated.value && !force) {
      return true
    }

    status.value = 'verifying'

    try {
      const payload = await verifySessionToken(token.value)
      applySession({
        token: token.value,
        user: payload.user,
      })
      status.value = 'authenticated'
      return true
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Sua sessao expirou.'
      logout()
      return false
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    status.value = 'guest'
    errorMessage.value = ''
    sessionValidated.value = false
    persistSession(null)
  }

  return {
    ensureValidSession,
    errorMessage,
    hydrate,
    hydrated,
    isAuthenticated,
    login,
    logout,
    status,
    token,
    user,
  }
})
