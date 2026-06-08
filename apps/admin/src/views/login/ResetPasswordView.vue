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
const strengthColor = computed(() => ['', '#ff4d4f', '#faad14', '#1677ff', '#52c41a'][passwordStrength.value])

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
.rp-root {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  background: #f0f2f5;
}
.rp-bg { position: absolute; inset: 0; pointer-events: none; }
.rp-circle {
  position: absolute; border-radius: 50%;
  animation: rp-drift 18s ease-in-out infinite;
}
.rp-circle-1 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(82,196,26,0.08) 0%, transparent 70%);
  top: -120px; left: -80px;
}
.rp-circle-2 {
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(22,119,255,0.06) 0%, transparent 70%);
  bottom: -100px; right: -60px;
  animation-delay: -6s;
}
@keyframes rp-drift {
  0%, 100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(20px,-20px) scale(1.04); }
}

.rp-card {
  position: relative; z-index: 1;
  width: 420px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 2.2rem 2rem 1.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 8px 40px rgba(0,0,0,0.06);
  animation: rp-card-in 0.45s ease;
}
@keyframes rp-card-in {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.rp-back { position: absolute; top: 12px; left: 12px; color: #8c8c8c; }
.rp-back:hover { color: #1677ff; }

.rp-header { text-align: center; margin: 0.5rem 0 1.5rem; }
.rp-logo-wrap {
  width: 56px; height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #52c41a, #95de64);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.8rem;
  box-shadow: 0 4px 14px rgba(82,196,26,0.25);
  color: #fff; font-size: 1.5rem;
}
.rp-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.3rem; color: #141414; }
.rp-subtitle { margin: 0; font-size: 0.85rem; color: #8c8c8c; }

.rp-alert { margin-bottom: 1rem; }
.rp-form .ant-form-item { margin-bottom: 1rem; }
.rp-input :deep(.ant-input-prefix) { margin-right: 6px; }
.rp-input-icon { color: #bfbfbf; font-size: 0.95rem; }
.rp-btn {
  height: 44px; font-size: 1rem;
  border-radius: 10px; font-weight: 600; letter-spacing: 0.1em;
}

.rp-strength { margin-top: 6px; display: flex; align-items: center; gap: 8px; }
.rp-strength-bar {
  flex: 1; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;
}
.rp-strength-fill { height: 100%; transition: width 0.3s, background 0.3s; }
.rp-strength-text { font-size: 0.78rem; white-space: nowrap; }

.rp-result { text-align: center; padding: 0.5rem 0; }
.rp-result-icon { font-size: 2.6rem; color: #52c41a; margin-bottom: 0.6rem; }
.rp-result-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.5rem; color: #141414; }
.rp-result-text { font-size: 0.88rem; color: #595959; margin: 0.2rem 0 1.2rem; }
</style>
