import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 主题色预设 */
export interface ThemePreset {
  name: string
  key: string
  color: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { name: '极光蓝', key: 'blue', color: '#1677ff' },
  { name: '火山橙', key: 'orange', color: '#fa541c' },
  { name: '草绿', key: 'green', color: '#52c41a' },
  { name: '日落黄', key: 'gold', color: '#faad14' },
  { name: '暮光紫', key: 'purple', color: '#722ed1' },
  { name: '樱花粉', key: 'pink', color: '#eb2f96' },
  { name: '极客灰', key: 'gray', color: '#8c8c8c' },
]

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0 0'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

export const useAdminThemeStore = defineStore('adminTheme', () => {
  const isDark = ref(localStorage.getItem('admin-theme') === 'dark')
  const presetKey = ref(localStorage.getItem('admin-preset') || 'blue')
  const settingsPanelVisible = ref(false)

  const currentPreset = ref(THEME_PRESETS.find(p => p.key === presetKey.value) || THEME_PRESETS[0])

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('admin-theme', isDark.value ? 'dark' : 'light')
    applyTheme()
    window.dispatchEvent(new CustomEvent('admin-theme-change', { detail: { isDark: isDark.value } }))
  }

  function setPreset(key: string) {
    const preset = THEME_PRESETS.find(p => p.key === key)
    if (!preset) return
    presetKey.value = key
    currentPreset.value = preset
    localStorage.setItem('admin-preset', key)
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement
    const rgb = hexToRgb(currentPreset.value.color)

    // Theme scheme
    if (isDark.value) {
      root.setAttribute('theme', 'dark')
    } else {
      root.removeAttribute('theme')
    }

    // Primary color CSS vars
    root.style.setProperty('--admin-primary', currentPreset.value.color)
    root.style.setProperty('--admin-primary-rgb', rgb)

    // Generate lighter/darker variants
    root.style.setProperty('--admin-primary-light', `rgba(${rgb}, 0.1)`)
    root.style.setProperty('--admin-primary-lighter', `rgba(${rgb}, 0.06)`)
    root.style.setProperty('--admin-primary-dark', isDark.value ? '#fff' : '#0958d9')

    // Background colors per scheme
    if (isDark.value) {
      root.style.setProperty('--admin-bg', '#141414')
      root.style.setProperty('--admin-bg-card', '#1f1f1f')
      root.style.setProperty('--admin-bg-elevated', '#262626')
      root.style.setProperty('--admin-text', 'rgba(255, 255, 255, 0.85)')
      root.style.setProperty('--admin-text-secondary', 'rgba(255, 255, 255, 0.45)')
      root.style.setProperty('--admin-border', '#303030')
    } else {
      root.style.setProperty('--admin-bg', '#f0f2f5')
      root.style.setProperty('--admin-bg-card', '#ffffff')
      root.style.setProperty('--admin-bg-elevated', '#ffffff')
      root.style.setProperty('--admin-text', '#262626')
      root.style.setProperty('--admin-text-secondary', '#8c8c8c')
      root.style.setProperty('--admin-border', '#f0f0f0')
    }
  }

  // Initialize on first load
  function initTheme() {
    applyTheme()
  }

  return {
    isDark,
    presetKey,
    currentPreset,
    settingsPanelVisible,
    toggleDark,
    setPreset,
    applyTheme,
    initTheme,
  }
})
