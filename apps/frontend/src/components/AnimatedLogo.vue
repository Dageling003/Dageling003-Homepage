<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  /** Whether the loading state is active */
  loading?: boolean
  /** Size: 'sm' | 'md' | 'lg' | 'fullscreen' */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen'
  /** Accent color override (defaults to var(--theme-color)) */
  accent?: string
  /** Text shown below the animation */
  text?: string
  /** Minimum display time (ms) to avoid flash */
  minDisplay?: number
  /** Emoji/icon in the center */
  icon?: string
}>(), {
  loading: true,
  size: 'fullscreen',
  accent: '',
  text: '加载中',
  minDisplay: 600,
  icon: '🐱',
})

const emit = defineEmits<{
  done: []
}>()

const visible = ref(true)
const exiting = ref(false)
let exitTimer: ReturnType<typeof setTimeout> | null = null
let minTimer: ReturnType<typeof setTimeout> | null = null
let minDone = false

// ==================== Lifecycle ====================
onMounted(() => {
  // Enforce minimum display time
  minTimer = setTimeout(() => {
    minDone = true
  }, props.minDisplay)
})

onUnmounted(() => {
  if (exitTimer) clearTimeout(exitTimer)
  if (minTimer) clearTimeout(minTimer)
})

// ==================== Watch loading ====================
// We use a watcher-like pattern via exposed method
function finish() {
  if (!minDone) {
    // Wait for minimum time first, then finish
    const check = setInterval(() => {
      if (minDone) {
        clearInterval(check)
        startExit()
      }
    }, 50)
    return
  }
  startExit()
}

function startExit() {
  exiting.value = true
  exitTimer = setTimeout(() => {
    visible.value = false
    emit('done')
  }, 500)
}

defineExpose({ finish })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="al-wrap"
      :class="[`al-${size}`, { exiting }]"
      :style="accent ? { '--al-accent': accent } : undefined"
    >
      <!-- Center content -->
      <div class="al-inner">
        <!-- Icon with pulse rings -->
        <div class="al-icon-wrap">
          <span class="al-icon">{{ icon }}</span>
          <div class="al-ring al-ring-1" />
          <div class="al-ring al-ring-2" />
          <div class="al-ring al-ring-3" />
        </div>

        <!-- Loading dots -->
        <div class="al-dots">
          <span class="al-dot" />
          <span class="al-dot" />
          <span class="al-dot" />
        </div>

        <!-- Text -->
        <p v-if="text" class="al-text">{{ text }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ============================================================
   AnimatedLogo — soft aurora blooms + iOS-style progress dots.
   ============================================================ */
.al-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition:
    opacity var(--duration-slow, 520ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1)),
    transform var(--duration-slow, 520ms) var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}

.exiting {
  opacity: 0;
  transform: scale(1.02);
}

/* -------- Size: fullscreen -------- */
.al-fullscreen {
  position: fixed;
  inset: 0;
  background: var(--background);
  --al-accent: var(--theme-color, #0a84ff);
  isolation: isolate;
}

/* Soft ambient tint under the loader */
.al-fullscreen::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60vmax 40vmax at 30% 30%,
      color-mix(in srgb, var(--al-accent) 22%, transparent), transparent 65%),
    radial-gradient(50vmax 40vmax at 70% 70%,
      color-mix(in srgb, var(--al-accent) 14%, transparent), transparent 60%);
  filter: blur(30px);
  z-index: -1;
  opacity: 0.9;
}

/* -------- Size: lg / md / sm (inline) -------- */
.al-lg { padding: 3rem; min-height: 200px; }
.al-md { padding: 2rem; min-height: 150px; }
.al-sm { padding: 1rem; min-height: 80px;  }

/* ====== INNER ====== */
.al-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
}

/* ====== ICON ====== */
.al-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4.5rem;
  height: 4.5rem;
}

.al-lg .al-icon-wrap { width: 5.4rem; height: 5.4rem; }
.al-md .al-icon-wrap { width: 3.8rem; height: 3.8rem; }
.al-sm .al-icon-wrap { width: 2.6rem; height: 2.6rem; }

.al-icon {
  font-size: 2.3rem;
  line-height: 1;
  z-index: 1;
  animation: al-bounce 1.8s var(--ease-spring, cubic-bezier(0.34, 1.4, 0.64, 1)) infinite;
  filter: drop-shadow(0 4px 12px color-mix(in srgb, var(--al-accent) 40%, transparent));
}

.al-lg .al-icon { font-size: 2.8rem; }
.al-md .al-icon { font-size: 1.9rem; }
.al-sm .al-icon { font-size: 1.3rem; }

/* ====== RINGS — softer, thinner, tinted ====== */
.al-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid color-mix(in srgb, var(--al-accent) 55%, transparent);
  animation: al-ring-pulse 2.4s ease-out infinite;
  pointer-events: none;
}

.al-ring-1 { width: 100%; height: 100%; animation-delay: 0s;   }
.al-ring-2 { width: 140%; height: 140%; animation-delay: 0.5s; }
.al-ring-3 { width: 180%; height: 180%; animation-delay: 1s;   }

@keyframes al-ring-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* ====== BOUNCE ====== */
@keyframes al-bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-5px) scale(1.04); }
}

/* ====== DOTS ====== */
.al-dots {
  display: flex;
  gap: 0.4rem;
}

.al-dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--al-accent);
  animation: al-dot-pulse 1.3s ease-in-out infinite;
  opacity: 0.4;
}

.al-dot:nth-child(2) { animation-delay: 0.15s; }
.al-dot:nth-child(3) { animation-delay: 0.3s;  }

@keyframes al-dot-pulse {
  0%, 100% {
    transform: scale(0.7);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}

/* ====== TEXT ====== */
.al-text {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary, rgba(0, 0, 0, 0.56));
  letter-spacing: 0.02em;
  font-weight: 500;
}

.al-lg .al-text { font-size: 0.98rem; }
.al-sm .al-text { font-size: 0.78rem; }

/* Reduced motion — collapse to a static tint + fade */
@media (prefers-reduced-motion: reduce) {
  .al-icon, .al-ring, .al-dot {
    animation: none !important;
  }
  .al-ring { opacity: 0.35; }
  .al-dot  { opacity: 0.7; }
}
</style>
