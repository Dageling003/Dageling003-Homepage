<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAuditLogsApi } from '@/api'
import { message } from 'ant-design-vue'
import {
  SearchOutlined, ClearOutlined, ReloadOutlined,
} from '@ant-design/icons-vue'

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

// Filters
const filterAction = ref<string | undefined>(undefined)
const filterOperator = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 90 },
  { title: '对象', dataIndex: 'entity', key: 'entity', width: 80 },
  { title: '配置键', dataIndex: 'entityKey', key: 'entityKey', width: 150, ellipsis: true },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
  { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
]

const actionLabels: Record<string, string> = { CREATE: '新增', UPDATE: '更新', DELETE: '删除' }
const actionColors: Record<string, string> = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red' }
const entityLabels: Record<string, string> = { config: '配置', user: '用户' }

async function fetchData() {
  loading.value = true
  try {
    const filters: any = {}
    if (filterAction.value) filters.action = filterAction.value
    if (filterOperator.value.trim()) filters.operator = filterOperator.value.trim()
    if (filterStartDate.value) filters.startDate = filterStartDate.value
    if (filterEndDate.value) filters.endDate = filterEndDate.value
    const res = await getAuditLogsApi(page.value, pageSize.value, filters)
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

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  filterAction.value = undefined
  filterOperator.value = ''
  filterStartDate.value = ''
  filterEndDate.value = ''
  page.value = 1
  fetchData()
}

function formatTime(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function safeFormatJSON(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw // not valid JSON — display as-is
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="al-wrap">
    <a-card class="al-card">
      <!-- Filters -->
      <div class="al-filters">
        <a-select
          v-model:value="filterAction"
          placeholder="操作类型"
          allow-clear
          style="width: 120px"
          size="middle"
          @change="handleSearch"
        >
          <a-select-option value="CREATE">新增</a-select-option>
          <a-select-option value="UPDATE">更新</a-select-option>
          <a-select-option value="DELETE">删除</a-select-option>
        </a-select>

        <a-input
          v-model:value="filterOperator"
          placeholder="操作人"
          allow-clear
          style="width: 140px"
          size="middle"
          @press-enter="handleSearch"
        >
          <template #prefix><SearchOutlined /></template>
        </a-input>

        <input
          type="date"
          :value="filterStartDate"
          @input="filterStartDate = ($event.target as HTMLInputElement).value; handleSearch()"
          class="al-date-input"
          placeholder="开始日期"
        />
        <span class="al-date-sep">~</span>
        <input
          type="date"
          :value="filterEndDate"
          @input="filterEndDate = ($event.target as HTMLInputElement).value; handleSearch()"
          class="al-date-input"
          placeholder="结束日期"
        />

        <a-button size="middle" @click="handleSearch" type="primary">
          <template #icon><SearchOutlined /></template>搜索
        </a-button>
        <a-button size="middle" @click="handleReset">
          <template #icon><ClearOutlined /></template>重置
        </a-button>
        <a-button size="middle" @click="fetchData" :loading="loading" style="margin-left: auto">
          <template #icon><ReloadOutlined /></template>刷新
        </a-button>
      </div>

      <!-- Table -->
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
        :scroll="{ x: 900 }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, value, record }">
          <template v-if="column.key === 'action'">
            <a-tag :color="actionColors[value] || 'default'">
              {{ actionLabels[value] || value }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'entity'">
            {{ entityLabels[value] || value }}
          </template>

          <template v-else-if="column.key === 'createdAt'">
            {{ formatTime(value) }}
          </template>

          <template v-else-if="column.key === 'detail' && value">
            <a-popover trigger="click" placement="topLeft">
              <template #content>
                <pre class="al-detail-pop">{{ safeFormatJSON(value) }}</pre>
              </template>
              <span class="al-detail-text">{{ value }}</span>
            </a-popover>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<style scoped>
.al-wrap { max-width: 1200px; }
.al-card { border-radius: 12px; }

.al-filters {
  display: flex; gap: 10px; align-items: center;
  margin-bottom: 16px; flex-wrap: wrap;
}

.al-detail-text {
  cursor: pointer;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.78rem;
  color: #8c8c8c;
  max-width: 200px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.al-detail-pop {
  font-size: 0.75rem;
  max-height: 300px;
  overflow: auto;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.al-date-input {
  height: 32px; padding: 0 8px;
  border: 1px solid #d9d9d9; border-radius: 6px;
  font-size: 0.85rem; color: #262626; background: #fff;
  outline: none; transition: border-color 0.2s; font-family: inherit;
  width: 140px;
}
.al-date-input:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.1); }
.al-date-sep { color: #d9d9d9; }

@media (max-width: 768px) {
  .al-filters { flex-direction: column; align-items: stretch; }
  .al-filters > * { width: 100% !important; }
}
</style>
