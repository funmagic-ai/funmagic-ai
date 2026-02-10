import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { i18n } from './lib/i18n'
import { queryClientConfig } from './lib/query'
import './styles/main.css'

const app = createApp(App)

app.config.errorHandler = (err, _instance, info) => {
  console.error('[Global Error]', info, err)
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(VueQueryPlugin, queryClientConfig)

app.mount('#app')
