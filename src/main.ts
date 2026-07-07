import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

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
  config: {
    brand: {
      primary: '#7c3aed',
      secondary: '#22d3ee',
      accent: '#f97316',
    },
  },
})
app.use(router)

app.mount('#app')
