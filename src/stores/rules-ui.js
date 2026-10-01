import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'

const STORAGE_KEY = 'sot-rules-ui'

function readPersisted() {
  try {
    const saved = LocalStorage.getItem(STORAGE_KEY)
    if (!saved || typeof saved !== 'object') return {}
    if (!Object.prototype.hasOwnProperty.call(saved, 'sidebarOpen')) return saved
    const rest = { ...saved }
    delete rest.sidebarOpen
    LocalStorage.set(STORAGE_KEY, rest)
    return rest
  } catch {
    return {}
  }
}

export const useRulesUiStore = defineStore('rulesUi', {
  state: () => {
    const saved = readPersisted()
    return {
      selectedDocId: saved.selectedDocId ?? null,
    }
  },

  actions: {
    persist() {
      LocalStorage.set(STORAGE_KEY, {
        selectedDocId: this.selectedDocId,
      })
    },

    setSelectedDocId(docId) {
      this.selectedDocId = docId
      this.persist()
    },
  },
})
