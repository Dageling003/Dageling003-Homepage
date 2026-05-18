<template>
  <a
    class="linkBtn hover"
    :href="url ? url : '#'"
    target="_blank"
    :style="{ background: color }"
    tabindex="0"
    @keydown.enter="handleKeydown"
    @keydown.space="handleKeydown"
  >
    <Icon :icon="icon" width="36" height="36" />
    <span>{{ text }}</span>
  </a>
</template>
<script setup>
import { Icon } from '@iconify/vue';

const props = defineProps({
  icon: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#333',
  },
  url: {
    type: String,
    default: '',
  },
});

const handleKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (props.url) {
      window.open(props.url, '_blank');
    }
  }
};
</script>
<style scoped>
.linkBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  height: 40px;
  border-radius: 16px;
  padding: 0.5rem 0.7rem;
  margin: 0.5rem;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  color: #fff;
  outline: none;

  & span {
    margin-left: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(255, 179, 179, 0.3);
  }
}
</style>
