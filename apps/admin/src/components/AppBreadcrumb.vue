<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const LABEL_MAP: Record<string, string> = {
  dashboard: '仪表盘',
  config: '配置管理',
  personal: '个人信息',
  links: '快捷链接',
  techs: '技术栈',
  todos: 'ToDo',
  typewriter: '打字机',
  account: '账号设置',
  audit: '操作日志',
}

const items = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return paths.map((p, i) => ({
    title: LABEL_MAP[p] || p,
    path: '/' + paths.slice(0, i + 1).join('/'),
    isLast: i === paths.length - 1,
  }))
})
</script>

<template>
  <div class="ab-wrap">
    <span class="ab-home">🏠</span>
    <template v-for="(item, i) in items" :key="i">
      <span class="ab-sep">/</span>
      <span v-if="item.isLast" class="ab-current">{{ item.title }}</span>
      <router-link v-else :to="item.path" class="ab-link">{{ item.title }}</router-link>
    </template>
  </div>
</template>

<style scoped>
.ab-wrap {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: #8c8c8c;
}

.ab-home {
  font-size: 0.9rem;
  line-height: 1;
}

.ab-sep {
  color: #d9d9d9;
}

.ab-link {
  color: #8c8c8c;
  text-decoration: none;
  transition: color 0.2s;
}

.ab-link:hover {
  color: #1677ff;
}

.ab-current {
  color: #262626;
  font-weight: 500;
}
</style>
