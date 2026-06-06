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
  min-height: 50vh;
  text-align: center;
  padding: 2rem;
}

.err-code {
  font-size: 6rem;
  font-weight: 700;
  color: #1677ff;
  line-height: 1;
  opacity: 0.15;
  letter-spacing: 0.1em;
}

.err-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #262626;
  margin: 0.5rem 0;
}

.err-desc {
  font-size: 0.9rem;
  color: #8c8c8c;
  margin-bottom: 1.5rem;
}
</style>
