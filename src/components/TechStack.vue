<template>
  <div class="techStack">
    <div v-for="(i, index) in techStack" :key="index" class="techItem" :data-name="i.name">
      <Icon :icon="i.icon" width="40" height="40" />
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  techStack: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.techStack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.techItem {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: default;

  &:hover {
    background: #e0e0e0;
    transform: translateY(-2px);
  }

  &::after {
    content: attr(data-name);
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: #666;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::after {
    opacity: 1;
  }
}
</style>
