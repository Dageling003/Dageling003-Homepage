<p align="center">
  <img src="https://socialify.git.ci/Dageling003/Dageling003-Homepage/image?custom_description=%E4%B8%80%E4%B8%AA%E5%9F%BA%E4%BA%8EVue%E7%9A%84%E7%AE%80%E7%BA%A6%E9%A3%8E%E4%B8%AA%E4%BA%BA%E4%B8%BB%E9%A1%B5&description=1&font=KoHo&forks=1&issues=1&language=1&name=1&owner=1&pattern=Brick+Wall&pulls=1&stargazers=1&theme=Light" alt="Dageling003-Homepage" />
</p>

## 项目声明

这是一个基于 [Simple-Homepage](https://github.com/QNquenan/Simple-Homepage) 的二次开发项目，使用 Vue 3 和 Vite 构建。

原项目作者：[鹊楠吖~](https://github.com/QNquenan)

本项目在原有基础上进行了以下修改和扩展：

## 项目介绍

这是一个轻量级的个人主页项目，使用 Vue 3 和 Vite 构建，具有以下特点：

- 响应式设计，适配不同屏幕尺寸
- 明暗主题切换功能
- 模块化配置，易于自定义
- 打字机效果欢迎语
- 现代化的 UI 设计

## 技术栈

- [Vue 3](https://v3.vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 新一代前端构建工具
- [Iconify](https://iconify.design/) - 统一图标框架

## 项目结构

```
src/
├── assets/              # 静态资源文件
│   └── css/             # 样式文件
├── components/          # Vue组件
├── config/              # 配置文件
├── views/               # 页面视图
├── App.vue              # 根组件
├── main.js              # 入口文件
└── style.css            # 全局样式
```

## 配置文件说明

项目的所有可配置内容都存放在 `src/config/`目录下，通过修改这些 JSON 文件可以轻松自定义个人主页的内容。

### config.json - 基本信息配置

存储个人基本信息：

```json
{
  "name": "姓名",
  "age": "年龄(建议写0几年)",
  "zodiac": "星座",
  "avatarUrl": "头像链接",
  "emjoi": "个人签名表情",
  "infoTags": {
    "sex": "性别",
    "school": "学校",
    "province": "省份"
  },
  "professions": ["职业标签1", "职业标签2", "职业标签3"]
}
```

### linkBtn.json - 链接按钮配置

配置主页上的链接按钮，支持图标、文字、颜色和链接：

```json
{
  "linkBtn": [
    {
      "icon": "图标名称",
      "text": "按钮文字",
      "color": "背景颜色",
      "url": "链接地址"
    }
  ]
}
```

### techStack.json - 技术栈配置

展示掌握的技术栈，使用 Iconify 图标：

```json
{
  "techStack": [
    {
      "icon": "图标名称",
      "name": "技术名称"
    }
  ]
}
```

### todo.json - 待办事项配置

展示个人计划或目标：

```json
{
  "todoList": [
    {
      "text": "待办事项",
      "checked": false // 是否完成
    }
  ]
}
```

### typewriter.json - 打字机文本

配置打字机效果显示的文本内容：

```json
["文本1", "文本2", "文本3"]
```

## 图标使用

项目使用 [Iconify](https://iconify.design/) 图标库，并通过本地缓存确保离线可用。

### 图标缓存机制

为避免网络不稳定导致的图标加载失败，项目已将所需图标下载到本地缓存。图标数据存储在以下目录：

```
├── icons/              # JSON 格式的图标数据（缓存）
│   └── *.json
├── icons-svg/          # SVG 格式的图标文件（实际使用）
│   └── collection-name/
│       └── *.svg
└── scripts/
    └── download-and-convert-icons.js  # 图标下载脚本
```

> ⚠️ 注意：`icons/` 和 `icons-svg/` 目录已添加到 `.gitignore`，不会提交到 Git。如需在团队中共享图标缓存，可手动提交这些目录。

### 添加新图标

如需添加新的图标，按以下步骤操作：

1. 编辑 `scripts/download-and-convert-icons.js`，在 `iconCollections` 中添加新的图标集合和名称：

```javascript
const iconCollections = {
  // 现有图标...
  '新集合名': ['图标1', '图标2'], // 添加新图标
};
```

2. 运行更新脚本：

```bash
npm run icons:update
```

### 在代码中使用

在 Vue 组件中使用图标：

```vue
<template>
  <Icon icon="集合名:图标名" width="24" height="24" />
</template>

<script setup>
import { Icon } from '@iconify/vue';
</script>
```

## 安装与使用

1. 克隆项目到本地：

   ```bash
   git clone https://github.com/Dageling003/Dageling003-Homepage.git
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 启动开发服务器：

   ```bash
   npm run dev
   ```

4. 构建生产版本：

   ```bash
   npm run build
   ```

5. 预览生产构建：
   ```bash
   npm run preview
   ```

## 主题切换

项目支持明暗主题切换，点击页面右上角的主题切换按钮即可在浅色和深色主题间切换。

## 许可证

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for details.
