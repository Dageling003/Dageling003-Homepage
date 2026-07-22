# 部署指南

<p align="right">
  <strong>简体中文</strong> · <a href="./deployment.en.md">English</a>
</p>

本文档详细介绍 Homepage 项目的部署方式，包括 Docker 快速部署、一键部署、手动部署和本地开发部署。

## 目录

- [前置要求](#前置要求)
- [快速部署（推荐）](#快速部署推荐)
  - [运行快速配置](#运行快速配置)
  - [启动服务](#启动服务)
- [Docker 一键部署](#docker-一键部署)
  - [向导模式](#向导模式)
  - [CI 全自动模式](#ci-全自动模式)
  - [跳过域名询问](#跳过域名询问)
- [手动 Docker 部署](#手动-docker-部署)
  - [配置环境变量](#配置环境变量)
  - [构建镜像](#构建镜像)
  - [首次启动](#首次启动)
  - [后续启动](#后续启动)
- [本地开发部署](#本地开发部署)
  - [安装依赖](#安装依赖)
  - [配置本地环境变量](#配置本地环境变量)
  - [数据库设置](#数据库设置)
  - [启动服务](#启动服务)
- [环境变量配置](#环境变量配置)
  - [必填变量](#必填变量)
  - [可选变量](#可选变量)
  - [SMTP 配置](#smtp-配置)
- [访问地址](#访问地址)
- [常用命令](#常用命令)
  - [Docker 管理命令](#docker-管理命令)
  - [本地开发命令](#本地开发命令)
- [故障排除](#故障排除)
- [数据备份与恢复](#数据备份与恢复)
- [HTTPS 证书配置](#https-证书配置)

---

## 前置要求

### Docker 部署

- **Docker** ≥ 20.10
- **Docker Compose** ≥ 2.0（或 docker-compose v1）
- **Bash** 环境（Windows 用户需使用 WSL2 或 Git Bash）

### 本地开发

- **Node.js** ≥ 20.19.0
- **pnpm** ≥ 11.0.0
- **MariaDB** ≥ 10.5

---

## 快速部署（推荐）

最简单的部署方式，只需两步：

### 运行快速配置

```bash
# 克隆项目
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage

# 运行快速配置向导
bash scripts/setup.sh
```

向导会询问：
1. **域名或 IP** - 输入服务器 IP（如 `192.168.1.100`）或域名
2. **管理员密码** - 自动生成/手动设置/留空网页创建
3. **SMTP 邮件** - 可选，不配置也能用（找回密码链接输出到日志）

配置完成后自动生成 `.env.docker` 文件。

### 启动服务

```bash
# 一键构建并启动
docker compose --env-file .env.docker up -d --build
```

### 访问网站

| 入口 | 地址 |
|------|------|
| 网站主页 | `http://your-domain-or-ip/` |
| 管理后台 | `http://your-domain-or-ip/admin/` |
| 首次初始化 | `http://your-domain-or-ip/admin/setup` |

---

## Docker 一键部署

项目提供 `scripts/deploy.sh` 脚本，支持三种部署模式。

### 向导模式

交互式引导，逐一询问关键配置：

```bash
bash scripts/deploy.sh
```

脚本将引导你完成以下步骤：

1. **环境检查**：验证 Docker 和 Docker Compose 是否安装
2. **域名配置**：输入域名或 IP 地址
3. **HTTPS 证书邮箱**：用于申请 SSL 证书（真实域名需要，IP 可留空）
4. **邮件通知 (SMTP)**：可选，支持 QQ/163/Gmail 等主流邮箱
5. **管理员账号**：可选自动生成/自定义/留空网页端创建

### CI 全自动模式

零交互部署，适用于 CI/CD 环境：

```bash
CI=true bash scripts/deploy.sh
```

所有配置使用默认值或环境变量，无需手动输入。

### 跳过域名询问

如果已通过环境变量设置域名，可跳过域名交互：

```bash
DOMAIN=your-domain.com bash scripts/deploy.sh
```

其余配置仍以交互方式询问。

---

## 手动 Docker 部署

如需更精细的控制，可手动完成部署步骤。

### 配置环境变量

1. 复制环境变量模板：

```bash
cp docker/.env.example .env.docker
```

2. 编辑 `.env.docker` 文件，填入以下必要配置：

```bash
# 域名或 IP（必填）
DOMAIN=your-domain-or-ip

# JWT 密钥（必填，至少 20 位）
JWT_SECRET=your-strong-random-secret

# 数据库密码（必填）
DB_ROOT_PASSWORD=your-db-root-password
DB_USERNAME=homepage
DB_PASSWORD=your-db-password
DB_DATABASE=homepage

# 管理员密码（可选，留空则通过网页创建）
DEFAULT_ADMIN_PASSWORD=
```

### 构建镜像

构建顺序很重要：必须先构建 `app` 镜像，再构建 `caddy` 镜像（caddy 从 app 镜像提取静态文件）：

```bash
# 构建后端 API 镜像
docker compose --env-file .env.docker build app

# 构建 Caddy + 静态文件镜像
docker compose --env-file .env.docker build caddy
```

### 网络架构

Docker Compose 使用两个隔离网络增强安全性：

| 网络 | 连接的服务 | 说明 |
|------|-----------|------|
| `frontend` | caddy, app | Caddy 反向代理 API 请求到 App |
| `backend` | app, mariadb | App 连接数据库 |

> **安全优势**：MariaDB 仅在 `backend` 网络中，不直接暴露到 `frontend`，即使 Caddy 被攻破也无法直接访问数据库。

### 健康检查

所有服务均配置了健康检查，确保依赖服务就绪后才启动：

| 服务 | 健康检查方式 | 间隔 |
|------|-------------|------|
| `mariadb` | `mariadb-admin ping` | 10s |
| `app` | HTTP 请求 `/health` 端点 | 30s |
| `caddy` | `caddy validate --config` | 30s |

`depends_on` 使用 `condition: service_healthy` 确保启动顺序：
1. MariaDB 就绪 → App 启动
2. App 就绪 → Caddy 启动

### 首次启动

首次启动需要执行数据库迁移：

```bash
# 1. 启动数据库
docker compose --env-file .env.docker up -d homepage-db

# 2. 等待数据库就绪（约 10 秒）
sleep 10

# 3. 执行数据库迁移
docker compose --env-file .env.docker run --rm app \
  npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:run \
  -d data-source.ts

# 4. 启动所有服务
docker compose --env-file .env.docker up -d
```

### 后续启动

数据库表已存在时，直接启动服务：

```bash
docker compose --env-file .env.docker up -d
```

---

## 本地开发部署

适用于本地开发和调试。

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage

# 安装依赖
pnpm install
```

### 配置本地环境变量

1. 复制环境变量模板：

```bash
cp apps/backend/.env.example apps/backend/.env
```

2. 编辑 `apps/backend/.env`，修改以下配置：

```bash
# JWT 密钥（至少 20 位）
JWT_SECRET=your-dev-secret

# 默认管理员密码（至少 12 位）
DEFAULT_ADMIN_PASSWORD=your-admin-password

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=homepage
DB_PASSWORD=your-db-password
DB_DATABASE=homepage
```

### 数据库设置

1. 创建数据库：

```bash
mysql -u root -p -e "CREATE DATABASE \`homepage\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. 运行数据库迁移：

```bash
pnpm migrate:run
```

### 启动服务

```bash
# 一键启动所有服务
pnpm dev
```

启动后访问：

| 服务 | 地址 |
|------|------|
| 网站主页 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| API 文档 | http://localhost:8000/api/docs |

---

## 环境变量配置

### 必填变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DOMAIN` | 域名或 IP 地址 | `example.com` 或 `192.168.1.100` |
| `JWT_SECRET` | JWT 密钥（≥20位） | `openssl rand -base64 32` 生成 |
| `DB_ROOT_PASSWORD` | 数据库 root 密码 | `openssl rand -base64 20` 生成 |
| `DB_USERNAME` | 数据库用户名 | `homepage` |
| `DB_PASSWORD` | 数据库用户密码 | `openssl rand -base64 20` 生成 |
| `DB_DATABASE` | 数据库名 | `homepage` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEFAULT_ADMIN_PASSWORD` | 默认管理员密码 | 留空（通过网页创建） |
| `ACME_CA` | HTTPS 证书颁发机构 | `https://acme.zerossl.com/v2/DV90` |
| `ACME_EMAIL` | HTTPS 证书邮箱 | 留空（自动生成） |
| `DB_SYNCHRONIZE` | 自动同步 Schema | `false`（生产环境必须为 false） |
| `PUBLIC_ADMIN_URL` | 找回密码链接根 URL | 从 DOMAIN 推断 |

### SMTP 配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SMTP_HOST` | SMTP 服务器 | `smtp.qq.com` |
| `SMTP_PORT` | SMTP 端口 | `465` |
| `SMTP_SECURE` | 是否启用 SSL | `true` |
| `SMTP_USER` | 发件人邮箱 | `noreply@example.com` |
| `SMTP_PASS` | SMTP 授权码 | QQ/163 需使用授权码 |
| `SMTP_FROM` | 发件人名称 | `Homepage <noreply@example.com>` |

**主流邮箱 SMTP 配置**：

| 邮箱 | SMTP 服务器 | 端口 | SSL |
|------|-------------|------|-----|
| QQ 邮箱 | smtp.qq.com | 465 | 是 |
| 163 邮箱 | smtp.163.com | 465 | 是 |
| Gmail | smtp.gmail.com | 465 | 是 |
| Outlook | smtp.office365.com | 587 | 否 |

> **注意**：QQ/163 邮箱需使用授权码，非登录密码。

---

## 访问地址

### Docker 部署

| 服务 | 地址 |
|------|------|
| 网站主页 | `http(s)://your-domain/` |
| 管理后台 | `http(s)://your-domain/admin/` |
| 首次初始化 | `http(s)://your-domain/admin/setup` |
| 找回密码 | `http(s)://your-domain/admin/forgot-password` |
| API 接口 | `http(s)://your-domain/api/` |
| 健康检查 | `http(s)://your-domain/health` |

### 本地开发

| 服务 | 地址 |
|------|------|
| 网站主页 | http://localhost:3000 |
| 管理后台 | http://localhost:3001 |
| API 文档 | http://localhost:8000/api/docs |

---

## 常用命令

### Docker 管理命令

```bash
# 查看服务状态
docker compose --env-file .env.docker ps

# 查看实时日志
docker compose --env-file .env.docker logs -f

# 查看特定服务日志
docker compose --env-file .env.docker logs -f caddy    # Caddy 日志
docker compose --env-file .env.docker logs -f app      # 后端日志

# 停止所有服务
docker compose --env-file .env.docker down

# 重启服务
docker compose --env-file .env.docker restart

# 启动服务
docker compose --env-file .env.docker up -d

# 重新构建并启动
docker compose --env-file .env.docker up -d --build
```

### 本地开发命令

```bash
# 并行启动所有服务
pnpm dev

# 仅启动后端
pnpm dev:backend

# 仅启动前台主页
pnpm dev:frontend

# 仅启动管理后台
pnpm dev:admin

# 构建全部
pnpm build

# 代码检查
pnpm lint

# 格式化代码
pnpm format
```

---

## 故障排除

### 1. Docker 镜像构建失败

**问题**：`docker compose build` 失败

**解决方案**：
```bash
# 确保先构建 app，再构建 caddy
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker build caddy
```

### 2. MariaDB 镜像拉取失败

**问题**：`pull access denied for mariadb:11.4` 或 `failed to resolve reference`

**原因**：Docker Hub 在国内访问受限

**解决方案**：

项目默认使用 `docker.1ms.run` 镜像加速器。如果仍然失败，可手动配置：

```bash
# 方案1: 配置 Docker 镜像加速器（推荐）
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# 方案2: 在 .env.docker 中切换镜像源
# 清华大学镜像
MARIADB_IMAGE=mirrors.tuna.tsinghua.edu.cn/library/mariadb:11.4

# 中科大镜像
MARIADB_IMAGE=mirrors.ustc.edu.cn/library/mariadb:11.4

# Docker Hub 官方（需网络通畅）
MARIADB_IMAGE=mariadb:11.4
```

### 3. 数据库连接失败

**问题**：后端无法连接数据库

**解决方案**：
- 检查数据库服务是否正常运行：`docker compose --env-file .env.docker ps`
- 查看数据库日志：`docker compose --env-file .env.docker logs homepage-db`
- 确认环境变量配置正确：`DB_ROOT_PASSWORD`、`DB_USERNAME`、`DB_PASSWORD`

### 4. 端口被占用

**问题**：端口 80 或 443 已被占用

**解决方案**：
```bash
# 查看端口占用情况
netstat -tlnp | grep -E ':(80|443)'

# 停止占用端口的服务，或修改 docker-compose.yml 中的端口映射
```

### 5. Caddy 证书申请失败

**问题**：HTTPS 证书申请失败

**解决方案**：
- 确认域名已正确解析到服务器 IP
- 检查 `ACME_EMAIL` 是否配置
- 尝试切换证书颁发机构：在 `.env.docker` 中设置 `ACME_CA=https://acme-v02.api.letsencrypt.org/directory`

### 6. Windows 用户无法运行 deploy.sh

**问题**：提示找不到 bash 或脚本执行失败

**解决方案**：
- 安装 [WSL2](https://learn.microsoft.com/windows/wsl/install) 并使用 WSL 终端
- 或安装 [Git Bash](https://git-scm.com/downloads) 并使用 Git Bash 终端

### 7. 首次部署后无法访问管理后台

**问题**：访问管理后台显示空白页

**解决方案**：
- 如果 `DEFAULT_ADMIN_PASSWORD` 留空，需先访问 `/admin/setup` 创建管理员账号
- 检查浏览器控制台是否有错误信息

---

## 数据备份与恢复

### 手动备份

```bash
# 备份到当前目录的 backups 文件夹
bash scripts/backup-db.sh

# 指定输出目录
bash scripts/backup-db.sh /tmp
```

### 自动备份（Cron）

```bash
# 每天凌晨 2 点自动备份，保留最近 7 天
0 2 * * * cd /path/to/Dageling003-Homepage && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1
```

### 恢复数据

```bash
gunzip -c ./backups/homepage_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i homepage-db mariadb -u homepage -p'your-password' homepage
```

---

## HTTPS 证书配置

### ZeroSSL vs Let's Encrypt

| 特性 | ZeroSSL | Let's Encrypt |
|------|---------|---------------|
| 国内访问 | ✅ 正常 | ❌ 可能被墙 |
| 免费额度 | ✅ 有 | ✅ 完全免费 |
| 证书有效期 | 90 天 | 90 天 |
| 自动续签 | ✅ Caddy 内置 | ✅ Caddy 内置 |

**推荐**：国内部署选择 ZeroSSL（默认），海外可选 Let's Encrypt。

切换证书颁发机构：

```bash
# 在 .env.docker 中设置
ACME_CA=https://acme.zerossl.com/v2/DV90          # ZeroSSL（默认）
ACME_CA=https://acme-v02.api.letsencrypt.org/directory  # Let's Encrypt
```

---

## 安全加固

### 依赖安全

项目定期审计并修复高危漏洞：

| 依赖 | 漏洞 | 修复方式 |
|------|------|----------|
| `form-data` | CRLF injection | override → >=4.0.6 |
| `multer` | DoS via nested field names | override → >=2.2.0 |
| `nodemailer` | SSRF/file read | 升级 → ^9.0.1 |

运行 `pnpm audit --registry https://registry.npmjs.org` 可检查当前安全状态。

### 网络隔离

Docker Compose 使用两个独立网络：

- **frontend**：Caddy 和 App 通信
- **backend**：App 和 MariaDB 通信

MariaDB 不暴露到 frontend 网络，即使 Caddy 被攻破也无法直接访问数据库。

---

## 初始设置向导

首次部署后，访问 `http(s)://your-domain/admin/setup` 完成全站初始化：

1. **创建管理员账号**（如果未在 `.env.docker` 中设置密码）
2. **设置网站标题**：浏览器标签页显示的标题（如「鹊楠的个人主页」）
3. **填写个人信息**：姓名、性别、出生日期、省份、学校、职业标签
4. **配置快捷链接**：添加常用网站链接（博客/GitHub/B站/邮箱）
5. **设置技术栈**：展示掌握的技术（自动匹配彩色图标）
6. **配置打字机文字**：首页轮播的欢迎语
7. **设置待办事项**：展示计划列表
8. **完成初始化**：系统自动保存配置

> 每步点击「下一步」保存，末步点击「完成设置」。

初始化完成后，使用创建的账号登录管理后台 `http(s)://your-domain/admin/`。

---

## 常见问题

### Q: 数据库密码忘了怎么办？

A: 修改 `.env.docker` 中的密码，然后重启服务：

```bash
docker compose --env-file .env.docker down
# 编辑 .env.docker 修改密码
docker compose --env-file .env.docker up -d
```

### Q: 如何修改管理员密码？

A: 登录管理后台，进入「账号设置」修改密码。

### Q: 如何更新项目版本？

A: 拉取最新代码后重新构建：

```bash
git pull
docker compose --env-file .env.docker up -d --build
```

### Q: 如何查看找回密码链接？

A: 如果未配置 SMTP，找回密码链接会写入 docker logs：

```bash
docker logs homepage-app 2>&1 | grep -A 6 '密码重置请求'
```

---

## 相关文档

- [架构设计](./architecture.md)
- [API 文档](./api.md)
- [开发指南](./dev-guide.md)
- [技术选型](./technology-selection.md)
