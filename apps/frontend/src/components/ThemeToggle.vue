<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const props = withDefaults(defineProps<{
  /** Position mode: 'fixed' corners or 'inline' for flow layout */
  position?: 'fixed' | 'inline'
  /** Corner when position="fixed": 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' */
  corner?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /** Offset from the edge (CSS value, e.g. '1.2rem') */
  offset?: string
}>(), {
  position: 'fixed',
  corner: 'top-right',
  offset: '1.2rem',
})

const store = useThemeStore()

function toggle() {
  store.toggleTheme()
}

// Corner → CSS inset values
const cornerStyle = computed(() => {
  const o = props.offset
  switch (props.corner) {
    case 'top-left': return { top: o, left: o }
    case 'bottom-right': return { bottom: o, right: o }
    case 'bottom-left': return { bottom: o, left: o }
    default: return { top: o, right: o }
  }
})
</script>

<template>
  <button
    class="tt-btn"
    :class="[`tt-${position}`, `tt-${corner}`]"
    :style="position === 'fixed' ? cornerStyle : undefined"
    :aria-label="store.isDark ? '切换亮色模式' : '切换暗色模式'"
    :title="store.isDark ? '切换亮色模式' : '切换暗色模式'"
    @click="toggle"
  >
    <!-- Sun icon (visible in light mode) -->
    <svg
      class="tt-icon tt-sun"
      :class="{ active: !store.isDark }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>

    <!-- Moon icon (visible in dark mode) -->
    <svg
      class="tt-icon tt-moon"
      :class="{ active: store.isDark }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>

<style scoped>
.tt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  background: var(--card-background);
  border: 3px solid var(--card-border-color);
  border-radius: 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 100;
  position: relative;
  overflow: hidden;
  color: var(--text-color);
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

/* ====== POSITION VARIANTS ====== */
.tt-fixed {
  position: fixed;
}

.tt-inline {
  position: relative;
}

/* ====== HOVER ====== */
.tt-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--theme-color);
}

.tt-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Focus ring for keyboard nav */
.tt-btn:focus-visible {
  outline: 2px solid var(--theme-color);
  outline-offset: 3px;
}

/* ====== ICONS ====== */
.tt-icon {
  position: absolute;
  width: 1.3rem;
  height: 1.3rem;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tt-sun {
  opacity: 0;
  transform: rotate(-90deg) scale(0.5);
  color: #f59e0b;
}

.tt-sun.active {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.tt-moon {
  opacity: 0;
  transform: rotate(90deg) scale(0.5);
  color: #a78bfa;
}

.tt-moon.active {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

/* Glow ring behind the active icon */
.tt-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.tt-btn:hover::after {
  opacity: 1;
  background: radial-gradient(
    circle at center,
    color-mix(in srgb, var(--theme-color) 15%, transparent) 0%,
    transparent 70%
  );
}

/* ====== RESPONSIVE ====== */
@media (max-width: 768px) {
  .tt-btn {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 12px;
  }

  .tt-icon {
    width: 1.1rem;
    height: 1.1rem;
  }
}
</style>
