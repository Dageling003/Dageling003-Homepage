# 开发进度记录

> 最后更新：2026/06/06 v0.4.0

---

## 开发计划总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第一阶段 | 项目基建（Monorepo 骨架） | ✅ **已完成** |
| 第二阶段 | 后端 API + 数据库 | ✅ **已完成** |
| 第三阶段 | 前台主页开发 | ✅ **已完成** |
| 第四阶段 | 中后台管理 | ✅ **已完成** |
| 第五阶段 | 联调精修 | ✅ **已完成** |

---

## 第一阶段：项目基建 ✅

- [x] 创建 Monorepo 根目录结构
- [x] 配置 pnpm workspace（apps/frontend, admin, backend）
- [x] 配置 .npmrc、.gitignore、tsconfig.base.json
- [x] 配置 UnoCSS（前台 + 后台统一）
- [x] 三个项目均能独立构建通过

---

## 第二阶段：后端 API ✅

### 技术栈

NestJS + TypeORM + MariaDB + Passport JWT + Swagger

### 数据模型（3 张表）

| 表 | 字段 | 说明 |
|----|------|------|
| `users` | id, username, password(bcrypt), role, theme, createdAt, updatedAt | 管理员账户 |
| `site_config` | id, config_key(unique), config_value, category, createdAt, updatedAt | 站点配置 |
| `audit_logs` | id, action, entity, entity_key, detail, operator, createdAt | 操作日志 |

### 完整 API 接口（14 个）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | ❌ | 管理员登录 |
| GET | `/api/auth/profile` | ✅ | 获取当前用户信息 |
| PUT | `/api/auth/change-password` | ✅ | 修改密码 |
| GET | `/api/config` | ❌ | 获取所有配置 |
| GET | `/api/config/grouped` | ❌ | 按分类分组获取 |
| GET | `/api/config/category/:cat` | ❌ | 按分类筛选 |
| GET | `/api/config/export/json` | ✅ | 导出 JSON 文件 |
| GET | `/api/config/:key` | ❌ | 按 key 查单个 |
| POST | `/api/config` | ✅ | 新增配置 → 自动写日志 |
| PUT | `/api/config/:key` | ✅ | 更新配置 → 自动写日志 |
| DELETE | `/api/config/:key` | ✅ | 删除配置 → 自动写日志 |
| GET | `/api/audit` | ✅ | 操作日志列表（分页） |

### 关键特性

- **自动建库**：首次启动自动创建数据库表（需要 MariaDB 数据库已创建，建议手动执行 ```CREATE DATABASE `Dageling003-Homepage`;```）
- **自动建管理员**：users 表为空时自动创建 admin/admin123
- **操作审计**：配置的增删改自动写入 audit_logs，记录操作人、时间、变更内容
- **分类管理**：配置支持 category 字段，前端可按分类分组/筛选

---

## 第三阶段：前台主页 ✅

### 组件清单

| 组件 | 文件 | 说明 |
|------|------|------|
| `AnimatedLogo` | `components/AnimatedLogo.vue` | 加载动画：脉冲光环 + 弹跳图标 |
| `ThemeToggle` | `components/ThemeToggle.vue` | 亮/暗切换：SVG 太阳月亮旋转动画 |
| `TypewriterText` | `components/TypewriterText.vue` | 打字机效果文字 |
| `TimeGreeting` | `components/TimeGreeting.vue` | 时段问候 + 实时时钟 + 4 维进度条 |
| `QuickLinks` | `components/QuickLinks.vue` | 快捷链接：grid/row/list 三布局 |

### 页面特性

- ✅ 加载 → 内容流畅过渡（AnimatedLogo → showContent）
- ✅ 主题切换（亮/暗模式）
- ✅ 所有卡片统一 hover 浮动效果
- ✅ 手机端/平板端/小屏手机三层响应式
- ✅ 卡片顺序手机端正确排列
- ✅ 局域网访问（`host: true`）

---

## 第四阶段：管理后台 ✅

### 页面清单

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录 | `/login` | 用户名 + 密码登录 |
| 仪表盘 | `/dashboard` | ECharts 饼图/柱状图 + 统计卡片 + 最近操作 |
| 个人信息 | `/config/personal` | CRUD 配置卡片 |
| 快捷链接 | `/config/links` | CRUD 配置卡片 |
| 技术栈 | `/config/techs` | CRUD 配置卡片 |
| ToDo | `/config/todos` | CRUD 配置卡片 |
| 打字机 | `/config/typewriter` | CRUD 配置卡片 |
| 操作日志 | `/audit` | 分页表格 + 操作标签 + 详情 tooltip |
| 账号设置 | `/account` | 修改密码 |
| 404 | `/:pathMatch(.*)*` | 异常页面兜底 |

### 关键特性

- ✅ JWT Token 管理 + 路由守卫（未登录跳转登录页）
- ✅ **侧边栏 5 子菜单**：个人信息/快捷链接/技术栈/ToDo/打字机，展开 + 折叠
- ✅ **多页签系统**：点击菜单开 Tab、右键关闭/关闭其他/关闭全部
- ✅ **面包屑全层级**：显示完整路径（🏠 / 配置管理 / 个人信息）
- ✅ **ECharts 仪表盘**：配置分布饼图 + 近 7 日操作趋势柱状图
- ✅ **7 套主题色预设** + 右侧主题配置面板（抽屉实时切换）
- ✅ **暗色 + 亮色双模式**，事件驱动同步
- ✅ **页面切换过渡动画**（fade + slide）
- ✅ 用户下拉菜单（账号设置 + 退出登录）
- ✅ 数据导出：一键下载 JSON 文件
- ✅ 全局 Footer 版权 + 版本号
- ✅ 局域网访问（`host: true`）
- ✅ 异常处理：网络错误 / Token 过期 / 401 自动跳转 / 429 限流提示
- ✅ 侧边栏底部折叠按钮（不再显示 null）

---

## 第五阶段：联调精修 ✅

- [x] 前/后台真实数据联调（前台用 `configHandlers` 映射加载 API 数据）
- [x] 操作日志查看页面（`/audit` 路由，表格+分页+详情 tooltip）
- [x] 异常处理优化（axios 拦截器：网络错误/Token 过期/401 不重复提示）
- [x] 构建生产版本（`pnpm build`）
- [x] Caddy 反向代理配置（HTTP，`Caddyfile`）
- [x] PM2 进程管理配置（`ecosystem.config.js`）

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v0.1.0 | 2026/06/06 | 项目初始化，基建完成，后端 API 基础可用 |
| v0.1.1 | 2026/06/06 | 切换至 Ant Design Vue UI |
| v0.2.0 | 2026/06/06 | 后端完善 + 管理后台升级 + 前台组件全齐 + 响应式打磨 |
| v0.2.1 | 2026/06/06 | 数据库从 SQLite 迁移至 MariaDB |
| v0.3.0 | 2026/06/06 | 联调精修：前台 API 联调 + 审计日志页面 + 异常处理 + Caddy HTTP + PM2 |
| v0.4.0 | 2026/06/06 | UI 大改：ECharts 仪表盘 + 5 子菜单配置 + 彩色技术栈图标 + 面包屑层级 + 侧边栏折叠修复 |
