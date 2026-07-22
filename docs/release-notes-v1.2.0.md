## 概述

本版本为 v1.1.1 之后的 UI 质感升级版本，核心工作是**将 Apple Design 17 条交互原则全面注入前端 UI**，让页面动效、材质、交互反馈更贴近苹果原生的流体体验。无功能变更、无破坏性调整。

---

## 🎨 Apple Design 注入

### 精准阻尼映射

- **全局动画曲线重构**：`--ease-out` 从 `cubic-bezier(0.22, 1, 0.36, 1)` 切换为苹果临界阻尼参数 `cubic-bezier(0.16, 1, 0.3, 1)`（damping 1.0, response 0.35–0.4）
- **`--ease-spring` 下调过冲幅度**：从 `1.4` 收敛到 `1.25`，更接近苹果 momentum 阻尼比 ~0.8 的物理感
- **所有 active 按下态**统一 `transition-duration: 100ms` + `ease-out`，确保 `pointer-down` 瞬间反馈

### 弹簧式入场动画

- **`springUp` 关键帧**：新增 `scale(0.97)` + `translate(0, 18px)` 双属性入场，对比旧版纯 `fadeUp` 更富弹性
- **Stagger 时序微调**：footer 从 360ms 延后至 400ms，制造更明显的「瀑布式」层级感
- **AnimatedLogo 脉冲环**：`ease-out` 替代 `ease-out`（硬编码回退），周期从 2.4s 延长至 2.8s 更舒缓

### 卡片悬浮层次

- **hover lift 3px → 5px**：卡片悬停提升幅度加大，阴影从 `--shadow-2` 升级至 `--shadow-3`
- **技术栈图标**：lift 3px → 4px，scale 1.05 → 1.06，配合 `backface-visibility: hidden` 启用 GPU 合成层
- **头像**：新增 `hover: scale(1.03)` 弹簧效果，提升社交互动感
- **快捷链接箭头**：悬停时 `translateX(3px)` 微动效指示方向

### 材质精致化

- **卡片亮边**：`::before` 渐变更宽（30% → 70% 平坦区），模拟更真实的光线捕捉材质
- **毛玻璃标签**：`letter-spacing` 微调 `0.005em → 0.008em` 提升可读性

### 排版调优

- **H1 大标题**：`letter-spacing: -0.025em`（收紧，适配大字号）、`line-height: 1.1`（苹果 Display 风格）
- **光标闪烁**：`transition-timing-function` 从 `linear` 改为 `ease-out`，视觉更柔和

---

## ⚙️ 版本号对齐

- 根 `package.json` `version: 1.1.1` → `1.2.0`，与 release tag 一致

---

## ✅ 验证

- `pnpm build` 三端（frontend / admin / backend）全部构建成功
- 所有修改已提交并打 tag `v1.2.0`