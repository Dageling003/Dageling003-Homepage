# 图标本地缓存说明

## 问题原因
项目使用 `@iconify/vue` 和 `unplugin-icons` 从 CDN 加载图标，当网络连接不稳定或无法访问 iconify API 时会出现 `ERR_NAME_NOT_RESOLVED` 错误。

## 解决方案
已将所需图标下载到本地缓存，避免依赖网络请求。

## 使用方法

### 1. 更新图标缓存
如果需要添加新图标或更新现有图标，运行:

```bash
npm run icons:update
```

### 2. 添加新图标
编辑 `scripts/download-and-convert-icons.js` 文件，在 `iconCollections` 对象中添加新的图标集合和图标名称:

```javascript
const iconCollections = {
  'collection-name': ['icon1', 'icon2'],
  // 添加新的图标集合
  'new-collection': ['new-icon1', 'new-icon2'],
};
```

然后运行 `npm run icons:update`。

### 3. 在代码中使用
在 Vue 组件中直接使用 Icon 组件:

```vue
<template>
  <Icon icon="collection-name:icon-name" width="24" height="24" />
</template>

<script setup>
import { Icon } from '@iconify/vue';
</script>
```

## 文件结构

```
├── icons/                    # JSON 格式的图标数据 (缓存)
│   └── *.json
├── icons-svg/               # SVG 格式的图标文件 (实际使用)
│   └── collection-name/
│       └── *.svg
└── scripts/
    ├── download-and-convert-icons.js  # 图标下载和转换脚本
    └── ...
```

## 注意事项

1. 图标数据已缓存在 `icons/` 和 `icons-svg/` 目录
2. 这些目录已添加到 `.gitignore`,不会提交到 Git
3. 如果需要在团队中共享图标缓存，可以手动提交这些目录
4. 每次添加新图标后记得运行 `npm run icons:update`
