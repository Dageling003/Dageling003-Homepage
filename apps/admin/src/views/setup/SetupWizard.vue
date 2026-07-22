<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getConfigsApi, updateConfigApi, createConfigApi,
  hasUsersApi, createFirstAdminApi, loginApi,
} from '@/api'
import { message } from 'ant-design-vue'
import {
  RightOutlined, LeftOutlined, CheckOutlined, SmileOutlined, UserAddOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()
const step = ref(0)
const saving = ref(false)
const done = ref(false)

// ==================== Data ====================
const form = ref<Record<string, string>>({})
const siteTitle = ref('')
const professionTags = ref<string[]>([])
const linkItems = ref<Array<{ text: string; url: string; color: string }>>([])
const techItems = ref<Array<{ name: string }>>([])
const typewriterItems = ref<string[]>([])
const todoItems = ref<Array<{ text: string; done: boolean }>>([])

// 首管账号（仅在 hasUsers=false 时启用）
const needsBootstrap = ref(false)
const setupTokenRequired = ref(false)
const setupToken = ref('')
const adminUsername = ref('admin')
const adminPassword = ref('')
const adminPasswordConfirm = ref('')
const creatingAdmin = ref(false)

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
  const [, m, d] = birthStr.split('-').map(Number)
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

const adminPwdStrength = computed(() => {
  const v = adminPassword.value
  if (!v) return 0
  let s = 0
  if (v.length >= 12) s++
  if (v.length >= 16) s++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++
  if (/\d/.test(v)) s++
  if (/[^A-Za-z0-9]/.test(v)) s++
  return Math.min(s, 4)
})
const adminPwdStrengthColor = computed(() => ['', '#ff3b30', '#ff9500', '#0a84ff', '#34c759'][adminPwdStrength.value])
const adminPwdStrengthLabel = computed(() => ['', '弱', '一般', '良好', '强'][adminPwdStrength.value])
const canCreateAdmin = computed(() =>
  adminUsername.value.length >= 2
  && adminPassword.value.length >= 12
  && adminPassword.value === adminPasswordConfirm.value
  && (!setupTokenRequired.value || setupToken.value.trim().length > 0),
)

// 动态步骤：启动态多一步「创建管理员」
const STEPS = computed(() => {
  const base = [
    { title: '欢迎', icon: '👋' },
    { title: '管理员', icon: '👑' },
    { title: '网站标题', icon: '🏷️' },
    { title: '个人信息', icon: '👤' },
    { title: '快捷链接', icon: '🔗' },
    { title: '技术栈', icon: '🛠️' },
    { title: '打字机', icon: '📝' },
    { title: '待办事项', icon: '📋' },
    { title: '完成', icon: '🎉' },
  ]
  if (!needsBootstrap.value) {
    return base.filter(s => s.title !== '管理员')
  }
  return base
})

const isFirst = computed(() => step.value === 0)
const isLast = computed(() => step.value === STEPS.value.length - 1)
const isAdminStep = computed(() => needsBootstrap.value && step.value === 1)

async function loadExisting() {
  try {
    const res = await getConfigsApi()
    const all: Array<{ configKey: string; configValue: string; category?: string }> = (res.data as any)?.data || []
    const map: Record<string, string> = {}
    for (const c of all) map[c.configKey] = c.configValue

    // Load site title
    if (map.siteTitle) siteTitle.value = map.siteTitle

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

async function loadBootstrapState() {
  try {
    const res = await hasUsersApi()
    const payload = (res.data as any)?.data
    needsBootstrap.value = !payload?.hasUsers
    setupTokenRequired.value = !!payload?.setupTokenRequired
  } catch {
    needsBootstrap.value = false
    setupTokenRequired.value = false
  }
}

onMounted(async () => {
  await loadBootstrapState()
  await loadExisting()
})

const CATEGORY_MAP: Record<string, string> = {
  siteTitle: 'info', name: 'info', infoSex: 'info', infoSexDisplay: 'info',
  infoBirth: 'info', infoProvince: 'info', infoSchool: 'info', avatarUrl: 'info',
  professions: 'info', infoShowName: 'info', infoShowZodiac: 'info',
  infoAgeDisplay: 'info', infoShowBirth: 'info',
  links: 'links', techs: 'techs', todos: 'todos', typewriterWords: 'todos',
  _initialized: 'system',
}

async function saveConfig(key: string, value: string) {
  const category = CATEGORY_MAP[key] || 'general'
  try {
    const res = await getConfigsApi()
    const all: Array<{ configKey: string; id: number }> = (res.data as any)?.data || []
    const existing = all.find(c => c.configKey === key)
    if (existing) {
      await updateConfigApi(key, value, category)
    } else {
      await createConfigApi(key, value, category)
    }
  } catch (e: any) {
    console.error(`[SetupWizard] saveConfig failed for ${key}:`, e)
    throw e
  }
}

async function createFirstAdmin() {
  if (!canCreateAdmin.value) {
    if (setupTokenRequired.value && !setupToken.value.trim()) {
      message.warning('请填写服务端 .env 中的 SETUP_TOKEN')
    } else {
      message.warning('请检查用户名（≥ 2 位）和密码（≥ 12 位且两次输入一致）')
    }
    return
  }
  creatingAdmin.value = true
  try {
    await createFirstAdminApi(
      adminUsername.value,
      adminPassword.value,
      setupTokenRequired.value ? setupToken.value.trim() : undefined,
    )
    const loginRes = await loginApi(adminUsername.value, adminPassword.value)
    localStorage.setItem('token', loginRes.data.accessToken)
    message.success('管理员账号已创建')
    adminPassword.value = ''
    adminPasswordConfirm.value = ''
    setupToken.value = ''
    step.value++
  } catch (err: any) {
    message.error(err?.response?.data?.message || '创建管理员失败')
  } finally {
    creatingAdmin.value = false
  }
}

async function handleNext() {
  if (step.value === 0) { step.value++; return }
  if (isAdminStep.value) { await createFirstAdmin(); return }

  saving.value = true
  try {
    // 步骤下标因 bootstrap 偏移 0/1，需按 STEPS 名称定位
    const currentTitle = STEPS.value[step.value]?.title
    switch (currentTitle) {
      case '网站标题':
        if (siteTitle.value.trim()) {
          await saveConfig('siteTitle', siteTitle.value.trim())
        }
        break
      case '个人信息': {
        for (const [k, v] of Object.entries(form.value)) {
          if (v) await saveConfig(k, v)
        }
        if (professionTags.value.length) {
          await saveConfig('professions', JSON.stringify(professionTags.value))
        }
        break
      }
      case '快捷链接':
        await saveConfig('links', JSON.stringify(linkItems.value.filter(l => l.text && l.url)))
        break
      case '技术栈':
        await saveConfig('techs', JSON.stringify(techItems.value.filter(t => t.name)))
        break
      case '打字机':
        await saveConfig('typewriterWords', JSON.stringify(typewriterItems.value.filter(t => t.trim())))
        break
      case '待办事项':
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
    message.success('🎉 初始化完成！请使用刚才设置的账号登录')
    setTimeout(() => router.push('/login'), 1500)
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
        :key="s.title"
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
          <p v-if="needsBootstrap">这是首次部署，下一步我们将一起创建管理员账号并完成初始设置。</p>
          <p v-else>接下来几步将帮你完善或修改站点信息。</p>
          <p class="sw-hint">每步点击「下一步」保存，末步点击「完成设置」</p>
        </div>
      </div>

      <!-- Step 1: Create first admin (only when bootstrap) -->
      <div v-else-if="isAdminStep" class="sw-step-content">
        <h3 class="sw-section-title">👑 创建管理员账号</h3>
        <p class="sw-section-desc">这是登录后台的唯一账号，请使用一个你能记住的强密码（≥ 12 位）。</p>
        <div class="sw-form">
          <a-form-item label="用户名" required class="sw-form-full">
            <a-input v-model:value="adminUsername" placeholder="admin" size="middle" />
          </a-form-item>
          <a-form-item label="密码" required class="sw-form-full">
            <a-input-password v-model:value="adminPassword" placeholder="至少 12 位" size="middle" />
            <div v-if="adminPassword" class="sw-strength">
              <div class="sw-strength-bar">
                <div class="sw-strength-fill" :style="{ width: `${(adminPwdStrength / 4) * 100}%`, background: adminPwdStrengthColor }" />
              </div>
              <span class="sw-strength-text" :style="{ color: adminPwdStrengthColor }">强度：{{ adminPwdStrengthLabel }}</span>
            </div>
          </a-form-item>
          <a-form-item label="确认密码" required class="sw-form-full">
            <a-input-password v-model:value="adminPasswordConfirm" placeholder="再输入一次" size="middle" />
          </a-form-item>
          <a-form-item v-if="setupTokenRequired" label="Setup Token" required class="sw-form-full">
            <a-input-password v-model:value="setupToken" placeholder="服务端 .env 中的 SETUP_TOKEN" size="middle" />
            <div class="sw-hint">服务器管理员在 <code>.env</code> 中配置了 <code>SETUP_TOKEN</code>，请向其索取该值。</div>
          </a-form-item>
        </div>
      </div>

      <!-- Step: Site Title -->
      <div v-else-if="STEPS[step]?.title === '网站标题'" class="sw-step-content">
        <h3 class="sw-section-title">🏷️ 设置网站标题</h3>
        <p class="sw-section-desc">浏览器标签页显示的标题，也是分享链接时的默认标题。</p>
        <div class="sw-form">
          <div class="sw-form-full">
            <a-input
              v-model:value="siteTitle"
              placeholder="例如：鹊楠的个人主页"
              size="middle"
              :maxlength="50"
              show-count
            />
            <div class="sw-title-preview" v-if="siteTitle">
              <span class="sw-title-preview-label">预览：</span>
              <span class="sw-title-preview-tab">🔒 {{ siteTitle }}</span>
            </div>
            <div class="sw-title-hint" v-else>留空则使用默认标题「个人主页」</div>
          </div>
        </div>
      </div>

      <!-- Step: Personal Info (index shifts depending on bootstrap) -->
      <div v-else-if="STEPS[step]?.title === '个人信息'" class="sw-step-content">
        <h3 class="sw-section-title">👤 填写个人信息</h3>
        <div class="sw-form">
          <a-input v-model:value="form['name']" placeholder="昵称" size="middle" class="sw-input" />
          <a-radio-group v-model:value="form['infoSex']" size="middle">
            <a-radio-button value="♂">♂ 男</a-radio-button>
            <a-radio-button value="♀">♀ 女</a-radio-button>
          </a-radio-group>
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

      <!-- Step: Links -->
      <div v-else-if="STEPS[step]?.title === '快捷链接'" class="sw-step-content">
        <h3 class="sw-section-title">🔗 添加快捷链接</h3>
        <div class="sw-list">
          <div v-for="(item, i) in linkItems" :key="`link-${i}-${item.url}`" class="sw-list-row">
            <a-input v-model:value="item.text" placeholder="名称" size="small" style="flex:1" />
            <a-input v-model:value="item.url" placeholder="URL" size="small" style="flex:2" />
            <a-button type="text" danger size="small" @click="linkItems.splice(i, 1)">✕</a-button>
          </div>
          <a-button type="dashed" size="small" block @click="linkItems.push({ text: '', url: '', color: '#333' })">
            + 添加链接
          </a-button>
        </div>
      </div>

      <!-- Step: Tech Stack -->
      <div v-else-if="STEPS[step]?.title === '技术栈'" class="sw-step-content">
        <h3 class="sw-section-title">🛠️ 设置技术栈</h3>
        <div class="sw-grid-2">
          <div v-for="(item, i) in techItems" :key="`tech-${i}-${item.name}`">
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

      <!-- Step: Typewriter -->
      <div v-else-if="STEPS[step]?.title === '打字机'" class="sw-step-content">
        <h3 class="sw-section-title">📝 设置打字机文字</h3>
        <div class="sw-list">
          <div v-for="(item, i) in typewriterItems" :key="`tw-${i}-${item}`" class="sw-list-row">
            <span class="sw-idx">{{ i + 1 }}</span>
            <a-input v-model:value="typewriterItems[i]" placeholder="轮播文字" size="small" style="flex:1" />
            <a-button type="text" danger size="small" @click="typewriterItems.splice(i, 1)">✕</a-button>
          </div>
          <a-button type="dashed" size="small" block @click="typewriterItems.push('')">+ 添加文字</a-button>
        </div>
      </div>

      <!-- Step: Todos -->
      <div v-else-if="STEPS[step]?.title === '待办事项'" class="sw-step-content">
        <h3 class="sw-section-title">📋 设置待办事项</h3>
        <div class="sw-list">
          <div v-for="(item, i) in todoItems" :key="`todo-${i}-${item.text}`" class="sw-list-row">
            <a-checkbox v-model:checked="item.done" />
            <a-input v-model:value="item.text" placeholder="待办内容" size="small" style="flex:1" />
            <a-button type="text" danger size="small" @click="todoItems.splice(i, 1)">✕</a-button>
          </div>
          <a-button type="dashed" size="small" block @click="todoItems.push({ text: '', done: false })">+ 添加待办</a-button>
        </div>
      </div>

      <!-- Last Step: Done -->
      <div v-else-if="isLast" class="sw-step-content">
        <div class="sw-welcome">
          <div class="sw-welcome-icon"><SmileOutlined /></div>
          <h2>🎉 一切就绪！</h2>
          <p>{{ done ? '正在跳转登录页...' : '点击下方按钮完成设置' }}</p>
          <p v-if="!done" class="sw-hint">完成后请用刚才设置的管理员账号登录</p>
        </div>
      </div>

      <!-- Navigation -->
      <div class="sw-nav">
        <a-button v-if="!isFirst && !isLast" @click="step--" :disabled="saving || creatingAdmin">
          <template #icon><LeftOutlined /></template>上一步
        </a-button>
        <div class="sw-nav-right">
          <a-button
            v-if="!isLast"
            type="primary"
            :loading="saving || creatingAdmin"
            :disabled="isAdminStep && !canCreateAdmin"
            @click="handleNext"
          >
            <template #icon><UserAddOutlined v-if="isAdminStep" /><RightOutlined v-else /></template>
            {{ isFirst ? '开始设置' : isAdminStep ? '创建并继续' : '下一步' }}
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
/* ============================================================
   SetupWizard — Apple glass card with critically-damped motion
   ============================================================ */
.sw-root {
  max-width: 720px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* ====== Progress ====== */
.sw-progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.8rem;
  padding: 0 0.5rem;
  overflow-x: auto;
}
.sw-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  position: relative;
  min-width: 62px;
}
.sw-step::after {
  content: '';
  position: absolute;
  top: 16px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--admin-hairline);
  z-index: 0;
  transition: background-color var(--admin-duration-medium) var(--admin-ease-out);
}
.sw-step:last-child::after { display: none; }
.sw-step.done::after { background: var(--admin-primary); }
.sw-step-dot {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  background: var(--admin-material-thin);
  color: var(--admin-text-tertiary);
  border: 1px solid var(--admin-hairline);
  z-index: 1;
  transition:
    transform var(--admin-duration-medium) var(--admin-ease-spring),
    background-color var(--admin-duration-medium) var(--admin-ease-out),
    color var(--admin-duration-medium) var(--admin-ease-out),
    box-shadow var(--admin-duration-medium) var(--admin-ease-out);
}
.sw-step.active .sw-step-dot {
  background: var(--admin-primary);
  color: #fff;
  border-color: var(--admin-primary);
  transform: scale(1.15);
  box-shadow: 0 4px 14px rgba(var(--admin-primary-rgb), 0.4);
}
.sw-step.done .sw-step-dot {
  background: var(--admin-success);
  color: #fff;
  border-color: var(--admin-success);
}
.sw-step-label {
  font-size: 0.72rem;
  color: var(--admin-text-tertiary);
  white-space: nowrap;
  letter-spacing: -0.005em;
}
.sw-step.active .sw-step-label {
  color: var(--admin-primary);
  font-weight: 600;
}
.sw-step.done .sw-step-label { color: var(--admin-success); }

/* ====== Card — glass ====== */
.sw-card {
  position: relative;
  background: var(--admin-material-regular);
  backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-xl);
  padding: 2rem 1.8rem;
  box-shadow: var(--admin-shadow-2);
  overflow: hidden;
  isolation: isolate;
}

.sw-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent);
  pointer-events: none;
}

[theme='dark'] .sw-card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.16),
    transparent);
}

/* ====== Welcome ====== */
.sw-welcome { text-align: center; padding: 1.5rem 1rem; }
.sw-welcome-icon {
  font-size: 3.4rem;
  margin-bottom: 0.75rem;
  line-height: 1;
  filter: drop-shadow(0 4px 12px var(--admin-primary-soft));
}
.sw-welcome h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.55rem;
  color: var(--admin-text);
  letter-spacing: -0.02em;
}
.sw-welcome p {
  font-size: 0.94rem;
  color: var(--admin-text-secondary);
  margin: 0 0 0.35rem;
  line-height: 1.55;
}
.sw-hint { color: var(--admin-text-tertiary) !important; font-size: 0.8rem !important; }

/* ====== Form ====== */
.sw-step-content { min-height: 280px; }
.sw-section-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.4rem;
  color: var(--admin-text);
  letter-spacing: -0.015em;
}
.sw-section-desc {
  font-size: 0.86rem;
  color: var(--admin-text-secondary);
  margin: 0 0 1.2rem;
}
.sw-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sw-form-full { grid-column: 1 / -1; }
.sw-input { width: 100%; }
.sw-birth-label {
  display: block;
  font-size: 0.8rem;
  color: var(--admin-text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}
.sw-birth-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.sw-date-input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-sm);
  font-size: 0.88rem;
  color: var(--admin-text);
  background: var(--admin-material-ultrathin);
  outline: none;
  transition:
    border-color var(--admin-duration-fast) var(--admin-ease-out),
    box-shadow var(--admin-duration-fast) var(--admin-ease-out);
  font-family: inherit;
  font-variant-numeric: tabular-nums;
}
.sw-date-input:hover { border-color: var(--admin-hairline-strong); }
.sw-date-input:focus {
  border-color: var(--admin-primary);
  box-shadow: 0 0 0 3px var(--admin-primary-soft);
}
.sw-birth-preview {
  font-size: 0.82rem;
  color: var(--admin-primary);
  background: var(--admin-primary-softer);
  border: 1px solid color-mix(in srgb, var(--admin-primary) 22%, transparent);
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 500;
}
.sw-birth-preview b { font-weight: 700; }

.sw-title-preview {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
}
.sw-title-preview-label { color: var(--admin-text-secondary); }
.sw-title-preview-tab {
  background: var(--admin-material-thin);
  padding: 4px 12px;
  border-radius: var(--admin-radius-sm);
  border: 1px solid var(--admin-hairline);
  color: var(--admin-text);
  font-size: 0.85rem;
  font-weight: 500;
}
.sw-title-hint {
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--admin-text-tertiary);
}

.sw-strength { margin-top: 8px; display: flex; align-items: center; gap: 10px; }
.sw-strength-bar {
  flex: 1;
  height: 4px;
  background: var(--admin-hairline-strong);
  border-radius: 999px;
  overflow: hidden;
}
.sw-strength-fill {
  height: 100%;
  border-radius: 999px;
  transition:
    width var(--admin-duration-medium) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
}
.sw-strength-text {
  font-size: 0.78rem;
  white-space: nowrap;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.sw-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }

/* ====== List ====== */
.sw-list { display: flex; flex-direction: column; gap: 10px; }
.sw-list-row { display: flex; align-items: center; gap: 8px; }
.sw-idx {
  width: 22px;
  text-align: center;
  font-family: ui-monospace, 'SF Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.78rem;
  color: var(--admin-text-tertiary);
  font-variant-numeric: tabular-nums;
}
.sw-add-btn { margin-top: 10px; }

/* ====== Navigation ====== */
.sw-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.8rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--admin-hairline);
}
.sw-nav-right { margin-left: auto; display: flex; gap: 10px; }

/* ====== Responsive ====== */
@media (max-width: 768px) {
  .sw-root { padding: 1rem 0.5rem; }
  .sw-progress { gap: 0; }
  .sw-step-label { font-size: 0.65rem; }
  .sw-form { grid-template-columns: 1fr; }
  .sw-grid-2 { grid-template-columns: 1fr; }
  .sw-card { padding: 1.4rem 1.2rem; border-radius: var(--admin-radius-lg); }
}
</style>
