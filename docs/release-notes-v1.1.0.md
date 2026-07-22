## 概述

本版本为 v1.0.0 发布后的修复版本，主要解决了发版前审查（release audit）中发现的若干问题，涵盖文档准确性、依赖管理、构建流程和安全配置等方面。

---

## ✨ 项目亮点

### 开箱即用，零门槛上手

- **SQLite 试用模式**：`pnpm install && pnpm dev` 即可起完整前后台三 tab，无需安装任何数据库
- **一键部署 v3**：`bash scripts/deploy.sh` 向导模式（域名 → 邮箱 → SMTP → 管理员），自动 HTTPS（ZeroSSL，国内可用）
- **无 Demo 也能体验**：所有效果截图已提交到 `image/screenshots/`，clone 仓库即可离线预览

### 可视化后台，告别硬编码

- **表单驱动配置**：基于 Ant Design Vue 的表单驱动配置页，所见即所得，不需要懂代码就能管理整站内容
- **拖拽排序**：快捷链接支持拖拽排序，前台自动生效
- **审计日志**：每次配置变更自动落库，可按操作人、时间范围、模块筛选追溯

### 全栈 Monorepo，现代化工程

- **pnpm workspace** 统一管理三端（前台 / 后台 / API），一条命令启动全部服务
- **Vue 3.5 + Vite 8 + UnoCSS + Pinia** — 前台极简流畅
- **NestJS 11 + TypeORM + JWT** — 后端结构清晰、类型安全
- **Docker Compose 三服务**（app / caddy / mariadb），Caddy 提供静态文件服务与自动 HTTPS

### 生产级安全

- **JWT 鉴权**：bcrypt 12 rounds 哈希 + JWT 无状态会话，路由守卫拦截未登录请求
- **helmet 安全头**：CSP、HSTS (max-age: 1年)、crossOrigin 策略
- **API 速率限制**：全局 120 req/min，登录接口 5 req/min
- **SETUP_TOKEN 防护**：自动生成初始化令牌，防止公网部署上线到初始化完成之间的窗口期被抢注管理员
- **头像上传安全**：MIME + sharp metadata 双重验证，仅 `jpg/png/gif/webp`，≤5MB，统一转 200×200 WebP

### 贴心功能

- **首次设置向导**：新部署自动检测未初始化状态，8 步向导（含创建管理员）引导站长完成全站配置
- **找回密码**：支持主流邮箱 SMTP（QQ/163/Gmail/Outlook/阿里/腾讯）；未配 SMTP 时降级写入 docker logs，SSH 即可拾取链接
- **自助创建管理员**：首次部署无需 SSH 改密码，`/admin/setup` 第一步引导用户自设账号密码
- **智能填报**：填入出生日期，系统自动计算年龄与星座；34 省选择器 + 2909 所院校搜索
- **PWA 离线支持**：前端接入 PWA，可离线访问

---

## 📝 文档修复

- **README 克隆路径错误**：`cd homepage` → `cd Dageling003-Homepage`（中英文版共 4 处）
  - 此前用户 clone 后按说明 `cd homepage` 会直接报错目录不存在，现在已修正为正确的仓库名
- **Node.js 版本要求不一致**：`≥20.19.0` → `≥22.13.0`
  - README 徽章和文字描述与 `package.json` 中 `engines.node` 要求统一，避免用户按 README 安装 Node 20 后构建失败
- **Docker 部署路径错误**：`bash deploy.sh` → `bash scripts/deploy.sh`
  - 一键部署章节的路径与「常用命令」章节不一致，现已统一为正确的 `scripts/deploy.sh`
- **域名占位符格式**：中文括号 `【】` → ASCII 写法
  - 避免编码问题，提升终端复制粘贴体验

---

## 🔧 依赖管理

- **vite-plugin-pwa 依赖位置修正**：从根 `package.json` 移至 `apps/frontend/package.json`
  - pnpm workspace 严格隔离模式下，前端子包无法解析根目录的依赖，导致前端构建失败
- **@iconify/json 版本号修正**：`^2.x` → `^2.0.0`
  - `^2.x` 不是合法的 semver 范围语法，可能导致 lockfile 生成异常

---

## 🔒 安全 & 构建

- **SETUP_TOKEN 自动生成**：`deploy.sh` 新增自动生成 `SETUP_TOKEN` 并写入 `.env.docker`
  - 防止公网部署上线到完成初始化之间的窗口期被抢注管理员
  - 此前 `docker/.env.example` 中有此变量说明，但 `deploy.sh` 未自动生成
- **移除 TSC_COMPILE_ON_ERROR**：从 `Dockerfile.app` 移除 `TSC_COMPILE_ON_ERROR=true`
  - 此前 TypeScript 编译错误会被静默跳过，导致 Docker 镜像可能包含未发现的类型错误
  - 移除后构建将严格检查类型安全

---

## ⚙️ 配置优化

- **默认数据库类型**：`apps/backend/.env.example` 中 `DB_TYPE=mariadb` → `DB_TYPE=sqlite`
  - 与 README「快速开始」推荐流程一致，用户复制 `.env.example` 后无需手动修改即可 `pnpm dev`
- **版本号对齐**：根 `package.json` `version: 1.0.0` → `1.1.0`，与 release tag 一致

---

## 🧹 其他

- **deploy.sh 步骤编号**：`5/6` → `5/5`（实际只有 5 步）
- **CONTRIBUTING.md**：Skill 数量 `19` → `18`（与实际清单一致）
- **.gitignore**：移除多余的 `!package-lock.json` 白名单（本项目使用 pnpm）

---

## ✅ 验证

- `pnpm build` 三端（frontend / admin / backend）全部构建成功
- 所有修改已提交并打 tag `v1.1.0`
