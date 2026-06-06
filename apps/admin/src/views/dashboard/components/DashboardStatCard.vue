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
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  border-radius: 12px;
  background: var(--admin-bg-card, #fff);
  border: 1px solid var(--admin-border, #f0f0f0);
  transition: all 0.25s ease;
}

.dsc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.dsc-clickable {
  cursor: pointer;
}

.dsc-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: var(--dsc-bg);
  color: var(--dsc-color);
  flex-shrink: 0;
}

.dsc-icon {
  font-size: 1.3rem;
}

.dsc-body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dsc-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--admin-text, #262626);
  line-height: 1.2;
}

.dsc-label {
  font-size: 0.78rem;
  color: var(--admin-text-secondary, #8c8c8c);
}
</style>
