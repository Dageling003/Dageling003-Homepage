<p align="center">
  <img src="docs/logo.svg" alt="Homepage" width="120" />
</p>

<h1 align="center">Homepage</h1>

<p align="center">
  <strong>轻量、可自托管的个人主页与可视化管理后台</strong>
  <br />
  告别硬编码 JSON，用表单驱动你的个人主页
</p>

<p align="center">
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20.19.0-339933?logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-%3E%3D11.0.0-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
  <a href="https://nestjs.com"><img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" /></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/vue-3.5-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue" /></a>
</p>

---

## 🧭 这是什么？

**Homepage** 是一套开箱即用的全栈个人主页系统——包含面向访客的前台展示页、面向站长的可视化管理后台，以及驱动这一切的 RESTful API。

你不再需要手动编辑 JSON 配置文件。登录管理后台，在表单里填写个人信息、拖拽排序快捷链接、增删技术栈，前台自动生效。审计日志会记录每一次变更，让你随时知道"谁在什么时候改了什么"。

---

## ✨ 为什么选它

<table>
  <tr>
    <td width="50%">
      <strong>🖥 前台展示页</strong><br />
      极简设计，暗色/亮色主题一键切换。打字机动效、时光进度条，让个人主页不再单调。
    </td>
    <td width="50%">
      <strong>⚙️ 可视化后台</strong><br />
      基于 Ant Design Vue 的表单驱动配置页，所见即所得。不需要懂代码就能管理整站内容。
    </td>
  </tr>
  <tr>
    <td>
      <strong>🔐 JWT 鉴权</strong><br />
      bcrypt 哈希 + JWT 无状态会话，路由守卫拦截未登录请求。
    </td>
    <td>
      <strong>📜 审计日志</strong><br />
      每次配置变更自动落库，可按操作人、时间范围、模块筛选追溯。
    </td>
  </tr>
  <tr>
    <td>
      <strong>👤 头像上传</strong><br />
      本地上传 → sharp 自动裁剪压缩为 200×200 WebP，<strong>前端无需关心图片处理</strong>。
    </td>
    <td>
      <strong>🎂 智能填报</strong><br />
      填入出生日期，系统自动计算年龄与星座；34 省选择器 + 1200+ 院校搜索。
    </td>
  </tr>
  <tr>
    <td>
      <strong>🚀 首次设置向导</strong><br />
      新部署自动检测未初始化状态，<strong>7 步向导</strong>引导站长完成全站配置。
    </td>
    <td>
      <strong>🐳 一键部署</strong><br />
      <code>bash deploy.sh</code> 交互式引导，自动配置 HTTPS 证书（<strong>ZeroSSL</strong>，国内可用）。
    </td>
  </tr>
  <tr>
    <td>
      <strong>📦 Monorepo</strong><br />
      pnpm workspace 统一管理三端，一条命令启动全部服务。
    </td>
    <td>
      <strong>📡 Swagger 文档</strong><br />
      运行时访问 <code>/api/docs</code> 即可交互式调试全部 API。
    </td>
  </tr>
</table>

---

## 🏗 架构总览

```
                    ┌─────────────────────────┐
                    │     Caddy (80 / 443)     │
                    │   HTTPS · ZeroSSL 证书   │
                    │   自动续签 · 零配置       │
                    └────┬──────┬──────┬───────┘
                         │      │      │
                   /     │  /admin   │ /api
                         │      │      │
              ┌──────────┴┐ ┌───┴──────┴──────────┐
              │ Frontend  │ │   NestJS Backend     │
              │ Vue 3     │ │   :8000 (内部)       │
              │ :3000     │ │                      │
              │ (内部)    │ │  ┌─────────────────┐ │
              └───────────┘ │  │    MariaDB      │ │
                            │  │    :3306        │ │
              ┌─────────────┤  └─────────────────┘ │
              │ Admin       │                      │
              │ Ant Design  │                      │
              │ :3001 (内部)│                      │
              └─────────────┴──────────────────────┘
```

| 子项目 | 技术栈 | 内部端口 | 对外路径 |
|--------|--------|----------|----------|
| `apps/frontend` 前台主页 | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `3000` | `/` |
| `apps/admin` 管理后台 | Vue 3.5 + Ant Design Vue 4 + ECharts + Vite 8 | `3001` | `/admin` |
| `apps/backend` API 服务 | NestJS 11 + TypeORM + MariaDB + JWT + Swagger | `8000` | `/api/*` |

> **端口对外隐藏**：3000 / 3001 / 8000 仅 Docker 内网互通，外部只暴露 80 / 443。

---

## 🚀 快速开始

### 前置依赖

- **Node.js** ≥ 20.19.0
- **pnpm** ≥ 11.0.0
- **MariaDB** ≥ 10.5

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd homepage

# 2. 安装依赖
pnpm install

# 3. 创建数据库
mysql -u root -p -e "CREATE DATABASE \`homepage\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. 配置环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env，务必修改 JWT_SECRET（长度 ≥ 20）和 DEFAULT_ADMIN_PASSWORD（≥ 12 位）

# 5. 一键启动
pnpm dev
```

访问地址：

| 服务 | 地址 |
|------|------|
| 🖥 前台主页 | http://localhost:3000 |
| ⚙️ 管理后台 | http://localhost:3001 |
| 📡 API 文档 (Swagger) | http://localhost:8000/api/docs |

### Docker 一键部署

```bash
# 一键部署 — 交互式引导，自动生成配置、构建镜像、启动服务
bash deploy.sh
```

脚本会引导你完成：

1. 输入域名或 IP 地址
2. 选择 **ZeroSSL**（国内推荐，不被墙）或 Let's Encrypt
3. 自动生成 JWT 密钥、管理员密码、数据库密码
4. 构建 All-in-one Docker 镜像
5. 启动全部服务

部署完成后访问（端口 80/443 统一入口，3000/3001/8000 对外隐藏）：

| 服务 | 地址 |
|------|------|
| 🖥 前台主页 | `http://your-domain/` |
| ⚙️ 管理后台 | `http://your-domain/admin` |
| 📡 API 文档 (Swagger) | `http://your-domain/api/docs` |

> 💡 使用域名部署时自动启用 HTTPS，证书由 Caddy 自动续签。

#### 手动部署（不使用 deploy.sh）

```bash
# 1. 创建环境变量文件
cp .env.docker.example .env.docker
# 编辑 .env.docker，填入你的域名、密钥、密码

# 2. 构建并启动
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker up -d
```

#### ZeroSSL vs Let's Encrypt

| | ZeroSSL | Let's Encrypt |
|--|---------|---------------|
| 国内访问 | ✅ 正常 | ❌ 可能被墙 |
| 免费 | ✅ 有免费额度 | ✅ 完全免费 |
| 证书有效期 | 90 天 | 90 天 |
| 自动续签 | ✅ Caddy 内置 | ✅ Caddy 内置 |

> 💡 **推荐**：国内部署选择 ZeroSSL（默认），海外可选 Let's Encrypt。
> 在 `.env.docker` 中设置 `ACME_CA` 即可切换，无需修改代码。

<!--
## 📸 预览

| 前台主页 | 管理后台 |
|----------|----------|
| ![前台截图](docs/screenshots/frontend.png) | ![后台截图](docs/screenshots/admin.png) |

> 💡 运行项目后截取实际效果图替换上述占位路径。
-->

---

## 📂 目录结构

```
homepage/
├── apps/
│   ├── frontend/            # 前台主页 (Vue 3 + UnoCSS)
│   │   └── src/
│   │       ├── views/       # 页面组件
│   │       ├── stores/      # Pinia 状态管理
│   │       └── api/         # Axios 请求封装
│   ├── admin/               # 管理后台 (Vue 3 + Ant Design Vue)
│   │   └── src/
│   │       ├── views/       # 仪表盘 / 配置管理 / 审计日志
│   │       ├── stores/      # auth / tabs / theme
│   │       └── router/      # 路由守卫 + 初始化检测
│   └── backend/             # API 服务 (NestJS)
│       └── src/
│           ├── auth/        # 认证模块 (JWT + bcrypt)
│           ├── config/      # 站点配置 CRUD + 头像上传
│           ├── audit/       # 审计日志
│           └── users/       # 用户实体
├── docs/                    # 文档
│   ├── architecture.md      # 架构设计
│   ├── api.md               # API 接口文档
│   ├── dev-guide.md         # 开发指南
│   ├── progress.md          # 开发进度
│   └── technology-selection.md  # 技术选型
├── Caddyfile                # 反向代理配置（本地）
├── Caddyfile.docker         # 反向代理配置（Docker）
├── Dockerfile.app           # All-in-one 镜像构建
├── docker-compose.yml       # Docker 编排
├── deploy.sh                # 一键部署脚本
├── .env.docker.example      # Docker 环境变量模板
├── ecosystem.config.cjs     # PM2 生产部署
└── pnpm-workspace.yaml
```

---

## 🛠 常用命令

```bash
# ---- 本地开发 ----
pnpm dev              # 并行启动全部服务
pnpm dev:backend      # 仅后端 :8000
pnpm dev:frontend     # 仅前台 :3000
pnpm dev:admin        # 仅后台 :3001

pnpm build            # 构建全部

pnpm lint             # 代码检查
pnpm format           # 格式化全部文件

# ---- Docker 部署 ----
bash deploy.sh        # 一键部署（交互式）
docker compose ps     # 查看服务状态
docker compose logs -f caddy  # 查看 Caddy 日志
docker compose down   # 停止所有服务
```

---

## 🔒 安全

- **JWT_SECRET** 启动时强制校验（长度 ≥ 20，不能是默认占位值）
- 密码使用 **bcrypt** 加盐哈希存储
- 头像上传限制：仅 `jpg/png/gif/webp`，≤ 5MB，服务端 sharp 统一转 200×200 WebP
- `helmet` 安全头 + `@nestjs/throttler` 速率限制
- `.env` 排除在版本控制之外

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [架构设计](./docs/architecture.md) | 整体架构、数据流与模块划分 |
| [API 文档](./docs/api.md) | 接口清单（也支持运行时 Swagger UI） |
| [开发指南](./docs/dev-guide.md) | 本地开发流程、代码约定与常见问题 |
| [技术选型](./docs/technology-selection.md) | 技术栈清单与选择理由 |

---

## 🤝 贡献指南

我们欢迎任何形式的贡献——无论是 Bug 报告、功能建议还是代码提交。

### 流程

1. **Fork** 本仓库
2. 基于 `main` 分支创建特性分支：`git checkout -b feat/your-feature`
3. 提交变更：`git commit -m "feat: add your feature"`
4. 推送分支并创建 **Pull Request**

### 约定

- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)
- 前端使用 Composition API + `<script setup lang="ts">`
- 后端模块遵循 NestJS 最佳实践（Module → Controller → Service → DTO）
- 在提交前运行 `pnpm lint` 确保代码风格一致

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。
