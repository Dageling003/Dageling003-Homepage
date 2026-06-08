# 开发进度记录

> 最后更新：2026/06/08 v0.7.0

---

## 开发计划总览

| 阶段 | 内容 | 状态 |
|------|------|------|
| 第一阶段 | 项目基建（Monorepo 骨架） | ✅ **已完成** |
| 第二阶段 | 后端 API + 数据库 | ✅ **已完成** |
| 第三阶段 | 前台主页开发 | ✅ **已完成** |
| 第四阶段 | 中后台管理 | ✅ **已完成** |
| 第五阶段 | 联调精修 | ✅ **已完成** |
| 第六阶段 | UX 大改 + 安全加固 | ✅ **已完成** |

---

## 第一阶段：项目基建 ✅

- [x] 创建 Monorepo 根目录结构
- [x] 配置 pnpm workspace（apps/frontend, admin, backend）
- [x] 配置 .npmrc、.gitignore、tsconfig.base.json
- [x] 配置 UnoCSS（前台 + 后台统一）
- [x] 三个项目均能独立构建通过

---

## 第二阶段：后端 API ✅

### API 接口（16 个）

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | ❌ | 管理员登录 |
| GET | `/api/auth/profile` | ✅ | 获取当前用户信息 |
| PUT | `/api/auth/profile` | ✅ | 更新个人资料（头像等） |
| PUT | `/api/auth/change-password` | ✅ | 修改密码 |
| GET | `/api/config` | ❌ | 获取所有配置 |
| GET | `/api/config/initialized` | ❌ | 检查系统是否已初始化 |
| GET | `/api/config/grouped` | ❌ | 按分类分组获取 |
| GET | `/api/config/category/:cat` | ❌ | 按分类筛选 |
| GET | `/api/config/export/json` | ✅ | 导出 JSON 文件 |
| GET | `/api/config/:key` | ❌ | 按 key 查单个 |
| POST | `/api/config` | ✅ | 新增配置 → 自动写日志 |
| PUT | `/api/config/:key` | ✅ | 更新配置 → 自动写日志 |
| DELETE | `/api/config/:key` | ✅ | 删除配置 → 自动写日志 |
| POST | `/api/config/upload/avatar` | ✅ | 上传头像（sharpe 压缩） |
| GET | `/api/audit` | ✅ | 操作日志列表（分页+筛选） |

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
- ✅ 卡片入场动画（渐入上移，各卡片 100~400ms 错开）
- ✅ hover 悬浮效果（边框变色+阴影优化）
- ✅ 手机端/平板端/小屏手机三层响应式
- ✅ 局域网访问（`host: true`）

### 动态配置项（19 个）

| 配置键 | 说明 | 后台管理位置 |
|--------|------|-------------|
| `name` | 昵称 | 个人信息 → 姓名 |
| `infoSex` | 性别 | 个人信息 → 性别 |
| `infoSexDisplay` | 性别展示方式（symbol/text/both） | 个人信息 → 性别 |
| `infoAge` | 年龄（手动输入） | 个人信息 → 年龄 |
| `infoBirth` | 出生日期（自动计算年龄+星座） | 个人信息 → 年龄 |
| `infoAgeDisplay` | 年龄展示位置（all/intro/tag/hide） | 个人信息 → 年龄 |
| `zodiac` | 星座（自动计算/手动） | 个人信息 → 年龄 |
| `infoProvince` | 省份（34 省选择器） | 个人信息 → 省份 |
| `infoSchool` | 学校（1200+ 院校搜索） | 个人信息 → 就读学校 |
| `avatarUrl` | 头像 URL（支持本地上传） | 个人信息 → 头像 |
| `professions` | 职业标签（tag 输入） | 个人信息 → 职业标签 |
| `links` | 快捷链接 | 快捷链接 |
| `techs` | 技术栈 | 技术栈 |
| `todos` | 待办事项 | ToDo |
| `typewriterWords` | 打字机轮播文字 | 打字机 |
| `infoShowName` | 是否展示姓名 | 个人信息 → 前台展示开关 |
| `infoShowZodiac` | 是否展示星座 | 个人信息 → 前台展示开关 |
| `infoShowBirth` | 是否展示出生日期 | 个人信息 → 前台展示开关 |

---

## 第四阶段：管理后台 ✅

### 页面清单

| 页面 | 路由 | 说明 |
|------|------|------|
| 登录 | `/login` | 毛玻璃卡片 UI + 光晕动画 |
| 仪表盘 | `/dashboard` | ECharts 饼图/柱状图 + 4 统计卡片 |
| 个人信息 | `/config/personal` | 分组表单（姓名/性别/年龄/省份/学校/职业/头像/展示开关） |
| 快捷链接 | `/config/links` | 表单编辑 |
| 技术栈 | `/config/techs` | 表单编辑 |
| ToDo | `/config/todos` | 表单编辑 |
| 打字机 | `/config/typewriter` | 表单编辑 |
| 操作日志 | `/audit` | 分页表格 + 操作筛选 + 详情弹窗 |
| 账号设置 | `/account` | 账号信息 + 头像设置 |
| 初始向导 | `/setup` | 首次使用 7 步初始化 |
| 404 | `/:pathMatch(.*)*` | 异常页面兜底 |

### 关键特性

- ✅ JWT Token 管理 + 路由守卫
- ✅ 首次启动自动检测 → 跳转设置向导
- ✅ 侧边栏 5 子菜单 + 折叠
- ✅ 多页签系统（右键关闭/关闭其他）
- ✅ 面包屑全层级
- ✅ ECharts 仪表盘
- ✅ 7 套主题色预设 + 抽屉设置面板
- ✅ 暗色 + 亮色双模式
- ✅ 头像上传（sharpe 压缩为 WebP）
- ✅ 表单编辑（不再手写 JSON）
- ✅ 登录页 UI 重做
- ✅ 操作日志筛选（操作类型/操作人/日期范围）
- ✅ 管理员头像显示

---

## 第五阶段：联调精修 ✅

- [x] 前/后台真实数据联调
- [x] 异常处理优化（axios 拦截器）
- [x] 构建生产版本（`pnpm build`）
- [x] Caddy 反向代理配置
- [x] PM2 进程管理配置
- [x] 登录页 UI 重做
- [x] 暗色模式适配（面包屑+标签页）
- [x] 前台卡片入场动画

---

## 第六阶段：UX 大改 + 安全加固 ✅

- [x] 配置管理表单化（省份选择器、学校搜索、职业标签、头像上传）
- [x] 出生日期自动计算年龄+星座
- [x] 年龄/性别展示模式选择器
- [x] 上传图片 sharp 压缩
- [x] 首次使用初始化向导（7 步）
- [x] 操作日志筛选
- [x] 账号设置头像上传
- [x] 后端审计日志筛选支持

---

## 版本记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v0.1.0 | 2026/06/06 | 项目初始化 |
| v0.2.0 | 2026/06/06 | 管理后台 + 前台组件齐 |
| v0.3.0 | 2026/06/06 | 联调精修 |
| v0.4.0 | 2026/06/06 | ECharts + 主题预设 |
| v0.5.0 | 2026/06/07 | UX 大改 + 表单化配置 + 头像上传 |
| v0.6.0 | 2026/06/07 | 初始化向导 + 安全加固 + 文档更新 |
| v0.7.0 | 2026/06/08 | 生产环境全面安全加固 + Docker 架构重构 |
| v0.7.1 | 2026/06/08 | 部署完成输出结构化：分块列出网站主页/后台/初始化/管理员账号/重要提示/基本路由 |

## 第七阶段：生产环境安全加固 + Docker 架构重构 ✅

- [x] Docker 架构重构：Caddy 直接提供静态文件（不再经 `serve` → Node 进程）
- [x] 新增 `Dockerfile.caddy`：Caddy + 静态文件合并镜像
- [x] `Dockerfile.app` 重写：后端专用，`pnpm deploy --prod` 仅生产依赖
- [x] 容器 HEALTHCHECK：app（HTTP 端点）+ mariadb（mariadb-admin ping）
- [x] `depends_on` 升级为 `service_healthy`（替代 `service_started`）
- [x] DB 密码强制设置（移除 `rootpassword`/`homepage_pass` 弱默认值）
- [x] 容器资源限制（memory: 512M, cpus: 1）+ 日志轮转（20MB×3）
- [x] Swagger 文档仅非生产环境启用
- [x] 全局请求体 1MB 大小限制（DDoS 防护）
- [x] helmet 安全头强化（CSP / HSTS / crossOrigin 策略）
- [x] bcrypt 轮次 10→12
- [x] 密码最小长度：登录 6→8，改密码 6→12
- [x] Rate limiting：全局 60→120/min，登录保持 5/min
- [x] DB 连接池配置（connectionLimit=20，timeouts）
- [x] `DB_SYNCHRONIZE=true` 生产环境启动警告
- [x] PM2 配置：`fork` → `cluster` 模式，`instances: 1` → `max`
- [x] 新增 `/health` 健康检查端点
- [x] deploy.sh 安全改进：不再明文打印管理员密码
- [x] 镜像体积 4-5× 压缩（~500MB → ~80-120MB）
- [x] `pnpm-workspace.yaml` 清理不使用的 allowBuilds
- [x] 全量文档更新

---

## 第八阶段：部署完成输出结构化 ✅

- [x] `deploy.sh` 部署汇总重构为分块输出：网站主页 / 后台管理 / 网站第一次初始化 / 重要提示 / 管理员账号 / 基本路由 / 常用命令
- [x] 重要提示：项目部署后未初始化时访问根 URL 只显示布局/默认占位内容
- [x] 明确告知用户先去 `/admin/setup` 走完初始化向导，再去账号设置修改默认密码
- [x] 完整路由速查（`/` `/admin/` `/admin/setup` `/admin/dashboard` `/admin/account` `/api/` `/health`）

访问路径：

| 入口 | 开发 | 生产 |
|------|------|------|
| 网站主页 | http://localhost:3000 | `https://<域名>/` |
| 管理后台 | http://localhost:3001 | `https://<域名>/admin/` |
| 首次初始化 | 登录后自动跳转 | `https://<域名>/admin/setup` |

---

## Bug 修复记录

| 问题 | 原因 | 修复 |
|------|------|------|
| 登录 500 错误 | `JwtModule` 在 `.env` 加载前初始化，密钥为 `undefined` | 改用 `registerAsync` 延迟加载密钥 |
| 登录后页面空白 | `AdminLayout.vue` 未导入 `computed` | 添加 `computed` 到 Vue import |
| Footer 位置错乱 | 放在 `<a-layout-content>` 之前，不符合 Ant Design 布局顺序 | 移到 content 之后 |
| 版本号不一致 | 页面显示 v0.2.1，实际为 v0.1.0 | 更新为 v0.1.0 |
| 首次部署直接跳转仪表盘 | 旧数据库缺少 `_initialized` 标记 | 补插 `_initialized = '0'`，seed 数据已包含 |
