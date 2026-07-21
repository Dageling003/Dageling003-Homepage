# Homepage — Full Stack Reference

<p align="right">
  <a href="./technology-selection.md">简体中文</a> · <strong>English</strong>
</p>

---

## 1. Baseline (must match)

| Tool | Version | Notes |
| ----------- | -------------------------- | ------------------ |
| **Node.js** | **v24.16.0 (LTS Krypton)** | LTS, compatible with every dependency |
| **pnpm** | **11.5.2** | Package manager (workspace mode) |
| **Git** | latest | Version control |

### pnpm 11 essentials

**Root `.npmrc`** (registry only)

```
registry=https://registry.npmmirror.com
```

**Root `pnpm-workspace.yaml`**

```
packages:
  - 'apps/*'

# Only allow build scripts for packages that need native compilation
allowBuilds:
  '@nestjs/core': true
  esbuild: true
  unrs-resolver: true
  vue-demi: true
  'core-js': true
  sharp: true
```

---

## 2. Frontend stack (public site)

**Path**: `apps/frontend`

**Goal**: minimal display-only page.

| Category | Tech | Version | Notes |
| ------------ | ------------ | ----------- | ------------------ |
| **Framework** | Vue | `^3.5.13` | Composition API |
| **Language** | TypeScript | `^5.6.3` | Strong typing |
| **Bundler** | Vite | `^8.0.12` | ≥ 8, fast HMR |
| **CSS engine** | UnoCSS | `^66.7.0` | Atomic CSS, theme-driven |
| **Routing** | Vue Router | `^4.5.0` | SPA routing |
| **State** | Pinia | `^2.3.1` | Lightweight store (theme, progress state) |
| **HTTP** | Axios | `^1.7.9` | API request wrapper |
| **Icons** | @iconify/vue | **`5.0.0`** | SVG icons (lazy load + 40+ brand-color mappings) |
| **Utils** | @vueuse/core | `^12.0.0` | Composition utilities (time calculations, …) |
| **PWA** | vite-plugin-pwa | `^1.3.0` | Offline cache + installable |
| **Lint** | ESLint | `^9.17.0` | Static analysis |
| **Formatter** | Prettier | `^3.4.2` | Consistent formatting |

### Frontend `package.json` (essentials)

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
    "vite-plugin-pwa": "^1.3.0",
    "eslint": "^9.17.0",
    "prettier": "^3.4.2"
  },
  "engines": {
    "node": ">=20.19.0"
  }
}
```

---

## 3. Admin stack (Ant Design Vue)

**Path**: `apps/admin`

**Goal**: enterprise-flavored admin dashboard with 5 sub-menus for managing site config.

| Category | Tech | Version | Notes |
|------|------|------|------|
| **UI** | Ant Design Vue | `^4.2.6` | Enterprise-grade Vue 3 components |
| **Icons** | @ant-design/icons-vue | `^7.0.1` | Ant Design icon set |
| **Framework** | Vue | `^3.5.13` | Composition API |
| **Bundler** | Vite | `^8.0.12` | ≥ 8 |
| **Language** | TypeScript | `~6.0.2` | Strong typing |
| **CSS engine** | UnoCSS | `^66.7.0` | Atomic CSS (unified with frontend) |
| **Charts** | ECharts | `^5.6.0` | Dashboard viz (pie + bar) |
| **State** | Pinia | `^2.3.1` | State management |
| **Routing** | Vue Router | `^4.5.0` | SPA routing, 5 sub-routes |
| **Icons** | @iconify/vue | **`5.0.0`** | SVG icons |
| **HTTP** | Axios | `^1.7.9` | Backend integration |
| **Lint + format** | ESLint + Prettier | `^9.x / ^3.x` | |

### Admin `package.json` (essentials)

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

---

## 4. Backend stack (NestJS API)

**Path**: `apps/backend`

**Goal**: RESTful API powering both frontends.

| Category | Tech | Version | Notes |
| --------- | ---------------- | ------------ | ------------ |
| **Framework** | NestJS | `^11.0.0` | Enterprise Node framework |
| **Language** | TypeScript | `^5.6.3` | Unified TS across the stack |
| **ORM** | TypeORM | `^0.3.20` | SQL entity mapping |
| **DB driver** | mariadb | `^3.5.2` | MariaDB driver |
| **DB** | MariaDB | `11.4.x LTS` | Relational DB |
| **Auth** | @nestjs/passport | `^11.0.5` | JWT strategy |
| **JWT** | @nestjs/jwt | `^11.0.2` | Token generation |
| **Rate limit** | @nestjs/throttler | `^6.5.0` | API rate limiting |
| **Security headers** | helmet | `^8.2.0` | HTTP hardening |
| **API docs** | @nestjs/swagger | `^11.2.3` | OpenAPI generation |
| **Config** | @nestjs/config | `^4.x` | Env-var management |
| **Validation** | class-validator | `^0.14.1` | DTO validation |
| **Image processing** | sharp | `^0.33.x` | Avatar compression (200×200 WebP) |
| **Process manager** | PM2 | `^5.3.1` | Production supervisor |

### Backend `package.json` (essentials)

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
    "@nestjs/throttler": "^6.5.0",
    "helmet": "^8.2.0",
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

---

## 5. Infrastructure

| Category | Tech | Version | Notes |
| ----------- | -------- | ------------ | ------------- |
| **Web server** | Caddy | `2.8.x` | Reverse proxy (HTTP for intranet, HTTPS auto in Docker) |
| **Database** | MariaDB | `11.4.x LTS` | Relational DB |
| **Process manager** | PM2 | `5.3.1` | Node supervision |
| **Containers** | Docker + Compose | `24.x+ / 2.x+` | Production Docker deploy |
| **DB GUI** | DBeaver | – | Database client |
| **API testing** | Apifox | – | Endpoint debugging |

---

## 6. Feature ↔ API ↔ table mapping

| Frontend feature | Backend API | DB table |
|---------|----------|----------|
| Responsive layout | none | – |
| Light/dark toggle | none (frontend `localStorage`) | – |
| Typewriter effect | `GET /api/config` (loads all config) | `site_config.key = typewriterWords` |
| Loading animation | none | – |
| Time progress bars | none | – |
| Configurable content | `GET /api/config` + `GET /api/config/:key` | `site_config` |
| Admin login | `POST /api/auth/login` | `users` |
| Config CRUD | `GET/POST/PUT/DELETE /api/config/:key` | `site_config` |
| Audit | `GET /api/audit` | `audit_logs` |

---

## 7. Development commands

```
# Root
pnpm install          # install all deps
pnpm build            # build every app
pnpm lint             # lint
pnpm format           # format

# Dev servers (one per terminal)
pnpm dev:backend      # backend API → localhost:8000
pnpm dev:admin        # admin dashboard → localhost:3001
pnpm dev:frontend     # public site → localhost:3000

# Per-app
pnpm --filter homepage-frontend dev
pnpm --filter homepage-admin dev
pnpm --filter homepage-backend dev

# Production (intranet HTTP)
pnpm build
pm2 start ecosystem.config.cjs       # PM2 supervises the backend
caddy run --config Caddyfile         # Caddy reverse proxy

# Or one-command Docker
docker compose up -d                 # start everything
docker compose logs -f               # tail logs
docker compose down                  # stop + remove containers
```
