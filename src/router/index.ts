import type { Pinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '../stores/auth'
import { routes } from './routes'

export function createAppRouter(pinia: Pinia) {
  const router = createRouter({
    history: createWebHistory(),
    routes,
  })

  router.beforeEach((to) => {
    const authStore = useAuthStore(pinia)

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return {
        name: 'dashboard',
      }
    }

    return true
  })

  return router
}
