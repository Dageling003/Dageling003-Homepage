<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { forgotPasswordApi } from '@/api'
import { message } from 'ant-design-vue'
import { UserOutlined, ArrowLeftOutlined, MailOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const username = ref('')
const loading = ref(false)
const submitted = ref(false)
const smtpEnabled = ref<boolean | null>(null)
const devHint = ref<string>('')

async function handleSubmit() {
  if (!username.value) {
    message.warning('请输入用户名')
    return
  }
  loading.value = true
  try {
    const res = await forgotPasswordApi(username.value)
    const data: any = res.data
    smtpEnabled.value = data?.smtpEnabled ?? null
    devHint.value = data?.devHint || ''
    submitted.value = true
    message.success(data?.message || '如果该用户存在，重置链接已发送')
  } catch (err: any) {
    message.error(err?.response?.data?.message || '请求失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="fp-root">
    <div class="fp-bg">
      <div class="fp-circle fp-circle-1" />
      <div class="fp-circle fp-circle-2" />
    </div>

    <div class="fp-card">
      <a-button class="fp-back" type="text" size="small" @click="goLogin">
        <template #icon><ArrowLeftOutlined /></template>返回登录
      </a-button>

      <div class="fp-header">
        <div class="fp-logo-wrap">
          <span class="fp-logo-icon"><MailOutlined /></span>
        </div>
        <h2 class="fp-title">找回密码</h2>
        <p class="fp-subtitle">输入你的用户名，我们会发送重置链接到绑定邮箱</p>
      </div>

      <a-form
        v-if="!submitted"
        layout="vertical"
        @finish="handleSubmit"
        class="fp-form"
      >
        <a-form-item label="用户名" required>
          <a-input
            v-model:value="username"
            placeholder="请输入用户名"
            size="large"
            :allow-clear="true"
            class="fp-input"
          >
            <template #prefix><UserOutlined class="fp-input-icon" /></template>
          </a-input>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" block :loading="loading" size="large" html-type="submit" class="fp-btn">
            发送重置链接
          </a-button>
        </a-form-item>
      </a-form>

      <div v-else class="fp-result">
        <div class="fp-result-icon">
          <MailOutlined />
        </div>
        <h3 class="fp-result-title">请求已提交</h3>
        <p class="fp-result-text">
          如果用户 <b>{{ username }}</b> 存在，重置链接已经发出。
        </p>
        <p class="fp-result-text">请检查注册邮箱（包括垃圾邮件夹），链接 <b>1 小时内有效</b>。</p>

        <a-alert
          v-if="smtpEnabled === false"
          type="warning"
          show-icon
          class="fp-alert"
          message="未配置 SMTP"
          description="重置链接已写入服务器日志，请联系运维或执行 `docker logs homepage-app` 查找链接。"
        />

        <a-button type="primary" block size="large" class="fp-btn" @click="goLogin">
          返回登录
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   ForgotPassword — Apple glass card on aurora backdrop
   ============================================================ */
.fp-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--admin-bg);
  padding: 1rem;
}

.fp-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }

.fp-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  animation: fp-drift 34s ease-in-out infinite alternate;
  opacity: 0.55;
}

.fp-circle-1 {
  width: 40vmax; height: 40vmax;
  background: var(--admin-orb-2);
  top: -14vmax; right: -10vmax;
}
.fp-circle-2 {
  width: 34vmax; height: 34vmax;
  background: var(--admin-orb-3);
  bottom: -12vmax; left: -8vmax;
  animation-delay: -12s;
}

[theme='dark'] .fp-circle { opacity: 0.35; }

@keyframes fp-drift {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to   { transform: translate3d(-3vmax, 3vmax, 0) scale(1.08); }
}

.fp-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: var(--admin-material-thick);
  backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur-strong)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-xl);
  padding: 2.4rem 2.2rem 1.6rem;
  box-shadow: var(--admin-shadow-3);
  animation: fp-card-in 620ms var(--admin-ease-out) both;
  isolation: isolate;
}

.fp-card::before {
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

[theme='dark'] .fp-card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent);
}

@keyframes fp-card-in {
  from { opacity: 0; transform: translate3d(0, 16px, 0) scale(0.97); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

.fp-back {
  position: absolute;
  top: 14px;
  left: 14px;
  color: var(--admin-text-secondary) !important;
  padding: 0 8px !important;
  height: 30px !important;
  border-radius: 999px !important;
}
.fp-back:hover { color: var(--admin-primary) !important; background: var(--admin-primary-softer) !important; }

.fp-header { text-align: center; margin: 0.5rem 0 1.8rem; }
.fp-logo-wrap {
  width: 64px; height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg,
    var(--admin-primary),
    color-mix(in srgb, var(--admin-primary) 60%, #fff 25%));
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 1rem;
  box-shadow:
    0 8px 24px rgba(var(--admin-primary-rgb), 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  color: #fff; font-size: 1.5rem;
}
.fp-title {
  font-size: 1.55rem;
  font-weight: 700;
  margin: 0 0 0.35rem;
  color: var(--admin-text);
  letter-spacing: -0.022em;
}
.fp-subtitle { margin: 0; font-size: 0.9rem; color: var(--admin-text-secondary); }

.fp-form :deep(.ant-form-item) { margin-bottom: 1rem; }
.fp-input :deep(.ant-input-prefix) { margin-right: 8px; }
.fp-input-icon { color: var(--admin-text-tertiary); font-size: 0.95rem; }
.fp-btn {
  height: 46px; font-size: 1rem;
  border-radius: var(--admin-radius-md) !important;
  font-weight: 600; letter-spacing: 0.02em;
}

.fp-result { text-align: center; padding: 0.5rem 0; }
.fp-result-icon {
  font-size: 2.8rem;
  color: var(--admin-success);
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 4px 12px rgba(52, 199, 89, 0.35));
}
.fp-result-title {
  font-size: 1.15rem; font-weight: 600; margin: 0 0 0.6rem;
  color: var(--admin-text); letter-spacing: -0.015em;
}
.fp-result-text {
  font-size: 0.9rem; color: var(--admin-text-secondary);
  margin: 0.25rem 0; line-height: 1.6;
}
.fp-alert { margin: 1rem 0; text-align: left; }
</style>
