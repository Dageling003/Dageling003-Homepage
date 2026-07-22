<script setup lang="ts">
import { computed } from 'vue'
import type { ConfigItem } from '../types'

const props = defineProps<{
  data: ConfigItem[]
  loading: boolean
  filterCategory: string
}>()

const emit = defineEmits<{
  'update:filterCategory': [value: string]
  edit: [row: ConfigItem]
  delete: [key: string]
}>()

const categories = computed(() => {
  const cats = new Set(props.data.map((d) => d.category || 'general'))
  return [...cats].sort()
})

const filteredData = computed(() => {
  if (!props.filterCategory) return props.data
  return props.data.filter((d) => (d.category || 'general') === props.filterCategory)
})

function humanRead(raw: string): string {
  if (!raw) return '（空）'
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((i) => typeof i === 'string')) {
      return parsed.join('、')
    }
    if (Array.isArray(parsed) && parsed.every((i) => typeof i === 'object' && i !== null)) {
      const keys = Object.keys(parsed[0])
      if (keys.includes('text') && keys.includes('done')) {
        const done = parsed.filter((t: any) => t.done).length
        return `${parsed.length} 项待办，${done} 项已完成`
      }
      if (keys.includes('text')) return parsed.map((t: any) => t.text).join('、')
      if (keys.includes('name')) return parsed.map((t: any) => t.name).join('、')
      return `${parsed.length} 项`
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.values(parsed).join(' / ')
    }
  } catch { /* not JSON — treat as plain text */ }
  return raw
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <div>
    <!-- ====== Toolbar ====== -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-xl font-semibold">配置管理</h2>
        <a-select
          :value="filterCategory"
          placeholder="全部分类"
          allow-clear
          size="small"
          style="width: 120px"
          @change="(v: string) => emit('update:filterCategory', v || '')"
        >
          <a-select-option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</a-select-option>
        </a-select>
      </div>
      <slot name="actions" />
    </div>

    <!-- ====== Loading ====== -->
    <a-spin :spinning="loading">
      <!-- ====== Empty ====== -->
      <a-empty
        v-if="!loading && !filteredData.length"
        description="暂无配置，点击右上角新增"
      />

      <!-- ====== Card Grid ====== -->
      <div v-else class="card-grid">
        <div
          v-for="item in filteredData"
          :key="item.id"
          class="config-card"
        >
          <!-- Top row: key + category -->
          <div class="card-top">
            <span class="card-key">{{ item.configKey }}</span>
            <a-tag color="blue" class="card-tag">{{ item.category || 'general' }}</a-tag>
          </div>

          <!-- Value -->
          <div class="card-value" :title="item.configValue">
            {{ humanRead(item.configValue) }}
          </div>

          <!-- Bottom row: time + actions -->
          <div class="card-bottom">
            <span class="card-time">{{ formatDate(item.updatedAt) }}</span>
            <span class="card-actions">
              <a-button size="small" type="link" @click="emit('edit', item)">编辑</a-button>
              <a-popconfirm
                title="确定删除？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="emit('delete', item.configKey)"
              >
                <a-button size="small" type="link" danger>删除</a-button>
              </a-popconfirm>
            </span>
          </div>
        </div>
      </div>
    </a-spin>
  </div>
</template>

<style scoped>
/* ====== Grid ====== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

/* ====== Card — glass with hairline ====== */
.config-card {
  position: relative;
  background: var(--admin-material-regular);
  backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-md);
  padding: 14px 16px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition:
    transform var(--admin-duration-medium) var(--admin-ease-spring),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out),
    border-color var(--admin-duration-fast) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
  overflow: hidden;
  isolation: isolate;
}

.config-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent);
  pointer-events: none;
}

[theme='dark'] .config-card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.16),
    transparent);
}

.config-card:hover {
  transform: translate3d(0, -2px, 0);
  border-color: var(--admin-hairline-strong);
  box-shadow: var(--admin-shadow-2);
  background: var(--admin-material-thick);
}

/* ====== Top row ====== */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-key {
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-weight: 600;
  font-size: 14px;
  color: var(--admin-text);
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-tag {
  font-size: 11px !important;
  line-height: 1.4 !important;
  padding: 1px 8px !important;
  flex-shrink: 0;
}

/* ====== Value ====== */
.card-value {
  font-size: 13px;
  color: var(--admin-text-secondary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5em;
  letter-spacing: -0.005em;
}

/* ====== Bottom row ====== */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  border-top: 1px solid var(--admin-hairline);
  padding-top: 8px;
}

.card-time {
  font-size: 11px;
  color: var(--admin-text-tertiary);
  font-variant-numeric: tabular-nums;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-actions :deep(.ant-btn) {
  height: 24px !important;
  padding: 0 8px !important;
  font-size: 12px !important;
}
</style>
