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
- [镜像源与国内加速](#镜像源与国内加速)
  - [三类基础镜像](#三类基础镜像)
  - [docker.1ms.run 的边界](#docker1msrun-的边界)
  - [RUNTIME_IMAGE 兜底策略](#runtime_image-兜底策略)
  - [Docker daemon 全局镜像加速器](#docker-daemon-全局镜像加速器)
- [项目更新](#项目更新)
  - [update.sh 一键更新（推荐）](#updatesh-一键更新推荐)
  - [update.sh 每一步在做什么](#updatesh-每一步在做什么)
  - [手动更新](#手动更新)
  - [更新失败怎么办](#更新失败怎么办)
  - [回滚到旧版本](#回滚到旧版本)
  - [升级前建议做的准备](#升级前建议做的准备)
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

## 镜像源与国内加速

国内服务器拉 Docker Hub / gcr.io 常见慢、断、404。本节说明本项目**三类基础镜像**的来源、边界和兜底策略，帮你把镜像问题一次配对。

### 三类基础镜像

| 变量 | 默认值 | 来源 registry | 用途 |
|------|--------|---------------|------|
| `BUILDER_IMAGE` | `node:22-slim` | Docker Hub (`library/node`) | 构建阶段：装 pnpm、拉依赖、编译前后端 |
| `RUNTIME_IMAGE` | `gcr.io/distroless/nodejs22-debian12` | Google GCR（**非 Docker Hub**） | 运行阶段：只跑 `dist/main.js`，比 slim 再小一半 |
| `MARIADB_IMAGE` | `docker.1ms.run/library/mariadb:11.4` | Docker Hub 镜像加速器 | 数据库容器 |

所有变量都在 `.env.docker` 里可覆盖。

### docker.1ms.run 的边界

`docker.1ms.run` 是**只代理 Docker Hub** 的国内镜像加速器，路径映射规则：

| 原始镜像 | docker.1ms.run 对应路径 | 是否可用 |
|----------|------------------------|----------|
| `node:22-slim`（= `library/node:22-slim`） | `docker.1ms.run/library/node:22-slim` | ✅ |
| `mariadb:11.4`（= `library/mariadb:11.4`） | `docker.1ms.run/library/mariadb:11.4` | ✅ |
| `gcr.io/distroless/nodejs22-debian12` | `docker.1ms.run/gcr.io/distroless/nodejs22-debian12` | ❌ **not found** |

> **关键点**：`docker.1ms.run` 只代理 Docker Hub 的 `library/*` 和 `<user>/*`，**不代理 gcr.io / quay.io / mcr.microsoft.com 等第三方 registry**。别再手动拼 `docker.1ms.run/gcr.io/...` 这种路径，一定 404。

### RUNTIME_IMAGE 兜底策略

如果服务器直连 `gcr.io` 慢或超时，按下面顺序**逐档试**，直到 `docker compose build app` 通过：

**方案 1：直连 gcr.io（不设 RUNTIME_IMAGE）**

大多数海外节点 + 部分国内云厂商（腾讯云 / 华为云香港节点）直连 gcr.io 是通的。**先把 `.env.docker` 里 `RUNTIME_IMAGE=` 那一行删掉或留空**，让 Dockerfile 走默认值：

```bash
sed -i '/^RUNTIME_IMAGE/d' .env.docker
bash scripts/update.sh
```

**方案 2：改用 node:22-slim 作为 runtime**（推荐给纯国内节点）

放弃 distroless，用 slim 版本，镜像体积会从 ~120MB 涨到 ~200MB，但 slim 走 Docker Hub 镜像加速器 100% 能拉到：

```bash
sed -i '/^RUNTIME_IMAGE/d' .env.docker
echo 'RUNTIME_IMAGE=docker.1ms.run/library/node:22-slim' >> .env.docker
bash scripts/update.sh
```

> ⚠️ 切到 `node:22-slim` 之后，`Dockerfile.app` 里的 `HEALTHCHECK` 走 `/nodejs/bin/node`（distroless 专用路径），slim 下要改成 `/usr/local/bin/node` 才能过健康检查。**目前工程默认按 distroless 写死**，如果你切了 slim，可能会看到 app 一直 `unhealthy`；解决方案是编辑 `docker/Dockerfile.app` 把 healthcheck 里的 `/nodejs/bin/node` 换成 `node` 或 `/usr/local/bin/node`。

**方案 3：切到公共 gcr.io 镜像站**

社区维护的 gcr.io 镜像站不稳定，命中率低，只在方案 1 / 2 都不适用时再试：

```bash
# USTC（时通时断）
echo 'RUNTIME_IMAGE=gcr.mirrors.ustc.edu.cn/distroless/nodejs22-debian12' >> .env.docker

# lank.cc（第三方，非官方，用之前 ping 一下）
echo 'RUNTIME_IMAGE=k8s.dockerproxy.com/distroless/nodejs22-debian12' >> .env.docker
```

如果 `dial tcp: lookup xxx: no such host`，就是这个镜像站 DNS 都解析不了，直接放弃换方案。

### Docker daemon 全局镜像加速器

上面是**逐个变量**指定镜像源，也可以在 daemon 层一次配好，让所有 `pull` 都自动走加速：

```bash
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me",
    "https://dockerproxy.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

配了 daemon 镜像加速后，`.env.docker` 里的 `BUILDER_IMAGE` / `MARIADB_IMAGE` 可以留空使用默认值（Docker 会自动走镜像列表）。但 **gcr.io 仍然走不了 daemon 镜像加速**（daemon mirror 只对 Docker Hub 生效），gcr.io 的坑仍要按上面"RUNTIME_IMAGE 兜底策略"处理。

---

## 项目更新

日常运维最常做的操作：把服务器上的部署更新到 GitHub 最新版本，同时**保留数据库 / 上传文件 / 证书**。项目在 `scripts/update.sh` 里封装了一键流程。

### update.sh 一键更新（推荐）

在项目根目录（`.env.docker` 所在目录）执行：

```bash
bash scripts/update.sh
```

正常输出（成功场景）：

```
==> 1. 拉取最新代码...
Already up to date.
==> 2. 重新构建 app 镜像...
[+] Building 87.3s (16/16) FINISHED
==> 3. 重新构建 caddy 镜像...
[+] Building 4.2s (10/10) FINISHED
==> 4. 重启容器...
 ✔ Container homepage-db     Healthy
 ✔ Container homepage-app    Healthy
 ✔ Container homepage-caddy  Started
==> 5. 等待服务就绪...
==> 6. 运行冒烟测试...
  ✔ 主页 200
  ✔ 管理后台 200
  ✔ API /health 200
==> 7. 清理旧镜像...
==> ✅ 更新完成！
```

> ⚠️ **升级会重建 app / caddy 容器**，但因为业务数据全部放在 named volume（`mariadb_data` / `app_uploads` / `caddy_data`），数据不会丢。

### update.sh 每一步在做什么

| 步骤 | 命令 | 作用 | 什么情况会失败 |
|------|------|------|----------------|
| 1. 拉取代码 | `git pull origin main` | 从 GitHub 更新到 main 最新 commit | 网络不通 / 本地有未提交改动冲突 |
| 2. 构建 app | `docker compose --env-file .env.docker build app` | 基于最新代码 + 最新 base image 重建后端镜像 | 镜像源拉不到（gcr.io / docker hub 挂）/ 服务器内存不够 |
| 3. 构建 caddy | `docker compose --env-file .env.docker build caddy` | 从新的 app 镜像里提取前端静态文件，打进 caddy 镜像 | 上一步 app 没成功产出 `homepage-app:latest` |
| 4. 重启容器 | `docker compose --env-file .env.docker up -d` | 用新镜像滚动替换旧容器；未变的服务不会重启 | 端口冲突 / healthcheck 一直失败 |
| 5. 等待就绪 | `sleep 10` | 给 app 一点点时间跑数据库 migration + 启动 | — |
| 6. 冒烟测试 | `bash scripts/smoke-test.sh localhost` | curl 主页 / 后台 / `/api/health` 看是否返回 200 | 服务没起来 / DOMAIN 配错导致 Caddy 反代 502 |
| 7. 清理旧镜像 | `docker image prune -f` | 删掉本次 build 出来的 dangling `<none>` 镜像 | — |

**关键设计点**：

- **顺序不能颠倒** —— caddy 镜像 `FROM homepage-app:latest` 提取静态文件，必须先 build app
- **不 down** —— 用 `up -d` 做滚动替换，尽量减少停机时间（几秒）
- **不动数据卷** —— 只重建容器，`mariadb_data` / `app_uploads` / `caddy_data` 保持不动
- **不改 `.env.docker`** —— 环境变量保留，不会覆盖你的配置

### 手动更新

如果你想自己控制每一步，或者 update.sh 卡在某一步：

```bash
# 1. 拉代码
git pull origin main

# 2. 先 app 再 caddy（顺序不能反）
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker build caddy

# 3. 滚动替换
docker compose --env-file .env.docker up -d

# 4. 查状态
docker compose --env-file .env.docker ps
docker logs homepage-app --tail 50
```

如果新版本包含**数据库结构变更**（release notes 会明确说明），代码里 migration 会在 app 启动时自动执行（前提是 `.env.docker` 里 `DB_MIGRATIONS_RUN=true` 或该 release 的 migration 已随镜像固化）。

### 更新失败怎么办

**第 1 步 `git pull` 报冲突**

```
error: Your local changes to the following files would be overwritten by merge
```

服务器上有人手改过 `.env.docker` 以外的代码文件（比如临时改了 Caddyfile 调参数）。要么先 commit / stash，要么 reset：

```bash
git status                 # 看改了什么
git stash                  # 暂存改动
git pull origin main
git stash pop              # 需要时恢复
# 或者直接丢弃：
# git checkout .
```

**第 2/3 步构建失败**

- 镜像拉不到 → 查上一节"镜像源与国内加速"
- `exit 137` / 构建被 kill → 服务器内存不足，加 swap（见 deploy-beginner.md 10.5）或临时停掉 mariadb 腾内存：
  ```bash
  docker compose --env-file .env.docker stop app caddy
  bash scripts/update.sh
  ```

**第 4 步容器起不来 / 一直 unhealthy**

```bash
docker compose --env-file .env.docker ps
docker logs homepage-app --tail 100
docker logs homepage-caddy --tail 100
```

按报错定位（多数是配置变更导致，如新版本引入了新的必填环境变量）。查看该版本的 [release notes](../CHANGELOG.md)。

**第 6 步冒烟测试失败但服务实际起来了**

冒烟脚本用 `localhost` 探测，如果你把 Caddy 绑到了别的 IP 或使用了非标准端口，脚本会误报失败。手动验证：

```bash
curl -I http://localhost/                     # 应返回 200
curl -I http://localhost/admin/               # 应返回 200
curl -s  http://localhost/api/health          # 应返回 {"status":"ok"}
```

### 回滚到旧版本

如果新版本有问题需要回退：

```bash
# 1. 查看最近的 commit
git log --oneline -10

# 2. 回退代码到指定 commit（不动数据卷）
git reset --hard <commit-hash>

# 3. 重新构建
bash scripts/update.sh
```

如果新版本引入了**破坏性数据库变更**（migration 里 dropped column / altered table），单纯回退代码不够，还需要恢复数据库备份 —— 这就是为什么强烈建议**升级前先备份**。

### 升级前建议做的准备

生产环境推荐工作流：

```bash
# 1. 备份数据库
bash scripts/backup-db.sh

# 2. 记下当前版本（回滚用）
git rev-parse HEAD > .last-version

# 3. 查 CHANGELOG 看新版有没有破坏性变更
git fetch origin main
git log HEAD..origin/main --oneline

# 4. 执行更新
bash scripts/update.sh

# 5. 验证功能
curl -I http://your-domain/
curl -I http://your-domain/admin/
```

日常小版本升级可以直接 `bash scripts/update.sh` 一步走完。

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

### 2. MariaDB / Node / gcr.io 镜像拉取失败

**问题**：`pull access denied`、`failed to resolve reference`、`not found` 或 DNS `no such host`

**先判断是哪一类镜像拉不下来**：

| 报错关键字 | 涉及镜像 | 处理章节 |
|-----------|---------|---------|
| `library/mariadb` / `library/node` | Docker Hub 类 | 下方"Docker Hub 类" |
| `gcr.io/distroless/...` 或 `docker.1ms.run/gcr.io/...` | gcr.io 类 | 上文 [RUNTIME_IMAGE 兜底策略](#runtime_image-兜底策略) |
| `dial tcp: lookup xxx: no such host` | 镜像站 DNS 挂了 | 换镜像站或加 `1.1.1.1` DNS |

**Docker Hub 类**（`mariadb` / `node`）：

项目默认使用 `docker.1ms.run` 镜像加速器。仍然失败时可手动配置：

```bash
# 方案1: 配置 Docker 镜像加速器（推荐，一次配好全局生效）
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

**gcr.io 类**（`distroless/nodejs22-debian12`）：

> ⚠️ **常见误区**：把 `docker.1ms.run/gcr.io/distroless/nodejs22-debian12` 塞给 `RUNTIME_IMAGE` 会报 `not found`。`docker.1ms.run` **不代理** gcr.io。详细策略见 [RUNTIME_IMAGE 兜底策略](#runtime_image-兜底策略)。

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

A: 见上文 [项目更新](#项目更新) 章节。日常最简：

```bash
bash scripts/update.sh
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
