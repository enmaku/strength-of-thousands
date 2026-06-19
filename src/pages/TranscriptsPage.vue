<template>
  <q-page class="transcript-page">
    <div v-if="catalogLoading" class="row justify-center q-pa-xl">
      <q-spinner size="2rem" />
    </div>

    <div v-else class="transcript-layout">
      <aside
        class="transcript-sidebar"
        :class="{ 'transcript-sidebar--collapsed': !sidebarOpen }"
      >
        <div class="transcript-sidebar__header">
          <div v-if="sidebarOpen" class="transcript-sidebar__title">Sessions</div>
          <div class="transcript-sidebar__header-actions">
            <q-btn
              v-if="sidebarOpen"
              flat
              dense
              round
              size="sm"
              color="primary"
              class="transcript-sidebar__sort-btn"
              :icon="sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'"
              :aria-label="
                sortDirection === 'desc'
                  ? 'Sort sessions oldest first'
                  : 'Sort sessions newest first'
              "
              @click="toggleSortDirection"
            />
            <q-btn
              flat
              dense
              round
              size="sm"
              color="primary"
              :icon="sidebarOpen ? 'chevron_left' : 'chevron_right'"
              :aria-label="sidebarOpen ? 'Hide sessions' : 'Show sessions'"
              @click="sidebarOpen = !sidebarOpen"
            />
          </div>
        </div>
        <q-scroll-area v-show="sidebarOpen" class="transcript-sidebar__scroll">
          <q-list dense padding class="transcript-sidebar__list">
            <q-item
              v-for="session in sortedSessions"
              :key="session.sessionId"
              v-ripple
              clickable
              :active="isSameTranscriptSession(selectedSession, session)"
              active-class="transcript-sidebar__item--active"
              @click="selectSession(session)"
            >
              <q-item-section>{{ session.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </aside>

      <main class="transcript-main column q-gutter-md">
        <q-banner v-if="error" class="bg-negative text-white" rounded>
          {{ error }}
        </q-banner>

        <div v-if="transcriptLoading" class="row justify-center q-pa-xl">
          <q-spinner size="2rem" />
        </div>

        <template v-else-if="segments.length > 0">
          <div class="transcript-feed">
          <template v-for="item in feedItems" :key="item.key">
            <div v-if="item.type === 'deleted'" class="transcript-deleted-slot">
              <q-expansion-item
                dense
                switch-toggle-side
                expand-icon-class="transcript-deleted-expand-icon"
                header-class="transcript-deleted-header"
                class="transcript-deleted-expansion"
                :label="deletedItemsLabel(item.items.length)"
              >
                <div class="transcript-deleted-body">
                  <div
                    v-for="deleted in item.items"
                    :key="deleted.segmentId"
                    class="transcript-row"
                    :class="
                      isGm(deleted.speaker)
                        ? 'transcript-row--sent'
                        : 'transcript-row--received'
                    "
                  >
                    <div class="transcript-row__content">
                      <div class="transcript-row__message">
                        <div
                          v-if="isGm(deleted.speaker)"
                          class="transcript-message-actions"
                        >
                          <button
                            type="button"
                            class="transcript-restore-btn"
                            aria-label="Restore message"
                            :disabled="restoringSegmentId === deleted.segmentId"
                            @click.stop="restoreSegment(deleted)"
                          >
                            <q-icon name="restore" size="xs" color="positive" />
                          </button>
                        </div>
                        <q-chat-message
                          :sent="isGm(deleted.speaker)"
                          :text="[deleted.text]"
                          :bg-color="deletedBubbleColor(deleted.speaker)"
                          :text-color="deletedBubbleTextColor(deleted.speaker)"
                        >
                          <template #name>
                            <span :style="{ color: deletedSpeakerColor(deleted.speaker) }">
                              {{ speakerLabel(deleted) }}
                            </span>
                          </template>
                        </q-chat-message>
                        <div
                          v-if="!isGm(deleted.speaker)"
                          class="transcript-message-actions"
                        >
                          <button
                            type="button"
                            class="transcript-restore-btn"
                            aria-label="Restore message"
                            :disabled="restoringSegmentId === deleted.segmentId"
                            @click.stop="restoreSegment(deleted)"
                          >
                            <q-icon name="restore" size="xs" color="positive" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </q-expansion-item>
            </div>

            <div
              v-else
              class="transcript-row"
              :class="
                isGm(item.segment.speaker)
                  ? 'transcript-row--sent'
                  : 'transcript-row--received'
              "
            >
            <div class="transcript-row__content">
              <div class="transcript-row__message">
                <div
                  v-if="gmMode && isGm(item.segment.speaker)"
                  class="transcript-message-actions"
                >
                  <button
                    type="button"
                    class="transcript-delete-btn"
                    aria-label="Delete message"
                    :disabled="deletingSegmentId === item.segment.id"
                    @click.stop="confirmDeleteSegment(item.segment)"
                  >
                    <q-icon name="delete" size="xs" color="negative" />
                  </button>
                  <button
                    type="button"
                    class="transcript-split-btn"
                    aria-label="Split message"
                    :disabled="splittingSegmentId === item.segment.id"
                    @click.stop="openSplitDialog(item.segment)"
                  >
                    <q-icon name="call_split" size="xs" color="grey-8" />
                  </button>
                  <button
                    v-if="hasChangelogChange(item.segment.id)"
                    type="button"
                    class="transcript-changelog-btn"
                    :aria-expanded="isOriginalExpanded(item.segment.id)"
                    aria-label="Show original transcript"
                    @click.stop="toggleOriginal(item.segment.id)"
                  >
                    <q-icon name="edit_note" size="xs" color="grey-7" />
                  </button>
                </div>
                <div
                  class="transcript-editable-message"
                  :class="{ 'transcript-editable-message--gm': gmMode }"
                  @click="gmMode && openEditDialog(item.segment)"
                >
                  <q-chat-message
                    :sent="isGm(item.segment.speaker)"
                    :text="[item.segment.text]"
                    :bg-color="bubbleColor(item.segment.speaker)"
                    :text-color="bubbleTextColor(item.segment.speaker)"
                  >
                    <template #name>
                      <span :style="{ color: speakerColor(item.segment.speaker) }">
                        {{ speakerLabel(item.segment) }}
                      </span>
                    </template>
                  </q-chat-message>
                </div>
                <div
                  v-if="gmMode && !isGm(item.segment.speaker)"
                  class="transcript-message-actions"
                >
                  <button
                    type="button"
                    class="transcript-delete-btn"
                    aria-label="Delete message"
                    :disabled="deletingSegmentId === item.segment.id"
                    @click.stop="confirmDeleteSegment(item.segment)"
                  >
                    <q-icon name="delete" size="xs" color="negative" />
                  </button>
                  <button
                    type="button"
                    class="transcript-split-btn"
                    aria-label="Split message"
                    :disabled="splittingSegmentId === item.segment.id"
                    @click.stop="openSplitDialog(item.segment)"
                  >
                    <q-icon name="call_split" size="xs" color="grey-8" />
                  </button>
                  <button
                    v-if="hasChangelogChange(item.segment.id)"
                    type="button"
                    class="transcript-changelog-btn"
                    :aria-expanded="isOriginalExpanded(item.segment.id)"
                    aria-label="Show original transcript"
                    @click.stop="toggleOriginal(item.segment.id)"
                  >
                    <q-icon name="edit_note" size="xs" color="grey-7" />
                  </button>
                </div>
              </div>

              <q-slide-transition>
                <div
                  v-show="isOriginalExpanded(item.segment.id)"
                  class="transcript-original"
                >
                  <q-chat-message
                    :sent="isGm(item.segment.speaker)"
                    bg-color="grey-4"
                    text-color="grey-10"
                  >
                    <template #name>
                      <span class="text-grey-8">{{ speakerLabel(item.segment) }}</span>
                    </template>
                    <!-- eslint-disable-next-line vue/no-v-html -->
                    <div
                      class="transcript-diff-body"
                      v-html="diffToHtml(item.segment.sourceText, item.segment.text)"
                    />
                  </q-chat-message>
                </div>
              </q-slide-transition>
            </div>
          </div>
          </template>
        </div>
        </template>

        <q-banner v-else-if="selectedSession" class="bg-grey-2" rounded>
          No transcript content for {{ selectedSession.label }}.
        </q-banner>
      </main>
    </div>

    <q-dialog v-if="gmMode" v-model="splitDialogOpen" persistent>
      <q-card style="min-width: 24rem; width: min(40rem, 90vw)">
        <q-card-section>
          <div class="text-h6">Split message</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Move part of the upper text into the lower field. Both parts must be non-empty.
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none column q-gutter-sm">
          <q-input
            v-model="splitFirstText"
            type="textarea"
            autogrow
            autofocus
            label="First message"
            :rules="[(value) => !!value?.trim() || 'First part is required']"
          />
          <q-input
            v-model="splitSecondText"
            type="textarea"
            autogrow
            label="Second message"
            :rules="[(value) => !!value?.trim() || 'Second part is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeSplitDialog" />
          <q-btn
            flat
            label="Save"
            color="primary"
            :disable="!splitFirstText.trim() || !splitSecondText.trim() || savingSplit"
            :loading="savingSplit"
            @click="saveSegmentSplit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-if="gmMode" v-model="editDialogOpen" persistent>
      <q-card style="min-width: 24rem; width: min(40rem, 90vw)">
        <q-card-section>
          <div class="text-h6">Edit message</div>
        </q-card-section>
        <q-card-section class="q-pt-none column q-gutter-sm">
          <q-select
            v-model="editSpeaker"
            :options="filteredSpeakerOptions"
            label="Speaker"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            new-value-mode="add-unique"
            hint="Type a new speaker and press Enter, or pick from the list"
            :rules="[(value) => !!value?.trim() || 'Speaker is required']"
            @filter="filterSpeakerOptions"
            @new-value="addSpeakerOption"
          >
            <template #no-option>
              <q-item
                v-if="speakerFilterInput.trim()"
                v-close-popup
                clickable
                @click="addSpeakerFromFilter"
              >
                <q-item-section>Add "{{ speakerFilterInput.trim() }}"</q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-model="editVoice"
            :options="filteredVoiceOptions"
            label="Voice"
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            new-value-mode="add-unique"
            hint="Type a new voice and press Enter, or pick from the list"
            :rules="[(value) => !!value?.trim() || 'Voice is required']"
            @filter="filterVoiceOptions"
            @new-value="addVoiceOption"
          >
            <template #no-option>
              <q-item
                v-if="voiceFilterInput.trim()"
                v-close-popup
                clickable
                @click="addVoiceFromFilter"
              >
                <q-item-section>Add "{{ voiceFilterInput.trim() }}"</q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input
            v-model="editText"
            type="textarea"
            autogrow
            autofocus
            label="Transcript text"
            :rules="[(value) => !!value?.trim() || 'Text is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeEditDialog" />
          <q-btn
            flat
            label="Save"
            color="primary"
            :disable="!editText.trim() || !editSpeaker.trim() || !editVoice.trim() || savingEdit"
            :loading="savingEdit"
            @click="saveSegmentEdit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-btn
      fab
      color="primary"
      class="transcript-assistant-fab"
      aria-label="Query transcripts with an AI assistant"
      @click="assistantDialogOpen = true"
    >
      <q-icon name="assistant" />
    </q-btn>

    <q-dialog v-model="assistantDialogOpen">
      <q-card class="transcript-assistant-dialog">
        <q-card-section>
          <div class="text-h6">Query transcripts with AI</div>
          <p class="q-mt-sm q-mb-none">
            Copy the prompt below into ChatGPT, Gemini, Claude, NotebookLM, or a similar tool.
            This will give the agent the campaign context and Hero data it needs to answer questions about the campaign.
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            :model-value="assistantContextJson"
            type="textarea"
            readonly
            outlined
            label="Assistant prompt"
            class="transcript-assistant-prompt"
            :loading="assistantContextLoading"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn
            flat
            label="Copy prompt"
            color="primary"
            icon="content_copy"
            :disable="!assistantContextJson || assistantContextLoading"
            @click="copyAssistantContext"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { isGmMode } from '../domain/mode.js'
import { diffToHtml } from '../domain/transcriptDiff.js'
import {
  buildTranscriptFeed,
  deletedItemsLabel,
  extractRemovedSegments,
} from '../domain/transcriptFeed.js'
import {
  buildTranscriptAssistantContext,
  serializeTranscriptAssistantContext,
} from '../domain/transcriptAssistantContext.js'
import {
  defaultTranscriptSession,
  isSameTranscriptSession,
  rawEditedTranscriptUrls,
  sessionPaths,
  sortTranscriptSessions,
} from '../domain/transcriptSessions.js'
import {
  defaultVoiceForSpeaker,
  formatSpeakerLabel,
  listSpeakerOptions,
  listVoiceOptions,
} from '../domain/transcriptSpeakers.js'

const GM_SPEAKER = 'Pablo'
const gmMode = isGmMode()
const $q = useQuasar()

const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

function staticUrl(path) {
  const base = pagesBase || ''
  return `${base}/${path}`.replace(/\/+/g, '/')
}

const SPEAKER_COLORS = {
  Lisa: '#2E7D32',
  Victoria: '#1565C0',
  Pablo: '#6D3711',
  Dave: '#C62828',
  Brian: '#F9A825',
}

const BUBBLE_COLORS = {
  Lisa: { bg: 'green-2', text: 'green-10' },
  Victoria: { bg: 'blue-2', text: 'blue-10' },
  Dave: { bg: 'red-2', text: 'red-10' },
  Pablo: { bg: 'brown-2', text: 'brown-10' },
  Brian: { bg: 'yellow-2', text: 'yellow-10' },
}

const DELETED_BUBBLE_COLORS = {
  Lisa: { bg: 'green-5', text: 'green-10' },
  Victoria: { bg: 'blue-5', text: 'blue-10' },
  Dave: { bg: 'red-5', text: 'red-10' },
  Pablo: { bg: 'brown-5', text: 'brown-10' },
  Brian: { bg: 'yellow-5', text: 'yellow-10' },
}

const DELETED_SPEAKER_COLORS = {
  Lisa: '#1B5E20',
  Victoria: '#0D47A1',
  Dave: '#B71C1C',
  Pablo: '#4E342E',
  Brian: '#F57F17',
}

function isGm(speaker) {
  return speaker === GM_SPEAKER
}

function speakerColor(name) {
  if (SPEAKER_COLORS[name]) return SPEAKER_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 38%)`
}

function bubbleColor(speaker) {
  return BUBBLE_COLORS[speaker]?.bg ?? 'grey-3'
}

function bubbleTextColor(speaker) {
  return BUBBLE_COLORS[speaker]?.text ?? 'grey-10'
}

function deletedBubbleColor(speaker) {
  return DELETED_BUBBLE_COLORS[speaker]?.bg ?? 'grey-5'
}

function deletedBubbleTextColor(speaker) {
  return DELETED_BUBBLE_COLORS[speaker]?.text ?? 'grey-10'
}

function deletedSpeakerColor(name) {
  if (DELETED_SPEAKER_COLORS[name]) return DELETED_SPEAKER_COLORS[name]
  return speakerColor(name)
}

const catalogLoading = ref(true)
const transcriptLoading = ref(false)
const error = ref(null)
const transcriptIndex = ref([])
const selectedSession = ref(null)
const sortDirection = ref('desc')
const sidebarOpen = ref(true)
const meta = ref(null)
const segments = ref([])
const changelog = ref(null)
const playerMap = ref(null)
const segmentMetaById = ref(new Map())
const changedSegmentIds = ref(new Set())
const expandedOriginalIds = ref(new Set())
const editDialogOpen = ref(false)
const editingSegment = ref(null)
const editText = ref('')
const editSpeaker = ref('')
const editVoice = ref('')
const extraSpeakerOptions = ref([])
const speakerFilterInput = ref('')
const filteredSpeakerOptions = ref([])
const extraVoiceOptions = ref([])
const voiceFilterInput = ref('')
const filteredVoiceOptions = ref([])
const savingEdit = ref(false)
const deletingSegmentId = ref(null)
const restoringSegmentId = ref(null)
const splitDialogOpen = ref(false)
const splittingSegment = ref(null)
const splitFirstText = ref('')
const splitSecondText = ref('')
const savingSplit = ref(false)
const splittingSegmentId = ref(null)
const assistantDialogOpen = ref(false)
const assistantContextLoading = ref(false)
const assistantSessionMetas = ref([])
const assistantPlayerMaps = ref({})
const assistantHeroSlugs = ref([])

async function copyAssistantContext() {
  if (!assistantContextJson.value) {
    $q.notify({ type: 'warning', message: 'No assistant context to copy' })
    return
  }

  try {
    await navigator.clipboard.writeText(assistantContextJson.value)
    $q.notify({
      type: 'positive',
      message: 'Copied assistant prompt. Paste into ChatGPT, Gemini, or similar.',
    })
  } catch {
    $q.notify({ type: 'negative', message: 'Could not copy JSON — select and copy manually' })
  }
}

function hasChangelogChange(segmentId) {
  return changedSegmentIds.value.has(segmentId)
}

function isOriginalExpanded(segmentId) {
  return expandedOriginalIds.value.has(segmentId)
}

function toggleOriginal(segmentId) {
  const next = new Set(expandedOriginalIds.value)
  if (next.has(segmentId)) {
    next.delete(segmentId)
  } else {
    next.add(segmentId)
  }
  expandedOriginalIds.value = next
}

function speakerLabel(segment) {
  return formatSpeakerLabel(segment.speaker, segment.voice)
}

function openEditDialog(segment) {
  editingSegment.value = segment
  editText.value = segment.text
  editSpeaker.value = segment.speaker
  editVoice.value = segment.voice
  resetSpeakerFilter()
  resetVoiceFilter()
  editDialogOpen.value = true
}

function closeEditDialog() {
  editDialogOpen.value = false
  editingSegment.value = null
  editText.value = ''
  editSpeaker.value = ''
  editVoice.value = ''
  speakerFilterInput.value = ''
  voiceFilterInput.value = ''
}

function openSplitDialog(segment) {
  splittingSegment.value = segment
  splitFirstText.value = segment.text
  splitSecondText.value = ''
  splitDialogOpen.value = true
}

function closeSplitDialog() {
  splitDialogOpen.value = false
  splittingSegment.value = null
  splitFirstText.value = ''
  splitSecondText.value = ''
}

function changedSegmentIdsFromChangelog(log) {
  return new Set(
    (log?.changes ?? []).flatMap((change) => {
      const ids = []
      if (change.segmentId != null) ids.push(change.segmentId)
      if (change.newSegmentId != null) ids.push(change.newSegmentId)
      return ids
    }),
  )
}

function syncTranscriptMutation(payload) {
  if (payload.segments) {
    segments.value = payload.segments
  }
  if (payload.changelog) {
    changelog.value = payload.changelog
    changedSegmentIds.value = changedSegmentIdsFromChangelog(payload.changelog)
  }
}

async function saveSegmentSplit() {
  const segment = splittingSegment.value
  const firstText = splitFirstText.value.trim()
  const secondText = splitSecondText.value.trim()
  if (!segment || !firstText || !secondText) return

  savingSplit.value = true
  splittingSegmentId.value = segment.id
  try {
    const res = await fetch(
      `/api/transcripts/${sessionApi.value}/segments/${segment.id}/split`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstText, secondText }),
      },
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to split message')
    }

    const payload = await res.json()
    syncTranscriptMutation(payload)

    closeSplitDialog()
    $q.notify({ type: 'positive', message: 'Message split' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    savingSplit.value = false
    splittingSegmentId.value = null
  }
}

watch(editSpeaker, (speaker, previousSpeaker) => {
  if (!editDialogOpen.value || previousSpeaker === '') return
  editVoice.value = defaultVoiceForSpeaker(speaker, playerMap.value)
})

async function saveSegmentEdit() {
  const segment = editingSegment.value
  const text = editText.value.trim()
  const speaker = editSpeaker.value.trim()
  const voice = editVoice.value.trim()
  if (!segment || !text || !speaker || !voice) return

  savingEdit.value = true
  try {
    const res = await fetch(`/api/transcripts/${sessionApi.value}/segments/${segment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speaker, voice }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to save edit')
    }

    const payload = await res.json()
    syncTranscriptMutation(payload)

    closeEditDialog()
    $q.notify({ type: 'positive', message: 'Transcript updated' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    savingEdit.value = false
  }
}

function segmentPreview(text, maxLength = 120) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

function confirmDeleteSegment(segment) {
  $q.dialog({
    title: 'Delete message?',
    message: `Remove this ${speakerLabel(segment)} line from the edited transcript?\n\n“${segmentPreview(segment.text)}”`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      flat: true,
    },
  }).onOk(() => deleteSegment(segment))
}

async function deleteSegment(segment) {
  deletingSegmentId.value = segment.id
  try {
    const res = await fetch(`/api/transcripts/${sessionApi.value}/segments/${segment.id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to delete message')
    }

    const payload = await res.json()
    syncTranscriptMutation(payload)

    const deletedSegmentId = payload.deletedSegmentId
    const nextExpanded = new Set(expandedOriginalIds.value)
    nextExpanded.delete(deletedSegmentId)
    expandedOriginalIds.value = nextExpanded

    const nextChanged = new Set(changedSegmentIds.value)
    nextChanged.delete(deletedSegmentId)
    changedSegmentIds.value = nextChanged

    $q.notify({ type: 'positive', message: 'Message deleted' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    deletingSegmentId.value = null
  }
}

async function restoreSegment(deleted) {
  restoringSegmentId.value = deleted.segmentId
  try {
    const res = await fetch(
      `/api/transcripts/${sessionApi.value}/segments/${deleted.segmentId}/restore`,
      { method: 'POST' },
    )

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to restore message')
    }

    const payload = await res.json()
    syncTranscriptMutation(payload)

    $q.notify({ type: 'positive', message: 'Message restored' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    restoringSegmentId.value = null
  }
}

const sortedSessions = computed(() =>
  sortTranscriptSessions(transcriptIndex.value, sortDirection.value),
)

const transcriptRawUrls = computed(() =>
  rawEditedTranscriptUrls(sortTranscriptSessions(transcriptIndex.value, 'asc')),
)

const assistantContextJson = computed(() => {
  if (transcriptRawUrls.value.length === 0) return ''
  return serializeTranscriptAssistantContext(
    buildTranscriptAssistantContext({
      sessions: transcriptIndex.value,
      sessionMetas: assistantSessionMetas.value,
      playerMaps: assistantPlayerMaps.value,
      heroSlugs: assistantHeroSlugs.value,
      transcriptUrls: transcriptRawUrls.value,
    }),
  )
})

const sessionBase = computed(() => {
  if (!selectedSession.value) return null
  return sessionPaths(selectedSession.value).base
})

const sessionApi = computed(() => {
  if (!selectedSession.value) return null
  return sessionPaths(selectedSession.value).api
})

const speakerOptions = computed(() =>
  listSpeakerOptions(segments.value, playerMap.value, extraSpeakerOptions.value),
)
const voiceOptions = computed(() =>
  listVoiceOptions([
    ...segments.value,
    ...extraVoiceOptions.value.map((voice) => ({ voice })),
  ]),
)

function resetSpeakerFilter() {
  speakerFilterInput.value = ''
  filteredSpeakerOptions.value = speakerOptions.value
}

function registerCustomSpeaker(speaker) {
  const trimmed = speaker?.trim()
  if (!trimmed) return null

  if (!speakerOptions.value.includes(trimmed)) {
    extraSpeakerOptions.value = [...extraSpeakerOptions.value, trimmed]
  }

  resetSpeakerFilter()
  return trimmed
}

function filterSpeakerOptions(val, update) {
  speakerFilterInput.value = val
  update(() => {
    if (!val) {
      filteredSpeakerOptions.value = speakerOptions.value
      return
    }

    const needle = val.toLowerCase()
    filteredSpeakerOptions.value = speakerOptions.value.filter((name) =>
      name.toLowerCase().includes(needle),
    )
  })
}

function addSpeakerOption(value, done) {
  const speaker = registerCustomSpeaker(value)
  if (!speaker) {
    done(false)
    return
  }

  done(speaker, 'add-unique')
}

function addSpeakerFromFilter() {
  const speaker = registerCustomSpeaker(speakerFilterInput.value)
  if (speaker) editSpeaker.value = speaker
}

function resetVoiceFilter() {
  voiceFilterInput.value = ''
  filteredVoiceOptions.value = voiceOptions.value
}

function registerCustomVoice(voice) {
  const trimmed = voice?.trim()
  if (!trimmed) return null

  if (!voiceOptions.value.includes(trimmed)) {
    extraVoiceOptions.value = [...extraVoiceOptions.value, trimmed]
  }

  resetVoiceFilter()
  return trimmed
}

function filterVoiceOptions(val, update) {
  voiceFilterInput.value = val
  update(() => {
    if (!val) {
      filteredVoiceOptions.value = voiceOptions.value
      return
    }

    const needle = val.toLowerCase()
    filteredVoiceOptions.value = voiceOptions.value.filter((voice) =>
      voice.toLowerCase().includes(needle),
    )
  })
}

function addVoiceOption(value, done) {
  const voice = registerCustomVoice(value)
  if (!voice) {
    done(false)
    return
  }

  done(voice, 'add-unique')
}

function addVoiceFromFilter() {
  const voice = registerCustomVoice(voiceFilterInput.value)
  if (voice) editVoice.value = voice
}

watch(speakerOptions, (options) => {
  if (!speakerFilterInput.value) {
    filteredSpeakerOptions.value = options
  }
})

watch(voiceOptions, (options) => {
  if (!voiceFilterInput.value) {
    filteredVoiceOptions.value = options
  }
})

const feedItems = computed(() => {
  if (!gmMode || !changelog.value) {
    return segments.value.map((segment) => ({
      type: 'segment',
      key: `segment-${segment.id}`,
      segment,
    }))
  }

  const removed = extractRemovedSegments(changelog.value, segments.value, segmentMetaById.value)
  return buildTranscriptFeed(segments.value, removed)
})

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
}

async function loadPlayerMap(campaign) {
  if (!gmMode || !campaign) {
    playerMap.value = null
    return
  }

  try {
    const res = await fetch(staticUrl(`transcripts/${campaign}/player-map.json`))
    playerMap.value = res.ok ? await res.json() : null
  } catch {
    playerMap.value = null
  }
}

async function loadAssistantSourceData() {
  const sessions = transcriptIndex.value
  if (sessions.length === 0) {
    assistantSessionMetas.value = []
    assistantPlayerMaps.value = {}
    assistantHeroSlugs.value = []
    return
  }

  assistantContextLoading.value = true

  try {
    const campaigns = [...new Set(sessions.map((session) => session.campaign))]
    const heroIndexRes = await fetch(staticUrl('heroes/index.json'))

    const [sessionMetas, playerMapPairs, heroIndex] = await Promise.all([
      Promise.all(
        sessions.map(async (session) => {
          const res = await fetch(staticUrl(`${sessionPaths(session).base}/meta.json`))
          return res.ok ? await res.json() : null
        }),
      ),
      Promise.all(
        campaigns.map(async (campaign) => {
          const res = await fetch(staticUrl(`transcripts/${campaign}/player-map.json`))
          return [campaign, res.ok ? await res.json() : null]
        }),
      ),
      heroIndexRes.ok ? heroIndexRes.json() : [],
    ])

    assistantSessionMetas.value = sessionMetas.filter(Boolean)
    assistantPlayerMaps.value = Object.fromEntries(playerMapPairs)
    assistantHeroSlugs.value = heroIndex.map((entry) => entry.slug)
  } catch {
    assistantSessionMetas.value = []
    assistantPlayerMaps.value = {}
    assistantHeroSlugs.value = []
  } finally {
    assistantContextLoading.value = false
  }
}

async function selectSession(session) {
  if (isSameTranscriptSession(selectedSession.value, session)) return

  selectedSession.value = session
  closeEditDialog()
  closeSplitDialog()
  expandedOriginalIds.value = new Set()
  await Promise.all([loadPlayerMap(session.campaign), loadTranscript()])
}

async function loadCatalog() {
  catalogLoading.value = true
  error.value = null

  try {
    const res = await fetch(staticUrl('transcripts/index.json'))
    if (!res.ok) {
      throw new Error(`Failed to load transcript list (${res.status})`)
    }

    transcriptIndex.value = await res.json()
    selectedSession.value = defaultTranscriptSession(transcriptIndex.value)
    await loadAssistantSourceData()
  } catch (err) {
    error.value = err.message || 'Failed to load transcript list'
    transcriptIndex.value = []
    selectedSession.value = null
    assistantSessionMetas.value = []
    assistantPlayerMaps.value = {}
    assistantHeroSlugs.value = []
  } finally {
    catalogLoading.value = false
  }
}

async function loadTranscript() {
  if (!sessionBase.value) {
    segments.value = []
    meta.value = null
    changelog.value = null
    return
  }

  transcriptLoading.value = true
  error.value = null
  segments.value = []
  meta.value = null
  changelog.value = null
  segmentMetaById.value = new Map()
  extraVoiceOptions.value = []
  extraSpeakerOptions.value = []
  changedSegmentIds.value = new Set()

  try {
    const [metaRes, editedRes] = await Promise.all([
      fetch(staticUrl(`${sessionBase.value}/meta.json`)),
      fetch(staticUrl(`${sessionBase.value}/edited.json`)),
    ])

    if (!metaRes.ok) {
      throw new Error(`Failed to load session metadata (${metaRes.status})`)
    }
    if (!editedRes.ok) {
      throw new Error(`Failed to load transcript (${editedRes.status})`)
    }

    meta.value = await metaRes.json()
    segments.value = await editedRes.json()

    if (gmMode) {
      const [changelogRes, normalizedRes] = await Promise.all([
        fetch(staticUrl(`${sessionBase.value}/changelog.json`)),
        fetch(staticUrl(`${sessionBase.value}/normalized.json`)),
      ])

      if (normalizedRes.ok) {
        const normalized = await normalizedRes.json()
        segmentMetaById.value = new Map(
          normalized.map((segment) => [
            segment.id,
            { speaker: segment.speaker, voice: segment.voice },
          ]),
        )
      }

      if (changelogRes.ok) {
        changelog.value = await changelogRes.json()
        changedSegmentIds.value = changedSegmentIdsFromChangelog(changelog.value)
      }
    }
  } catch (err) {
    error.value = err.message || 'Failed to load transcript'
    meta.value = null
    segments.value = []
  } finally {
    transcriptLoading.value = false
  }
}

onMounted(async () => {
  await loadCatalog()
  if (selectedSession.value) {
    await loadPlayerMap(selectedSession.value.campaign)
    await loadTranscript()
  }
})
</script>

<style scoped>
.transcript-page {
  height: calc(100vh - 50px);
  padding: 0;
}

.transcript-layout {
  display: flex;
  height: 100%;
  min-height: 0;
}

.transcript-sidebar {
  width: 12.5rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--sot-border);
  background: var(--sot-parchment-light);
  color: var(--sot-ink);
  transition: width 0.2s ease;
}

.transcript-sidebar--collapsed {
  width: 2.75rem;
}

.transcript-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
  padding: 0.85rem 0.75rem 0.7rem;
  flex-shrink: 0;
  border-bottom: 1px solid var(--sot-border);
  background: transparent;
}

.transcript-sidebar--collapsed .transcript-sidebar__header {
  justify-content: center;
  padding-inline: 0.35rem;
}

.transcript-sidebar__header-actions {
  display: flex;
  align-items: center;
  gap: 0.15rem;
  flex-shrink: 0;
}

.transcript-sidebar__title {
  font-family: var(--font);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--sot-teal);
}

.transcript-sidebar__sort-btn :deep(.q-icon) {
  font-size: 1.1rem;
}

.transcript-sidebar__scroll {
  flex: 1;
  min-height: 0;
}

.transcript-sidebar__scroll :deep(.q-scrollarea__thumb) {
  background: var(--sot-border);
  opacity: 0.75;
}

.transcript-sidebar__list :deep(.q-item) {
  color: var(--sot-ink);
  min-height: 2.35rem;
  border-radius: 0.25rem;
  margin-inline: 0.35rem;
}

.transcript-sidebar__list :deep(.q-item:hover) {
  background: var(--sot-teal-soft);
}

.transcript-sidebar__item--active {
  background: var(--sot-teal) !important;
  color: var(--sot-parchment-light) !important;
  font-weight: 500;
}

.transcript-sidebar__item--active :deep(.q-item__section) {
  color: inherit;
}

.transcript-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 1.5rem 1.5rem 2rem;
  background: transparent;
}

.transcript-feed {
  max-width: 48rem;
  width: 100%;
  margin-inline: auto;
}

.transcript-row {
  display: flex;
}

.transcript-row--sent {
  justify-content: flex-end;
}

.transcript-row__content {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.transcript-row--received .transcript-row__content {
  align-items: flex-start;
}

.transcript-row--sent .transcript-row__content {
  align-items: flex-end;
}

.transcript-row__message {
  display: inline-flex;
  align-items: stretch;
  gap: 0.35rem;
}

.transcript-message-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;
  padding-top: 1.35rem;
  padding-bottom: 0.35rem;
}

.transcript-changelog-btn,
.transcript-delete-btn,
.transcript-split-btn,
.transcript-restore-btn {
  flex-shrink: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  opacity: 0.75;
  line-height: 0;
}

.transcript-changelog-btn:hover,
.transcript-changelog-btn[aria-expanded='true'],
.transcript-delete-btn:hover,
.transcript-split-btn:hover,
.transcript-restore-btn:hover {
  opacity: 1;
}

.transcript-delete-btn:disabled,
.transcript-split-btn:disabled,
.transcript-restore-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.transcript-editable-message--gm {
  cursor: pointer;
}

.transcript-original {
  width: 100%;
}

.transcript-diff-body {
  line-height: 1.55;
  word-break: break-word;
}

.transcript-original :deep(.transcript-diff) {
  border-radius: 0.15rem;
  padding: 0 0.1rem;
}

.transcript-original :deep(.transcript-diff--changed) {
  background: #fff59d;
}

.transcript-original :deep(.transcript-diff--removed) {
  background: #ef9a9a;
}

.transcript-original :deep(.transcript-diff--added) {
  background: #a5d6a7;
}

.transcript-deleted-slot {
  width: 100%;
  margin: 0.15rem 0;
}

.transcript-deleted-expansion {
  border-radius: 0.25rem;
  background: transparent;
}

.transcript-deleted-expansion :deep(.transcript-deleted-header) {
  min-height: 1.25rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.45);
}

.transcript-deleted-expansion :deep(.transcript-deleted-expand-icon) {
  font-size: 1rem;
  min-width: 1rem;
}

.transcript-deleted-body {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0.35rem 0 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.transcript-assistant-fab {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 2;
}

.transcript-assistant-dialog {
  width: min(36rem, 92vw);
}

.transcript-assistant-prompt :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  line-height: 1.45;
  max-height: min(16rem, 45vh);
  overflow-y: auto !important;
  resize: none;
}
</style>
