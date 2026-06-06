<script setup lang="ts">
import { useRouter } from 'vue-router'
import { SettingOutlined, UserOutlined } from '@ant-design/icons-vue'

const router = useRouter()
</script>

<template>
  <div class="dqa-section">
    <h3 class="dqa-title">快捷操作</h3>
    <div class="dqa-grid">
      <a-button type="primary" size="large" @click="router.push('/config')" class="dqa-btn">
        <template #icon><SettingOutlined /></template>
        管理配置
      </a-button>
      <a-button size="large" @click="router.push('/account')" class="dqa-btn">
        <template #icon><UserOutlined /></template>
        账号设置
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.dqa-section {
  margin-bottom: 1.5rem;
}

.dqa-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.8rem;
  color: var(--admin-text, #262626);
}

.dqa-grid {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
</style>
