# homepage

> 全栈前后端分离的首页管理系统 —— 一个轻量、可自托管的个人主页与配套管理后台

[![Node](https://img.shields.io/badge/node-%3E%3D20.19.0-339933)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D11.0.0-F69220)](https://pnpm.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## ✨ 特性

- 🎨 **前台展示页** — 极简主页，支持主题切换、打字机动效、时光进度条
- 🛠 **管理后台** — 可视化表单配置，无需手写 JSON
- 🔐 **鉴权与会话** — JWT + bcrypt，登录态持久化
- 🗄 **数据持久化** — TypeORM + MariaDB
- 📜 **审计日志** — 后台操作自动落库，支持筛选检索
- 👤 **头像上传** — 本地上传 + sharp 自动压缩为 WebP
- 🏫 **34 省选择 + 1200+ 院校搜索** — 省级行政区选择器 + 教育部认证院校数据库
- 🎂 **自动年龄星座** — 填出生日期自动算
- 🚀 **首次设置向导** — 新用户 7 步完成初始化
- 📦 **Monorepo** — pnpm workspace 统一管理

---

## 🏗 技术栈

| 子项目 | 技术 | 端口 |
|--------|------|------|
| `apps/frontend` 前台主页 | Vue 3.5 + Vite + UnoCSS + Pinia | `3000` |
| `apps/admin` 管理后台 | Vue 3.5 + Vite + Ant Design Vue + Pinia | `3001` |
| `apps/backend` 后端 API | NestJS 11 + TypeORM + MariaDB + JWT | `8000` |

---

## 🚀 快速开始

### 前置要求

- Node.js >= 20.19.0
- pnpm >= 11.0.0
- MariaDB >= 10.5

### 1. 克隆 & 安装

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
# 修改 JWT_SECRET、DB_* 等（务必改 JWT_SECRET！）
```

### 4. 启动

```bash
# 一键启动全部
pnpm dev

# 或分别启动
pnpm dev:backend    # 后端  http://localhost:8000
pnpm dev:frontend   # 前台  http://localhost:3000
pnpm dev:admin      # 后台  http://localhost:3001
```

### 5. 首次使用

1. 浏览器打开 `http://localhost:3001` → 登录页
2. 用默认管理员账号登录
3. 自动跳转到 **首次设置向导**，7 步完成初始化
4. 完成后进入仪表盘

---

## 🗂 项目结构

```
homepage/
├── apps/
│   ├── frontend/          # 前台主页
│   ├── admin/             # 管理后台
│   └── backend/           # 后端 API
├── docs/                  # 文档
│   ├── architecture.md    # 架构
│   ├── dev-guide.md       # 开发指南
│   └── progress.md        # 进度
├── Caddyfile              # 反向代理（生产部署）
├── Caddyfile.docker       # 反向代理（Docker 部署）
├── Dockerfile.app         # Docker all-in-one 镜像构建
├── docker-compose.yml     # Docker 编排
├── ecosystem.config.cjs   # PM2 部署
└── package.json           # workspace 配置
```

---

## 🚢 部署

```bash
# 构建
pnpm build
# 前台 → apps/frontend/dist
# 后台 → apps/admin/dist
# 后端 → apps/backend/dist
```

生产环境：
- **内网 HTTP**：Caddy 托管静态文件 + `/api` 反向代理 + PM2 守护后端
- **Docker**：`docker compose up -d` 一键启动（app + mariadb + caddy）

---

## 📖 文档

- [docs/architecture.md](./docs/architecture.md) — 整体架构与数据流
- [docs/dev-guide.md](./docs/dev-guide.md) — 开发流程与约定
- [docs/progress.md](./docs/progress.md) — 开发进度
- [docs/technology-selection.md](./docs/technology-selection.md) — 技术栈清单

---

## 📄 License

MIT
