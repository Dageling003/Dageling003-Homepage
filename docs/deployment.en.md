# Deployment Guide

<p align="right">
  <a href="./deployment.md">简体中文</a> · <strong>English</strong>
</p>

This document covers every supported way to deploy Homepage: quick setup, Docker one-command deploy, manual Docker deploy, and local dev.

## Table of contents

- [Prerequisites](#prerequisites)
- [Quick deploy (recommended)](#quick-deploy-recommended)
  - [Run the wizard](#run-the-wizard)
  - [Start the stack](#start-the-stack)
- [Docker one-command deploy](#docker-one-command-deploy)
  - [Wizard mode](#wizard-mode)
  - [CI fully-automated mode](#ci-fully-automated-mode)
  - [Skipping the domain prompt](#skipping-the-domain-prompt)
- [Manual Docker deploy](#manual-docker-deploy)
  - [Configure env vars](#configure-env-vars)
  - [Build images](#build-images)
  - [First boot](#first-boot)
  - [Subsequent boots](#subsequent-boots)
- [Local dev](#local-dev)
  - [Install](#install)
  - [Local env vars](#local-env-vars)
  - [Database setup](#database-setup)
  - [Start](#start)
- [Env var reference](#env-var-reference)
  - [Required](#required)
  - [Optional](#optional)
  - [SMTP](#smtp)
- [URLs](#urls)
- [Common commands](#common-commands)
  - [Docker](#docker)
  - [Local dev commands](#local-dev-commands)
- [Troubleshooting](#troubleshooting)
- [Backup & restore](#backup--restore)
- [HTTPS certificates](#https-certificates)

---

## Prerequisites

### Docker deploy

- **Docker** ≥ 20.10
- **Docker Compose** ≥ 2.0 (or docker-compose v1)
- **Bash** (Windows users: use WSL2 or Git Bash)

### Local dev

- **Node.js** ≥ 20.19.0
- **pnpm** ≥ 11.0.0
- **MariaDB** ≥ 10.5

---

## Quick deploy (recommended)

Two steps.

### Run the wizard

```bash
# Clone
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage

# Run the quick setup wizard
bash scripts/setup.sh
```

The wizard asks for:

1. **Domain or IP** — enter your server IP (e.g. `192.168.1.100`) or a domain.
2. **Admin password** — auto-generate / set manually / leave blank to create in the web UI.
3. **SMTP** — optional; leave blank and reset links will land in `docker logs`.

`.env.docker` is generated once you're done.

### Start the stack

```bash
docker compose --env-file .env.docker up -d --build
```

### Access

| Entry | URL |
|------|------|
| Public site | `http://your-domain-or-ip/` |
| Admin | `http://your-domain-or-ip/admin/` |
| First-run wizard | `http://your-domain-or-ip/admin/setup` |

---

## Docker one-command deploy

The project ships `scripts/deploy.sh`. It supports three modes.

### Wizard mode

Interactive, asks about the important settings one by one:

```bash
bash scripts/deploy.sh
```

The script walks you through:

1. **Environment check** — Docker and Docker Compose available?
2. **Domain** — enter a domain or IP.
3. **HTTPS cert email** — needed for a real domain; leave blank for an IP.
4. **Email notifications (SMTP)** — optional; built-in shortcuts for QQ / 163 / Gmail and friends.
5. **Admin account** — auto-generate / customize / leave blank and create in the web UI.

### CI fully-automated mode

Zero interaction, suited for CI/CD:

```bash
CI=true bash scripts/deploy.sh
```

All values come from defaults or environment variables.

### Skipping the domain prompt

If the domain is set via env, skip the prompt but keep the rest interactive:

```bash
DOMAIN=your-domain.com bash scripts/deploy.sh
```

---

## Manual Docker deploy

For finer control.

### Configure env vars

1. Copy the template:

```bash
cp docker/.env.example .env.docker
```

2. Edit `.env.docker` — the essentials:

```bash
# Domain or IP (required)
DOMAIN=your-domain-or-ip

# JWT secret (required, >= 20 chars)
JWT_SECRET=your-strong-random-secret

# Database (required)
DB_ROOT_PASSWORD=your-db-root-password
DB_USERNAME=homepage
DB_PASSWORD=your-db-password
DB_DATABASE=homepage

# Admin password (optional — leave blank to create via the web UI)
DEFAULT_ADMIN_PASSWORD=
```

### Build images

Order matters — build `app` before `caddy` (caddy extracts static files from the app image):

```bash
# Backend API image
docker compose --env-file .env.docker build app

# Caddy + static files image
docker compose --env-file .env.docker build caddy
```

### Networking

Docker Compose uses two isolated networks:

| Network | Services | Purpose |
|------|-----------|------|
| `frontend` | caddy, app | Caddy reverse-proxies API requests to the app |
| `backend` | app, mariadb | app talks to the database |

> **Security win**: MariaDB lives on `backend` only — even if Caddy is compromised, the DB is not directly reachable.

### Healthchecks

Every service has a healthcheck so dependencies start in the right order:

| Service | Check | Interval |
|------|-------------|------|
| `mariadb` | `mariadb-admin ping` | 10s |
| `app` | HTTP `/health` | 30s |
| `caddy` | `caddy validate --config` | 30s |

`depends_on` with `condition: service_healthy` enforces the boot order:

1. MariaDB ready → app boots.
2. App ready → Caddy boots.

### First boot

The first boot needs a DB migration:

```bash
# 1. Start the database
docker compose --env-file .env.docker up -d homepage-db

# 2. Wait for it to be ready (~10s)
sleep 10

# 3. Run migrations
docker compose --env-file .env.docker run --rm app \
  npx ts-node -r tsconfig-paths/register node_modules/.bin/typeorm migration:run \
  -d data-source.ts

# 4. Boot everything
docker compose --env-file .env.docker up -d
```

### Subsequent boots

With the schema in place:

```bash
docker compose --env-file .env.docker up -d
```

---

## Local dev

For local development and debugging.

### Install

```bash
git clone https://github.com/Dageling003/Dageling003-Homepage.git
cd Dageling003-Homepage
pnpm install
```

### Local env vars

1. Copy the template:

```bash
cp apps/backend/.env.example apps/backend/.env
```

2. Edit `apps/backend/.env`:

```bash
# JWT secret (>= 20 chars)
JWT_SECRET=your-dev-secret

# Default admin password (>= 12 chars)
DEFAULT_ADMIN_PASSWORD=your-admin-password

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=homepage
DB_PASSWORD=your-db-password
DB_DATABASE=homepage
```

### Database setup

1. Create the database:

```bash
mysql -u root -p -e "CREATE DATABASE \`homepage\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Run migrations:

```bash
pnpm migrate:run
```

### Start

```bash
pnpm dev
```

Access:

| Service | URL |
|------|------|
| Public site | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API docs | http://localhost:8000/api/docs |

---

## Env var reference

### Required

| Name | Purpose | Example |
|--------|------|------|
| `DOMAIN` | Domain or IP | `example.com` or `192.168.1.100` |
| `JWT_SECRET` | JWT secret (>= 20 chars) | generate with `openssl rand -base64 32` |
| `DB_ROOT_PASSWORD` | DB root password | generate with `openssl rand -base64 20` |
| `DB_USERNAME` | DB user | `homepage` |
| `DB_PASSWORD` | DB password | generate with `openssl rand -base64 20` |
| `DB_DATABASE` | DB name | `homepage` |

### Optional

| Name | Purpose | Default |
|--------|------|--------|
| `DEFAULT_ADMIN_PASSWORD` | Default admin password | blank (created via web UI) |
| `ACME_CA` | HTTPS CA | `https://acme.zerossl.com/v2/DV90` |
| `ACME_EMAIL` | HTTPS cert email | blank (auto-generated) |
| `DB_SYNCHRONIZE` | Auto-sync schema | `false` (must be `false` in production) |
| `PUBLIC_ADMIN_URL` | Root URL used in reset links | inferred from `DOMAIN` |

### SMTP

| Name | Purpose | Example |
|--------|------|------|
| `SMTP_HOST` | SMTP host | `smtp.qq.com` |
| `SMTP_PORT` | SMTP port | `465` |
| `SMTP_SECURE` | Use SSL | `true` |
| `SMTP_USER` | Sender address | `noreply@example.com` |
| `SMTP_PASS` | SMTP password / app password | QQ / 163 require an app password |
| `SMTP_FROM` | Sender name | `Homepage <noreply@example.com>` |

**Common providers:**

| Provider | Host | Port | SSL |
|------|-------------|------|-----|
| QQ Mail | smtp.qq.com | 465 | Yes |
| 163 Mail | smtp.163.com | 465 | Yes |
| Gmail | smtp.gmail.com | 465 | Yes |
| Outlook | smtp.office365.com | 587 | No |

> **Note**: QQ / 163 require an *authorization code*, not your login password.

---

## URLs

### Docker

| Service | URL |
|------|------|
| Public site | `http(s)://your-domain/` |
| Admin | `http(s)://your-domain/admin/` |
| First-run wizard | `http(s)://your-domain/admin/setup` |
| Forgot password | `http(s)://your-domain/admin/forgot-password` |
| API | `http(s)://your-domain/api/` |
| Health | `http(s)://your-domain/health` |

### Local dev

| Service | URL |
|------|------|
| Public site | http://localhost:3000 |
| Admin | http://localhost:3001 |
| API docs | http://localhost:8000/api/docs |

---

## Common commands

### Docker

```bash
# Service status
docker compose --env-file .env.docker ps

# Tail logs
docker compose --env-file .env.docker logs -f

# Per-service logs
docker compose --env-file .env.docker logs -f caddy
docker compose --env-file .env.docker logs -f app

# Stop everything
docker compose --env-file .env.docker down

# Restart
docker compose --env-file .env.docker restart

# Start
docker compose --env-file .env.docker up -d

# Rebuild & start
docker compose --env-file .env.docker up -d --build
```

### Local dev commands

```bash
# Start everything in parallel
pnpm dev

# Backend only
pnpm dev:backend

# Public site only
pnpm dev:frontend

# Admin only
pnpm dev:admin

# Build everything
pnpm build

# Lint
pnpm lint

# Format
pnpm format
```

---

## Troubleshooting

### 1. Docker image build fails

**Symptom**: `docker compose build` fails.

**Fix**:

```bash
# Build app first, then caddy
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker build caddy
```

### 2. MariaDB image pull fails

**Symptom**: `pull access denied for mariadb:11.4` or `failed to resolve reference`.

**Cause**: Docker Hub access is restricted in some regions.

**Fix**:

The project ships with the `docker.1ms.run` mirror. If it still fails you can configure the daemon or switch tags:

```bash
# Option 1: configure a Docker registry mirror (recommended)
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.1ms.run",
    "https://docker.xuanyuan.me"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# Option 2: point at a different registry in .env.docker
# TUNA (Tsinghua)
MARIADB_IMAGE=mirrors.tuna.tsinghua.edu.cn/library/mariadb:11.4

# USTC
MARIADB_IMAGE=mirrors.ustc.edu.cn/library/mariadb:11.4

# Official Docker Hub (needs unrestricted network)
MARIADB_IMAGE=mariadb:11.4
```

### 3. DB connection fails

**Symptom**: backend can't connect to the database.

**Fix**:

- `docker compose --env-file .env.docker ps` — is the DB up?
- `docker compose --env-file .env.docker logs homepage-db` — what does it say?
- Double-check `DB_ROOT_PASSWORD`, `DB_USERNAME`, `DB_PASSWORD`.

### 4. Port already in use

**Symptom**: port 80 or 443 is occupied.

**Fix**:

```bash
netstat -tlnp | grep -E ':(80|443)'
# Stop the process, or change the port mapping in docker-compose.yml.
```

### 5. Caddy fails to issue a certificate

**Symptom**: HTTPS cert issuance fails.

**Fix**:

- Confirm the domain resolves to your server IP.
- Make sure `ACME_EMAIL` is set.
- Try a different CA: set `ACME_CA=https://acme-v02.api.letsencrypt.org/directory` in `.env.docker`.

### 6. `deploy.sh` doesn't run on Windows

**Symptom**: "bash not found" or the script fails.

**Fix**:

- Install [WSL2](https://learn.microsoft.com/windows/wsl/install) and run the script inside WSL.
- Or install [Git Bash](https://git-scm.com/downloads).

### 7. Blank admin dashboard after the first deploy

**Symptom**: opening the admin shows an empty page.

**Fix**:

- If `DEFAULT_ADMIN_PASSWORD` is blank, hit `/admin/setup` first to create the admin.
- Open DevTools and check the console for errors.

---

## Backup & restore

### Manual

```bash
# Back up into ./backups/
bash scripts/backup-db.sh

# Custom output directory
bash scripts/backup-db.sh /tmp
```

### Cron

```bash
# Daily at 02:00, keep the last 7 days
0 2 * * * cd /path/to/Dageling003-Homepage && bash scripts/backup-db.sh >> /var/log/homepage-backup.log 2>&1
```

### Restore

```bash
gunzip -c ./backups/homepage_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i homepage-db mariadb -u homepage -p'your-password' homepage
```

---

## HTTPS certificates

### ZeroSSL vs Let's Encrypt

| Feature | ZeroSSL | Let's Encrypt |
|------|---------|---------------|
| Access from mainland China | ✅ works | ❌ often blocked |
| Free tier | ✅ yes | ✅ fully free |
| Cert lifetime | 90 days | 90 days |
| Auto-renew | ✅ built into Caddy | ✅ built into Caddy |

**Recommendation**: ZeroSSL for deployments in mainland China (default); Let's Encrypt for overseas.

Switch the CA:

```bash
# In .env.docker
ACME_CA=https://acme.zerossl.com/v2/DV90                    # ZeroSSL (default)
ACME_CA=https://acme-v02.api.letsencrypt.org/directory      # Let's Encrypt
```

---

## Security hardening

### Dependency audits

We periodically audit and fix high-severity CVEs:

| Dependency | Vulnerability | Fix |
|------|------|----------|
| `form-data` | CRLF injection | `override → >= 4.0.6` |
| `multer` | DoS via nested field names | `override → >= 2.2.0` |
| `nodemailer` | SSRF / file read | upgrade to `^9.0.1` |

Run `pnpm audit --registry https://registry.npmjs.org` to check the current state.

### Network isolation

Docker Compose uses two independent networks:

- **frontend**: Caddy ↔ App.
- **backend**: App ↔ MariaDB.

MariaDB is not on the frontend network — even if Caddy is compromised, the DB is not directly reachable.

---

## First-run wizard

After the first deploy, visit `http(s)://your-domain/admin/setup` to initialize the site:

1. **Create admin** (skipped if a password was set in `.env.docker`).
2. **Site title** — the value shown in the browser tab.
3. **Personal info** — name, gender, birthday, region, school, professions.
4. **Quick links** — add your commonly used sites (blog, GitHub, email, …).
5. **Tech stack** — colored icons are matched automatically.
6. **Typewriter greeting** — rotating welcome strings on the home page.
7. **Todos** — displayed as a plan list.
8. **Finish** — the system saves everything.

> Click "Next" at every step to persist; hit "Finish" at the end.

After that, log in to the admin at `http(s)://your-domain/admin/`.

---

## FAQ

### Q: I forgot the database password.

A: Update `.env.docker` and restart:

```bash
docker compose --env-file .env.docker down
# edit .env.docker
docker compose --env-file .env.docker up -d
```

### Q: How do I change the admin password?

A: Log in to the admin dashboard and open **Account settings**.

### Q: How do I update to a new version?

A: Pull and rebuild:

```bash
git pull
docker compose --env-file .env.docker up -d --build
```

### Q: How do I find a password-reset link when SMTP is not configured?

A: It's written to the container logs:

```bash
docker logs homepage-app 2>&1 | grep -A 6 'Password reset requested'
```

---

## Related docs

- [Architecture](./architecture.en.md)
- [API](./api.en.md)
- [Dev guide](./dev-guide.en.md)
- [Tech choices](./technology-selection.en.md)
