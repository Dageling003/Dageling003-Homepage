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
  margin-bottom: 1.5rem;
}

.dra-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.8rem;
  color: var(--admin-text, #262626);
}

.dra-card {
  border-radius: 12px;
}

.dra-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.dra-tag {
  font-size: 0.72rem;
  line-height: 1;
}

.dra-key {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
  color: #595959;
  background: none;
  padding: 0;
}

.dra-operator {
  font-weight: 500;
  font-size: 0.85rem;
  color: var(--admin-text, #262626);
}

.dra-time {
  margin-left: 0.6rem;
  font-size: 0.78rem;
  color: #bfbfbf;
}
</style>
