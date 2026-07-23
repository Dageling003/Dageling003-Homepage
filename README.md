<p align="center">
  <img src="image/logo.png" alt="Homepage" width="200" height="200" />
</p>

<h1 align="center">Dageling003-Homepage</h1>

<p align="center">
  轻量、可自托管的个人主页与可视化管理后台 —— 用表单驱动主页内容，无需硬编码 JSON。
</p>

<p align="center">
  <strong>简体中文</strong> · <a href="./README.en.md">English</a>
</p>

<p align="center">
  <a href="https://github.com/Dageling003/Dageling003-Homepage/releases"><img src="https://img.shields.io/github/v/release/Dageling003/Dageling003-Homepage?display_name=tag&sort=semver&label=release" alt="Latest Release" /></a>
  <a href="https://dageling003.top/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fdageling003.top%2F&up_message=online&down_message=offline&label=demo" alt="Live Demo" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%E2%89%A522.13-339933?logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-%E2%89%A511-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
  <a href="https://nestjs.com"><img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" /></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/vue-3.5-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue" /></a>
  <a href="./docker-compose.yml"><img src="https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

- **在线预览**：<https://dageling003.top/>（徽章离线时以仓库截图为准）
- **技术栈**：Vue 3 + Vite 前台/后台 · NestJS 11 + TypeORM API · MariaDB / SQLite 双数据源 · Caddy 反代 + 自动 HTTPS
- **交付形态**：pnpm monorepo（前台 / 后台 / API 三包）+ Docker Compose 三服务（app / caddy / mariadb）

---

## 📸 效果展示

> 截图中姓名、地区、学校、生日等隐私信息均已替换为示例占位符。

<table>
  <tr>
    <td width="50%" align="center">
      <strong>桌面 · 亮色</strong><br />
      <img src="image/screenshots/01-homepage.png" alt="Homepage Light" />
    </td>
    <td width="50%" align="center">
      <strong>桌面 · 暗色</strong><br />
      <img src="image/screenshots/06-homepage-dark.png" alt="Homepage Dark" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>移动端 · 亮色</strong><br />
      <img src="image/screenshots/02-homepage-mobile.png" alt="Homepage Mobile" width="280" />
    </td>
    <td align="center">
      <strong>移动端 · 暗色</strong><br />
      <img src="image/screenshots/07-homepage-mobile-dark.png" alt="Homepage Mobile Dark" width="280" />
    </td>
  </tr>
</table>

---

## ✨ 功能

- **前台展示**：亮/暗主题、打字机欢迎语、时光进度条、响应式布局（≥1024px 三栏 / <1024px 单栏）
- **可视化后台**：Ant Design Vue 表单驱动，个人信息 / 快捷链接 / 技术栈 / 待办 / 打字机文字全表单化
- **JWT + bcrypt**：12 rounds 哈希、无状态会话、路由守卫、`JWT_SECRET` 启动强校验
- **审计日志**：每次配置变更落库，可按操作人 / 时间 / 模块筛选
- **头像上传**：MIME + sharp metadata 双重校验，统一转 200×200 WebP
- **智能填报**：生日 → 自动计算年龄 / 星座；34 省选择器 + 2909 所院校搜索
- **首次设置向导**：`/admin/setup` 图形化引导创建管理员 + 配置全站内容
- **忘记密码**：SMTP 发信；未配置时降级写入 `docker logs`
- **一键部署**：`bash scripts/deploy.sh` 向导 → `docker compose up -d --build`，自动 HTTPS（ZeroSSL 默认，国内可用）
- **生产级安全**：helmet 安全头 + API 限流 + 请求体 1MB 限制 + 生产禁用 Swagger

---

## 🏗 架构

```
                Caddy (80/443, 自动 HTTPS)
                  │
                  ├── /              → 前台静态文件
                  ├── /admin/*       → 后台静态文件
                  ├── /api/*         → 反代 app:8000
                  └── /health        → 健康检查
                  │
                  ▼ [frontend network]
                NestJS API (:8000)
                  │
                  ▼ [backend network]
                MariaDB (:3306)
```

| 子项目 | 技术栈 | 开发端口 | 对外路径 |
|--------|--------|----------|----------|
| `apps/frontend` | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `3000` | `/` |
| `apps/admin` | Vue 3.5 + Ant Design Vue 4 + ECharts | `3001` | `/admin/*` |
| `apps/backend` | NestJS 11 + TypeORM + MariaDB/SQLite + JWT | `8000` | `/api/*` |

> 前后台的 HTML/JS/CSS 由 Caddy 直接 serve，不经过 Node 进程，仅 API 打到后端。

---

## 🚀 快速开始

### 前置

- Node.js ≥ 22.13.0
- pnpm ≥ 11.0.0
- MariaDB ≥ 10.5（仅生产；本地开发可用 SQLite 免装）

### 本地开发（SQLite，无需数据库）

```bash
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
pnpm install
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env：DB_TYPE=sqlite，设置 JWT_SECRET（≥20 位）和 DEFAULT_ADMIN_PASSWORD（≥12 位）
pnpm dev
```

三端并行启动后：

| 服务 | 地址 |
|------|------|
| 前台主页 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| Swagger | http://localhost:8000/api/docs |

需要三窗口独立日志时改用 `pnpm dev:backend` / `pnpm dev:frontend` / `pnpm dev:admin`。

### 本地开发（MariaDB）

```bash
mysql -u root -p -e "CREATE DATABASE \`homepage\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cp apps/backend/.env.example apps/backend/.env  # 填 DB_* 与 JWT_SECRET
pnpm migrate:run
pnpm dev
```

生成新 migration：

```bash
cd apps/backend
npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:generate -d data-source.ts src/migrations/$(date +%s)-Name
```

---

## 🐳 Docker 部署

**零基础一步一步走** → [docs/deploy-beginner.md](./docs/deploy-beginner.md)
**完整参考** → [docs/deployment.md](./docs/deployment.md)

### 向导部署（推荐）

```bash
bash scripts/deploy.sh                          # 交互式
DOMAIN=your-domain.com bash scripts/deploy.sh   # 跳过域名交互
CI=true bash scripts/deploy.sh                  # 零交互（CI/CD）
```

脚本依次询问：**域名 / IP → ACME 邮箱 → SMTP（可选）→ 管理员密码（自动 / 自定义 / 留空）**，生成 `.env.docker` 后可用一条命令启动：

```bash
docker compose --env-file .env.docker up -d --build
```

### 手动部署

```bash
cp docker/.env.example .env.docker
# 编辑 .env.docker（DOMAIN / JWT_SECRET / DB_* 密码必填）

docker compose --env-file .env.docker build app     # 先 app
docker compose --env-file .env.docker build caddy   # 后 caddy（依赖 app 镜像里的静态文件）
docker compose --env-file .env.docker up -d
```

### 镜像

| 镜像 | Dockerfile | 大小 |
|------|-----------|------|
| `homepage-app` | `docker/Dockerfile.app`（distroless + 仅生产依赖） | ~120MB |
| `homepage-caddy` | `docker/Dockerfile.caddy`（Caddy 2 + 内置前端/后台静态） | ~50MB |

未发布到 Docker Hub，需自行构建。

### HTTPS 证书

Caddy 内置自动续签。默认 ZeroSSL（国内可用），可切 Let's Encrypt：

```dotenv
# .env.docker
ACME_CA=https://acme-v02.api.letsencrypt.org/directory
```

---

## 🛠 常用命令

```bash
# 开发
pnpm dev / dev:backend / dev:frontend / dev:admin
pnpm build
pnpm lint
pnpm format

# Docker
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f app
docker compose --env-file .env.docker restart app
docker compose --env-file .env.docker down

# 备份 / 更新 / 冒烟
bash scripts/backup-db.sh [output_dir]
bash scripts/update.sh
bash scripts/smoke-test.sh [domain]
bash scripts/docker-health.sh
bash scripts/domain-check.sh
```

---

## 📂 目录结构

```
├── apps/
│   ├── frontend/            # Vue 3 + UnoCSS
│   ├── admin/               # Vue 3 + Ant Design Vue + ECharts
│   └── backend/             # NestJS (auth / config / audit / users)
├── docker/
│   ├── Dockerfile.app       # 后端 API 镜像
│   ├── Dockerfile.caddy     # Caddy + 前后端静态镜像
│   └── .env.example
├── caddy/
│   ├── Caddyfile            # 生产（构建进镜像）
│   ├── Caddyfile.dev        # 开发/内网反代
│   └── entrypoint.sh
├── scripts/                 # deploy / build / update / backup-db / smoke-test / ...
├── docs/                    # 部署 / 架构 / API / 开发 / 技术选型 / 变更日志
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 🔒 安全

- `JWT_SECRET` 启动强校验（≥20 位、非默认占位）
- 密码 bcrypt 12 rounds；管理员密码 ≥12 位
- helmet：CSP / HSTS 1y / cross-origin 策略
- 限流：全局 120 req/min，登录 5 req/min
- 请求体 1MB 上限
- 头像上传：MIME + sharp metadata 双重校验，统一 200×200 WebP，≤5MB
- 生产环境禁用 Swagger
- `.env` / `.env.docker` 未纳入版本控制

---

## 🔧 故障排查

| 现象 | 常见原因 | 解决 |
|------|----------|------|
| `homepage-app is unhealthy` → 依赖启动失败 | JWT_SECRET 未配 / 数据库密码不匹配 / 老版本 CMD 路径 bug | `docker logs homepage-app --tail 100`；对照 [deploy-beginner.md](./docs/deploy-beginner.md) 第 10 章 |
| Caddy 起不来 | 80/443 被占用 | `ss -tlnp \| grep -E ':(80\|443)\b'` |
| MariaDB 镜像拉不到 | 国内 Docker Hub 受限 | 配 registry mirror 或改 `MARIADB_IMAGE=` 到清华 / 中科大源 |
| 构建 OOM (exit 137) | 内存 < 2GB | 加 swap 或升配 |
| HTTPS 证书申请失败 | DNS 未生效 / 80 端口不通 / ACME 邮箱空 | 检查 A 记录 + 云安全组，或切 Let's Encrypt |
| 静态文件 404 | Caddy 镜像未包含前端 | 必须**先** build app **再** build caddy |

推倒重来：

```bash
# 保留数据
bash scripts/update.sh

# 连数据一起清
docker compose --env-file .env.docker down -v
rm -f .env.docker
bash scripts/deploy.sh
```

---

## 💾 数据备份

MariaDB 通过 named volume `mariadb_data` 持久化。

```bash
bash scripts/backup-db.sh                # → ./backups/
bash scripts/backup-db.sh /tmp           # 指定目录

# Cron：每天 02:00
0 2 * * * cd /path/to/homepage && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1

# 恢复
gunzip -c ./backups/homepage_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i homepage-db mariadb -u homepage -p'***' homepage
```

---

## 🗺 路由

| URL | 说明 | 需要登录 |
|-----|------|----------|
| `/` | 访客主页 | ❌ |
| `/admin/setup` | 首次初始化向导 | ❌ |
| `/admin/` | 后台登录页 | ❌ |
| `/admin/dashboard` | 仪表盘 | ✅ |
| `/admin/config` | 站点配置 | ✅ |
| `/admin/audit` | 审计日志 | ✅ |
| `/admin/account` | 账号设置 | ✅ |
| `/api/*` | RESTful API | 部分 |
| `/health` | 健康检查 | ❌ |

---

## 📖 文档

完整索引见 [`docs/README.md`](./docs/README.md)。

| 文档 | 说明 |
|------|------|
| [deploy-beginner.md](./docs/deploy-beginner.md) | 零基础 30 分钟上线（含避坑手册） |
| [deployment.md](./docs/deployment.md) | 部署完整参考 |
| [architecture.md](./docs/architecture.md) | 架构设计 |
| [api.md](./docs/api.md) | API 清单 |
| [dev-guide.md](./docs/dev-guide.md) | 开发指南 |
| [technology-selection.md](./docs/technology-selection.md) | 技术选型 |
| [progress.md](./docs/progress.md) | 版本节点与演进 |

每份文档均有 `.md` / `.en.md` 双语版本，`docs/log/` 保存本地联调测试报告。

---

## 🔍 SEO

CSR SPA，`index.html` 内置 `<meta description/keywords>`、Open Graph、Twitter Cards、JSON-LD Person schema。爬虫无法读取 Vue 动态渲染内容 —— 需要 SSR 请自行接入 Nuxt / Prerender。

---

## 🤝 贡献

流程与约定见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)（含 Skill 体系与 AI Agent 说明）。

1. Fork → 创建 `feat/xxx` 分支
2. 提交遵循 [Conventional Commits](https://www.conventionalcommits.org/)
3. `pnpm lint` 通过后开 PR

---

## 📄 许可证

[MIT License](./LICENSE)

---

## 🙏 致谢

- **前端**：Vue 3 · Vite · Pinia · UnoCSS · Ant Design Vue · ECharts · Iconify · VueUse · Axios · Day.js
- **后端**：NestJS · TypeORM · MariaDB / sql.js · Passport · @nestjs/jwt · bcryptjs · class-validator · helmet · @nestjs/throttler · sharp · Multer · Nodemailer · Swagger
- **部署**：Docker · Caddy · ZeroSSL / Let's Encrypt · PM2
- **工程化**：pnpm · TypeScript · ESLint · Prettier · Jest · Supertest · GitHub Actions

如果这个项目对你有帮助，欢迎点一颗 ⭐。
