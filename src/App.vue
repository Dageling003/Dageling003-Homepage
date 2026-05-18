<template>
  <Transition name="fade" appear>
    <Loading v-if="showLoading" />
  </Transition>
  <main>
    <main-card></main-card>
  </main>
  <button
    class="reThemeBtn"
    :aria-label="theme === 'light' ? '切换到深色模式' : '切换到浅色模式'"
    :aria-pressed="theme === 'dark'"
    type="button"
    @click="changeTheme"
  >
    {{ theme == 'light' ? '🔆' : '🌙' }}
  </button>
</template>

<script setup>
import { defineAsyncComponent, ref, onMounted, onUnmounted } from 'vue';
import { useLoading } from './composables';

const MainCard = defineAsyncComponent(() => import('./views/MainCard.vue'));
const Loading = defineAsyncComponent(() => import('./components/Loading.vue'));

const { showLoading } = useLoading();

let theme = ref(localStorage.getItem('theme') || 'light');

const incrementVisitCount = () => {
  const visits = localStorage.getItem('visitCount');
  const count = visits ? parseInt(visits) + 1 : 1;
  localStorage.setItem('visitCount', count.toString());
};

const handleKeydown = (e) => {
  if (e.key === 't' || e.key === 'T') {
    changeTheme();
  }
};

onMounted(() => {
  document.body.setAttribute('theme', theme.value);
  incrementVisitCount();
  window.addEventListener('keydown', handleKeydown);
  document.documentElement.style.scrollBehavior = 'smooth';
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const changeTheme = () => {
  if (theme.value == 'light') {
    theme.value = 'dark';
    onTheme('dark');
  } else {
    theme.value = 'light';
    onTheme('light');
  }
};

const onTheme = (theme) => {
  document.body.setAttribute('theme', theme);
  localStorage.setItem('theme', theme);
};
</script>

<style>
@import url(assets/css/App.css);

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

html {
  scroll-behavior: smooth;
}
</style>
