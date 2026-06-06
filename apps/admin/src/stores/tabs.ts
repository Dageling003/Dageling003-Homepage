import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface TabItem {
  key: string
  title: string
  path: string
  closable: boolean
}

export const useTabStore = defineStore('tab', () => {
  const tabs = ref<TabItem[]>([
    { key: 'dashboard', title: '仪表盘', path: '/dashboard', closable: false },
  ])
  const activeKey = ref('dashboard')

  const activeTab = computed(() => tabs.value.find(t => t.key === activeKey.value))

  function addTab(tab: TabItem) {
    if (!tabs.value.some(t => t.key === tab.key)) {
      tabs.value.push(tab)
    }
    activeKey.value = tab.key
  }

  function closeTab(key: string) {
    const idx = tabs.value.findIndex(t => t.key === key)
    if (idx === -1 || !tabs.value[idx].closable) return
    tabs.value.splice(idx, 1)
    if (activeKey.value === key) {
      const target = tabs.value[Math.min(idx, tabs.value.length - 1)]
      activeKey.value = target?.key || ''
    }
  }

  function closeOtherTabs(key: string) {
    tabs.value = tabs.value.filter(t => t.key === key || !t.closable)
    activeKey.value = key
  }

  function setActiveKey(key: string) {
    activeKey.value = key
  }

  function closeAllTabs() {
    const home = tabs.value.find(t => !t.closable)
    tabs.value = tabs.value.filter(t => !t.closable)
    if (home) activeKey.value = home.key
  }

  return { tabs, activeKey, activeTab, addTab, closeTab, closeOtherTabs, closeAllTabs, setActiveKey }
})
