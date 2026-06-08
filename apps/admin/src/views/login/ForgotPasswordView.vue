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
.fp-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #f0f2f5;
}
.fp-bg { position: absolute; inset: 0; pointer-events: none; }
.fp-circle {
  position: absolute;
  border-radius: 50%;
  animation: fp-drift 18s ease-in-out infinite;
}
.fp-circle-1 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(22,119,255,0.08) 0%, transparent 70%);
  top: -120px; right: -80px;
}
.fp-circle-2 {
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(82,196,26,0.06) 0%, transparent 70%);
  bottom: -100px; left: -60px;
  animation-delay: -6s;
}
@keyframes fp-drift {
  0%, 100% { transform: translate(0,0) scale(1); }
  50% { transform: translate(20px, -20px) scale(1.04); }
}

.fp-card {
  position: relative;
  z-index: 1;
  width: 420px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 2.2rem 2rem 1.5rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03), 0 8px 40px rgba(0,0,0,0.06);
  animation: fp-card-in 0.45s ease;
}
@keyframes fp-card-in {
  from { opacity: 0; transform: translateY(20px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.fp-back { position: absolute; top: 12px; left: 12px; color: #8c8c8c; }
.fp-back:hover { color: #1677ff; }

.fp-header { text-align: center; margin: 0.5rem 0 1.5rem; }
.fp-logo-wrap {
  width: 56px; height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1677ff, #4096ff);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 0.8rem;
  box-shadow: 0 4px 14px rgba(22,119,255,0.25);
  color: #fff; font-size: 1.5rem;
}
.fp-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.3rem; color: #141414; }
.fp-subtitle { margin: 0; font-size: 0.85rem; color: #8c8c8c; }

.fp-form .ant-form-item { margin-bottom: 1rem; }
.fp-input :deep(.ant-input-prefix) { margin-right: 6px; }
.fp-input-icon { color: #bfbfbf; font-size: 0.95rem; }
.fp-btn {
  height: 44px; font-size: 1rem;
  border-radius: 10px; font-weight: 600; letter-spacing: 0.1em;
}

.fp-result { text-align: center; padding: 0.5rem 0; }
.fp-result-icon {
  font-size: 2.6rem;
  color: #52c41a;
  margin-bottom: 0.6rem;
}
.fp-result-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.5rem; color: #141414; }
.fp-result-text { font-size: 0.88rem; color: #595959; margin: 0.2rem 0; line-height: 1.6; }
.fp-alert { margin: 1rem 0; text-align: left; }
</style>
