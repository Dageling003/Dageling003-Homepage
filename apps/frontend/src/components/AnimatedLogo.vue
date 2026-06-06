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
/* ====== WRAPPER ====== */
.al-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.al-exiting {
  opacity: 0;
  transform: scale(0.95);
}

/* -------- Size: fullscreen -------- */
.al-fullscreen {
  position: fixed;
  inset: 0;
  background: var(--background);
  --al-accent: var(--theme-color, #ffb3b3);
}

/* -------- Size: lg / md / sm (inline) -------- */
.al-lg {
  padding: 3rem;
  min-height: 200px;
}

.al-md {
  padding: 2rem;
  min-height: 150px;
}

.al-sm {
  padding: 1rem;
  min-height: 80px;
}

/* ====== INNER ====== */
.al-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* ====== ICON ====== */
.al-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
}

.al-lg .al-icon-wrap { width: 5rem; height: 5rem; }
.al-md .al-icon-wrap { width: 3.5rem; height: 3.5rem; }
.al-sm .al-icon-wrap { width: 2.5rem; height: 2.5rem; }

.al-icon {
  font-size: 2rem;
  line-height: 1;
  z-index: 1;
  animation: al-bounce 1.2s ease-in-out infinite;
}

.al-lg .al-icon { font-size: 2.5rem; }
.al-md .al-icon { font-size: 1.8rem; }
.al-sm .al-icon { font-size: 1.3rem; }

/* ====== RINGS ====== */
.al-ring {
  position: absolute;
  border-radius: 50%;
  border: 2.5px solid var(--al-accent);
  animation: al-ring-pulse 2s ease-out infinite;
  pointer-events: none;
}

.al-ring-1 {
  width: 100%;
  height: 100%;
  animation-delay: 0s;
}

.al-ring-2 {
  width: 140%;
  height: 140%;
  animation-delay: 0.4s;
  opacity: 0.5;
}

.al-ring-3 {
  width: 180%;
  height: 180%;
  animation-delay: 0.8s;
  opacity: 0.25;
}

@keyframes al-ring-pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* ====== BOUNCE ====== */
@keyframes al-bounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-6px) scale(1.05);
  }
}

/* ====== DOTS ====== */
.al-dots {
  display: flex;
  gap: 0.4rem;
}

.al-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--al-accent);
  animation: al-dot-pulse 1.2s ease-in-out infinite;
}

.al-dot:nth-child(2) { animation-delay: 0.2s; }
.al-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes al-dot-pulse {
  0%, 100% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* ====== TEXT ====== */
.al-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-color);
  opacity: 0.6;
  letter-spacing: 0.05em;
}

.al-lg .al-text { font-size: 1rem; }
.al-sm .al-text { font-size: 0.8rem; }
</style>
