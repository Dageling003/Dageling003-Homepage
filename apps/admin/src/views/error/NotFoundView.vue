<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="err-wrap">
    <div class="err-code">404</div>
    <div class="err-title">页面不存在</div>
    <p class="err-desc">抱歉，您访问的页面不存在或已被移除。</p>
    <a-button type="primary" size="large" @click="router.push('/dashboard')">
      返回首页
    </a-button>
  </div>
</template>

<style scoped>
.err-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
  gap: 0.4rem;
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
  margin-bottom: 0.4rem;
  font-optical-sizing: auto;
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
  margin: 0 0 1.8rem;
  max-width: 30ch;
}
</style>
