# 🤝 贡献指南

<p align="right">
  <strong>简体中文</strong> · <a href="./CONTRIBUTING.en.md">English</a>
</p>

> 本文件面向人类贡献者与 AI Agent（如 OpenCode、Claude Code、Codex 等），帮助快速理解项目结构、开发规范与 Skill 体系。

---

## 📋 目录

- [项目概览](#-项目概览)
- [目录结构](#-目录结构)
- [Skill 体系](#-skill-体系)
- [开发流程](#-开发流程)
- [代码规范](#-代码规范)
- [提交规范](#-提交规范)
- [CI 检查项](#-ci-检查项)
- [AI Agent 注意事项](#-ai-agent-注意事项)

---

## 🧭 项目概览

**Homepage** 是一套开箱即用的全栈个人主页系统，采用 pnpm monorepo 管理三个子包：

| 子项目 | 路径 | 技术栈 | 端口 |
|--------|------|--------|------|
| 前台主页 | `apps/frontend` | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `:3000` |
| 管理后台 | `apps/admin` | Vue 3.5 + Ant Design Vue 4 + ECharts + Vite 8 | `:3001` |
| API 服务 | `apps/backend` | NestJS 11 + TypeORM + MariaDB/SQLite + JWT | `:8000` |

**部署架构**：Docker Compose 三服务（app / caddy / mariadb），Caddy 提供静态文件服务与自动 HTTPS。

---

## 📂 目录结构

```
homepage/
├── apps/
│   ├── frontend/          # 前台主页 (Vue 3 + UnoCSS)
│   ├── admin/             # 管理后台 (Vue 3 + Ant Design Vue)
│   └── backend/           # API 服务 (NestJS)
├── .agents/skills/        # AI Agent 技能文件（详见下方 Skill 体系）
├── caddy/                 # Caddy 配置
│   ├── Caddyfile          # Docker 生产环境配置
│   ├── Caddyfile.dev      # 开发/内网反向代理配置
│   └── entrypoint.sh      # Caddy 入口脚本
├── docker/                # Docker 构建文件
│   ├── Dockerfile.app     # 后端 API 镜像
│   ├── Dockerfile.caddy   # Caddy + 静态文件镜像
│   └── .env.example       # Docker 环境变量模板
├── scripts/               # 部署和运维脚本
├── config/                # 配置文件
├── docs/                  # 项目文档
├── image/                 # 项目图片资源
├── docker-compose.yml     # Docker 编排
├── pnpm-workspace.yaml    # pnpm workspace 配置
└── package.json           # 根 package.json
```

---

## 🧩 Skill 体系

本项目内置了 19 个 AI Agent Skill，存放在 `.agents/skills/` 目录下，确保贡献者使用统一的 AI 辅助开发体验。

### Skill 来源分类

| 来源类型 | 说明 | 识别方式 |
|----------|------|----------|
| **opencode-registry** | 通过 OpenCode 官方仓库远程安装 | 有 `_meta.json`，含 `ownerId`/`slug`/`version` |
| **github** | 从 GitHub 仓库远程安装 | `skills-lock.json` 中记录，`sourceType: "github"` |
| **local** | 手动放置的本地 Skill | 无 `_meta.json`，不在 `skills-lock.json` 中 |

### Skill 清单

| Skill | 来源 | 用途 |
|-------|------|------|
| `apple-design` | github (emilkowalski/skills) | 苹果设计原则与流体交互动效 |
| `bug-fixing` | opencode-registry | 零回归 Bug 修复工作流 |
| `code-fix` | local | 代码错误诊断与修复 |
| `debug-pro` | opencode-registry | 高级调试技巧 |
| `docker` | opencode-registry | Docker 容器与 Compose 配置 |
| `duckduckgo-search` | opencode-registry | DuckDuckGo 联网搜索 |
| `find-skill-skillhub` | opencode-registry | SkillHub 平台技能搜索 |
| `find-skills` | local | 发现与安装新 Skill |
| `log-analyzer` | opencode-registry | 日志解析与分析 |
| `nestjs` | opencode-registry | NestJS 最佳实践 |
| `nexus-error-explain` | opencode-registry | 错误信息解释与修复建议 |
| `security-best-practices` | opencode-registry | 安全最佳实践审查 |
| `superpowers-systematic-debugging` | opencode-registry | 系统化调试四阶段法 |
| `tech-bug-troubleshooting` | local | Bug 排查专家包 |
| `typescript` | opencode-registry | TypeScript 类型安全 |
| `vite` | opencode-registry | Vite 配置与优化 |
| `vue` | opencode-registry | Vue 3 组合式 API |
| `vue3-composition-helper` | opencode-registry | Vue 3 组合式 API 辅助 |

### 相关文件

| 文件 | 作用 | 是否提交 |
|------|------|----------|
| `.agents/skills/` | Skill 源文件目录 | ✅ 提交 |
| `skills-lock.json` | OpenCode 自动管理的安装锁文件 | ✅ 提交（仅记录 OpenCode 自动管理的 Skill） |
| `.agents/` | OpenCode Agent 配置根目录 | ✅ 提交 |
| `.opencode/` | OpenCode 运行时配置 | ❌ 忽略（`.gitignore`） |
| `.claude/` | Claude Code 配置 | ❌ 忽略（`.gitignore`） |

### 新增 Skill

1. 将 Skill 文件夹放入 `.agents/skills/<skill-name>/`
2. 确保包含 `SKILL.md`（主入口）
3. 如有参考文档，放在 `references/` 子目录
4. 提交到 Git，无需修改 `skills-lock.json`（仅 OpenCode 自动管理远程安装的 Skill）

---

## 🚀 开发流程

### 前置依赖

- **Node.js** ≥ 20.19.0
- **pnpm** ≥ 11.0.0

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env，设置 DB_TYPE=sqlite（无需数据库）

# 4. 启动开发
pnpm dev              # 并行启动全部服务
# 或单独启动
pnpm dev:backend      # 后端 :8000
pnpm dev:frontend     # 前台 :3000
pnpm dev:admin        # 后台 :3001
```

### 贡献步骤

1. **Fork** 本仓库
2. 基于 `main` 创建特性分支：`git checkout -b feat/your-feature`
3. 编写代码，遵循下方规范
4. 运行 `pnpm lint` 确保代码风格一致
5. 提交变更，遵循 Conventional Commits
6. 推送分支并创建 **Pull Request**

---

## 📏 代码规范

### 前端（Vue 3）

- 使用 **Composition API** + `<script setup lang="ts">`
- 样式优先使用 **UnoCSS** 原子类，复杂样式用 `<style scoped>`
- 组件命名：PascalCase（如 `UserProfile.vue`）
- 文件组织：按功能模块分目录，views / components / stores / api

### 后端（NestJS）

- 遵循 **Module → Controller → Service → DTO** 分层
- 使用 **class-validator** + **class-transformer** 做 DTO 校验
- 数据库操作通过 **TypeORM** Repository 模式
- 错误处理使用 NestJS 内置异常过滤器

### 通用

- **TypeScript** 严格模式，禁止 `any`（除非必要且注释说明）
- 文件命名：kebab-case（文件） / camelCase（变量、函数） / PascalCase（类、组件）
- 不要在代码中添加注释，除非逻辑确实复杂需要解释

---

## 📝 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type**：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore` / `perf`
**Scope**：`frontend` / `admin` / `backend` / `docker` / `docs` / `ci` / `deps`

示例：
```
feat(backend): 添加密码强度校验规则

fix(frontend): 修复暗色模式下进度条颜色不切换

docs: 更新部署指南中的 Docker 版本要求
```

---

## ✅ CI 检查项

提交 PR 前请确保以下检查通过：

| 检查项 | 命令 | 说明 |
|--------|------|------|
| 代码风格 | `pnpm lint` | ESLint + Prettier |
| 构建 | `pnpm build` | 三端全部构建成功 |
| 类型检查 | TypeScript 严格模式 | 构建时自动检查 |

---

## 🤖 AI Agent 注意事项

本项目内置了完整的 Skill 体系，AI Agent 在协助开发时应注意：

1. **优先使用已安装的 Skill**：如遇到 Bug 可使用 `bug-fixing` / `code-fix` / `superpowers-systematic-debugging`，写 Vue 组件时参考 `vue` / `vue3-composition-helper`，写后端时参考 `nestjs`
2. **不要修改 `.opencode/` 和 `.claude/` 目录**：这些是个人工具配置，已加入 `.gitignore`
3. **Skill 文件提交到 Git**：`.agents/skills/` 是项目的一部分，修改 Skill 时请提交
4. **不要手动编辑 `skills-lock.json`**：该文件由 OpenCode 自动管理
5. **代码风格遵循项目规范**：不要添加不必要的注释，保持代码简洁
6. **修改后运行 `pnpm lint`**：确保代码风格一致

---

> 如有疑问，欢迎提 Issue 讨论。感谢你的贡献！
