<script setup lang="ts">
import { useTabStore } from '@/stores/tabs'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const tabStore = useTabStore()
const router = useRouter()

const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextTabKey = ref('')

function handleTabClick(key: string) {
  const tab = tabStore.tabs.find(t => t.key === key)
  if (tab) {
    tabStore.setActiveKey(key)
    router.push(tab.path)
  }
}

function handleTabRemove(key: string) {
  const tab = tabStore.tabs.find(t => t.key === key)
  if (!tab?.closable) return

  const currentActive = tabStore.activeKey
  tabStore.closeTab(key)

  if (currentActive === key) {
    const next = tabStore.activeTab
    if (next) router.push(next.path)
  }
}

function handleContextMenu(e: MouseEvent, key: string) {
  e.preventDefault()
  contextMenuPos.value = { x: e.clientX, y: e.clientY }
  contextTabKey.value = key
  contextMenuVisible.value = true
}

function closeOthers() {
  const key = contextTabKey.value
  const currentPath = tabStore.tabs.find(t => t.key === key)?.path
  tabStore.closeOtherTabs(key)
  if (currentPath) router.push(currentPath)
  contextMenuVisible.value = false
}

function closeAll() {
  const home = tabStore.tabs[0]
  tabStore.closeAllTabs()
  if (home) router.push(home.path)
  contextMenuVisible.value = false
}

function closeClickOutside() {
  contextMenuVisible.value = false
}
</script>

<template>
  <div class="at-wrap" @click.self="closeClickOutside">
    <div class="at-scroll">
      <div
        v-for="tab in tabStore.tabs"
        :key="tab.key"
        class="at-tab"
        :class="{ active: tab.key === tabStore.activeKey }"
        @click="handleTabClick(tab.key)"
        @contextmenu="(e: MouseEvent) => handleContextMenu(e, tab.key)"
      >
        <span class="at-title">{{ tab.title }}</span>
        <span
          v-if="tab.closable"
          class="at-close"
          @click.stop="handleTabRemove(tab.key)"
        >✕</span>
      </div>
    </div>

    <!-- Right-click context menu -->
    <Teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="at-context"
        :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
      >
        <div class="at-context-item" @click="closeOthers">关闭其他</div>
        <div class="at-context-item" @click="closeAll">关闭全部</div>
      </div>
      <div
        v-if="contextMenuVisible"
        class="at-context-overlay"
        @click="closeClickOutside"
      />
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================================================
   AppTab — Apple pill tabs, hairline strip, glass context menu
   ============================================================ */
.at-wrap {
  position: relative;
  background: var(--admin-material-thin);
  backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--admin-saturation));
  border-bottom: 1px solid var(--admin-hairline);
  user-select: none;
}

.at-scroll {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 6px 10px;
  gap: 4px;
}

.at-scroll::-webkit-scrollbar { display: none; }

.at-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--admin-text-secondary);
  border-radius: 999px;
  cursor: pointer;
  transition:
    background-color var(--admin-duration-fast) var(--admin-ease-out),
    color var(--admin-duration-fast) var(--admin-ease-out),
    transform var(--admin-duration-medium) var(--admin-ease-spring);
  white-space: nowrap;
  position: relative;
  border: 1px solid transparent;
}

.at-tab:hover {
  color: var(--admin-text);
  background: var(--admin-material-thin);
}

.at-tab.active {
  color: var(--admin-primary);
  background: var(--admin-primary-soft);
  border-color: color-mix(in srgb, var(--admin-primary) 22%, transparent);
  font-weight: 600;
}

.at-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05rem;
  height: 1.05rem;
  font-size: 0.62rem;
  border-radius: 50%;
  opacity: 0;
  transition:
    opacity var(--admin-duration-fast) var(--admin-ease-out),
    background-color var(--admin-duration-fast) var(--admin-ease-out);
  line-height: 1;
  color: var(--admin-text-tertiary);
}

.at-tab:hover .at-close { opacity: 0.75; }

.at-close:hover {
  opacity: 1 !important;
  background: var(--admin-hairline-strong);
  color: var(--admin-text);
}

.at-tab.active .at-close { opacity: 0.85; color: var(--admin-primary); }

/* ---------- Context menu — glass with hairline ---------- */
.at-context {
  position: fixed;
  z-index: 1050;
  background: var(--admin-material-thick);
  backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  -webkit-backdrop-filter: blur(var(--admin-blur)) saturate(var(--admin-saturation));
  border: 1px solid var(--admin-hairline);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-2);
  padding: 4px;
  min-width: 130px;
  color: var(--admin-text);
  animation: at-ctx-in var(--admin-duration-medium) var(--admin-ease-spring);
  transform-origin: top left;
}

@keyframes at-ctx-in {
  from { opacity: 0; transform: translate3d(0, -4px, 0) scale(0.96); }
  to   { opacity: 1; transform: translate3d(0, 0, 0)      scale(1); }
}

.at-context-item {
  padding: 0.4rem 0.75rem;
  font-size: 0.82rem;
  cursor: pointer;
  border-radius: var(--admin-radius-sm);
  transition: background-color var(--admin-duration-fast) var(--admin-ease-out),
              color var(--admin-duration-fast) var(--admin-ease-out);
  color: var(--admin-text);
}

.at-context-item:hover {
  background: var(--admin-primary-softer);
  color: var(--admin-primary);
}

.at-context-overlay {
  position: fixed;
  inset: 0;
  z-index: 1049;
}
</style>
