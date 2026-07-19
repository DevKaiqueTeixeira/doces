import { Notify, Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'

import './style.css'
import App from './App.vue'
import { createAppRouter } from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()
const router = createAppRouter(pinia)

useAuthStore(pinia).hydrate()

app.use(pinia)
app.use(Quasar, {
  plugins: {
    Notify,
  },
  config: {
    brand: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#0f766e',
      positive: '#16a34a',
      negative: '#e11d48',
      warning: '#d97706',
    },
  },
})
app.use(router)

app.mount('#app')
