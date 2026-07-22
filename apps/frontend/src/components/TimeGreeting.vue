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

// ==================== Period-based accent color (Apple system-inspired) ====================
const accentColor = computed(() => {
  const colors: Record<string, string> = {
    morning:   'var(--greeting-morning, #ff9500)',   // system orange
    noon:      'var(--greeting-noon, #ff3b30)',      // system red
    afternoon: 'var(--greeting-afternoon, #ff9f0a)', // system amber
    evening:   'var(--greeting-evening, #bf5af2)',   // system purple
    night:     'var(--greeting-night, #64d2ff)',     // system light-blue
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
/* ============================================================
   TimeGreeting — Apple-style: hairline separators, tabular time,
   thin progress rails, subtle accent, no shimmer overload.
   ============================================================ */
.tg-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  color: var(--text-color);
}

/* ---------- Greeting ---------- */
.tg-greeting {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--hairline);
}

.tg-emoji {
  font-size: 1.7rem;
  line-height: 1;
  flex-shrink: 0;
}

.tg-greeting-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.tg-hello {
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: -0.005em;
  line-height: 1.15;
}

.tg-time {
  font-size: 0.8rem;
  font-family:
    ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code',
    'Cascadia Code', 'Menlo', Consolas, monospace;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

/* ---------- Progress list ---------- */
.tg-progress {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tg-prog-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.tg-prog-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  line-height: 1.25;
}

.tg-prog-emoji {
  font-size: 0.88rem;
  flex-shrink: 0;
  line-height: 1;
}

.tg-prog-label {
  font-weight: 600;
  flex-shrink: 0;
  color: var(--text-color);
  letter-spacing: -0.005em;
}

.tg-prog-nums {
  color: var(--text-tertiary);
  flex: 1;
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
}

.tg-prog-pct {
  font-family:
    ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code',
    'Cascadia Code', 'Menlo', Consolas, monospace;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
}

/* ---------- Progress rail ---------- */
.tg-prog-bar {
  height: 4px;
  background: color-mix(in srgb, var(--accent) 12%, var(--hairline));
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}

.tg-prog-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg,
    color-mix(in srgb, var(--accent) 90%, #fff 5%),
    var(--accent));
  transition: width var(--duration-slow) var(--ease-out);
  position: relative;
  box-shadow: 0 0 8px color-mix(in srgb, var(--accent) 35%, transparent);
}

/* ---------- Compact ---------- */
.compact .tg-greeting {
  padding-bottom: 0.5rem;
  gap: 0.5rem;
}

.compact .tg-emoji { font-size: 1.35rem; }
.compact .tg-hello { font-size: 0.9rem; }
.compact .tg-time  { font-size: 0.74rem; }
.compact .tg-progress { gap: 0.55rem; }
.compact .tg-prog-header { font-size: 0.74rem; }
.compact .tg-prog-bar { height: 3px; }
.compact .tg-prog-pct { font-size: 0.68rem; }
</style>
