<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getConfigsApi, updateConfigApi, createConfigApi,
} from '@/api'
import { message } from 'ant-design-vue'
import {
  RightOutlined, LeftOutlined, CheckOutlined, SmileOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const step = ref(0)
const saving = ref(false)
const done = ref(false)

// ==================== Data ====================
const form = ref<Record<string, string>>({})
const professionTags = ref<string[]>([])
const linkItems = ref<Array<{ text: string; url: string; color: string }>>([])
const techItems = ref<Array<{ name: string }>>([])
const typewriterItems = ref<string[]>([])
const todoItems = ref<Array<{ text: string; done: boolean }>>([])

// ==================== Age/Zodiac auto-calc ====================
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
  if (!birthStr || birthStr.split('-').length < 3) return null
  const [_, m, d] = birthStr.split('-').map(Number)
  if (isNaN(m) || isNaN(d)) return null
  const Z = [
    { n: '摩羯座', s: [1, 1], e: [1, 19] }, { n: '水瓶座', s: [1, 20], e: [2, 18] },
    { n: '双鱼座', s: [2, 19], e: [3, 20] }, { n: '白羊座', s: [3, 21], e: [4, 19] },
    { n: '金牛座', s: [4, 20], e: [5, 20] }, { n: '双子座', s: [5, 21], e: [6, 21] },
    { n: '巨蟹座', s: [6, 22], e: [7, 22] }, { n: '狮子座', s: [7, 23], e: [8, 22] },
    { n: '处女座', s: [8, 23], e: [9, 22] }, { n: '天秤座', s: [9, 23], e: [10, 23] },
    { n: '天蝎座', s: [10, 24], e: [11, 22] }, { n: '射手座', s: [11, 23], e: [12, 21] },
    { n: '摩羯座', s: [12, 22], e: [12, 31] },
  ]
  for (const z of Z) if ((m === z.s[0] && d >= z.s[1]) || (m === z.e[0] && d <= z.e[1])) return z.n
  return null
}
const previewAge = computed(() => calcAge(form.value['infoBirth'] || ''))
const previewZodiac = computed(() => calcZodiac(form.value['infoBirth'] || ''))

const STEPS = [
  { title: '欢迎', icon: '👋' },
  { title: '个人信息', icon: '👤' },
  { title: '快捷链接', icon: '🔗' },
  { title: '技术栈', icon: '🛠️' },
  { title: '打字机', icon: '📝' },
  { title: '待办事项', icon: '📋' },
  { title: '完成', icon: '🎉' },
]

const isFirst = computed(() => step.value === 0)
const isLast = computed(() => step.value === STEPS.length - 1)

async function loadExisting() {
  try {
    const res = await getConfigsApi()
    const all: Array<{ configKey: string; configValue: string; category?: string }> = (res.data as any)?.data || []
    const map: Record<string, string> = {}
    for (const c of all) map[c.configKey] = c.configValue

    // Load personal info
    const infoKeys = ['name', 'infoSex', 'infoProvince', 'infoSchool', 'avatarUrl', 'infoBirth', 'infoAgeDisplay']
    for (const k of infoKeys) {
      if (map[k]) form.value[k] = map[k]
    }
    // Load professions
    if (map.professions) {
      try { professionTags.value = JSON.parse(map.professions) } catch { professionTags.value = [] }
    }
    // Load links
    if (map.links) {
      try { linkItems.value = JSON.parse(map.links) } catch { linkItems.value = [] }
    }
    // Load techs
    if (map.techs) {
      try { techItems.value = JSON.parse(map.techs) } catch { techItems.value = [] }
    }
    // Load typewriter
    if (map.typewriterWords) {
      try { typewriterItems.value = JSON.parse(map.typewriterWords) } catch { typewriterItems.value = [] }
    }
    // Load todos
    if (map.todos) {
      try { todoItems.value = JSON.parse(map.todos) } catch { todoItems.value = [] }
    }
  } catch { /* use defaults */ }
}

onMounted(loadExisting)

async function saveConfig(key: string, value: string) {
  try {
    const res = await getConfigsApi()
    const all: Array<{ configKey: string; id: number }> = (res.data as any)?.data || []
    const existing = all.find(c => c.configKey === key)
    if (existing) {
      await updateConfigApi(key, value)
    } else {
      await createConfigApi(key, value)
    }
  } catch { /* ignore */ }
}

async function handleNext() {
  if (step.value === 0) { step.value++; return }

  saving.value = true
  try {
    switch (step.value) {
      case 1: // Personal info
        for (const [k, v] of Object.entries(form.value)) {
          if (v) await saveConfig(k, v)
        }
        if (professionTags.value.length) {
          await saveConfig('professions', JSON.stringify(professionTags.value))
        }
        break
      case 2: // Links
        await saveConfig('links', JSON.stringify(linkItems.value.filter(l => l.text && l.url)))
        break
      case 3: // Tech stack
        await saveConfig('techs', JSON.stringify(techItems.value.filter(t => t.name)))
        break
      case 4: // Typewriter
        await saveConfig('typewriterWords', JSON.stringify(typewriterItems.value.filter(t => t.trim())))
        break
      case 5: // Todos
        await saveConfig('todos', JSON.stringify(todoItems.value.filter(t => t.text.trim())))
        break
    }
    step.value++
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleFinish() {
  saving.value = true
  try {
    // Mark as initialized
    await saveConfig('_initialized', '1')
    done.value = true
    message.success('🎉 初始化完成！')
    setTimeout(() => router.push('/dashboard'), 1500)
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="sw-root">
    <!-- Progress -->
    <div class="sw-progress">
      <div
        v-for="(s, i) in STEPS"
        :key="i"
        class="sw-step"
        :class="{ active: i === step, done: i < step }"
      >
        <div class="sw-step-dot">
          <span v-if="i < step">✓</span>
          <span v-else>{{ s.icon }}</span>
        </div>
        <span class="sw-step-label">{{ s.title }}</span>
      </div>
    </div>

    <!-- Content -->
    <div class="sw-card">
      <!-- Step 0: Welcome -->
      <div v-if="step === 0" class="sw-step-content">
        <div class="sw-welcome">
          <div class="sw-welcome-icon">🚀</div>
          <h2>欢迎使用 homepage 管理系统</h2>
          <p>接下来几步将帮你完成初始设置，包括个人信息、快捷链接等。</p>
          <p class="sw-hint">完成后即可进入仪表盘开始管理</p>
        </div>
      </div>

      <!-- Step 1: Personal Info -->
      <div v-else-if="step === 1" class="sw-step-content">
        <h3 class="sw-section-title">👤 填写个人信息</h3>
        <div class="sw-form">
          <a-input v-model:value="form['name']" placeholder="昵称" size="middle" class="sw-input" />
          <a-input v-model:value="form['infoSex']" placeholder="性别（♂ 或 ♀）" size="middle" class="sw-input" />
          <div class="sw-form-full">
            <label class="sw-birth-label">出生日期（自动计算年龄和星座）</label>
            <div class="sw-birth-row">
              <input
                type="date"
                :value="form['infoBirth']"
                @input="form['infoBirth'] = ($event.target as HTMLInputElement).value"
                class="sw-date-input"
              />
              <div class="sw-birth-preview" v-if="form['infoBirth']">
                年龄：<b>{{ previewAge ?? '—' }}</b> · 星座：<b>{{ previewZodiac || '—' }}</b>
              </div>
            </div>
          </div>
          <a-input v-model:value="form['infoProvince']" placeholder="省份" size="middle" class="sw-input" />
          <a-input v-model:value="form['infoSchool']" placeholder="学校" size="middle" class="sw-input" />
          <a-select
            v-model:value="professionTags"
            mode="tags"
            placeholder="职业标签（回车添加）"
            size="middle"
            class="sw-input"
            :open="false"
          />
        </div>
      </div>

      <!-- Step 2: Links -->
      <div v-else-if="step === 2" class="sw-step-content">
        <h3 class="sw-section-title">🔗 添加快捷链接</h3>
        <div class="sw-list">
          <div v-for="(item, i) in linkItems" :key="i" class="sw-list-row">
            <a-input v-model:value="item.text" placeholder="名称" size="small" style="flex:1" />
            <a-input v-model:value="item.url" placeholder="URL" size="small" style="flex:2" />
            <a-button type="text" danger size="small" @click="linkItems.splice(i, 1)">✕</a-button>
          </div>
          <a-button type="dashed" size="small" block @click="linkItems.push({ text: '', url: '', color: '#333' })">
            + 添加链接
          </a-button>
        </div>
      </div>

      <!-- Step 3: Tech Stack -->
      <div v-else-if="step === 3" class="sw-step-content">
        <h3 class="sw-section-title">🛠️ 设置技术栈</h3>
        <div class="sw-grid-2">
          <div v-for="(item, i) in techItems" :key="i">
            <a-input v-model:value="item.name" placeholder="技术名称" size="small">
              <template #suffix>
                <a-button type="text" danger size="small" @click="techItems.splice(i, 1)" style="margin-right:-8px">✕</a-button>
              </template>
            </a-input>
          </div>
        </div>
        <a-button type="dashed" size="small" block class="sw-add-btn" @click="techItems.push({ name: '' })">
          + 添加技术
        </a-button>
      </div>

      <!-- Step 4: Typewriter -->
      <div v-else-if="step === 4" class="sw-step-content">
        <h3 class="sw-section-title">📝 设置打字机文字</h3>
        <div class="sw-list">
          <div v-for="(_, i) in typewriterItems" :key="i" class="sw-list-row">
            <span class="sw-idx">{{ i + 1 }}</span>
            <a-input v-model:value="typewriterItems[i]" placeholder="轮播文字" size="small" style="flex:1" />
            <a-button type="text" danger size="small" @click="typewriterItems.splice(i, 1)">✕</a-button>
          </div>
          <a-button type="dashed" size="small" block @click="typewriterItems.push('')">+ 添加文字</a-button>
        </div>
      </div>

      <!-- Step 5: Todos -->
      <div v-else-if="step === 5" class="sw-step-content">
        <h3 class="sw-section-title">📋 设置待办事项</h3>
        <div class="sw-list">
          <div v-for="(item, i) in todoItems" :key="i" class="sw-list-row">
            <a-checkbox v-model:checked="item.done" />
            <a-input v-model:value="item.text" placeholder="待办内容" size="small" style="flex:1" />
            <a-button type="text" danger size="small" @click="todoItems.splice(i, 1)">✕</a-button>
          </div>
          <a-button type="dashed" size="small" block @click="todoItems.push({ text: '', done: false })">+ 添加待办</a-button>
        </div>
      </div>

      <!-- Step 6: Done -->
      <div v-else-if="step === 6" class="sw-step-content">
        <div class="sw-welcome">
          <div class="sw-welcome-icon"><SmileOutlined /></div>
          <h2>🎉 一切就绪！</h2>
          <p>{{ done ? '正在跳转到仪表盘...' : '点击下方按钮完成设置' }}</p>
        </div>
      </div>

      <!-- Navigation -->
      <div class="sw-nav">
        <a-button v-if="!isFirst && !isLast" @click="step--" :disabled="saving">
          <template #icon><LeftOutlined /></template>上一步
        </a-button>
        <div class="sw-nav-right">
          <a-button v-if="!isLast && !isFirst" type="primary" :loading="saving" @click="handleNext">
            下一步<template #icon><RightOutlined /></template>
          </a-button>
          <a-button v-if="isLast" type="primary" :loading="saving" @click="handleFinish" size="large">
            <template #icon><CheckOutlined /></template>{{ done ? '已完成' : '完成设置' }}
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sw-root {
  max-width: 640px; margin: 0 auto; padding: 1rem 0;
}

/* ====== Progress ====== */
.sw-progress {
  display: flex; justify-content: space-between; margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}
.sw-step {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  flex: 1; position: relative;
}
.sw-step::after {
  content: ''; position: absolute; top: 16px; left: 50%; width: 100%;
  height: 2px; background: #f0f0f0; z-index: 0;
}
.sw-step:last-child::after { display: none; }
.sw-step.done::after { background: #1677ff; }
.sw-step-dot {
  width: 32px; height: 32px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 0.85rem;
  background: #f0f0f0; color: #bfbfbf; z-index: 1; transition: all 0.3s;
}
.sw-step.active .sw-step-dot { background: #1677ff; color: #fff; transform: scale(1.15); }
.sw-step.done .sw-step-dot { background: #52c41a; color: #fff; }
.sw-step-label { font-size: 0.72rem; color: #bfbfbf; white-space: nowrap; }
.sw-step.active .sw-step-label { color: #1677ff; font-weight: 600; }
.sw-step.done .sw-step-label { color: #52c41a; }

/* ====== Card ====== */
.sw-card {
  background: #fff; border: 1px solid #f0f0f0; border-radius: 16px;
  padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

/* ====== Welcome ====== */
.sw-welcome { text-align: center; padding: 2rem 1rem; }
.sw-welcome-icon { font-size: 3rem; margin-bottom: 0.5rem; }
.sw-welcome h2 { font-size: 1.3rem; margin: 0 0 0.5rem; color: #141414; }
.sw-welcome p { font-size: 0.9rem; color: #595959; margin: 0 0 0.3rem; }
.sw-hint { color: #bfbfbf !important; font-size: 0.8rem !important; }

/* ====== Form ====== */
.sw-step-content { min-height: 280px; }
.sw-section-title { font-size: 1rem; font-weight: 650; margin: 0 0 0.8rem; color: #262626; }
.sw-form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sw-form-full { grid-column: 1 / -1; }
.sw-input { width: 100%; }
.sw-birth-label { display: block; font-size: 0.82rem; color: #595959; margin-bottom: 4px; }
.sw-birth-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.sw-date-input {
  height: 32px; padding: 0 10px; border: 1px solid #d9d9d9; border-radius: 6px;
  font-size: 0.88rem; color: #262626; background: #fff; outline: none;
  transition: border-color 0.2s; font-family: inherit;
}
.sw-date-input:focus { border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.1); }
.sw-birth-preview { font-size: 0.82rem; color: #1677ff; background: #f0f5ff; padding: 4px 10px; border-radius: 6px; }
.sw-birth-preview b { font-weight: 700; }

.sw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }

/* ====== List ====== */
.sw-list { display: flex; flex-direction: column; gap: 8px; }
.sw-list-row { display: flex; align-items: center; gap: 6px; }
.sw-idx { width: 20px; text-align: center; font-size: 0.78rem; color: #bfbfbf; }
.sw-add-btn { margin-top: 8px; }

/* ====== Navigation ====== */
.sw-nav {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f0f0f0;
}
.sw-nav-right { margin-left: auto; display: flex; gap: 8px; }

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .sw-progress { overflow-x: auto; gap: 0; }
  .sw-step-label { font-size: 0.65rem; }
  .sw-form { grid-template-columns: 1fr; }
  .sw-grid-2 { grid-template-columns: 1fr; }
}
</style>
