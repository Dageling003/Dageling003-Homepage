# 开发指南

> 如何启动、开发和维护 Dageling003-Homepage 项目

---

## 🚀 快速启动

### 1. 安装依赖（首次）

````bash
pnpm install
`````

### 2. 启动项目

````bash
# ===== 方式一：一键启动全部（推荐） =====
# 先启动后端
pnpm dev:backend

# 另开一个终端，启动前端+后台
pnpm dev:frontend
pnpm dev:admin

# ===== 方式二：分别启动 =====
pnpm dev:frontend   # 前台主页 → http://localhost:3000
pnpm dev:admin      # 管理后台 → http://localhost:3001
pnpm dev:backend    # 后端 API  → http://localhost:8000
`````

> ⚠️ **注意**：后端必须先启动！前/后台都通过 Vite 代理把 `/api` 请求转发到 `localhost:8000`，后端没跑则无法登录、无法加载数据。

### 3. 访问

| 服务 | 本地 | 局域网（手机/iPad） |
|------|------|---------------------|
| 前台主页 | `http://localhost:3000` | `http://192.168.31.86:3000` |
| 管理后台 | `http://localhost:3001` | `http://192.168.31.86:3001` |
| API 文档 | `http://localhost:8000/api/docs` | `http://192.168.31.86:8000/api/docs` |

> ⚠️ 手机/iPad 需要和电脑在**同一个 Wi-Fi** 下。

---

## 🔑 默认管理员账号

后端首次启动时，如果 users 表为空会**自动创建**：

| 用户名 | 密码 |
|--------|------|
| `admin` | `admin123` |

登录后可在管理后台 → 账号设置 → 修改密码。

---

## 🗄️ 数据库说明

- **类型**：MariaDB（通过 `mariadb` 驱动连接）
- **配置**：在 `apps/backend/.env` 中设置数据库连接信息
- **同步**：`synchronize: true`，修改 Entity 后重启服务自动更新表结构
- **初始化**：确保数据库已创建（```CREATE DATABASE `Dageling003-Homepage`;```），首次启动会自动建表 + 创建默认 admin 账户
- **重置**：删表后重启即可自动重建（或 ```DROP DATABASE `Dageling003-Homepage`;``` 然后 ```CREATE DATABASE `Dageling003-Homepage`;```）

---

## 📁 项目结构

````
Dageling003-Homepage/
├── apps/
│   ├── frontend/          # Vue 3 + Vite + UnoCSS 前台主页
│   │   └── src/
│   │       ├── components/   # 组件（5 个）
│   │       ├── views/        # 页面
│   │       ├── stores/       # Pinia
│   │       ├── api/          # axios 封装
│   │       └── router/       # Vue Router
│   │
│   ├── admin/             # Vue 3 + Ant Design Vue 管理后台
│   │   └── src/
│   │       ├── views/        # 4 个页面
│   │       ├── layouts/      # 布局组件
│   │       ├── stores/       # auth Pinia store
│   │       ├── api/          # axios + interceptor
│   │       └── router/       # 登录守卫
│   │
│   └── backend/           # NestJS + TypeORM + MariaDB
│       └── src/
│           ├── auth/         # 认证模块（login/JWT/change-password）
│           ├── config/       # 配置模块（CRUD + 分类 + 导出）
│           ├── audit/        # 审计日志模块
│           └── users/        # 用户实体
│
├── docs/                  # 项目文档
├── package.json           # workspace 根配置
└── pnpm-workspace.yaml    # pnpm monorepo 配置
`````

---

## 🔧 常用命令

````bash
# 安装依赖到指定子项目
pnpm add <package> --filter Dageling003-Homepage-frontend
pnpm add <package> --filter Dageling003-Homepage-admin
pnpm add <package> --filter Dageling003-Homepage-backend

# 构建
pnpm build                                # 构建全部
pnpm --filter Dageling003-Homepage-frontend build     # 只构建前台
pnpm --filter Dageling003-Homepage-admin build        # 只构建后台
pnpm --filter Dageling003-Homepage-backend build      # 只构建后端

# 类型检查（不构建）
cd apps/frontend && npx vue-tsc -b --noEmit
cd apps/admin && npx vue-tsc -b --noEmit
`````

---

## 🔄 开发流程

````
1. 确定要改哪个模块
   ├── 前台页面      → apps/frontend
   ├── 后台管理      → apps/admin
   └── API/数据库   → apps/backend

2. 改代码

3. 验证
   pnpm --filter <项目名> build
`````

---

## 🌐 局域网访问配置

Vite 已配置 `host: true`，手机/iPad 连接同一 Wi-Fi 即可访问。

查看 IP：
````bash
ipconfig | grep IPv4
`````

如果换了网络 IP 变了，地址也跟着变（当前是 `192.168.31.86`）。

---

## 📦 前台页面配置项

通过后台 → 配置管理来动态控制前台内容：

| 配置键 | 说明 | 值示例 |
|--------|------|--------|
| `name` | 昵称 | `"鹊楠"` |
| `zodiac` | 星座 | `"摩羯座"` |
| `infoSex` | 性别符号 | `"♂"` |
| `infoProvince` | 所在省 | `"江苏"` |
| `infoSchool` | 学校 | `"南通大学"` |
| `professions` | 职业标签 | `["前端切图仔","摄影爱好者"]` |
| `links` | 快捷链接 | `[{"text":"GitHub","url":"https://","color":"#333"}]` |
| `techs` | 技术栈 | `[{"name":"Vue"},{"name":"HTML"}]` |
| `todos` | 待办事项 | `[{"text":"学Java","done":false}]` |
| `typewriterWords` | 打字机文字 | `["欢迎","Hello"]` |

> 以上都是 JSON 格式的字符串，在后台配置管理的「格式化 JSON」按钮可以一键美化。

---

## 🚢 生产环境部署（内网 HTTP）

````bash
# 1. 构建所有应用
pnpm build

# 2. 将产物复制到服务器
#    前台：apps/frontend/dist/ → /var/www/Dageling003-Homepage/frontend/
#    后台：apps/admin/dist/    → /var/www/Dageling003-Homepage/admin/
#    后端：apps/backend/dist/  → 保持原位（或部署到目标机器）

# 3. 启动后端（PM2 守护）
cd apps/backend
cp .env .env.prod   # 按需修改生产数据库配置
pm2 start ../../ecosystem.config.js

# 4. 启动 Caddy 反向代理
caddy run --config ../../Caddyfile

# 5. 访问
#    前台：http://192.168.31.86:80
#    后台：http://192.168.31.86:3001
`````

> **Caddyfile** 和 **ecosystem.config.js** 在项目根目录。
> IP 地址改为实际机器的内网 IP，Caddy 配置为纯 HTTP（无 HTTPS）。
