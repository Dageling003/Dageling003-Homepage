<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { ref, onMounted, onBeforeMount } from 'vue'

const themeStore = useThemeStore()
const loaded = ref(false)

onBeforeMount(() => {
  themeStore.initTheme()
})

onMounted(() => {
  document.getElementById('app')?.classList.add('loaded')
  requestAnimationFrame(() => {
    loaded.value = true
  })
})
</script>

<template>
  <div class="app" :class="{ loaded }">
    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </div>
</template>

<style>
html {
  background-color: var(--background, #d0e8ff);
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-color, #000);
}

#app {
  min-height: 100vh;
}

.app {
  opacity: 0;
}

.app.loaded {
  opacity: 1;
  transition: opacity 0.3s ease-out;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

img {
  max-width: 100%;
  height: auto;
}

a {
  text-decoration: none;
  color: var(--theme-color);
}
</style>
