<template>
  <q-card flat bordered class="student-tile">
    <q-card-section class="row items-center q-gutter-sm q-pb-none">
      <PortraitLightbox
        :full-src="portraitFullUrl"
        :alt="tile.displayName"
      >
        <q-avatar size="72px" rounded>
          <img :src="portraitUrl" :alt="tile.displayName" />
        </q-avatar>
      </PortraitLightbox>
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">{{ tile.displayName }}</div>
        <div class="text-caption sot-muted">{{ tile.branch }}</div>
      </div>
    </q-card-section>

    <q-card-section class="q-pt-sm">
      <div
        class="row items-center q-gutter-xs hearts-row"
        :aria-label="editable ? undefined : `Disposition ${tile.disposition} of 5`"
      >
        <template v-if="editable">
          <q-btn
            v-for="n in 5"
            :key="n"
            flat
            dense
            round
            :icon="n <= tile.disposition ? 'favorite' : 'favorite_border'"
            :class="n <= tile.disposition ? 'sot-heart-filled' : 'sot-heart-empty'"
            :aria-label="heartAriaLabel(n)"
            @click="onHeartClick(n)"
          />
        </template>
        <template v-else>
          <q-icon
            v-for="n in 5"
            :key="n"
            :class="['heart-icon', n <= tile.disposition ? 'sot-heart-filled' : 'sot-heart-empty']"
            :name="n <= tile.disposition ? 'favorite' : 'favorite_border'"
            aria-hidden="true"
          />
        </template>
      </div>

      <div class="row q-gutter-md q-mt-sm indicator-row">
        <button
          type="button"
          class="indicator-trigger"
          :aria-label="classroomAdvantageAriaLabel"
          @click="openDetail('classroom')"
        >
          <q-icon
            name="school"
            size="sm"
            :class="tile.classroomAdvantageUnlocked ? 'indicator-unlocked' : 'indicator-locked'"
          />
        </button>
        <button
          type="button"
          class="indicator-trigger"
          :aria-label="uncommonRulesAriaLabel"
          @click="openDetail('uncommon')"
        >
          <q-icon
            name="auto_stories"
            size="sm"
            :class="tile.uncommonRulesUnlocked ? 'indicator-unlocked' : 'indicator-locked'"
          />
        </button>
      </div>
    </q-card-section>

    <q-dialog v-model="detailOpen">
      <q-card class="indicator-detail-card">
        <q-card-section>
          <div class="text-h6">{{ detailTitle }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ detailBody }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="detailOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import PortraitLightbox from 'components/PortraitLightbox.vue'

const props = defineProps({
  tile: { type: Object, required: true },
  portraitUrl: { type: String, required: true },
  portraitFullUrl: { type: String, required: true },
  editable: { type: Boolean, default: false },
})

const emit = defineEmits(['set-hearts'])

const detailOpen = ref(false)
const detailKind = ref(null)

const detailTitle = computed(() => {
  if (detailKind.value === 'classroom') return 'Classroom Advantage'
  if (detailKind.value === 'uncommon') return props.tile.uncommonRulesName
  return ''
})

const detailBody = computed(() => {
  if (detailKind.value === 'classroom') return props.tile.classroomAdvantageTooltip
  if (detailKind.value === 'uncommon') {
    return props.tile.uncommonRulesTooltip.replace(`${props.tile.uncommonRulesName}: `, '')
  }
  return ''
})

const classroomAdvantageAriaLabel = computed(() => {
  const status = props.tile.classroomAdvantageUnlocked ? '' : ' (locked)'
  return `Classroom Advantage${status}`
})

const uncommonRulesAriaLabel = computed(() => {
  const status = props.tile.uncommonRulesUnlocked ? '' : ' (locked)'
  return `${props.tile.uncommonRulesName}${status}`
})

function openDetail(kind) {
  detailKind.value = kind
  detailOpen.value = true
}

function onHeartClick(n) {
  if (!props.editable) return
  emit('set-hearts', n === props.tile.disposition ? n - 1 : n)
}

function heartAriaLabel(n) {
  const target = n === props.tile.disposition ? n - 1 : n
  return target === 0 ? 'Clear disposition' : `Set disposition to ${target}`
}
</script>

<style scoped>
.indicator-unlocked {
  color: var(--q-primary);
  opacity: 1;
}

.indicator-locked {
  color: var(--q-dark);
  opacity: 0.35;
}

.heart-icon {
  font-size: 1.5rem;
}

.indicator-trigger {
  padding: 0.25rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  line-height: 0;
}

.indicator-trigger:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.indicator-detail-card {
  min-width: 20rem;
  max-width: min(28rem, 92vw);
}
</style>
