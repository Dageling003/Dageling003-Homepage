# Development Progress

<p align="right">
  <a href="./progress.md">简体中文</a> · <strong>English</strong>
</p>

> Last updated: 2026/06/08 v0.7.0
>
> This file is append-only history and does **not** represent the current feature set — the root README and the code are the source of truth.

---

## Roadmap overview

| Phase | Content | Status |
|------|------|------|
| 1 | Project scaffolding (monorepo skeleton) | ✅ **done** |
| 2 | Backend API + database | ✅ **done** |
| 3 | Public landing page | ✅ **done** |
| 4 | Admin dashboard | ✅ **done** |
| 5 | Integration polish | ✅ **done** |
| 6 | UX overhaul + security hardening | ✅ **done** |
| 7 | Password reset + self-service admin | ✅ **done** |
| 8 | `deploy.sh` v2 + doc sync | ✅ **done** |

---

## Phase 1 — Scaffolding ✅

- [x] Create the monorepo root layout
- [x] Set up pnpm workspaces (`apps/frontend`, `admin`, `backend`)
- [x] Set up `.npmrc`, `.gitignore`, `tsconfig.base.json`
- [x] Set up UnoCSS (unified across frontend + admin)
- [x] All three projects can build independently

---

## Phase 2 — Backend API ✅

### Endpoints (20 total)

| Method | Path | Auth | Notes |
|------|------|------|------|
| POST | `/api/auth/login` | ❌ | admin login |
| POST | `/api/auth/forgot-password` | ❌ | request password reset (email or logs) |
| POST | `/api/auth/reset-password` | ❌ | set new password via token |
| GET | `/api/auth/has-users` | ❌ | whether any user exists |
| POST | `/api/auth/create-first-admin` | ❌ | create the first admin (first time only) |
| GET | `/api/auth/profile` | ✅ | current user |
| PUT | `/api/auth/profile` | ✅ | update profile (avatar, …) |
| PUT | `/api/auth/change-password` | ✅ | change password |
| GET | `/api/config` | ❌ | all configs |
| GET | `/api/config/initialized` | ❌ | whether the system is initialized |
| GET | `/api/config/grouped` | ❌ | grouped by category |
| GET | `/api/config/category/:cat` | ❌ | filter by category |
| GET | `/api/config/export/json` | ✅ | JSON export |
| GET | `/api/config/:key` | ❌ | single entry by key |
| POST | `/api/config` | ✅ | create → auto audit |
| PUT | `/api/config/:key` | ✅ | update → auto audit |
| DELETE | `/api/config/:key` | ✅ | delete → auto audit |
| POST | `/api/config/upload/avatar` | ✅ | avatar upload (sharp) |
| GET | `/api/audit` | ✅ | audit list (paginated + filters) |

---

## Phase 3 — Public site ✅

### Components

| Component | File | Notes |
|------|------|------|
| `AnimatedLogo` | `components/AnimatedLogo.vue` | Loading anim: pulsing halo + bounce icon |
| `ThemeToggle` | `components/ThemeToggle.vue` | Light/dark toggle: SVG sun/moon rotate anim |
| `TypewriterText` | `components/TypewriterText.vue` | Typewriter effect |
| `TimeGreeting` | `components/TimeGreeting.vue` | Time-of-day greeting + live clock + 4 progress bars |
| `QuickLinks` | `components/QuickLinks.vue` | Quick links: grid / row / list layouts |

### Page features

- ✅ Smooth transition from loading → content (`AnimatedLogo → showContent`)
- ✅ Card enter animations (staggered 100–400ms)
- ✅ Hover states (border color + shadow polish)
- ✅ Responsive: phone / tablet / small phone
- ✅ LAN access (`host: true`)

### Dynamic config keys (19)

| Key | Meaning | Admin location |
|--------|------|-------------|
| `name` | Display name | Personal info → Name |
| `infoSex` | Gender | Personal info → Gender |
| `infoSexDisplay` | Gender display (symbol / text / both) | Personal info → Gender |
| `infoAge` | Age (manual) | Personal info → Age |
| `infoBirth` | Birthday (auto age + zodiac) | Personal info → Age |
| `infoAgeDisplay` | Age placement (all / intro / tag / hide) | Personal info → Age |
| `zodiac` | Zodiac (auto / manual) | Personal info → Age |
| `infoProvince` | Region (34-province picker) | Personal info → Region |
| `infoSchool` | School (search across 1200+) | Personal info → School |
| `avatarUrl` | Avatar URL (local upload supported) | Personal info → Avatar |
| `professions` | Profession tags | Personal info → Professions |
| `links` | Quick links | Quick links |
| `techs` | Tech stack | Tech stack |
| `todos` | Todos | ToDo |
| `typewriterWords` | Typewriter strings | Typewriter |
| `infoShowName` | Show name? | Personal info → Display toggles |
| `infoShowZodiac` | Show zodiac? | Personal info → Display toggles |
| `infoShowBirth` | Show birthday? | Personal info → Display toggles |

---

## Phase 4 — Admin dashboard ✅

### Pages

| Page | Route | Notes |
|------|------|------|
| Login | `/login` | Frosted-glass card UI + glow |
| Dashboard | `/dashboard` | ECharts pie / bar + 4 stat cards |
| Personal info | `/config/personal` | Grouped form (name / gender / age / region / school / professions / avatar / display toggles) |
| Quick links | `/config/links` | Form editor |
| Tech stack | `/config/techs` | Form editor |
| ToDo | `/config/todos` | Form editor |
| Typewriter | `/config/typewriter` | Form editor |
| Audit log | `/audit` | Paginated table + filters + detail modal |
| Account | `/account` | Account info + avatar |
| First-run wizard | `/setup` | 7-step init |
| 404 | `/:pathMatch(.*)*` | Catch-all |

### Highlights

- ✅ JWT + route guards
- ✅ First-run auto-detection → redirect to wizard
- ✅ Sidebar with 5 sub-menus + collapse
- ✅ Tabs system (right-click close / close others)
- ✅ Full-depth breadcrumb
- ✅ ECharts dashboard
- ✅ 7 preset theme palettes + drawer settings
- ✅ Dark + light modes
- ✅ Avatar upload (sharp → WebP)
- ✅ Form-based editing (no more raw JSON)
- ✅ Login page redesign
- ✅ Audit filters (action / operator / date range)
- ✅ Admin avatar display

---

## Phase 5 — Integration polish ✅

- [x] End-to-end integration with real data
- [x] Error handling (axios interceptors)
- [x] Production build (`pnpm build`)
- [x] Caddy reverse-proxy config
- [x] PM2 process management
- [x] Login page redesign
- [x] Dark mode for breadcrumb + tabs
- [x] Public-site card enter animations

---

## Phase 6 — UX overhaul + security hardening ✅

- [x] Form-based config management (region picker, school search, profession tags, avatar upload)
- [x] Birthday auto-computes age + zodiac
- [x] Age / gender display selectors
- [x] Upload pipeline with sharp
- [x] First-run wizard (7 steps)
- [x] Audit log filtering
- [x] Avatar upload in account settings
- [x] Backend support for audit filters

---

## Version history

| Version | Date | Changes |
|------|------|---------|
| v0.1.0 | 2026/06/06 | Project init |
| v0.2.0 | 2026/06/06 | Admin + public components complete |
| v0.3.0 | 2026/06/06 | Integration polish |
| v0.4.0 | 2026/06/06 | ECharts + theme presets |
| v0.5.0 | 2026/06/07 | UX overhaul + form-based config + avatar upload |
| v0.6.0 | 2026/06/07 | First-run wizard + security hardening + doc updates |
| v0.7.0 | 2026/06/08 | Production-grade security + Docker architecture rewrite |
| v0.7.1 | 2026/06/08 | Post-deploy summary restructured: public site / admin / init / admin account / important notes / routes |
| v0.8.0 | 2026/06/14 | Security: 15-minute reset token, ValidationPipe whitelist, TypeORM migrations, Caddy caching + defense, magic-byte validation |

---

## Phase 9 — Extra security + architecture ✅

### Security hardening

- [x] Password reset token lifetime cut from 1 hour to 15 minutes
- [x] Every `@Body()` now uses class-validator DTOs — no more inline types
- [x] `UpdateProfileDto` whitelist: only `avatarUrl` is writable — mitigates mass-assignment
- [x] Avatar upload does magic-byte validation (`file-type`); MIME + sharp + magic bytes = triple check
- [x] Avatar upload uses in-memory storage — the raw file is never written to disk
- [x] Caddy blocks execution of `.php` / `.sh` / `.py` under `/files/*`

### Architecture

- [x] TypeORM migration system: added `data-source.ts` + initial migration
- [x] `DB_SYNCHRONIZE` default in Docker flipped from `true` to `false`
- [x] New env var `DB_MIGRATIONS_RUN` (auto-run migrations at boot)
- [x] Caddy caching: `/assets/*` immutable for 1 year, SPA `no-cache`, API `no-store`
- [x] Database backup script `scripts/backup-db.sh` (mysqldump + gzip)
- [x] README updates: backup section, Bash requirement, SEO note

### Tests & CI

- [x] Auth service unit tests (login, validateUser, changePassword, resetPassword)
- [x] E2E tests updated (health, config, auth, ValidationPipe, JWT gate)
- [x] GitHub Actions CI: lint + build (Node 20 / 22 matrix), unit tests, security audit

## Phase 7 — Production hardening + Docker rewrite ✅

- [x] Docker architecture rewritten: Caddy serves static files directly (no more `serve` → Node process)
- [x] Added `Dockerfile.caddy` — Caddy + static files, single image
- [x] Rewrote `Dockerfile.app` for backend-only, `pnpm deploy --prod` for production deps
- [x] HEALTHCHECK for every container: app (HTTP), mariadb (`mariadb-admin ping`)
- [x] `depends_on` upgraded to `service_healthy` (was `service_started`)
- [x] DB passwords are now required (weak defaults like `rootpassword` / `homepage_pass` removed)
- [x] Container resource limits (`memory: 512M`, `cpus: 1`) + log rotation (20 MB × 3)
- [x] Swagger docs are only enabled outside production
- [x] Global 1 MB request-body limit (DDoS mitigation)
- [x] helmet hardening (CSP / HSTS / crossOrigin policies)
- [x] bcrypt rounds bumped 10 → 12
- [x] Minimum password lengths: login 6 → 8, change-password 6 → 12
- [x] Rate limiting: global 60 → 120/min, login stays at 5/min
- [x] DB connection-pool tuning (`connectionLimit=20`, timeouts)
- [x] Warning when `DB_SYNCHRONIZE=true` in production
- [x] PM2 config: `fork` → `cluster` mode, `instances: 1` → `max`
- [x] New `/health` endpoint
- [x] `deploy.sh` security: no more logging admin passwords in plaintext
- [x] Image size reduced 4–5× (~500 MB → ~80–120 MB)
- [x] `pnpm-workspace.yaml` cleaned up unused `allowBuilds`
- [x] Docs fully refreshed

---

## Phase 8 — Structured deploy summary ✅

- [x] `deploy.sh` post-deploy summary restructured into blocks: Public site / Admin / First-run init / Important notes / Admin account / Routes / Common commands
- [x] Important notes: right after deploy but before init, hitting the root URL only shows layout / placeholder content
- [x] Explicit instruction to run through `/admin/setup` first, then change the default password in Account settings
- [x] Full route cheat sheet (`/`, `/admin/`, `/admin/setup`, `/admin/dashboard`, `/admin/account`, `/api/`, `/health`)

URLs:

| Entry | Dev | Prod |
|------|------|------|
| Public site | http://localhost:3000 | `https://<domain>/` |
| Admin | http://localhost:3001 | `https://<domain>/admin/` |
| First-run wizard | auto-redirect after login | `https://<domain>/admin/setup` |

---

## Bug fixes

| Problem | Cause | Fix |
|------|------|------|
| 500 on login | `JwtModule` initialized before `.env` loaded — secret was `undefined` | Switched to `registerAsync` for lazy loading |
| Blank page after login | `AdminLayout.vue` didn't import `computed` | Added `computed` to the Vue import |
| Footer position off | Placed before `<a-layout-content>`, violating Ant Design layout order | Moved after `content` |
| Version mismatch | Page showed v0.2.1 while the code was v0.1.0 | Updated to v0.1.0 |
| First deploy jumped straight to dashboard | Legacy DB missing `_initialized` marker | Inserted `_initialized = '0'`; seed data now includes it |
