# Roadmap

<p align="right">
  <a href="./ROADMAP.md">简体中文</a> · <strong>English</strong>
</p>

Records what is currently in progress, what is planned, and what is intentionally out of scope.
Shipped items leave a trail in [CHANGELOG.md](./CHANGELOG.md), moving from `[Unreleased]` into a version section.

Last updated: 2026-07-25 · Current: v1.0.0

---

## Project scope

Dageling003-Homepage is forked from [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage). It targets a single use case:

> A long-lived personal homepage where configuration goes through admin forms rather than direct JSON edits.

This roadmap also lists what is intentionally out of scope.

---

## Short term (v1.x)

Focus: stability and lowering the barrier to entry.

| Theme | Description | Status |
|-------|-------------|--------|
| One-command deploy | Run a single command to bring up an HTTPS service from bare metal | ✅ Shipped in v1.1 |
| Admin UI coverage | Move remaining hard-coded fields (social icons, footer, SEO meta) into forms | 🚧 In progress |
| Avatar sources | Self-hosted, Qiniu, S3, and image-bed URLs all supported | 📋 Planned |
| Theme presets | 5 first-party themes, switchable from admin | 📋 Planned |
| Public i18n | Frontend zh / en switching; admin stays Chinese-first | 📋 Planned |
| Health self-check | Admin dashboard shows SMTP / DB / disk / cert expiry | 📋 Planned |
| One-click upgrade | `make update` diffs image tags, runs migrations, restarts containers | ✅ Partial |

---

## Mid term (v1.5–v2.0)

Focus: extend from "personal homepage" to "personal-brand landing page".

| Theme | Description |
|-------|-------------|
| Blog / posts | Markdown feed aimed at short status updates; no category trees, threaded comments, or editorial workflow |
| Visitor feedback | Email notification or admin aggregation, with anti-spam |
| Visitor analytics | Self-hosted lightweight PV/UV; no Google Analytics |
| RSS | RSS 2.0 feed once the blog module ships |
| 2FA / TOTP | Second factor for admin login; see [SECURITY.md](./SECURITY.md) |
| Theme marketplace | Load community theme packs from a GitHub URL; requires a theme package spec |
| API v1 stabilization | Freeze `/api/v1/*`; publish an OpenAPI schema first |

---

## Long term (v2.x)

- Pluggable data sources: abstract the TypeORM DataSource to support Postgres / MySQL
- Docker-free deploy: systemd unit + static build artifacts; lower priority
- Import / export: migrate content from Simple-Homepage, Hexo, Astro homepages
- CLI tooling: `homepage-cli` for content / backup / upgrade from the terminal
- SSR / prerender: crawler-friendly first paint, OG preview cards; Nuxt vs custom TBD

---

## Non-goals

- Multi-user / multi-tenant: serves one person only.
- Heavyweight CMS: no category trees, threaded comments, or editorial workflows.
- Drag-and-drop visual editor: layout comes from conventions and forms.
- Mobile apps: the responsive admin is sufficient.
- Closed-source commercial features: stays under MIT.
- Built-in LLM integrations: any AI capability, if added, ships as an optional plugin.
- Legacy browser support: only the two most recent major versions of modern browsers.

---

## How to participate

- Vote: 👍 on issues to signal priority
- Propose: open a thread in [Discussions](https://github.com/Dageling003/Dageling003-Homepage/discussions)
- Claim: planned items are open for PRs; open an issue first to align on design
- Report bugs / security: see the [issue templates](https://github.com/Dageling003/Dageling003-Homepage/issues/new/choose) and [SECURITY.md](./SECURITY.md)

---

## Related docs

- [CHANGELOG.md](./CHANGELOG.md) — shipped versions
- [SECURITY.md](./SECURITY.md) — reporting + baseline
- [docs/progress.md](./docs/progress.md) — fine-grained historical iteration log
- [CONTRIBUTING.md](./CONTRIBUTING.md) — contribution flow
