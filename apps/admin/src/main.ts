import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
// ant-design-vue 组件通过 unplugin-vue-components 按需自动注册，
// 因此不再 `app.use(Antd)`，也不再全量导入 reset.css（组件内会自带样式）。
// 只保留 message / notification 等编程式 API 的极小样式基线：
import 'ant-design-vue/es/message/style'
import 'ant-design-vue/es/notification/style'
import 'ant-design-vue/es/modal/style'
import 'virtual:uno.css'
import './styles/apple.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
