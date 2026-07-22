<script setup lang="ts">
import { computed } from 'vue'

export interface QuickLink {
  text: string
  url: string
  /** Background color (optional, falls back to a themed tint) */
  color?: string
  /** Emoji or short text icon shown before the label */
  icon?: string
}

const props = withDefaults(defineProps<{
  /** Array of links to display */
  links: QuickLink[]
  /** Layout mode: grid (card-like), row (horizontal buttons), list (vertical items) */
  layout?: 'grid' | 'row' | 'list'
  /** Number of columns in grid mode (3 by default) */
  columns?: number
  /** Size preset */
  size?: 'sm' | 'md' | 'lg'
  /** Show loading skeleton */
  loading?: boolean
}>(), {
  layout: 'grid',
  columns: 3,
  size: 'md',
  loading: false,
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.columns}, 1fr)`,
}))

const linkSize = computed(() => {
  switch (props.size) {
    case 'sm': return { padding: '0.4rem 0.85rem', fontSize: '0.82rem', gap: '0.35rem' }
    case 'lg': return { padding: '0.7rem 1.25rem', fontSize: '0.98rem', gap: '0.55rem' }
    default:   return { padding: '0.55rem 1rem',    fontSize: '0.9rem',  gap: '0.4rem'  }
  }
})

// Generate a deterministic soft hue from text if no color is provided
function getFallbackColor(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 72%, 56%)`
}
</script>

<template>
  <!-- ====== LOADING STATE ====== -->
  <div
    v-if="loading"
    class="ql-wrap"
    :class="[`ql-${layout}`, `ql-size-${size}`]"
    :style="layout === 'grid' ? gridStyle : undefined"
  >
    <div
      v-for="n in Math.min(links.length || 6, 6)"
      :key="n"
      class="ql-skeleton"
    >
      <span class="ql-skel-icon" />
      <span class="ql-skel-text" />
    </div>
  </div>

  <!-- ====== EMPTY STATE ====== -->
  <div
    v-else-if="!links.length"
    class="ql-empty"
  >
    <span class="ql-empty-icon">🔗</span>
    <span class="ql-empty-text">暂无快捷链接</span>
    <span class="ql-empty-hint">请在后台管理中添加</span>
  </div>

  <!-- ====== LINKS ====== -->
  <div
    v-else
    class="ql-wrap"
    :class="[`ql-${layout}`, `ql-size-${size}`]"
    :style="layout === 'grid' ? gridStyle : undefined"
  >
    <a
      v-for="(link, i) in links"
      :key="i"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="ql-link"
      :class="{ 'ql-has-icon': !!link.icon }"
      :style="{
        '--link-color': link.color || getFallbackColor(link.text),
        ...(layout === 'row' || layout === 'list' ? linkSize : {}),
      }"
    >
      <!-- Icon dot -->
      <span v-if="link.icon" class="ql-icon">{{ link.icon }}</span>
      <span v-else class="ql-dot" aria-hidden="true" />
      <!-- Label -->
      <span class="ql-label">{{ link.text }}</span>
      <!-- Arrow indicator -->
      <span class="ql-arrow" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </span>
    </a>
  </div>
</template>

<style scoped>
/* ============================================================
   QuickLinks — Apple-style glass pills with hairline border and
   a soft tinted accent (color used as an accent, not a fill).
   ============================================================ */

.ql-wrap {
  display: flex;
  gap: 0.55rem;
}

.ql-grid {
  display: grid;
  gap: 0.6rem;
}

.ql-row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.ql-list {
  flex-direction: column;
}

/* ---------- Link itself ---------- */
.ql-link {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  text-decoration: none;
  color: var(--text-color);
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  background: var(--material-thin);
  backdrop-filter: blur(20px) saturate(var(--material-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--material-saturation));
  border: 1px solid var(--hairline);
  border-radius: 999px; /* Apple-style capsule */
  padding: 0.55rem 1rem;
  transition:
    transform var(--duration-med) var(--ease-spring),
    box-shadow var(--duration-med) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
  box-shadow: var(--shadow-1);
}

/* Override any global `a::before` */
.ql-link::before { display: none !important; }

/* Bright top edge */
.ql-link::after {
  content: '';
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent);
  pointer-events: none;
}

[theme='dark'] .ql-link::after {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.18),
    transparent);
}

@media (hover: hover) {
  .ql-link:hover {
    transform: translate3d(0, -2px, 0);
    box-shadow: var(--shadow-2);
    color: var(--text-color);
    background: var(--material-thick);
    border-color: color-mix(in srgb, var(--link-color) 45%, var(--hairline));
  }
}

.ql-link:active {
  transform: translate3d(0, 0, 0) scale(0.97);
  transition-duration: 120ms;
  box-shadow: var(--shadow-1);
}

.ql-link:focus-visible {
  outline: 2px solid var(--link-color);
  outline-offset: 3px;
}

/* ---------- Icon / label / arrow ---------- */
.ql-icon {
  font-size: 1.05em;
  flex-shrink: 0;
  line-height: 1;
}

.ql-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--link-color);
  flex-shrink: 0;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--link-color) 22%, transparent);
}

.ql-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ql-arrow {
  color: var(--text-tertiary);
  display: inline-flex;
  align-items: center;
  transition:
    transform var(--duration-med) var(--ease-spring),
    color var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.ql-link:hover .ql-arrow {
  transform: translateX(3px);
  color: var(--link-color);
}

/* ---------- Grid mode ---------- */
.ql-grid .ql-link {
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
}

/* ---------- Size variants ---------- */
.ql-size-sm .ql-link {
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  gap: 0.35rem;
}
.ql-size-lg .ql-link {
  padding: 0.7rem 1.25rem;
  font-size: 0.98rem;
  gap: 0.55rem;
}

.ql-grid.ql-size-sm .ql-link { padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); }
.ql-grid.ql-size-lg .ql-link { padding: 0.85rem 1.1rem; border-radius: var(--radius-md); }

/* ---------- Skeleton ---------- */
.ql-skeleton {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.9rem;
  background: var(--material-thin);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  animation: ql-pulse 1.6s ease-in-out infinite;
}

.ql-skel-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--hairline-strong);
  flex-shrink: 0;
}

.ql-skel-text {
  flex: 1;
  height: 0.7em;
  border-radius: 4px;
  background: var(--hairline-strong);
}

@keyframes ql-pulse {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

/* ---------- Empty ---------- */
.ql-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 1.5rem 1rem;
  background: var(--material-thin);
  border: 1px dashed var(--hairline-strong);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-align: center;
}

.ql-empty-icon {
  font-size: 1.8rem;
  margin-bottom: 0.25rem;
  opacity: 0.7;
}

.ql-empty-text {
  font-size: 0.95rem;
  font-weight: 500;
}

.ql-empty-hint {
  font-size: 0.8rem;
  color: var(--text-tertiary);
}
</style>
