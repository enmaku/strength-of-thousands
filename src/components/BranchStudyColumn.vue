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

    <q-expansion-item
      v-if="track.classroomAdvantages.length"
      class="classmate-expansion"
      dense
      :label="advantageLabel"
      header-class="classmate-expansion__header"
    >
      <ul class="classroom-advantages">
        <li
          v-for="advantage in track.classroomAdvantages"
          :key="advantage.slug"
          class="classroom-advantage"
          :class="{ 'classroom-advantage--earned': advantage.text }"
        >
          <q-avatar size="28px" class="classroom-advantage__portrait">
            <img :src="portraitUrl(advantage.thumb)" alt="" />
          </q-avatar>
          <div class="classroom-advantage__copy">
            <div class="classroom-advantage__name-row">
              <div class="classroom-advantage__name">{{ advantage.displayName }}</div>
              <div
                class="classroom-advantage__hearts"
                :aria-label="`Disposition ${advantage.hearts} of 5`"
              >
                <q-icon
                  v-for="n in 5"
                  :key="n"
                  class="classroom-advantage__heart"
                  :class="n <= advantage.hearts ? 'sot-heart-filled' : 'sot-heart-empty'"
                  :name="n <= advantage.hearts ? 'favorite' : 'favorite_border'"
                  aria-hidden="true"
                />
              </div>
            </div>
            <p v-if="advantage.text" class="classroom-advantage__text">{{ advantage.text }}</p>
          </div>
        </li>
      </ul>
    </q-expansion-item>

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
import { computed, ref } from 'vue'

const props = defineProps({
  track: { type: Object, required: true },
  imageUrl: { type: String, required: true },
  portraitUrl: { type: Function, required: true },
  editable: { type: Boolean, default: false },
})

const advantageLabel = computed(() => {
  const advantages = props.track.classroomAdvantages
  const earned = advantages.filter((advantage) => advantage.text).length
  const title = advantages.length === 1 ? 'Classroom Advantage' : 'Classroom Advantages'
  return `${title} (${earned}/${advantages.length})`
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

.classmate-expansion {
  margin-top: 0.15rem;
}

.classmate-expansion :deep(.classmate-expansion__header) {
  min-height: 2rem;
  padding: 0.15rem 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--sot-teal);
}

.classroom-advantages {
  list-style: none;
  margin: 0.15rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.classroom-advantage {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.classroom-advantage--earned {
  align-items: flex-start;
}

.classroom-advantage__portrait {
  flex: none;
  border: 2px solid var(--sot-border);
  background: #fff;
}

.classroom-advantage__copy {
  flex: 1;
  min-width: 0;
}

.classroom-advantage__name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.classroom-advantage__name {
  min-width: 0;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.2;
}

.classroom-advantage__hearts {
  display: flex;
  flex: none;
  margin-left: auto;
}

.classroom-advantage__heart {
  font-size: 0.95rem;
}

.classroom-advantage__heart.sot-heart-empty {
  color: var(--sot-muted);
}

.classroom-advantage__text {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  line-height: 1.35;
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
