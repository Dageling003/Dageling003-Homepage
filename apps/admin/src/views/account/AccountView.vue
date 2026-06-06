<script setup lang="ts">
import { ref, reactive } from 'vue'
import { changePasswordApi } from '@/api'
import { message } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const loading = ref(false)

async function handleSave() {
  if (!formState.oldPassword || !formState.newPassword || !formState.confirmPassword) {
    message.warning('请填写完整信息')
    return
  }
  if (formState.newPassword !== formState.confirmPassword) {
    message.warning('两次输入的新密码不一致')
    return
  }
  if (formState.newPassword.length < 6) {
    message.warning('新密码长度至少 6 位')
    return
  }
  loading.value = true
  try {
    await changePasswordApi(formState.oldPassword, formState.newPassword)
    message.success('密码修改成功')
    formState.oldPassword = ''
    formState.newPassword = ''
    formState.confirmPassword = ''
  } catch (err: any) {
    const msg = err?.response?.data?.message || '密码修改失败'
    message.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <a-card title="修改密码" :style="{ maxWidth: '480px' }">
      <a-form layout="vertical" @finish="handleSave">
        <a-form-item label="旧密码" required>
          <a-input-password
            v-model:value="formState.oldPassword"
            placeholder="请输入旧密码"
            size="large"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="新密码" required>
          <a-input-password
            v-model:value="formState.newPassword"
            placeholder="请输入新密码（至少 6 位）"
            size="large"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="确认新密码" required>
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请再次输入新密码"
            size="large"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" size="large">
            保存修改
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>
