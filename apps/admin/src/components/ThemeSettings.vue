<script setup lang="ts">
import { useAdminThemeStore, THEME_PRESETS } from '@/stores/theme'

const themeStore = useAdminThemeStore()
</script>

<template>
  <!-- Floating trigger — capsule glass -->
  <button
    class="ts-trigger"
    type="button"
    :aria-label="'主题设置'"
    :title="'主题设置'"
    @click="themeStore.settingsPanelVisible = true"
  >
    <svg
      viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18" fill="currentColor" opacity="0.5" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="15.5" cy="8" r="1" />
      <circle cx="16" cy="15" r="1" />
    </svg>
  </button>

  <!-- Drawer panel -->
  <a-drawer
    :open="themeStore.settingsPanelVisible"
    title="外观"
    placement="right"
    :width="320"
    @close="themeStore.settingsPanelVisible = false"
  >
    <div class="ts-section">
      <h4 class="ts-label">主题模式</h4>
      <div class="ts-mode-switcher" role="tablist">
        <button
          type="button"
          class="ts-mode"
          :class="{ active: !themeStore.isDark }"
          @click="themeStore.isDark && themeStore.toggleDark()"
        >
          <svg
            viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
          <span>亮色</span>
        </button>
        <button
          type="button"
          class="ts-mode"
          :class="{ active: themeStore.isDark }"
          @click="!themeStore.isDark && themeStore.toggleDark()"
        >
          <svg
            viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
            stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
          >
            <path d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a6.6 6.6 0 0 0 9.9 9.9z" />
          </svg>
          <span>暗色</span>
        </button>
      </div>
    </div>

    <a-divider />

    <div class="ts-section">
      <h4 class="ts-label">强调色</h4>
      <div class="ts-colors">
        <button
          v-for="p in THEME_PRESETS"
          :key="p.key"
          type="button"
          class="ts-color-item"
          :class="{ active: themeStore.presetKey === p.key }"
          :style="{ '--ts-color': p.color }"
          :title="p.name"
          :aria-pressed="themeStore.presetKey === p.key"
          @click="themeStore.setPreset(p.key)"
        >
          <div class="ts-color-swatch">
            <svg
              v-if="themeStore.presetKey === p.key"
              viewBox="0 0 24 24" width="14" height="14"
              fill="none" stroke="currentColor" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span class="ts-color-name">{{ p.name }}</span>
        </button>
      </div>
    </div>

    <a-divider />

    <div class="ts-section">
      <h4 class="ts-label">当前配置</h4>
      <div class="ts-info">
        <div class="ts-info-row">
          <span class="ts-info-key">模式</span>
          <span class="ts-info-value">{{ themeStore.isDark ? '暗色' : '亮色' }}</span>
        </div>
        <div class="ts-info-row">
          <span class="ts-info-key">强调色</span>
          <span class="ts-info-value">
            <span
              class="ts-info-dot"
              :style="{ background: themeStore.currentPreset.color }"
              aria-hidden="true"
            />
            {{ themeStore.currentPreset.name }}
          </span>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<style scoped>
/* ====== Trigger — glass capsule floating on the edge ====== */
.ts-trigger {
  position: fixed;
  right: 0.9rem;
  bottom: 1.5rem;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-material-thick);
  backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: 999px;
  cursor: pointer;
  z-index: 999;
  color: var(--admin-primary);
  box-shadow: var(--admin-shadow-2);
  transition:
    transform var(--admin-duration-medium) var(--admin-ease-spring),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out);
  padding: 0;
  outline: none;
}

.ts-trigger:hover {
  transform: translate3d(0, -3px, 0) rotate(15deg);
  box-shadow: var(--admin-shadow-3);
}

.ts-trigger:active {
  transform: translate3d(0, 0, 0) scale(0.94);
}

/* ====== Sections ====== */
.ts-section {
  margin-bottom: 0.4rem;
}

.ts-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--admin-text-secondary);
  margin: 0 0 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ====== Mode switcher — segmented control ====== */
.ts-mode-switcher {
  display: flex;
  padding: 4px;
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  border-radius: 999px;
  gap: 4px;
}

.ts-mode {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  background: transparent;
  border: none;
  border-radius: 999px;
  color: var(--admin-text-secondary);
  font-size: 0.86rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--admin-duration-fast) var(--admin-ease-out),
    color var(--admin-duration-fast) var(--admin-ease-out),
    transform var(--admin-duration-medium) var(--admin-ease-spring);
  outline: none;
}

.ts-mode:hover:not(.active) {
  color: var(--admin-text);
}

.ts-mode.active {
  background: var(--admin-bg-elevated);
  color: var(--admin-primary);
  box-shadow: var(--admin-shadow-1);
  font-weight: 600;
}

.ts-mode svg { flex-shrink: 0; }

/* ====== Color presets ====== */
.ts-colors {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.55rem;
}

.ts-color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  padding: 0.4rem 0.2rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--admin-radius-md);
  transition:
    background-color var(--admin-duration-fast) var(--admin-ease-out),
    border-color var(--admin-duration-fast) var(--admin-ease-out);
  outline: none;
}

.ts-color-item:hover {
  background: var(--admin-material-thin);
}

.ts-color-item.active {
  background: var(--admin-primary-softer);
  border-color: var(--admin-hairline);
}

.ts-color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ts-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition:
    transform var(--admin-duration-medium) var(--admin-ease-spring),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--ts-color) 45%, transparent);
}

.ts-color-item:hover .ts-color-swatch {
  transform: scale(1.08) translate3d(0, -1px, 0);
}

.ts-color-item.active .ts-color-swatch {
  box-shadow:
    0 0 0 2px var(--admin-bg-elevated),
    0 0 0 4px var(--ts-color),
    0 4px 14px color-mix(in srgb, var(--ts-color) 55%, transparent);
}

.ts-color-name {
  font-size: 0.7rem;
  color: var(--admin-text-secondary);
  white-space: nowrap;
  letter-spacing: -0.005em;
}

.ts-color-item.active .ts-color-name {
  color: var(--admin-text);
  font-weight: 500;
}

/* ====== Info ====== */
.ts-info {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem;
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-md);
}

.ts-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  color: var(--admin-text);
}

.ts-info-key { color: var(--admin-text-secondary); }
.ts-info-value {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 500;
}

.ts-info-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 15%, transparent);
}
</style>
