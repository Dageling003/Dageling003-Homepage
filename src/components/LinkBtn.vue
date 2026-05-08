<template>
  <a
    class="linkBtn hover"
    :href="url ? url : '#'"
    target="_blank"
    :style="{ background: color }"
  >
    <Icon :icon="icon" width="36" height="36" />
    <span>{{ text }}</span>
  </a>
</template>
<script setup>
import { Icon } from "@iconify/vue";

const props = defineProps({
  icon: String,
  text: String,
  color: String,
  url: String,
});
</script>
<style>
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

  & span {
    margin-left: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
