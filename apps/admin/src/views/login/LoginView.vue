<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    message.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await authStore.login(username.value, password.value)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  } catch (err: any) {
    if (err?.response?.status === 401) {
      message.error('用户名或密码错误')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="lg-root">
    <!-- Decorative background -->
    <div class="lg-bg">
      <div class="lg-circle lg-circle-1" />
      <div class="lg-circle lg-circle-2" />
      <div class="lg-circle lg-circle-3" />
    </div>

    <div class="lg-card">
      <!-- Header -->
      <div class="lg-card-header">
        <div class="lg-logo-wrap">
          <span class="lg-logo-icon">🧩</span>
        </div>
        <h2 class="lg-title">homepage 管理</h2>
        <p class="lg-subtitle">请输入账号密码登录系统</p>
      </div>

      <!-- Form -->
      <a-form layout="vertical" @finish="handleLogin" class="lg-form">
        <a-form-item label="用户名" required>
          <a-input
            v-model:value="username"
            placeholder="请输入用户名"
            size="large"
            @keyup.enter="handleLogin"
            class="lg-input"
          >
            <template #prefix><UserOutlined class="lg-input-icon" /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" required>
          <a-input-password
            v-model:value="password"
            placeholder="请输入密码"
            size="large"
            @keyup.enter="handleLogin"
            class="lg-input"
          >
            <template #prefix><LockOutlined class="lg-input-icon" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" block :loading="loading" size="large" @click="handleLogin" class="lg-btn">
            登 录
          </a-button>
        </a-form-item>
      </a-form>

      <p class="lg-footer-text">© 2026 homepage · 管理后台</p>
    </div>
  </div>
</template>

<style scoped>
/* ====== Root ====== */
.lg-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}

/* ====== Decorative circles ====== */
.lg-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lg-circle {
  position: absolute;
  border-radius: 50%;
  animation: lg-drift 20s ease-in-out infinite;
}

.lg-circle-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(22,119,255,0.08) 0%, transparent 70%);
  top: -150px; left: -100px;
  animation-delay: 0s;
}

.lg-circle-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(114,46,209,0.06) 0%, transparent 70%);
  bottom: -100px; right: -80px;
  animation-delay: -7s;
}

.lg-circle-3 {
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(82,196,26,0.05) 0%, transparent 70%);
  top: 50%; left: 60%;
  animation-delay: -14s;
}

@keyframes lg-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -30px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* ====== Card ====== */
.lg-card {
  width: 400px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 2.2rem 2rem 1.5rem;
  box-shadow:
    0 1px 2px rgba(0,0,0,0.03),
    0 8px 40px rgba(0,0,0,0.06);
  position: relative;
  z-index: 1;
  animation: lg-card-in 0.5s ease;
}

@keyframes lg-card-in {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ====== Card Header ====== */
.lg-card-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.lg-logo-wrap {
  width: 56px; height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.8rem;
  box-shadow: 0 4px 14px rgba(22,119,255,0.25);
}

.lg-logo-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.lg-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 0.3rem;
  color: #141414;
}

.lg-subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #8c8c8c;
}

/* ====== Form ====== */
.lg-form .ant-form-item { margin-bottom: 1rem; }

.lg-input :deep(.ant-input-prefix) { margin-right: 6px; }
.lg-input-icon { color: #bfbfbf; font-size: 0.95rem; }

.lg-btn {
  height: 44px;
  font-size: 1rem;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
}

/* ====== Footer ====== */
.lg-footer-text {
  text-align: center;
  font-size: 0.75rem;
  color: #d9d9d9;
  margin: 1.2rem 0 0;
}
</style>
