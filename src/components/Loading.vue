<template>
  <div class="loadBox">
    <div id="loader">
      <div id="shadow"></div>
      <div id="box"></div>
    </div>
  </div>
</template>

<script setup>
// 这个组件不需要任何 JavaScript 逻辑
</script>

<style scoped>
.loadBox {
  width: 100%;
  height: 100%;
  background: var(--loading-background);
  position: fixed;
  z-index: 100;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;
}

.loadBox.fade-out {
  opacity: 0;
  visibility: hidden;
}

#loader {
  position: absolute;
  top: calc(50% - 20px);
  left: calc(50% - 20px);
}
@keyframes loader {
  0% {
    left: -100px;
  }
  100% {
    left: 110%;
  }
}
#box {
  width: 50px;
  height: 50px;
  background: #fff;
  animation: animate 0.5s linear infinite;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 3px;
}
@keyframes animate {
  17% {
    border-bottom-right-radius: 3px;
  }
  25% {
    transform: translateY(9px) rotate(22.5deg);
  }
  50% {
    transform: translateY(18px) scale(1, 0.9) rotate(45deg);
    border-bottom-right-radius: 40px;
  }
  75% {
    transform: translateY(9px) rotate(67.5deg);
  }
  100% {
    transform: translateY(0) rotate(90deg);
  }
}
#shadow {
  width: 50px;
  height: 5px;
  background: #000;
  opacity: 0.1;
  position: absolute;
  top: 59px;
  left: 0;
  border-radius: 50%;
  animation: shadow 0.5s linear infinite;
}
@keyframes shadow {
  50% {
    transform: scale(1.2, 1);
  }
}
</style>
