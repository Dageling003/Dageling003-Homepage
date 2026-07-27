<p align="center">
  <img src="image/logo.png" alt="Homepage" width="200" height="200" />
</p>

<h1 align="center">Dageling003-Homepage</h1>

<p align="center">
  Standing on the shoulders of <a href="https://github.com/QNquenan/Simple-Homepage">Simple-Homepage</a> — keeping the minimalist homepage DNA, adding a <strong>visual admin dashboard</strong> so editing your homepage becomes a few clicks instead of hand-editing JSON.
</p>

<p align="center">
  <a href="./README.md">简体中文</a> · <strong>English</strong>
</p>

<p align="center">
  <a href="https://github.com/Dageling003/Dageling003-Homepage/releases"><img src="https://img.shields.io/github/v/release/Dageling003/Dageling003-Homepage?display_name=tag&sort=semver&label=release" alt="Latest Release" /></a>
  <a href="https://dageling003.top/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fdageling003.top%2F&up_message=online&down_message=offline&label=demo" alt="Live Demo" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%E2%89%A522.13-339933?logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-%E2%89%A511-F69220?logo=pnpm&logoColor=white" alt="pnpm" /></a>
  <a href="https://nestjs.com"><img src="https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS" /></a>
  <a href="https://vuejs.org"><img src="https://img.shields.io/badge/vue-3.5-4FC08D?logo=vuedotjs&logoColor=white" alt="Vue" /></a>
  <a href="./docker-compose.yml"><img src="https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white" alt="Docker" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License" /></a>
</p>

- **Live preview**: <https://dageling003.top/> (fall back to in-repo screenshots when the badge shows offline)
- **Stack**: Vue 3 + Vite for the public site & admin · NestJS 11 + TypeORM API · SQLite (default) / MariaDB (optional) · Caddy reverse proxy with automatic HTTPS
- **Delivery**: pnpm monorepo (frontend / admin / backend) + Docker Compose with 2 services by default (app + caddy); MariaDB is opt-in via `--profile mariadb`

---

## 💡 Origin: why another "personal homepage"

I just wanted to build my own homepage. Then I found [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage) — great taste, dead-simple to deploy. But two things kept getting in the way:

1. **Editing means touching JSON**: swap an avatar, add a link, tweak a tagline → open the editor, hand-edit the config, redeploy
2. **No "admin" layer**: multi-user, multi-device, quick edits are all awkward, and there is no record of who changed what and when

So I decided to rebuild along the same idea: **keep the homepage aesthetic, turn "config" into a product.**

| Dimension | Simple-Homepage | Dageling003-Homepage |
|-----------|-----------------|----------------------|
| Homepage form | Minimalist single page · static | Minimalist single page · dynamic |
| Content management | Hand-edit JSON + redeploy | Visual admin forms, edits go live instantly |
| Tech stack | Pure static | Full-stack Vue 3 + NestJS (frontend / admin / API) |
| Data storage | None (config hard-coded) | SQLite (default, single file) / MariaDB (optional), audit trail included |
| Deployment | Static hosting | One-shot Docker Compose + automatic HTTPS |
| Security | Not needed | JWT + bcrypt + helmet + rate limiting |

The iteration path was equally plain: **get the full stack running → migrate to my familiar Vue 3 toolchain → iterate on UI polish → add audit log / setup wizard / password reset and other production hardening**. That is why this repo carries both a minimalist homepage DNA and a full self-hostable admin product.

> Want **a 5-minute static homepage online**? Simple-Homepage is enough — go give it a ⭐.<br />
> Want **a long-lived, multi-user, visually-managed homepage**? Read on.

---

## 📸 Screenshots

> Personal data (name, region, school, birthday, …) is replaced with sample placeholders.

<table>
  <tr>
    <td width="50%" align="center">
      <strong>Desktop · Light</strong><br />
      <img src="image/screenshots/01-homepage.png" alt="Homepage Light" />
    </td>
    <td width="50%" align="center">
      <strong>Desktop · Dark</strong><br />
      <img src="image/screenshots/06-homepage-dark.png" alt="Homepage Dark" />
    </td>
  </tr>
  <tr>
    <td align="center">
      <strong>Mobile · Light</strong><br />
      <img src="image/screenshots/02-homepage-mobile.png" alt="Homepage Mobile" width="280" />
    </td>
    <td align="center">
      <strong>Mobile · Dark</strong><br />
      <img src="image/screenshots/07-homepage-mobile-dark.png" alt="Homepage Mobile Dark" width="280" />
    </td>
  </tr>
</table>

---

## ✨ Features

- **Public site**: light/dark theme, typewriter greeting, time-progress bars, responsive layout (≥1024px three-column / <1024px single-column)
- **Visual admin**: Ant Design Vue forms for profile / quick links / tech stack / plans / typewriter text — no code required
- **JWT + bcrypt**: newbie-friendly defaults (bcrypt=10, JWT ≥16 chars, password ≥8 chars), all bumpable via env vars
- **Avatar upload**: MIME + magic-bytes double check, normalized to 200×200 WebP
- **Smart form helpers**: birthday → auto age & zodiac; 34-province picker
- **First-run wizard**: `/admin/setup` walks new deployments through creating the admin account and configuring the whole site
- **One-shot deploy**: `bash scripts/deploy.sh` wizard → `docker compose up -d --build`, automatic HTTPS (ZeroSSL default, works from China)
- **Minimal by default**: SQLite single-file persistence (no MariaDB container); heavyweight features (rate limiting / strict CSP / audit / password reset / PWA / ambient background) are **all disabled by default** — flip an env var to opt-in

### Optional feature flags (all off by default)

Backend `.env.docker`:

| Var | Purpose |
|-----|---------|
| `AUDIT_ENABLED=true` | Audit log: login / password change / config change persisted; UI shows the "Audit" entry |
| `PASSWORD_RESET_ENABLED=true` | Forgot password + SMTP: needs `SMTP_*` filled to actually mail |
| `THROTTLE_ENABLED=true` | Global 120/min rate limit (login endpoint hard-capped at 5/min always) |
| `SECURITY_HEADERS_STRICT=true` | Strict CSP + HSTS preload + COEP (default off: iframes / cross-origin allowed) |
| `BCRYPT_ROUNDS=12` `MIN_PASSWORD_LENGTH=12` `MIN_JWT_LENGTH=20` | Bump security thresholds |
| `DB_TYPE=mariadb` | Use MariaDB instead of default SQLite (also `docker compose --profile mariadb up`) |

Admin (`apps/admin/.env`): `VITE_AUDIT_ENABLED` / `VITE_PASSWORD_RESET_ENABLED`

Public site (`apps/frontend/.env`): `VITE_PWA_ENABLED` / `VITE_AMBIENT_ENABLED` (frosted-glass orbs + grain)

---

## 🏗 Architecture

```
                Caddy (80/443, automatic HTTPS)
                  │
                  ├── /              → public site static files
                  ├── /admin/*       → admin static files
                  ├── /api/*         → proxy to app:8000
                  └── /health        → health probe
                  │
                  ▼ [frontend network]
                NestJS API (:8000)
                  │
                  ▼ SQLite single file (default, mounted as app_data volume)
                   or MariaDB (advanced: `docker compose --profile mariadb up`)
```

| Package | Stack | Dev port | Public path |
|---------|-------|----------|-------------|
| `apps/frontend` | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `3000` | `/` |
| `apps/admin` | Vue 3.5 + Ant Design Vue 4 + ECharts | `3001` | `/admin/*` |
| `apps/backend` | NestJS 11 + TypeORM + SQLite/MariaDB + JWT | `8000` | `/api/*` |

> Static HTML/JS/CSS is served by Caddy directly — Node only handles API traffic.

---

## 🚀 Quick start

### One-liner (production / fresh server)

```bash
curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh | bash
```

The script will: **check Docker/git** → **clone the repo** → **run the wizard** (domain / SMTP / admin password) → **build images** → **spin up containers** → **smoke test** → **print URLs**.

Skip all prompts (CI / fully automated):

```bash
curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh \
  | CI=true DOMAIN=your-domain.com bash
```

If you already `git clone`d:

```bash
make up          # = bash scripts/deploy.sh
make logs        # tail logs
make down        # stop
make backup      # back up database
make update      # pull latest + rebuild (keeps data)
```

### Prerequisites

- Server: any Linux with Docker (≥ 512 MB RAM, SQLite mode; ≥ 2 GB for MariaDB)  
- Ports 80 / 443 free  
- Local dev additionally needs: Node.js ≥ 22.13 · pnpm ≥ 11

### Local dev (SQLite, no database needed)

```bash
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
pnpm install
cp apps/backend/.env.example apps/backend/.env
# Edit .env: DB_TYPE=sqlite (default), set JWT_SECRET (≥16 chars) and DEFAULT_ADMIN_PASSWORD (≥8 chars)
pnpm dev
```

All three servers run in parallel:

| Service | URL |
|---------|-----|
| Public site | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Swagger | http://localhost:8000/api/docs |

Use `pnpm dev:backend` / `pnpm dev:frontend` / `pnpm dev:admin` for isolated logs in separate windows.

> Want MariaDB for local dev? That is the advanced path (99% of personal-homepage users don't need it). Steps live in [docs/deployment.md → Local development](./docs/deployment.md#本地开发部署).

---

## 🐳 Docker deployment

**Zero-experience walkthrough** → [docs/deploy-beginner.md](./docs/deploy-beginner.md)
**Full reference** → [docs/deployment.md](./docs/deployment.md)

### Three entry points — pick any

```bash
# 1. Remote one-liner (recommended, works on a bare server)
curl -fsSL https://raw.githubusercontent.com/Dageling003/Dageling003-Homepage/main/scripts/install.sh | bash

# 2. Already cloned
make up

# 3. Classic script
bash scripts/deploy.sh
DOMAIN=your-domain.com bash scripts/deploy.sh   # skip domain prompt
CI=true bash scripts/deploy.sh                  # non-interactive (CI/CD)
```

All three converge on the same deploy wizard: **domain / IP → ACME email → SMTP (optional) → admin password**, writes `.env.docker`, then automatically runs `up -d --build`.

### Manual deploy (skip the wizard, fill .env yourself)

```bash
cp docker/.env.example .env.docker
# Edit .env.docker (DOMAIN / JWT_SECRET / DB_* passwords are required)

docker compose --env-file .env.docker build app     # build app first
docker compose --env-file .env.docker build caddy   # caddy depends on the static files baked into the app image
docker compose --env-file .env.docker up -d
```

### Images

| Image | Dockerfile | Size |
|-------|-----------|------|
| `homepage-app` | `docker/Dockerfile.app` (distroless + prod-only deps) | ~120 MB |
| `homepage-caddy` | `docker/Dockerfile.caddy` (Caddy 2 + baked-in static files) | ~50 MB |

Not published to Docker Hub — build locally.

### HTTPS certificate

Caddy handles issuance and renewal. Defaults to ZeroSSL (works from mainland China); switch to Let's Encrypt if you prefer:

```dotenv
# .env.docker
ACME_CA=https://acme-v02.api.letsencrypt.org/directory
```

---

## 🛠 Common commands

```bash
# Makefile (recommended)
make help        # list every target
make up          # deploy / start
make down        # stop
make logs        # tail logs
make backup      # dump the database
make update      # pull latest + rebuild (keeps data)
make dev         # local pnpm three-in-one

# Raw pnpm
pnpm dev / dev:backend / dev:frontend / dev:admin
pnpm build
pnpm lint
pnpm format

# Raw docker compose
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f app
docker compose --env-file .env.docker restart app
docker compose --env-file .env.docker down

# Standalone scripts (6 core scripts)
bash scripts/install.sh          # remote one-liner
bash scripts/install-docker.sh   # install Docker only
bash scripts/deploy.sh           # deploy wizard
bash scripts/update.sh           # update
bash scripts/backup-db.sh        # backup (auto-detects SQLite / MariaDB)
bash scripts/smoke-test.sh       # smoke tests
```

---

## 📂 Project layout

```
├── apps/
│   ├── frontend/            # Vue 3 + UnoCSS
│   ├── admin/               # Vue 3 + Ant Design Vue + ECharts
│   └── backend/             # NestJS (auth / config / audit / users)
├── docker/
│   ├── Dockerfile.app       # backend API image
│   ├── Dockerfile.caddy     # Caddy + baked-in frontend/admin
│   └── .env.example
├── caddy/
│   ├── Caddyfile            # production (baked into image)
│   ├── Caddyfile.dev        # dev / intranet reverse proxy
│   └── entrypoint.sh
├── scripts/                 # deploy / build / update / backup-db / smoke-test / ...
├── docs/                    # deployment / architecture / API / dev guide / tech selection / changelog
├── docker-compose.yml
└── pnpm-workspace.yaml
```

---

## 🔒 Security

**Defaults are newbie-friendly**; bump via env vars any time:

- `JWT_SECRET` enforced at boot (≥16 chars by default, non-placeholder; tune with `MIN_JWT_LENGTH`)
- Password bcrypt 10 rounds (tune with `BCRYPT_ROUNDS`); password ≥8 chars (`MIN_PASSWORD_LENGTH`)
- helmet: strict CSP / COEP / HSTS preload disabled by default; opt-in with `SECURITY_HEADERS_STRICT=true`
- Rate limits: login hard-capped at 5 req/min; global 120 req/min needs `THROTTLE_ENABLED=true`
- 1 MB request body cap
- Avatar upload: MIME + magic-bytes double check, normalized to 200×200 WebP, ≤5 MB
- Swagger disabled in production
- `.env` / `.env.docker` are git-ignored

---

## 🔧 Troubleshooting

| Symptom | Common cause | Fix |
|---------|--------------|-----|
| `homepage-app is unhealthy` → dependency failed to start | `JWT_SECRET` missing / DB password mismatch / stale CMD path (pre-fix builds) | `docker logs homepage-app --tail 100`; see [deploy-beginner.md](./docs/deploy-beginner.md) §10 |
| Caddy fails to start | Port 80/443 already in use | `ss -tlnp \| grep -E ':(80\|443)\b'` |
| MariaDB image pull fails | Docker Hub blocked in China | Configure a registry mirror or point `MARIADB_IMAGE=` to Tsinghua / USTC mirror |
| Build OOM (exit 137) | Host has <2 GB RAM | Add swap or resize the VM |
| HTTPS certificate fails | DNS not propagated / port 80 blocked / empty ACME email | Verify A record + firewall, or switch to Let's Encrypt |
| Static files return 404 | Caddy image built without the frontend baked in | You **must** build `app` **before** `caddy` |

Nuke & pave:

```bash
# Keep data
bash scripts/update.sh

# Wipe everything
docker compose --env-file .env.docker down -v
rm -f .env.docker
bash scripts/deploy.sh
```

---

## 💾 Data backup

`scripts/backup-db.sh` auto-detects `DB_TYPE` in `.env.docker`:

- `DB_TYPE=sqlite` (default) → `docker cp` the `.sqlite` file out of the app container + gzip
- `DB_TYPE=mariadb` → `docker exec ... mariadb-dump | gzip`

```bash
bash scripts/backup-db.sh                # → ./backups/
bash scripts/backup-db.sh /tmp           # custom directory

# Cron: daily at 02:00
0 2 * * * cd /path/to/homepage && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1

# Restore (SQLite)
gunzip -c ./backups/homepage_YYYYMMDD_HHMMSS.sqlite.gz > /tmp/homepage.sqlite
docker cp /tmp/homepage.sqlite homepage-app:/app/data/homepage.sqlite
docker compose --env-file .env.docker restart app

# Restore (MariaDB)
gunzip -c ./backups/homepage_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i homepage-db mariadb -u homepage -p'***' homepage
```

---

## 🗺 Routes

| URL | Purpose | Auth required |
|-----|---------|---------------|
| `/` | Visitor homepage | ❌ |
| `/admin/setup` | First-run wizard | ❌ |
| `/admin/` | Admin login | ❌ |
| `/admin/dashboard` | Dashboard | ✅ |
| `/admin/config` | Site configuration | ✅ |
| `/admin/audit` | Audit log | ✅ |
| `/admin/account` | Account settings | ✅ |
| `/api/*` | RESTful API | Partial |
| `/health` | Health probe | ❌ |

---

## 📖 Docs

Full index in [`docs/README.md`](./docs/README.md).

| Doc | Purpose |
|-----|---------|
| [CHANGELOG.md](./CHANGELOG.md) | Version history (Keep a Changelog format) |
| [SECURITY.md](./SECURITY.md) | Security policy: reporting channel / SLA / baseline controls |
| [ROADMAP.md](./ROADMAP.md) | Product roadmap: short / mid / long term + non-goals |
| [deploy-beginner.md](./docs/deploy-beginner.md) | Zero-experience walkthrough (30 min to production, with a troubleshooting cookbook) |
| [deployment.md](./docs/deployment.md) | Full deployment reference |
| [architecture.md](./docs/architecture.md) | Architecture |
| [api.md](./docs/api.md) | API index |
| [dev-guide.md](./docs/dev-guide.md) | Development guide |
| [technology-selection.md](./docs/technology-selection.md) | Tech-stack rationale |
| [progress.md](./docs/progress.md) | Version milestones |

Every doc ships in both `.md` (Chinese) and `.en.md` (English); local integration/test reports live under `docs/log/`.

---

## 🔍 SEO

The site is a CSR SPA. `index.html` ships `<meta description/keywords>`, Open Graph, Twitter Cards, and JSON-LD `Person` schema — but crawlers cannot see Vue-rendered content. If you need SSR/prerender, layer Nuxt or a prerender service on top.

---

## 🤝 Contributing

Flow and conventions live in [`CONTRIBUTING.en.md`](./CONTRIBUTING.en.md) (Skill system and AI-agent notes included).

1. Fork → branch off as `feat/xxx`
2. Follow [Conventional Commits](https://www.conventionalcommits.org/)
3. Run `pnpm lint` before opening a PR

---

## 📄 License

[MIT License](./LICENSE)

---

## 🙏 Acknowledgements

- **Inspiration**: [QNquenan/Simple-Homepage](https://github.com/QNquenan/Simple-Homepage) — the seed of this project; the homepage aesthetic and the "minimalist single page" idea both sprouted from here
- **Frontend**: Vue 3 · Vite · Pinia · UnoCSS · Ant Design Vue · ECharts · Iconify · VueUse · Axios · Day.js
- **Backend**: NestJS · TypeORM · better-sqlite3 (default) / mariadb driver (optional) · Passport · @nestjs/jwt · bcryptjs · class-validator · helmet · @nestjs/throttler · sharp · Multer · Nodemailer · Swagger
- **Ops**: Docker · Caddy · ZeroSSL / Let's Encrypt · PM2
- **Tooling**: pnpm · TypeScript · ESLint · Prettier · Jest · Supertest · GitHub Actions

If this project helped you, please leave a ⭐.
