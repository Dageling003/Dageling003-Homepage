# Changelog

本项目所有值得记录的变更都会写在这里。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-07-21

首个正式版（GA）。本版本确定了「pnpm monorepo（前台 / 后台 / API 三包）+ 可视化管理后台 + 可选 Docker Compose 部署」的最终交付形态，并将 SQLite 模式作为一等公民纳入开箱即用体验。

### Added
- **SQLite 试用模式**：新增无需 MariaDB 的 SQLite 运行档位，`pnpm install && pnpm dev` 即可起完整前后台三 tab（314f993）。
- **可视化管理后台**：告别硬编码 JSON，个人信息、快捷链接（拖拽排序）、技术栈等表单化编辑，前台自动生效。
- **审计日志**：记录每一次后台变更，可回溯"谁在什么时候改了什么"。
- **网页标题自定义**：支持通过后台设置站点 title（1b22425）。
- **一键部署脚本**：`deploy.sh` v3 向导模式，自动生成 `.env`，交互式收集域名 / 管理员密码 / SMTP（25987c7、e831176、a631229）。
- **快速配置向导脚本**：新增交互式初始化脚本，配套文档更新（39b18d7）。
- **PWA / SEO / a11y**：前端接入 PWA 离线支持、SEO 优化与可访问性增强（0e56205）。
- **忘记密码 & 站长自助 bootstrap**：内置找回密码流程与首个管理员自助创建（8f9830e）。
- **Docker 冒烟测试脚本**：健康检查、域名验证脚本入库（a8114fa）。
- **CI Docker 镜像构建校验 job**（2d5a984）。
- **效果截图与文档索引**：`image/screenshots/` 全量脱敏截图 + 文档索引，无 Demo 也能离线预览（ed94de3）。

### Changed
- **Docker 镜像瘦身**：精简 `Dockerfile.app` 构建产物，缩小最终镜像体积（7012418）。
- **路由结构调整**：前台默认落在根路径 `/`，管理后台单独入口，部署摘要重排（765727f、a9a533b、b223476）。
- **MariaDB 镜像源**：切换到 Docker Hub 加速器 / 阿里云镜像，规避国内拉取失败（80c63a0、185142c）。
- **Node 引擎要求提升**：CI 与本地统一到 Node 22，匹配 pnpm 11.5.2（9e82ed3）。
- **项目结构整理**：apps / docs / image 分区更清晰（f2a6369）。
- **低内存 VM 优化**：`--max-old-space-size` 从 2048 降到 512MB，避免小规格云主机 OOM（fc601ea、c07c600）。

### Fixed
- **本地初始化保存与前后台页面显示**：修复首次 bootstrap 场景下的一系列显示异常（0a86fac）。
- **CI 安全审计 high 漏洞**：解决全部 high 级 npm audit 告警（2a80755、3f885bf）。
- **TypeScript / ESLint 构建阻塞**：修复后端 30+ lint 错误 + TS 构建错误，CI 全绿（fed6777、457bbd0、aab0fc6）。
- **Docker 构建脚本白名单**：修复 pnpm `ignore-scripts` 相关的一系列构建失败（8235f8b 起一连串 docker fix）。
- **Caddy 启动 & 自动 HTTPS 续签**：修复部署脚本中的 Caddy 启动流程与域名交互（56578ce、c89b265）。

### Docs
- **文档全面重写**：架构图、部署文档、SQLite 三 tab 开发流程、Docker 部署当前状态说明（5a933d8、84859b8）。
- **MariaDB 镜像拉取失败故障排除**（8d0a72f）。
- **2026-07-20 测试与复现日志**入库（52ce655）。
- **Demo 下线兜底说明**：`dageling003.top` 到期后如何以仓库截图为准（ed94de3）。

### Security
- 实施 10 项安全加固（ff72a29）。
- CI audit 步骤切换到 npmjs registry，稳定 high 漏洞检测（7f9e9af）。

---

[1.0.0]: https://github.com/Dageling003/Dageling003-Homepage/releases/tag/v1.0.0
