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
    // Only show 'wrong credentials' if server actually responded (401)
    // Network errors are already handled by axios interceptor
    if (err?.response?.status === 401) {
      message.error('用户名或密码错误')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <a-card title="Dageling003-Homepage 管理后台" :style="{ width: '400px' }">
      <a-form layout="vertical">
        <a-form-item label="用户名">
          <a-input
            v-model:value="username"
            placeholder="请输入用户名"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码">
          <a-input-password
            v-model:value="password"
            placeholder="请输入密码"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" block :loading="loading" size="large" @click="handleLogin">
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>
