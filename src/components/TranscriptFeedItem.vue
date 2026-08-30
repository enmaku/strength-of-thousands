<template>
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
          :class="rowClass(deleted.speaker)"
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
                  @click.stop="emit('restore', deleted)"
                >
                  <q-icon name="restore" size="xs" color="positive" />
                </button>
              </div>
              <q-chat-message
                :sent="isGm(deleted.speaker)"
                :text="[deleted.text]"
                :bg-color="deletedBubbleColor(deleted.speaker)"
                :text-color="deletedBubbleTextColor(deleted.speaker)"
                :class="{ 'transcript-chat--note': isGmNote(deleted.speaker) }"
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
                  @click.stop="emit('restore', deleted)"
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
    :class="rowClass(item.segment.speaker)"
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
            @click.stop="emit('delete', item.segment)"
          >
            <q-icon name="delete" size="xs" color="negative" />
          </button>
          <button
            type="button"
            class="transcript-split-btn"
            aria-label="Split message"
            :disabled="splittingSegmentId === item.segment.id"
            @click.stop="emit('split', item.segment)"
          >
            <q-icon name="call_split" size="xs" color="grey-8" />
          </button>
          <button
            v-if="hasChangelog"
            type="button"
            class="transcript-changelog-btn"
            :aria-expanded="originalExpanded"
            aria-label="Show original transcript"
            @click.stop="emit('toggle-original', item.segment.id)"
          >
            <q-icon name="edit_note" size="xs" color="grey-7" />
          </button>
        </div>
        <div
          class="transcript-editable-message"
          :class="{
            'transcript-editable-message--gm': gmMode,
            'transcript-editable-message--dragging': isDragSource,
            'transcript-editable-message--drop-target': isDropTarget,
          }"
          :data-segment-id="gmMode ? item.segment.id : undefined"
          v-touch-pan.mouse="gmMode ? onBubblePan : undefined"
          @click="onBubbleClick"
        >
          <q-chat-message
            :sent="isGm(item.segment.speaker)"
            :text="[item.segment.text]"
            :bg-color="bubbleColor(item.segment.speaker)"
            :text-color="bubbleTextColor(item.segment.speaker)"
            :class="{ 'transcript-chat--note': isGmNote(item.segment.speaker) }"
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
            @click.stop="emit('delete', item.segment)"
          >
            <q-icon name="delete" size="xs" color="negative" />
          </button>
          <button
            type="button"
            class="transcript-split-btn"
            aria-label="Split message"
            :disabled="splittingSegmentId === item.segment.id"
            @click.stop="emit('split', item.segment)"
          >
            <q-icon name="call_split" size="xs" color="grey-8" />
          </button>
          <button
            v-if="hasChangelog"
            type="button"
            class="transcript-changelog-btn"
            :aria-expanded="originalExpanded"
            aria-label="Show original transcript"
            @click.stop="emit('toggle-original', item.segment.id)"
          >
            <q-icon name="edit_note" size="xs" color="grey-7" />
          </button>
        </div>
      </div>

      <q-slide-transition>
        <div v-show="originalExpanded" class="transcript-original">
          <q-chat-message
            :sent="isGm(item.segment.speaker)"
            bg-color="grey-4"
            text-color="grey-10"
            :class="{ 'transcript-chat--note': isGmNote(item.segment.speaker) }"
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

<script setup>
import { computed } from 'vue'
import { deletedItemsLabel } from '../domain/transcriptFeed.js'
import { diffToHtml } from '../domain/transcriptDiff.js'
import {
  formatSpeakerLabel,
  GM_NOTE_SPEAKER,
  isGmSpeaker,
} from '../domain/transcriptSpeakers.js'

const props = defineProps({
  item: { type: Object, required: true },
  gmMode: { type: Boolean, default: false },
  playerMap: { type: Object, default: null },
  hasChangelog: { type: Boolean, default: false },
  originalExpanded: { type: Boolean, default: false },
  deletingSegmentId: { type: Number, default: null },
  splittingSegmentId: { type: Number, default: null },
  restoringSegmentId: { type: Number, default: null },
  mergingSegmentId: { type: Number, default: null },
  dragSourceId: { type: Number, default: null },
  dropTargetId: { type: Number, default: null },
})

const emit = defineEmits([
  'edit',
  'delete',
  'split',
  'toggle-original',
  'restore',
  'bubble-pan',
])

const isDragSource = computed(
  () =>
    props.gmMode &&
    props.item.type !== 'deleted' &&
    props.dragSourceId === props.item.segment.id,
)

const isDropTarget = computed(
  () =>
    props.gmMode &&
    props.item.type !== 'deleted' &&
    props.dropTargetId === props.item.segment.id,
)

function onBubblePan(details) {
  if (!props.gmMode || props.item.type === 'deleted') return
  emit('bubble-pan', { segment: props.item.segment, details })
}

function onBubbleClick() {
  if (!props.gmMode || props.item.type === 'deleted') return
  emit('edit', props.item.segment)
}

const SPEAKER_COLORS = {
  Kiri: '#6A1B9A',
  Drew: '#00838F',
  Lisa: '#2E7D32',
  Julia: '#AD1457',
  Matt: '#EF6C00',
  Xander: '#4527A0',
  Dave: '#C62828',
  'GM Note': '#616161',
}

const BUBBLE_COLORS = {
  Kiri: { bg: 'purple-2', text: 'purple-10' },
  Drew: { bg: 'cyan-2', text: 'cyan-10' },
  Lisa: { bg: 'green-2', text: 'green-10' },
  Julia: { bg: 'pink-2', text: 'pink-10' },
  Matt: { bg: 'orange-2', text: 'orange-10' },
  Xander: { bg: 'deep-purple-2', text: 'deep-purple-10' },
  Dave: { bg: 'red-2', text: 'red-10' },
  'GM Note': { bg: 'grey-5', text: 'grey-10' },
}

const DELETED_BUBBLE_COLORS = {
  Kiri: { bg: 'purple-5', text: 'purple-10' },
  Drew: { bg: 'cyan-5', text: 'cyan-10' },
  Lisa: { bg: 'green-5', text: 'green-10' },
  Julia: { bg: 'pink-5', text: 'pink-10' },
  Matt: { bg: 'orange-5', text: 'orange-10' },
  Xander: { bg: 'deep-purple-5', text: 'deep-purple-10' },
  Dave: { bg: 'red-5', text: 'red-10' },
  'GM Note': { bg: 'grey-6', text: 'grey-10' },
}

const DELETED_SPEAKER_COLORS = {
  Kiri: '#4A148C',
  Drew: '#006064',
  Lisa: '#1B5E20',
  Julia: '#880E4F',
  Matt: '#E65100',
  Xander: '#311B92',
  Dave: '#B71C1C',
  'GM Note': '#424242',
}

function isGm(speaker) {
  return isGmSpeaker(speaker, props.playerMap)
}

function isGmNote(speaker) {
  return speaker === GM_NOTE_SPEAKER
}

function rowClass(speaker) {
  if (isGmNote(speaker)) return 'transcript-row--note'
  if (isGm(speaker)) return 'transcript-row--sent'
  return 'transcript-row--received'
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

function speakerLabel(segment) {
  return formatSpeakerLabel(segment.speaker, segment.voice)
}
</script>

<style scoped>
.transcript-row {
  display: flex;
  padding-block: 0.35rem;
}

.transcript-row--sent {
  justify-content: flex-end;
}

.transcript-row--note {
  justify-content: center;
  --transcript-note-flourish: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 20' fill='none' stroke='%23000' stroke-width='1.5' stroke-linecap='round'%3E%3Cpath d='M1 10 H29'/%3E%3Cpath d='M44 3.5 Q44 10 50.5 10 Q44 10 44 16.5 Q44 10 37.5 10 Q44 10 44 3.5 Z' fill='%23000' stroke='none'/%3E%3Cpath d='M34 11.5 Q34 14.5 37 14.5 Q34 14.5 34 17.5 Q34 14.5 31 14.5 Q34 14.5 34 11.5 Z' fill='%23000' stroke='none'/%3E%3C/svg%3E");
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

.transcript-row--note .transcript-row__content {
  align-items: center;
}

.transcript-row__message {
  display: inline-flex;
  align-items: stretch;
  gap: 0.35rem;
}

/* Flourishes anchor to the bubble, not the row: the GM action column is
   taller than a one-line note and would otherwise drag them off center. */
.transcript-chat--note {
  margin-inline: 3.85rem;
}

.transcript-chat--note :deep(.q-message-name) {
  text-align: center;
}

.transcript-chat--note :deep(.q-message-text) {
  border-radius: 0.5rem;
  text-align: center;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transcript-chat--note :deep(.q-message-text:last-child) {
  min-height: 0;
}

.transcript-chat--note :deep(.q-message-text:last-child)::before,
.transcript-chat--note :deep(.q-message-text)::after {
  content: '';
  position: absolute;
  top: 50%;
  bottom: auto;
  width: 3.5rem;
  height: 1.25rem;
  border: 0;
  background-color: #757575;
  -webkit-mask-image: var(--transcript-note-flourish);
  mask-image: var(--transcript-note-flourish);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

.transcript-chat--note :deep(.q-message-text:last-child)::before {
  right: calc(100% + 0.35rem);
  left: auto;
  transform: translateY(-50%);
}

.transcript-chat--note :deep(.q-message-text)::after {
  left: calc(100% + 0.35rem);
  right: auto;
  transform: translateY(-50%) scaleX(-1);
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
  cursor: grab;
  touch-action: none;
}

.transcript-editable-message--dragging {
  opacity: 0.45;
}

.transcript-editable-message--drop-target :deep(.q-message-text) {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
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
  padding-block: 0.15rem;
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
</style>
