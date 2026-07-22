<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getConfigsApi, getAuditLogsApi } from '@/api'
import { useAdminThemeStore } from '@/stores/theme'
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
const themeStore = useAdminThemeStore()

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
    color: '#0a84ff',
    bg: 'rgba(10, 132, 255, 0.14)',
    to: '/config',
  },
  {
    label: '操作日志',
    value: auditTotal.value,
    icon: AuditOutlined,
    color: '#af52de',
    bg: 'rgba(175, 82, 222, 0.14)',
    to: '/audit',
  },
  {
    label: '系统状态',
    value: initialized.value ? '已初始化' : '待设置',
    icon: CheckCircleOutlined,
    color: initialized.value ? '#34c759' : '#ff9500',
    bg: initialized.value ? 'rgba(52, 199, 89, 0.14)' : 'rgba(255, 149, 0, 0.16)',
    to: initialized.value ? undefined : '/setup',
  },
  {
    label: '最近更新',
    value: lastUpdate.value,
    icon: CalendarOutlined,
    color: '#64d2ff',
    bg: 'rgba(100, 210, 255, 0.16)',
  },
])

// ==================== Apple system palette for ECharts ====================
const chartTextColor = computed(() => themeStore.isDark ? 'rgba(255,255,255,0.94)' : '#1d1d1f')
const chartSubTextColor = computed(() => themeStore.isDark ? 'rgba(255,255,255,0.62)' : '#6e6e73')
const chartAxisLineColor = computed(() => themeStore.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
const chartBorderColor = computed(() => themeStore.isDark ? '#1c1c1e' : '#ffffff')

const APPLE_CHART_PALETTE = [
  '#0a84ff', // blue
  '#34c759', // green
  '#af52de', // purple
  '#ff9500', // orange
  '#ff375f', // pink
  '#64d2ff', // teal
  '#ffcc00', // yellow
  '#5e5ce6', // indigo
]

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
      textStyle: { fontSize: 14, fontWeight: 600, color: chartTextColor.value },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 项 ({d}%)',
    },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 11, color: chartSubTextColor.value },
    },
    series: [
      {
        type: 'pie',
        radius: ['54%', '78%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: chartBorderColor.value, borderWidth: 3 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: chartTextColor.value },
          scaleSize: 8,
        },
        data: data.length
          ? data
          : [{ name: '暂无数据', value: 1, itemStyle: { color: chartAxisLineColor.value } }],
        color: APPLE_CHART_PALETTE,
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
      textStyle: { fontSize: 14, fontWeight: 600, color: chartTextColor.value },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: ['新增', '更新', '删除'],
      bottom: 0,
      textStyle: { fontSize: 11, color: chartSubTextColor.value },
    },
    grid: { left: 10, right: 10, top: 52, bottom: 38 },
    xAxis: {
      type: 'category',
      data: dayLabels,
      axisLabel: { fontSize: 10, color: chartSubTextColor.value },
      axisLine: { lineStyle: { color: chartAxisLineColor.value } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontSize: 10, color: chartSubTextColor.value },
      axisLine: { show: false },
      splitLine: { lineStyle: { type: 'dashed', color: chartAxisLineColor.value } },
    },
    series: [
      {
        name: '新增',
        type: 'bar',
        stack: 'total',
        data: createData,
        itemStyle: { color: '#34c759', borderRadius: [0, 0, 0, 0] },
        barWidth: 20,
        emphasis: { focus: 'series' },
      },
      {
        name: '更新',
        type: 'bar',
        stack: 'total',
        data: updateData,
        itemStyle: { color: '#0a84ff' },
        emphasis: { focus: 'series' },
      },
      {
        name: '删除',
        type: 'bar',
        stack: 'total',
        data: deleteData,
        itemStyle: { color: '#ff3b30', borderRadius: [6, 6, 0, 0] },
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
      textStyle: { fontSize: 14, fontWeight: 600, color: chartTextColor.value },
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
              [0.3, '#ff3b30'],
              [0.6, '#ff9500'],
              [0.8, '#0a84ff'],
              [1, '#34c759'],
            ],
          },
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '60%',
          width: 8,
          itemStyle: { color: 'auto' },
        },
        axisTick: { distance: -16, length: 4, lineStyle: { width: 1, color: chartSubTextColor.value } },
        splitLine: { distance: -22, length: 10, lineStyle: { width: 2, color: chartSubTextColor.value } },
        axisLabel: {
          color: chartSubTextColor.value,
          distance: 28,
          fontSize: 10,
          formatter: (v: number) => `${v}%`,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: chartTextColor.value,
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
  padding: 4px;
}

/* ====== STATS ====== */
.db-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

/* ====== CHARTS ====== */
.db-charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.db-chart-card :deep(.ant-card-body) {
  padding: 14px;
}

/* ====== BOTTOM ====== */
.db-bottom {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
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
