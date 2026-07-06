import { Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import 'quasar/dist/quasar.css'

import './style.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(Quasar, {
  config: {
    brand: {
      primary: '#7c3aed',
      secondary: '#22d3ee',
      accent: '#f97316',
    },
  },
})

app.mount('#app')
