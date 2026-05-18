# 图标缓存技术文档

> 本文档提供图标缓存的技术细节。图标使用说明请参阅 [README.md](./README.md)。

## 概述

项目使用 `@iconify/vue` 和 `unplugin-icons`，通过 `FileSystemIconLoader` 从本地文件系统加载图标，避免依赖外部 CDN。

## 文件结构

```
├── icons/                      # JSON 格式的图标数据（缓存）
│   └── *.json
├── icons-svg/                  # SVG 格式的图标文件（实际使用）
│   └── collection-name/
│       └── *.svg
└── scripts/
    └── download-and-convert-icons.js
```

## 图标下载脚本

`scripts/download-and-convert-icons.js` 负责从 Iconify API 下载图标并转换为本地格式。

### 配置项

在脚本中修改 `iconCollections` 对象来添加或更新图标：

```javascript
const iconCollections = {
  'collection-name': ['icon1', 'icon2', 'icon3'],
};
```

### 运行脚本

```bash
npm run icons:update
```

脚本会：
1. 从 Iconify API 下载指定图标的 JSON 数据
2. 将 SVG 内容保存到 `icons-svg/` 目录
3. 将元数据保存到 `icons/` 目录

## 注意事项

- `icons/` 和 `icons-svg/` 目录已添加到 `.gitignore`
- 如需在团队中共享图标缓存，可手动提交这些目录
- 添加新图标后需运行 `npm run icons:update`
