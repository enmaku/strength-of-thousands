<template>
  <q-page class="q-pa-lg">
    <div class="column q-gutter-md timeline-page">
      <q-banner v-if="error" class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner size="2rem" />
      </div>

      <q-banner v-if="!loading && groups.length === 0" class="bg-grey-2 sot-muted" rounded>
        No timeline beats yet. Check back after the GM updates campaign state.
      </q-banner>

      <nav v-if="toc.length" class="timeline-toc" aria-label="Timeline sections">
        <a
          v-for="entry in toc"
          :key="entry.anchor"
          class="timeline-toc__link"
          :class="{ 'timeline-toc__link--book': entry.type === 'book' }"
          :href="`#${entry.anchor}`"
          @click.prevent="scrollToGroup(entry.anchor)"
        >
          {{ entry.label }}
        </a>
      </nav>

      <q-timeline v-if="!loading && groups.length" class="timeline">
        <template v-for="(group, index) in groups" :key="groupKey(group)">
          <q-timeline-entry
            v-if="group.type === 'book'"
            :id="`timeline-group-${index}`"
            class="timeline-book-header"
            :class="{ 'timeline-beat--hidden': gmMode && !group.beat.revealed }"
            :style="{ '--beat-color': STORY_COLOR }"
          >
            <template #title>
              <span
                class="timeline-book-header__title"
                :class="{ 'timeline-editable': gmMode }"
                @click="openBeatEdit(group.beat)"
              >
                {{ group.beat.title }}
              </span>
            </template>

            <div
              v-if="gmMode"
              class="timeline-book-header__description"
              :class="{
                'timeline-editable': gmMode,
                'timeline-editable--empty': !group.beat.description,
              }"
              @click="openBeatEdit(group.beat)"
            >
              {{ group.beat.description || 'Add a book summary…' }}
            </div>

            <div v-if="gmMode" class="timeline-beat__actions">
              <q-btn
                v-if="!group.beat.revealed"
                flat
                dense
                size="sm"
                color="primary"
                label="Reveal to here"
                @click="confirmReveal(group.beat)"
              />
              <q-btn
                flat
                dense
                size="sm"
                color="grey-8"
                label="Hide from here"
                @click="confirmHide(group.beat)"
              />
            </div>
          </q-timeline-entry>

          <q-timeline-entry
            v-else
            :id="`timeline-group-${index}`"
            class="timeline-session-header"
          >
            <template #title>
              <span class="timeline-session-header__title">Session {{ group.session }}</span>
            </template>
          </q-timeline-entry>

          <q-timeline-entry
            v-for="beat in group.beats"
            :key="beat.id"
            :subtitle="subtitleFor(beat)"
            class="timeline-beat"
            :class="{ 'timeline-beat--hidden': gmMode && !beat.revealed }"
            :style="{ '--beat-color': dotColor(beat) }"
          >
            <template #title>
              <span
                class="timeline-beat__title"
                :class="{ 'timeline-editable': gmMode }"
                @click="openBeatEdit(beat)"
              >
                {{ beat.title }}
              </span>
            </template>

            <div
              v-if="beat.description || gmMode"
              class="timeline-beat__description"
              :class="{
                'timeline-editable': gmMode,
                'timeline-editable--empty': gmMode && !beat.description,
              }"
              @click="openBeatEdit(beat)"
            >
              {{ beat.description || 'Add a description…' }}
            </div>

            <div v-if="gmMode && (beat.source || beat.confidence)" class="timeline-beat__meta">
              <span v-if="beat.source">{{ beat.source }}</span>
              <span v-if="beat.confidence" class="timeline-beat__confidence">
                {{ beat.confidence }}
              </span>
            </div>

            <div v-if="gmMode" class="timeline-beat__actions">
              <q-btn
                v-if="!beat.revealed"
                flat
                dense
                size="sm"
                color="primary"
                label="Reveal to here"
                @click="confirmReveal(beat)"
              />
              <q-btn
                flat
                dense
                size="sm"
                color="grey-8"
                label="Hide from here"
                @click="confirmHide(beat)"
              />
            </div>
          </q-timeline-entry>
        </template>
      </q-timeline>
    </div>

    <q-dialog v-if="gmMode" v-model="editDialogOpen" persistent>
      <q-card style="min-width: 24rem; width: min(40rem, 90vw)">
        <q-card-section>
          <div class="text-h6">Edit beat</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            {{ editMeta }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none column q-gutter-sm">
          <q-input
            v-model="editTitle"
            autofocus
            label="Title"
            :rules="[(value) => !!value?.trim() || 'Title is required']"
          />
          <q-input
            v-model="editDescription"
            type="textarea"
            autogrow
            label="Description"
            :hint="editDescriptionHint"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeBeatEdit" />
          <q-btn
            flat
            label="Save"
            color="primary"
            :disable="!editTitle.trim() || savingEdit"
            :loading="savingEdit"
            @click="saveBeatEdit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { isGmMode } from '../domain/mode.js'
import {
  STORY_COLOR,
  buildTimelineGroups,
  buildTimelineToc,
  heroColor,
  hideFrom as hideFromBeats,
  revealTo as revealToBeats,
} from '../domain/timeline.js'
import { fetchStaticJson } from '../utils/staticAssetUrl.js'

const PLAYER_MAP_PATH = 'transcripts/strength-of-thousands/player-map.json'

const $q = useQuasar()
const gmMode = isGmMode()

const beats = ref([])
const playerMap = ref(null)
const loading = ref(true)
const error = ref(null)

const editDialogOpen = ref(false)
const editingBeatId = ref(null)
const editTitle = ref('')
const editDescription = ref('')
const savingEdit = ref(false)

const groups = computed(() => buildTimelineGroups(beats.value, { gmMode }))
const toc = computed(() => buildTimelineToc(groups.value, { gmMode }))

const heroNames = computed(() =>
  Object.fromEntries(
    Object.values(playerMap.value?.players ?? {})
      .filter((player) => player.heroSlug)
      .map((player) => [player.heroSlug, player.character ?? player.heroSlug]),
  ),
)

onMounted(async () => {
  try {
    const [timelineRes, playerMapRes] = await Promise.all([
      fetchStaticJson('data/timeline.json'),
      fetchStaticJson(PLAYER_MAP_PATH),
    ])

    if (!timelineRes.ok) {
      throw new Error(`Failed to load the timeline (${timelineRes.status})`)
    }

    beats.value = await timelineRes.json()
    if (playerMapRes.ok) {
      playerMap.value = await playerMapRes.json()
    }
  } catch (err) {
    error.value = err.message || 'Failed to load the timeline'
    beats.value = []
  } finally {
    loading.value = false
  }
})

function groupKey(group) {
  return group.type === 'book' ? `book-${group.beat.book}` : `session-${group.session}`
}

function scrollToGroup(anchor) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function dotColor(beat) {
  if (beat.lane !== 'player') return STORY_COLOR
  return heroColor(beat.heroSlug, playerMap.value)
}

function subtitleFor(beat) {
  if (beat.lane !== 'player') return ''
  return heroNames.value[beat.heroSlug] ?? ''
}

const LANE_LABELS = {
  story: 'Story beat',
  player: 'Player beat',
  book: 'Book header',
}

const editingBeat = computed(
  () => beats.value.find((beat) => beat.id === editingBeatId.value) ?? null,
)

const editMeta = computed(() => {
  const beat = editingBeat.value
  if (!beat) return ''
  const session = Number.isFinite(beat.session) ? `session ${beat.session}` : 'no session'
  const hero = beat.heroSlug ? ` · ${heroNames.value[beat.heroSlug] ?? beat.heroSlug}` : ''
  return `${LANE_LABELS[beat.lane] ?? beat.lane} · book ${beat.book} · ${session}${hero}`
})

const editDescriptionHint = computed(() =>
  editingBeat.value?.lane === 'book'
    ? 'GM-only. Players see the book title alone.'
    : 'Shown to players once this beat is revealed.',
)

function openBeatEdit(beat) {
  if (!gmMode) return

  editingBeatId.value = beat.id
  editTitle.value = beat.title
  editDescription.value = beat.description ?? ''
  editDialogOpen.value = true
}

function closeBeatEdit() {
  editDialogOpen.value = false
  editingBeatId.value = null
  editTitle.value = ''
  editDescription.value = ''
}

async function saveBeatEdit() {
  const title = editTitle.value.trim()
  const description = editDescription.value.trim()
  if (!editingBeatId.value || !title) return

  const nextBeats = beats.value.map((beat) =>
    beat.id === editingBeatId.value ? { ...beat, title, description } : beat,
  )

  savingEdit.value = true
  try {
    if (await saveBeats(nextBeats, 'Beat updated')) {
      closeBeatEdit()
    }
  } finally {
    savingEdit.value = false
  }
}

function confirmReveal(beat) {
  $q.dialog({
    title: 'Reveal to here?',
    message: `Reveal every beat in this lane up to and including “${beat.title}”.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Reveal', color: 'primary', flat: true },
  }).onOk(() => saveBeats(revealToBeats(beats.value, { id: beat.id }), 'Beats revealed'))
}

function confirmHide(beat) {
  $q.dialog({
    title: 'Hide from here?',
    message: `Hide this beat and every later beat in its lane, starting with “${beat.title}”.`,
    cancel: true,
    persistent: true,
    ok: { label: 'Hide', color: 'negative', flat: true },
  }).onOk(() => saveBeats(hideFromBeats(beats.value, { id: beat.id }), 'Beats hidden'))
}

async function saveBeats(nextBeats, message) {
  try {
    const res = await fetch('/api/timeline', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beats: nextBeats }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to save the timeline')
    }

    beats.value = await res.json()
    $q.notify({ type: 'positive', message })
    return true
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
    return false
  }
}
</script>

<style scoped>
.timeline-page {
  max-width: 52rem;
}

.timeline-toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.85rem;
  font-size: 0.8rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--sot-border);
}

.timeline-toc__link {
  color: var(--sot-green);
  text-decoration: none;
}

.timeline-toc__link:hover {
  text-decoration: underline;
}

.timeline-toc__link--book {
  font-weight: 600;
  color: var(--sot-teal);
}

/* Header rows sit under the fixed app bar when jumped to from the TOC. */
.timeline-book-header,
.timeline-session-header {
  scroll-margin-top: 4.5rem;
}

/* QTimelineEntry renders `text-${color}`, and Quasar's .text-* utilities use
   !important — so the per-beat dot colour has to win the same way. */
.timeline :deep(.q-timeline__dot) {
  color: var(--beat-color, var(--sot-teal)) !important;
}

.timeline-book-header__title {
  display: inline-block;
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--sot-teal);
  border-bottom: 2px solid var(--sot-border);
  padding-bottom: 0.35rem;
}

.timeline-book-header__description {
  font-size: 0.85rem;
  color: var(--sot-muted);
  margin-top: 0.15rem;
}

.timeline-session-header__title {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--sot-teal);
  border-bottom: 1px solid var(--sot-border);
  padding-bottom: 0.35rem;
}

.timeline-session-header :deep(.q-timeline__content) {
  padding-top: 12px;
}

/* Header rows are plain entries so the rail stays continuous. They carry no
   subtitle or body, so collapse the empty subtitle and trim bottom padding. */
.timeline-session-header :deep(.q-timeline__subtitle),
.timeline-book-header :deep(.q-timeline__subtitle) {
  display: none;
}

.timeline-session-header :deep(.q-timeline__content),
.timeline-book-header :deep(.q-timeline__content) {
  padding-bottom: 10px;
}

.timeline-session-header :deep(.q-timeline__title),
.timeline-book-header :deep(.q-timeline__title) {
  margin-bottom: 0;
}

.timeline-book-header :deep(.q-timeline__content) {
  padding-top: 10px;
}

/* Header dots sit on the same rail but read as markers, not events. */
.timeline-book-header :deep(.q-timeline__dot:before) {
  box-sizing: border-box;
  background: var(--sot-teal);
  border: 3px solid var(--sot-teal);
}

/* Beats read as the finest grain on the rail, so their dots shrink below the
   header markers. */
.timeline-beat :deep(.q-timeline__dot:before) {
  width: 11px;
  height: 11px;
  top: 6px;
  border-width: 2px;
}

.timeline-beat__title {
  font-size: 1rem;
  font-weight: 600;
}

.timeline-beat__description {
  margin-top: 0.25rem;
}

.timeline-beat__meta {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--sot-muted);
  display: flex;
  gap: 0.75rem;
}

.timeline-beat__confidence {
  font-style: italic;
}

.timeline-beat__actions {
  margin-top: 0.35rem;
  display: flex;
  gap: 0.5rem;
}

.timeline-beat--hidden {
  opacity: 0.45;
  filter: grayscale(0.6);
}

.timeline-editable {
  cursor: pointer;
  border-radius: 0.2rem;
  transition: background-color 0.15s ease;
}

.timeline-editable:hover,
.timeline-editable:focus-visible {
  background: var(--sot-teal-soft);
}

.timeline-editable--empty {
  color: var(--sot-muted);
  font-style: italic;
  opacity: 0.75;
}
</style>
