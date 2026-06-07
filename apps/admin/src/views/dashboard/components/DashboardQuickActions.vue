<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  SettingOutlined, UserOutlined, AuditOutlined, RocketOutlined,
} from '@ant-design/icons-vue'

defineOptions({ name: 'DashboardQuickActions' })

const router = useRouter()

const actions = computed(() => [
  { label: '管理配置', icon: SettingOutlined, to: '/config/personal', type: 'primary' as const },
  { label: '账号设置', icon: UserOutlined, to: '/account' },
  { label: '操作日志', icon: AuditOutlined, to: '/audit' },
  { label: '初始设置', icon: RocketOutlined, to: '/setup' },
])
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
        @click="router.push(a.to)"
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
}

.dqa-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.8rem;
  color: var(--admin-text, #262626);
}

.dqa-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
