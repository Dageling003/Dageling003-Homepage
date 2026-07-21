# 📖 Homepage — Documentation

<p align="right">
  <a href="./README.md">简体中文</a> · <strong>English</strong>
</p>

> This directory holds all the written documentation for the Homepage project. If this is your first time here, start from the top-level [README.en.md](../README.en.md) and come back for topic-by-topic deep dives.

---

## 🗂 Index

| Area | Doc | Who it's for | When to read |
|------|------|--------|--------|
| 🏗 Architecture | [architecture.en.md](./architecture.en.md) | Developers who want the big picture | Read once before touching the codebase to understand boundaries and modules |
| 🧰 Stack | [technology-selection.en.md](./technology-selection.en.md) | Anyone reusing the stack / making tech decisions | When evaluating versions or swapping out a component |
| 🛠 Dev | [dev-guide.en.md](./dev-guide.en.md) | Contributors running & editing the code locally | When you start coding or debugging |
| 🚀 Deploy | [deployment.en.md](./deployment.en.md) | Self-hosters / ops | Docker / manual deploy / env var reference |
| 📡 API | [api.en.md](./api.en.md) | Frontend integrators / third parties | When you need endpoints and payload details (Swagger UI is also available in dev) |
| 📅 Progress | [progress.en.md](./progress.en.md) | Curious readers | To see feature history and version milestones |

---

## 🧭 Recommended reading paths

- **Just want to run it** → root [README.en](../README.en.md) → [dev-guide.en.md](./dev-guide.en.md)
- **Want to host my own instance** → root [README.en](../README.en.md) → [deployment.en.md](./deployment.en.md)
- **Want to change the architecture / send a PR** → [architecture.en.md](./architecture.en.md) → [technology-selection.en.md](./technology-selection.en.md) → [dev-guide.en.md](./dev-guide.en.md)
- **Want to consume the API** → [api.en.md](./api.en.md) (or hit `http://localhost:8000/api/docs` after starting the server)

---

## 🔄 On doc freshness

- Most docs carry a `> Last updated: YYYY/MM/DD vX.Y.Z` header — trust the file header.
- If you spot a mismatch between docs and code, please open an issue or send a PR directly.
- `progress.md` is append-only history and does **not** represent the current feature set — the root README and the code are the source of truth.
