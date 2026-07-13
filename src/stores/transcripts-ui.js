import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'

const STORAGE_KEY = 'sot-transcripts-ui'

function readPersisted() {
  try {
    const saved = LocalStorage.getItem(STORAGE_KEY)
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

function normalizeScrollEntry(entry) {
  if (entry == null) return { scrollTop: 0, index: 0, offset: 0 }
  if (typeof entry === 'number') return { scrollTop: entry, index: 0, offset: 0 }
  return {
    scrollTop: typeof entry.scrollTop === 'number' ? entry.scrollTop : 0,
    index: typeof entry.index === 'number' ? entry.index : 0,
    offset: typeof entry.offset === 'number' ? entry.offset : 0,
  }
}

function normalizeScrollBySession(raw) {
  if (!raw || typeof raw !== 'object') return {}
  return Object.fromEntries(
    Object.entries(raw).map(([sessionId, entry]) => [
      sessionId,
      normalizeScrollEntry(entry),
    ]),
  )
}

export const useTranscriptsUiStore = defineStore('transcriptsUi', {
  state: () => {
    const saved = readPersisted()
    return {
      selectedSessionId: saved.selectedSessionId ?? null,
      sortDirection: saved.sortDirection === 'asc' ? 'asc' : 'desc',
      sidebarOpen: saved.sidebarOpen !== false,
      scrollBySession: normalizeScrollBySession(saved.scrollBySession),
    }
  },

  actions: {
    persist() {
      LocalStorage.set(STORAGE_KEY, {
        selectedSessionId: this.selectedSessionId,
        sortDirection: this.sortDirection,
        sidebarOpen: this.sidebarOpen,
        scrollBySession: this.scrollBySession,
      })
    },

    setSelectedSessionId(sessionId) {
      this.selectedSessionId = sessionId
      this.persist()
    },

    toggleSortDirection() {
      this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc'
      this.persist()
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
      this.persist()
    },

    scrollPlaceFor(sessionId) {
      return normalizeScrollEntry(sessionId ? this.scrollBySession[sessionId] : null)
    },

    setScrollPlace(sessionId, place) {
      if (!sessionId) return
      const next = normalizeScrollEntry(place)
      const prev = this.scrollBySession[sessionId]
      if (
        prev &&
        prev.scrollTop === next.scrollTop &&
        prev.index === next.index &&
        prev.offset === next.offset
      ) {
        return
      }
      this.scrollBySession = {
        ...this.scrollBySession,
        [sessionId]: next,
      }
      this.persist()
    },
  },
})
