# Changelog

本项目所有值得记录的变更都会写在这里。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-07-24

首个正式版（GA）。本版本确定了「pnpm monorepo（前台 / 后台 / API 三包）+ 可视化管理后台 + 可选 Docker Compose 部署」的最终交付形态，并将 SQLite 模式作为一等公民纳入开箱即用体验。

### Added
- **SQLite 试用模式**：新增无需 MariaDB 的 SQLite 运行档位，`pnpm install && pnpm dev` 即可起完整前后台三 tab。
- **可视化管理后台**：告别硬编码 JSON，个人信息、快捷链接、技术栈等表单化编辑，前台自动生效。
- **审计日志**：记录每一次后台变更，可回溯"谁在什么时候改了什么"。
- **网页标题自定义**：支持通过后台设置站点 title。
- **一键部署脚本**：`deploy.sh` v3 向导模式，自动生成 `.env`，交互式收集域名 / 管理员密码 / SMTP。
- **忘记密码 & 站长自助 bootstrap**：内置找回密码流程与首个管理员自助创建。
- **效果截图与文档索引**：`image/screenshots/` 全量脱敏截图 + 文档索引。
- **输入框自动保存**：配置页所有字段防抖自动保存 + 失焦保存，无需手动点击保存按钮。

### Changed
- **Docker 镜像瘦身**：精简 `Dockerfile.app` 构建产物，缩小最终镜像体积。
- **路由结构调整**：前台默认落在根路径 `/`，管理后台单独入口。
- **Node 引擎要求提升**：CI 与本地统一到 Node 22，匹配 pnpm 11.5.2。
- **低内存 VM 优化**：`--max-old-space-size` 从 2048 降到 512MB，避免小规格云主机 OOM。
- **Footer 信息更新**：显示 Dageling003-Homepage v1.0.0。
- **版本统一**：所有子包版本提升至 v1.0.0。

### Fixed
- **后台 Ant Design Vue 组件缺失**：全局注册 Antd，解决所有组件无法渲染的问题。
- **本地初始化保存与前后台页面显示**：修复首次 bootstrap 场景下的一系列显示异常。
- **Docker 并行构建失败**：明确 app → caddy 顺序构建流程。

### Docs
- **文档全面重写**：架构图、部署文档、SQLite 三 tab 开发流程。
- **中英文 README**：同步更新。

### Security
- JWT 启动强校验，密码 bcrypt 12 rounds。

---

[1.0.0]: https://github.com/Dageling003/Dageling003-Homepage/releases/tag/v1.0.0
