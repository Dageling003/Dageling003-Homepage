# Roadmap

<p align="right">
  <strong>简体中文</strong> · <a href="./ROADMAP.en.md">English</a>
</p>

> 这份路线图不是"承诺书"，是**产品意图**。列出来的事情按优先级往前走，也会随社区反馈重排。
> 每完成一项，会在 [CHANGELOG.md](./CHANGELOG.md) 的 `[Unreleased]` → `[x.y.z]` 段落留痕。
>
> 最后更新：2026-07-25 · 当前版本 v1.0.0

---

## 🎯 产品定位（重要）

Dageling003-Homepage 不追求"什么都能做"。项目从 [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage) 起步，只做一件事：

> **让一个人拥有一个可以长期维护的、无需改 JSON 的个人主页。**

因此路线图会明确写出**不做什么**——因为「不做」和「做」同等重要。

---

## 🟢 短期（0–3 个月，v1.x）

聚焦：**稳定 + 门槛更低**。

| 主题 | 目标 | 状态 |
|------|------|------|
| **一条命令部署** | `curl \| bash` 从裸机到 HTTPS 可访问 ≤ 5 分钟 | ✅ v1.1 已完成 |
| **可视化后台补齐** | 前台仍需硬编码的字段全部表单化（社交链接图标、页脚版权、SEO meta） | 🚧 进行中 |
| **头像本地 + 图床双通道** | 支持自托管、七牛、S3、图床 URL 直填 | 📋 计划中 |
| **主题预设** | 至少 5 套官方主题（不止亮/暗），后台可切换 | 📋 计划中 |
| **多语言前台** | 前台 i18n（zh / en），后台文案先中文 | 📋 计划中 |
| **健康自检面板** | 后台仪表盘展示 SMTP / DB / 磁盘 / 证书到期 | 📋 计划中 |
| **一键升级** | `make update` 自动比对镜像 tag、跑 migration、平滑重启 | ✅ 部分完成 |

---

## 🟡 中期（3–9 个月，v1.5–v2.0）

聚焦：**从"个人主页"扩展到"个人品牌落地页"**。

| 主题 | 目标 | 备注 |
|------|------|------|
| **博客 / 短文模块** | 支持 Markdown 短文流，不做重量级 CMS；重点是"发一条动态" | 需评估：是否走独立表 vs 复用 config |
| **访客留言 / 反馈** | 邮件通知或后台聚合；反爬 + 简单反垃圾 | 依赖 SMTP 已就绪 |
| **访客分析** | 隐私优先（不用 GA），自建轻量 PV/UV 统计 | 数据只落本站数据库 |
| **RSS 输出** | 若上线博客模块，同步输出 RSS 2.0 | 依赖博客模块 |
| **2FA / TOTP** | 管理员登录二次验证 | 见 [SECURITY.md](./SECURITY.md) 已知限制 |
| **主题市场** | 支持从 GitHub URL 加载社区主题包 | 需要主题打包规范 |
| **API 稳定化 → v1** | 冻结 `/api/v1/*`，Breaking change 走 `/api/v2/*` | 前提是先出 OpenAPI schema |

---

## 🔵 长期（9 个月+，v2.x）

聚焦：**去 monorepo 依赖 + 生态**。

| 主题 | 目标 | 备注 |
|------|------|------|
| **可拔插数据源** | 支持 Postgres / MySQL，除了当前的 MariaDB / SQLite | 需要抽象 TypeORM DataSource |
| **无 Docker 部署** | 提供 systemd unit + 静态构建产物，适配无 Docker 的 VPS / NAS | 优先级不高 |
| **导入 / 导出** | 从 Simple-Homepage、Hexo、Astro 主页迁移过来一键导入 | **对老用户友好，属于 PM 债** |
| **CLI 工具** | `homepage-cli` 命令行完成日常操作（内容 / 备份 / 升级） | 面向服务器党 |
| **SSR / Prerender** | 首屏可爬，社交预览卡（OG image）动态生成 | 需评估 Nuxt / 自研 |

---

## 🚫 不做清单（Non-Goals）

以下事情**明确不做**，避免产品失焦。如果你有强需求，请 fork 或另立项目：

- ❌ **多用户 / 多租户**：本项目服务"一个人的主页"。真需要多人协作请用 Ghost / WordPress。
- ❌ **重量级 CMS**：分类树、评论嵌套、编辑工作流……不做。中期博客模块会保持极简。
- ❌ **可视化拖拽编辑器**：主页布局用**约定 + 表单**，不做 Notion / 落地页搭建器。
- ❌ **移动端 App**：后台响应式已够用，不出 iOS / Android 客户端。
- ❌ **闭源商业化功能**：所有能力都保留在 MIT License 下。
- ❌ **集成 XX 大模型 API**：AI 能力如果做，一定是可选的插件形式，不侵入核心。
- ❌ **兼容 IE / 老浏览器**：只支持最近 2 个大版本的现代浏览器。

---

## 🤝 你可以怎么参与

- **投票**：给 issue 加 👍，让我知道优先级
- **提案**：在 [Discussions](https://github.com/Dageling003/Dageling003-Homepage/discussions) 里聊
- **认领**：路线图里带 📋 的都可以 PR，认领前建议先开 issue 对齐设计
- **报 bug / 安全问题**：分别看 [issue 模板](https://github.com/Dageling003/Dageling003-Homepage/issues/new/choose) 与 [SECURITY.md](./SECURITY.md)

---

## 📚 相关文档

- [CHANGELOG.md](./CHANGELOG.md) — 已发布版本变更
- [SECURITY.md](./SECURITY.md) — 漏洞上报与安全基线
- [docs/progress.md](./docs/progress.md) — 更细粒度的历史迭代日志
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献流程
