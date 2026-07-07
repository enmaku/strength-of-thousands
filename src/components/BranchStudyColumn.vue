<template>
  <div class="branch-column">
    <div class="row items-center no-wrap q-gutter-sm branch-bar-row">
      <q-btn
        v-if="editable"
        flat
        dense
        round
        icon="remove"
        aria-label="Decrease branch level"
        @click="$emit('decrement')"
      />
      <button
        type="button"
        class="branch-badge-trigger"
        :aria-label="`${track.displayName} branch reference`"
        :disabled="!track.reference"
        @click="branchOpen = true"
      >
        <q-avatar size="40px" class="branch-badge">
          <img :src="imageUrl" :alt="track.displayName ?? ''" />
        </q-avatar>
      </button>
      <div class="col branch-bar-wrap">
        <div class="row items-center justify-between branch-bar-labels">
          <span class="text-caption text-weight-medium">{{ track.displayName }}</span>
          <span class="text-caption">
            {{ track.level }}<span v-if="track.starred" class="branch-star"> ★</span>
          </span>
        </div>
        <div class="branch-bar-track">
          <q-linear-progress
            :value="track.level / 20"
            color="primary"
            track-color="grey-4"
            rounded
            size="12px"
          />
          <div
            v-if="track.cap < 20"
            class="branch-cap-marker"
            :style="{ left: `${(track.cap / 20) * 100}%` }"
            :title="`Cap: ${track.cap}`"
          />
        </div>
      </div>
      <q-btn
        v-if="editable"
        flat
        dense
        round
        icon="add"
        aria-label="Increase branch level"
        @click="$emit('increment')"
      />
      <q-btn
        v-if="editable"
        flat
        dense
        round
        :icon="track.uncapped ? 'lock_open' : 'lock'"
        :color="track.uncapped ? 'primary' : undefined"
        :aria-label="track.uncapped ? 'Uncapped (Book 6)' : 'Capped by character level'"
        @click="$emit('toggle-uncapped')"
      />
    </div>

    <ul v-if="track.benefits.length" class="benefit-list q-mt-sm q-mb-none">
      <li v-for="benefit in track.benefits" :key="`${track.role}-${benefit.level}`">
        <button type="button" class="benefit-trigger" @click="$emit('benefit-click', benefit)">
          {{ benefit.name }}
        </button>
      </li>
    </ul>

    <q-dialog v-model="branchOpen">
      <q-card v-if="track.reference" class="branch-detail-card">
        <q-card-section>
          <div class="text-h6">{{ track.reference.displayName }}</div>
          <div class="text-caption sot-muted">Virtue: {{ track.reference.virtue }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <p class="q-mb-md">{{ track.reference.description }}</p>
          <dl class="branch-ref-list">
            <dt>Study skills</dt>
            <dd>{{ track.reference.skills.join(', ') }}</dd>
            <dt>Lore</dt>
            <dd>{{ track.reference.lore }}</dd>
            <dt>General feat (branch 8)</dt>
            <dd>{{ track.reference.generalFeat }}</dd>
            <dt>Branch feat (branch 7)</dt>
            <dd>{{ track.reference.branchFeat6 }}</dd>
            <dt>Branch feat (branch 12)</dt>
            <dd>{{ track.reference.branchFeat10 }}</dd>
          </dl>
          <p class="text-caption sot-muted q-mb-none">
            Study and Cram checks use one of the study skills listed above.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="branchOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  track: { type: Object, required: true },
  imageUrl: { type: String, required: true },
  editable: { type: Boolean, default: false },
})

defineEmits(['increment', 'decrement', 'toggle-uncapped', 'benefit-click'])

const branchOpen = ref(false)
</script>

<style scoped>
.branch-badge-trigger {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  line-height: 0;
}

.branch-badge-trigger:disabled {
  cursor: default;
}

.branch-badge-trigger:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.branch-badge {
  border: 2px solid var(--sot-border);
  background: #fff;
}

.branch-bar-wrap {
  min-width: 0;
}

.branch-bar-track {
  position: relative;
}

.branch-cap-marker {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  margin-left: -1px;
  background: var(--sot-earth);
  pointer-events: none;
}

.branch-star {
  color: var(--sot-gold);
}

.benefit-list {
  padding-left: 1.1rem;
  font-size: 0.88rem;
}

.benefit-trigger {
  padding: 0;
  border: none;
  background: none;
  color: var(--sot-teal);
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.benefit-trigger:hover {
  color: var(--sot-teal-dark);
}

.benefit-trigger:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.branch-detail-card {
  min-width: 20rem;
  max-width: min(28rem, 92vw);
}

.branch-ref-list {
  margin: 0 0 1rem;
  font-size: 0.92rem;
}

.branch-ref-list dt {
  font-weight: 600;
  color: var(--sot-teal);
  margin-top: 0.5rem;
}

.branch-ref-list dt:first-child {
  margin-top: 0;
}

.branch-ref-list dd {
  margin: 0.15rem 0 0;
}
</style>
