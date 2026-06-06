<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getConfigsApi, updateConfigApi, createConfigApi, deleteConfigApi } from '@/api'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons-vue'
import { FIELD_DEFS } from './configFields'

interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  category?: string
  updatedAt: string
}

// ==================== Route ====================
const route = useRoute()
const filterCategory = computed(() => (route.meta.category as string) || '')
const filterConfigKey = computed(() => (route.meta.configKey as string) || '')
const sectionTitle = computed(() => (route.meta.title as string) || '配置')

// ==================== Data ====================
const data = ref<ConfigItem[]>([])
const loading = ref(false)

// ==================== Modal ====================
const modalVisible = ref(false)
const modalTitle = ref('')
const editingItem = ref<ConfigItem | null>(null)
const formKey = ref('')
const formValue = ref('')
const formCategory = ref('')
const submitting = ref(false)
const isEdit = computed(() => !!editingItem.value)

// ==================== Filtered ====================
const filtered = computed(() => {
  return data.value.filter((d) => {
    if (filterConfigKey.value) return d.configKey === filterConfigKey.value
    return (d.category || 'general') === filterCategory.value
  })
})

// ==================== API ====================
async function fetchData() {
  loading.value = true
  try {
    const res = await getConfigsApi()
    data.value = (res.data as { data: ConfigItem[] }).data || []
  } catch {
    message.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingItem.value = null
  modalTitle.value = '新增配置'
  formKey.value = ''
  formValue.value = ''
  formCategory.value = filterCategory.value || 'general'
  modalVisible.value = true
}

function openEdit(item: ConfigItem) {
  editingItem.value = item
  modalTitle.value = `编辑 ${FIELD_DEFS[item.configKey]?.label || item.configKey}`
  formKey.value = item.configKey
  formValue.value = item.configValue
  formCategory.value = item.category || ''
  modalVisible.value = true
}

async function handleSave() {
  if (!formKey.value.trim()) { message.warning('请输入配置键'); return }
  submitting.value = true
  try {
    if (isEdit.value && editingItem.value) {
      await updateConfigApi(editingItem.value.configKey, formValue.value, formCategory.value)
      message.success('更新成功')
    } else {
      await createConfigApi(formKey.value, formValue.value, formCategory.value)
      message.success('创建成功')
    }
    modalVisible.value = false
    await fetchData()
  } catch { message.error('操作失败') } finally { submitting.value = false }
}

async function handleDelete(key: string) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除配置项 "${key}" 吗？`,
    okText: '删除', okType: 'danger', cancelText: '取消',
    onOk: async () => {
      try { await deleteConfigApi(key); message.success('删除成功'); await fetchData() }
      catch { message.error('删除失败') }
    },
  })
}

function humanPreview(raw: string): string {
  if (!raw) return '（空）'
  try {
    const p = JSON.parse(raw)
    if (Array.isArray(p) && p.every((i: any) => typeof i === 'object')) {
      if (p[0]?.text !== undefined) return p.map((t: any) => `${t.done ? '✅' : '⭕'} ${t.text}`).join(' / ')
      if (p[0]?.name) return p.map((t: any) => t.name).join('、')
      if (p[0]?.text) return p.map((t: any) => t.text).join('、')
      if (p[0]?.url) return `${p.length} 个链接`
      return `${p.length} 项`
    }
    if (Array.isArray(p)) return p.join('、')
    return JSON.stringify(p)
  } catch {}
  return raw
}

// ==================== Relevant field suggestions ====================
const relevantFields = computed(() =>
  Object.entries(FIELD_DEFS).filter(([, def]) => {
    if (filterConfigKey.value) return def.configKey === filterConfigKey.value || def.section === filterCategory.value
    return def.section === filterCategory.value
  })
)

onMounted(fetchData)
</script>

<template>
  <div class="cp-root">
    <!-- Header -->
    <div class="cp-header">
      <div>
        <p class="cp-subtitle">{{ filtered.length ? `共 ${filtered.length} 项配置` : '暂无配置，点击右上角新增' }}</p>
      </div>
      <a-space>
        <a-button @click="fetchData" :loading="loading"><template #icon><ReloadOutlined /></template>刷新</a-button>
        <a-button type="primary" @click="openCreate"><template #icon><PlusOutlined /></template>新增</a-button>
      </a-space>
    </div>

    <!-- Cards -->
    <div v-if="filtered.length" class="cp-cards">
      <div v-for="item in filtered" :key="item.configKey" class="cp-card">
        <div class="cp-card-top">
          <div class="cp-card-label">
            <span class="cp-card-icon-text">{{ FIELD_DEFS[item.configKey]?.label || '?' }}</span>
            <div>
              <div class="cp-card-key">{{ item.configKey }}</div>
              <div class="cp-card-desc">{{ FIELD_DEFS[item.configKey]?.desc || '自定义配置' }}</div>
            </div>
          </div>
          <a-space size="small">
            <a-button size="small" @click="openEdit(item)"><template #icon><EditOutlined /></template></a-button>
            <a-button size="small" danger @click="handleDelete(item.configKey)"><template #icon><DeleteOutlined /></template></a-button>
          </a-space>
        </div>
        <div class="cp-card-value"><span class="cp-value-text">{{ humanPreview(item.configValue) }}</span></div>
        <div class="cp-card-meta">
          <span class="cp-card-time">{{ new Date(item.updatedAt).toLocaleString('zh-CN') }}</span>
          <span class="cp-card-loc"><EyeOutlined style="font-size:10px" /> {{ FIELD_DEFS[item.configKey]?.frontendLocation || '全局' }}</span>
        </div>
      </div>
    </div>

    <!-- Empty with suggestions -->
    <div v-else class="cp-empty">
      <div class="cp-empty-icon">📋</div>
      <p class="cp-empty-title">{{ sectionTitle }} 下暂无配置</p>
      <p class="cp-empty-desc">点击下方推荐项快速创建，或右上角自定义新增</p>
      <div class="cp-suggestions" v-if="relevantFields.length">
        <div
          v-for="[key, def] in relevantFields"
          :key="key"
          class="cp-suggest-card"
          @click="formKey = key; formValue = ''; formCategory = filterCategory; modalVisible = true; modalTitle = `新增 ${def.label}`"
        >
          <span class="cp-suggest-key">{{ key }}</span>
          <span class="cp-suggest-label">{{ def.label }}</span>
          <span class="cp-suggest-hint">{{ def.desc }}</span>
          <span class="cp-suggest-example">例：{{ def.example }}</span>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <a-modal :open="modalVisible" :title="modalTitle" :confirmLoading="submitting" width="580px" @ok="handleSave" @cancel="modalVisible = false">
      <a-form layout="vertical">
        <a-form-item label="配置键" required>
          <a-input v-model:value="formKey" :disabled="isEdit" placeholder="例：name、links、techs" />
        </a-form-item>
        <a-form-item label="配置值" required>
          <a-textarea v-model:value="formValue" :rows="8"
            :placeholder="'输入配置值。' + (FIELD_DEFS[formKey]?.jsonType ? 'JSON 格式，例：' + FIELD_DEFS[formKey]?.example : '例：' + (FIELD_DEFS[formKey]?.example || '...'))"
            class="cp-textarea" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.cp-root { max-width: 900px; }

.cp-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.2rem; }
.cp-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.2rem; color: var(--admin-text, #141414); }
.cp-subtitle { margin: 0; font-size: 0.82rem; color: var(--admin-text-secondary, #8c8c8c); }

.cp-cards { display: flex; flex-direction: column; gap: 12px; }

.cp-card {
  background: var(--admin-bg-card, #fff);
  border: 1px solid var(--admin-border, #f0f0f0);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  transition: all 0.22s ease;
}
.cp-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.06); transform: translateY(-2px); }

.cp-card-top { display: flex; align-items: flex-start; justify-content: space-between; }
.cp-card-label { display: flex; align-items: flex-start; gap: 0.6rem; }
.cp-card-icon-text {
  width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
  border-radius: 8px; background: #f0f5ff; color: #1677ff; font-size: 0.8rem; font-weight: 700; flex-shrink: 0;
}
.cp-card-key { font-weight: 600; font-size: 0.92rem; color: var(--admin-text, #262626); font-family: 'SF Mono', 'Fira Code', monospace; }
.cp-card-desc { font-size: 0.75rem; color: var(--admin-text-secondary, #8c8c8c); margin-top: 0.05rem; }

.cp-card-value { background: #fafafa; border-radius: 8px; padding: 0.5rem 0.7rem; min-height: 2.2rem; }
.cp-value-text { font-size: 0.83rem; color: #595959; word-break: break-all; line-height: 1.5; }

.cp-card-meta { display: flex; align-items: center; gap: 0.5rem; }
.cp-card-time { font-size: 0.72rem; color: #bfbfbf; flex: 1; text-align: right; }
.cp-card-loc { font-size: 0.7rem; color: #1677ff; display: flex; align-items: center; gap: 0.2rem; }

.cp-empty { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; text-align: center; }
.cp-empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.cp-empty-title { font-size: 1rem; font-weight: 600; margin: 0 0 0.3rem; color: var(--admin-text, #262626); }
.cp-empty-desc { font-size: 0.82rem; color: var(--admin-text-secondary, #8c8c8c); margin: 0 0 1rem; }

.cp-suggestions { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; width: 100%; max-width: 700px; }
.cp-suggest-card {
  display: flex; flex-direction: column; gap: 0.15rem; padding: 0.7rem 0.9rem;
  background: #fafafa; border: 1px dashed #d9d9d9; border-radius: 10px; cursor: pointer; transition: all 0.2s; text-align: left;
}
.cp-suggest-card:hover { border-color: #1677ff; border-style: solid; background: #f0f5ff; }
.cp-suggest-key { font-family: 'SF Mono', monospace; font-size: 0.78rem; color: #1677ff; font-weight: 600; }
.cp-suggest-label { font-size: 0.85rem; font-weight: 500; color: var(--admin-text, #262626); }
.cp-suggest-hint { font-size: 0.72rem; color: var(--admin-text-secondary, #8c8c8c); }
.cp-suggest-example { font-size: 0.7rem; color: #52c41a; font-family: 'SF Mono', monospace; }

.cp-textarea { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85rem; }
</style>
