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
.at-wrap {
  position: relative;
  background: var(--admin-bg-card, #fff);
  border-bottom: 1px solid var(--admin-border, #f0f0f0);
  user-select: none;
}

.at-scroll {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 0;
}

.at-scroll::-webkit-scrollbar {
  display: none;
}

.at-tab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  font-size: 0.82rem;
  color: var(--admin-text-secondary, #595959);
  border-right: 1px solid var(--admin-border, #f0f0f0);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}

.at-tab:hover {
  background: var(--admin-hover, #fafafa);
  color: #1677ff;
}

.at-tab.active {
  color: #1677ff;
  background: var(--admin-bg-card, #fff);
}

.at-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #1677ff;
}

.at-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  font-size: 0.6rem;
  border-radius: 50%;
  opacity: 0;
  transition: all 0.2s;
  line-height: 1;
}

.at-tab:hover .at-close {
  opacity: 0.6;
}

.at-close:hover {
  opacity: 1 !important;
  background: rgba(0, 0, 0, 0.06);
}

/* Context menu */
.at-context {
  position: fixed;
  z-index: 1050;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  padding: 0.3rem 0;
  min-width: 120px;
}

.at-context-item {
  padding: 0.4rem 1rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: background 0.15s;
}

.at-context-item:hover {
  background: #f5f5f5;
  color: #1677ff;
}

.at-context-overlay {
  position: fixed;
  inset: 0;
  z-index: 1049;
}
</style>
