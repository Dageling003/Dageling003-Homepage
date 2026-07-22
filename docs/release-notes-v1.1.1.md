## 概述

本版本为 v1.1.0 之后的工程侧优化版本，聚焦 CI 稳定性、依赖治理与代码质量收敛，无功能变更、无破坏性调整。仅涉及构建、依赖锁、Lint 收尾工作，业务链路与部署方式与 v1.1.0 保持完全一致。

---

## 🚦 CI 稳定性

- **本地 registry 中转 app 镜像给 caddy 构建阶段使用**：修复 buildx `docker-container` driver 无法读取 daemon 本地镜像、导致 `Dockerfile.caddy` 的 `FROM homepage-app:latest` 在 CI 中拉取失败的问题。
  - 通过 `services.registry` 起临时 `registry:2`，app 阶段 push 到 `localhost:5000`，caddy 阶段从同地址拉取，保留 GHA 缓存链路
- **收敛 Node 矩阵为 22**：`engines.node` 已限定 `>=22.13`，`lint` 与 `build` 不再跑 Node 24，节省 CI 时间；PR 场景启用 `concurrency.cancel-in-progress`，install 增加 `--prefer-offline` 优先命中 `setup-node` 的 pnpm store 缓存

---

## 🔧 依赖管理

- **`brace-expansion` 双通道 override**：拆成 `1.x` / `2.x` 两条 override，避免 v5 破坏性 API 泄漏到工作区
- **`fast-uri` 提升到 `>=3.1.4`**：覆盖 GHSA 告警
- **补齐 `@eslint/js`**：`apps/admin` 与 `apps/frontend` 显式声明 `@eslint/js` dev 依赖，与已使用的 eslint flat config 对齐，避免 monorepo hoist 变化时解析失败

---

## 🧹 代码质量

- **修复 `lint --fix` 遗留告警与未使用变量**：
  - `SetupWizard.vue`：数组解构改用逗号占位丢弃未使用元素
  - `auth.module.ts`：`signOptions.expiresIn` 用 `JwtSignOptions` 类型替换 `any`
  - `ThemeSettings` / `AdminLayout` / `ConfigFormModal`：`eslint --fix` 自动整理属性换行 & kebab-case

---

## ⚙️ 版本号对齐

- 根 `package.json` `version: 1.1.0` → `1.1.1`，与 release tag 一致

---

## ✅ 验证

- `pnpm build` 三端（frontend / admin / backend）全部构建成功
- CI（Node 22 矩阵 + Docker 双阶段构建）全绿
- 所有修改已提交并打 tag `v1.1.1`
