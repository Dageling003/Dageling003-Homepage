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
    <router-link to="/dashboard" class="ab-home" aria-label="首页">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 7L8 2l6 5v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z" />
        <path d="M6 14V9h4v5" />
      </svg>
    </router-link>
    <template v-for="(item, i) in items" :key="i">
      <span class="ab-sep" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3l5 5-5 5" />
        </svg>
      </span>
      <span v-if="item.isLast" class="ab-current">{{ item.title }}</span>
      <router-link v-else :to="item.path" class="ab-link">{{ item.title }}</router-link>
    </template>
  </div>
</template>

<style scoped>
.ab-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.86rem;
  color: var(--admin-text-secondary);
  letter-spacing: -0.005em;
  min-width: 0;
}

.ab-home {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--admin-material-thin);
  border: 1px solid var(--admin-hairline);
  color: var(--admin-text-secondary);
  transition:
    background-color var(--admin-duration-fast) var(--admin-ease-out),
    color var(--admin-duration-fast) var(--admin-ease-out),
    transform var(--admin-duration-medium) var(--admin-ease-spring);
  flex-shrink: 0;
}

.ab-home:hover {
  color: var(--admin-primary);
  background: var(--admin-primary-softer);
  transform: translate3d(0, -1px, 0);
}

.ab-sep {
  display: inline-flex;
  align-items: center;
  color: var(--admin-text-tertiary);
  opacity: 0.65;
  flex-shrink: 0;
}

.ab-link {
  color: var(--admin-text-secondary);
  text-decoration: none;
  padding: 2px 6px;
  border-radius: 6px;
  transition:
    color var(--admin-duration-fast) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
  white-space: nowrap;
}

.ab-link:hover {
  color: var(--admin-primary);
  background: var(--admin-primary-softer);
}

.ab-current {
  color: var(--admin-text);
  font-weight: 600;
  padding: 2px 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
