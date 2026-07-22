<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  words?: string[]
  typeSpeed?: number
  deleteSpeed?: number
  pauseDuration?: number
  cursorChar?: string
}>(), {
  words: () => ['Hello, World!'],
  typeSpeed: 80,
  deleteSpeed: 40,
  pauseDuration: 2000,
  cursorChar: '|',
})

const displayText = ref('')
const isBlink = ref(false)

let currentWordIndex = 0
let charIndex = 0
let isDeleting = false
let timer: ReturnType<typeof setTimeout> | null = null
let cursorTimer: ReturnType<typeof setInterval> | null = null

function tick() {
  const currentWord = props.words[currentWordIndex]
  if (!currentWord) return

  if (isDeleting) {
    charIndex--
    displayText.value = currentWord.substring(0, charIndex)
  } else {
    charIndex++
    displayText.value = currentWord.substring(0, charIndex)
  }

  let delay = isDeleting ? props.deleteSpeed : props.typeSpeed

  if (!isDeleting && charIndex === currentWord.length) {
    delay = props.pauseDuration
    isDeleting = true
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false
    currentWordIndex = (currentWordIndex + 1) % props.words.length
    delay = 500
  }

  timer = setTimeout(tick, delay)
}

onMounted(() => {
  requestAnimationFrame(() => {
    tick()
    cursorTimer = setInterval(() => {
      isBlink.value = !isBlink.value
    }, 530)
  })
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (cursorTimer) clearInterval(cursorTimer)
})
</script>

<template>
  <span class="typewriter">
    {{ displayText }}<span class="cursor" :class="{ blink: isBlink }" aria-hidden="true">{{ cursorChar }}</span>
  </span>
</template>

<style scoped>
.typewriter {
  font-family:
    ui-monospace, 'SF Mono', 'JetBrains Mono', 'Fira Code',
    'Cascadia Code', 'Menlo', Consolas, monospace;
  white-space: pre-wrap;
  overflow: hidden;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.005em;
  color: var(--text-color);
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 3px;
  vertical-align: -0.15em;
  background: var(--theme-color);
  color: transparent;
  border-radius: 1px;
  transition: opacity 120ms var(--ease-out);
}

.cursor.blink { opacity: 0; }
</style>
