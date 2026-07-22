<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { resetPasswordApi } from '@/api'
import { message } from 'ant-design-vue'
import { LockOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const route = useRoute()

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const done = ref(false)

const token = computed(() => (route.query.token as string) || '')
const hasToken = computed(() => token.value.length >= 32)

const passwordStrength = computed(() => {
  const v = password.value
  if (!v) return 0
  let s = 0
  if (v.length >= 12) s++
  if (v.length >= 16) s++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++
  if (/\d/.test(v)) s++
  if (/[^A-Za-z0-9]/.test(v)) s++
  return Math.min(s, 4)
})

const strengthLabel = computed(() => ['', '弱', '一般', '良好', '强'][passwordStrength.value])
const strengthColor = computed(() => ['', '#ff3b30', '#ff9500', '#0a84ff', '#34c759'][passwordStrength.value])

const canSubmit = computed(() =>
  password.value.length >= 12
  && password.value === confirm.value
  && hasToken.value,
)

async function handleSubmit() {
  if (!hasToken.value) {
    message.error('重置链接无效或已过期，请重新申请')
    return
  }
  if (password.value.length < 12) {
    message.warning('新密码至少 12 位')
    return
  }
  if (password.value !== confirm.value) {
    message.warning('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    await resetPasswordApi(token.value, password.value)
    done.value = true
    message.success('密码重置成功')
  } catch (err: any) {
    const msg = err?.response?.data?.message || '重置失败，请稍后再试'
    message.error(msg)
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push({ name: 'login' })
}

onMounted(() => {
  if (!hasToken.value) {
    message.warning('重置链接无效或已过期，请回到登录页重新申请')
  }
})
</script>

<template>
  <div class="rp-root">
    <div class="rp-bg">
      <div class="rp-circle rp-circle-1" />
      <div class="rp-circle rp-circle-2" />
    </div>

    <div class="rp-card">
      <a-button class="rp-back" type="text" size="small" @click="goLogin">
        <template #icon><ArrowLeftOutlined /></template>返回登录
      </a-button>

      <div class="rp-header">
        <div class="rp-logo-wrap">
          <span class="rp-logo-icon"><LockOutlined /></span>
        </div>
        <h2 class="rp-title">设置新密码</h2>
        <p class="rp-subtitle" v-if="!done">输入新密码以完成重置，密码至少 12 位</p>
      </div>

      <a-alert
        v-if="!hasToken && !done"
        type="error"
        show-icon
        class="rp-alert"
        message="重置链接无效或已过期"
        description="请回到登录页点击「忘记密码」重新申请。"
      />

      <a-form
        v-if="!done"
        layout="vertical"
        @finish="handleSubmit"
        class="rp-form"
      >
        <a-form-item label="新密码（至少 12 位）" required>
          <a-input-password
            v-model:value="password"
            placeholder="请输入新密码"
            size="large"
            :disabled="!hasToken"
            class="rp-input"
          >
            <template #prefix><LockOutlined class="rp-input-icon" /></template>
          </a-input-password>
          <div v-if="password" class="rp-strength">
            <div class="rp-strength-bar">
              <div class="rp-strength-fill" :style="{ width: `${(passwordStrength / 4) * 100}%`, background: strengthColor }" />
            </div>
            <span class="rp-strength-text" :style="{ color: strengthColor }">强度：{{ strengthLabel }}</span>
          </div>
        </a-form-item>

        <a-form-item label="确认新密码" required>
          <a-input-password
            v-model:value="confirm"
            placeholder="请再次输入新密码"
            size="large"
            :disabled="!hasToken"
            class="rp-input"
            @keyup.enter="handleSubmit"
          >
            <template #prefix><LockOutlined class="rp-input-icon" /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            block
            :loading="loading"
            :disabled="!canSubmit"
            size="large"
            html-type="submit"
            class="rp-btn"
          >
            重置密码
          </a-button>
        </a-form-item>
      </a-form>

      <div v-else class="rp-result">
        <div class="rp-result-icon"><CheckCircleOutlined /></div>
        <h3 class="rp-result-title">密码重置成功</h3>
        <p class="rp-result-text">请使用新密码登录管理后台</p>
        <a-button type="primary" block size="large" class="rp-btn" @click="goLogin">
          立即登录
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   ResetPassword — Apple glass card, matches ForgotPasswordView
   ============================================================ */
.rp-root {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  background: var(--admin-bg);
  padding: 1rem;
}
.rp-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.rp-circle {
  position: absolute; border-radius: 50%;
  filter: blur(90px);
  animation: rp-drift 34s ease-in-out infinite alternate;
  opacity: 0.55;
}
.rp-circle-1 {
  width: 40vmax; height: 40vmax;
  background: var(--admin-orb-3);
  top: -14vmax; left: -10vmax;
}
.rp-circle-2 {
  width: 34vmax; height: 34vmax;
  background: var(--admin-orb-2);
  bottom: -12vmax; right: -8vmax;
  animation-delay: -12s;
}

[theme='dark'] .rp-circle { opacity: 0.35; }

@keyframes rp-drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(3vmax, -3vmax, 0) scale(1.08); }
}

.rp-card {
  position: relative; z-index: 1;
  width: 100%;
  max-width: 420px;
  background: var(--admin-material-thick);
  backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-xl);
  padding: 2.4rem 2.2rem 1.6rem;
  box-shadow: var(--admin-shadow-3);
  animation: rp-card-in 620ms var(--admin-ease-out) both;
  isolation: isolate;
}
.rp-card::before {
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
[theme='dark'] .rp-card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
}

@keyframes rp-card-in {
  from { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.97); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

.rp-back {
  position: absolute; top: 14px; left: 14px;
  color: var(--admin-text-secondary) !important;
  padding: 0 8px !important;
  height: 30px !important;
  border-radius: 999px !important;
}
.rp-back:hover { color: var(--admin-primary) !important; background: var(--admin-primary-softer) !important; }

.rp-header { text-align: center; margin: 0.5rem 0 1.8rem; }
.rp-logo-wrap {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, #34c759, #a3e57a);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1rem;
  box-shadow:
    0 8px 24px rgba(52, 199, 89, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  color: #fff; font-size: 1.5rem;
}
.rp-title {
  font-size: 1.55rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: var(--admin-text);
  letter-spacing: -0.022em;
}
.rp-subtitle { margin: 0; font-size: 0.9rem; color: var(--admin-text-secondary); }

.rp-alert { margin-bottom: 1rem; }
.rp-form :deep(.ant-form-item) { margin-bottom: 1rem; }
.rp-input :deep(.ant-input-prefix) { margin-right: 8px; }
.rp-input-icon { color: var(--admin-text-tertiary); font-size: 0.95rem; }
.rp-btn {
  height: 46px; font-size: 1rem;
  border-radius: var(--admin-radius-md) !important;
  font-weight: 600; letter-spacing: 0.02em;
}

.rp-strength { margin-top: 8px; display: flex; align-items: center; gap: 10px; }
.rp-strength-bar {
  flex: 1;
  height: 4px;
  background: var(--admin-hairline-strong);
  border-radius: 999px;
  overflow: hidden;
}
.rp-strength-fill {
  height: 100%;
  border-radius: 999px;
  transition:
    width var(--admin-duration-medium) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
}
.rp-strength-text {
  font-size: 0.78rem;
  white-space: nowrap;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.rp-result { text-align: center; padding: 0.5rem 0; }
.rp-result-icon {
  font-size: 2.8rem;
  color: var(--admin-success);
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 4px 12px rgba(52, 199, 89, 0.35));
}
.rp-result-title {
  font-size: 1.15rem; font-weight: 600;
  margin: 0 0 0.6rem;
  color: var(--admin-text);
  letter-spacing: -0.015em;
}
.rp-result-text {
  font-size: 0.9rem;
  color: var(--admin-text-secondary);
  margin: 0.2rem 0 1.3rem;
}
</style>
