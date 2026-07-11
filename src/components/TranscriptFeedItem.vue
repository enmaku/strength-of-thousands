<template>
  <div v-if="item.type === 'deleted'" class="transcript-deleted-slot">
    <q-expansion-item
      dense
      switch-toggle-side
      expand-icon-class="transcript-deleted-expand-icon"
      header-class="transcript-deleted-header"
      class="transcript-deleted-expansion"
      :label="deletedItemsLabel(item.items.length)"
      @after-show="emit('resize')"
      @after-hide="emit('resize')"
    >
      <div class="transcript-deleted-body">
        <div
          v-for="deleted in item.items"
          :key="deleted.segmentId"
          class="transcript-row"
          :class="isGm(deleted.speaker) ? 'transcript-row--sent' : 'transcript-row--received'"
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
    :class="isGm(item.segment.speaker) ? 'transcript-row--sent' : 'transcript-row--received'"
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
          :class="{ 'transcript-editable-message--gm': gmMode }"
          @click="gmMode && emit('edit', item.segment)"
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

      <q-slide-transition @show="emit('resize')" @hide="emit('resize')">
        <div v-show="originalExpanded" class="transcript-original">
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

<script setup>
import { deletedItemsLabel } from '../domain/transcriptFeed.js'
import { diffToHtml } from '../domain/transcriptDiff.js'
import { formatSpeakerLabel, isGmSpeaker } from '../domain/transcriptSpeakers.js'

const props = defineProps({
  item: { type: Object, required: true },
  gmMode: { type: Boolean, default: false },
  playerMap: { type: Object, default: null },
  hasChangelog: { type: Boolean, default: false },
  originalExpanded: { type: Boolean, default: false },
  deletingSegmentId: { type: Number, default: null },
  splittingSegmentId: { type: Number, default: null },
  restoringSegmentId: { type: Number, default: null },
})

const emit = defineEmits([
  'edit',
  'delete',
  'split',
  'toggle-original',
  'restore',
  'resize',
])

const SPEAKER_COLORS = {
  Kiri: '#6A1B9A',
  Drew: '#00838F',
  Lisa: '#2E7D32',
  Julia: '#AD1457',
  Matt: '#EF6C00',
  Xander: '#4527A0',
  Dave: '#C62828',
}

const BUBBLE_COLORS = {
  Kiri: { bg: 'purple-2', text: 'purple-10' },
  Drew: { bg: 'cyan-2', text: 'cyan-10' },
  Lisa: { bg: 'green-2', text: 'green-10' },
  Julia: { bg: 'pink-2', text: 'pink-10' },
  Matt: { bg: 'orange-2', text: 'orange-10' },
  Xander: { bg: 'deep-purple-2', text: 'deep-purple-10' },
  Dave: { bg: 'red-2', text: 'red-10' },
}

const DELETED_BUBBLE_COLORS = {
  Kiri: { bg: 'purple-5', text: 'purple-10' },
  Drew: { bg: 'cyan-5', text: 'cyan-10' },
  Lisa: { bg: 'green-5', text: 'green-10' },
  Julia: { bg: 'pink-5', text: 'pink-10' },
  Matt: { bg: 'orange-5', text: 'orange-10' },
  Xander: { bg: 'deep-purple-5', text: 'deep-purple-10' },
  Dave: { bg: 'red-5', text: 'red-10' },
}

const DELETED_SPEAKER_COLORS = {
  Kiri: '#4A148C',
  Drew: '#006064',
  Lisa: '#1B5E20',
  Julia: '#880E4F',
  Matt: '#E65100',
  Xander: '#311B92',
  Dave: '#B71C1C',
}

function isGm(speaker) {
  return isGmSpeaker(speaker, props.playerMap)
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
