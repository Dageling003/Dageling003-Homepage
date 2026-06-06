<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { ref, onMounted } from 'vue'

const themeStore = useThemeStore()
const loaded = ref(false)

onMounted(() => {
  themeStore.initTheme()
  requestAnimationFrame(() => {
    loaded.value = true
  })
})
</script>

<template>
  <div class="app" :class="{ loaded }">
    <RouterView />
  </div>
</template>

<style>
* {
  transition: all 0.3s ease-in-out;
}

:root {
  --background: #d0e8ff;
  --theme-color: #ffb3b3;
  --text-color: #000;
  --card-background: rgba(255, 255, 255, 0.49);
  --card-border-color: #fff;
  --techItem-background: #e5e5e5;
  --tip-color: #fff;
  --loading-background: var(--theme-color);
}

[theme='dark'] {
  --background: #222222;
  --text-color: #fff;
  --card-background: #292929;
  --card-border-color: #444444;
  --techItem-background: transparent;
  --loading-background: #2b2b2b;
}

body {
  background: var(--background);
  padding: 0;
  margin: 0;
  min-height: 100vh;
  position: relative;
  transition: background 0s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-color);
}

#app {
  min-height: 100vh;
}

img {
  width: 100%;
  height: 100%;
}

a {
  text-decoration: none;
  position: relative;
  color: var(--theme-color);
  transition: all 0.3s ease-in-out;
  padding: 0 0.3rem;
}

a:hover {
  color: #fff;
}

a:hover::before {
  height: 100%;
}

a::before {
  content: '';
  transition: all 0.3s ease-in-out;
  border-radius: 5px;
  z-index: -1;
  display: inline-block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0;
  width: 100%;
  height: 2px;
  background: var(--theme-color);
}

b {
  display: inline-block;
  position: relative;
  margin: 0 0.2rem;
  text-align: center;
  z-index: 1;
}

b::before {
  content: '';
  position: absolute;
  bottom: 0;
  z-index: -1;
  opacity: 0.8;
  border-radius: 4px;
  width: 100%;
  height: 30%;
  background: var(--theme-color);
  transition: all 0.3s ease-in-out;
}

b:hover::before {
  height: 70%;
}

/* Vue transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.app.loaded {
  opacity: 1;
}
</style>
