<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { getAllConfigs } from '@/api'
import TypewriterText from '@/components/TypewriterText.vue'
import QuickLinks from '@/components/QuickLinks.vue'
import TimeGreeting from '@/components/TimeGreeting.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import AnimatedLogo from '@/components/AnimatedLogo.vue'

// ==================== Tech Icon Mapping ====================
const TECH_ICONS: Record<string, string> = {
  HTML:       'logos:html-5',
  CSS:        'logos:css-3',
  JS:         'logos:javascript',
  JavaScript: 'logos:javascript',
  Vue:        'logos:vue',
  React:      'logos:react',
  Angular:    'logos:angular-icon',
  Node:       'logos:nodejs-icon',
  'Node.js':  'logos:nodejs-icon',
  Python:     'logos:python',
  TypeScript: 'logos:typescript-icon',
  TS:         'logos:typescript-icon',
  Git:        'logos:git-icon',
  Docker:     'logos:docker-icon',
  Rust:       'logos:rust',
  Go:         'logos:go',
  Java:       'logos:java',
  PHP:        'logos:php',
  Sass:       'logos:sass',
  Vite:       'logos:vitejs',
  Webpack:    'logos:webpack',
  MongoDB:    'logos:mongodb-icon',
  PostgreSQL: 'logos:postgresql',
  Redis:      'logos:redis',
  GraphQL:    'logos:graphql',
  AWS:        'logos:aws',
  Linux:      'logos:linux-tux',
  Figma:      'logos:figma',
  Tailwind:   'logos:tailwindcss-icon',
  'Tailwind CSS': 'logos:tailwindcss-icon',
  Prisma:     'logos:prisma',
  Next:       'logos:nextjs-icon',
  'Next.js':  'logos:nextjs-icon',
  Nuxt:       'logos:nuxt-icon',
  'Nuxt.js':  'logos:nuxt-icon',
  Electron:   'logos:electron',
  Android:    'logos:android-icon',
}

function techIcon(name: string): string {
  // Direct match
  if (TECH_ICONS[name]) return TECH_ICONS[name]
  // Case-insensitive match
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(TECH_ICONS)) {
    if (k.toLowerCase() === lower) return v
  }
  // Fallback to a generic icon
  return 'logos:codecov-icon'
}

// ==================== UX ====================
const showContent = ref(false)
const logoRef = ref<InstanceType<typeof AnimatedLogo> | null>(null)

// ==================== User Data (with defaults) ====================
const name = ref('鹊楠')
const zodiac = ref('摩羯座')
const avatarUrl = ref('https://api.dicebear.com/7.x/thumbs/svg?seed=cat')
const infoSex = ref('♂')
const infoProvince = ref('江苏')
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

// ==================== Config Handlers ====================
const configHandlers: Record<string, (val: string) => void> = {
  name: (v) => { name.value = v },
  zodiac: (v) => { zodiac.value = v },
  infoSex: (v) => { infoSex.value = v },
  infoProvince: (v) => { infoProvince.value = v },
  infoSchool: (v) => { infoSchool.value = v },
  avatarUrl: (v) => { avatarUrl.value = v },
  professions: (v) => { try { professions.value = JSON.parse(v) } catch {} },
  links: (v) => { try { links.value = JSON.parse(v) } catch {} },
  techs: (v) => { try { techs.value = JSON.parse(v) } catch {} },
  todos: (v) => { try { todos.value = JSON.parse(v) } catch {} },
  typewriterWords: (v) => { try { typewriterWords.value = JSON.parse(v) } catch {} },
}

// ==================== Lifecycle ====================
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
  <!-- Loading Logo -->
  <AnimatedLogo
    v-if="!showContent"
    ref="logoRef"
    loading
    icon="🐱"
    text="正在加载..."
    @done="showContent = true"
  />

  <!-- Main Content -->
  <main class="main" :class="{ loaded: showContent }">
    <!-- Theme toggle -->
    <ThemeToggle />

    <div class="mainCard">
      <!-- ====== HEADER ====== -->
      <div class="header">
        <div class="avatar">
          <img :src="avatarUrl" alt="avatar" />
          <span class="avatar-emoji">🐱</span>
        </div>
        <div class="sayHi">
          <h1>Hi, I'm <span class="hl-name" :data-text="name">{{ name }}</span></h1>
          <div class="infoTags">
            <span class="tag"><span :class="infoSex === '♂' ? 'boy' : 'girl'">{{ infoSex }}</span></span>
            <span class="tag">{{ infoProvince }}</span>
            <span class="tag">{{ infoSchool }}</span>
          </div>
        </div>
      </div>

      <!-- ====== CONTENT ====== -->
      <div class="content">
        <!-- LEFT -->
        <div class="leftBox">
          <!-- Todo -->
          <div class="card hover">
            <div class="cardHeader">我的一些鸽子计划📃</div>
            <div class="todoList">
              <div v-for="(item, i) in todos" :key="i" class="todoItem">
                <span class="todo-check">{{ item.done ? '✅' : '⭕' }}</span>
                <span :class="{ done: item.done }">{{ item.text }}</span>
              </div>
            </div>
          </div>

          <!-- Time Progress -->
          <div class="card hover">
            <TimeGreeting />
          </div>
        </div>

        <!-- RIGHT -->
        <div class="rightBox">
          <!-- Intro + Tech -->
          <div class="card hover">
            <div class="intro-wrap">
              <p class="intro-line">你好鸭，很高兴认识你👋</p>
              <p class="intro-line">
                我叫 <b>{{ name }}</b>（ {{ zodiac }} ）
              </p>
              <p class="intro-line">
                是一名
                <template v-for="(p, i) in professions" :key="i">
                  <b>{{ p }}</b><span v-if="i < professions.length - 1">、</span>
                </template>
              </p>
              <h3 class="cardHeader" style="margin-top:1rem">我的一些技术栈🫡</h3>
              <div class="techStack">
                <div v-for="(t, i) in techs" :key="i" class="techItem" :data-name="t.name">
                  <Icon :icon="techIcon(t.name)" class="techIconSvg" />
                </div>
              </div>
            </div>
          </div>

          <!-- Typewriter -->
          <div class="card hover typew-card">
            <TypewriterText
              :words="typewriterWords"
              :type-speed="80"
              :pause-duration="3000"
              cursor-char="|"
            />
          </div>

          <!-- Social Links -->
          <div class="card hover soc-card">
            <QuickLinks :links="links" layout="row" size="lg" />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p>© 2026 Dageling003-Homepage</p>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* ====== Layout ====== */
main {
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 5rem 0 3rem;
  position: relative;
}

/* ====== Header ====== */
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

/* Name with scroll-highlight */
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
  0%   { width: 0; }
  50%  { width: 105%; }
  100% { width: 0; }
}

/* Tags */
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
  cursor: default;
}

.infoTags .tag .boy { color: #33a9dc; }
.infoTags .tag .girl { color: #ff5e7e; }

/* ====== Content Flex ====== */
.mainCard .content {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  align-items: stretch;
}

.mainCard .content .leftBox {
  width: 28%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mainCard .content .rightBox {
  width: 70%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ====== Cards ====== */
.mainCard .card {
  background: var(--card-background);
  border: 3px solid var(--card-border-color);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}

.mainCard .content .rightBox .card {
  flex: 1;
}

.mainCard .card .cardHeader {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.mainCard .hover { transition: all 0.3s ease-in-out; }
.mainCard .hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
}

/* ====== Todo ====== */
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

/* ====== Intro Lines ====== */
.intro-line {
  margin: 0.3rem 0;
  font-size: 0.93rem;
  line-height: 1.6;
}

.intro-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Bold highlight in intro */
.mainCard .rightBox b {
  position: relative;
  display: inline-block;
  margin: 0 0.15rem;
  z-index: 1;
}

.mainCard .rightBox b::before {
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

.mainCard .rightBox b:hover::before { height: 70%; }

/* ====== Tech Stack ====== */
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

.techDot { font-size: 1.3rem; }

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

.techDot { font-size: 1.3rem; }

/* ====== Typewriter ====== */
.mainCard .typew-card {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.7rem 1rem;
}

.typew-card :deep(.typewriter) {
  font-family: monospace;
  font-size: 15px;
  text-align: center;
}

/* ====== Social Buttons (via QuickLinks) ====== */
.mainCard .soc-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 1.2rem;
  flex-wrap: nowrap;
}

/* ====== Footer ====== */
.mainCard .footer {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.82rem;
  opacity: 0.5;
}

.mainCard .footer p { margin: 0; }

/* ====== Responsive ====== */

/* Tablet (iPad) */
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
  .mainCard .content .leftBox { width: 30%; }
  .mainCard .content .rightBox { width: 68%; }
}

/* Mobile */
@media (max-width: 768px) {
  main {
    width: 92%;
    padding: 1rem 0 2rem;
  }

  /* Header stacks vertically */
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

  /* Content stacks vertically */
  .mainCard .content {
    flex-direction: column;
    gap: 0.7rem;
  }

  /* Flatten boxes so all cards are direct flex children */
  .mainCard .content .leftBox,
  .mainCard .content .rightBox {
    display: contents;
  }

  /* Reorder cards: Intro → Todo → TimeGreeting → Typewriter → QuickLinks */
  .mainCard .content .rightBox > .card:first-child { order: 1; } /* Intro */
  .mainCard .content .leftBox > .card:first-child  { order: 2; } /* Todo */
  .mainCard .content .leftBox > .card:last-child   { order: 3; } /* TimeGreeting */
  .mainCard .content .rightBox > .typew-card       { order: 4; } /* Typewriter */
  .mainCard .content .rightBox > .soc-card         { order: 5; } /* QuickLinks */

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

  /* Disable hover lift on mobile (avoids sticky-hover) */
  .mainCard .hover:hover {
    transform: none;
    box-shadow: none;
  }
}

/* Small phones */
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
