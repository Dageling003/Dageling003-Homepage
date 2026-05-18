<template>
  <div class="todoList">
    <div v-for="(i, index) in todoList" :key="index" class="todoItem">
      <Icon :icon="i.checked ? 'lets-icons:check-ring' : 'gg:radio-check'" width="24" height="24" />
      <span v-if="i.checked">
        <del>{{ i.text }}</del>
      </span>
      <span v-else>
        {{ i.text }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue';

defineProps({
  todoList: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.todoList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.todoItem {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 14px;
  color: #333;

  & span {
    flex: 1;
  }

  & del {
    color: #999;
    text-decoration: line-through;
  }
}
</style>
