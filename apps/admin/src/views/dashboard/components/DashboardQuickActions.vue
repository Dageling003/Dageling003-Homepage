<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  SettingOutlined, UserOutlined, AuditOutlined, RocketOutlined, EyeOutlined,
} from '@ant-design/icons-vue'

defineOptions({ name: 'DashboardQuickActions' })

const router = useRouter()

const actions = computed(() => [
  { label: '查看站点', icon: EyeOutlined, to: '', type: 'primary' as const, external: true },
  { label: '管理配置', icon: SettingOutlined, to: '/config/personal', type: 'primary' as const, external: false },
  { label: '账号设置', icon: UserOutlined, to: '/account', external: false },
  { label: '操作日志', icon: AuditOutlined, to: '/audit', external: false },
  { label: '初始设置', icon: RocketOutlined, to: '/setup', external: false },
])

function handleAction(to: string, external: boolean) {
  if (external) {
    const url = import.meta.env.VITE_FRONTEND_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '/site/')
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  router.push(to)
}
</script>

<template>
  <div class="dqa-section">
    <h3 class="dqa-title">快捷操作</h3>
    <div class="dqa-grid">
      <a-button
        v-for="a in actions"
        :key="a.label"
        :type="a.type || 'default'"
        size="middle"
        block
        @click="handleAction(a.to, a.external)"
      >
        <template #icon><component :is="a.icon" /></template>
        {{ a.label }}
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.dqa-section {
  height: 100%;
  padding: 1.15rem 1.25rem;
  border-radius: var(--admin-radius-lg);
  background: var(--admin-material-regular);
  backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  box-shadow: var(--admin-shadow-1);
  position: relative;
  overflow: hidden;
}

.dqa-section::before {
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

[theme='dark'] .dqa-section::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.18),
    transparent);
}

.dqa-title {
  font-size: 0.78rem;
  font-weight: 600;
  margin: 0 0 0.85rem;
  color: var(--admin-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.dqa-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
