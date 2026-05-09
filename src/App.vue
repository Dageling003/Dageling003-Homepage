<template>
  <Transition name="fade" appear>
    <Loading v-if="showLoading" />
  </Transition>
  <main>
    <main-card></main-card>
  </main>
  <button 
    class="reThemeBtn" 
    @click="changeTheme"
    :aria-label="theme == 'light' ? '切换到深色模式' : '切换到浅色模式'"
    aria-pressed="false"
    type="button"
  >
    {{ theme == "light" ? "🔆" : "🌙" }}
  </button>
</template>

<script setup>
import { defineAsyncComponent, onMounted, ref, onUnmounted } from "vue";

const MainCard = defineAsyncComponent(() => import("./views/MainCard.vue"));
const Loading = defineAsyncComponent(() => import("./components/Loading.vue"));

let theme = ref(localStorage.getItem("theme") || "light");
let showLoading = ref(true);
document.body.style.overflow = "hidden";

const incrementVisitCount = () => {
  const visits = localStorage.getItem("visitCount");
  const count = visits ? parseInt(visits) + 1 : 1;
  localStorage.setItem("visitCount", count.toString());
};

const handleKeydown = (e) => {
  if (e.key === "t" || e.key === "T") {
    changeTheme();
  }
};

onMounted(() => {
  document.body.setAttribute("theme", theme.value);
  showLoading.value = false;
  setTimeout(() => {
    document.body.style.overflow = "";
  }, 300);
  
  incrementVisitCount();
  
  window.addEventListener("keydown", handleKeydown);
  
  document.documentElement.style.scrollBehavior = "smooth";
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

const changeTheme = () => {
  if (theme.value == "light") {
    theme.value = "dark";
    onTheme("dark");
  } else {
    theme.value = "light";
    onTheme("light");
  }

  console.log(theme.value);
};

const onTheme = (theme) => {
  document.body.setAttribute("theme", theme);
  localStorage.setItem("theme", theme);
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
