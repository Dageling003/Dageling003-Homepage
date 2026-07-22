# Dev Guide

<p align="right">
  <a href="./dev-guide.md">简体中文</a> · <strong>English</strong>
</p>

> How to boot, hack on, and maintain the Homepage project.
>
> Last updated: 2026/06/08 v0.7.0

---

## 🚀 Quick start

### Prerequisites

| Tool | Version | Check |
|------|------|---------|
| Node.js | >= 20.19.0 | `node -v` |
| pnpm | >= 11.0.0 | `pnpm -v` |
| MariaDB (optional) | >= 10.5 | `mysql -V` |

> With `DB_TYPE=sqlite` you don't need to install MariaDB at all — see below.

### 1. Install

```bash
git clone <repo-url>
cd homepage
pnpm install
```

### 2. Configure env vars

```bash
cd apps/backend
cp .env.example .env
# Edit .env:
# - Rotate JWT_SECRET to a strong random string: openssl rand -base64 32
# - Set DB_TYPE=sqlite for SQLite (no DB install required), or keep DB_TYPE=mariadb for MariaDB
```

> ⚠️ **You must** rotate `JWT_SECRET` (`openssl rand -base64 32`) — the default placeholder is a security risk.

### 3. Start dev services

```bash
# Boot everything from the repo root (recommended)
pnpm dev

# Or boot individually
pnpm dev:backend    # http://localhost:8000
pnpm dev:frontend   # http://localhost:3000
pnpm dev:admin      # http://localhost:3001
```

> ⚠️ **Start the backend first** — the two frontends rely on their Vite proxy forwarding `/api` to `localhost:8000`.

### 4. Access

| Entry | URL |
|------|------|
| Public site | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API docs | http://localhost:8000/api/docs |

---

## 🔑 Default admin & password reset

### Creating the first admin

| Method | Trigger | Username | Password |
|------|---------|--------|------|
| Env var | `DEFAULT_ADMIN_PASSWORD` set and >= 12 chars | `admin` | value of that env var |
| First-run wizard | `DEFAULT_ADMIN_PASSWORD` blank / missing | user-chosen (defaults to `admin`) | user-chosen (>= 12 chars) |

> Only one of these takes effect: once the env var is set, the "create admin" step in the wizard is hidden automatically.

### Password reset

The admin login page has a "Forgot password?" entry:

- **SMTP configured** (see [SMTP config](#smtp-config)): the system emails a reset link, valid for one hour.
- **SMTP not configured**: the link is also written to `docker logs homepage-app` — ops can copy it from there.

Full flow:

```text
Login page → Forgot password? → enter username
  ↓
Backend generates a one-time token (hashed & stored, expires in one hour)
  ↓
┌──────────────────┬─────────────────────────┐
│ SMTP configured  │ sends an email          │
│ SMTP not config. │ writes to docker logs   │
└──────────────────┴─────────────────────────┘
  ↓
User clicks the link (or copies it from docker logs)
  ↓
Opens /admin/reset-password?token=...
  ↓
Enters a new password (>= 12 chars, confirmed twice)
  ↓
Logs in with the new password
```

### SMTP config

Add these to `.env.docker` or `apps/backend/.env`:

```bash
# Required (leave unset to fall back to docker logs)
SMTP_HOST=smtp.qq.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@your-domain.com
SMTP_PASS=your-app-password
SMTP_FROM="Homepage <noreply@your-domain.com>"
SMTP_REJECT_UNAUTHORIZED=true   # set to false for self-signed certs

# Optional: the base URL used in reset links (defaults to DOMAIN)
PUBLIC_ADMIN_URL=https://your-domain.com
```

Common providers:

| Provider | Host | Port | Encryption | Auth |
|------|----------|------|------|---------|
| QQ | `smtp.qq.com` | 465 | SSL | app password |
| 163 | `smtp.163.com` | 465 / 994 | SSL | app password |
| Gmail | `smtp.gmail.com` | 465 | SSL | app password |
| Outlook | `smtp.office365.com` | 587 | STARTTLS | login password |
| Aliyun Mail Enterprise | `smtp.mxhichina.com` | 465 | SSL | login password |
| Tencent Mail Enterprise | `smtp.exmail.qq.com` | 465 | SSL | login password |
| Self-hosted | `mail.your-domain.com` | 587 | STARTTLS | login password |

> Port 465 defaults to SSL (`SMTP_SECURE=true`); port 587 usually uses STARTTLS (`SMTP_SECURE=false`).

### Emergency reset when SMTP is not configured

```bash
# 1. Trigger a reset (or just use the "Forgot password" form)
curl -X POST https://your-domain.com/api/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin"}'

# 2. Grep the link out of the container logs
docker logs homepage-app 2>&1 | grep -A 6 'Password reset requested'
# You'll see:
#   Reset link: https://.../admin/reset-password?token=...
#   Reset token (raw): <64-char hex>

# 3. Open the link in a browser and set a new password
```

---

## 🗄️ Databases

Pick the driver with `DB_TYPE` in `apps/backend/.env`:

| `DB_TYPE` | Driver | Use case | Init |
|-----------|------|------|-----------|
| `sqlite` | TypeORM `sqljs` | Quick trial / local dev, no DB install | Schema auto-synced on startup |
| `mariadb` (default) | `mariadb` | Production | `pnpm migrate:run` |

SQLite mode only needs:

```bash
DB_TYPE=sqlite
DB_SQLITE_PATH=data/homepage.sqlite
```

- SQLite data file defaults to `apps/backend/data/homepage.sqlite` (override via `DB_SQLITE_PATH`).
- MariaDB uses `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE`.
- `DB_SYNCHRONIZE` only applies to MariaDB. SQLite always auto-syncs the schema.
- On first boot the system inserts seed data (20 config rows + `_initialized = '0'`), and may create an admin depending on your config.
- The init gate: the `_initialized` row in `site_config` controls the first-run wizard. When it's `'0'`, the user is redirected to the wizard.

---

## 📁 Project layout

```
homepage/
├── apps/
│   ├── frontend/          # public site
│   └── src/
│       ├── components/    # AnimatedLogo / ThemeToggle / TypewriterText / TimeGreeting / QuickLinks
│       ├── views/         # HomeView (single page)
│       ├── stores/        # Pinia
│       └── api/           # axios
│
├── admin/                 # admin dashboard
│   └── src/
│       ├── views/         # login / setup / dashboard / config / account / audit
│       ├── layouts/       # AdminLayout (sidebar + top bar + tabs)
│       ├── components/    # AppBreadcrumb / AppTab / ThemeSettings
│       ├── stores/        # auth / tabs / theme
│       └── api/           # axios + interceptors
│
├── backend/               # backend API
│   └── src/
│       ├── auth/          # login / JWT / change-password
│       ├── config/        # config CRUD / avatar upload
│       ├── audit/         # audit log
│       └── users/         # user entity
│
├── docs/                  # project docs
├── docker/                # Docker build files
│   ├── Dockerfile.app     # backend image
│   ├── Dockerfile.caddy   # Caddy + static files image
│   └── .env.example       # Docker env template
├── caddy/                 # Caddy config
│   ├── Caddyfile          # Caddy config (Docker)
│   ├── Caddyfile.dev      # reverse proxy (dev / intranet)
│   └── entrypoint.sh      # Caddy entrypoint
├── docker-compose.yml     # Docker orchestration (app + mariadb + caddy)
├── deploy.sh              # one-command deploy
├── ecosystem.config.cjs   # PM2
└── package.json           # workspace
```

---

## 🔧 Common commands

```bash
# Add deps to a workspace
pnpm add <pkg> --filter homepage-frontend
pnpm add <pkg> --filter homepage-admin
pnpm add <pkg> --filter homepage-backend

# Build
pnpm build                              # build everything
pnpm --filter homepage-frontend build   # public site only
pnpm --filter homepage-admin build      # admin only
pnpm --filter homepage-backend build    # backend only

# Type check
cd apps/frontend && npx vue-tsc --noEmit
cd apps/admin && npx vue-tsc --noEmit
```

---

## 🌐 LAN access

Vite is set up with `host: true`, so phones / iPads on the same Wi-Fi can reach dev servers:

| Service | URL |
|------|------|
| Public site | `http://<your-ip>:3000` |
| Admin | `http://<your-ip>:3001` |

```bash
# Look up your IP
ipconfig | grep IPv4
```

---

## 🐳 Docker deploy

Two images, clear responsibilities:

| Image | Container | Notes |
|------|------|------|
| `homepage-app` | Backend API | NestJS backend on `:8000`, production deps only, has a HEALTHCHECK |
| `homepage-caddy` | Reverse proxy | Caddy + baked-in frontend/admin static files, single entry on `:80/:443` |
| `mariadb:11.4` | Database | Persistent volume |

> Caddy serves static files directly (no Node process in between). Only `/api/*` hits the backend container.

### Requirements

- Docker Engine >= 24.x
- Docker Compose >= 2.x

### 1. One-command deploy (recommended)

```bash
bash deploy.sh
```

Default is **fully automated**: when `.env.docker` is missing the script generates everything with no interaction.
Pass `-i` for interactive mode, which walks you through:

- Domain / IP + ACME email
- JWT secret (auto-generated by default)
- **Default admin password** (three options):
  1. Auto-generate (stored in `.env.docker`).
  2. Custom (>= 12 chars).
  3. **Leave blank → set on your first visit to `/admin/setup` (most secure).**
- **Password-reset email** (optional; one-click config for common providers; blank falls back to `docker logs`).
- `PUBLIC_ADMIN_URL` (defaults to `DOMAIN`).

```bash
bash deploy.sh -i                     # interactive mode
DOMAIN=my.example.com bash deploy.sh  # domain provided upfront
```

### 2. Manual deploy

```bash
# Copy & edit env vars
cp docker/.env.example .env.docker
# In .env.docker:
#   - DOMAIN / JWT_SECRET are required
#   - DEFAULT_ADMIN_PASSWORD blank → create via /admin/setup
#   - SMTP_* blank → reset links land in docker logs

# Build images (app first, then caddy — caddy pulls static files from the app image)
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker build caddy

# Start
docker compose --env-file .env.docker up -d
```

### 3. Access

| Service | URL |
|------|------|
| Public site | `http(s)://<your-domain>/` |
| Admin | `http(s)://<your-domain>/admin` |
| First-run wizard | `http(s)://<your-domain>/admin/setup` |
| Forgot password | `http(s)://<your-domain>/admin/forgot-password` |
| Health | `http(s)://<your-domain>/health` |
| Swagger | dev only (disabled in production) |

### File reference

| File | Purpose |
|------|------|
| `docker-compose.yml` | Orchestrates 3 services (app + mariadb + caddy); includes HEALTHCHECK, resource limits, log rotation |
| `Dockerfile.app` | Backend API image (multi-stage + `pnpm deploy --prod`) |
| `Dockerfile.caddy` | Caddy image (extracts static files from the app image) |
| `Caddyfile.docker` | Caddy config (reverse-proxies `/api`, serves static files directly) |
| `.dockerignore` | Docker build ignore list |
| `deploy.sh` | deploy v2 (default fully-automated, `-i` for interactive); handles SMTP + self-service admin |

### Ops commands

```bash
docker compose ps                    # service status
docker compose logs -f               # all logs
docker compose logs -f app           # backend logs
docker compose logs -f caddy         # Caddy logs
docker compose restart app           # restart backend
docker compose down                  # stop + remove containers
docker compose up -d                 # start again
docker compose --env-file .env.docker build app --no-cache  # rebuild
```

---

## 🐛 Common issues

### Blank page after login

**Cause**: `AdminLayout.vue` is missing the `computed` import from Vue.

```diff
- import { ref, h, watch } from 'vue'
+ import { ref, computed, h, watch } from 'vue'
```

Vite HMR picks it up automatically — no restart needed.

### Login returns 500

**Cause**: `JwtModule.register({ secret: process.env.JWT_SECRET! })` runs at decorator time, before `.env` is loaded, so the secret is `undefined`.

**Fix**: switch to `registerAsync` for lazy loading:

```ts
JwtModule.registerAsync({
  useFactory: () => ({
    secret: process.env.JWT_SECRET!,
    signOptions: { expiresIn: '7d' },
  }),
}),
```

### First-run wizard doesn't appear

**Cause**: the database is missing the `_initialized` row (old seeds didn't include it).

**Manual fix**:

```sql
INSERT INTO site_config (config_key, config_value, category, createdAt, updatedAt)
VALUES ('_initialized', '0', 'system', NOW(), NOW());
```

---

## 🔐 Security reminders

- `.env` is in `.gitignore` — **never commit real env values**.
- `JWT_SECRET` must be a strong random string (`openssl rand -base64 32`); the backend enforces this at boot.
- `DEFAULT_ADMIN_PASSWORD` must be >= 12 chars; change it immediately after the first login.
- Every password field in Docker deploys is required (no weak default fallbacks).
- File uploads are capped at 5 MB, images only, auto-converted to WebP.
- Swagger is disabled in production; `/health` is always available for monitoring.
