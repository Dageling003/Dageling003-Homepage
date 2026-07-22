<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { ref, onMounted, onBeforeMount } from 'vue'

const themeStore = useThemeStore()
const loaded = ref(false)

onBeforeMount(() => {
  themeStore.initTheme()
})

onMounted(() => {
  document.getElementById('app')?.classList.add('loaded')
  requestAnimationFrame(() => {
    loaded.value = true
  })
})
</script>

<template>
  <div class="app" :class="{ loaded }">
    <div class="ambient" aria-hidden="true">
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="orb orb-c" />
      <div class="grain" />
    </div>
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>

<style>
:root {
  color-scheme: light dark;

  /* ---------- Base surface ---------- */
  --background: #eef2f7;
  --surface: #ffffff;
  --text-color: rgba(0, 0, 0, 0.88);
  --text-secondary: rgba(0, 0, 0, 0.56);
  --text-tertiary: rgba(0, 0, 0, 0.38);

  /* ---------- Materials (translucent glass) ----------
     Weight scale: thick > regular > thin > ultraThin
     Only used where content can pass beneath them. */
  --material-thick: rgba(255, 255, 255, 0.78);
  --material-regular: rgba(255, 255, 255, 0.62);
  --material-thin: rgba(255, 255, 255, 0.45);
  --material-ultrathin: rgba(255, 255, 255, 0.28);
  --material-blur: 30px;
  --material-saturation: 180%;

  /* Hairline separators — 1px on 2x screens */
  --hairline: rgba(0, 0, 0, 0.08);
  --hairline-strong: rgba(0, 0, 0, 0.14);

  /* Legacy tokens (kept for backwards compat with any raw refs) */
  --card-background: var(--material-regular);
  --card-border-color: rgba(255, 255, 255, 0.6);
  --techItem-background: rgba(255, 255, 255, 0.55);
  --tip-color: #fff;

  /* ---------- Accent (Apple-style dynamic tint) ---------- */
  --theme-color: #0a84ff;
  --theme-color-soft: rgba(10, 132, 255, 0.14);
  --loading-background: var(--background);

  /* Ambient orb colors — soft, editorial */
  --orb-1: #ffb1d8;
  --orb-2: #a5c8ff;
  --orb-3: #b4f0d9;

  /* Elevation — soft, layered, close to Apple's card shadow */
  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.04),
              0 4px 12px rgba(0, 0, 0, 0.05);
  --shadow-2: 0 2px 6px rgba(0, 0, 0, 0.05),
              0 12px 32px rgba(0, 0, 0, 0.08);
  --shadow-3: 0 4px 12px rgba(0, 0, 0, 0.06),
              0 24px 60px rgba(0, 0, 0, 0.12);

  /* Radii — match iOS continuous corners */
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --radius-xl: 28px;

  /* Springs / motion */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
  --duration-fast: 180ms;
  --duration-med: 320ms;
  --duration-slow: 520ms;
}

[theme='dark'] {
  --background: #05070d;
  --surface: #14161c;
  --text-color: rgba(255, 255, 255, 0.94);
  --text-secondary: rgba(255, 255, 255, 0.62);
  --text-tertiary: rgba(255, 255, 255, 0.42);

  --material-thick: rgba(28, 30, 38, 0.72);
  --material-regular: rgba(32, 34, 42, 0.55);
  --material-thin: rgba(40, 42, 50, 0.38);
  --material-ultrathin: rgba(60, 62, 70, 0.22);

  --hairline: rgba(255, 255, 255, 0.09);
  --hairline-strong: rgba(255, 255, 255, 0.16);

  --card-background: var(--material-regular);
  --card-border-color: rgba(255, 255, 255, 0.08);
  --techItem-background: rgba(255, 255, 255, 0.06);

  --theme-color: #0a84ff;
  --theme-color-soft: rgba(10, 132, 255, 0.24);

  --orb-1: #6f3bd6;
  --orb-2: #0a84ff;
  --orb-3: #0a6cff;

  --shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4),
              0 4px 12px rgba(0, 0, 0, 0.35);
  --shadow-2: 0 2px 6px rgba(0, 0, 0, 0.45),
              0 12px 32px rgba(0, 0, 0, 0.5);
  --shadow-3: 0 4px 12px rgba(0, 0, 0, 0.55),
              0 24px 60px rgba(0, 0, 0, 0.6);
}

html {
  background-color: var(--background);
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: var(--background);
  color: var(--text-color);
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display',
    'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    'Helvetica Neue', Roboto, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  font-feature-settings: 'ss01', 'ss02', 'cv11';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-optical-sizing: auto;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.app {
  opacity: 0;
}

.app.loaded {
  opacity: 1;
  transition: opacity var(--duration-med) var(--ease-out);
}

/* ---------- Ambient background: soft aurora orbs + grain ---------- */
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  opacity: 0.55;
  will-change: transform;
}

.orb-a {
  width: 46vmax;
  height: 46vmax;
  background: var(--orb-1);
  top: -12vmax;
  left: -10vmax;
  animation: orb-drift-a 34s ease-in-out infinite alternate;
}

.orb-b {
  width: 42vmax;
  height: 42vmax;
  background: var(--orb-2);
  top: 20vmax;
  right: -14vmax;
  animation: orb-drift-b 42s ease-in-out infinite alternate;
}

.orb-c {
  width: 38vmax;
  height: 38vmax;
  background: var(--orb-3);
  bottom: -18vmax;
  left: 20vmax;
  animation: orb-drift-c 38s ease-in-out infinite alternate;
  opacity: 0.4;
}

[theme='dark'] .orb {
  opacity: 0.38;
}

.grain {
  position: absolute;
  inset: -50%;
  background-image:
    radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.35;
  mix-blend-mode: overlay;
  pointer-events: none;
}

[theme='dark'] .grain {
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  opacity: 0.25;
}

@keyframes orb-drift-a {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(6vmax, 4vmax, 0) scale(1.08); }
}
@keyframes orb-drift-b {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(-6vmax, 5vmax, 0) scale(1.1); }
}
@keyframes orb-drift-c {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(4vmax, -5vmax, 0) scale(0.95); }
}

/* ---------- Route transition ---------- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

img {
  max-width: 100%;
  height: auto;
}

a {
  text-decoration: none;
  color: var(--theme-color);
}

/* ---------- Accessibility ---------- */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  .orb { animation: none !important; }
}

@media (prefers-reduced-transparency: reduce) {
  :root {
    --material-thick: #ffffff;
    --material-regular: #ffffff;
    --material-thin: #f6f7f9;
    --material-ultrathin: #f6f7f9;
    --material-blur: 0px;
  }
  [theme='dark'] {
    --material-thick: #17191f;
    --material-regular: #17191f;
    --material-thin: #1a1c22;
    --material-ultrathin: #1a1c22;
  }
  .orb { display: none; }
  .grain { display: none; }
}

@media (prefers-contrast: more) {
  :root {
    --hairline: rgba(0, 0, 0, 0.35);
    --hairline-strong: rgba(0, 0, 0, 0.55);
    --text-secondary: rgba(0, 0, 0, 0.8);
  }
  [theme='dark'] {
    --hairline: rgba(255, 255, 255, 0.35);
    --hairline-strong: rgba(255, 255, 255, 0.6);
    --text-secondary: rgba(255, 255, 255, 0.85);
  }
}
</style>
