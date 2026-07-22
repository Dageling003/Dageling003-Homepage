<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { FormMode, ConfigFormData } from '../types'

const props = defineProps<{
  visible: boolean
  mode: FormMode
  editingKey: string
  initial: ConfigFormData
  categories: string[]
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [data: ConfigFormData]
}>()

const formKey = ref('')
const formValue = ref('')
const formCategory = ref('general')

watch(
  () => props.visible,
  (v) => {
    if (v) {
      formKey.value = props.initial.key
      formValue.value = props.initial.value
      formCategory.value = props.initial.category || 'general'
    }
  },
)

const isEdit = computed(() => props.mode === 'edit')

/** 检测值的类型 */
const valueHint = computed(() => {
  try {
    const parsed = JSON.parse(formValue.value)
    if (Array.isArray(parsed)) return Array.isArray(parsed[0]) ? '列表' : `${parsed.length} 项列表`
    if (typeof parsed === 'object') return '配置对象'
    return ''
  } catch {
    return ''
  }
})

function handleCancel() {
  emit('update:visible', false)
}

function handleOk() {
  if (!formKey.value.trim()) {
    message.warning('请输入配置键')
    return
  }
  emit('save', {
    key: formKey.value.trim(),
    value: formValue.value,
    category: formCategory.value || 'general',
  })
}
</script>

<template>
  <a-modal
    :open="visible"
    :title="isEdit ? '编辑配置' : '新增配置'"
    :confirm-loading="submitting"
    @ok="handleOk"
    @cancel="handleCancel"
    :destroy-on-close="true"
    width="480px"
  >
    <a-form layout="vertical" class="config-form">
      <a-form-item label="配置键" required>
        <a-input
          v-model:value="formKey"
          :disabled="isEdit"
          placeholder="例：name、links、todos"
        />
      </a-form-item>

      <a-form-item label="分类">
        <a-select
          v-model:value="formCategory"
          placeholder="选择分类"
          allow-clear
          show-search
        >
          <a-select-option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="'配置值' + (valueHint ? '（' + valueHint + '）' : '')" required>
        <a-textarea
          v-model:value="formValue"
          :rows="6"
          placeholder="输入内容"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
.config-form :deep(.ant-form-item) {
  margin-bottom: 14px;
}
</style>
