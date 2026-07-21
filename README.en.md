<p align="center">
  <img src="image/logo.png" alt="Homepage" width="240" height="240" test-align="center" />
</p>

<h1 align="center">Dageling003-Homepage</h1>

<p align="center">
  <strong>A lightweight, self-hostable personal homepage with a visual admin dashboard</strong>
  <br />
  Say goodbye to hard-coded JSON — drive your personal homepage with forms
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · <strong>English</strong>
</p>

<p align="center">
  <a href="https://github.com/Dageling003/Dageling003-Homepage/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/release-v1.0.0-blue?logo=github" alt="Release v1.0.0" /></a>
  <a href="https://github.com/Dageling003/Dageling003-Homepage/releases"><img src="https://img.shields.io/github/v/release/Dageling003/Dageling003-Homepage?display_name=tag&sort=semver&label=latest" alt="Latest Release" /></a>
  <a href="https://dageling003.top/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fdageling003.top%2F&up_message=online&down_message=offline&label=Live%20Demo" alt="Live Demo" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20.19.0-339933?logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-%3E%3D11.0.0-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
  <a href="https://nestjs.com"><img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" /></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/vue-3.5-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue" /></a>
  <a href="./docker-compose.yml"><img src="https://img.shields.io/badge/Docker-3--service-2496ED?logo=docker&logoColor=white" alt="Docker" /></a>
</p>

> 🔒 All screenshots in this README have been anonymized: name, region, school, birthday, occupation, learning plan, email and similar fields are replaced with sample placeholders.

---

## 🧭 What is this?

**Homepage** is a batteries-included full-stack personal homepage system — a public-facing landing page for visitors, a visual admin dashboard for the owner, and a RESTful API that powers both.

- 🌐 **Live preview**: <https://dageling003.top/> _(the badge auto-probes the site; if the server / domain expires someday the badge will show `offline` — in that case use the in-repo screenshots or run locally.)_
- 🎯 **One-liner**: say goodbye to hard-coded JSON — drive your personal homepage with forms · full-stack split · visual admin · automatic HTTPS.
- 📦 **Delivery**: pnpm monorepo (frontend / admin / backend) + Docker Compose with three services (app / caddy / mariadb).
- 🖼 **Works without a live demo**: every screenshot lives in `image/screenshots/`, so a `git clone` alone is enough for offline preview; to try the full interaction run `pnpm install && pnpm dev` (SQLite mode — no database required).

You no longer need to hand-edit JSON config files. Log in to the admin dashboard, fill out forms for your profile, drag-sort your quick links, tweak your tech stack — the public site updates automatically. Audit logs record every change so you always know **who changed what, when**.

---

## 📸 Screenshots

> All screenshots are taken from the real deployment at `https://dageling003.top`. Personal data (name, region, school, birthday, occupation, plan, email, …) has been replaced with sample placeholders.
>
> 💡 **On long-term demo availability**: repo screenshots are fully decoupled from the live site. Even if the VM / domain expires someday, this README stays useful — the top badge will flip to `offline`, and you should rely on the screenshots or reproduce locally via `pnpm dev`.

<table>
  <tr>
    <td width="50%" align="center">
      <strong>🖥 Desktop · Light</strong><br />
      <img src="image/screenshots/01-homepage.png" alt="Homepage Light" />
    </td>
    <td width="50%" align="center">
      <strong>🌙 Desktop · Dark</strong><br />
      <img src="image/screenshots/06-homepage-dark.png" alt="Homepage Dark" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>📱 Mobile · Light</strong><br />
      <img src="image/screenshots/02-homepage-mobile.png" alt="Homepage Mobile" width="280" />
    </td>
    <td align="center">
      <strong>📱 Mobile · Dark</strong><br />
      <img src="image/screenshots/07-homepage-mobile-dark.png" alt="Homepage Mobile Dark" width="280" />
    </td>
  </tr>
</table>

### 🎨 UI highlights

The whole UI is built around **minimalism + rounded cards + soft shadows**. Every element uses an 8px corner radius — the overall feeling is clean and calm.

| Area | What it does | Visual notes |
|------|--------------|--------------|
| **Top hero** | Avatar + name + multi-dimension tags | Rounded avatar capsule; four inline tags for gender / birthday / region / school |
| **About me** | One-liner persona | Single card, emphasises "who I am" |
| **Tech stack** | N drag-sortable badges | Colored tech icons in rounded-badge style |
| **Slacker plan** | Todo / check-in list | Empty circle · checked / done · strikethrough for review |
| **Time progress** | Four progress bars | Today / week / month / year, each with an emoji |
| **Quick links** | Custom social cards | Large rounded buttons, four theme colors |
| **Life quote** | Mood / motto | Centered, with a blinking cursor animation |
| **🌗 Theme toggle** | Top-right one-click | Sun ⇄ Moon icon, driven by CSS variables |

**Motion & micro-interactions**: ⌨️ typewriter greeting · 📊 progress bars ease in when they enter the viewport · 🎯 200ms ease transitions on theme toggle / card hover · 📐 responsive layout — 3 columns at ≥1024px, single column below · 🌓 dark mode uses pure black background to reduce eye strain.

---

## ✨ Why this one

<table>
  <tr>
    <td width="50%">
      <strong>🖥 Public landing page</strong><br />
      Minimal design, one-click light/dark theme. Typewriter animation and time-progress bars keep it from feeling static.
    </td>
    <td width="50%">
      <strong>⚙️ Visual admin</strong><br />
      Form-driven configuration built on Ant Design Vue. WYSIWYG. No coding required to manage the whole site.
    </td>
  </tr>
  <tr>
    <td>
      <strong>🔐 JWT auth</strong><br />
      bcrypt hashing at 12 rounds + stateless JWT sessions. Route guards block unauthenticated requests.
    </td>
    <td>
      <strong>📜 Audit log</strong><br />
      Every config change is persisted and filterable by operator, time range and module.
    </td>
  </tr>
  <tr>
    <td>
      <strong>👤 Avatar upload</strong><br />
      Local upload → sharp auto-crops and compresses to a 200×200 WebP. <strong>The frontend never touches image processing.</strong>
    </td>
    <td>
      <strong>🎂 Smart form fields</strong><br />
      Enter a birthday — age and zodiac are computed for you. Built-in picker for 34 Chinese provinces and 1,200+ universities.
    </td>
  </tr>
  <tr>
    <td>
      <strong>🚀 First-run wizard</strong><br />
      A fresh deployment auto-detects the un-initialized state and guides you through <strong>8 steps</strong> (including admin creation) to configure the whole site.
    </td>
    <td>
      <strong>🐳 One-command deploy v3</strong><br />
      <code>bash deploy.sh</code> in wizard mode (domain → email → SMTP → admin). Automatic HTTPS via <strong>ZeroSSL</strong> (works from mainland China).
    </td>
  </tr>
  <tr>
    <td>
      <strong>🔑 Password reset</strong><br />
      One-click "Forgot password" on the login page. Works with mainstream SMTP providers (QQ / 163 / Gmail / Outlook / Aliyun / Tencent). <strong>If SMTP is not configured, the reset link falls back to <code>docker logs</code></strong> — grab it over SSH.
    </td>
    <td>
      <strong>👤 Self-service admin creation</strong><br />
      No SSH-based password reset needed for a first deploy. Step 1 of <code>/admin/setup</code> lets the user pick their own account and password; if an admin already exists, the step is hidden. The deploy script also offers 3 modes (auto-generate / custom / defer to web).
    </td>
  </tr>
  <tr>
    <td>
      <strong>📦 Monorepo</strong><br />
      pnpm workspace manages all three apps — a single command boots everything.
    </td>
    <td>
      <strong>🛡️ Production-grade security</strong><br />
      helmet security headers, API rate-limiting, request body size limits, Swagger disabled in production.
    </td>
  </tr>
</table>

---

## 🏗 Architecture

```
                    ┌──────────────────────────────────┐
                    │        Caddy (80 / 443)          │
                    │    HTTPS · ZeroSSL cert          │
                    │    Auto renewal · zero config    │
                    │    HEALTHCHECK: caddy validate   │
                    │                                  │
                    │  /         → static (public)     │
                    │  /admin*   → static (admin)      │
                    │  /api/*    → proxy to app:8000   │
                    │  /health   → health endpoint     │
                    └────────────────┬─────────────────┘
                                     │
                                     │ /api/* (API only)
                                     │
                    ┌────────────────┴─────────────────┐
                    │      Docker network: frontend    │
                    └────────────────┬─────────────────┘
                                     │
                    ┌────────────────┴─────────────────┐
                    │        NestJS backend            │
                    │        :8000 (in-container)      │
                    │    HEALTHCHECK: /health          │
                    │                                  │
                    │  ┌──────────┐  ┌──────────────┐  │
                    │  │ Auth     │  │ MariaDB      │  │
                    │  │ Config   │  │ :3306        │  │
                    │  │ Audit    │  │ (internal)   │  │
                    │  └──────────┘  └──────────────┘  │
                    └────────────────┬─────────────────┘
                                     │
                    ┌────────────────┴─────────────────┐
                    │      Docker network: backend     │
                    └──────────────────────────────────┘
```

| Sub-project | Stack | Dev port | Public path |
|--------|--------|----------|----------|
| `apps/frontend` public homepage | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `3000` | `/` (served directly by Caddy) |
| `apps/admin` admin dashboard | Vue 3.5 + Ant Design Vue 4 + ECharts + Vite 8 | `3001` | `/admin` (served directly by Caddy) |
| `apps/backend` API service | NestJS 11 + TypeORM + MariaDB/SQLite + JWT | `8000` | `/api/*` (proxied by Caddy) |

> **Caddy serves static files directly.** HTML / JS / CSS for the two frontends are served by Caddy's built-in file server without going through Node.js — zero extra overhead. Only API requests hit the backend container.

---

## 🚀 Quick start

### Prerequisites

- **Node.js** ≥ 20.19.0
- **pnpm** ≥ 11.0.0

### Local development

#### Option A: SQLite (no database install required)

```bash
# 1. Clone
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd homepage

# 2. Install
pnpm install

# 3. Configure env
cp apps/backend/.env.example apps/backend/.env
# Edit .env:
#   DB_TYPE=sqlite  — use SQLite, no database install required
#   Make sure to change JWT_SECRET (length >= 20) and DEFAULT_ADMIN_PASSWORD (>= 12 chars)

# 4. One command to start (SQLite auto-creates tables, no migration step)
pnpm dev
```

> **💡 Recommended 3-tab workflow**
>
> Open three terminals (or split panes in VS Code):
>
> | Tab | Command | Service | Notes |
> |------|------|----------|------|
> | Tab 1 | `pnpm dev:backend` | NestJS API `:8000` | backend logic, hot-reload |
> | Tab 2 | `pnpm dev:frontend` | public site `:3000` | Vite HMR |
> | Tab 3 | `pnpm dev:admin` | admin dashboard `:3001` | Vite HMR |
>
> Each tab's logs stay separate. If one service errors out, just restart that tab — the other two stay up.
> The frontends' Vite proxies automatically forward `/api/*` to the backend service (default `127.0.0.1:8000`).

#### Option B: MariaDB (production-style)

- **MariaDB** ≥ 10.5

```bash
# 1. Clone
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd homepage

# 2. Install
pnpm install

# 3. Create the database
mysql -u root -p -e "CREATE DATABASE \`homepage\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. Configure env
cp apps/backend/.env.example apps/backend/.env
# Edit .env — make sure to change JWT_SECRET (length >= 20) and DEFAULT_ADMIN_PASSWORD (>= 12 chars)

# 5. Run migrations
pnpm migrate:run

# 6. Start
pnpm dev
```

> **First deploy**: run `pnpm migrate:run` once to initialize the schema.
> Later updates: if the schema changes, generate a new migration and run it.

#### Generate a new migration (for contributors)

```bash
cd apps/backend
npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:generate -d data-source.ts src/migrations/$(date +%s)-MigrationName
```

Access URLs:

In local development each service listens on `127.0.0.1` under a dedicated port. Replace `<host>` in the table below with your actual host — use `127.0.0.1` for local dev, or the LAN IP / remote server IP / domain if you access it from elsewhere (make sure the port is reachable).

| Service | Port | Path | Example URL |
|------|------|------|--------------|
| 🖥 Public site (Vite dev server) | `3000` | `/` | `http://<host>:3000` |
| ⚙️ Admin (Vite dev server) | `3001` | `/` | `http://<host>:3001` |
| 📡 API docs (Swagger UI, dev only) | `8000` | `/api/docs` | `http://<host>:8000/api/docs` |
| 📡 Backend API root | `8000` | `/api/*` | `http://<host>:8000/api/*` |
| ❤️ Health check endpoint | `8000` | `/health` | `http://<host>:8000/health` |

> 💡 **Port & routing note**: the public site (`3000`) and the admin (`3001`) each run on their own Vite dev server; both proxy API calls transparently to the backend on `8000`. In production these ports collapse onto Caddy's `80/443`, which fans out by path (see "Architecture" section).

### Docker one-command deploy

> ⚠️ **Docker deployment is not stable yet — stay tuned.**
>
> `Dockerfile.app` / `Dockerfile.caddy` / `docker-compose.yml` / `deploy.sh` are still being polished and haven't cleared full end-to-end validation. **Not recommended** for production or personal servers just yet.
>
> - CI (the `docker-build` job in `.github/workflows/ci.yml`) only guarantees that **the images build successfully** — it does not guarantee full runtime functionality.
> - Known rough edges are still being ironed out (build ordering, static file injection, ACME cert issuance, healthchecks, …) — see the [Docker troubleshooting](#-docker-troubleshooting) section.
> - If you need to self-host today, please prefer [Option B: MariaDB](#option-b-mariadb-production-style) and run the Node process directly with PM2 or systemd.
>
> The Docker docs below are kept as a design reference and this notice will be removed once things stabilize.

> **Windows users**: `deploy.sh` requires a bash environment. Use [WSL2](https://learn.microsoft.com/windows/wsl/install) or [Git Bash](https://git-scm.com/downloads).

```bash
# Wizard mode — asks for the important settings, auto-generates the rest
bash deploy.sh

# Skip the domain prompt (rest stays interactive)
# Replace <your-domain> with your domain or IP, e.g. example.com
DOMAIN=<your-domain> bash deploy.sh

# CI fully-automated mode (zero interaction)
CI=true bash deploy.sh
```

The script walks you through:

1. **Domain** — enter a domain or IP
2. **HTTPS cert email** — required for real domains; leave blank to let Caddy auto-generate
3. **Email notifications (SMTP)** — optional, built-in shortcuts for QQ / 163 / Gmail, just paste the app password
4. **Admin account** — auto-generate / customize / leave blank and create in the web UI

> 💡 It's fine to skip SMTP for now — password reset links will fall back to `docker logs`.

After deployment (only ports 80/443 are exposed):

| Service | URL |
|------|------|
| ⚙️ Admin (default entry) | `http(s)://your-domain/` (auto-redirects to `/admin/`) |
| 🖥 Public site | `http(s)://your-domain/site/` |

> 💡 When deployed with a real domain, HTTPS is enabled automatically and Caddy handles renewals. Swagger is disabled in production.

#### Manual deploy (without `deploy.sh`)

```bash
# 1. Create env file
cp .env.docker.example .env.docker
# Edit .env.docker — fill in domain, secrets and passwords (all passwords are required, no weak defaults)

# 2. Build images (app first, then caddy — caddy extracts static files from the app image)
#    ⚠️ Don't run `docker compose build` in parallel — caddy needs `homepage-app:latest`,
#    parallel builds will fail because the image doesn't exist yet.
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker build caddy

# 3. First boot (with DB migration)
docker compose --env-file .env.docker up -d homepage-db
sleep 10  # wait for DB to be ready
docker compose --env-file .env.docker run --rm app npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:run -d data-source.ts
docker compose --env-file .env.docker up -d

# 4. Subsequent boots
docker compose --env-file .env.docker up -d
```

#### About the images

> ⚠️ These images are for self-hosting only and are **not published to Docker Hub**. Build them yourself.

| Image | Dockerfile | Contents | Size |
|------|-----------|------|------|
| `homepage-app` | `Dockerfile.app` | NestJS backend (`pnpm deploy --prod`, production deps only) | ~80–120 MB |
| `homepage-caddy` | `Dockerfile.caddy` | Caddy 2 + bundled frontend/admin static files | ~50 MB |

#### ZeroSSL vs. Let's Encrypt

| | ZeroSSL | Let's Encrypt |
|--|---------|---------------|
| Access from mainland China | ✅ works | ❌ often blocked |
| Free tier | ✅ | ✅ |
| Cert lifetime | 90 days | 90 days |
| Auto-renewal | ✅ built into Caddy | ✅ built into Caddy |

> 💡 **Recommended**: ZeroSSL (default) for deployments in mainland China; Let's Encrypt for overseas. Switch by setting `ACME_CA` in `.env.docker` — no code changes required.

---

## 📂 Directory layout

```
homepage/
├── apps/
│   ├── frontend/            # public site (Vue 3 + UnoCSS)
│   │   └── src/
│   │       ├── views/       # page components
│   │       ├── stores/      # Pinia stores
│   │       └── api/         # axios wrappers
│   ├── admin/               # admin dashboard (Vue 3 + Ant Design Vue)
│   │   └── src/
│   │       ├── views/       # dashboard / config / audit
│   │       ├── stores/      # auth / tabs / theme
│   │       └── router/      # route guards + init detection
│   └── backend/             # API service (NestJS)
│       └── src/
│           ├── auth/        # auth module (JWT + bcrypt)
│           ├── config/      # site config CRUD + avatar upload
│           ├── audit/       # audit log
│           └── users/       # user entity
├── scripts/                 # deploy & ops scripts
│   ├── deploy.sh            # one-command deploy
│   ├── build.sh             # build
│   ├── update.sh            # update
│   ├── smoke-test.sh        # smoke test
│   ├── docker-health.sh     # Docker healthcheck
│   ├── domain-check.sh      # domain verification
│   └── backup-db.sh         # DB backup
├── config/                  # configs
│   └── ecosystem.config.cjs # PM2 for production
├── docs/                    # documentation
│   ├── deployment.md
│   ├── architecture.md
│   ├── api.md
│   ├── dev-guide.md
│   ├── progress.md
│   └── technology-selection.md
├── image/                   # asset images
├── Caddyfile                # reverse-proxy config (dev / intranet)
├── Caddyfile.docker         # Caddy config (baked into the Caddy image)
├── caddy-entrypoint.sh      # Caddy entrypoint (handles empty ACME_EMAIL)
├── Dockerfile.app           # backend API image
├── Dockerfile.caddy         # Caddy + static files image
├── docker-compose.yml       # Docker orchestration (app + mariadb + caddy)
├── .env.docker.example      # Docker env template
└── pnpm-workspace.yaml
```

---

## 🛠 Common commands

```bash
# ---- local dev ----
pnpm dev              # start everything in parallel
pnpm dev:backend      # backend only :8000
pnpm dev:frontend     # public site only :3000
pnpm dev:admin        # admin only :3001

pnpm build            # build everything

pnpm lint             # lint
pnpm format           # format all files

# ---- Docker deploy ----
bash scripts/deploy.sh        # one-command deploy (wizard mode)
CI=true bash scripts/deploy.sh  # one-command deploy (fully automated)
docker compose --env-file .env.docker ps     # service status
docker compose --env-file .env.docker logs -f caddy  # Caddy logs
docker compose --env-file .env.docker logs -f app    # backend logs
docker compose --env-file .env.docker down   # stop all services

# ---- smoke test & healthcheck ----
bash scripts/smoke-test.sh              # smoke test (defaults to localhost)
bash scripts/smoke-test.sh your-domain  # against a specific domain
bash scripts/docker-health.sh           # check Docker service health
bash scripts/domain-check.sh            # domain & performance verification
```

---

## 🔒 Security

- **JWT_SECRET** is validated on startup (length ≥ 20, must not be the default placeholder — otherwise the server refuses to start).
- Passwords hashed with **bcrypt at 12 rounds**; admin default and custom passwords are both ≥ 12 characters.
- **helmet** security headers: CSP, HSTS (max-age: 1 year), crossOrigin policies.
- **API rate limits**: 120 req/min globally, 5 req/min on the login endpoint.
- **Request body limit**: 1 MB (mitigates large-payload attacks).
- **DB password required**: every password field in Docker deploys is mandatory — no weak defaults.
- **Swagger disabled in production**: API docs are dev-only.
- Avatar upload: MIME + sharp metadata dual-verified, only `jpg/png/gif/webp`, ≤ 5 MB, normalized to 200×200 WebP.
- `.env` / `.env.docker` are gitignored.

---

## 🔧 Docker troubleshooting

### Common issues

| Symptom | Cause | Fix |
|------|------|----------|
| Caddy fails to start | Port 80/443 occupied | `netstat -tlnp \| grep :80` to find the process |
| Build OOM (exit 137) | < 2 GB RAM | Dockerfile already tuned for low-memory builds |
| DB connection fails | MariaDB not ready yet | Wait for the healthcheck before hitting the API |
| HTTPS cert issuance fails | DNS not resolved / ACME rate-limited | Check your A record; wait a few minutes and retry |
| Static files 404 | Caddy image missing the frontend | Build order matters: `docker compose build app` first, then `build caddy` |

### Redeploy

```bash
# Full redeploy (keep data)
bash update.sh

# Wipe all data and redeploy
docker compose --env-file .env.docker down -v
rm -f .env.docker
bash deploy.sh
```

---

## 💾 Backup

The database is persisted in the Docker named volume `mariadb_data`, so container recreation is safe.

### Manual backup

```bash
bash scripts/backup-db.sh           # back up into ./backups/
bash scripts/backup-db.sh /tmp      # custom output directory
```

### Cron

```bash
# Daily at 02:00, keep the last 7 days
0 2 * * * cd /path/to/homepage && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1
```

### Restore

```bash
gunzip -c ./backups/homepage_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i homepage-db mariadb -u homepage -p'***' homepage
```

---

## 📖 Documentation

> 📁 Full index in [`docs/README.en.md`](./docs/README.en.md).

| Doc | About |
|------|------|
| [Deployment guide](./docs/deployment.en.md) | Docker one-command deploy, manual deploy, local dev, env vars |
| [Architecture](./docs/architecture.en.md) | Overall architecture, data flow, module split |
| [API](./docs/api.en.md) | Endpoint reference (Swagger UI also available in dev) |
| [Dev guide](./docs/dev-guide.en.md) | Local dev workflow, FAQ |
| [Tech choices](./docs/technology-selection.en.md) | Stack list and rationale |
| [Progress](./docs/progress.en.md) | Version milestones and feature history |

---

## 🗺 Routes

| URL | Purpose | Auth required |
|-----|------|--------------|
| `/` | Visitor landing page | ❌ |
| `/admin/setup` | First-run wizard (create admin) | ❌ |
| `/admin/` | Admin login | ❌ |
| `/admin/dashboard` | Dashboard | ✅ |
| `/admin/config` | Site config (profile / quick links / stack / plans) | ✅ |
| `/admin/audit` | Audit log | ✅ |
| `/admin/account` | Account settings (password / email) | ✅ |
| `/api/*` | Backend REST API | partial |
| `/health` | Health endpoint | ❌ |

---

## 🔍 SEO note

This is a **CSR (client-side rendered)** SPA. Basic SEO meta tags are baked in:

- `<meta name="description">` / `<meta name="keywords">`
- Open Graph (`og:title`, `og:description`, `og:type`)
- Twitter Cards
- JSON-LD structured data (Person schema)

> **Caveat**: since it is CSR, crawlers can only read the static meta in `index.html` and won't see Vue-rendered content. For richer SEO, consider adopting Nuxt / Next for SSR, or a prerender pipeline.

---

## 🤝 Contributing

All kinds of contributions are welcome — bug reports, feature ideas, code.

### Workflow

1. **Fork** the repository
2. Create a feature branch from `main`: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push and open a **Pull Request**

### Conventions

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
- Frontend uses the Composition API with `<script setup lang="ts">`.
- Backend follows NestJS best practices (Module → Controller → Service → DTO).
- Run `pnpm lint` before committing to keep style consistent.

---

## 📄 License

[MIT License](./LICENSE).

---

## 🙏 Credits

This project stands on the shoulders of many outstanding open source projects. Sincere thanks to the following authors and communities:

### Frontend stack

- [Vue 3](https://vuejs.org) · [Vite](https://vitejs.dev) · [Vue Router](https://router.vuejs.org) · [Pinia](https://pinia.vuejs.org) — progressive framework and state management
- [UnoCSS](https://unocss.dev) — instant on-demand atomic CSS engine
- [Ant Design Vue](https://antdv.com) — admin forms, tables and modals
- [ECharts](https://echarts.apache.org) — dashboard data visualization
- [Iconify](https://iconify.design) / [@iconify/vue](https://github.com/iconify/iconify) — unified access to 200k+ icons
- [VueUse](https://vueuse.org) — Composition API utilities
- [Axios](https://axios-http.com) — HTTP client
- [Day.js](https://day.js.org) — lightweight date library

### Backend stack

- [NestJS](https://nestjs.com) — progressive Node.js server framework
- [TypeORM](https://typeorm.io) — ORM and migrations
- [MariaDB](https://mariadb.org) / [sql.js](https://sql.js.org) — MariaDB in production, SQLite for dev
- [Passport](https://www.passportjs.org) · [@nestjs/jwt](https://github.com/nestjs/jwt) · [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — JWT auth and password hashing
- [class-validator](https://github.com/typestack/class-validator) / [class-transformer](https://github.com/typestack/class-transformer) — DTO validation and serialization
- [helmet](https://helmetjs.github.io) · [@nestjs/throttler](https://github.com/nestjs/throttler) — security headers and rate limiting
- [sharp](https://sharp.pixelplumbing.com) — avatar cropping and WebP conversion
- [Multer](https://github.com/expressjs/multer) · [file-type](https://github.com/sindresorhus/file-type) — file upload and MIME verification
- [Nodemailer](https://nodemailer.com) — password reset emails
- [Swagger / OpenAPI](https://swagger.io) · [@nestjs/swagger](https://github.com/nestjs/swagger) — API docs in development

### Deployment & infrastructure

- [Docker](https://www.docker.com) / [Docker Compose](https://docs.docker.com/compose/) — container orchestration
- [Caddy](https://caddyserver.com) — reverse proxy and static file server with automatic HTTPS
- [ZeroSSL](https://zerossl.com) · [Let's Encrypt](https://letsencrypt.org) — free ACME certificate authorities
- [PM2](https://pm2.keymetrics.io) — process manager for non-Docker deploys

### Tooling

- [pnpm](https://pnpm.io) — monorepo package manager with hard-link speedups
- [TypeScript](https://www.typescriptlang.org) — full-stack type safety
- [ESLint](https://eslint.org) · [Prettier](https://prettier.io) — linting and formatting
- [Jest](https://jestjs.io) · [Supertest](https://github.com/ladjs/supertest) — unit and E2E tests
- [Conventional Commits](https://www.conventionalcommits.org/) — commit message convention
- [GitHub Actions](https://github.com/features/actions) — continuous integration
- [Shields.io](https://shields.io) — README badges

### Special thanks

- Everyone who has filed issues, opened PRs, shared screenshots or dropped feedback — every conversation makes this project a little better.
- The open source community, for freely sharing so much good work. This project gives back under the [MIT License](./LICENSE) in the same spirit.

> If this project helps you, please consider leaving a ⭐ Star — it's the best encouragement for the author.
