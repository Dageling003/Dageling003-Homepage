<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getConfigsApi, getAuditLogsApi } from '@/api'
import DashboardStatCard from './components/DashboardStatCard.vue'
import DashboardCharts from './components/DashboardCharts.vue'
import DashboardRecentActivity from './components/DashboardRecentActivity.vue'
import DashboardQuickActions from './components/DashboardQuickActions.vue'
import type { ActivityItem } from './types'
import {
  SettingOutlined, AuditOutlined, CheckCircleOutlined, CalendarOutlined,
} from '@ant-design/icons-vue'
import type { EChartsOption } from 'echarts'

const router = useRouter()

// ==================== Types ====================
interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  category?: string
  updatedAt?: string
}

// ==================== Data ====================
const configs = ref<ConfigItem[]>([])
const activityItems = ref<ActivityItem[]>([])
const activityLoading = ref(true)
const auditTotal = ref(0)
const lastUpdate = ref('—')

// ==================== Category name map ====================
const CATEGORY_NAMES: Record<string, string> = {
  info: '个人信息',
  links: '快捷链接',
  techs: '技术栈',
  todos: '待办 & 打字机',
  system: '系统',
}

// ==================== Stat Cards ====================
const initialized = computed(() => {
  const flag = configs.value.find(c => c.configKey === '_initialized')
  return flag?.configValue === '1'
})

const statCards = computed(() => [
  {
    label: '配置项总数',
    value: configs.value.length,
    icon: SettingOutlined,
    color: '#1677ff',
    bg: '#e6f4ff',
    to: '/config',
  },
  {
    label: '操作日志',
    value: auditTotal.value,
    icon: AuditOutlined,
    color: '#722ed1',
    bg: '#f9f0ff',
    to: '/audit',
  },
  {
    label: '系统状态',
    value: initialized.value ? '已初始化' : '待设置',
    icon: CheckCircleOutlined,
    color: initialized.value ? '#52c41a' : '#faad14',
    bg: initialized.value ? '#f6ffed' : '#fffbe6',
    to: initialized.value ? undefined : '/setup',
  },
  {
    label: '最近更新',
    value: lastUpdate.value,
    icon: CalendarOutlined,
    color: '#13c2c2',
    bg: '#e6fffb',
  },
])

// ==================== Chart 1: Config Category Donut ====================
const categoryDonutOption = computed<EChartsOption>(() => {
  const map: Record<string, number> = {}
  for (const c of configs.value) {
    const cat = c.category || 'general'
    map[cat] = (map[cat] || 0) + 1
  }

  const data = Object.entries(map).map(([name, value]) => ({
    name: CATEGORY_NAMES[name] || name,
    value,
  }))

  const total = configs.value.length

  return {
    title: {
      text: total ? `配置分布 · ${total} 项` : '暂无配置',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 600, color: '#262626' },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 项 ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
          scaleSize: 8,
        },
        data: data.length
          ? data
          : [{ name: '暂无数据', value: 1, itemStyle: { color: '#f0f0f0' } }],
        color: ['#1677ff', '#52c41a', '#722ed1', '#faad14', '#fa541c', '#13c2c2', '#eb2f96', '#fa8c16'],
      },
    ],
  }
})

// ==================== Chart 2: 7-Day Audit Trend (Stacked Bar) ====================
const auditTrendOption = computed<EChartsOption>(() => {
  // Build last 7 day labels
  const dayLabels: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dayLabels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }

  // Aggregate by day + action
  const buckets: Record<string, Record<string, number>> = {}
  for (const d of dayLabels) {
    buckets[d] = { CREATE: 0, UPDATE: 0, DELETE: 0 }
  }

  for (const item of activityItems.value) {
    if (!item.createdAt) continue
    const d = new Date(item.createdAt)
    const key = `${d.getMonth() + 1}/${d.getDate()}`
    if (buckets[key]) {
      buckets[key][item.action] = (buckets[key][item.action] || 0) + 1
    }
  }

  const createData = dayLabels.map(d => buckets[d].CREATE)
  const updateData = dayLabels.map(d => buckets[d].UPDATE)
  const deleteData = dayLabels.map(d => buckets[d].DELETE)

  return {
    title: {
      text: '近 7 日操作趋势',
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 600, color: '#262626' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['新增', '更新', '删除'],
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    grid: { left: 10, right: 10, top: 52, bottom: 38 },
    xAxis: {
      type: 'category',
      data: dayLabels,
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
    },
    series: [
      {
        name: '新增',
        type: 'bar',
        stack: 'total',
        data: createData,
        itemStyle: { color: '#52c41a', borderRadius: [0, 0, 0, 0] },
        barWidth: 24,
        emphasis: { focus: 'series' },
      },
      {
        name: '更新',
        type: 'bar',
        stack: 'total',
        data: updateData,
        itemStyle: { color: '#1677ff' },
        emphasis: { focus: 'series' },
      },
      {
        name: '删除',
        type: 'bar',
        stack: 'total',
        data: deleteData,
        itemStyle: { color: '#fa541c', borderRadius: [4, 4, 0, 0] },
        emphasis: { focus: 'series' },
      },
    ],
  }
})

// ==================== Chart 3: Content Completeness ====================
const contentCompletenessOption = computed<EChartsOption>(() => {
  // Check which key content sections are filled
  const map = new Map<string, string>()
  for (const c of configs.value) {
    map.set(c.configKey, c.configValue)
  }

  const checks = [
    { label: '昵称', key: 'name' },
    { label: '个性签名', group: 'typewriterWords' },
    { label: '头像', key: 'avatarUrl' },
    { label: '性别 & 生日', keys: ['infoSex', 'infoBirth'] },
    { label: '省份 & 学校', keys: ['infoProvince', 'infoSchool'] },
    { label: '职业标签', key: 'professions' },
    { label: '快捷链接', key: 'links' },
    { label: '技术栈', key: 'techs' },
    { label: '待办事项', key: 'todos' },
  ]

  const filled = checks.filter(check => {
    if ('key' in check) {
      const v = map.get(check.key!)
      return v && v !== '' && v !== '[]'
    }
    if ('keys' in check) {
      return check.keys!.every(k => {
        const v = map.get(k)
        return v && v !== ''
      })
    }
    if ('group' in check) {
      const v = map.get(check.group!)
      return v && v !== '' && v !== '[]'
    }
    return false
  }).length

  const total = checks.length
  const pct = Math.round((filled / total) * 100)

  return {
    title: {
      text: `内容完善度 · ${pct}%`,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 14, fontWeight: 600, color: '#262626' },
    },
    series: [
      {
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        center: ['50%', '55%'],
        radius: '82%',
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          show: true,
          lineStyle: {
            width: 16,
            color: [
              [0.3, '#fa541c'],
              [0.6, '#faad14'],
              [0.8, '#1677ff'],
              [1, '#52c41a'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '60%',
          width: 8,
          itemStyle: { color: 'auto' },
        },
        axisTick: { distance: -16, length: 4, lineStyle: { width: 1, color: '#999' } },
        splitLine: { distance: -22, length: 10, lineStyle: { width: 2, color: '#999' } },
        axisLabel: {
          color: '#999',
          distance: 28,
          fontSize: 10,
          formatter: (v: number) => `${v}%`,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#262626',
          fontSize: 22,
          fontWeight: 'bold',
          offsetCenter: [0, '78%'],
        },
        data: [{ value: pct }],
      },
    ],
  }
})

// ==================== Fetch ====================
async function fetchData() {
  // Configs
  try {
    const res = await getConfigsApi()
    const data = ((res.data as { data: ConfigItem[] }).data) || []
    configs.value = data

    // Find latest update time
    let latest = ''
    for (const c of data) {
      if (c.updatedAt && c.updatedAt > latest) latest = c.updatedAt
    }
    if (latest) {
      const d = new Date(latest)
      lastUpdate.value = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  } catch {
    /* ignore */
  }

  // Audits — fetch enough for trend + recent activity
  activityLoading.value = true
  try {
    const [recentRes, countRes] = await Promise.all([
      getAuditLogsApi(1, 50), // last 50 for trend aggregation
      getAuditLogsApi(1, 1),
    ])
    activityItems.value = ((recentRes.data as { items?: ActivityItem[] }).items) || []
    auditTotal.value = (countRes.data as { total?: number }).total || 0
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

    <!-- ====== CHARTS: 3 columns ====== -->
    <div class="db-charts">
      <a-card class="db-chart-card">
        <DashboardCharts :option="categoryDonutOption" height="300px" />
      </a-card>
      <a-card class="db-chart-card">
        <DashboardCharts :option="auditTrendOption" height="300px" />
      </a-card>
      <a-card class="db-chart-card">
        <DashboardCharts :option="contentCompletenessOption" height="300px" />
      </a-card>
    </div>

    <!-- ====== BOTTOM: Quick Actions + Recent Activity ====== -->
    <div class="db-bottom">
      <DashboardQuickActions />
      <DashboardRecentActivity
        :items="activityItems.slice(0, 5)"
        :loading="activityLoading"
      />
    </div>
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
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 1rem;
}

.db-chart-card {
  border-radius: 14px;
}

.db-chart-card :deep(.ant-card-body) {
  padding: 12px;
}

/* ====== BOTTOM ====== */
.db-bottom {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 14px;
  align-items: start;
}

@media (max-width: 1100px) {
  .db-charts { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 900px) {
  .db-charts { grid-template-columns: 1fr; }
  .db-bottom { grid-template-columns: 1fr; }
}
</style>
