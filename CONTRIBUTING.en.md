# 🤝 Contributing Guide

<p align="right">
  <a href="./CONTRIBUTING.md">简体中文</a> · <strong>English</strong>
</p>

> This file is for both human contributors and AI Agents (OpenCode, Claude Code, Codex, etc.), helping them quickly understand the project structure, development conventions, and Skill system.

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Directory Structure](#-directory-structure)
- [Skill System](#-skill-system)
- [Development Workflow](#-development-workflow)
- [Code Conventions](#-code-conventions)
- [Commit Convention](#-commit-convention)
- [CI Checks](#-ci-checks)
- [Notes for AI Agents](#-notes-for-ai-agents)

---

## 🧭 Project Overview

**Homepage** is a full-stack personal homepage system, managed as a pnpm monorepo with three sub-packages:

| Sub-project | Path | Stack | Port |
|-------------|------|-------|------|
| Frontend | `apps/frontend` | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `:3000` |
| Admin | `apps/admin` | Vue 3.5 + Ant Design Vue 4 + ECharts + Vite 8 | `:3001` |
| API | `apps/backend` | NestJS 11 + TypeORM + MariaDB/SQLite + JWT | `:8000` |

**Deployment**: Docker Compose with three services (app / caddy / mariadb), Caddy serves static files and provides automatic HTTPS.

---

## 📂 Directory Structure

```
homepage/
├── apps/
│   ├── frontend/          # Public site (Vue 3 + UnoCSS)
│   ├── admin/             # Admin panel (Vue 3 + Ant Design Vue)
│   └── backend/           # API service (NestJS)
├── .agents/skills/        # AI Agent skill files (see Skill System below)
├── caddy/                 # Caddy configuration
│   ├── Caddyfile          # Docker production config
│   ├── Caddyfile.dev      # Dev/intranet reverse proxy config
│   └── entrypoint.sh      # Caddy entrypoint script
├── docker/                # Docker build files
│   ├── Dockerfile.app     # Backend API image
│   ├── Dockerfile.caddy   # Caddy + static files image
│   └── .env.example       # Docker env template
├── scripts/               # Deployment and ops scripts
├── config/                # Configuration files
├── docs/                  # Project documentation
├── image/                 # Project image assets
├── docker-compose.yml     # Docker orchestration
├── pnpm-workspace.yaml    # pnpm workspace config
└── package.json           # Root package.json
```

---

## 🧩 Skill System

This project includes 19 AI Agent Skills stored in `.agents/skills/`, ensuring a unified AI-assisted development experience for all contributors.

### Skill Source Types

| Source Type | Description | Identification |
|-------------|-------------|----------------|
| **opencode-registry** | Remotely installed via OpenCode official registry | Has `_meta.json` with `ownerId`/`slug`/`version` |
| **github** | Remotely installed from a GitHub repo | Recorded in `skills-lock.json`, `sourceType: "github"` |
| **local** | Manually placed local Skill | No `_meta.json`, not in `skills-lock.json` |

### Skill Inventory

| Skill | Source | Purpose |
|-------|--------|---------|
| `apple-design` | github (emilkowalski/skills) | Apple design principles & fluid interactions |
| `bug-fixing` | opencode-registry | Zero-regression bug fix workflow |
| `code-fix` | local | Code error diagnosis & fixes |
| `debug-pro` | opencode-registry | Advanced debugging techniques |
| `docker` | opencode-registry | Docker container & Compose configuration |
| `duckduckgo-search` | opencode-registry | DuckDuckGo web search |
| `find-skill-skillhub` | opencode-registry | SkillHub platform skill search |
| `find-skills` | local | Discover & install new Skills |
| `log-analyzer` | opencode-registry | Log parsing & analysis |
| `nestjs` | opencode-registry | NestJS best practices |
| `nexus-error-explain` | opencode-registry | Error message explanation & fix suggestions |
| `security-best-practices` | opencode-registry | Security best practices review |
| `superpowers-systematic-debugging` | opencode-registry | Systematic debugging four-phase method |
| `tech-bug-troubleshooting` | local | Bug troubleshooting expert package |
| `typescript` | opencode-registry | TypeScript type safety |
| `vite` | opencode-registry | Vite configuration & optimization |
| `vue` | opencode-registry | Vue 3 Composition API |
| `vue3-composition-helper` | opencode-registry | Vue 3 Composition API helper |

### Related Files

| File | Purpose | Committed |
|------|---------|-----------|
| `.agents/skills/` | Skill source files | ✅ Yes |
| `skills-lock.json` | OpenCode-managed install lock file | ✅ Yes (only records Skills managed by OpenCode) |
| `.agents/` | OpenCode Agent config root | ✅ Yes |
| `.opencode/` | OpenCode runtime config | ❌ Ignored (`.gitignore`) |
| `.claude/` | Claude Code config | ❌ Ignored (`.gitignore`) |

### Adding a New Skill

1. Place the Skill folder in `.agents/skills/<skill-name>/`
2. Ensure it contains `SKILL.md` (main entry point)
3. Put reference docs in `references/` subdirectory if any
4. Commit to Git — no need to modify `skills-lock.json` (only OpenCode manages that for remote installs)

---

## 🚀 Development Workflow

### Prerequisites

- **Node.js** ≥ 20.19.0
- **pnpm** ≥ 11.0.0

### Local Development

```bash
# 1. Clone
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage

# 2. Install dependencies
pnpm install

# 3. Configure env
cp apps/backend/.env.example apps/backend/.env
# Edit .env, set DB_TYPE=sqlite (no database needed)

# 4. Start development
pnpm dev              # Start all services in parallel
# Or individually
pnpm dev:backend      # Backend :8000
pnpm dev:frontend     # Frontend :3000
pnpm dev:admin        # Admin :3001
```

### Contribution Steps

1. **Fork** the repository
2. Create a feature branch from `main`: `git checkout -b feat/your-feature`
3. Write code following the conventions below
4. Run `pnpm lint` to ensure style consistency
5. Commit following Conventional Commits
6. Push and open a **Pull Request**

---

## 📏 Code Conventions

### Frontend (Vue 3)

- Use **Composition API** + `<script setup lang="ts">`
- Prefer **UnoCSS** atomic classes for styling; use `<style scoped>` for complex styles
- Component naming: PascalCase (e.g., `UserProfile.vue`)
- File organization: group by feature module — views / components / stores / api

### Backend (NestJS)

- Follow **Module → Controller → Service → DTO** layering
- Use **class-validator** + **class-transformer** for DTO validation
- Database operations via **TypeORM** Repository pattern
- Error handling using NestJS built-in exception filters

### General

- **TypeScript** strict mode; no `any` (unless necessary with a comment explaining why)
- File naming: kebab-case (files) / camelCase (variables, functions) / PascalCase (classes, components)
- Do not add comments unless the logic is genuinely complex and needs explanation

---

## 📝 Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type**: `feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore` / `perf`
**Scope**: `frontend` / `admin` / `backend` / `docker` / `docs` / `ci` / `deps`

Examples:
```
feat(backend): add password strength validation

fix(frontend): fix progress bar color not switching in dark mode

docs: update Docker version requirements in deployment guide
```

---

## ✅ CI Checks

Before submitting a PR, ensure the following pass:

| Check | Command | Description |
|-------|---------|-------------|
| Lint | `pnpm lint` | ESLint + Prettier |
| Build | `pnpm build` | All three packages build successfully |
| Type check | TypeScript strict mode | Checked automatically during build |

---

## 🤖 Notes for AI Agents

This project includes a complete Skill system. AI Agents assisting with development should:

1. **Use installed Skills first**: use `bug-fixing` / `code-fix` / `superpowers-systematic-debugging` for bugs, `vue` / `vue3-composition-helper` for Vue components, `nestjs` for backend
2. **Do not modify `.opencode/` or `.claude/`**: personal tool configs, already in `.gitignore`
3. **Skill files are committed**: `.agents/skills/` is part of the project; commit Skill changes
4. **Do not manually edit `skills-lock.json`**: managed automatically by OpenCode
5. **Follow project conventions**: no unnecessary comments, keep code clean
6. **Run `pnpm lint` after changes**: ensure style consistency

---

> Feel free to open an Issue for questions. Thanks for contributing!
