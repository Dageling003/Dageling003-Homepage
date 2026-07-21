# Homepage — Technical Architecture

<p align="right">
  <a href="./architecture.md">简体中文</a> · <strong>English</strong>
</p>

> Last updated: 2026/06/08 v0.7.0

---

## 1. Overview

Homepage is a full-stack, front-end / back-end-separated homepage management system made up of three sub-projects:

| Sub-project | Path | Dev port | Stack |
|--------|------|------|--------|
| **Public landing page** | `apps/frontend` | 3000 | Vue 3 + Vite + UnoCSS |
| **Admin dashboard** | `apps/admin` | 3001 | Vue 3 + Ant Design Vue + UnoCSS |
| **Backend API** | `apps/backend` | 8000 | NestJS + TypeORM + MariaDB / SQLite |

> Ports 3000 / 3001 / 8000 are for development only. In Docker production, only ports 80 / 443 are exposed and Caddy is the single entry point.

---

## 2. Overall architecture

```
┌──────────────────────────────────────────────────────┐
│                     Caddy (:80 / :443)               │
│                                                      │
│  /          → file_server (/var/www/frontend)        │
│  /admin*    → file_server (/var/www/admin)           │
│  /api/*     → reverse_proxy app:8000                 │
│  HTTPS      → auto issue + renew (ZeroSSL / LE)      │
└──────┬───────────────────────────────────────────────┘
       │
       │  reverse proxy for /api/*
       ▼
┌──────────────────┐      ┌─────────────────┐
│ Backend (NestJS) │      │    MariaDB      │
│ app:8000         │◄────►│    :3306        │
│                  │      │                 │
│ AuthModule       │      │  users          │
│ SiteConfigModule │      │  site_config    │
│ AuditModule      │      │  audit_logs     │
│ TypeORM          │      │                 │
└──────────────────┘      └─────────────────┘
```

> In Docker production, Caddy serves the frontend/admin static files directly (no intermediate Node process). Only API requests reach the backend container.

---

## 3. Deployment architecture (Docker)

```
┌──────────────────────────────────────────────────────────┐
│  docker compose                                          │
│                                                          │
│  Network: frontend                                       │
│  ├─ homepage-caddy (Caddy + static files)                │
│  │  ├─ ports 80/443 published to the host                │
│  │  ├─ bakes in frontend + admin dist                    │
│  │  ├─ /api/*  → app:8000                                │
│  │  ├─ /health → health endpoint                         │
│  │  ├─ HEALTHCHECK: caddy validate                       │
│  │  └─ depends_on: app (service_healthy)                 │
│  │                                                       │
│  │  Network: backend (app bridges both networks)         │
│  ├─ homepage-app (backend API only)                      │
│  │  ├─ node:22-alpine                                    │
│  │  ├─ production-only deps (pnpm deploy --prod)         │
│  │  ├─ HEALTHCHECK: /health                              │
│  │  ├─ on the frontend network (talks to Caddy)          │
│  │  ├─ on the backend network (talks to MariaDB)         │
│  │  └─ depends_on: mariadb (service_healthy)             │
│  │                                                       │
│  │  Network: backend                                     │
│  └─ homepage-db (MariaDB 11.4)                           │
│     ├─ only on the backend network (not exposed          │
│     │   to frontend)                                     │
│     ├─ persistent volume (mariadb_data)                  │
│     └─ HEALTHCHECK: mariadb-admin ping                   │
└──────────────────────────────────────────────────────────┘
```

**Network isolation:**

| Network | Services | Purpose |
|------|-----------|------|
| `frontend` | caddy, app | Caddy reverse-proxies to app |
| `backend` | app, mariadb | app talks to the database |

> MariaDB lives on `backend` only, never on `frontend` — even if Caddy is compromised, the DB is not directly reachable.

**Two images, clear responsibilities:**

| Image | Dockerfile | Contents |
|------|-----------|------|
| `homepage-app` | `Dockerfile.app` | Backend API (NestJS dist + production deps) + a copy of the static dist (for Caddy to extract) |
| `homepage-caddy` | `Dockerfile.caddy` | Caddy + baked-in frontend/admin static files |

---

## 4. Project layout

```tree
homepage/
├── apps/
│   ├── frontend/                  # public site
│   │   └── src/
│   │       ├── api/               # HTTP request wrappers
│   │       ├── router/            # routes (single page)
│   │       ├── stores/            # Pinia
│   │       ├── types/             # TypeScript types
│   │       ├── components/        # 5 UI components
│   │       └── views/             # page components
│   │
│   ├── admin/                     # admin dashboard
│   │   └── src/
│   │       ├── api/               # HTTP request wrappers
│   │       ├── layouts/           # AdminLayout (sidebar + top bar)
│   │       ├── components/        # breadcrumb / tabs / theme
│   │       ├── stores/            # Pinia (auth / tabs / theme)
│   │       ├── router/            # login guard + init guard
│   │       └── views/             # pages
│   │           ├── login/         # login
│   │           ├── setup/         # first-run wizard
│   │           ├── dashboard/     # dashboard
│   │           ├── config/        # config management (form-driven)
│   │           ├── account/       # account settings
│   │           ├── audit/         # audit log
│   │           └── error/         # 404
│   │
│   └── backend/                   # backend API
│       └── src/
│           ├── auth/              # auth module
│           │   ├── dto/           # request DTOs
│           │   ├── jwt.strategy   # JWT strategy
│           │   └── jwt-auth.guard # auth guard
│           ├── config/            # site config module
│           │   ├── dto/           # request DTOs
│           │   └── entities/      # data entities
│           ├── audit/             # audit log module
│           └── users/             # user entity
│
├── scripts/                       # deploy & ops scripts
│   ├── deploy.sh                  # one-command deploy
│   ├── build.sh                   # build
│   ├── update.sh                  # update
│   ├── smoke-test.sh              # smoke test
│   ├── docker-health.sh           # Docker healthcheck
│   ├── domain-check.sh            # domain verification
│   └── backup-db.sh               # DB backup
├── config/
│   └── ecosystem.config.cjs       # PM2
├── docs/                          # project docs
├── Caddyfile                      # reverse proxy (dev / intranet)
├── Caddyfile.docker               # Caddy config (baked into Caddy image)
├── Dockerfile.app                 # backend API image
├── Dockerfile.caddy               # Caddy + static files image
├── docker-compose.yml             # Docker orchestration (app + mariadb + caddy)
├── .dockerignore
├── package.json                   # workspace root
└── pnpm-workspace.yaml
```

---

## 5. Data flow

### Auth

```
Login                            Audit
POST /api/auth/login             config CRUD → auto-write into audit_logs
  → validate username+password     → records operator / timestamp / diff
  → returns a JWT token
  → subsequent requests carry:
      Authorization: Bearer xxx
```

> ⚠️ **JWT initialization order**: `JwtModule` uses `registerAsync` to load the secret lazily, avoiding the "undefined secret" problem where `.env` isn't ready yet during module decoration.

### Avatar upload

```
User uploads an avatar
  → POST /api/config/upload/avatar (multipart/form-data)
  → multer accepts the file (jpg/png/gif/webp only, ≤ 5MB)
  → sharp compresses it to 200×200 WebP (quality 70)
  → stored at public/uploads/avatar/avatar-{timestamp}-{random}.webp
  → returns URL: /files/uploads/avatar/xxx.webp
  → frontend calls PUT /api/auth/profile to update avatarUrl
```

> Static files are exposed at the `/files/` prefix via `app.useStaticAssets()`.

### First-run initialization

```
Visit the admin dashboard for the first time
  → route guard checks whether the user is logged in
  → not logged in → redirect to /login
  → user logs in with the default admin account
  → route guard calls GET /api/config/initialized
  → returns { data: { initialized: false } }
      (when _initialized = '0' or the key doesn't exist)
  → redirect to /setup

7-step wizard:
  Step 0: Welcome
  Step 1: Personal info (name / gender / birthday / province / school / professions)
  Step 2: Quick links (multiple; name + URL + color)
  Step 3: Tech stack (multiple names)
  Step 4: Typewriter (multiple rotating strings)
  Step 5: Todos (multiple, with checked state)
  Step 6: Done → set _initialized = '1' → redirect to /dashboard
```

> **Seed data**: on first boot the system inserts 20 default config rows + 1 admin user, and `_initialized = '0'` guarantees a fresh deploy always goes through the wizard.

---

## 6. Data model

```sql
-- users
users:
  id            INT PK AUTO_INCREMENT
  username      VARCHAR(50) UNIQUE
  password      VARCHAR(255)    (bcrypt 12 rounds)
  role          VARCHAR(10) DEFAULT 'admin'
  avatarUrl     VARCHAR(255) NULL   (avatar URL, /files/uploads/avatar/*.webp)
  theme         VARCHAR(10) DEFAULT 'light'
  createdAt     DATETIME
  updatedAt     DATETIME

-- site config
site_config:
  id            INT PK AUTO_INCREMENT
  config_key    VARCHAR(50) UNIQUE
  config_value  TEXT
  category      VARCHAR(50)       (grouping: info / links / techs / todos / system)
  createdAt     DATETIME
  updatedAt     DATETIME

-- audit log
audit_logs:
  id            INT PK AUTO_INCREMENT
  action        VARCHAR(10)       (CREATE / UPDATE / DELETE)
  entity        VARCHAR(50)
  entity_key    VARCHAR(50)
  detail        TEXT
  operator      VARCHAR(50)
  createdAt     DATETIME
```

---

## 7. Key design decisions

### Security

- Passwords: bcrypt at 12 rounds; JWT expires in 7 days.
- `JWT_SECRET` is validated on startup — unset, default placeholder, or shorter than 20 chars all cause a hard fail.
- `JwtModule.registerAsync` ensures the secret is only read after `.env` is loaded.
- Password lengths: admin default ≥ 12, change-password ≥ 12, login ≥ 8.
- helmet security headers hardened: CSP, HSTS (max-age = 1 year), crossOrigin policies.
- Global 1 MB request-body limit (DDoS mitigation).
- Swagger docs are enabled only in non-production environments.
- Rate limiting: 120/min globally, 5/min on `/api/auth/login`.
- Upload pipeline: sharp compresses + converts to 200×200 WebP; MIME + sharp metadata + magic-byte triple validation; 5 MB max.
- Audit log: every config change is persisted; long values are truncated to prevent leakage.
- Init gate: first use is forced through the wizard (`_initialized` marker).
- Default admin: auto-created; `DEFAULT_ADMIN_PASSWORD` controls the initial password.
- Dependency security: audits run periodically to fix high-severity CVEs (form-data, multer, nodemailer, …).
- Docker network isolation: MariaDB is on `backend` only and never exposed to `frontend`.

### Database

- `DB_TYPE=sqlite` uses SQLite via `sql.js` — no external service needed; schema is auto-synced at startup.
- `DB_TYPE=mariadb` (default) uses MariaDB; `DB_SYNCHRONIZE` gates schema sync.
- Production MariaDB must keep `DB_SYNCHRONIZE=false`.
- MariaDB connection pool: `connectionLimit=20`, `connectTimeout=10s`.

### Configuration management

- 20 config keys across 4 categories (info / links / techs / todos) + 1 system marker (`_initialized`).
- The admin edits everything through forms (no more JSON textareas).
- The frontend dynamically loads them through a `configHandlers` mapping.
- Birthday auto-computes age and zodiac.
- Built-in picker for 34 Chinese provinces + search across 1,200+ universities.

### Deployment

- Dev: `pnpm dev` boots all three sub-projects.
- Prod (intranet HTTP):
  - `pnpm build` builds everything → Caddy serves the static files + PM2 keeps the backend alive.
  - Or `bash deploy.sh` for the one-command Docker path.
- Prod (Docker):
  - Two images: `homepage-app` (backend API) + `homepage-caddy` (Caddy + static files).
  - Only ports 80 / 443 are exposed; all traffic goes through Caddy.
  - HEALTHCHECK is baked into every service; startup order uses `service_healthy`.
  - Network isolation: frontend (Caddy ↔ App) + backend (App ↔ MariaDB).
  - MariaDB is not exposed on the frontend network — an extra layer of defense.
