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
  offset: '1.25rem',
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
    :aria-pressed="store.isDark"
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
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
    </svg>

    <!-- Moon icon (visible in dark mode) -->
    <svg
      class="tt-icon tt-moon"
      :class="{ active: store.isDark }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a6.6 6.6 0 0 0 9.9 9.9z" />
    </svg>
  </button>
</template>

<style scoped>
/* ============================================================
   ThemeToggle — floating glass capsule button
   ============================================================ */
.tt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.6rem;
  height: 2.6rem;
  padding: 0;
  background: var(--material-thick);
  backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturation));
  -webkit-backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturation));
  border: 1px solid var(--hairline);
  border-radius: 999px; /* pill / capsule */
  cursor: pointer;
  user-select: none;
  transition:
    transform var(--duration-med) var(--ease-spring),
    box-shadow var(--duration-med) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
  z-index: 100;
  position: relative;
  overflow: hidden;
  color: var(--text-color);
  outline: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--shadow-1);
}

/* Bright top edge — light catching the material */
.tt-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.65),
    transparent);
  pointer-events: none;
}

[theme='dark'] .tt-btn::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
}

/* ====== POSITION VARIANTS ====== */
.tt-fixed  { position: fixed; }
.tt-inline { position: relative; }

/* ====== INTERACTION ====== */
@media (hover: hover) {
  .tt-btn:hover {
    transform: translate3d(0, -2px, 0);
    box-shadow: var(--shadow-2);
    background: var(--material-thick);
  }
}

.tt-btn:active {
  transform: translate3d(0, 0, 0) scale(0.94);
  transition-duration: 120ms;
  box-shadow: var(--shadow-1);
}

.tt-btn:focus-visible {
  outline: 2px solid var(--theme-color);
  outline-offset: 3px;
}

/* ====== ICONS — cross-fade / spring rotation ====== */
.tt-icon {
  position: absolute;
  width: 1.15rem;
  height: 1.15rem;
  transition:
    opacity var(--duration-med) var(--ease-out),
    transform var(--duration-med) var(--ease-spring);
}

.tt-sun {
  opacity: 0;
  transform: rotate(-70deg) scale(0.6);
  color: #ff9500; /* iOS system orange */
}

.tt-sun.active {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

.tt-moon {
  opacity: 0;
  transform: rotate(70deg) scale(0.6);
  color: #bf8cff;
}

.tt-moon.active {
  opacity: 1;
  transform: rotate(0deg) scale(1);
}

/* ====== RESPONSIVE ====== */
@media (max-width: 768px) {
  .tt-btn {
    width: 2.3rem;
    height: 2.3rem;
  }
  .tt-icon {
    width: 1rem;
    height: 1rem;
  }
}
</style>
