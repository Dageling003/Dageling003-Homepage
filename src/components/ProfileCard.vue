<template>
  <div class="profileCard">
    <p>你好鸭，很高兴认识你👋</p>
    <p>
      我叫
      <b>{{ config.name }}</b>
      （{{ config.age }}年的 <b class="zodiac">{{ config.zodiac }}</b
      >）
    </p>
    <p>
      是一名
      <span v-for="(i, index) in config.professions" :key="index">
        <b>{{ i }}</b>
        <span v-if="index < config.professions.length - 1">、</span>
      </span>
    </p>

    <h3>我的一些技术栈🫡</h3>
    <TechStack :tech-stack="techStack" />
  </div>
</template>

<script setup>
import TechStack from './TechStack.vue';

defineProps({
  config: {
    type: Object,
    required: true,
  },
  techStack: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.profileCard {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.profileCard p {
  margin: 0;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.profileCard h3 {
  margin: 0.75rem 0 0.5rem 0;
  font-size: 16px;
  color: #333;
}

.profileCard b {
  color: #ff6b6b;
}

.zodiac {
  color: #4ecdc4;
}
</style>
