<p align="center">
  <img src="image/logo.png" alt="Homepage" width="200" height="200" />
</p>

<h1 align="center">Dageling003-Homepage</h1>

<p align="center">
  A lightweight, self-hostable personal homepage with a visual admin dashboard — drive your homepage with forms, no hard-coded JSON.
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
- **Stack**: Vue 3 + Vite for the public site & admin · NestJS 11 + TypeORM API · MariaDB / SQLite dual data source · Caddy reverse proxy with automatic HTTPS
- **Delivery**: pnpm monorepo (frontend / admin / backend) + Docker Compose with three services (app / caddy / mariadb)

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
- **JWT + bcrypt**: 12-round hashing, stateless sessions, route guards, `JWT_SECRET` enforced at boot
- **Audit log**: every config change persisted; filter by operator / time / module
- **Avatar upload**: MIME + sharp metadata double check, normalized to 200×200 WebP
- **Smart form helpers**: birthday → auto age & zodiac; 34-province picker + searchable 2909-school list
- **First-run wizard**: `/admin/setup` walks new deployments through creating the admin account and configuring the whole site
- **Password reset**: SMTP email; falls back to `docker logs` when SMTP is not configured
- **One-shot deploy**: `bash scripts/deploy.sh` wizard → `docker compose up -d --build`, automatic HTTPS (ZeroSSL default, works from China)
- **Production hardening**: helmet headers + API rate limiting + 1 MB body limit + Swagger disabled in production

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
                  ▼ [backend network]
                MariaDB (:3306)
```

| Package | Stack | Dev port | Public path |
|---------|-------|----------|-------------|
| `apps/frontend` | Vue 3.5 + Vite 8 + UnoCSS + Pinia | `3000` | `/` |
| `apps/admin` | Vue 3.5 + Ant Design Vue 4 + ECharts | `3001` | `/admin/*` |
| `apps/backend` | NestJS 11 + TypeORM + MariaDB/SQLite + JWT | `8000` | `/api/*` |

> Static HTML/JS/CSS is served by Caddy directly — Node only handles API traffic.

---

## 🚀 Quick start

### Prerequisites

- Node.js ≥ 22.13.0
- pnpm ≥ 11.0.0
- MariaDB ≥ 10.5 (production only; local dev can use SQLite with zero setup)

### Local dev (SQLite, no database needed)

```bash
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
pnpm install
cp apps/backend/.env.example apps/backend/.env
# Edit .env: set DB_TYPE=sqlite, JWT_SECRET (≥20 chars), DEFAULT_ADMIN_PASSWORD (≥12 chars)
pnpm dev
```

All three servers run in parallel:

| Service | URL |
|---------|-----|
| Public site | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Swagger | http://localhost:8000/api/docs |

Use `pnpm dev:backend` / `pnpm dev:frontend` / `pnpm dev:admin` for isolated logs in separate windows.

### Local dev (MariaDB)

```bash
mysql -u root -p -e "CREATE DATABASE \`homepage\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cp apps/backend/.env.example apps/backend/.env  # fill DB_* and JWT_SECRET
pnpm migrate:run
pnpm dev
```

Generate a new migration:

```bash
cd apps/backend
npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:generate -d data-source.ts src/migrations/$(date +%s)-Name
```

---

## 🐳 Docker deployment

**Zero-experience walkthrough** → [docs/deploy-beginner.md](./docs/deploy-beginner.md)
**Full reference** → [docs/deployment.md](./docs/deployment.md)

### Wizard deploy (recommended)

```bash
bash scripts/deploy.sh                          # interactive
DOMAIN=your-domain.com bash scripts/deploy.sh   # skip the domain prompt
CI=true bash scripts/deploy.sh                  # non-interactive (CI/CD)
```

The wizard collects **domain / IP → ACME email → SMTP (optional) → admin password (auto / custom / empty)**, writes `.env.docker`, then a single command boots everything:

```bash
docker compose --env-file .env.docker up -d --build
```

### Manual deploy

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
# Dev
pnpm dev / dev:backend / dev:frontend / dev:admin
pnpm build
pnpm lint
pnpm format

# Docker
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f app
docker compose --env-file .env.docker restart app
docker compose --env-file .env.docker down

# Backup / update / smoke
bash scripts/backup-db.sh [output_dir]
bash scripts/update.sh
bash scripts/smoke-test.sh [domain]
bash scripts/docker-health.sh
bash scripts/domain-check.sh
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

- `JWT_SECRET` enforced at boot (≥20 chars, no placeholder default)
- Passwords hashed with bcrypt 12 rounds; admin password ≥12 chars
- helmet: CSP / HSTS 1y / cross-origin policies
- Rate limits: 120 req/min global, 5 req/min on login
- 1 MB request body cap
- Avatar upload: MIME + sharp metadata double check, normalized to 200×200 WebP, ≤5 MB
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

MariaDB persists to the named volume `mariadb_data`.

```bash
bash scripts/backup-db.sh                # → ./backups/
bash scripts/backup-db.sh /tmp           # custom directory

# Cron: daily at 02:00
0 2 * * * cd /path/to/homepage && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1

# Restore
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

- **Frontend**: Vue 3 · Vite · Pinia · UnoCSS · Ant Design Vue · ECharts · Iconify · VueUse · Axios · Day.js
- **Backend**: NestJS · TypeORM · MariaDB / sql.js · Passport · @nestjs/jwt · bcryptjs · class-validator · helmet · @nestjs/throttler · sharp · Multer · Nodemailer · Swagger
- **Ops**: Docker · Caddy · ZeroSSL / Let's Encrypt · PM2
- **Tooling**: pnpm · TypeScript · ESLint · Prettier · Jest · Supertest · GitHub Actions

If this project helped you, please leave a ⭐.
