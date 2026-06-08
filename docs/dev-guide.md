# 开发指南

> 如何启动、开发和维护 homepage 项目
>
> 最后更新：2026/06/08 v0.7.0

---

## 🚀 快速启动

### 前置环境

| 工具 | 版本 | 检查命令 |
|------|------|---------|
| Node.js | >=20.19.0 | `node -v` |
| pnpm | >=11.0.0 | `pnpm -v` |
| MariaDB | >=10.5 | `mysql -V` |

### 1. 安装依赖

```bash
git clone <repo-url>
cd homepage
pnpm install
```

### 2. 创建数据库

```sql
CREATE DATABASE `homepage` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置环境变量

```bash
cd apps/backend
cp .env.example .env
# 修改 JWT_SECRET、DB_* 等
```

> ⚠️ **务必**修改 `JWT_SECRET` 为强随机字符串（`openssl rand -base64 32`），否则有安全风险。

### 4. 启动开发服务

```bash
# 根目录一键启动全部（推荐）
pnpm dev

# 或分别启动
pnpm dev:backend    # http://localhost:8000
pnpm dev:frontend   # http://localhost:3000
pnpm dev:admin      # http://localhost:3001
```

> ⚠️ **必须先启动后端**，前/后台依赖 `/api` 反向代理到 `localhost:8000`。

### 5. 访问

| 入口 | 地址 |
|------|------|
| 网站主页 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| API 文档 | http://localhost:8000/api/docs |

---

## 🔑 默认管理员与找回密码

### 首次创建管理员

| 方式 | 触发条件 | 用户名 | 密码 |
|------|---------|--------|------|
| 环境变量 | `DEFAULT_ADMIN_PASSWORD` 设置且 ≥ 12 位 | `admin` | 该环境变量值 |
| 首次 setup 向导 | `DEFAULT_ADMIN_PASSWORD` 留空 / 缺失 | 用户在向导里自定（默认 `admin`） | 用户在向导里自定（≥ 12 位） |

> 两种方式**只能二选一**：环境变量生效后，向导里的「创建管理员」步骤会被自动隐藏。

### 找回密码

后台登录页提供「忘记密码？」入口：

- **配置了 SMTP**（见 [找回密码邮件配置](#找回密码邮件配置)）：系统向账号邮箱发送重置链接，1 小时内有效。
- **未配置 SMTP**：链接会同时通过 `docker logs homepage-app` 输出，运维可从日志中复制。

完整流程：

```text
登录页 → 忘记密码？ → 输入用户名
  ↓
后端生成一次性 token（哈希入库，1 小时过期）
  ↓
┌──────────────┬────────────────────┐
│ SMTP 已配置  │ 发送邮件           │
│ SMTP 未配置  │ 写入 docker logs   │
└──────────────┴────────────────────┘
  ↓
用户点击链接 / 打开 docker logs 抄链接
  ↓
打开 /admin/reset-password?token=...
  ↓
输入新密码（≥ 12 位，两次确认）
  ↓
立即用新密码登录
```

### 找回密码邮件配置

在 `.env.docker` 或 `apps/backend/.env` 中追加：

```bash
# 必填（不配 SMTP 就走 docker logs）
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@your-domain.com
SMTP_PASS=你的授权码或密码
SMTP_FROM="Homepage <noreply@your-domain.com>"
SMTP_REJECT_UNAUTHORIZED=true   # 自签证书可设为 false

# 可选：重置链接中展示的域名（不填则取 DOMAIN）
PUBLIC_ADMIN_URL=https://your-domain.com
```

主流邮箱参考（端口 / 加密）：

| 邮箱 | SMTP 地址 | 端口 | 加密 | 鉴权方式 |
|------|----------|------|------|---------|
| QQ | `smtp.qq.com` | 465 | SSL | 授权码 |
| 163 | `smtp.163.com` | 465 / 994 | SSL | 授权码 |
| Gmail | `smtp.gmail.com` | 465 | SSL | 应用专用密码 |
| Outlook | `smtp.office365.com` | 587 | STARTTLS | 账号密码 |
| 阿里企业邮 | `smtp.mxhichina.com` | 465 | SSL | 账号密码 |
| 腾讯企业邮 | `smtp.exmail.qq.com` | 465 | SSL | 账号密码 |
| 自建 | `mail.your-domain.com` | 587 | STARTTLS | 账号密码 |

> 端口 465 默认 SSL（`SMTP_SECURE=true`），587 通常用 STARTTLS（`SMTP_SECURE=false`）。

### 找回密码未配置 SMTP 时的应急步骤

```bash
# 1. 触发找回（也可以在后台登录页直接提交用户名）
curl -X POST https://your-domain.com/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin"}'

# 2. 在服务器抓日志中的链接
docker logs homepage-app 2>&1 | grep -A 6 '密码重置请求'
# 会输出：重置链接: https://.../admin/reset-password?token=...
#       重置 token (原样): <64位hex>

# 3. 浏览器打开链接，填新密码完成重置
```

---

## 🗄️ 数据库说明

- **类型**：MariaDB（`mariadb` 驱动）
- **配置**：`apps/backend/.env` → `DB_*` 变量
- **同步**：`DB_SYNCHRONIZE=true`（`.env` 中设置）开启 TypeORM 自动同步，改 Entity 后重启自动更新表结构
- **初始化**：首次启动自动建表 + 种子数据（20 条配置 + `_initialized = '0'` + 1 个管理员）
- **重置**：删表重启即可（或 `DROP DATABASE` 重建）
- **初始化标记**：`site_config` 表中的 `_initialized` 记录控制首次设置流程，值为 `'0'` 时跳转设置向导

---

## 📁 项目结构

```
homepage/
├── apps/
│   ├── frontend/          # 前台主页
│   └── src/
│       ├── components/    # AnimatedLogo / ThemeToggle / TypewriterText / TimeGreeting / QuickLinks
│       ├── views/         # HomeView (单页)
│       ├── stores/        # Pinia
│       └── api/           # axios
│
├── admin/                 # 管理后台
│   └── src/
│       ├── views/         # login / setup / dashboard / config / account / audit
│       ├── layouts/       # AdminLayout (侧边栏+顶栏+标签页)
│       ├── components/    # AppBreadcrumb / AppTab / ThemeSettings
│       ├── stores/        # auth / tabs / theme
│       └── api/           # axios + 拦截器
│
├── backend/               # 后端 API
│   └── src/
│       ├── auth/          # 登录 / JWT / 改密码
│       ├── config/        # 配置 CRUD / 上传头像
│       ├── audit/         # 审计日志
│       └── users/         # 用户实体
│
├── docs/                  # 项目文档
├── Caddyfile              # 反向代理（开发/内网部署）
├── Caddyfile.docker       # Caddy 配置（Docker，内置到 Caddy 镜像）
├── Dockerfile.app         # 后端镜像构建
├── Dockerfile.caddy       # Caddy + 静态文件镜像构建
├── docker-compose.yml     # Docker 编排（app + mariadb + caddy）
├── deploy.sh              # 一键部署脚本
├── ecosystem.config.cjs   # PM2
└── package.json           # workspace
```

---

## 🔧 常用命令

```bash
# 安装依赖
pnpm add <pkg> --filter homepage-frontend
pnpm add <pkg> --filter homepage-admin
pnpm add <pkg> --filter homepage-backend

# 构建
pnpm build                              # 构建全部
pnpm --filter homepage-frontend build   # 只构建前台
pnpm --filter homepage-admin build      # 只构建后台
pnpm --filter homepage-backend build    # 只构建后端

# 类型检查
cd apps/frontend && npx vue-tsc --noEmit
cd apps/admin && npx vue-tsc --noEmit
```

---

## 🌐 局域网访问

Vite 已配置 `host: true`，同 Wi-Fi 下手机/iPad 可访问：

| 服务 | 地址 |
|------|------|
| 前台主页 | `http://<本机IP>:3000` |
| 管理后台 | `http://<本机IP>:3001` |

```bash
# 查看本机 IP
ipconfig | grep IPv4
```

---

---

## 🐳 Docker 部署

两个镜像，各司其职：

| 镜像 | 容器 | 说明 |
|------|------|------|
| `homepage-app` | 后端 API | NestJS 后端 (:8000)，仅生产依赖，有 HEALTHCHECK |
| `homepage-caddy` | 反向代理 | Caddy + 内置前端/后台静态文件，统一入口 (:80/:443) |
| `mariadb:11.4` | 数据库 | 持久化存储 |

> Caddy 直接提供静态文件（不经过 Node 进程），仅 `/api/*` 到达后端容器。

### 前置要求

- Docker Engine >= 24.x
- Docker Compose >= 2.x

### 1. 一键部署（推荐）

```bash
bash deploy.sh
```

交互式配置域名、邮箱、密码等，自动生成 `.env.docker` 并构建+启动。

### 2. 手动部署

```bash
# 复制并编辑环境变量
cp .env.docker.example .env.docker
# 编辑 .env.docker，所有密码字段必填（无默认值兜底）

# 构建镜像（先 app，后 caddy — caddy 需要从 app 镜像提取静态文件）
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker build caddy

# 启动
docker compose --env-file .env.docker up -d
```

### 3. 访问

| 服务 | 地址 |
|------|------|
| 网站主页 | `http(s)://<你的域名>/` |
| 管理后台 | `http(s)://<你的域名>/admin` |
| 首次初始化 | `http(s)://<你的域名>/admin/setup` |
| 健康检查 | `http(s)://<你的域名>/health` |
| Swagger 文档 | 仅开发环境可用（生产环境已禁用） |

### 文件说明

| 文件 | 用途 |
|------|------|
| `docker-compose.yml` | 编排 3 个服务（app + mariadb + caddy），含 HEALTHCHECK、资源限制、日志轮转 |
| `Dockerfile.app` | 后端 API 镜像（多阶段构建 + pnpm deploy --prod） |
| `Dockerfile.caddy` | Caddy 镜像（从 app 镜像提取静态文件） |
| `Caddyfile.docker` | Caddy 配置（反向代理 /api，直接 serve 静态文件） |
| `.dockerignore` | Docker 构建忽略清单 |
| `deploy.sh` | 一键部署（交互式配置 + 构建 + 启动） |

### 常用运维命令

```bash
docker compose ps                    # 查看服务状态
docker compose logs -f               # 查看所有日志
docker compose logs -f app           # 查看后端日志
docker compose logs -f caddy         # 查看 Caddy 日志
docker compose restart app           # 重启后端
docker compose down                  # 停止并删除容器
docker compose up -d                 # 重新启动
docker compose --env-file .env.docker build app --no-cache  # 重新构建
```

---

## 🐛 常见问题

### 登录后页面空白

**原因**：`AdminLayout.vue` 中缺少 `computed` 的 Vue 导入。

```diff
- import { ref, h, watch } from 'vue'
+ import { ref, computed, h, watch } from 'vue'
```

Vite HMR 会自动生效，无需重启。

### 登录返回 500 Internal Server Error

**原因**：`JwtModule.register({ secret: process.env.JWT_SECRET! })` 在模块装饰器阶段执行，此时 `.env` 尚未加载，密钥为 `undefined`。

**修复**：改为 `registerAsync` 延迟加载：

```ts
JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET!,
    signOptions: { expiresIn: '7d' },
  }),
}),
```

### 初始化向导不出现

**原因**：数据库缺少 `_initialized` 记录（旧版 seed 数据不包含此字段）。

**手动修复**：

```sql
INSERT INTO site_config (config_key, config_value, category, createdAt, updatedAt)
VALUES ('_initialized', '0', 'system', NOW(), NOW());
```

---

## 🔐 安全提醒

- `.env` 已在 `.gitignore`，确保**不要把真实环境变量提交到 Git**
- `JWT_SECRET` 使用强随机字符串（`openssl rand -base64 32`），后端启动时强制校验
- `DEFAULT_ADMIN_PASSWORD` ≥12 位，首次登录后立即修改
- Docker 部署中所有密码强制设置（无弱默认值兜底）
- 文件上传限制 5MB，仅接受图片格式，自动 WebP 压缩
- 生产环境 Swagger 文档已禁用，/health 端点始终可用用于监控
