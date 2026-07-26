# Security Policy

<p align="right">
  <a href="./SECURITY.md">简体中文</a> · <strong>English</strong>
</p>

Thanks for helping make Dageling003-Homepage safer. This is a personal-homepage-sized OSS project, but the moment it is self-hosted, **it becomes someone's production service**. So this repo takes security seriously: **acknowledge fast, patch fast, credit publicly.**

---

## 📌 Supported versions

Only the current `main` branch and the latest minor release receive security patches. Older patch versions are not back-ported unless the issue is critical.

| Version | Supported | Notes |
|---------|-----------|-------|
| `main` (unreleased) | ✅ | Continuously patched |
| Latest patch of `1.x` | ✅ | e.g. `1.2.x` receives fixes |
| Older patch of `1.x` | ❌ | Please upgrade to the latest patch |
| `0.x` | ❌ | Deprecated, upgrade to 1.x |

Check your version: `cat package.json | grep version` or see [CHANGELOG.md](./CHANGELOG.md).

---

## 🚨 Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.** Public issues put **unpatched users in an exposed window**.

### Preferred channels

- **GitHub Security Advisory** (recommended): <https://github.com/Dageling003/Dageling003-Homepage/security/advisories/new>
  - Private, collaborative, CVE-capable
- **Email**: `2505472941@qq.com`
  - Prefer plain-text email; if the content is sensitive, send an empty introductory email first to confirm the contact channel

### Please include

1. **Vulnerability class** (XSS / SQLi / SSRF / auth bypass / privilege escalation / RCE / DoS / supply chain / …)
2. **Impact** (which component, which version, prerequisites)
3. **Reproduction steps** (minimal reproducer, screenshots, HTTP payloads preferred)
4. **PoC** (optional but strongly encouraged)
5. **Suggested remediation** (optional)

### Our SLA

| Stage | Target |
|-------|--------|
| **Acknowledge receipt** | Within 3 business days |
| **Initial triage + reproducibility verdict** | Within 7 business days |
| **Critical / high-severity patch release** | Within 30 days |
| **Medium / low-severity patch release** | Next minor release |
| **Public disclosure** | ≥ 14 days after the fix, or per agreement with the reporter |

Severity follows [CVSS 3.1](https://www.first.org/cvss/calculator/3.1).

### Credit

We credit reporters in patch release notes and in the `Security` section of [CHANGELOG.md](./CHANGELOG.md), unless the reporter prefers to stay anonymous.

---

## 🛡 Baseline security controls

Here is the current security baseline across **code / deployment / runtime**, so you can assess the attack surface:

### Auth & sessions
- **JWT + bcrypt 12 rounds**, stateless sessions
- **`JWT_SECRET` enforced at boot**: ≥ 20 chars, no placeholder default — the backend refuses to start otherwise
- **`SETUP_TOKEN` anti-squatting**: in production, empty `users` table + missing `SETUP_TOKEN` → hard boot failure, closing the window between "server online" and "you finished the setup wizard"
- **Admin password**: ≥ 12 characters
- **Password reset token**: 15-minute expiry

### API & transport
- **helmet**: CSP / HSTS 1y / cross-origin policies
- **Rate limits**: 120 req/min global, 5 req/min on auth endpoints by default (`@nestjs/throttler`, configurable via `LOGIN_THROTTLE_LIMIT/TTL` env vars)
- **1 MB request body cap**
- **class-validator + DTO whitelisting**: `UpdateProfileDto` accepts only `avatarUrl`, defeating mass assignment
- **Swagger disabled in production**

### File uploads
- **Avatar triple-check**: MIME + sharp metadata + file-type magic bytes
- **Forced re-encoding**: normalized to 200×200 WebP, re-encoded before persisting
- **Memory storage, ≤ 5 MB**: original bytes never touch disk
- **Static directory refuses to execute scripts**: Caddy denies `.php` / `.sh` / `.py` under `/files/*`

### Data & backup
- **MariaDB production mode + parameterized queries** (TypeORM)
- **`DB_SYNCHRONIZE` production warning**; canonical path is Migrations
- **DB backup script**: `scripts/backup-db.sh` (`mysqldump` + gzip)

### Supply chain & builds
- **pnpm lockfile pinning + `pnpm audit`** in CI
- **Distroless runtime image**: no shell, no package manager, minimized attack surface
- **Layered dependencies**: `pnpm deploy --prod` bakes production-only deps into the runtime image
- **GitHub Actions CI**: lint + build + unit tests + `pnpm audit`

### Secrets & `.env`
- `.env` / `.env.docker` are **git-ignored**
- The deploy wizard auto-generates `JWT_SECRET` / `SETUP_TOKEN` / DB passwords — users never invent them
- One-shot deploy stores secrets only in `.env.docker`; **not baked into images, not printed to remote logs**

---

## ⚠️ Known limits

Honesty is part of security. The following items are **not** in scope of our current security guarantees:

- **CSR SPA, no SSR**: crawlers cannot see Vue-rendered content; if you need SSR / prerender, integrate it yourself
- **No 2FA / MFA**: single-admin scenarios do not offer second-factor today; TOTP may land later
- **No traffic scrubbing**: we only implement app-layer rate limiting — for DDoS / L7 attacks rely on a CDN / WAF in front
- **CVE tracking & SBOM**: we currently only run `pnpm audit` and do not emit a formal SBOM; if you have enterprise compliance needs, please open an issue

---

## 🔗 Related

- [CHANGELOG.md](./CHANGELOG.md) — every security fix is archived under the `Security` section
- [ROADMAP.md](./ROADMAP.md) — see the "Security & compliance" track
- [docs/deployment.en.md](./docs/deployment.en.md) — production deployment best practices
- [docs/deploy-beginner.en.md](./docs/deploy-beginner.en.md) — zero-experience walkthrough
