import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import { addCollection } from '@iconify/vue'
import router from './router'
import 'virtual:uno.css'
// Self-host 字体：避免 fonts.googleapis.com 在国内加载缓慢 / 触发 CSP。
// 只加载 latin 子集 + HomeView.vue 实际用到的字重（400/500/600），
// 避免把 vietnamese / greek / cyrillic 一起打进 dist（省 ~400 KB woff2）。
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import App from './App.vue'

// Self-host 图标：把 HomeView 用到的 logos:* 图标 addCollection 到 iconify 运行时，
// <Icon icon="logos:vue" /> 就无需再 fetch https://api.iconify.design。
// 图标子集由 scripts/build-icons.mjs 从 @iconify-json/logos 预生成。
import techIcons from './icons/tech-icons.json'
addCollection(techIcons as Parameters<typeof addCollection>[0])

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createHead())

app.mount('#app')
