import type { Pinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '../stores/auth'
import { routes } from './routes'

export function createAppRouter(pinia: Pinia) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach(async (to) => {
    const authStore = useAuthStore(pinia)

    authStore.hydrate()

    const hasValidSession = await authStore.ensureValidSession()

    if (to.meta.requiresAuth && !hasValidSession) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.meta.guestOnly && hasValidSession) {
      return {
        name: 'home',
      }
    }

    return true
  })

  return router
}
