<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getConfigsApi, getAuditLogsApi } from '@/api'
import DashboardStatCard from './components/DashboardStatCard.vue'
import DashboardCharts from './components/DashboardCharts.vue'
import DashboardRecentActivity from './components/DashboardRecentActivity.vue'
import type { ActivityItem } from './types'
import {
  SettingOutlined, FileTextOutlined, AuditOutlined, ClockCircleOutlined,
} from '@ant-design/icons-vue'
import type { EChartsOption } from 'echarts'

const router = useRouter()

// ==================== Data ====================
interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  category?: string
  createdAt?: string
}
const configs = ref<ConfigItem[]>([])
const activityItems = ref<ActivityItem[]>([])
const activityLoading = ref(true)
const configCount = ref(0)
const auditTotal = ref(0)

// ==================== Stat Cards ====================
const statCards = computed(() => [
  { label: '配置项总数', value: configCount.value, icon: SettingOutlined, color: '#1677ff', bg: '#e6f4ff', to: '/config' },
  { label: '操作日志', value: auditTotal.value, icon: AuditOutlined, color: '#722ed1', bg: '#f9f0ff', to: '/audit' },
  { label: '系统版本', value: 'v0.3.0', icon: FileTextOutlined, color: '#52c41a', bg: '#f6ffed' },
  { label: '运行状态', value: '正常', icon: ClockCircleOutlined, color: '#fa8c16', bg: '#fff7e6' },
])

// ==================== Pie Chart ====================
const categoryPieOption = computed<EChartsOption>(() => {
  const map: Record<string, number> = {}
  for (const c of configs.value) {
    const cat = c.category || 'general'
    map[cat] = (map[cat] || 0) + 1
  }
  const data = Object.entries(map).map(([name, value]) => ({ name, value }))
  const total = configs.value.length

  return {
    title: { text: total ? `配置分布（共 ${total} 项）` : '暂无配置',
      left: 'center', top: 8,
      textStyle: { fontSize: 14, fontWeight: 600, color: '#262626' },
    },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 项 ({d}%)' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['48%', '72%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' },
        scaleSize: 8,
      },
      data: data.length ? data : [{ name: '暂无数据', value: 1, itemStyle: { color: '#f0f0f0' } }],
      color: ['#1677ff', '#52c41a', '#722ed1', '#faad14', '#fa541c', '#13c2c2', '#eb2f96', '#fa8c16'],
    }],
  }
})

// ==================== Audit Activity Chart ====================
const auditLineOption = computed<EChartsOption>(() => {
  // Group audit logs by date for last 7 days
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    days.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }

  const counts: Record<string, number> = {}
  for (const d of days) counts[d] = 0

  for (const item of activityItems.value) {
    if (!item.createdAt) continue
    const d = new Date(item.createdAt)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    if (key in counts) counts[key]++
  }

  const createData: number[] = [], updateData: number[] = [], deleteData: number[] = []
  // Simple: just sum all actions per day since we don't have breakdown
  for (const d of days) {
    createData.push(counts[d])
    updateData.push(0)
    deleteData.push(0)
  }

  return {
    title: { text: '近 7 日操作趋势',
      left: 'center', top: 8,
      textStyle: { fontSize: 14, fontWeight: 600, color: '#262626' },
    },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: { fontSize: 11 } },
    grid: { left: 8, right: 8, top: 52, bottom: 36 },
    xAxis: { type: 'category', data: days, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 10 } },
    series: [{
      name: '操作次数', type: 'bar', data: createData,
      itemStyle: { borderRadius: [4, 4, 0, 0], color: '#1677ff' },
      barWidth: 20,
    }],
  }
})

// ==================== Fetch ====================
async function fetchData() {
  // Configs
  try {
    const res = await getConfigsApi()
    const data = (res.data as { data: ConfigItem[] }).data
    configs.value = data || []
    configCount.value = data?.length || 0
  } catch {
    configCount.value = 0
  }

  // Audits
  activityLoading.value = true
  try {
    const [recentRes, totalRes] = await Promise.all([
      getAuditLogsApi(1, 5),
      getAuditLogsApi(1, 1),
    ])
    activityItems.value = ((recentRes.data as { items?: ActivityItem[] }).items) || []
    auditTotal.value = (totalRes.data as { total?: number }).total || 0
  } catch {
    activityItems.value = []
  } finally {
    activityLoading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="db-wrap">
    <!-- ====== STAT CARDS ====== -->
    <div class="db-stats">
      <DashboardStatCard
        v-for="card in statCards"
        :key="card.label"
        v-bind="card"
        @click="card.to && router.push(card.to)"
      />
    </div>

    <!-- ====== CHARTS ROW ====== -->
    <div class="db-charts">
      <a-card class="db-chart-card">
        <DashboardCharts :option="categoryPieOption" height="300px" />
      </a-card>
      <a-card class="db-chart-card">
        <DashboardCharts :option="auditLineOption" height="300px" />
      </a-card>
    </div>

    <!-- ====== RECENT ACTIVITY ====== -->
    <DashboardRecentActivity :items="activityItems" :loading="activityLoading" />
  </div>
</template>

<style scoped>
.db-wrap {
  max-width: 1200px;
}

/* ====== STATS ====== */
.db-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 1rem;
}

/* ====== CHARTS ====== */
.db-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 1rem;
}

.db-chart-card {
  border-radius: 14px;
}

.db-chart-card :deep(.ant-card-body) {
  padding: 12px;
}

@media (max-width: 900px) {
  .db-charts { grid-template-columns: 1fr; }
}

/* ====== BOTTOM ====== */
.db-bottom {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 900px) {
  .db-bottom { grid-template-columns: 1fr; }
}
</style>
