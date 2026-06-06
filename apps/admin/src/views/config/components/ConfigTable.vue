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
  } catch { /* plain text */ }
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
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

/* ====== Card ====== */
.config-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
}

.config-card:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* ====== Top row ====== */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-key {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
}

.card-tag {
  font-size: 11px;
  line-height: 1;
}

/* ====== Value ====== */
.card-value {
  font-size: 13px;
  color: #4a4a4a;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.5em;
}

/* ====== Bottom row ====== */
.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

.card-time {
  font-size: 11px;
  color: #bbb;
}

.card-actions {
  display: flex;
  gap: 0;
}
</style>
