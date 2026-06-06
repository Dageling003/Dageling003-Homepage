<script setup lang="ts">
import { computed } from 'vue'

export interface QuickLink {
  text: string
  url: string
  /** Background color (optional, falls back to theme color) */
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
    case 'sm': return { padding: '0.4rem 0.8rem', fontSize: '0.82rem', gap: '0.3rem' }
    case 'lg': return { padding: '0.8rem 1.4rem', fontSize: '1.1rem', gap: '0.6rem' }
    default: return { padding: '0.55rem 1rem', fontSize: '0.93rem', gap: '0.4rem' }
  }
})

// Generate a deterministic pastel color from text if no color is provided
function getFallbackColor(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 65%, 55%)`
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
      <!-- Icon -->
      <span v-if="link.icon" class="ql-icon">{{ link.icon }}</span>
      <!-- Label -->
      <span class="ql-label">{{ link.text }}</span>
      <!-- Arrow indicator -->
      <span class="ql-arrow">→</span>
    </a>
  </div>
</template>

<style scoped>
/* ========== WRAPPER ========== */
.ql-wrap {
  display: flex;
  gap: 0.6rem;
}

/* -------- Grid layout -------- */
.ql-grid {
  display: grid;
  gap: 0.6rem;
}

.ql-grid .ql-link {
  padding: 0.7rem 0.9rem;
}

/* -------- Row layout (horizontal) -------- */
.ql-row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.ql-row .ql-link {
  display: inline-flex;
  align-items: center;
  border-radius: 14px;
  text-decoration: none;
  color: #fff;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: pointer;
}

/* -------- List layout (vertical) -------- */
.ql-list {
  flex-direction: column;
}

.ql-list .ql-link {
  display: flex;
  align-items: center;
  border-radius: 12px;
  text-decoration: none;
  color: #fff;
  font-weight: 500;
  transition: all 0.25s ease;
  cursor: pointer;
}

/* ========== LINK STYLES ========== */
.ql-link {
  position: relative;
  overflow: hidden;
  background: var(--link-color);
  border: 2px solid transparent;
  padding: 0;  /* overridden by layout-specific or size-specific styles above */
}

/* Override the global `a::before` so it doesn't interfere */
.ql-link::before {
  display: none !important;
}

.ql-link:hover {
  transform: translateY(-3px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.15),
    0 0 0 2px var(--link-color),
    0 0 0 4px rgba(255, 255, 255, 0.3);
  text-decoration: none;
  color: #fff;
  opacity: 0.92;
}

.ql-link:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* Shine effect on hover */
.ql-link::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.ql-link:hover::after {
  opacity: 1;
}

/* ========== INNER ELEMENTS ========== */
.ql-icon {
  font-size: 1.1em;
  flex-shrink: 0;
  line-height: 1;
}

.ql-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ql-arrow {
  font-size: 0.8em;
  opacity: 0.7;
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.ql-link:hover .ql-arrow {
  transform: translateX(3px);
}

/* ========== SIZE VARIANTS ========== */
/* sm */
.ql-size-sm .ql-link {
  padding: 0.4rem 0.8rem;
  font-size: 0.82rem;
  border-radius: 10px;
  gap: 0.3rem;
}

/* md (default) */
.ql-size-md .ql-link {
  padding: 0.55rem 1rem;
  font-size: 0.93rem;
  border-radius: 14px;
  gap: 0.4rem;
}

/* lg */
.ql-size-lg .ql-link {
  padding: 0.8rem 1.4rem;
  font-size: 1.1rem;
  border-radius: 18px;
  gap: 0.6rem;
}

/* Grid-mode specific overrides for size */
.ql-grid.ql-size-sm .ql-link { padding: 0.5rem 0.7rem; }
.ql-grid.ql-size-lg .ql-link { padding: 1rem 1.2rem; }

/* ========== SKELETON LOADING ========== */
.ql-skeleton {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 0.9rem;
  background: var(--card-background);
  border: 2px solid var(--card-border-color);
  border-radius: 14px;
  animation: ql-pulse 1.5s ease-in-out infinite;
}

.ql-skel-icon {
  width: 1.2em;
  height: 1.2em;
  border-radius: 50%;
  background: var(--card-border-color);
  flex-shrink: 0;
}

.ql-skel-text {
  flex: 1;
  height: 0.8em;
  border-radius: 4px;
  background: var(--card-border-color);
}

.ql-grid .ql-skeleton {
  padding: 0.7rem 0.9rem;
}

.ql-row .ql-skeleton {
  padding: 0.55rem 1rem;
}

.ql-list .ql-skeleton {
  padding: 0.55rem 1rem;
}

@keyframes ql-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ========== EMPTY STATE ========== */
.ql-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 1.5rem 1rem;
  background: var(--card-background);
  border: 2px dashed var(--card-border-color);
  border-radius: 16px;
  color: var(--text-color);
  opacity: 0.6;
  text-align: center;
}

.ql-empty-icon {
  font-size: 2rem;
  margin-bottom: 0.3rem;
}

.ql-empty-text {
  font-size: 0.95rem;
  font-weight: 500;
}

.ql-empty-hint {
  font-size: 0.8rem;
  opacity: 0.6;
}
</style>
