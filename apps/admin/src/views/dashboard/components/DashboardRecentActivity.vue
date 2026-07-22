<script setup lang="ts">
import type { ActivityItem } from '../types'

defineOptions({ name: 'DashboardRecentActivity' })

defineProps<{
  items: ActivityItem[]
  loading?: boolean
}>()

const actionLabels: Record<string, string> = {
  CREATE: '新增',
  UPDATE: '更新',
  DELETE: '删除',
}

const actionColors: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
}

function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function friendlyKey(key: string): string {
  if (!key) return ''
  if (key.length > 24) return key.slice(0, 22) + '…'
  return key
}
</script>

<template>
  <div v-if="loading" class="dra-section">
    <h3 class="dra-title">最近操作</h3>
    <a-card class="dra-card">
      <a-skeleton active :paragraph="{ rows: 3 }" />
    </a-card>
  </div>

  <div v-else-if="items.length" class="dra-section">
    <h3 class="dra-title">最近操作</h3>
    <a-card class="dra-card" :body-style="{ padding: '0' }">
      <a-list :data-source="items" size="small">
        <template #renderItem="{ item }">
          <a-list-item class="dra-item">
            <a-list-item-meta>
              <template #description>
                <span class="dra-meta">
                  <a-tag :color="actionColors[item.action] || 'default'" class="dra-tag">
                    {{ actionLabels[item.action] || item.action }}
                  </a-tag>
                  <code class="dra-key">{{ friendlyKey(item.entityKey) }}</code>
                </span>
              </template>
              <template #title>
                <span class="dra-operator">{{ item.operator || 'system' }}</span>
                <span class="dra-time">{{ formatTime(item.createdAt) }}</span>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<style scoped>
.dra-section {
  padding: 1.15rem 1.25rem 1rem;
  border-radius: var(--admin-radius-lg);
  background: var(--admin-material-regular);
  backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  box-shadow: var(--admin-shadow-1);
  position: relative;
  overflow: hidden;
}

.dra-section::before {
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

[theme='dark'] .dra-section::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.18),
    transparent);
}

.dra-title {
  font-size: 0.78rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dra-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.dra-item {
  padding: 0.7rem 0 !important;
  border-bottom: 1px solid var(--admin-hairline) !important;
}

.dra-item:last-child { border-bottom: none !important; }

.dra-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.dra-tag {
  font-size: 0.72rem;
  line-height: 1.4;
  padding: 0.15em 0.65em !important;
}

.dra-key {
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.82rem;
  color: var(--admin-text-secondary);
  background: none;
  padding: 0;
  letter-spacing: -0.005em;
}

.dra-operator {
  font-weight: 600;
  font-size: 0.86rem;
  color: var(--admin-text);
  letter-spacing: -0.005em;
}

.dra-time {
  margin-left: 0.6rem;
  font-size: 0.76rem;
  color: var(--admin-text-tertiary);
  font-variant-numeric: tabular-nums;
}
</style>
