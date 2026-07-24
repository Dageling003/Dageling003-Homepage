<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getConfigsApi, updateConfigApi, createConfigApi } from '@/api'
import { message } from 'ant-design-vue'
import {
  PlusOutlined, CloseOutlined, SaveOutlined,
  IdcardOutlined, LinkOutlined, CodeOutlined, CheckSquareOutlined,
  SettingOutlined, CloudUploadOutlined,
} from '@ant-design/icons-vue'
import { FIELD_DEFS } from './configFields'
import { SCHOOLS } from './data/schools'

interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  category?: string
  updatedAt: string
}

interface TodoItem { text: string; done: boolean }
interface LinkItem { text: string; url: string; color: string }
interface TechItem { name: string }

// ==================== Section Meta ====================
const SECTION_META: Record<string, { icon: any; color: string; desc: string }> = {
  info:   { icon: IdcardOutlined,     color: '#0a84ff', desc: '管理首页展示的个人身份信息' },
  links:  { icon: LinkOutlined,       color: '#34c759', desc: '管理主页底部的快捷社交链接' },
  techs:  { icon: CodeOutlined,       color: '#af52de', desc: '管理自我介绍区的技术栈图标' },
  todos:  { icon: CheckSquareOutlined,color: '#ff9500', desc: '管理待办清单与打字机轮播文字' },
}

// ==================== Route ====================
const route = useRoute()
const filterCategory = computed(() => (route.meta.category as string) || '')
const filterConfigKey = computed(() => (route.meta.configKey as string) || '')
const sectionTitle = computed(() => (route.meta.title as string) || '配置')
const sectionMeta = computed(() => SECTION_META[filterCategory.value] || { icon: SettingOutlined, color: '#8e8e93', desc: '' })

// ==================== Data ====================
const loading = ref(false)
const savingFields = ref<Record<string, boolean>>({})
const savedFields = ref<Record<string, string>>({})
const dirtyFields = ref<Record<string, boolean>>({})
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

// Raw configs from API keyed by configKey
const configMap = ref<Record<string, ConfigItem>>({})

// ==================== Form state ====================
// Simple text fields
const simpleFields = ref<Record<string, string>>({})

// Profession tags (stored as JSON, edited as tags)
const professionTags = ref<string[]>([])

// List fields
const todoItems = ref<TodoItem[]>([])
const typewriterItems = ref<string[]>([])
const linkItems = ref<LinkItem[]>([])
const techItems = ref<TechItem[]>([])

function clearSaveStatus(key: string) {
  setTimeout(() => {
    savedFields.value[key] = ''
  }, 2000)
}

async function autoSaveSimpleField(key: string) {
  if (!dirtyFields.value[key]) return
  const val = key === 'professions' ? JSON.stringify(professionTags.value) : simpleFields.value[key]
  savingFields.value[key] = true
  try {
    const existing = configMap.value[key]
    if (existing && existing.id) {
      await updateConfigApi(key, val, filterCategory.value)
    } else {
      try {
        await updateConfigApi(key, val, filterCategory.value)
      } catch {
        await createConfigApi(key, val, filterCategory.value)
      }
    }
    savedFields.value[key] = 'done'
    dirtyFields.value[key] = false
    if (configMap.value[key]) configMap.value[key].configValue = val
    clearSaveStatus(key)
  } catch {
    savedFields.value[key] = 'error'
    clearSaveStatus(key)
  } finally {
    savingFields.value[key] = false
  }
}

function debouncedSave(key: string, delay = 600) {
  dirtyFields.value[key] = true
  savedFields.value[key] = 'pending'
  if (debounceTimers[key]) clearTimeout(debounceTimers[key])
  debounceTimers[key] = setTimeout(() => autoSaveSimpleField(key), delay)
}

function immediateSave(key: string) {
  dirtyFields.value[key] = true
  if (debounceTimers[key]) clearTimeout(debounceTimers[key])
  autoSaveSimpleField(key)
}

// ==================== Avatar upload ====================
const avatarUploading = ref(false)
const avatarPreview = computed(() => simpleFields.value['avatarUrl'] || '')

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
    simpleFields.value['avatarUrl'] = json.data.url
    debouncedSave('avatarUrl', 200)
  } catch {
    message.error('头像上传失败')
  } finally {
    avatarUploading.value = false
  }
}

// ==================== Info field groups ====================
const INFO_GROUPS = [
  { label: '网站标题', keys: ['siteTitle'] },
  { label: '姓名', keys: ['name'] },
  { label: '性别', keys: ['infoSex', 'infoSexDisplay'] },
  { label: '年龄', keys: ['infoBirth', 'infoAgeDisplay'] },
  { label: '省份', keys: ['infoProvince'] },
  { label: '就读学校', keys: ['infoSchool'] },
  { label: '职业标签', keys: ['professions'] },
  { label: '头像', keys: ['avatarUrl'] },
  { label: '前台展示开关', keys: ['infoShowName', 'infoShowZodiac', 'infoShowBirth'] },
]

// Boolean (1/0) toggle keys
const TOGGLE_KEYS = new Set(['infoShowName', 'infoShowZodiac', 'infoShowAge', 'infoShowBirth'])

// School auto-complete options
const schoolOptions = computed(() => {
  const val = simpleFields.value['infoSchool'] || ''
  if (!val) return SCHOOLS.slice(0, 80).map(s => ({ value: s }))
  return SCHOOLS.filter(s => s.includes(val)).slice(0, 60).map(s => ({ value: s }))
})

// China 34 provincial-level administrative divisions
const PROVINCES = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区',
]

// ==================== Birth date auto-calc preview ====================
const ZODIAC_RANGES = [
  { name: '摩羯座', start: [1, 1],  end: [1, 19] },
  { name: '水瓶座', start: [1, 20], end: [2, 18] },
  { name: '双鱼座', start: [2, 19], end: [3, 20] },
  { name: '白羊座', start: [3, 21], end: [4, 19] },
  { name: '金牛座', start: [4, 20], end: [5, 20] },
  { name: '双子座', start: [5, 21], end: [6, 21] },
  { name: '巨蟹座', start: [6, 22], end: [7, 22] },
  { name: '狮子座', start: [7, 23], end: [8, 22] },
  { name: '处女座', start: [8, 23], end: [9, 22] },
  { name: '天秤座', start: [9, 23], end: [10, 23] },
  { name: '天蝎座', start: [10, 24], end: [11, 22] },
  { name: '射手座', start: [11, 23], end: [12, 21] },
  { name: '摩羯座', start: [12, 22], end: [12, 31] },
]

function calcAge(birthStr: string): number | null {
  if (!birthStr) return null
  const birth = new Date(birthStr)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function calcZodiac(birthStr: string): string | null {
  if (!birthStr) return null
  const parts = birthStr.split('-')
  if (parts.length < 3) return null
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  if (isNaN(month) || isNaN(day)) return null
  for (const z of ZODIAC_RANGES) {
    const [sm, sd] = z.start, [em, ed] = z.end
    if ((month === sm && day >= sd) || (month === em && day <= ed)) return z.name
  }
  return null
}

const previewAge = ref<number | null>(null)
const previewZodiac = ref<string | null>(null)

function updatePreview(birthStr: string) {
  previewAge.value = calcAge(birthStr)
  previewZodiac.value = calcZodiac(birthStr)
}

// Watch simpleFields['infoBirth'] and update preview
watch(() => simpleFields.value['infoBirth'], (val) => {
  updatePreview(val || '')
}, { immediate: true })

// ==================== Derived ====================
const knownKeys = computed(() => {
  return Object.entries(FIELD_DEFS)
    .filter(([, def]) => {
      if (filterConfigKey.value) return def.configKey === filterConfigKey.value
      return def.section === filterCategory.value
    })
    .map(([key]) => key)
})

const sectionMode = computed(() => {
  const cat = filterCategory.value
  if (filterConfigKey.value) {
    if (filterConfigKey.value === 'todos') return 'todos'
    if (filterConfigKey.value === 'typewriterWords') return 'typewriter'
  }
  if (cat === 'info') return 'simple'
  if (cat === 'links') return 'links'
  if (cat === 'techs') return 'techs'
  if (cat === 'todos') return 'todos'
  return 'simple'
})

// ==================== API ====================
async function fetchData() {
  loading.value = true
  try {
    const res = await getConfigsApi()
    const all: ConfigItem[] = (res.data as { data: ConfigItem[] }).data || []
    const map: Record<string, ConfigItem> = {}
    for (const item of all) {
      // Filter to current section
      if (filterConfigKey.value) {
        if (item.configKey === filterConfigKey.value) map[item.configKey] = item
      } else {
        if ((item.category || 'general') === filterCategory.value) map[item.configKey] = item
      }
    }
    configMap.value = map
    // Populate default keys that don't exist yet
    for (const key of knownKeys.value) {
      if (!map[key]) {
        map[key] = { id: 0, configKey: key, configValue: '', category: filterCategory.value, updatedAt: '' }
      }
    }
    parseToForm(map)
  } catch (e) {
    console.error('[ConfigView] fetchData failed:', e)
    message.error('获取配置失败')
  } finally {
    loading.value = false
  }
}

function parseToForm(map: Record<string, ConfigItem>) {
  const sf: Record<string, string> = {}
  for (const key of knownKeys.value) {
    const def = FIELD_DEFS[key]
    if (!def) continue
    // Simple text fields + json-array (professions)
    if (!def.jsonType || def.jsonType === 'json-array') {
      sf[key] = map[key]?.configValue || ''
    }
  }
  simpleFields.value = sf

  // Parse list types
  const todosKey = filterConfigKey.value === 'todos' ? 'todos' : null
  const twKey = filterConfigKey.value === 'typewriterWords' ? 'typewriterWords' : null
  const linksKey = filterCategory.value === 'links' ? 'links' : null
  const techsKey = filterCategory.value === 'techs' ? 'techs' : null

  if (todosKey) {
    try { todoItems.value = JSON.parse(map[todosKey]?.configValue || '[]') }
    catch (e) { console.error('[ConfigView] todos parse failed:', e); todoItems.value = [] }
    if (!todoItems.value.length) todoItems.value = [{ text: '', done: false }]
  }
  if (twKey) {
    try { typewriterItems.value = JSON.parse(map[twKey]?.configValue || '[]') }
    catch (e) { console.error('[ConfigView] typewriter parse failed:', e); typewriterItems.value = [] }
    if (!typewriterItems.value.length) typewriterItems.value = ['']
  }
  if (linksKey) {
    try { linkItems.value = JSON.parse(map[linksKey]?.configValue || '[]') }
    catch (e) { console.error('[ConfigView] links parse failed:', e); linkItems.value = [] }
    if (!linkItems.value.length) linkItems.value = [{ text: '', url: '', color: '#333' }]
  }
  if (techsKey) {
    try { techItems.value = JSON.parse(map[techsKey]?.configValue || '[]') }
    catch (e) { console.error('[ConfigView] techs parse failed:', e); techItems.value = [] }
    if (!techItems.value.length) techItems.value = [{ name: '' }]
  }

  // Parse profession tags
  if (filterCategory.value === 'info') {
    const pVal = map['professions']?.configValue || '[]'
    try { professionTags.value = JSON.parse(pVal) }
    catch (e) { console.error('[ConfigView] professions parse failed:', e); professionTags.value = [] }
  }
}

// ==================== Save ====================
async function saveList(key: string, data: any[]) {
  savingFields.value[key] = true
  try {
    const cleaned = data.filter((i: any) => {
      if (typeof i === 'string') return i.trim()
      if (i.text !== undefined) return i.text.trim()
      if (i.name !== undefined) return i.name.trim()
      return true
    })
    const val = JSON.stringify(cleaned)
    const existing = configMap.value[key]
    if (existing && existing.id) {
      await updateConfigApi(key, val, filterCategory.value)
    } else {
      try {
        await updateConfigApi(key, val, filterCategory.value)
      } catch {
        await createConfigApi(key, val, filterCategory.value)
      }
    }
    savedFields.value[key] = 'done'
    clearSaveStatus(key)
  } catch {
    savedFields.value[key] = 'error'
    clearSaveStatus(key)
  } finally { savingFields.value[key] = false }
}

// ==================== Helpers ====================
function fieldPlaceholder(key: string): string {
  return FIELD_DEFS[key]?.example || '请输入'
}

function fieldLabel(key: string): string {
  return FIELD_DEFS[key]?.label || key
}

function fieldDesc(key: string): string {
  return FIELD_DEFS[key]?.desc || ''
}

onMounted(fetchData)

// Re-fetch when route changes
watch(() => route.path, () => { fetchData() })
</script>

<template>
  <div class="cp-root">
    <!-- ====== HEADER ====== -->
    <div class="cp-header">
      <div class="cp-header-left">
        <div class="cp-header-icon" :style="{ background: sectionMeta.color + '18', color: sectionMeta.color }">
          <component :is="sectionMeta.icon" />
        </div>
        <div>
          <h2 class="cp-title">{{ sectionTitle }}</h2>
          <p class="cp-subtitle">{{ sectionMeta.desc }}</p>
        </div>
      </div>
    </div>

    <a-spin :spinning="loading" tip="加载中...">
      <!-- ================================================================= -->
      <!-- SIMPLE FORM MODE (个人信息) — grouped sections -->
      <!-- ================================================================= -->
      <template v-if="sectionMode === 'simple'">
        <div class="cp-form">
          <div v-for="group in INFO_GROUPS" :key="group.label" class="cp-group">
            <h3 class="cp-group-title">{{ group.label }}</h3>
            <div class="cp-group-grid">
              <div v-for="key in group.keys" :key="key" class="cp-field">
                <div class="cp-field-label">
                  <span class="cp-field-name">{{ fieldLabel(key) }}</span>
                  <code class="cp-field-key">{{ key }}</code>
                  <span
                    v-if="savingFields[key]"
                    class="cp-save-status cp-saving"
                  >保存中…</span>
                  <span
                    v-else-if="savedFields[key] === 'done'"
                    class="cp-save-status cp-saved"
                  >✓ 已保存</span>
                  <span
                    v-else-if="savedFields[key] === 'error'"
                    class="cp-save-status cp-error"
                  >✕ 失败</span>
                </div>
                <p class="cp-field-desc" v-if="fieldDesc(key)">{{ fieldDesc(key) }}</p>
                <div class="cp-field-row">
                  <!-- Gender: radio selector -->
                  <template v-if="key === 'infoSex'">
                    <a-radio-group
                      v-model:value="simpleFields[key]"
                      class="cp-field-input"
                      size="middle"
                      @change="immediateSave(key)"
                    >
                      <a-radio-button value="♂">♂ 男</a-radio-button>
                      <a-radio-button value="♀">♀ 女</a-radio-button>
                    </a-radio-group>
                  </template>
                  <!-- Gender display mode: radio selector -->
                  <template v-else-if="key === 'infoSexDisplay'">
                    <a-radio-group
                      v-model:value="simpleFields[key]"
                      class="cp-field-input"
                      size="middle"
                      @change="immediateSave(key)"
                    >
                      <a-radio-button value="symbol">仅符号 ♂</a-radio-button>
                      <a-radio-button value="text">仅文字 男</a-radio-button>
                      <a-radio-button value="both">符号+文字 ♂ 男</a-radio-button>
                    </a-radio-group>
                  </template>
                  <!-- Age display mode: radio selector -->
                  <template v-else-if="key === 'infoAgeDisplay'">
                    <a-radio-group
                      v-model:value="simpleFields[key]"
                      class="cp-age-group"
                      @change="immediateSave(key)"
                    >
                      <a-radio value="all">自我介绍+标签栏</a-radio>
                      <a-radio value="intro">仅自我介绍</a-radio>
                      <a-radio value="tag">仅标签栏</a-radio>
                      <a-radio value="hide">隐藏</a-radio>
                    </a-radio-group>
                  </template>
                  <!-- Birth date: picker with auto-calc preview -->
                  <template v-else-if="key === 'infoBirth'">
                    <div class="cp-date-wrap">
                      <div class="cp-date-input-row">
                        <span class="cp-date-icon">📅</span>
                        <input
                          type="date"
                          :value="simpleFields[key]"
                          @input="simpleFields[key] = ($event.target as HTMLInputElement).value; debouncedSave(key, 400)"
                          class="cp-date-input"
                        />
                      </div>
                      <!-- Live preview -->
                      <div class="cp-date-preview" v-if="simpleFields[key]">
                        <span class="cp-preview-age">
                          年龄：<b>{{ previewAge !== null ? previewAge + ' 岁' : '—' }}</b>
                        </span>
                        <span class="cp-preview-dot" />
                        <span class="cp-preview-zodiac">
                          星座：<b>{{ previewZodiac || '—' }}</b>
                        </span>
                      </div>
                      <div class="cp-date-hint" v-else>
                        <span>选择出生日期后自动计算年龄和星座</span>
                      </div>
                    </div>
                  </template>
                  <!-- Province selector -->
                  <template v-else-if="key === 'infoProvince'">
                    <a-select
                      v-model:value="simpleFields[key]"
                      placeholder="选择省份"
                      size="middle"
                      class="cp-field-input"
                      show-search
                      allow-clear
                      :filter-option="(input: string, option: any) => (option?.label as string || '').includes(input)"
                      @change="immediateSave(key)"
                    >
                      <a-select-option v-for="p in PROVINCES" :key="p" :value="p" :label="p">{{ p }}</a-select-option>
                    </a-select>
                  </template>
                  <!-- School auto-complete -->
                  <template v-else-if="key === 'infoSchool'">
                    <a-auto-complete
                      v-model:value="simpleFields[key]"
                      :options="schoolOptions"
                      placeholder="输入学校名称搜索（支持自定义输入）"
                      size="middle"
                      class="cp-field-input"
                      allow-clear
                      @change="debouncedSave(key)"
                      @blur="debouncedSave(key, 300)"
                    />
                  </template>
                  <!-- Avatar: upload + URL -->
                  <template v-else-if="key === 'avatarUrl'">
                    <div class="cp-avatar-inputs">
                      <div class="cp-avatar-preview" v-if="avatarPreview">
                        <img
                          :src="avatarPreview"
                          alt="头像预览"
                          @error="($event.target as HTMLImageElement).src = '/default-avatar.svg'"
                        />
                      </div>
                      <a-input
                        v-model:value="simpleFields[key]"
                        placeholder="输入头像 URL"
                        size="middle"
                        class="cp-field-input"
                        allow-clear
                        @blur="debouncedSave(key, 300)"
                      />
                      <a-upload
                        :before-upload="(file: File) => { handleAvatarUpload(file); return false }"
                        :show-upload-list="false"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                      >
                        <a-button size="middle" :loading="avatarUploading">
                          <template #icon><CloudUploadOutlined /></template>上传
                        </a-button>
                      </a-upload>
                    </div>
                  </template>
                  <!-- Professions: tag input -->
                  <template v-else-if="key === 'professions'">
                    <a-select
                      v-model:value="professionTags"
                      mode="tags"
                      placeholder="输入职业标签，按回车添加"
                      size="middle"
                      class="cp-field-input"
                      :open="false"
                      @change="debouncedSave(key, 400)"
                    />
                  </template>
                  <!-- Boolean toggle switch -->
                  <template v-else-if="TOGGLE_KEYS.has(key)">
                    <a-switch
                      :checked="simpleFields[key] === '1'"
                      checked-children="显示"
                      un-checked-children="隐藏"
                      size="middle"
                      @change="(v: boolean) => { simpleFields[key] = v ? '1' : '0'; immediateSave(key) }"
                    />
                  </template>
                  <!-- Default text input -->
                  <template v-else>
                    <a-input
                      v-model:value="simpleFields[key]"
                      :placeholder="fieldPlaceholder(key)"
                      size="middle"
                      class="cp-field-input"
                      allow-clear
                      @input="debouncedSave(key)"
                      @blur="debouncedSave(key, 200)"
                    />
                  </template>
                </div>
                <!-- Province preview (outside flex row) -->
                <div class="cp-prov-preview" v-if="key === 'infoProvince' && simpleFields['infoProvince']">
                  <span class="cp-prov-preview-label">前台展示：</span>
                  <span class="cp-prov-tag">{{ simpleFields['infoProvince'] }}</span>
                </div>
                <!-- School preview -->
                <div class="cp-prov-preview" v-if="key === 'infoSchool' && simpleFields['infoSchool']">
                  <span class="cp-prov-preview-label">前台展示：</span>
                  <span class="cp-prov-tag">{{ simpleFields['infoSchool'] }}</span>
                </div>
                <!-- Age display preview (outside flex row to avoid shrinking) -->
                <div class="cp-age-preview" v-if="key === 'infoAgeDisplay'">
                  <template v-if="simpleFields['infoAgeDisplay'] === 'all'">
                    <span class="cp-age-preview-label">自我介绍：</span>我叫 xx（<b>{{ previewZodiac || '双子座' }}</b>）<b>，{{ previewAge || '24' }}岁</b>
                    <span class="cp-age-preview-sep">|</span>
                    <span class="cp-age-preview-label">标签栏：</span><b>{{ previewAge || '24' }}岁</b>
                  </template>
                  <template v-else-if="simpleFields['infoAgeDisplay'] === 'intro'">
                    <span class="cp-age-preview-label">自我介绍：</span>我叫 xx（<b>{{ previewZodiac || '双子座' }}</b>）<b>，{{ previewAge || '24' }}岁</b>
                  </template>
                  <template v-else-if="simpleFields['infoAgeDisplay'] === 'tag'">
                    <span class="cp-age-preview-label">标签栏：</span><b>{{ previewAge || '24' }}岁</b>
                  </template>
                  <template v-else>
                    <span class="cp-age-hidden">年龄不在前台展示</span>
                  </template>
                </div>
                <p class="cp-field-updated">
                  上次更新：{{ configMap[key]?.updatedAt ? new Date(configMap[key].updatedAt).toLocaleString('zh-CN') : '尚未保存' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="sectionMode === 'todos'">
        <div class="cp-form">
          <div class="cp-field">
            <div class="cp-field-label">
              <span class="cp-field-name">{{ fieldLabel('todos') }}</span>
              <code class="cp-field-key">todos</code>
            </div>
            <p class="cp-field-desc">{{ fieldDesc('todos') }}</p>
            <div class="le-list">
              <div v-for="(item, i) in todoItems" :key="`todo-${i}-${item.text}`" class="le-row">
                <a-checkbox v-model:checked="item.done" class="le-cb" />
                <a-input v-model:value="item.text" placeholder="待办内容" class="le-input" size="middle" />
                <a-button type="text" danger size="small" @click="todoItems.splice(i, 1)" :disabled="todoItems.length <= 1">
                  <template #icon><CloseOutlined /></template>
                </a-button>
              </div>
              <div class="le-actions">
                <a-button type="dashed" size="small" @click="todoItems.push({ text: '', done: false })">
                  <template #icon><PlusOutlined /></template>添加待办
                </a-button>
                <a-button type="primary" size="middle" :loading="savingFields['todos']" @click="saveList('todos', todoItems)">
                  <template #icon><SaveOutlined /></template>保存全部
                </a-button>
                <span v-if="savedFields['todos'] === 'done'" class="cp-save-indicator">✓ 已保存</span>
                <span v-else-if="savedFields['todos'] === 'error'" class="cp-save-indicator cp-error">保存失败</span>
              </div>
            </div>
            <p class="cp-field-updated" v-if="configMap['todos']?.updatedAt">
              上次更新：{{ new Date(configMap['todos'].updatedAt).toLocaleString('zh-CN') }}
            </p>
          </div>
        </div>
      </template>

      <!-- ================================================================= -->
      <!-- TYPEWRITER FORM MODE -->
      <!-- ================================================================= -->
      <template v-else-if="sectionMode === 'typewriter'">
        <div class="cp-form">
          <div class="cp-field">
            <div class="cp-field-label">
              <span class="cp-field-name">{{ fieldLabel('typewriterWords') }}</span>
              <code class="cp-field-key">typewriterWords</code>
            </div>
            <p class="cp-field-desc">{{ fieldDesc('typewriterWords') }}</p>
            <div class="le-list">
              <div v-for="(item, i) in typewriterItems" :key="`tw-${i}-${item}`" class="le-row">
                <span class="le-idx">{{ i + 1 }}</span>
                <a-input v-model:value="typewriterItems[i]" placeholder="轮播文字" class="le-input" size="middle" />
                <a-button type="text" danger size="small" @click="typewriterItems.splice(i, 1)" :disabled="typewriterItems.length <= 1">
                  <template #icon><CloseOutlined /></template>
                </a-button>
              </div>
              <div class="le-actions">
                <a-button type="dashed" size="small" @click="typewriterItems.push('')">
                  <template #icon><PlusOutlined /></template>添加文字
                </a-button>
                <a-button type="primary" size="middle" :loading="savingFields['typewriterWords']" @click="saveList('typewriterWords', typewriterItems)">
                  <template #icon><SaveOutlined /></template>保存全部
                </a-button>
                <span v-if="savedFields['typewriterWords'] === 'done'" class="cp-save-indicator">✓ 已保存</span>
              </div>
            </div>
            <p class="cp-field-updated" v-if="configMap['typewriterWords']?.updatedAt">
              上次更新：{{ new Date(configMap['typewriterWords'].updatedAt).toLocaleString('zh-CN') }}
            </p>
          </div>
        </div>
      </template>

      <!-- ================================================================= -->
      <!-- LINKS FORM MODE -->
      <!-- ================================================================= -->
      <template v-else-if="sectionMode === 'links'">
        <div class="cp-form">
          <div class="cp-field">
            <div class="cp-field-label">
              <span class="cp-field-name">{{ fieldLabel('links') }}</span>
              <code class="cp-field-key">links</code>
            </div>
            <p class="cp-field-desc">{{ fieldDesc('links') }}</p>
            <div class="le-list">
              <div v-for="(item, i) in linkItems" :key="`link-${i}-${item.url}`" class="le-row le-row-link">
                <span class="le-idx">{{ i + 1 }}</span>
                <a-input v-model:value="item.text" placeholder="名称" size="middle" style="flex:1.2" />
                <a-input v-model:value="item.url" placeholder="URL" size="middle" style="flex:2.5" />
                <div class="le-color-pick">
                  <div class="le-color-swatch" :style="{ background: item.color || '#333' }" />
                  <a-input v-model:value="item.color" type="color" size="middle" class="le-color-input" />
                </div>
                <a-button type="text" danger size="small" @click="linkItems.splice(i, 1)" :disabled="linkItems.length <= 1">
                  <template #icon><CloseOutlined /></template>
                </a-button>
              </div>
              <div class="le-actions">
                <a-button type="dashed" size="small" @click="linkItems.push({ text: '', url: '', color: '#333' })">
                  <template #icon><PlusOutlined /></template>添加链接
                </a-button>
                <a-button type="primary" size="middle" :loading="savingFields['links']" @click="saveList('links', linkItems)">
                  <template #icon><SaveOutlined /></template>保存全部
                </a-button>
                <span v-if="savedFields['links'] === 'done'" class="cp-save-indicator">✓ 已保存</span>
              </div>
            </div>
            <p class="cp-field-updated" v-if="configMap['links']?.updatedAt">
              上次更新：{{ new Date(configMap['links'].updatedAt).toLocaleString('zh-CN') }}
            </p>
          </div>
        </div>
      </template>

      <!-- ================================================================= -->
      <!-- TECHS FORM MODE -->
      <!-- ================================================================= -->
      <template v-else-if="sectionMode === 'techs'">
        <div class="cp-form">
          <div class="cp-field">
            <div class="cp-field-label">
              <span class="cp-field-name">{{ fieldLabel('techs') }}</span>
              <code class="cp-field-key">techs</code>
            </div>
            <p class="cp-field-desc">{{ fieldDesc('techs') }}</p>
            <div class="le-list">
              <div class="le-row-techs">
                <div v-for="(item, i) in techItems" :key="`tech-${i}-${item.name}`" class="le-tech-item">
                  <a-input v-model:value="item.name" placeholder="技术名称" size="middle">
                    <template #suffix>
                      <a-button type="text" danger size="small" @click="techItems.splice(i, 1)" :disabled="techItems.length <= 1" style="margin-right:-8px">
                        <template #icon><CloseOutlined /></template>
                      </a-button>
                    </template>
                  </a-input>
                </div>
              </div>
              <div class="le-actions">
                <a-button type="dashed" size="small" @click="techItems.push({ name: '' })">
                  <template #icon><PlusOutlined /></template>添加技术
                </a-button>
                <a-button type="primary" size="middle" :loading="savingFields['techs']" @click="saveList('techs', techItems)">
                  <template #icon><SaveOutlined /></template>保存全部
                </a-button>
                <span v-if="savedFields['techs'] === 'done'" class="cp-save-indicator">✓ 已保存</span>
              </div>
            </div>
            <p class="cp-field-updated" v-if="configMap['techs']?.updatedAt">
              上次更新：{{ new Date(configMap['techs'].updatedAt).toLocaleString('zh-CN') }}
            </p>
          </div>
        </div>
      </template>
    </a-spin>
  </div>
</template>

<style scoped>
/* ============================================================
   ConfigView — Apple design: glass field cards, hairline dividers,
   pill province tags, colored accent tint on group titles.
   ============================================================ */

.cp-root { width: 100%; max-width: 1200px; }

/* ====== HEADER ====== */
.cp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.8rem;
  gap: 1rem;
}
.cp-header-left { display: flex; align-items: flex-start; gap: 0.9rem; }
.cp-header-icon {
  width: 48px; height: 48px;
  border-radius: var(--admin-radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
  box-shadow:
    0 4px 12px currentColor,
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}
.cp-title {
  font-size: 1.55rem;
  font-weight: 700;
  margin: 0 0 0.2rem;
  color: var(--admin-text);
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.cp-subtitle {
  margin: 0;
  font-size: 0.88rem;
  color: var(--admin-text-secondary);
  line-height: 1.5;
}

/* ====== FORM ====== */
.cp-form { display: flex; flex-direction: column; gap: 0; }

/* ====== GROUP ====== */
.cp-group { margin-bottom: 1.6rem; }

.cp-group-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--admin-text-secondary);
  margin: 0 0 0.75rem;
  padding-left: 0.7rem;
  border-left: 3px solid var(--admin-primary);
  line-height: 1.4;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.cp-group-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: stretch;
}

/* ====== FIELD — glass card ====== */
.cp-field {
  position: relative;
  background: var(--admin-material-regular);
  backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-md);
  padding: 1rem 1.15rem;
  box-shadow: var(--admin-shadow-1);
  transition:
    border-color var(--admin-duration-fast) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
}

.cp-field:hover {
  border-color: var(--admin-hairline-strong);
}

.cp-field-label { display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.25rem; flex-wrap: wrap; }
.cp-field-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--admin-text);
  letter-spacing: -0.008em;
}
.cp-field-key {
  font-size: 0.7rem;
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  color: var(--admin-text-tertiary);
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  padding: 1px 8px;
  border-radius: 999px;
  line-height: 1.5;
}
.cp-save-status {
  font-size: 0.72rem;
  font-weight: 500;
  padding: 1px 8px;
  border-radius: 999px;
  line-height: 1.5;
}
.cp-save-status.cp-saving {
  color: var(--admin-primary);
  background: var(--admin-primary-softer);
}
.cp-save-status.cp-saved {
  color: var(--admin-success);
  background: rgba(52, 199, 89, 0.12);
}
.cp-save-status.cp-error {
  color: var(--admin-error);
  background: rgba(255, 59, 48, 0.12);
}
.cp-save-indicator {
  font-size: 0.72rem;
  color: var(--admin-success);
  font-weight: 500;
}
.cp-save-indicator.cp-error {
  color: var(--admin-error);
}
.cp-field-desc {
  margin: 0 0 0.65rem;
  font-size: 0.8rem;
  color: var(--admin-text-secondary);
  line-height: 1.5;
}

.cp-field-row { display: flex; gap: 8px; align-items: center; }
.cp-field-input { flex: 1; }

/* ====== BIRTH DATE PICKER ====== */
.cp-date-wrap { flex: 1; display: flex; flex-direction: column; gap: 8px; }

.cp-date-input-row {
  display: flex; align-items: center; gap: 8px;
  height: 36px; padding: 0 11px;
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-sm);
  background: var(--admin-material-ultrathin);
  transition:
    border-color var(--admin-duration-fast) var(--admin-ease-out),
    box-shadow var(--admin-duration-fast) var(--admin-ease-out);
}
.cp-date-input-row:hover { border-color: var(--admin-hairline-strong); }
.cp-date-input-row:focus-within {
  border-color: var(--admin-primary);
  box-shadow: 0 0 0 3px var(--admin-primary-soft);
}

.cp-date-icon { font-size: 1rem; flex-shrink: 0; line-height: 1; color: var(--admin-text-secondary); }

.cp-date-input {
  flex: 1; height: 100%; border: none; outline: none;
  font-size: 0.88rem; color: var(--admin-text); background: transparent;
  font-family: inherit; cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.cp-date-input::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; padding: 2px; }
.cp-date-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }

.cp-date-preview {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 999px;
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  font-size: 0.82rem;
  color: var(--admin-text);
}
.cp-preview-age { color: var(--admin-primary); font-weight: 500; }
.cp-preview-zodiac { color: #af52de; font-weight: 500; }
.cp-preview-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--admin-hairline-strong); flex-shrink: 0;
}
.cp-date-preview b { font-weight: 700; }

.cp-date-hint { font-size: 0.78rem; color: var(--admin-text-tertiary); padding: 2px 0; }

/* ====== AGE DISPLAY ====== */
.cp-age-group {
  display: flex; flex-direction: column; gap: 6px; width: 100%;
}
.cp-age-group :deep(.ant-radio-wrapper) { margin: 0; font-size: 0.88rem; line-height: 1.6; }

.cp-age-preview {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: var(--admin-radius-sm);
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  font-size: 0.86rem;
  line-height: 1.5;
  color: var(--admin-text);
}
.cp-age-preview b { font-weight: 700; }
.cp-age-preview-label { color: var(--admin-text-tertiary); font-size: 0.75rem; }
.cp-age-preview-sep { color: var(--admin-hairline-strong); margin: 0 2px; }
.cp-age-hidden { color: var(--admin-text-tertiary); font-style: italic; }

/* ====== PROVINCE PREVIEW ====== */
.cp-prov-preview {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: var(--admin-radius-sm);
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  font-size: 0.86rem;
  line-height: 1.5;
  display: flex; align-items: center; gap: 8px;
}
.cp-prov-preview-label { color: var(--admin-text-tertiary); font-size: 0.75rem; flex-shrink: 0; }
.cp-prov-tag {
  display: inline-block;
  padding: 0.25rem 0.8rem;
  background: var(--admin-primary-softer);
  border: 1px solid color-mix(in srgb, var(--admin-primary) 22%, transparent);
  border-radius: 999px;
  font-size: 0.82rem;
  color: var(--admin-primary);
  font-weight: 500;
}

/* ====== AVATAR UPLOAD ====== */
.cp-avatar-inputs { flex: 1; display: flex; gap: 8px; align-items: center; }
.cp-avatar-preview {
  width: 40px; height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--admin-hairline);
  box-shadow: var(--admin-shadow-1);
}
.cp-avatar-preview img { width: 100%; height: 100%; object-fit: cover; }

.cp-field-updated {
  margin: 0.55rem 0 0;
  font-size: 0.7rem;
  color: var(--admin-text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ====== LIST EDITOR (shared) ====== */
.le-list { display: flex; flex-direction: column; gap: 10px; }

.le-row { display: flex; align-items: center; gap: 8px; }
.le-row-link { flex-wrap: nowrap; }

.le-cb { flex-shrink: 0; white-space: nowrap; }
.le-input { flex: 1; }
.le-idx {
  width: 26px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.78rem;
  color: var(--admin-text-tertiary);
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Consolas, monospace;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.le-actions {
  display: flex; gap: 12px; align-items: center; margin-top: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--admin-hairline);
}

/* Color picker */
.le-color-pick { position: relative; width: 40px; height: 36px; flex-shrink: 0; }
.le-color-swatch {
  width: 40px; height: 36px;
  border-radius: var(--admin-radius-sm);
  border: 1px solid var(--admin-hairline);
  box-shadow: var(--admin-shadow-1);
  pointer-events: none;
}
.le-color-input {
  position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 40px; padding: 0;
}

/* Tech grid */
.le-row-techs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

/* ====== RESPONSIVE ====== */
@media (max-width: 1024px) {
  .cp-group-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .cp-group-grid { grid-template-columns: 1fr; }
  .cp-field-row { flex-direction: column; align-items: stretch; }
  .cp-field-row :deep(.ant-btn) { width: 100%; }
  .le-row-link { flex-wrap: wrap; }
  .le-row-link > * { flex: auto !important; width: 100% !important; }
  .le-color-pick { width: 100%; }
  .le-row-techs { grid-template-columns: 1fr; }
}
</style>