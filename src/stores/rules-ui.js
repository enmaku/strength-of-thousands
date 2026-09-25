import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'

const STORAGE_KEY = 'sot-rules-ui'

function readPersisted() {
  try {
    const saved = LocalStorage.getItem(STORAGE_KEY)
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export const useRulesUiStore = defineStore('rulesUi', {
  state: () => {
    const saved = readPersisted()
    return {
      selectedDocId: saved.selectedDocId ?? null,
      sidebarOpen: saved.sidebarOpen !== false,
    }
  },

  actions: {
    persist() {
      LocalStorage.set(STORAGE_KEY, {
        selectedDocId: this.selectedDocId,
        sidebarOpen: this.sidebarOpen,
      })
    },

    setSelectedDocId(docId) {
      this.selectedDocId = docId
      this.persist()
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
      this.persist()
    },
  },
})
