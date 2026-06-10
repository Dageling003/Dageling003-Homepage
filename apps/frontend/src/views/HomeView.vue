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
  professions: (v) => { try { professions.value = JSON.parse(v) } catch {} },
  links: (v) => { try { links.value = JSON.parse(v) } catch {} },
  techs: (v) => { try { techs.value = JSON.parse(v) } catch {} },
  todos: (v) => { try { todos.value = JSON.parse(v) } catch {} },
  typewriterWords: (v) => { try { typewriterWords.value = JSON.parse(v) } catch {} },
}

onMounted(async () => {
  try {
    const res = await getAllConfigs()
    const arr: Array<{ configKey: string; configValue: string }> = res.data.data || []
    for (const c of arr) {
      configHandlers[c.configKey]?.(c.configValue)
    }
  } catch {
    // API unavailable — keep defaults
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
            <template v-for="(p, i) in professions" :key="i">
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
                :key="i"
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
                :key="i"
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
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.main.loaded .header { animation: fadeUp 0.5s ease both; }
.main.loaded .intro-card { animation: fadeUp 0.5s ease 0.1s both; }
.main.loaded .card-grid { animation: fadeUp 0.5s ease 0.2s both; }
.main.loaded .bottom-bar { animation: fadeUp 0.5s ease 0.3s both; }
.main.loaded .footer { animation: fadeUp 0.5s ease 0.4s both; }

main {
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 5rem 0 3rem;
  position: relative;
}

.mainCard .header {
  display: flex;
  align-items: center;
}

.mainCard .header .avatar {
  width: 9rem;
  height: 9rem;
  border-radius: 50%;
  border: 0.5rem solid var(--card-border-color);
  margin-right: 1rem;
  position: relative;
  flex-shrink: 0;
}

.mainCard .header .avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
}

.avatar-emoji {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--card-border-color);
  border-radius: 50%;
  border: 0.3rem solid var(--card-border-color);
  font-size: 1.2rem;
  line-height: 1;
  width: 1.8rem;
  height: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mainCard .header .sayHi {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.mainCard .header .sayHi h1 {
  font-size: 2.2rem;
  margin: 0;
  color: var(--text-color);
  font-weight: 600;
}

.hl-name {
  position: relative;
  color: rgba(0, 0, 0, 0.12);
  font-weight: 700;
}

[theme='dark'] .hl-name {
  color: rgba(255, 255, 255, 0.12);
}

.hl-name::before {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  color: var(--theme-color);
  width: 0;
  white-space: nowrap;
  overflow: hidden;
  animation: showName 3s ease-in-out infinite;
  border-right: 3px solid var(--theme-color);
  filter: drop-shadow(0 0 6px var(--theme-color));
}

@keyframes showName {
  0% { width: 0; }
  50% { width: 105%; }
  100% { width: 0; }
}

.infoTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.infoTags .tag {
  padding: 0.3rem 0.5rem;
  background: var(--card-background);
  border-radius: 8px;
  font-size: 0.85rem;
}

.infoTags .tag .boy { color: #33a9dc; }
.infoTags .tag .girl { color: #ff5e7e; }

.mainCard .content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.intro-card {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem 0.8rem;
  padding: 1rem 1.3rem;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.card-grid > .card {
  min-height: 200px;
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
  padding: 0.7rem 1rem;
}

.bottom-bar .soc-card {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.2rem;
  flex-wrap: nowrap;
}

.mainCard .card {
  background: var(--card-background);
  border: 3px solid var(--card-border-color);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.mainCard .card .cardHeader {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.mainCard .hover { transition: all 0.3s ease-in-out; }
.mainCard .hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--theme-color);
}

.todoList {
  margin-top: 0.3rem;
  overflow-y: auto;
  flex: 1;
  max-height: 240px;
  scrollbar-width: thin;
  scrollbar-color: var(--card-border-color) transparent;
  padding-right: 0.3rem;
}

.todoList::-webkit-scrollbar {
  width: 5px;
}

.todoList::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.todoList::-webkit-scrollbar-thumb {
  background: var(--card-border-color);
  border-radius: 4px;
}

.todoList::-webkit-scrollbar-thumb:hover {
  background: var(--theme-color);
}

.todoItem {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.5rem 0;
  padding-bottom: 0.3rem;
  border-bottom: 2px dashed var(--text-color);
  font-size: 0.88rem;
}

.todoItem:last-child { border-bottom: none; }
.todo-check { font-size: 0.9rem; flex-shrink: 0; }
.todoItem .done { text-decoration: line-through; opacity: 0.5; }

.intro-line {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: nowrap;
}

.intro-card b,
.mainCard .card-grid b {
  position: relative;
  display: inline-block;
  margin: 0 0.15rem;
  z-index: 1;
}

.intro-card b::before,
.mainCard .card-grid b::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  background: var(--theme-color);
  opacity: 0.7;
  border-radius: 4px;
  z-index: -1;
  transition: height 0.3s;
}

.intro-card b:hover::before,
.mainCard .card-grid b:hover::before { height: 70%; }

.techStack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.techItem {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--techItem-background);
  border: 2px solid var(--card-border-color);
  position: relative;
  cursor: default;
  transition: all 0.25s ease;
}

.techItem:hover {
  transform: translateY(-3px) scale(1.06);
  border-color: #d0d0d0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.techIconSvg {
  font-size: 1.7rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.06));
}

.techItem::before {
  content: attr(data-name);
  position: absolute;
  top: -1.8rem;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: #2d2d2d;
  color: #fff;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 5px;
  white-space: nowrap;
  opacity: 0;
  transition: all 0.25s;
  pointer-events: none;
}

.techItem:hover::before {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.typew-card :deep(.typewriter) {
  font-family: monospace;
  font-size: 15px;
  text-align: center;
}

.mainCard .footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.82rem;
  opacity: 0.5;
}

.mainCard .footer p { margin: 0; }

@media (max-width: 1024px) {
  main {
    width: 95%;
    padding: 4rem 0 2rem;
  }

  .mainCard .header .avatar {
    width: 7rem;
    height: 7rem;
    border-width: 0.4rem;
  }

  .mainCard .header .sayHi h1 {
    font-size: 1.8rem;
  }

  .mainCard .content { gap: 0.8rem; }

  .card-grid {
    gap: 0.8rem;
  }

  .bottom-bar {
    gap: 0.8rem;
  }
}

@media (max-width: 768px) {
  main {
    width: 92%;
    padding: 1rem 0 2rem;
  }

  .mainCard .header {
    flex-direction: column;
    text-align: center;
  }

  .mainCard .header .avatar {
    width: 5rem;
    height: 5rem;
    border-width: 0.3rem;
    margin-right: 0;
    margin-bottom: 0.6rem;
  }

  .avatar-emoji {
    width: 1.4rem;
    height: 1.4rem;
    font-size: 0.9rem;
    border-width: 0.2rem;
  }

  .mainCard .header .sayHi h1 {
    font-size: 1.3rem;
    text-align: center;
  }

  .infoTags {
    justify-content: center;
  }

  .infoTags .tag {
    font-size: 0.78rem;
    padding: 0.2rem 0.4rem;
  }

  .intro-line {
    white-space: normal;
    font-size: 0.88rem;
  }

  .card-grid {
    grid-template-columns: 1fr;
    gap: 0.7rem;
  }

  .bottom-bar {
    flex-direction: column;
    gap: 0.7rem;
  }

  .bottom-bar .typew-card {
    flex: none;
  }

  .mainCard .card {
    flex: none;
    padding: 0.8rem;
    width: auto;
  }

  .mainCard .soc-card {
    padding: 0.6rem 0.7rem;
  }

  .typew-card :deep(.typewriter) {
    font-size: 13px;
  }

  .mainCard .footer {
    margin-top: 1rem;
  }

  .mainCard .hover:hover {
    transform: none;
    box-shadow: none;
    border-color: var(--card-border-color);
  }
}

@media (max-width: 420px) {
  main {
    width: 96%;
    padding: 0.6rem 0 1.5rem;
  }

  .mainCard .header .avatar {
    width: 4rem;
    height: 4rem;
    border-width: 0.25rem;
  }

  .mainCard .header .sayHi h1 {
    font-size: 1.1rem;
  }

  .mainCard .card {
    padding: 0.65rem;
    border-width: 2px;
  }
}
</style>
