<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getConfigsApi, getAuditLogsApi } from '@/api'
import { isAuditEnabled } from '@/utils/features'
import DashboardStatCard from './components/DashboardStatCard.vue'
import DashboardRecentActivity from './components/DashboardRecentActivity.vue'
import DashboardQuickActions from './components/DashboardQuickActions.vue'
import type { ActivityItem } from './types'
import {
  SettingOutlined, AuditOutlined, CheckCircleOutlined, CalendarOutlined,
} from '@ant-design/icons-vue'

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

// ==================== Stat Cards ====================
const initialized = computed(() => {
  const flag = configs.value.find(c => c.configKey === '_initialized')
  return flag?.configValue === '1'
})

const statCards = computed(() => {
  const cards: Array<Record<string, unknown>> = [
    {
      label: '配置项总数',
      value: configs.value.length,
      icon: SettingOutlined,
      color: '#0a84ff',
      bg: 'rgba(10, 132, 255, 0.14)',
      to: '/config',
    },
  ]
  if (isAuditEnabled()) {
    cards.push({
      label: '操作日志',
      value: auditTotal.value,
      icon: AuditOutlined,
      color: '#af52de',
      bg: 'rgba(175, 82, 222, 0.14)',
      to: '/audit',
    })
  }
  cards.push(
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
  )
  return cards
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

  // Audits — only fetch when feature enabled
  if (!isAuditEnabled()) {
    activityLoading.value = false
    return
  }
  activityLoading.value = true
  try {
    const [recentRes, countRes] = await Promise.all([
      getAuditLogsApi(1, 10),
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
        :key="String(card.label)"
        v-bind="card as any"
        @click="(card as any).to && router.push((card as any).to)"
      />
    </div>

    <!-- ====== BOTTOM: Quick Actions + Recent Activity ====== -->
    <div class="db-bottom">
      <DashboardQuickActions />
      <DashboardRecentActivity
        v-if="isAuditEnabled()"
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

/* ====== BOTTOM ====== */
.db-bottom {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .db-bottom { grid-template-columns: 1fr; }
}
</style>
