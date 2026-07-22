<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { getAllConfigs } from '@/api'
import TypewriterText from '@/components/TypewriterText.vue'
import QuickLinks from '@/components/QuickLinks.vue'
import TimeGreeting from '@/components/TimeGreeting.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AnimatedLogo from '@/components/AnimatedLogo.vue'

const TECH_ICONS: Record<string, string> = {
  HTML: 'logos:html-5',
  CSS: 'logos:css-3',
  JS: 'logos:javascript',
  JavaScript: 'logos:javascript',
  Vue: 'logos:vue',
  React: 'logos:react',
  Angular: 'logos:angular-icon',
  Node: 'logos:nodejs-icon',
  'Node.js': 'logos:nodejs-icon',
  Python: 'logos:python',
  TypeScript: 'logos:typescript-icon',
  TS: 'logos:typescript-icon',
  Git: 'logos:git-icon',
  Docker: 'logos:docker-icon',
  Rust: 'logos:rust',
  Go: 'logos:go',
  Java: 'logos:java',
  PHP: 'logos:php',
  Sass: 'logos:sass',
  Vite: 'logos:vitejs',
  Webpack: 'logos:webpack',
  MongoDB: 'logos:mongodb-icon',
  PostgreSQL: 'logos:postgresql',
  Redis: 'logos:redis',
  GraphQL: 'logos:graphql',
  AWS: 'logos:aws',
  Linux: 'logos:linux-tux',
  Figma: 'logos:figma',
  Tailwind: 'logos:tailwindcss-icon',
  'Tailwind CSS': 'logos:tailwindcss-icon',
  Prisma: 'logos:prisma',
  Next: 'logos:nextjs-icon',
  'Next.js': 'logos:nextjs-icon',
  Nuxt: 'logos:nuxt-icon',
  'Nuxt.js': 'logos:nuxt-icon',
  Electron: 'logos:electron',
  Android: 'logos:android-icon',
}

function techIcon(name: string): string {
  if (TECH_ICONS[name]) return TECH_ICONS[name]
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(TECH_ICONS)) {
    if (k.toLowerCase() === lower) return v
  }
  return 'logos:codecov-icon'
}

const showContent = ref(false)
const logoRef = ref<InstanceType<typeof AnimatedLogo> | null>(null)

const name = ref('鹊楠')
const avatarUrl = ref('https://api.dicebear.com/7.x/thumbs/svg?seed=cat')
const infoSex = ref('♂')
const infoSexDisplay = ref('symbol')
const infoBirth = ref('')
const infoAgeDisplay = ref('all')
const infoProvince = ref('江苏省')
const infoShowName = ref('1')
const infoShowZodiac = ref('1')
const infoShowBirth = ref('1')
const infoSchool = ref('南通大学')
const professions = ref(['前端切图仔', '摄影爱好者', '猫猫教'])
const links = ref<Array<{ text: string; color: string; url: string }>>([
  { text: '博客', color: '#f59e0b', url: 'https://example.com' },
  { text: 'GitHub', color: '#333', url: 'https://github.com' },
  { text: 'Bilibili', color: '#fb7299', url: 'https://bilibili.com' },
  { text: '邮箱', color: '#ea4335', url: 'mailto:hello@example.com' },
])
const techs = ref<Array<{ name: string }>>([
  { name: 'HTML' }, { name: 'CSS' }, { name: 'JS' }, { name: 'Vue' },
])
const todos = ref<Array<{ text: string; done: boolean }>>([
  { text: '学Java', done: false },
  { text: '学Android', done: false },
  { text: '学英语', done: false },
  { text: '回顾首页', done: true },
])
const typewriterWords = ref([
  '欢迎来到我的主页 🎉',
  '生活不止眼前的苟且，还有诗和远方',
  '累了就休息一下吧~ 😊',
  'May you happy every day ✨',
])

function calcAgeFromBirth(birthStr: string): number | null {
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
  if (parts.length < 2) return null
  const month = parseInt(parts[1])
  const day = parseInt(parts[2])
  if (isNaN(month) || isNaN(day)) return null
  const ZODIAC = [
    { name: '摩羯座', start: [1, 1], end: [1, 19] },
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
  for (const z of ZODIAC) {
    const [sm, sd] = z.start, [em, ed] = z.end
    if ((month === sm && day >= sd) || (month === em && day <= ed)) return z.name
  }
  return null
}

const displayAge = computed(() => {
  const fromBirth = calcAgeFromBirth(infoBirth.value)
  if (fromBirth !== null && fromBirth >= 0) return fromBirth
  return 0
})

const displayZodiac = computed(() => {
  return calcZodiac(infoBirth.value) || ''
})

function genderLabel(): string {
  const isMale = infoSex.value === '♂'
  const symbol = isMale ? '♂' : '♀'
  const text = isMale ? '男' : '女'
  switch (infoSexDisplay.value) {
    case 'text': return text
    case 'both': return `${symbol} ${text}`
    default: return symbol
  }
}

const configHandlers: Record<string, (val: string) => void> = {
  siteTitle: (v) => {
    const title = v || '个人主页'
    document.title = title
  },
  name: (v) => { name.value = v },
  infoSex: (v) => { infoSex.value = v },
  infoSexDisplay: (v) => { infoSexDisplay.value = v || 'symbol' },
  infoBirth: (v) => { infoBirth.value = v },
  infoAgeDisplay: (v) => { infoAgeDisplay.value = v || 'all' },
  infoShowName: (v) => { infoShowName.value = v || '1' },
  infoShowZodiac: (v) => { infoShowZodiac.value = v || '1' },
  infoShowBirth: (v) => { infoShowBirth.value = v || '1' },
  infoProvince: (v) => { infoProvince.value = v },
  infoSchool: (v) => { infoSchool.value = v },
  avatarUrl: (v) => { avatarUrl.value = v },
  professions: (v) => { try { professions.value = JSON.parse(v) } catch (e) { console.error('[HomeView] professions parse failed:', e) } },
  links: (v) => { try { links.value = JSON.parse(v) } catch (e) { console.error('[HomeView] links parse failed:', e) } },
  techs: (v) => { try { techs.value = JSON.parse(v) } catch (e) { console.error('[HomeView] techs parse failed:', e) } },
  todos: (v) => { try { todos.value = JSON.parse(v) } catch (e) { console.error('[HomeView] todos parse failed:', e) } },
  typewriterWords: (v) => { try { typewriterWords.value = JSON.parse(v) } catch (e) { console.error('[HomeView] typewriterWords parse failed:', e) } },
}

onMounted(async () => {
  try {
    const res = await getAllConfigs()
    const arr: Array<{ configKey: string; configValue: string }> = res.data.data || []
    for (const c of arr) {
      configHandlers[c.configKey]?.(c.configValue)
    }
  } catch (e) {
    console.error('[HomeView] fetchAllConfigs failed:', e)
  }
  logoRef.value?.finish()
})
</script>

<template>
  <AnimatedLogo
    v-if="!showContent"
    ref="logoRef"
    loading
    icon="🐱"
    text="正在加载..."
    @done="showContent = true"
  />

  <main class="main" :class="{ loaded: showContent }" aria-label="个人主页">
    <ThemeToggle />

    <article class="mainCard" role="article">
      <header class="header" role="banner">
        <div class="avatar" role="img" aria-label="头像">
          <img
            :src="avatarUrl"
            :alt="`${name}的头像`"
            loading="lazy"
            width="144"
            height="144"
          />
          <span class="avatar-emoji" aria-hidden="true">🐱</span>
        </div>
        <div class="sayHi">
          <h1>Hi, I'm <span class="hl-name" :data-text="name">{{ name }}</span></h1>
          <div class="infoTags" role="list">
            <span class="tag" role="listitem"><span :class="infoSex === '♂' ? 'boy' : 'girl'" aria-label="性别">{{ genderLabel() }}</span></span>
            <span v-if="(infoAgeDisplay === 'all' || infoAgeDisplay === 'tag') && displayAge > 0" class="tag" role="listitem" :aria-label="`年龄${displayAge}岁`">{{ displayAge }}岁</span>
            <span v-if="infoShowBirth === '1' && infoBirth" class="tag" role="listitem" :aria-label="`生日${infoBirth}`">{{ infoBirth.replace(/-/g, '/') }}</span>
            <span class="tag" role="listitem" aria-label="省份">{{ infoProvince }}</span>
            <span class="tag" role="listitem" aria-label="学校">{{ infoSchool }}</span>
          </div>
        </div>
      </header>

      <section class="content" role="main">
        <div class="card hover intro-card" role="region" aria-label="自我介绍">
          <p class="intro-line">你好鸭，很高兴认识你👋</p>
          <p class="intro-line">
            <template v-if="infoShowName === '1'">我叫 <b>{{ name }}</b></template>
            <template v-if="infoShowZodiac === '1' && displayZodiac">（ {{ displayZodiac }} ）</template>
            <template v-if="(infoAgeDisplay === 'all' || infoAgeDisplay === 'intro') && displayAge > 0">，{{ displayAge }}岁</template>
          </p>
          <p class="intro-line">
            是一名
            <template v-for="(p, i) in professions" :key="`prof-${i}-${p}`">
              <b>{{ p }}</b><span v-if="i < professions.length - 1">、</span>
            </template>
          </p>
        </div>

        <div class="card-grid">
          <div class="card hover" role="region" aria-label="技术栈">
            <div class="cardHeader">🛠️ 技术栈</div>
            <div class="techStack" role="list">
              <div
                v-for="(t, i) in techs"
                :key="`tech-${i}-${t.name}`"
                class="techItem"
                :data-name="t.name"
                role="listitem"
                :aria-label="t.name"
              >
                <Icon :icon="techIcon(t.name)" class="techIconSvg" />
              </div>
            </div>
          </div>

          <div class="card hover" role="region" aria-label="待办事项">
            <div class="cardHeader">📃 鸽子计划</div>
            <div class="todoList" role="list">
              <div
                v-for="(item, i) in todos"
                :key="`todo-${i}-${item.text}`"
                class="todoItem"
                role="listitem"
              >
                <span class="todo-check" :aria-label="item.done ? '已完成' : '未完成'">{{ item.done ? '✅' : '⭕' }}</span>
                <span :class="{ done: item.done }">{{ item.text }}</span>
              </div>
            </div>
          </div>

          <div class="card hover" role="region" aria-label="时间进度">
            <TimeGreeting />
          </div>
        </div>

        <div class="bottom-bar">
          <div class="card hover typew-card" role="region" aria-label="打字机文字">
            <TypewriterText
              :words="typewriterWords"
              :type-speed="80"
              :pause-duration="3000"
              cursor-char="|"
            />
          </div>
          <div class="card hover soc-card" role="region" aria-label="快捷链接">
            <QuickLinks :links="links" layout="row" size="lg" />
          </div>
        </div>
      </section>

      <footer class="footer" role="contentinfo">
        <p>© 2026 鹊楠的个人主页</p>
      </footer>
    </article>
  </main>
</template>

<style scoped>
/* ============================================================
   HomeView — Apple-style materials, restrained motion, hairlines
   ============================================================ */

/* ---------- Entrance: soft, critically damped, staggered ---------- */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translate3d(0, 14px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.main.loaded .header      { animation: fadeUp 620ms var(--ease-out) 40ms both; }
.main.loaded .intro-card  { animation: fadeUp 620ms var(--ease-out) 120ms both; }
.main.loaded .card-grid   { animation: fadeUp 620ms var(--ease-out) 200ms both; }
.main.loaded .bottom-bar  { animation: fadeUp 620ms var(--ease-out) 280ms both; }
.main.loaded .footer      { animation: fadeUp 620ms var(--ease-out) 360ms both; }

/* ---------- Layout ---------- */
main {
  width: min(1040px, 92%);
  margin: 0 auto;
  padding: 5.5rem 0 3rem;
  position: relative;
  z-index: 1;
}

/* ---------- Header / Hero ---------- */
.mainCard .header {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  padding: 0 0.25rem;
}

.mainCard .header .avatar {
  width: 8.5rem;
  height: 8.5rem;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
  padding: 4px;
  background:
    linear-gradient(135deg,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.4) 40%,
      rgba(255, 255, 255, 0.15));
  box-shadow:
    var(--shadow-2),
    0 0 0 1px var(--hairline) inset;
  isolation: isolate;
}

[theme='dark'] .mainCard .header .avatar {
  background:
    linear-gradient(135deg,
      rgba(255, 255, 255, 0.16),
      rgba(255, 255, 255, 0.04) 40%,
      rgba(255, 255, 255, 0.02));
}

.mainCard .header .avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  background: var(--surface);
}

.avatar-emoji {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: var(--material-thick);
  backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturation));
  -webkit-backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturation));
  border-radius: 50%;
  border: 1px solid var(--hairline);
  font-size: 1.1rem;
  line-height: 1;
  width: 1.9rem;
  height: 1.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-1);
}

.mainCard .header .sayHi {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-width: 0;
}

.mainCard .header .sayHi h1 {
  font-size: clamp(1.75rem, 3.4vw, 2.4rem);
  margin: 0;
  color: var(--text-color);
  font-weight: 700;
  letter-spacing: -0.022em; /* tightening for large display type */
  line-height: 1.08;
  font-optical-sizing: auto;
}

/* Sweep-of-color highlight over the name — subtler, no glow */
.hl-name {
  position: relative;
  display: inline-block;
  color: var(--text-color);
  font-weight: 700;
  background:
    linear-gradient(90deg,
      var(--theme-color) 0%,
      color-mix(in srgb, var(--theme-color) 55%, #ff64d2) 50%,
      var(--theme-color) 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: nameFlow 6s ease-in-out infinite;
}

@keyframes nameFlow {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

.infoTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.infoTags .tag {
  padding: 0.28rem 0.65rem;
  background: var(--material-thin);
  backdrop-filter: blur(20px) saturate(var(--material-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--material-saturation));
  border: 1px solid var(--hairline);
  border-radius: 999px; /* Apple-style capsule tags */
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  letter-spacing: 0.005em;
  line-height: 1.35;
}

.infoTags .tag .boy  { color: #0a84ff; font-weight: 600; }
.infoTags .tag .girl { color: #ff375f; font-weight: 600; }

/* ---------- Content grid ---------- */
.mainCard .content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2.2rem;
}

.intro-card {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.9rem;
  padding: 1.15rem 1.4rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.card-grid > .card {
  min-height: 208px;
}

.bottom-bar {
  display: flex;
  gap: 1rem;
  align-items: stretch;
}

.bottom-bar .typew-card {
  flex: 0 0 42%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.9rem 1.15rem;
}

.bottom-bar .soc-card {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.9rem 1.25rem;
  flex-wrap: nowrap;
}

/* ---------- The Card material ---------- */
.mainCard .card {
  position: relative;
  background: var(--material-regular);
  backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturation));
  -webkit-backdrop-filter: blur(var(--material-blur)) saturate(var(--material-saturation));
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  padding: 1.15rem 1.25rem;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-1);
  overflow: hidden;
  isolation: isolate;
}

/* Bright top edge — light catching a physical material */
.mainCard .card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 8%;
  right: 8%;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.7),
    transparent);
  pointer-events: none;
  z-index: 2;
}

[theme='dark'] .mainCard .card::before {
  background: linear-gradient(90deg,
    transparent,
    rgba(255, 255, 255, 0.18),
    transparent);
}

.mainCard .card .cardHeader {
  font-size: 0.82rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ---------- Hover: subtle lift, no color change on border ---------- */
.mainCard .hover {
  transition:
    transform var(--duration-med) var(--ease-spring),
    box-shadow var(--duration-med) var(--ease-out),
    background-color var(--duration-med) var(--ease-out);
  will-change: transform;
}

@media (hover: hover) {
  .mainCard .hover:hover {
    transform: translate3d(0, -3px, 0);
    box-shadow: var(--shadow-2);
    background: var(--material-thick);
  }
}

/* ---------- Todo list ---------- */
.todoList {
  margin-top: 0.15rem;
  overflow-y: auto;
  flex: 1;
  max-height: 240px;
  scrollbar-width: thin;
  scrollbar-color: var(--hairline-strong) transparent;
  padding-right: 0.3rem;
}

.todoList::-webkit-scrollbar { width: 4px; }
.todoList::-webkit-scrollbar-track { background: transparent; }
.todoList::-webkit-scrollbar-thumb {
  background: var(--hairline-strong);
  border-radius: 4px;
}
.todoList::-webkit-scrollbar-thumb:hover { background: var(--text-tertiary); }

.todoItem {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--hairline);
  font-size: 0.9rem;
  color: var(--text-color);
}

.todoItem:last-child { border-bottom: none; }
.todo-check {
  font-size: 0.95rem;
  flex-shrink: 0;
  line-height: 1;
}
.todoItem .done {
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  color: var(--text-tertiary);
}

/* ---------- Intro text ---------- */
.intro-line {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.6;
  white-space: nowrap;
  color: var(--text-color);
}

/* Understated tint behind highlighted terms — replaces underline swatch */
.intro-card b,
.mainCard .card-grid b {
  position: relative;
  display: inline-block;
  font-weight: 600;
  color: var(--theme-color);
  background: var(--theme-color-soft);
  padding: 0.06em 0.42em;
  border-radius: 6px;
  transition: background-color var(--duration-med) var(--ease-out);
  margin: 0 0.05em;
}

.intro-card b:hover,
.mainCard .card-grid b:hover {
  background: color-mix(in srgb, var(--theme-color) 22%, transparent);
}

/* ---------- Tech stack ---------- */
.techStack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.techItem {
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: var(--material-thin);
  backdrop-filter: blur(14px) saturate(160%);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  border: 1px solid var(--hairline);
  position: relative;
  cursor: default;
  transition:
    transform var(--duration-med) var(--ease-spring),
    box-shadow var(--duration-med) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

@media (hover: hover) {
  .techItem:hover {
    transform: translate3d(0, -3px, 0) scale(1.05);
    box-shadow: var(--shadow-2);
    background: var(--material-thick);
    z-index: 2;
  }
}

.techIconSvg {
  font-size: 1.55rem;
  line-height: 1;
}

/* Tooltip — floating capsule, matches system tooltips */
.techItem::before {
  content: attr(data-name);
  position: absolute;
  top: -2rem;
  left: 50%;
  transform: translateX(-50%) translateY(6px) scale(0.94);
  transform-origin: center bottom;
  background: rgba(28, 28, 30, 0.94);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 9px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-med) var(--ease-spring);
  pointer-events: none;
  letter-spacing: 0.01em;
  box-shadow: var(--shadow-2);
}

.techItem:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* ---------- Typewriter card ---------- */
.typew-card :deep(.typewriter) {
  font-family:
    ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code',
    'Cascadia Code', 'Menlo', Consolas, monospace;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.005em;
  text-align: center;
  color: var(--text-color);
}

/* ---------- Footer ---------- */
.mainCard .footer {
  text-align: center;
  margin-top: 2.2rem;
  font-size: 0.78rem;
  color: var(--text-tertiary);
  letter-spacing: 0.02em;
}

.mainCard .footer p { margin: 0; }

/* ---------- Responsive ---------- */
@media (max-width: 1024px) {
  main {
    width: 94%;
    padding: 4rem 0 2rem;
  }

  .mainCard .header .avatar {
    width: 6.8rem;
    height: 6.8rem;
    padding: 3px;
  }

  .mainCard .content { gap: 0.85rem; }
  .card-grid { gap: 0.85rem; }
  .bottom-bar { gap: 0.85rem; }
}

@media (max-width: 768px) {
  main {
    width: 92%;
    padding: 1.5rem 0 2rem;
  }

  .mainCard .header {
    flex-direction: column;
    text-align: center;
    gap: 0.9rem;
  }

  .mainCard .header .avatar {
    width: 5.2rem;
    height: 5.2rem;
    padding: 3px;
  }

  .avatar-emoji {
    width: 1.5rem;
    height: 1.5rem;
    font-size: 0.9rem;
  }

  .infoTags {
    justify-content: center;
  }

  .infoTags .tag {
    font-size: 0.76rem;
    padding: 0.22rem 0.55rem;
  }

  .intro-line {
    white-space: normal;
    font-size: 0.92rem;
  }

  .card-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .card-grid > .card {
    min-height: 0;
  }

  .bottom-bar {
    flex-direction: column;
    gap: 0.75rem;
  }

  .bottom-bar .typew-card { flex: none; }

  .mainCard .card {
    padding: 1rem 1.05rem;
    border-radius: var(--radius-md);
  }

  .typew-card :deep(.typewriter) { font-size: 13px; }

  .mainCard .footer { margin-top: 1.3rem; }
}

@media (max-width: 420px) {
  main {
    width: 94%;
    padding: 1rem 0 1.5rem;
  }

  .mainCard .header .avatar {
    width: 4.4rem;
    height: 4.4rem;
    padding: 2px;
  }

  .mainCard .card {
    padding: 0.85rem 0.95rem;
  }
}
</style>
