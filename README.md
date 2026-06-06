# Dageling003-Homepage

> 全栈前后端分离的首页管理系统 —— 一个轻量、可自托管的个人主页与配套管理后台

[![Node](https://img.shields.io/badge/node-%3E%3D20.19.0-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D11.0.0-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## ✨ 特性

- 🎨 **前台展示页** — 极简主页，对标 `quenan.cn` 风格，支持主题切换、动效、时光进度条等
- 🛠 **管理后台** — 基于 Ant Design Vue，可视化配置首页内容、查看审计日志、管理账号
- 🔐 **鉴权与会话** — JWT + bcrypt 密码哈希，登录态持久化，支持修改密码
- 🗄 **数据持久化** — TypeORM + MariaDB，配置项以表结构存储
- 📜 **审计日志** — 后台关键操作（登录、修改配置等）自动落库
- 📦 **Monorepo** — pnpm workspace 统一管理，命令一站式启动 / 构建 / Lint

---

## 🏗 技术栈

| 子项目 | 技术 | 端口 |
|--------|------|------|
| `apps/frontend` 前台主页 | Vue 3.5 + Vite + UnoCSS + Pinia | `3000` |
| `apps/admin` 管理后台 | Vue 3.5 + Vite + Ant Design Vue + Pinia | `3001` |
| `apps/backend` 后端 API | NestJS 11 + TypeORM + MariaDB + JWT | `8000` |

> 详细版本与选型理由见 [docs/technology-selection.md](./docs/technology-selection.md)

---

## 📁 目录结构

```
Dageling003-Homepage/
├── apps/
│   ├── frontend/        # 前台主页（Vue 3 + Vite）
│   ├── admin/           # 管理后台（Vue 3 + Ant Design Vue）
│   └── backend/         # 后端 API（NestJS）
├── docs/                # 项目文档
│   ├── architecture.md          # 整体架构
│   ├── api.md                   # 接口说明
│   ├── dev-guide.md             # 开发指南
│   ├── progress.md              # 进度记录
│   └── technology-selection.md  # 技术选型
├── .gitignore
├── .npmrc
├── Caddyfile            # 反向代理 / 静态服务配置
├── ecosystem.config.js  # PM2 部署配置
├── package.json         # 根 workspace 配置
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── tsconfig.base.json
```

---

## 🚀 快速开始

> 前置环境：**Node.js ≥ 20.19.0** · **pnpm ≥ 11.0.0** · **MariaDB ≥ 10.5**

### 1. 克隆 & 安装依赖

```bash
git clone https://github.com/<your-username>/Dageling003-Homepage.git
cd Dageling003-Homepage
pnpm install
```

### 2. 初始化数据库

```sql
`CREATE DATABASE `Dageling003-Homepage` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置后端环境变量

```bash
cd apps/backend
cp .env.example .env
# 按需修改 .env（JWT_SECRET、DB_* 等）
```

> ⚠️ **请务必**修改 `JWT_SECRET` 为强随机字符串（`openssl rand -base64 32`），并设置安全的数据库口令。

### 4. 启动开发服务

```bash
# 根目录执行，一键启动全部（推荐）
pnpm dev

# 或分别启动
pnpm dev:backend     # 后端  http://localhost:8000
pnpm dev:frontend    # 前台  http://localhost:3000
pnpm dev:admin       # 后台  http://localhost:3001
```

> 首次启动后端会自动创建默认管理员账号，**请立即登录后台修改默认密码**。

### 5. 访问

| 入口 | 地址 |
|------|------|
| 前台主页 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| 后端 API | http://localhost:8000 |
| Swagger 文档 | http://localhost:8000/api/docs |

---

## 📜 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动三个子项目 |
| `pnpm dev:<app>` | 单独启动指定子项目（`frontend` / `admin` / `backend`） |
| `pnpm build` | 全部子项目构建 |
| `pnpm lint` | 全部子项目 Lint |
| `pnpm format` | Prettier 格式化所有 TS / Vue / JSON / MD 文件 |

---

## 🚢 部署

构建产物：

```bash
pnpm build
# 前台：apps/frontend/dist
# 后台：apps/admin/dist
# 后端：apps/backend/dist
```

生产环境推荐架构：

```
Internet
   │
   ▼
┌──────────┐
│  Caddy   │  ← 静态资源（frontend/admin/dist）+ 反向代理 /api/* → backend
└────┬─────┘
     │
     ▼
┌──────────┐
│  PM2     │  ← 后端 Node 进程（ecosystem.config.js）
└────┬─────┘
     │
     ▼
┌──────────┐
│ MariaDB  │
└──────────┘
```

详细部署步骤参见各子项目 README：
- [apps/backend/README.md](./apps/backend/README.md)
- [apps/admin/README.md](./apps/admin/README.md)
- [apps/frontend/README.md](./apps/frontend/README.md)

---

## 🔐 安全须知

- 提交前请确认 `.env` 已在 `.gitignore`（已默认配置），**不要把真实环境变量推送到 GitHub**
- `apps/backend/.env.example` 仅作为模板，所有占位符均已替换为 `replace-with-...` 字符串
- 首次部署后请立即修改默认管理员密码
- 建议在 GitHub 仓库启用 Branch Protection（main 分支禁止 force push）

---

## 📚 文档

- [docs/architecture.md](./docs/architecture.md) — 整体架构与数据流
- [docs/api.md](./docs/api.md) — 后端接口说明
- [docs/dev-guide.md](./docs/dev-guide.md) — 开发流程与约定
- [docs/technology-selection.md](./docs/technology-selection.md) — 技术选型
- [docs/progress.md](./docs/progress.md) — 开发进度

---

## 🤝 贡献

欢迎提 Issue / PR。提交前请确保：

- 代码通过 `pnpm lint` 与 `pnpm build`
- 遵循现有代码风格（项目内含 ESLint + Prettier 配置）
- Commit 信息使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范

---

## 📄 License

[MIT](./LICENSE)
