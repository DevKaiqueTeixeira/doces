import type { RouteRecordRaw } from 'vue-router'

import DashboardPage from '../pages/DashboardPage.vue'
import LoginPage from '../pages/LoginPage.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardPage,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: {
      guestOnly: true,
    },
  },
]
