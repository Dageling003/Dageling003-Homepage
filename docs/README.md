# 📖 Homepage 项目文档

<p align="right">
  <strong>简体中文</strong> · <a href="./README.en.md">English</a>
</p>

> 本目录汇总 Homepage 项目的全部书面文档。若你是第一次接触本项目，建议先看仓库根目录的 [README.md](../README.md)，再回到这里按主题深入。

---

## 🗂 文档索引

| 分类 | 文档 | 适合谁 | 何时看 |
|------|------|--------|--------|
| 🏗 架构 | [architecture.md](./architecture.md) | 想理解整体设计的开发者 | 上手前先看一遍系统边界与模块划分 |
| 🧰 技术栈 | [technology-selection.md](./technology-selection.md) | 想复用选型 / 做技术决策的人 | 评估依赖版本、替换某个组件时 |
| 🛠 开发 | [dev-guide.md](./dev-guide.md) | 本地跑起来、日常改代码的贡献者 | 开始写代码 / 调试报错时 |
| 🚀 部署 | [deployment.md](./deployment.md) | 自托管站长 / 运维 | Docker / 手动部署 / 环境变量配置时 |
| 📡 API | [api.md](./api.md) | 前端联调 / 二次开发 | 需要接口清单和字段说明时（开发环境也可用 Swagger UI） |
| 📅 进度 | [progress.md](./progress.md) | 好奇项目演进的读者 | 想看功能开发历史、版本节点 |
| 🤝 贡献 | [CONTRIBUTING.md](../CONTRIBUTING.md) | 人类贡献者 / AI Agent | 了解开发规范、Skill 体系、提 PR 流程 |

---

## 🧭 阅读路径推荐

- **想快速跑通** → 根 [README](../README.md) → [dev-guide.md](./dev-guide.md)
- **想上线自己的实例** → 根 [README](../README.md) → [deployment.md](./deployment.md)
- **想改架构 / 提 PR** → [architecture.md](./architecture.md) → [technology-selection.md](./technology-selection.md) → [dev-guide.md](./dev-guide.md)
- **想接入 API** → [api.md](./api.md)（或本地起服务后访问 `http://localhost:8000/api/docs`）

### 📋 测试日志（`docs/log/`）

`docs/log/` 目录保存本地联调与问题修复的测试报告，按时间戳命名，记录特定场景下的测试过程与修复结果。

---

## 🔄 关于文档时效

- 大部分文档以 `> 最后更新：YYYY/MM/DD vX.Y.Z` 标注版本，请以文件头为准。
- 若发现文档与代码不一致，欢迎提 Issue 或直接 PR 修正。
- `progress.md` 属于历史记录性质，只做追加，不代表当前功能全集 —— 当前功能以根 README 与代码为准。
