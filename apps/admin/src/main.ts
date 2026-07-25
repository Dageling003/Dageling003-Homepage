import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import 'ant-design-vue/dist/reset.css'
import './styles/apple.css'
import App from './App.vue'

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
