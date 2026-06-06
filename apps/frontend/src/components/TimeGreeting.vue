<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  /** Show greeting header with current time */
  showGreeting?: boolean
  /** Show the four progress bars (day/week/month/year) */
  showProgress?: boolean
  /** Compact mode: smaller padding and text */
  compact?: boolean
  /** Custom greeting for morning  (05:00–11:59) */
  greetingMorning?: string
  /** Custom greeting for noon    (12:00–13:59) */
  greetingNoon?: string
  /** Custom greeting for afternoon (14:00–17:59) */
  greetingAfternoon?: string
  /** Custom greeting for evening (18:00–20:59) */
  greetingEvening?: string
  /** Custom greeting for night  (21:00–04:59) */
  greetingNight?: string
}>(), {
  showGreeting: true,
  showProgress: true,
  compact: false,
  greetingMorning: '早上好',
  greetingNoon: '中午好',
  greetingAfternoon: '下午好',
  greetingEvening: '傍晚好',
  greetingNight: '夜深了',
})

// ==================== Time State ====================
const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

// ==================== Computed ====================
const hour = computed(() => now.value.getHours())
const minute = computed(() => now.value.getMinutes())
const second = computed(() => now.value.getSeconds())

const timeString = computed(() => {
  const h = hour.value.toString().padStart(2, '0')
  const m = minute.value.toString().padStart(2, '0')
  const s = second.value.toString().padStart(2, '0')
  return `${h}:${m}:${s}`
})

const period = computed(() => {
  const h = hour.value
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 14) return 'noon'
  if (h >= 14 && h < 18) return 'afternoon'
  if (h >= 18 && h < 21) return 'evening'
  return 'night'
})

const greeting = computed(() => {
  const map: Record<string, string> = {
    morning: props.greetingMorning,
    noon: props.greetingNoon,
    afternoon: props.greetingAfternoon,
    evening: props.greetingEvening,
    night: props.greetingNight,
  }
  return map[period.value] || '你好'
})

const greetingEmoji = computed(() => {
  const map: Record<string, string> = {
    morning: '🌤️',
    noon: '☀️',
    afternoon: '⛅',
    evening: '🌆',
    night: '🌙',
  }
  return map[period.value] || '👋'
})

// ==================== Progress Data ====================
interface ProgressItem {
  emoji: string
  label: string
  current: number
  total: number
  pct: string
}

const dayProgress = computed<ProgressItem>(() => {
  const h = hour.value
  return {
    emoji: '☀️',
    label: '今天',
    current: h,
    total: 24,
    pct: ((h / 24) * 100).toFixed(1),
  }
})

const weekProgress = computed<ProgressItem>(() => {
  const wd = now.value.getDay() || 7
  return {
    emoji: '📆',
    label: '本周',
    current: wd,
    total: 7,
    pct: ((wd / 7) * 100).toFixed(1),
  }
})

const monthProgress = computed<ProgressItem>(() => {
  const d = now.value
  const md = d.getDate()
  const mdMax = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return {
    emoji: '🌙',
    label: '本月',
    current: md,
    total: mdMax,
    pct: ((md / mdMax) * 100).toFixed(1),
  }
})

const yearProgress = computed<ProgressItem>(() => {
  const d = now.value
  const start = new Date(d.getFullYear(), 0, 1).getTime()
  const diff = d.getTime() - start
  const yd = Math.ceil(diff / 86400000)
  const ydMax =
    (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || d.getFullYear() % 400 === 0 ? 366 : 365
  return {
    emoji: '⭐',
    label: '今年',
    current: yd,
    total: ydMax,
    pct: ((yd / ydMax) * 100).toFixed(1),
  }
})

const progressList = computed<ProgressItem[]>(() => [
  dayProgress.value,
  weekProgress.value,
  monthProgress.value,
  yearProgress.value,
])

// ==================== Period-based accent color ====================
const accentColor = computed(() => {
  const colors: Record<string, string> = {
    morning: 'var(--greeting-morning, #f59e0b)',
    noon: 'var(--greeting-noon, #ef4444)',
    afternoon: 'var(--greeting-afternoon, #f97316)',
    evening: 'var(--greeting-evening, #8b5cf6)',
    night: 'var(--greeting-night, #6366f1)',
  }
  return colors[period.value] || 'var(--theme-color)'
})

// ==================== Lifecycle ====================
onMounted(() => {
  // Align to the next second boundary for smooth updates
  const msToNextSec = 1000 - (Date.now() % 1000)
  setTimeout(() => {
    now.value = new Date()
    timer = setInterval(() => {
      now.value = new Date()
    }, 1000)
  }, msToNextSec)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div
    class="tg-wrap"
    :class="{ compact }"
    :style="{ '--accent': accentColor }"
  >
    <!-- ====== GREETING ====== -->
    <div v-if="showGreeting" class="tg-greeting">
      <span class="tg-emoji">{{ greetingEmoji }}</span>
      <div class="tg-greeting-text">
        <span class="tg-hello">{{ greeting }}</span>
        <span class="tg-time">{{ timeString }}</span>
      </div>
    </div>

    <!-- ====== PROGRESS ====== -->
    <div v-if="showProgress" class="tg-progress">
      <div
        v-for="(item, i) in progressList"
        :key="i"
        class="tg-prog-item"
      >
        <div class="tg-prog-header">
          <span class="tg-prog-emoji">{{ item.emoji }}</span>
          <span class="tg-prog-label">{{ item.label }}</span>
          <span class="tg-prog-nums">{{ item.current }} / {{ item.total }}</span>
          <span class="tg-prog-pct">{{ item.pct }}%</span>
        </div>
        <div class="tg-prog-bar">
          <div
            class="tg-prog-fill"
            :style="{ width: item.pct + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tg-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

/* ====== GREETING ====== */
.tg-greeting {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 2px solid var(--card-border-color);
}

.tg-emoji {
  font-size: 1.8rem;
  line-height: 1;
  flex-shrink: 0;
}

.tg-greeting-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.tg-hello {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
}

.tg-time {
  font-size: 0.85rem;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  opacity: 0.7;
  letter-spacing: 0.05em;
}

/* ====== PROGRESS ====== */
.tg-progress {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.tg-prog-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tg-prog-header {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
}

.tg-prog-emoji {
  font-size: 0.9rem;
  flex-shrink: 0;
}

.tg-prog-label {
  font-weight: 600;
  flex-shrink: 0;
  color: var(--text-color);
}

.tg-prog-nums {
  opacity: 0.6;
  flex: 1;
}

.tg-prog-pct {
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  opacity: 0.85;
}

/* ====== PROGRESS BAR ====== */
.tg-prog-bar {
  height: 6px;
  background: color-mix(in srgb, var(--accent) 15%, var(--card-border-color));
  border-radius: 6px;
  overflow: hidden;
}

.tg-prog-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #fff));
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

/* Glossy shimmer on the fill bar */
.tg-prog-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: tg-shimmer 3s ease-in-out infinite;
}

@keyframes tg-shimmer {
  0%   { left: -100%; }
  100% { left: 200%; }
}

/* ====== COMPACT ====== */
.compact .tg-greeting {
  padding-bottom: 0.4rem;
  gap: 0.4rem;
}

.compact .tg-emoji {
  font-size: 1.4rem;
}

.compact .tg-hello {
  font-size: 0.95rem;
}

.compact .tg-time {
  font-size: 0.78rem;
}

.compact .tg-progress {
  gap: 0.45rem;
}

.compact .tg-prog-header {
  font-size: 0.76rem;
}

.compact .tg-prog-bar {
  height: 4px;
}

.compact .tg-prog-pct {
  font-size: 0.72rem;
}
</style>
