# homepage全栈技术栈详细清单

***

## 一、环境基线（必须严格匹配）

| 工具          | 版本                         | 说明                 |
| ----------- | -------------------------- | ------------------ |
| **Node.js** | **v24.16.0 (LTS Krypton)** | 长期支持版，兼容所有依赖       |
| **pnpm**    | **11.5.2**                 | 包管理器（Workspace 模式） |
| **Git**     | 最新版                        | 版本控制               |

### pnpm 11 关键配置

**根目录** **`.npmrc`（仅保留 registry）**

```
registry=https://registry.npmmirror.com
```

**根目录** **`pnpm-workspace.yaml`**

```
packages:
  - "apps/frontend"    # 前台主页
  - "apps/admin"       # 中后台管理
  - "apps/backend"     # API 服务

# pnpm 11 配置（原 .npmrc 中的非 auth 配置迁移至此）
nodeLinker: hoisted
shamefullyHoist: true
autoInstallPeers: true
minimumReleaseAge: 0

allowBuilds:
  esbuild: true
  sharp: true
```

***

## 二、前端技术栈（前台主页）

**路径**：`apps/frontend`

**目标**：极简展示型页面，对标 `quenan.cn`

| 类别           | 技术           | 版本          | 说明                 |
| ------------ | ------------ | ----------- | ------------------ |
| **框架**       | Vue          | `^3.5.13`   | Composition API    |
| **语言**       | TypeScript   | `^5.6.3`    | 强类型支持              |
| **构建工具**     | Vite         | `^8.0.12`   | ≥8，极速热更新           |
| **CSS 引擎**   | UnoCSS       | `^66.7.0`   | 原子化 CSS，主题驱动       |
| **路由**       | Vue Router   | `^4.5.0`    | SPA 路由管理           |
| **状态管理**     | Pinia        | `^2.3.1`    | 轻量 Store（主题/进度条状态） |
| **HTTP 客户端** | Axios        | `^1.7.9`    | API 请求封装           |
| **图标库**      | @iconify/vue | **`5.0.0`** | SVG 图标系统（按需加载 + 40+ 技术品牌彩色图标映射） |
| **工具库**      | @vueuse/core | `^12.0.0`   | 组合式工具函数（时间计算等）     |
| **代码规范**     | ESLint       | `^9.17.0`   | 代码检查               |
| **格式化**      | Prettier     | `^3.4.2`    | 统一代码风格             |

### 前台 `package.json` 核心依赖

```
{
  "name": "homepage-frontend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "pinia": "^2.3.1",
    "axios": "^1.7.9",
    "@iconify/vue": "5.0.0",
    "@vueuse/core": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vite": "^8.0.12",
    "@vitejs/plugin-vue": "^6.0.6",
    "unocss": "^66.7.0",
    "eslint": "^9.17.0",
    "prettier": "^3.4.2"
  },
  "engines": {
    "node": ">=20.19.0"
  }
}
```

***

## 三、中后台技术栈（Ant Design Vue）

**路径**：`apps/admin`

**目标**：企业级后台管理系统，5 个子菜单管理站点配置

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **UI 框架** | Ant Design Vue | `^4.2.6` | 企业级 Vue 3 组件库 |
| **图标** | @ant-design/icons-vue | `^7.0.1` | Ant Design 图标集 |
| **框架** | Vue | `^3.5.13` | Composition API |
| **构建工具** | Vite | `^8.0.12` | ≥8，极速构建 |
| **语言** | TypeScript | `~6.0.2` | 强类型支持 |
| **CSS 引擎** | UnoCSS | `^66.7.0` | 原子化 CSS（与前台统一） |
| **图表** | ECharts | `^5.6.0` | 仪表盘可视化（饼图+柱状图） |
| **状态管理** | Pinia | `^2.3.1` | 状态管理 |
| **路由** | Vue Router | `^4.5.0` | SPA 路由管理，5 子路由 |
| **图标库** | @iconify/vue | **`5.0.0`** | SVG 图标系统 |
| **HTTP 客户端** | Axios | `^1.7.9` | 对接后端 API |
| **代码规范** | ESLint + Prettier | `^9.x / ^3.x` | 代码检查与格式化 |

### 中后台 `package.json` 核心依赖

```
{
  "name": "homepage-admin",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.13",
    "vue-router": "^4.5.0",
    "pinia": "^2.3.1",
    "ant-design-vue": "^4.2.6",
    "@ant-design/icons-vue": "^7.0.1",
    "@iconify/vue": "5.0.0",
    "@iconify/json": "^2.x",
    "axios": "^1.7.9",
    "echarts": "^5.6.0"
  },
  "devDependencies": {
    "typescript": "~6.0.2",
    "vite": "^8.0.12",
    "@vitejs/plugin-vue": "^6.0.7",
    "unocss": "^66.7.0",
    "eslint": "^9.17.0",
    "prettier": "^3.4.2",
    "vue-tsc": "^3.2.8"
  }
}
```

***

## 四、后端技术栈（NestJS API）

**路径**：`apps/backend`

**目标**：提供 RESTful API，支撑前台和中后台

| 类别        | 技术               | 版本           | 说明           |
| --------- | ---------------- | ------------ | ------------ |
| **框架**    | NestJS           | `^11.0.0`    | 企业级 Node 框架  |
| **语言**    | TypeScript       | `^5.6.3`     | 全栈 TS 统一     |
| **ORM**   | TypeORM          | `^0.3.20`    | SQL 实体映射     |
| **数据库驱动** | mariadb           | `^3.5.2`     | MariaDB 驱动    |
| **数据库**   | MariaDB          | `11.4.x LTS` | 关系型数据库       |
| **鉴权**    | @nestjs/passport | `^11.0.5`    | JWT 认证策略     |
| **JWT**   | @nestjs/jwt      | `^11.0.2`    | Token 生成     |
| **接口文档**  | @nestjs/swagger  | `^11.2.3`    | OpenAPI 自动生成 |
| **配置**    | @nestjs/config   | `^4.x`       | 环境变量管理       |
| **验证**    | class-validator  | `^0.14.1`    | DTO 参数校验     |
| **图片处理**  | sharp            | `^0.33.x`    | 头像压缩（200×200 WebP） |
| **进程管理**  | PM2              | `^5.3.1`     | 生产环境保活       |

### 后端 `package.json` 核心依赖

```
{
  "name": "homepage-backend",
  "version": "0.0.1",
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.1",
    "@nestjs/core": "^11.0.1",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/typeorm": "^11.0.0",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/config": "^4.0.0",
    "@nestjs/swagger": "^11.2.3",
    "typeorm": "^0.3.20",
    "mariadb": "^3.5.2",
    "bcryptjs": "^2.4.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "sharp": "^0.33.5",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/node": "^24.0.0",
    "typescript": "^5.7.3",
    "ts-node": "^10.9.2"
  }
}
```

***

## 五、基础设施技术栈

| 类别          | 技术       | 版本           | 说明            |
| ----------- | -------- | ------------ | ------------- |
| **Web 服务器** | Caddy    | `2.8.x`      | 反向代理（HTTP，内网部署） |
| **数据库**     | MariaDB  | `11.4.x LTS` | 关系型数据库       |
| **进程管理**    | PM2      | `5.3.1`      | Node 应用守护     |
| **容器化**     | Docker + Compose | `24.x+ / 2.x+` | 生产环境 Docker 部署 |
| **数据库 GUI** | DBeaver  | -            | 数据库管理工具       |
| **API 测试**  | Apifox   | -            | 接口调试          |

***

## 六、技术栈对应关系

| 前端功能 | 后端 API | 数据库表 |
|---------|----------|----------|
| 响应式布局 | 无需接口 | - |
| 明暗主题切换 | 无需接口（前端 localStorage） | - |
| 打字机效果 | `GET /api/config`（前台加载全部配置） | `site_config.key = typewriterWords` |
| 加载动画 | 无需接口 | - |
| 时间进度条 | 无需接口 | - |
| 配置化内容 | `GET /api/config` + `GET /api/config/:key` | `site_config` 表 |
| 管理后台登录 | `POST /api/auth/login` | `users` 表 |
| 配置 CRUD | `GET/POST/PUT/DELETE /api/config/:key` | `site_config` 表 |
| 操作审计 | `GET /api/audit` | `audit_logs` 表 |

***

## 七、开发命令汇总

```
# 根目录操作
pnpm install          # 安装所有依赖
pnpm build            # 构建所有应用
pnpm lint             # 代码检查
pnpm format           # 代码格式化

# 启动开发服务（分别开终端）
pnpm dev:backend      # 后端 API → localhost:8000
pnpm dev:admin        # 管理后台 → localhost:3001
pnpm dev:frontend     # 前台主页 → localhost:3000

# 单独操作某应用
pnpm --filter homepage-frontend dev
pnpm --filter homepage-admin dev
pnpm --filter homepage-backend dev

# 生产部署（内网 HTTP）
pnpm build
pm2 start ecosystem.config.cjs       # PM2 守护后端
caddy run --config Caddyfile          # Caddy 反向代理

# 或 Docker 一键部署
docker compose up -d                  # 启动全部服务
docker compose logs -f                # 查看日志
docker compose down                   # 停止并删除容器
```

