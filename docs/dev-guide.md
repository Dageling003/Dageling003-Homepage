# 开发指南

> 如何启动、开发和维护 homepage 项目
>
> 最后更新：2026/06/07 v0.6.1

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
| 前台主页 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| API 文档 | http://localhost:8000/api/docs |

---

## 🔑 默认管理员

后端首次启动时自动创建（需设置环境变量 `DEFAULT_ADMIN_PASSWORD`）：

| 用户名 | 密码 |
|--------|------|
| `admin` | 由 `DEFAULT_ADMIN_PASSWORD` 指定 |

> 登录后请立即修改密码。

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
├── Caddyfile              # 反向代理（生产部署）
├── Caddyfile.docker       # 反向代理（Docker 部署）
├── Dockerfile.app         # Docker all-in-one 镜像构建
├── docker-compose.yml     # Docker 编排（app + mariadb + caddy）
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

3 个镜像，一键启动：

| 镜像 | 容器 | 说明 |
|------|------|------|
| `homepage-app` | 应用容器 | 后端 API(:8000) + 前台静态文件(:3000) + 后台静态文件(:3001)，all-in-one |
| `mariadb:11.4` | 数据库 | 持久化存储 |
| `caddy:alpine` | 反向代理 | 统一入口(:80/:443) |

### 前置要求

- Docker Engine >= 24.x
- Docker Compose >= 2.x

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
# 编辑 .env，至少设置：
#   JWT_SECRET（openssl rand -base64 32）
#   DEFAULT_ADMIN_PASSWORD（至少 12 位）
#   DB_ROOT_PASSWORD
```

### 2. 启动

```bash
docker compose up -d
```

### 3. 访问

| 服务 | 直接访问 | 通过 Caddy |
|------|----------|------------|
| 前台主页 | http://localhost:3000 | http://localhost |
| 管理后台 | http://localhost:3001 | http://admin.localhost |
| 后端 API | http://localhost:8000 | http://localhost/api |
| Swagger 文档 | http://localhost:8000/api/docs | http://localhost/api/docs |

> Caddy 配置见 `Caddyfile.docker`，替换 `{host}` 为实际域名或 IP。

### 文件说明

| 文件 | 用途 |
|------|------|
| `docker-compose.yml` | 编排 3 个服务（app + mariadb + caddy） |
| `Dockerfile.app` | All-in-one 构建（后端 + 前端静态 + 后台静态） |
| `.dockerignore` | Docker 构建忽略清单 |
| `Caddyfile.docker` | Caddy 反向代理配置 |

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

或在后端 `main.ts` 中 `bootstrap()` 前添加 `require('dotenv').config({ path: 'apps/backend/.env' })`。

---

## 🔐 安全提醒

- `.env` 已在 `.gitignore`，确保**不要把真实环境变量提交到 Git**
- `JWT_SECRET` 使用强随机字符串（`openssl rand -base64 32`），后端启动时强制校验，不安全的密钥会拒绝启动
- 首次登录后立即修改默认密码
- 文件上传限制 5MB，仅接受图片格式，自动 WebP 压缩
