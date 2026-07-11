<template>
  <q-page class="transcript-page column" :style-fn="pageFillStyle">
    <div v-if="catalogLoading" class="col row flex-center q-pa-xl">
      <q-spinner size="2rem" />
    </div>

    <template v-else>
      <div v-if="$q.screen.xs" class="col-auto transcript-session-select">
        <q-select
          :model-value="selectedSessionId"
          :options="sessionSelectOptions"
          emit-value
          map-options
          dense
          outlined
          options-dense
          behavior="menu"
          :clearable="false"
          aria-label="Session"
          @update:model-value="onSessionSelect"
        />
      </div>

      <div
        class="col transcript-body"
        :class="$q.screen.xs ? 'column' : 'row no-wrap'"
      >
      <aside
        v-if="$q.screen.gt.xs"
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

      <div class="col transcript-pane column">
        <div class="transcript-pane__chrome">
          <q-banner v-if="error" class="bg-negative text-white" rounded>
            {{ error }}
          </q-banner>

          <div v-if="transcriptLoading" class="row justify-center q-pa-xl">
            <q-spinner size="2rem" />
          </div>

          <q-banner v-else-if="!transcriptLoading && segments.length === 0 && selectedSession" class="bg-grey-2" rounded>
            No transcript content for {{ selectedSession.label }}.
          </q-banner>
        </div>

        <div
          v-if="!transcriptLoading && segments.length > 0"
          ref="scrollerRef"
          class="col transcript-scroller"
        >
          <div
            class="transcript-feed"
            :style="{ height: `${feedTotalSize}px`, position: 'relative' }"
          >
            <div
              v-for="virtualRow in feedVirtualRows"
              :key="virtualRow.key"
              :data-index="virtualRow.index"
              :ref="measureFeedRow"
              class="transcript-feed-row"
              :style="{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }"
            >
              <TranscriptFeedItem
                v-if="feedItems[virtualRow.index]"
                :item="feedItems[virtualRow.index]"
                :gm-mode="gmMode"
                :player-map="playerMap"
                :has-changelog="
                  feedItems[virtualRow.index].type === 'segment' &&
                  hasChangelogChange(feedItems[virtualRow.index].segment.id)
                "
                :original-expanded="
                  feedItems[virtualRow.index].type === 'segment' &&
                  isOriginalExpanded(feedItems[virtualRow.index].segment.id)
                "
                :deleting-segment-id="deletingSegmentId"
                :splitting-segment-id="splittingSegmentId"
                :restoring-segment-id="restoringSegmentId"
                @edit="openEditDialog"
                @delete="confirmDeleteSegment"
                @split="openSplitDialog"
                @toggle-original="toggleOriginal"
                @restore="restoreSegment"
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </template>

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
            Copy the prompt below into ChatGPTor a similar tool. Only ChatGPT is tested and supported at present, but other tools may work. 
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useVirtualizer } from '@tanstack/vue-virtual'
import TranscriptFeedItem from '../components/TranscriptFeedItem.vue'
import { isGmMode } from '../domain/mode.js'
import {
  buildTranscriptFeed,
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
const gmMode = isGmMode()
const $q = useQuasar()

function pageFillStyle(offset, height) {
  const filled = `${height - offset}px`
  return {
    height: filled,
    minHeight: filled,
    maxHeight: filled,
  }
}

const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

function staticUrl(path) {
  const base = pagesBase || ''
  return `${base}/${path}`.replace(/\/+/g, '/')
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
const scrollerRef = ref(null)
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

function speakerLabel(segment) {
  return formatSpeakerLabel(segment.speaker, segment.voice)
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

const sessionSelectOptions = computed(() =>
  sortTranscriptSessions(transcriptIndex.value, 'desc').map((session) => ({
    label: session.label,
    value: session.sessionId,
  })),
)

const selectedSessionId = computed(() => selectedSession.value?.sessionId ?? null)

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

const feedVirtualizerOptions = computed(() => ({
  count: feedItems.value.length,
  getScrollElement: () => scrollerRef.value,
  estimateSize: (index) => {
    const item = feedItems.value[index]
    if (!item) return 80
    return item.type === 'deleted' ? 36 : 88
  },
  overscan: 10,
  paddingStart: 8,
  paddingEnd: 32,
  getItemKey: (index) => feedItems.value[index]?.key ?? index,
  useAnimationFrameWithResizeObserver: true,
  // First measure (estimate→actual): correct scroll for above-viewport rows.
  // Later remasures (expand deleted / original): keep scrollTop put so the
  // row the user clicked does not jump away.
  shouldAdjustScrollPositionOnItemSizeChange: (item, _delta, instance) => {
    if (instance.itemSizeCache.has(item.key)) return false
    return item.start < instance.getScrollOffset() + instance.scrollAdjustments
  },
}))

const feedVirtualizer = useVirtualizer(feedVirtualizerOptions)
const feedVirtualRows = computed(() => feedVirtualizer.value.getVirtualItems())
const feedTotalSize = computed(() => feedVirtualizer.value.getTotalSize())

function measureFeedRow(el) {
  if (el) {
    feedVirtualizer.value.measureElement(el)
  }
}

function resetFeedMeasurements() {
  if (scrollerRef.value) {
    scrollerRef.value.scrollTop = 0
  }
  // Safe only after scroll reset: clears size cache so the next session remounts cleanly.
  feedVirtualizer.value.measure()
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
}

async function loadPlayerMap(campaign) {
  if (!campaign) {
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
  await nextTick()
  resetFeedMeasurements()
}

async function onSessionSelect(sessionId) {
  const session = transcriptIndex.value.find((entry) => entry.sessionId === sessionId)
  if (session) {
    await selectSession(session)
  }
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
  padding: 0;
}

.transcript-body {
  min-height: 0;
  min-width: 0;
}

.transcript-session-select {
  padding: 0.75rem 1rem;
  background: var(--sot-parchment-light);
  border-bottom: 1px solid var(--sot-border);
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

.transcript-pane {
  min-width: 0;
  min-height: 0;
}

.transcript-pane__chrome {
  flex-shrink: 0;
  padding: 1.5rem 1.5rem 0;
}

.transcript-pane__chrome:empty {
  display: none;
}

.transcript-scroller {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  overflow-anchor: none;
  padding-inline: 1.5rem;
}

.transcript-feed {
  max-width: 48rem;
  width: 100%;
  margin-inline: auto;
}

.transcript-feed-row {
  will-change: transform;
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
