# Roadmap

<p align="right">
  <strong>简体中文</strong> · <a href="./ROADMAP.en.md">English</a>
</p>

记录当前在做的、计划做的、以及明确不做的事情。
每完成一项，会在 [CHANGELOG.md](./CHANGELOG.md) 对应版本段落里留痕。

最后更新：2026-07-25 · 当前版本 v1.0.0

---

## 项目定位

Dageling003-Homepage 衍生自 [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage)，目标只有一个：

> 一个人长期维护的个人主页，配置尽量走后台表单，而不是直接改 JSON 文件。

所以下面也列出了明确不做什么。

---

## 短期（v1.x）

重点：稳定 + 降低使用门槛。

| 主题 | 说明 | 状态 |
|------|------|------|
| 一条命令部署 | 跑一行命令从裸机起一个 HTTPS 服务 | ✅ v1.1 已完成 |
| 后台补齐 | 把仍在前台硬编码的字段（社交链接图标、页脚、SEO meta）做到后台可改 | 🚧 进行中 |
| 头像来源 | 自托管、七牛、S3、图床 URL 都能用 | 📋 计划中 |
| 主题预设 | 提供 5 套第一方主题，后台可切换 | 📋 计划中 |
| 前台多语言 | 前台 zh / en 切换；后台先保持中文 | 📋 计划中 |
| 健康自检 | 后台仪表盘显示 SMTP / DB / 磁盘 / 证书到期 | 📋 计划中 |
| 一键升级 | `make update` 比对镜像 tag、跑 migration、重启容器 | ✅ 部分完成 |

---

## 中期（v1.5–v2.0）

重点：从"个人主页"扩展到"个人品牌落地页"。

| 主题 | 说明 |
|------|------|
| 博客 / 短文 | Markdown 短文流，目标只是发一条动态；不做分类树、评论嵌套、编辑工作流 |
| 访客留言 | 邮件通知或后台聚合，带反垃圾 |
| 访客统计 | 自建轻量 PV/UV，不接 GA |
| RSS | 博客模块上线后同步出 RSS 2.0 |
| 2FA / TOTP | 管理员登录二次验证，见 [SECURITY.md](./SECURITY.md) |
| 主题市场 | 从 GitHub URL 加载社区主题包，需要先定主题包格式 |
| API v1 稳定 | 冻结 `/api/v1/*`，先出 OpenAPI schema |

---

## 长期（v2.x）

- 可拔插数据源：抽象 TypeORM DataSource，支持 Postgres / MySQL
- 无 Docker 部署：systemd unit + 静态构建产物，优先级不高
- 导入 / 导出：从 Simple-Homepage、Hexo、Astro 主页迁移过来

---

## 不做清单

- 多用户 / 多租户：只服务一个人。
- 重量级 CMS：不加分类树、评论嵌套、编辑工作流。
- 拖拽式可视化编辑器：布局走约定 + 表单。
- 移动端 App：后台已响应式。
- 兼容老旧浏览器：只支持最近 2 个大版本的现代浏览器。

---

## 参与方式

- 投票：给 issue 加 👍
- 提案：[Discussions](https://github.com/Dageling003/Dageling003-Homepage/discussions)
- 认领：计划中的项都可以 PR，建议先开 issue 对齐设计
- Bug / 安全：见 [issue 模板](https://github.com/Dageling003/Dageling003-Homepage/issues/new/choose) 与 [SECURITY.md](./SECURITY.md)

---

## 相关文档

- [CHANGELOG.md](./CHANGELOG.md) — 已发布版本变更
- [SECURITY.md](./SECURITY.md) — 漏洞上报与安全基线
- [docs/progress.md](./docs/progress.md) — 细粒度历史迭代日志
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 贡献流程
