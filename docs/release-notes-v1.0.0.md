## 概述

v1.0.0 是 Dageling003-Homepage 的首个正式版本，包含完整的个人主页前台、管理后台和 NestJS API 后端。采用 Docker Compose + Caddy 一键部署。

---

## ✨ 功能特性

### 前台主页

- 毛玻璃卡片设计语言 + 暗色/亮色双模式
- 打字机轮播效果
- 快捷链接（grid / row / list 三布局）
- 技术栈图标展示
- 待办清单
- 时段问候 + 实时时钟 + 4 维进度条
- 加载 → 内容流畅过渡动画
- 卡片入场错开动画
- 全套响应式（手机/平板/桌面）

### 管理后台

- 登录页毛玻璃卡片 UI + 光晕动画
- 仪表盘统计卡片
- 配置管理（个人信息/快捷链接/技术栈/ToDo/打字机）
- 表单化编辑（省份选择器、出生日期自动计算年龄星座、头像上传）
- 账号设置（头像上传、邮箱绑定、密码修改）
- 操作日志（分页+筛选）
- 首次使用初始化向导（7 步）
- 多页签系统（右键关闭/关闭其他）
- 面包屑全层级
- 7 套主题色预设
- Ant Design Vue 4 组件库

### 后端 API

- JWT HttpOnly Cookie 鉴权
- bcrypt 密码哈希
- 密码重置（SMTP 邮件或服务器日志降级）
- 限流保护（登录 5 次/分钟）
- Helmet 安全头
- 操作审计日志
- 头像上传（Sharp 压缩为 WebP）
- Swagger 文档（仅开发环境）
- TypeORM + SQLite（默认）/ MariaDB

### 部署

- Docker Compose 一键部署
- Caddy 反向代理（自动 HTTPS、zstd+gzip 压缩、缓存策略）
- 多阶段构建（distroless 运行时，镜像 ~80-120MB）
- 健康检查 + 自动重启
- 资源限制 + 日志轮转
- 数据库备份脚本

---

## ⚙️ 技术栈

| 层 | 技术 |
|---|------|
| 前台 | Vue 3.5 + Vite 8 + UnoCSS + Pinia + Vue Router 4 |
| 后台 | Vue 3.5 + Ant Design Vue 4 + Vite 8 |
| 后端 | NestJS 11 (Express) + TypeORM + Passport JWT |
| 数据库 | SQLite (better-sqlite3) / MariaDB |
| 部署 | Docker Compose + Caddy 2 |
| 包管理 | pnpm 11 monorepo |

---

## 🚀 部署

```bash
cp .env.docker.example .env.docker
# 编辑 .env.docker 填入 JWT_SECRET、DOMAIN、ACME_EMAIL
docker compose up -d --build
```

首次部署后访问 `https://<域名>/admin/setup` 完成初始化向导。

---

## ✅ 验证

- `pnpm build` 三端（frontend / admin / backend）全部构建通过
- Docker Compose 构建 + 启动验证通过
- 健康检查正常
- Caddy 自动 HTTPS 证书签发正常
