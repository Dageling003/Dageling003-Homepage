import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import 'ant-design-vue/dist/reset.css'
import './styles/apple.css'
import App from './App.vue'

// 兜底：清掉可能残留的旧 Service Worker + 旧 CacheStorage。
// admin 从不注册 SW；如果访问时检测到有 SW 绑在这个 origin 上，
// 说明是 frontend 早期版本（scope='/'）注册的残留，会拦到 /admin/*
// 的子资源请求返回旧内容 —— 典型症状：
//   - CSP 报错的 URL 是仓库里早就删掉的（如 fonts.googleapis.com Inter）
//   - 明明服务器返回了新版本，浏览器仍加载旧 index.html
// 反注册后 reload 一次让新页面走网络。
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    if (regs.length === 0) return
    Promise.all(regs.map((r) => r.unregister()))
      .then(() => (typeof caches !== 'undefined' ? caches.keys() : Promise.resolve([])))
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => window.location.reload())
      .catch(() => { /* 静默：不影响首屏 */ })
  }).catch(() => { /* 静默 */ })
}

import {
  Button, Input, Select, Form, Menu, Layout,
  Radio, Checkbox, Switch, Upload, Card, Table, Tag,
  Popover, Drawer, Divider, Spin, Avatar, Skeleton, List, Dropdown,
} from 'ant-design-vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
  ;[Button, Input, Select, Form, Menu, Layout,
    Radio, Checkbox, Switch, Upload, Card, Table, Tag,
    Popover, Drawer, Divider, Spin, Avatar, Skeleton, List, Dropdown]
  .forEach(c => app.use(c))

app.mount('#app')
