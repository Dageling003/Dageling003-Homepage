<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const is403 = computed(() => route.name === '403')

const statusCode = computed(() => is403.value ? '403' : '404')

const title = computed(() => is403.value ? '禁止访问' : '页面不存在')

const description = computed(() => is403.value
  ? '抱歉，您没有权限访问此页面。'
  : '抱歉，您访问的页面不存在或已被移除。')
</script>

<template>
  <div class="err-root">
    <div class="err-card">
      <div class="err-icon-wrap">
        <svg class="err-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
          <path d="M12 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="12" cy="15" r="0.75" fill="currentColor" />
        </svg>
      </div>
      <div class="err-code">{{ statusCode }}</div>
      <h2 class="err-title">{{ title }}</h2>
      <p class="err-desc">{{ description }}</p>
      <div class="err-actions">
        <a-button type="primary" size="large" @click="router.push('/dashboard')">
          返回首页
        </a-button>
        <a-button size="large" @click="router.back()">
          返回上页
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.err-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.err-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 420px;
  animation: err-in 520ms var(--admin-ease-out) both;
}

@keyframes err-in {
  from { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.96); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

.err-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--admin-primary-soft);
  color: var(--admin-primary);
  margin-bottom: 1.2rem;
  box-shadow: 0 8px 32px var(--admin-primary-soft);
}

.err-icon {
  width: 36px;
  height: 36px;
}

.err-code {
  font-size: clamp(6rem, 15vw, 9rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
  background: linear-gradient(180deg,
    color-mix(in srgb, var(--admin-primary) 55%, transparent) 0%,
    color-mix(in srgb, var(--admin-primary) 20%, transparent) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 8px 24px var(--admin-primary-soft));
  margin-bottom: 0.2rem;
}

.err-title {
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--admin-text);
  margin: 0.35rem 0;
  letter-spacing: -0.018em;
}

.err-desc {
  font-size: 0.95rem;
  color: var(--admin-text-secondary);
  margin: 0 0 2rem;
  max-width: 30ch;
  line-height: 1.5;
}

.err-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
