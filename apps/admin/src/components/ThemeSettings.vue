<script setup lang="ts">
import { useAdminThemeStore, THEME_PRESETS } from '@/stores/theme'

const themeStore = useAdminThemeStore()
</script>

<template>
  <!-- Floating trigger button -->
  <div class="ts-trigger" @click="themeStore.settingsPanelVisible = true">
    <span class="ts-trigger-icon">🎨</span>
  </div>

  <!-- Drawer panel -->
  <a-drawer
    :open="themeStore.settingsPanelVisible"
    title="主题设置"
    placement="right"
    width="300"
    @close="themeStore.settingsPanelVisible = false"
  >
    <div class="ts-section">
      <h4 class="ts-label">主题模式</h4>
      <div class="ts-row">
        <a-button
          :type="themeStore.isDark ? 'default' : 'primary'"
          @click="themeStore.isDark && themeStore.toggleDark()"
          block
        >
          ☀️ 亮色
        </a-button>
        <a-button
          :type="themeStore.isDark ? 'primary' : 'default'"
          @click="!themeStore.isDark && themeStore.toggleDark()"
          block
        >
          🌙 暗色
        </a-button>
      </div>
    </div>

    <a-divider />

    <div class="ts-section">
      <h4 class="ts-label">主题色</h4>
      <div class="ts-colors">
        <div
          v-for="p in THEME_PRESETS"
          :key="p.key"
          class="ts-color-item"
          :class="{ active: themeStore.presetKey === p.key }"
          :style="{ '--ts-color': p.color }"
          :title="p.name"
          @click="themeStore.setPreset(p.key)"
        >
          <div class="ts-color-swatch">
            <span v-if="themeStore.presetKey === p.key" class="ts-check">✓</span>
          </div>
          <span class="ts-color-name">{{ p.name }}</span>
        </div>
      </div>
    </div>

    <a-divider />

    <div class="ts-section">
      <h4 class="ts-label">当前配置</h4>
      <div class="ts-info">
        <div class="ts-info-row">
          <span>模式</span>
          <span>{{ themeStore.isDark ? '暗色' : '亮色' }}</span>
        </div>
        <div class="ts-info-row">
          <span>主题色</span>
          <span class="ts-info-dot" :style="{ color: themeStore.currentPreset.color }">
            ● {{ themeStore.currentPreset.name }}
          </span>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<style scoped>
/* ====== Trigger Button ====== */
.ts-trigger {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-primary, #1677ff);
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  z-index: 999;
  transition: width 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.ts-trigger:hover {
  width: 40px;
}

.ts-trigger-icon {
  font-size: 1.1rem;
  line-height: 1;
}

/* ====== Sections ====== */
.ts-section {
  margin-bottom: 0.5rem;
}

.ts-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #262626;
  margin: 0 0 0.6rem;
}

/* ====== Theme toggle row ====== */
.ts-row {
  display: flex;
  gap: 0.5rem;
}

/* ====== Color presets ====== */
.ts-colors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}

.ts-color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
  padding: 0.3rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.ts-color-item:hover {
  background: #f5f5f5;
}

.ts-color-item.active {
  background: #e6f4ff;
}

.ts-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ts-color);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.ts-color-item:hover .ts-color-swatch {
  transform: scale(1.1);
}

.ts-color-item.active .ts-color-swatch {
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--ts-color);
}

.ts-check {
  color: #fff;
  font-size: 0.8rem;
  font-weight: bold;
}

.ts-color-name {
  font-size: 0.7rem;
  color: #8c8c8c;
  white-space: nowrap;
}

/* ====== Info ====== */
.ts-info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ts-info-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #595959;
}

.ts-info-dot {
  font-weight: 500;
}
</style>
