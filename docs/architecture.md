# Dageling003-Homepage 技术架构文档

> 最后更新：2026/06/06

---

## 一、项目概述

Dageling003-Homepage 是一个全栈前后端分离的首页管理系统，包含三个子系统：

| 子系统 | 路径 | 端口 | 技术栈 |
|--------|------|------|--------|
| **前台主页** | `apps/frontend` | 3000 | Vue 3 + Vite + UnoCSS |
| **管理后台** | `apps/admin` | 3001 | Vue 3 + Ant Design Vue + UnoCSS |
| **后端 API** | `apps/backend` | 8000 | NestJS + TypeORM + MariaDB |

---

## 二、整体架构图

```
┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │    Admin        │
│  localhost:3000 │      │  localhost:3001 │
│                 │      │                 │
│  Vue 3 + Vite   │      │  Ant Design Vue  │
│  UnoCSS         │      │  Vue 3 + Vite   │
└───────┬─────────┘      └───────┬─────────┘
        │                        │
        │    /api/* (代理)        │    /api/* (代理)
        └───────────┬────────────┘
                    │
        ┌───────────▼──────────┐
        │    Backend (NestJS)   │
        │    localhost:8000     │
        │                       │
        │  AuthModule           │
        │  SiteConfigModule     │
        │  TypeORM ↔ MariaDB    │
        └───────────────────────┘
```

---

## 三、项目结构

```tree
Dageling003-Homepage/
├── apps/
│   ├── frontend/                  # 前台主页
│   │   └── src/
│   │       ├── api/               # HTTP 请求封装
│   │       ├── router/            # 路由（单页）
│   │       ├── stores/            # Pinia 状态管理
│   │       ├── types/             # TypeScript 类型
│   │       └── views/             # 页面组件
│   │
│   ├── admin/                     # 管理后台
│   │   └── src/
│   │       ├── api/               # HTTP 请求封装
│   │       ├── layouts/           # 布局组件
│   │       ├── router/            # 路由（登录守卫）
│   │       ├── stores/            # Pinia 状态管理
│   │       └── views/             # 页面
│   │           ├── login/         # 登录页
│   │           ├── dashboard/     # 仪表盘
│   │           └── config/        # 配置管理 CRUD
│   │
│   └── backend/                   # 后端 API
│       └── src/
│           ├── auth/              # 登录认证模块
│           │   ├── dto/           # 请求/响应 DTO
│           │   ├── jwt.strategy   # JWT 策略
│           │   └── jwt-auth.guard # 认证守卫
│           ├── config/            # 配置管理模块
│           │   ├── dto/           # 请求 DTO
│           │   └── entities/      # 数据库实体
│           └── users/             # 用户实体
│
├── docs/                          # 项目文档
├── package.json                   # 根 package（workspace）
├── pnpm-workspace.yaml            # pnpm workspace 配置
└── tsconfig.base.json             # 公共 TS 配置
```

---

## 四、技术选型

### 前端（前台 + 后台）

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Vue 3 | ^3.5.13 | Composition API |
| 语言 | TypeScript | ~6.0 | 强类型 |
| 构建 | Vite | ^8.0 | 极速构建 |
| CSS | UnoCSS | ^66.7 | 原子化 CSS |
| 路由 | Vue Router | ^4.5 | SPA 路由 |
| 状态 | Pinia | ^2.3 | 轻量状态管理 |
| HTTP | Axios | ^1.7 | API 请求 |
| 图标 | @iconify/vue | 5.0 | SVG 图标 |
| UI | Ant Design Vue | ^4.2 | 后台组件库（仅 admin） |

### 后端

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | NestJS | ^11.0 | 企业级 Node 框架 |
| ORM | TypeORM | ^0.3 | 数据库映射 |
| 数据库 | MariaDB | 11.4 LTS | 关系型数据库 |
| 鉴权 | Passport + JWT | - | Token 认证 |
| 文档 | Swagger | - | 自动生成 API 文档 |

---

## 五、数据流

### 认证流程

```
客户端                  服务端
  │                      │
  │  POST /api/auth/login│
  │  {username, password}│
  │─────→               │ 验证密码
  │                      │ 生成 JWT
  │←────                │
  │  {accessToken}       │
  │                      │
  │  后续请求带 Token    │
  │  Authorization: Bearer xxx
  │─────→               │ JwtAuthGuard 验证
  │                      │ 返回数据
```

### 数据模型

```sql
-- 用户表
users:
  id            INT PK AUTO_INCREMENT
  username      VARCHAR(50) UNIQUE
  password      VARCHAR(255) (bcrypt 加密)
  role          VARCHAR(10) DEFAULT 'admin'
  theme         VARCHAR(10) DEFAULT 'light'
  created_at    DATETIME
  updated_at    DATETIME

-- 站点配置表
site_config:
  id            INT PK AUTO_INCREMENT
  config_key    VARCHAR(50) UNIQUE
  config_value  TEXT
  created_at    DATETIME
  updated_at    DATETIME
```

---

## 六、开发环境要求

| 工具 | 版本 | 检查命令 |
|------|------|---------|
| Node.js | >=20.19.0 | `node -v` |
| pnpm | >=11.0.0 | `pnpm -v` |
| Git | 最新 | `git -v` |
