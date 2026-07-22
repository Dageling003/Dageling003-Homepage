<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { changePasswordApi, getProfileApi, updateProfileApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import { LockOutlined, UserOutlined, SafetyOutlined, CloudUploadOutlined } from '@ant-design/icons-vue'

const authStore = useAuthStore()

const formState = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const loading = ref(false)
const avatarUploading = ref(false)
const profile = ref<{ username: string; role: string; avatarUrl?: string } | null>(null)
const avatarInput = ref('')

onMounted(async () => {
  try {
    const res = await getProfileApi()
    profile.value = (res.data as any)?.data || null
    avatarInput.value = profile.value?.avatarUrl || ''
  } catch {
    // Offline or not logged in
  }
})

async function handleAvatarUpload(file: File) {
  avatarUploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const token = localStorage.getItem('token') || ''
    const res = await fetch('/api/config/upload/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error('上传失败')
    const json = await res.json()
    avatarInput.value = json.data.url
    await updateProfileApi({ avatarUrl: json.data.url })
    authStore.avatarUrl = json.data.url
    if (profile.value) profile.value.avatarUrl = json.data.url
    message.success('头像已更新')
  } catch {
    message.error('头像上传失败')
  } finally {
    avatarUploading.value = false
  }
}

async function handleSaveAvatarUrl() {
  if (!avatarInput.value.trim()) return
  try {
    await updateProfileApi({ avatarUrl: avatarInput.value.trim() })
    authStore.avatarUrl = avatarInput.value.trim()
    if (profile.value) profile.value.avatarUrl = avatarInput.value.trim()
    message.success('头像已更新')
  } catch {
    message.error('保存失败')
  }
}

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
  <div class="ac-wrap">
    <!-- Profile Info Card -->
    <a-card class="ac-card" v-if="profile">
      <template #title>
        <span class="ac-section-title"><UserOutlined /> 账号信息</span>
      </template>
      <div class="ac-profile">
        <a-avatar :size="72" class="ac-avatar">
          <template v-if="profile.avatarUrl">
            <img :src="profile.avatarUrl" :alt="`${profile.username}的头像`" />
          </template>
          <template v-else>
            {{ profile.username.charAt(0).toUpperCase() }}
          </template>
        </a-avatar>
        <div class="ac-profile-info">
          <div class="ac-profile-name">{{ profile.username }}</div>
          <div class="ac-profile-meta">
            <a-tag color="blue" v-if="profile.role === 'admin'">管理员</a-tag>
            <a-tag v-else>{{ profile.role }}</a-tag>
          </div>
        </div>
      </div>
      <!-- Avatar URL / Upload -->
      <a-divider style="margin: 12px 0" />
      <div class="ac-avatar-set">
        <a-input v-model:value="avatarInput" placeholder="头像 URL" size="middle">
          <template #addonAfter>
            <a-button type="link" size="small" @click="handleSaveAvatarUrl" :disabled="!avatarInput.trim()">应用</a-button>
          </template>
        </a-input>
        <a-upload
          :before-upload="(file: File) => { handleAvatarUpload(file); return false }"
          :show-upload-list="false"
          accept="image/jpeg,image/png,image/gif,image/webp"
        >
          <a-button size="middle" :loading="avatarUploading">
            <template #icon><CloudUploadOutlined /></template>本地上传
          </a-button>
        </a-upload>
      </div>
    </a-card>

    <!-- Change Password Card -->
    <a-card class="ac-card">
      <template #title>
        <span class="ac-section-title"><LockOutlined /> 修改密码</span>
      </template>
      <a-form layout="vertical" @finish="handleSave" :style="{ maxWidth: '420px' }">
        <a-form-item label="旧密码" required>
          <a-input-password v-model:value="formState.oldPassword" placeholder="请输入旧密码" size="large">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model:value="formState.newPassword" placeholder="请输入新密码（至少 6 位）" size="large">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item label="确认新密码" required>
          <a-input-password v-model:value="formState.confirmPassword" placeholder="请再次输入新密码" size="large">
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" size="large">
            <template #icon><SafetyOutlined /></template>保存修改
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<style scoped>
.ac-wrap {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 auto;
}

.ac-section-title {
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--admin-text);
  letter-spacing: -0.01em;
}

.ac-profile {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.ac-avatar {
  background: linear-gradient(135deg,
    var(--admin-primary),
    color-mix(in srgb, var(--admin-primary) 65%, #fff 25%)) !important;
  color: #fff !important;
  font-size: 1.7rem !important;
  font-weight: 600 !important;
  flex-shrink: 0;
  box-shadow:
    0 6px 20px rgba(var(--admin-primary-rgb), 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  letter-spacing: -0.02em;
}

.ac-profile-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.ac-profile-name {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--admin-text);
  letter-spacing: -0.015em;
}

.ac-profile-meta {
  display: flex;
  gap: 0.35rem;
}

.ac-avatar-set {
  display: flex;
  gap: 10px;
  align-items: center;
}
.ac-avatar-set :deep(.ant-input-group-wrapper) { flex: 1; }
</style>
