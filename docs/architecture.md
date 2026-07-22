# homepage 技术架构文档

<p align="right">
  <strong>简体中文</strong> · <a href="./architecture.en.md">English</a>
</p>

> 最后更新：2026/06/08 v0.7.0

---

## 一、项目概述

homepage 是一个全栈前后端分离的首页管理系统，包含三个子系统：

| 子系统 | 路径 | 开发端口 | 技术栈 |
|--------|------|------|--------|
| **前台主页** | `apps/frontend` | 3000 | Vue 3 + Vite + UnoCSS |
| **管理后台** | `apps/admin` | 3001 | Vue 3 + Ant Design Vue + UnoCSS |
| **后端 API** | `apps/backend` | 8000 | NestJS + TypeORM + MariaDB/SQLite |

> 开发环境端口 3000/3001/8000；Docker 生产环境仅暴露 80/443（Caddy 统一入口）。

---

## 二、整体架构图

```
┌──────────────────────────────────────────────────────┐
│                     Caddy (:80/:443)                  │
│                                                      │
│  /          → file_server (/var/www/frontend)        │
│  /admin*    → file_server (/var/www/admin)           │
│  /api/*     → reverse_proxy app:8000                 │
│  HTTPS      → 自动申请 + 续签 (ZeroSSL / Let's Encrypt)│
└──────┬───────────────────────────────────────────────┘
       │
       │  /api/* 反向代理
       ▼
┌──────────────────┐      ┌─────────────────┐
│  Backend (NestJS) │      │    MariaDB      │
│  app:8000         │◄────►│    :3306        │
│                   │      │                 │
│  AuthModule       │      │  users          │
│  SiteConfigModule │      │  site_config    │
│  AuditModule      │      │  audit_logs     │
│  TypeORM          │      │                 │
└──────────────────┘      └─────────────────┘
```

> Docker 生产环境：Caddy 直接提供前端/后台静态文件（无中间 Node 进程），仅 API 请求到达后端容器。

---

## 三、部署架构（Docker）

```
┌──────────────────────────────────────────────────────────┐
│  docker compose                                           │
│                                                          │
│  Network: frontend                                        │
│  ├─ homepage-caddy (Caddy + 静态文件)                     │
│  │  ├─ 端口 80/443 暴露到宿主机                            │
│  │  ├─ 内置 frontend + admin dist                        │
│  │  ├─ /api/* → app:8000                                │
│  │  ├─ /health → 健康检查端点                              │
│  │  ├─ HEALTHCHECK: caddy validate                       │
│  │  └─ depends_on: app (service_healthy)                 │
│  │                                                       │
│  │  Network: backend (App 桥接两个网络)                    │
│  ├─ homepage-app (后端 API 专用)                          │
│  │  ├─ node:22-alpine                                    │
│  │  ├─ 仅生产依赖 (pnpm deploy --prod)                    │
│  │  ├─ HEALTHCHECK: /health                              │
│  │  ├─ 连接 frontend 网络 (与 Caddy 通信)                 │
│  │  ├─ 连接 backend 网络 (与 MariaDB 通信)                │
│  │  └─ depends_on: mariadb (service_healthy)             │
│  │                                                       │
│  │  Network: backend                                     │
│  └─ homepage-db (MariaDB 11.4)                           │
│     ├─ 仅连接 backend 网络 (不暴露到 frontend)             │
│     ├─ 持久化存储 (mariadb_data volume)                   │
│     └─ HEALTHCHECK: mariadb-admin ping                   │
└──────────────────────────────────────────────────────────┘
```

**网络隔离设计：**

| 网络 | 连接的服务 | 用途 |
|------|-----------|------|
| `frontend` | caddy, app | Caddy 反向代理到 App |
| `backend` | app, mariadb | App 连接数据库 |

> MariaDB 仅在 `backend` 网络中，不直接暴露到 `frontend`，增强安全性。

**两个镜像，各司其职：**

| 镜像 | Dockerfile | 内容 |
|------|-----------|------|
| `homepage-app` | `Dockerfile.app` | 后端 API（NestJS dist + 生产依赖）+ 静态文件 dist（供 Caddy 提取）|
| `homepage-caddy` | `Dockerfile.caddy` | Caddy + 内置前端/后台静态文件 |

---

## 四、项目结构

```tree
homepage/
├── apps/
│   ├── frontend/                  # 前台主页
│   │   └── src/
│   │       ├── api/               # HTTP 请求封装
│   │       ├── router/            # 路由（单页）
│   │       ├── stores/            # Pinia 状态管理
│   │       ├── types/             # TypeScript 类型
│   │       ├── components/        # 5 个 UI 组件
│   │       └── views/             # 页面组件
│   │
│   ├── admin/                     # 管理后台
│   │   └── src/
│   │       ├── api/               # HTTP 请求封装
│   │       ├── layouts/           # AdminLayout（侧边栏+顶栏）
│   │       ├── components/        # 通用组件（面包屑/标签页/主题设置）
│   │       ├── stores/            # Pinia（auth/tabs/theme）
│   │       ├── router/            # 路由（登录守卫 + 初始化守卫）
│   │       └── views/             # 页面
│   │           ├── login/         # 登录页
│   │           ├── setup/         # 首次设置向导
│   │           ├── dashboard/     # 仪表盘
│   │           ├── config/        # 配置管理（表单编辑）
│   │           ├── account/       # 账号设置
│   │           ├── audit/         # 操作日志
│   │           └── error/         # 404
│   │
│   └── backend/                   # 后端 API
│       └── src/
│           ├── auth/              # 认证模块
│           │   ├── dto/           # 请求 DTO
│           │   ├── jwt.strategy   # JWT 策略
│           │   └── jwt-auth.guard # 认证守卫
│           ├── config/            # 配置管理模块
│           │   ├── dto/           # 请求 DTO
│           │   └── entities/      # 数据实体
│           ├── audit/             # 审计日志模块
│           └── users/             # 用户实体
│
├── scripts/                       # 部署和运维脚本
│   ├── deploy.sh                  # 一键部署
│   ├── build.sh                   # 构建脚本
│   ├── update.sh                  # 更新脚本
│   ├── smoke-test.sh              # 冒烟测试
│   ├── docker-health.sh           # Docker 健康检查
│   ├── domain-check.sh            # 域名验证
│   └── backup-db.sh               # 数据库备份
├── config/                        # 配置文件
│   └── ecosystem.config.cjs       # PM2 配置
├── docs/                          # 项目文档
├── docker/                        # Docker 构建文件
│   ├── Dockerfile.app             # 后端 API 镜像构建
│   ├── Dockerfile.caddy           # Caddy + 静态文件镜像构建
│   └── .env.example               # Docker 环境变量模板
├── caddy/                         # Caddy 配置
│   ├── Caddyfile                  # Caddy 配置（Docker）
│   ├── Caddyfile.dev              # 反向代理（开发/内网部署）
│   └── entrypoint.sh              # Caddy 入口
├── docker-compose.yml             # Docker 编排（app + mariadb + caddy）
├── .dockerignore                  # Docker 构建忽略清单
├── package.json                   # workspace 根
└── pnpm-workspace.yaml
```

---

## 五、数据流

### 认证流程

```
登录                        操作日志
POST /api/auth/login        config CRUD → 自动写入 audit_logs
  → 验证用户名+密码           → 记录 操作人/时间/变更内容
  → 返回 JWT Token
  → 后续请求带 Header:
    Authorization: Bearer xxx
```

> ⚠️ **JWT 初始化顺序**：`JwtModule` 使用 `registerAsync` 延迟加载密钥，避免模块装饰器阶段 `.env` 未加载导致的 `undefined` 问题。

### 头像上传流程

```
用户上传头像
  → POST /api/config/upload/avatar (multipart/form-data)
  → multer 接收文件 (仅 jpg/png/gif/webp, ≤5MB)
  → sharp 压缩为 200×200 WebP (quality 70)
  → 存储至 public/uploads/avatar/avatar-{timestamp}-{random}.webp
  → 返回 URL: /files/uploads/avatar/xxx.webp
  → 前端调用 PUT /api/auth/profile 更新 avatarUrl
```

> 静态文件通过 `app.useStaticAssets()` 以 `/files/` 前缀对外服务。

### 首次初始化流程

```
首次访问管理后台
  → 路由守卫检测是否已登录
  → 未登录 → 跳转 /login
  → 用户用默认管理员账号登录
  → 路由守卫检测 GET /api/config/initialized
  → 返回 { data: { initialized: false } }（_initialized = '0' 或 key 不存在）
  → 重定向到 /setup

7 步设置向导：
  Step 0: 欢迎页
  Step 1: 个人信息（姓名/性别/出生日期/省份/学校/职业标签）
  Step 2: 快捷链接（多条，含名称+URL+颜色）
  Step 3: 技术栈（多个技术名称）
  Step 4: 打字机（多条轮播文字）
  Step 5: 待办事项（多项，可标记完成）
  Step 6: 完成 → 设置 _initialized = '1' → 跳转 /dashboard
```

> **种子数据**：首次启动自动创建 20 条默认配置 + 1 个管理员账号，其中 `_initialized = '0'` 确保新部署必须走初始化流程。

---

## 六、数据模型

```sql
-- 用户表
users:
  id            INT PK AUTO_INCREMENT
  username      VARCHAR(50) UNIQUE
  password      VARCHAR(255)    (bcrypt 12 rounds)
  role          VARCHAR(10) DEFAULT 'admin'
  avatarUrl     VARCHAR(255) NULL   (头像地址, /files/uploads/avatar/*.webp)
  theme         VARCHAR(10) DEFAULT 'light'
  createdAt     DATETIME
  updatedAt     DATETIME

-- 站点配置表
site_config:
  id            INT PK AUTO_INCREMENT
  config_key    VARCHAR(50) UNIQUE
  config_value  TEXT
  category      VARCHAR(50)       (分组: info/links/techs/todos/system)
  createdAt     DATETIME
  updatedAt     DATETIME

-- 审计日志表
audit_logs:
  id            INT PK AUTO_INCREMENT
  action        VARCHAR(10)       (CREATE/UPDATE/DELETE)
  entity        VARCHAR(50)
  entity_key    VARCHAR(50)
  detail        TEXT
  operator      VARCHAR(50)
  createdAt     DATETIME
```

---

## 七、关键设计

### 安全性

- 密码：bcrypt 12 rounds + JWT Token 过期（7 天）
- JWT_SECRET 启动时强制校验：未设置、为默认值或长度 < 20 字符则拒绝启动
- `JwtModule.registerAsync` 确保 .env 加载后才读取密钥
- 管理员默认密码 ≥12 位，修改密码 ≥12 位，登录密码 ≥8 位
- helmet 安全头强化：CSP、HSTS (max-age=1年)、crossOrigin 策略
- 全局请求体 1MB 限制（DDoS 防护）
- Swagger 文档仅在非生产环境启用
- Rate limiting：全局 120/min，登录接口 5/min
- 文件上传：sharp 压缩 + WebP 转换（200×200）+ 双重校验（MIME + sharp metadata）+ 5MB 限制
- 审计日志：所有配置变更自动记录，长值截断防泄露
- 初始化检查：首次使用必须完成设置向导（`_initialized` 标记）
- 默认管理员：自动创建 + 环境变量 `DEFAULT_ADMIN_PASSWORD` 指定密码
- 依赖安全：定期审计修复高危漏洞（form-data、multer、nodemailer）
- Docker 网络隔离：MariaDB 仅在 backend 网络，不暴露到 frontend

### 数据库

- `DB_TYPE=sqlite` 使用无需外部服务的 SQLite (sql.js)，启动时自动同步 Schema
- `DB_TYPE=mariadb`（默认）使用 MariaDB，`DB_SYNCHRONIZE` 控制 Schema 同步
- MariaDB 生产环境应保持 `DB_SYNCHRONIZE=false`
- MariaDB 连接池配置：connectionLimit=20, connectTimeout=10s

### 配置管理

- 20 个配置项分 4 个分类（info/links/techs/todos） + 1 个系统标记（`_initialized`）
- admin 以表单形式编辑（不再是 JSON 文本框）
- 前台通过 configHandlers 映射动态加载
- 出生日期自动计算年龄和星座
- 34 省选择器 + 2909 所学校搜索

### 部署

- 开发：`pnpm dev` 一键启动三个子项目
- 生产部署（内网 HTTP）：
  - `pnpm build` 构建全部 → Caddy 托管静态文件 + PM2 守护后端
  - 或 `bash deploy.sh` Docker 一键部署
- 生产部署（Docker）：
  - 两个镜像：`homepage-app`（后端API）+ `homepage-caddy`（Caddy + 静态文件）
  - 仅暴露 80/443 端口，所有流量走 Caddy
  - 内置 HEALTHCHECK，`service_healthy` 依赖
  - 网络隔离：frontend（Caddy ↔ App）+ backend（App ↔ MariaDB）
  - MariaDB 不暴露到 frontend 网络，增强安全性
