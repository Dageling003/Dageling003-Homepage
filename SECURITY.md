# Security Policy

<p align="right">
  <strong>简体中文</strong> · <a href="./SECURITY.en.md">English</a>
</p>

感谢你花时间让 Dageling003-Homepage 变得更安全。本项目虽然是一个个人主页级别的开源产品，但只要它被自托管上线，**它就是别人的生产服务**。因此本仓库对安全漏洞的态度是：**认真对待、优先修复、公开致谢**。

---

## 📌 受支持的版本

只有当前主分支（`main`）与最新的 minor 版本会持续接收安全补丁。历史 patch 版本原则上不回填，除非漏洞极其严重。

| 版本 | 是否受支持 | 说明 |
|------|-----------|------|
| `main` (unreleased) | ✅ | 持续修复 |
| `1.x` 最新 patch | ✅ | 例如 `1.2.x` 会收到修复 |
| `1.x` 更早 patch | ❌ | 请升级到最新 patch |
| `0.x` | ❌ | 已废弃，请升级到 1.x |

查看当前版本：`cat package.json | grep version` 或看 [CHANGELOG.md](./CHANGELOG.md)。

---

## 🚨 上报漏洞

**请不要在公开 issue 中提交安全漏洞。** 公开 issue 会让**尚未打补丁的用户暴露在攻击窗口**。

### 首选渠道

- **GitHub Security Advisory**（推荐）：<https://github.com/Dageling003/Dageling003-Homepage/security/advisories/new>
  - 私密、可协作、可分配 CVE
- **邮件**：`2505472941@qq.com`
  - 建议使用邮件正文，避免加密附件；如果内容敏感可先发无信息邮件确认联系方式后再补发详情
  - ⚠️ 我可能不会立即查看邮件，但会尽力及时处理，请耐心等待

### 请在上报中包含

1. **漏洞类型**（例如 XSS、SQLi、SSRF、认证绕过、越权、RCE、DoS、供应链…）
2. **影响面**（哪个组件 / 哪个版本 / 哪些前置条件）
3. **复现步骤**（尽可能给出最小复现命令 / 截图 / HTTP 报文）
4. **PoC**（可选，但强烈建议）
5. **建议修复方向**（可选）

### 我们的承诺（SLA）

| 阶段 | 目标时间 |
|------|----------|
| **确认收到** | 3 个工作日内 |
| **初步定级 + 复现结论** | 7 个工作日内 |
| **严重 / 高危补丁发布** | 30 天内 |
| **中低危补丁发布** | 下一 minor 版本 |
| **公开披露** | 补丁发布后 ≥ 14 天，或与报告人协商 |

分级参考 [CVSS 3.1](https://www.first.org/cvss/calculator/3.1)。

### 致谢

我们会在补丁 release notes 与 [CHANGELOG.md](./CHANGELOG.md) 的 `Security` 段落中致谢报告人（除非报告人希望匿名）。

---

## 🛡 现有安全设计

以下是本项目在**代码 / 部署 / 运行时**三层已经做到的安全基线，方便你评估攻击面：

### 认证与会话
- **JWT + bcrypt 12 rounds**：无状态会话
- **`JWT_SECRET` 启动强校验**：≥ 20 位，非默认占位符，否则后端拒绝启动
- **`SETUP_TOKEN` 抢注防护**：生产环境 `users` 表为空 + 未设 `SETUP_TOKEN` 时启动直接失败，防止「上线到你完成初始化之间的窗口期被抢注管理员」
- **管理员密码强度**：≥ 12 位
- **密码重置 token**：15 分钟过期

### API 与传输
- **helmet**：CSP / HSTS 1y / cross-origin 策略
- **限流**：全局 120 req/min，登录 5 req/min（`@nestjs/throttler`）
- **请求体 1MB 上限**
- **class-validator + DTO 白名单**：`UpdateProfileDto` 只允许 `avatarUrl` 字段，杜绝 Mass Assignment
- **生产禁用 Swagger**

### 文件上传
- **头像三重校验**：MIME + sharp metadata + file-type magic bytes
- **强制转码**：统一转 200×200 WebP，落地前已再编码
- **内存存储 + ≤ 5 MB 上限**：不落原始文件到磁盘
- **静态文件目录禁执行**：Caddy 拒绝 `/files/*` 下的 `.php` / `.sh` / `.py` 请求

### 数据与备份
- **MariaDB 生产模式 + 参数化查询**（TypeORM）
- **`DB_SYNCHRONIZE` 生产环境警告**，官方部署路径走 Migration
- **数据库备份脚本**：`scripts/backup-db.sh`（`mysqldump` + gzip）

### 供应链与构建
- **pnpm lockfile 锁定 + `pnpm audit`** 在 CI 中运行
- **distroless 运行时镜像**：无 shell、无包管理器，攻击面最小化
- **依赖分层**：`pnpm deploy --prod` 仅生产依赖进入运行镜像
- **GitHub Actions CI**：lint + build + 单元测试 + `pnpm audit`

### 密钥与 `.env`
- `.env` / `.env.docker` **已在 `.gitignore` 中**
- 部署向导自动生成 `JWT_SECRET` / `SETUP_TOKEN` / DB 密码，用户无需手动想密码
- 一键部署产出的密钥仅存在于 `.env.docker`，**不写入镜像、不打印到远程日志**

---

## ⚠️ 已知限制

诚实是安全的一部分。以下是当前**不在**安全承诺范围内的项：

- **CSR SPA，无 SSR**：搜索引擎爬虫无法看到 Vue 动态渲染内容；如需 SSR / Prerender 请自行接入
- **没有 2FA / MFA**：单管理员场景暂不提供二次验证，未来可能通过 TOTP 补齐
- **不做恶意流量清洗**：项目层只做请求级限流，DDoS / L7 攻击请依赖前置 CDN / WAF
- **CVE 追踪与 SBOM**：目前只做 `pnpm audit`，未生成正式 SBOM；如你在企业内使用有强合规要求，欢迎在 issue 里发起讨论

---

## 🔗 相关链接

- [CHANGELOG.md](./CHANGELOG.md) — 每次安全修复都在 `Security` 段落归档
- [ROADMAP.md](./ROADMAP.md) — 安全相关规划见"安全 & 合规"轨道
- [docs/deployment.md](./docs/deployment.md) — 生产部署最佳实践
- [docs/deploy-beginner.md](./docs/deploy-beginner.md) — 零基础部署（含常见误配）
