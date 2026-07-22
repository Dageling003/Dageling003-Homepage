<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useAdminThemeStore } from '@/stores/theme'
import { onMounted, onUnmounted, computed } from 'vue'
import { ConfigProvider, theme } from 'ant-design-vue'

const authStore = useAuthStore()
const themeStore = useAdminThemeStore()

/**
 * AntD ConfigProvider token overrides — synchronized with the
 * dynamic CSS variables written by useAdminThemeStore.applyTheme().
 * These primarily affect components that consume the AntD JS theme
 * (algorithms, motion), while `apple.css` handles the visual layer.
 */
const antdTheme = computed(() => ({
  algorithm: themeStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: themeStore.currentPreset.color,
    colorSuccess: '#34c759',
    colorWarning: '#ff9500',
    colorError:   '#ff3b30',
    colorInfo:    '#0a84ff',
    borderRadius: 14,
    borderRadiusLG: 20,
    borderRadiusSM: 10,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", ' +
      '"Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", ' +
      '"Helvetica Neue", Roboto, Arial, sans-serif',
    fontSize: 14,
    controlHeight: 36,
    controlHeightLG: 44,
    motionDurationSlow: '0.32s',
    motionDurationMid: '0.24s',
    motionDurationFast: '0.18s',
    motionEaseOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
    motionEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    wireframe: false,
  },
}))

function handleThemeChange() {
  // sync handled by the store
}

onMounted(() => {
  authStore.checkAuth()
  themeStore.initTheme()
  window.addEventListener('admin-theme-change', handleThemeChange)
})

onUnmounted(() => {
  window.removeEventListener('admin-theme-change', handleThemeChange)
})
</script>

<template>
  <ConfigProvider :theme="antdTheme">
    <!-- Ambient aurora backdrop — sits behind everything. -->
    <div class="app-ambient" aria-hidden="true">
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="orb orb-c" />
    </div>
    <RouterView />
  </ConfigProvider>
</template>
