<script setup lang="ts">
import { ref } from 'vue'
import { getAuditLogsApi } from '@/api'
import { message } from 'ant-design-vue'

interface AuditItem {
  id: number
  action: string
  entity: string
  entityKey: string
  detail: string
  operator: string
  createdAt: string
}

interface AuditPage {
  items: AuditItem[]
  total: number
}

const data = ref<AuditItem[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 90 },
  { title: '对象', dataIndex: 'entity', key: 'entity', width: 80 },
  { title: '配置键', dataIndex: 'entityKey', key: 'entityKey', width: 150, ellipsis: true },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
]

const actionLabels: Record<string, string> = { CREATE: '新增', UPDATE: '更新', DELETE: '删除' }
const actionColors: Record<string, string> = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red' }
const entityLabels: Record<string, string> = { config: '配置', user: '用户' }

async function fetchData() {
  loading.value = true
  try {
    const res = await getAuditLogsApi(page.value, pageSize.value)
    const body = res.data as AuditPage
    data.value = body.items || []
    total.value = body.total || 0
  } catch {
    message.error('获取操作日志失败')
    data.value = []
  } finally {
    loading.value = false
  }
}

function handlePageChange(p: number) {
  page.value = p
  fetchData()
}

function formatTime(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="al-wrap">
    <a-card class="al-card">
      <a-table
        :data-source="data"
        :columns="columns"
        :pagination="{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          showTotal: (t: number) => `共 ${t} 条`,
          onChange: handlePageChange,
        }"
        :loading="loading"
        :scroll="{ x: 800 }"
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, value }">
          <!-- Action tag -->
          <template v-if="column.key === 'action'">
            <a-tag :color="actionColors[value] || 'default'">
              {{ actionLabels[value] || value }}
            </a-tag>
          </template>

          <!-- Entity label -->
          <template v-else-if="column.key === 'entity'">
            {{ entityLabels[value] || value }}
          </template>

          <!-- Timestamp -->
          <template v-else-if="column.key === 'createdAt'">
            {{ formatTime(value) }}
          </template>

          <!-- Detail tooltip -->
          <template v-else-if="column.key === 'detail' && value">
            <a-tooltip :title="value" placement="topLeft">
              <span class="al-detail-text">{{ value }}</span>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.al-wrap {
  max-width: 1200px;
}

.al-card {
  border-radius: 12px;
}

.al-detail-text {
  cursor: help;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.78rem;
  color: #8c8c8c;
}
</style>
