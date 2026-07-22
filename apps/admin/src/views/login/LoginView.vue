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

function goForgot() {
  router.push({ name: 'forgot-password' })
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
        <div class="lg-logo-wrap" aria-hidden="true">
          <span class="lg-logo-icon">◈</span>
        </div>
        <h2 class="lg-title">Homepage 管理</h2>
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

      <div class="lg-extra">
        <a-button type="link" size="small" @click="goForgot" class="lg-forgot">
          忘记密码？
        </a-button>
      </div>

      <p class="lg-footer-text">© 2026 homepage · 管理后台</p>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   LoginView — Apple glass card on aurora backdrop
   ============================================================ */
.lg-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--admin-bg);
  padding: 1rem;
}

/* ---------- Decorative aurora orbs ---------- */
.lg-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.lg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: lg-drift 34s ease-in-out infinite alternate;
  opacity: 0.55;
}

.lg-circle-1 {
  width: 42vmax; height: 42vmax;
  background: var(--admin-orb-1);
  top: -14vmax; left: -10vmax;
  animation-delay: 0s;
}

.lg-circle-2 {
  width: 40vmax; height: 40vmax;
  background: var(--admin-orb-2);
  bottom: -14vmax; right: -8vmax;
  animation-delay: -12s;
}

.lg-circle-3 {
  width: 30vmax; height: 30vmax;
  background: var(--admin-orb-3);
  top: 40%; left: 55%;
  animation-delay: -22s;
  opacity: 0.35;
}

[theme='dark'] .lg-circle { opacity: 0.35; }

@keyframes lg-drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(3vmax, -3vmax, 0) scale(1.08); }
}

/* ---------- Card — glass + hairline ---------- */
.lg-card {
  width: 100%;
  max-width: 420px;
  background: var(--admin-material-thick);
  backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-xl);
  padding: 2.4rem 2.2rem 1.6rem;
  box-shadow: var(--admin-shadow-3);
  position: relative;
  z-index: 1;
  animation: lg-card-in 620ms var(--admin-ease-out) both;
  isolation: isolate;
}

/* Bright top edge — glass catching light */
.lg-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.7),
    transparent);
  pointer-events: none;
}

[theme='dark'] .lg-card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
}

@keyframes lg-card-in {
  from { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.97); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

/* ---------- Header ---------- */
.lg-card-header {
  text-align: center;
  margin-bottom: 1.8rem;
}

.lg-logo-wrap {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg,
    var(--admin-primary),
    color-mix(in srgb, var(--admin-primary) 60%, #fff 25%));
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  box-shadow:
    0 8px 24px rgba(var(--admin-primary-rgb), 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  color: #fff;
  font-weight: 800;
  font-size: 1.9rem;
  letter-spacing: -0.05em;
}

.lg-logo-icon {
  font-size: 1.7rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.lg-title {
  font-size: 1.55rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: var(--admin-text);
  letter-spacing: -0.022em;
  line-height: 1.15;
}

.lg-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--admin-text-secondary);
  letter-spacing: -0.005em;
}

/* ---------- Form ---------- */
.lg-form :deep(.ant-form-item) { margin-bottom: 1rem; }

.lg-extra {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.35rem;
  margin-bottom: 0.5rem;
}
.lg-forgot {
  padding: 0 4px;
  font-size: 0.85rem;
  color: var(--admin-text-secondary) !important;
}
.lg-forgot:hover { color: var(--admin-primary) !important; }

.lg-input :deep(.ant-input-prefix) { margin-right: 8px; }
.lg-input-icon { color: var(--admin-text-tertiary); font-size: 0.95rem; }

.lg-btn {
  height: 46px;
  font-size: 1rem;
  border-radius: var(--admin-radius-md) !important;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-top: 0.25rem;
}

/* ---------- Footer ---------- */
.lg-footer-text {
  text-align: center;
  font-size: 0.75rem;
  color: var(--admin-text-tertiary);
  margin: 1.4rem 0 0;
  letter-spacing: 0.02em;
}
</style>
