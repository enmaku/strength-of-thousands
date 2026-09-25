<template>
  <q-page class="rules-page column" :style-fn="pageFillStyle">
    <div v-if="$q.screen.xs" class="col-auto rules-doc-select">
      <q-select
        :model-value="selectedDocId"
        :options="docSelectOptions"
        emit-value
        map-options
        dense
        outlined
        options-dense
        behavior="menu"
        :clearable="false"
        aria-label="Rules handout"
        @update:model-value="onDocSelect"
      />
    </div>

    <div
      class="col rules-body"
      :class="$q.screen.xs ? 'column' : 'row no-wrap'"
    >
      <aside
        v-if="$q.screen.gt.xs"
        class="rules-sidebar"
        :class="{ 'rules-sidebar--collapsed': !ui.sidebarOpen }"
      >
        <div class="rules-sidebar__header">
          <div v-if="ui.sidebarOpen" class="rules-sidebar__title">Rules</div>
          <div class="rules-sidebar__header-actions">
            <q-btn
              flat
              dense
              round
              size="sm"
              color="primary"
              :icon="ui.sidebarOpen ? 'chevron_left' : 'chevron_right'"
              :aria-label="ui.sidebarOpen ? 'Hide rules list' : 'Show rules list'"
              @click="ui.toggleSidebar()"
            />
          </div>
        </div>
        <q-scroll-area v-show="ui.sidebarOpen" class="rules-sidebar__scroll">
          <q-list dense padding class="rules-sidebar__list">
            <q-item
              v-for="doc in docs"
              :key="doc.id"
              v-ripple
              clickable
              :active="selectedDocId === doc.id"
              active-class="rules-sidebar__item--active"
              @click="selectDoc(doc.id)"
            >
              <q-item-section>
                <q-item-label>{{ doc.title }}</q-item-label>
                <q-item-label caption>{{ doc.caption }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </aside>

      <div class="col rules-pane column">
        <iframe
          v-if="selectedDoc"
          :key="selectedDoc.id"
          class="col rules-frame"
          :src="selectedDoc.href"
          :title="selectedDoc.title"
        />
        <div v-else class="col row flex-center q-pa-xl">
          <q-banner class="bg-grey-2" rounded>
            No published rules handouts yet.
          </q-banner>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { getPublishedPlayerRules } from '../domain/playerRules.js'
import { useRulesUiStore } from '../stores/rules-ui.js'

const ui = useRulesUiStore()
const docs = getPublishedPlayerRules()

function pageFillStyle(offset, height) {
  const filled = `${height - offset}px`
  return {
    height: filled,
    minHeight: filled,
    maxHeight: filled,
  }
}

const selectedDocId = computed(() => ui.selectedDocId)

const selectedDoc = computed(
  () => docs.find((doc) => doc.id === selectedDocId.value) ?? null,
)

const docSelectOptions = computed(() =>
  docs.map((doc) => ({
    label: doc.title,
    value: doc.id,
  })),
)

function selectDoc(docId) {
  if (!docId || !docs.some((doc) => doc.id === docId)) return
  ui.setSelectedDocId(docId)
}

function onDocSelect(docId) {
  selectDoc(docId)
}

onMounted(() => {
  if (docs.length === 0) {
    ui.setSelectedDocId(null)
    return
  }
  if (!docs.some((doc) => doc.id === ui.selectedDocId)) {
    ui.setSelectedDocId(docs[0].id)
  }
})
</script>

<style scoped>
.rules-page {
  padding: 0;
}

.rules-body {
  min-height: 0;
  min-width: 0;
}

.rules-doc-select {
  padding: 0.75rem 1rem;
  background: var(--sot-parchment-light);
  border-bottom: 1px solid var(--sot-border);
}

.rules-sidebar {
  width: 14.5rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--sot-border);
  background: var(--sot-parchment-light);
  color: var(--sot-ink);
  transition: width 0.2s ease;
}

.rules-sidebar--collapsed {
  width: 2.75rem;
}

.rules-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.85rem 0.75rem 0.7rem;
  flex-shrink: 0;
  border-bottom: 1px solid var(--sot-border);
  background: transparent;
}

.rules-sidebar--collapsed .rules-sidebar__header {
  justify-content: center;
  padding-inline: 0.35rem;
}

.rules-sidebar__header-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.rules-sidebar__title {
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--sot-teal);
}

.rules-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.rules-sidebar__scroll :deep(.q-scrollarea__thumb) {
  background: var(--sot-border);
  opacity: 0.75;
}

.rules-sidebar__list :deep(.q-item) {
  color: var(--sot-ink);
  min-height: 2.75rem;
  border-radius: 0.25rem;
  margin-inline: 0.35rem;
}

.rules-sidebar__list :deep(.q-item:hover) {
  background: var(--sot-teal-soft);
}

.rules-sidebar__item--active {
  background: var(--sot-teal) !important;
  color: var(--sot-parchment-light) !important;
  font-weight: 500;
}

.rules-sidebar__item--active :deep(.q-item__section) {
  color: inherit;
}

.rules-sidebar__item--active :deep(.q-item__label--caption) {
  color: rgba(252, 242, 209, 0.75);
}

.rules-pane {
  min-width: 0;
  min-height: 0;
}

.rules-frame {
  width: 100%;
  height: 100%;
  border: 0;
  background: var(--sot-parchment-light);
}
</style>
