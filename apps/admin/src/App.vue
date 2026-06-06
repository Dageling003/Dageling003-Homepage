<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useAdminThemeStore } from '@/stores/theme'
import { onMounted, onUnmounted } from 'vue'
import { ConfigProvider, theme } from 'ant-design-vue'

const authStore = useAuthStore()
const themeStore = useAdminThemeStore()

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
  <ConfigProvider
    :theme="{
      algorithm: themeStore.isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }"
  >
    <RouterView />
  </ConfigProvider>
</template>
