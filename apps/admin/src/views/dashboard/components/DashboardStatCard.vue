<script setup lang="ts">
import type { Component } from 'vue'

defineOptions({ name: 'DashboardStatCard' })

const props = defineProps<{
  label: string
  value: string | number
  icon: Component
  color: string
  bg: string
  to?: string
}>()

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  if (props.to) emit('click')
}
</script>

<template>
  <div
    class="dsc-card"
    :class="{ 'dsc-clickable': !!to }"
    :style="{ '--dsc-color': color, '--dsc-bg': bg }"
    @click="handleClick"
  >
    <div class="dsc-icon-wrap">
      <component :is="icon" class="dsc-icon" />
    </div>
    <div class="dsc-body">
      <span class="dsc-value">{{ value }}</span>
      <span class="dsc-label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped>
.dsc-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.15rem 1.25rem;
  border-radius: var(--admin-radius-lg);
  background: var(--admin-material-regular);
  backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  box-shadow: var(--admin-shadow-1);
  transition:
    transform var(--admin-duration-medium) var(--admin-ease-spring),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
  overflow: hidden;
  isolation: isolate;
}

/* Bright top edge — glass catching light */
.dsc-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.65),
    transparent);
  pointer-events: none;
}

[theme='dark'] .dsc-card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.18),
    transparent);
}

.dsc-card:hover {
  transform: translate3d(0, -3px, 0);
  box-shadow: var(--admin-shadow-2);
  background: var(--admin-material-thick);
}

.dsc-clickable { cursor: pointer; }

.dsc-icon-wrap {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--admin-radius-md);
  background: var(--dsc-bg);
  color: var(--dsc-color);
  flex-shrink: 0;
  box-shadow:
    0 4px 12px color-mix(in srgb, var(--dsc-color) 25%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

.dsc-icon {
  font-size: 1.35rem;
}

.dsc-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.dsc-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--admin-text);
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsc-label {
  font-size: 0.78rem;
  color: var(--admin-text-secondary);
  letter-spacing: -0.005em;
}
</style>
