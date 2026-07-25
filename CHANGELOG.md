# Changelog

本项目所有值得记录的变更都会写在这里。

格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

安全类修复统一收在每个版本的 `Security` 段落，参见 [SECURITY.md](./SECURITY.md)。

## [Unreleased]

尚未发布的变更。**当决定切下一个 minor / patch 时，把该段整体挪到新版本标题下。**

### Added
- **一条命令部署**：新增 `scripts/install.sh` 远程引导（依赖检查 → clone → 调 deploy.sh），支持 `curl -fsSL <url> | bash` 一行拉起
- **Makefile 快捷入口**：`make up / down / logs / ps / update / backup / smoke / dev / clean / help`，老手一键直达
- **README 新增「缘起」板块**：说明与 [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage) 的关系、6 维度对比与产品选型建议
- **PRODUCT.md**：产品定位 / 目标用户 / 核心 Journey / RICE 优先级 / 7 条产品原则 / 不做清单，给未来 issue 与 PR 决策做锚点
- **后端 auth-flow e2e**：新增 `apps/backend/test/auth-flow.e2e-spec.ts` 23 个 case，覆盖登录 / cookie & bearer / 改密码 / 忘记密码 / 重置密码全链路
- **前端图标构建脚本**：`scripts/build-icons.mjs` 从 `@iconify-json/logos` 抽 HomeView 里用到的 32 个图标生成 `src/icons/tech-icons.json`（64 KB）

### Changed
- **README 首屏 slogan**：从「轻量、可自托管…」改为「站在 Simple-Homepage 肩膀上」，强化差异化定位
- **README Docker 部署章节**：改为三入口并列（远程 curl / `make up` / `bash scripts/deploy.sh`），中英文同步
- **前端字体 / 图标 self-host**：字体从 `fonts.googleapis.com` 换成 `@fontsource/inter`（latin + 400/500/600），图标从 `api.iconify.design` CDN 换成构建期抽出的子集 JSON —— 首屏不再依赖国内不稳定的外部 CDN
- **后端 TypeORM 装配**：`TypeOrmModule.forRoot(...)` 改为 `forRootAsync({ useFactory })`，e2e 里覆盖 env 才能真正生效，装饰器求值阶段不再读环境变量
- **后端全局限流**：`ThrottlerModule` 加 `skipIf: NODE_ENV=test`，e2e 顺序调用登录接口不再被 `@Throttle(5/60s)` 命中 429

### Fixed
- **admin 账号页**：修复邮箱设置项在无 SMTP 环境下暴露的问题，同步更新 API 类型
- **backend BUG-005**：生产环境启动 fail-fast 守卫，`JWT_SECRET` / `SETUP_TOKEN` 缺失直接拒启
- **backend BUG-006**：`configValue` 落库前做 JSON 结构校验，脏数据不再进入数据库
- **backend BUG-001~003**：审计日志全链路补全 + `User.email` 列 + 时间范围过滤修正
- **frontend 隐私脱敏**：模板中的姓名 / 地区 / 学校 / 生日替换为占位符，占位链接统一过滤，favicon 更新
- **frontend 占位链接过滤**：`isPlaceholderUrl` 现在正确处理 `mailto:` / `tel:` 等 URL（之前 hostname 为空会漏过滤），白名单扩到 `example.org` / `example.net`
- **Caddy**：`CSP` 策略移到 per-handle 块并加 `force-replace` 前缀，修复覆盖失效问题
- **Caddy ACME_EMAIL**：占位符 (`your-email@example.com` 等) 或非邮箱格式会 fail-fast 拒绝启动，避免命中 ZeroSSL / Let's Encrypt rate limit
- **PWA**：`index.html` 加入预缓存，`/api` 响应不再缓存，避免 CSP header 陈旧

### Performance
- **admin 首屏 bundle**：`SCHOOLS` 静态数组（2909 条）改为懒加载，首屏体积显著下降
- **frontend 首屏**：字体 / 图标 self-host 后，首屏不再等待 fonts.googleapis.com + api.iconify.design 两个跨境请求，国内网络下首屏 TTI 显著改善

### Security
- **SEC-001..007**：内部审计发现的问题批量修复（详见 commit `e12a46c`）
- **安全审计策略收紧**：依赖升级 + `sharp` / `svgo` 工具链更新，`pnpm audit` 全绿
- 新增 [SECURITY.md](./SECURITY.md)：漏洞上报渠道 / SLA / 现有安全设计基线

### Docs
- 新增 [ROADMAP.md](./ROADMAP.md)：短 / 中 / 长期路线图 + 明确的「不做清单」
- 新增 [SECURITY.md](./SECURITY.md) 中英双语版
- 新增 [PRODUCT.md](./PRODUCT.md)：产品定位 / 目标用户 / RICE 优先级 / 7 条产品原则

### Refactor
- **Caddy Dockerfile**：改为 self-contained，移除对 app 镜像的构建期依赖，可独立构建

### CI
- **docker build**：直接构建替代本地 registry，修复镜像共享问题
- **测试**：SQLite 跑测试，lint / typecheck 拆分为独立 job

---

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

[Unreleased]: https://github.com/Dageling003/Dageling003-Homepage/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Dageling003/Dageling003-Homepage/releases/tag/v1.0.0
