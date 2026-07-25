# Roadmap

<p align="right">
  <a href="./ROADMAP.md">简体中文</a> · <strong>English</strong>
</p>

> This roadmap is not a promise — it's a **statement of product intent**. Items ship in priority order and get reshuffled based on community feedback.
> Every shipped item leaves a trail in [CHANGELOG.md](./CHANGELOG.md), moving from `[Unreleased]` into `[x.y.z]`.
>
> Last updated: 2026-07-25 · Current: v1.0.0

---

## 🎯 Product positioning (important)

Dageling003-Homepage is not trying to "do everything". The project grew out of [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage) and stays focused on one thing:

> **Give one person a long-lived personal homepage that never needs a JSON edit.**

That's why this roadmap also lists **what we won't build** — "won't" is as important as "will".

---

## 🟢 Short term (0–3 months, v1.x)

Focus: **stability + lower barrier**.

| Theme | Goal | Status |
|-------|------|--------|
| **One-command deploy** | `curl \| bash` from bare metal to HTTPS in ≤ 5 min | ✅ Shipped in v1.1 |
| **Fill in the admin UI** | Every remaining hard-coded field goes into forms (social icons, footer copyright, SEO meta) | 🚧 In progress |
| **Avatar: local + image bucket** | Self-host, Qiniu, S3, or direct URL — all supported | 📋 Planned |
| **Theme presets** | At least 5 first-party themes (beyond light/dark), switchable from admin | 📋 Planned |
| **Public i18n** | Frontend i18n (zh / en); admin stays Chinese-first for now | 📋 Planned |
| **Health self-check panel** | Admin dashboard shows SMTP / DB / disk / cert expiry | 📋 Planned |
| **One-click upgrade** | `make update` diffs image tags, runs migrations, rolls containers | ✅ Partial |

---

## 🟡 Mid term (3–9 months, v1.5–v2.0)

Focus: **evolve from "personal homepage" to "personal-brand landing page"**.

| Theme | Goal | Notes |
|-------|------|-------|
| **Blog / posts module** | Markdown feed, not a heavyweight CMS — the point is "post a status update" | Decide: separate table vs reuse config? |
| **Visitor comments / feedback** | Email delivery or admin aggregation; anti-bot + simple anti-spam | Depends on SMTP (already shipped) |
| **Visitor analytics** | Privacy-first (no GA); lightweight self-hosted PV/UV | Data stays in local DB |
| **RSS feed** | If the blog module ships, expose RSS 2.0 alongside | Depends on blog module |
| **2FA / TOTP** | Second factor for admin login | See "Known limits" in [SECURITY.md](./SECURITY.md) |
| **Theme marketplace** | Load community theme packs from a GitHub URL | Needs a theme package spec |
| **API stabilization → v1** | Freeze `/api/v1/*`; breaking changes go to `/api/v2/*` | Prerequisite: publish an OpenAPI schema |

---

## 🔵 Long term (9 months+, v2.x)

Focus: **decouple from the current monorepo assumptions + grow the ecosystem**.

| Theme | Goal | Notes |
|-------|------|-------|
| **Pluggable data sources** | Support Postgres / MySQL alongside MariaDB / SQLite | Requires abstracting TypeORM DataSource |
| **Docker-free deploy** | systemd unit + static build artifacts, for VPS / NAS boxes without Docker | Lower priority |
| **Import / export** | One-click import from Simple-Homepage, Hexo, Astro homepages | **PM debt: kind to legacy users** |
| **CLI tooling** | `homepage-cli` for daily ops (content / backup / upgrade) | For terminal-native users |
| **SSR / prerender** | Crawler-friendly first paint; social preview cards (OG images) | Decide: Nuxt vs custom |

---

## 🚫 Non-goals

The following items are **intentionally out of scope**. If you need them, please fork or start a separate project.

- ❌ **Multi-user / multi-tenant**: this project serves "one person's homepage". Use Ghost / WordPress if you need shared editors.
- ❌ **Heavyweight CMS**: category trees, threaded comments, editorial workflows … not happening. The blog module (mid term) stays minimal.
- ❌ **Drag-and-drop visual editor**: layout comes from **convention + forms**, not a Notion-style page builder.
- ❌ **Mobile apps**: admin is already responsive; no iOS / Android clients.
- ❌ **Closed-source commercial features**: everything stays under MIT.
- ❌ **Baked-in LLM integrations**: any AI capability, if we build one, ships as an optional plugin — it will not sit in the core.
- ❌ **IE / legacy-browser support**: only the two most recent major versions of modern browsers.

---

## 🤝 How to participate

- **Vote**: give issues a 👍 to signal priority
- **Propose**: open a thread in [Discussions](https://github.com/Dageling003/Dageling003-Homepage/discussions)
- **Claim**: 📋 items are up for PRs — please open an issue first to align on design
- **Report bugs / security**: see the [issue templates](https://github.com/Dageling003/Dageling003-Homepage/issues/new/choose) or [SECURITY.md](./SECURITY.md)

---

## 📚 Related docs

- [CHANGELOG.md](./CHANGELOG.md) — shipped versions
- [SECURITY.md](./SECURITY.md) — reporting + baseline
- [docs/progress.md](./docs/progress.md) — fine-grained historical iteration log
- [CONTRIBUTING.md](./CONTRIBUTING.md) — contribution flow
