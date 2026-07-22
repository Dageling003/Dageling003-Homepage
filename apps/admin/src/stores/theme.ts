import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Theme preset — Apple System palette */
export interface ThemePreset {
  name: string
  key: string
  color: string
  /** Dark-mode variant of the same accent (Apple system uses different tint in dark) */
  darkColor?: string
}

/** Apple System Colors, 2025 spec (approximated for web).
 *  Chosen for hue-parity with the previous set so users' saved keys keep working. */
export const THEME_PRESETS: ThemePreset[] = [
  { name: '深空蓝', key: 'blue',   color: '#0071e3', darkColor: '#0a84ff' },
  { name: '玫瑰橙', key: 'orange', color: '#ff9500', darkColor: '#ff9f0a' },
  { name: '仲夏绿', key: 'green',  color: '#34c759', darkColor: '#30d158' },
  { name: '琥珀金', key: 'gold',   color: '#ffcc00', darkColor: '#ffd60a' },
  { name: '暮光紫', key: 'purple', color: '#af52de', darkColor: '#bf5af2' },
  { name: '樱花粉', key: 'pink',   color: '#ff2d55', darkColor: '#ff375f' },
  { name: '雾岚灰', key: 'gray',   color: '#8e8e93', darkColor: '#98989d' },
]

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0 0 0'
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

/** Slightly darken a hex color for hover / active states. */
function shade(hex: string, amount: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!r) return hex
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  const c1 = clamp(parseInt(r[1], 16) + amount)
  const c2 = clamp(parseInt(r[2], 16) + amount)
  const c3 = clamp(parseInt(r[3], 16) + amount)
  return `#${c1.toString(16).padStart(2, '0')}${c2.toString(16).padStart(2, '0')}${c3.toString(16).padStart(2, '0')}`
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
    const activeColor = isDark.value && currentPreset.value.darkColor
      ? currentPreset.value.darkColor
      : currentPreset.value.color
    const rgb = hexToRgb(activeColor)

    // Theme scheme attribute (drives light/dark tokens below)
    if (isDark.value) {
      root.setAttribute('theme', 'dark')
      root.style.setProperty('color-scheme', 'dark')
    } else {
      root.removeAttribute('theme')
      root.style.setProperty('color-scheme', 'light')
    }

    /* ============================================================
       Apple design tokens — dynamically injected on <html>.
       These are read by:
         - apps/admin/src/styles/apple.css   (AntD overrides)
         - each page's <style scoped>        (component visuals)
       ============================================================ */

    /* Primary accent */
    root.style.setProperty('--admin-primary', activeColor)
    root.style.setProperty('--admin-primary-rgb', rgb)
    root.style.setProperty('--admin-primary-hover', shade(activeColor, isDark.value ? 20 : -12))
    root.style.setProperty('--admin-primary-active', shade(activeColor, isDark.value ? 30 : -22))
    root.style.setProperty('--admin-primary-soft', `rgba(${rgb}, ${isDark.value ? 0.22 : 0.14})`)
    root.style.setProperty('--admin-primary-softer', `rgba(${rgb}, ${isDark.value ? 0.12 : 0.08})`)
    /* Legacy names kept for backwards-compat */
    root.style.setProperty('--admin-primary-light', `rgba(${rgb}, 0.14)`)
    root.style.setProperty('--admin-primary-lighter', `rgba(${rgb}, 0.08)`)
    root.style.setProperty('--admin-primary-dark', shade(activeColor, isDark.value ? 25 : -18))

    if (isDark.value) {
      /* ---------- DARK MODE — inspired by macOS Sonoma glass ---------- */
      root.style.setProperty('--admin-bg',           '#000000')
      root.style.setProperty('--admin-bg-elevated',  '#1c1c1e')
      root.style.setProperty('--admin-bg-card',      '#1c1c1e')
      root.style.setProperty('--admin-bg-secondary', '#2c2c2e')
      root.style.setProperty('--admin-bg-tertiary',  '#3a3a3c')

      root.style.setProperty('--admin-text',            'rgba(255, 255, 255, 0.94)')
      root.style.setProperty('--admin-text-secondary', 'rgba(255, 255, 255, 0.62)')
      root.style.setProperty('--admin-text-tertiary',  'rgba(255, 255, 255, 0.42)')
      root.style.setProperty('--admin-text-inverse',   '#000000')

      root.style.setProperty('--admin-border',         'rgba(255, 255, 255, 0.10)')
      root.style.setProperty('--admin-hairline',       'rgba(255, 255, 255, 0.08)')
      root.style.setProperty('--admin-hairline-strong','rgba(255, 255, 255, 0.16)')

      /* Materials (translucent glass) */
      root.style.setProperty('--admin-material-thick',    'rgba(28, 28, 30, 0.75)')
      root.style.setProperty('--admin-material-regular',  'rgba(28, 28, 30, 0.62)')
      root.style.setProperty('--admin-material-thin',     'rgba(44, 44, 46, 0.5)')
      root.style.setProperty('--admin-material-ultrathin','rgba(60, 60, 62, 0.35)')

      /* Aurora orb tint for background */
      root.style.setProperty('--admin-orb-1', '#3a1d6e')
      root.style.setProperty('--admin-orb-2', '#0a84ff')
      root.style.setProperty('--admin-orb-3', '#0a4d8a')

      /* Shadows — deeper in dark */
      root.style.setProperty('--admin-shadow-1', '0 1px 2px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.4)')
      root.style.setProperty('--admin-shadow-2', '0 2px 6px rgba(0,0,0,0.5),  0 12px 32px rgba(0,0,0,0.55)')
      root.style.setProperty('--admin-shadow-3', '0 4px 12px rgba(0,0,0,0.55), 0 24px 60px rgba(0,0,0,0.65)')

      /* Success / warning / error — iOS system colors (dark variants) */
      root.style.setProperty('--admin-success', '#30d158')
      root.style.setProperty('--admin-warning', '#ff9f0a')
      root.style.setProperty('--admin-error',   '#ff453a')
      root.style.setProperty('--admin-info',    '#64d2ff')
    } else {
      /* ---------- LIGHT MODE — iOS/macOS system light ---------- */
      root.style.setProperty('--admin-bg',           '#f5f5f7')
      root.style.setProperty('--admin-bg-elevated',  '#ffffff')
      root.style.setProperty('--admin-bg-card',      '#ffffff')
      root.style.setProperty('--admin-bg-secondary', '#fafafa')
      root.style.setProperty('--admin-bg-tertiary',  '#efeff4')

      root.style.setProperty('--admin-text',            '#1d1d1f')
      root.style.setProperty('--admin-text-secondary', '#6e6e73')
      root.style.setProperty('--admin-text-tertiary',  '#8e8e93')
      root.style.setProperty('--admin-text-inverse',   '#ffffff')

      root.style.setProperty('--admin-border',         'rgba(0, 0, 0, 0.10)')
      root.style.setProperty('--admin-hairline',       'rgba(0, 0, 0, 0.08)')
      root.style.setProperty('--admin-hairline-strong','rgba(0, 0, 0, 0.14)')

      /* Materials (translucent glass) */
      root.style.setProperty('--admin-material-thick',    'rgba(255, 255, 255, 0.82)')
      root.style.setProperty('--admin-material-regular',  'rgba(255, 255, 255, 0.68)')
      root.style.setProperty('--admin-material-thin',     'rgba(255, 255, 255, 0.5)')
      root.style.setProperty('--admin-material-ultrathin','rgba(255, 255, 255, 0.35)')

      /* Aurora orb tint for background */
      root.style.setProperty('--admin-orb-1', '#ffb1d8')
      root.style.setProperty('--admin-orb-2', '#a5c8ff')
      root.style.setProperty('--admin-orb-3', '#b4f0d9')

      /* Shadows — soft, layered (Apple-style card elevation) */
      root.style.setProperty('--admin-shadow-1', '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05)')
      root.style.setProperty('--admin-shadow-2', '0 2px 6px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.08)')
      root.style.setProperty('--admin-shadow-3', '0 4px 12px rgba(0,0,0,0.06), 0 24px 60px rgba(0,0,0,0.12)')

      /* Semantic — iOS system colors (light) */
      root.style.setProperty('--admin-success', '#34c759')
      root.style.setProperty('--admin-warning', '#ff9500')
      root.style.setProperty('--admin-error',   '#ff3b30')
      root.style.setProperty('--admin-info',    '#64d2ff')
    }

    /* ---------- Radii — iOS continuous corners ---------- */
    root.style.setProperty('--admin-radius-xs', '6px')
    root.style.setProperty('--admin-radius-sm', '10px')
    root.style.setProperty('--admin-radius-md', '14px')
    root.style.setProperty('--admin-radius-lg', '20px')
    root.style.setProperty('--admin-radius-xl', '28px')
    root.style.setProperty('--admin-radius-pill', '999px')

    /* ---------- Blur & saturation ---------- */
    root.style.setProperty('--admin-blur', '30px')
    root.style.setProperty('--admin-blur-strong', '40px')
    root.style.setProperty('--admin-saturation', '180%')

    /* ---------- Motion (Apple springs / cross-fades) ---------- */
    root.style.setProperty('--admin-ease-out',    'cubic-bezier(0.22, 1, 0.36, 1)')
    root.style.setProperty('--admin-ease-spring', 'cubic-bezier(0.34, 1.4, 0.64, 1)')
    root.style.setProperty('--admin-ease-standard', 'cubic-bezier(0.4, 0, 0.2, 1)')
    root.style.setProperty('--admin-duration-fast',   '180ms')
    root.style.setProperty('--admin-duration-medium', '320ms')
    root.style.setProperty('--admin-duration-slow',   '520ms')
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
