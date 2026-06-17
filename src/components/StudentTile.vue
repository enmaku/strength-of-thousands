<template>
  <q-card flat bordered class="student-tile">
    <q-card-section class="row items-center q-gutter-sm q-pb-none">
      <q-avatar size="72px" rounded>
        <img :src="portraitUrl" :alt="tile.displayName" />
      </q-avatar>
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">{{ tile.displayName }}</div>
        <div class="text-caption text-grey-7">{{ tile.branch }}</div>
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
            :color="n <= tile.disposition ? 'red-6' : 'grey-5'"
            :aria-label="heartAriaLabel(n)"
            @click="onHeartClick(n)"
          />
        </template>
        <template v-else>
          <q-icon
            v-for="n in 5"
            :key="n"
            class="heart-icon"
            :name="n <= tile.disposition ? 'favorite' : 'favorite_border'"
            :color="n <= tile.disposition ? 'red-6' : 'grey-5'"
            aria-hidden="true"
          />
        </template>
      </div>

      <div class="row q-gutter-md q-mt-sm indicator-row">
        <div class="row items-center q-gutter-xs">
          <q-icon
            name="school"
            size="sm"
            :class="tile.classroomAdvantageUnlocked ? 'indicator-unlocked' : 'indicator-locked'"
          />
          <q-tooltip anchor="top middle" self="bottom middle" class="benefit-tooltip">
            <div class="text-weight-medium q-mb-xs">Classroom Advantage</div>
            {{ tile.classroomAdvantageTooltip }}
          </q-tooltip>
        </div>
        <div class="row items-center q-gutter-xs">
          <q-icon
            name="auto_stories"
            size="sm"
            :class="tile.uncommonRulesUnlocked ? 'indicator-unlocked' : 'indicator-locked'"
          />
          <q-tooltip anchor="top middle" self="bottom middle" class="benefit-tooltip">
            <div class="text-weight-medium q-mb-xs">{{ tile.uncommonRulesName }}</div>
            {{ tile.uncommonRulesTooltip.replace(`${tile.uncommonRulesName}: `, '') }}
          </q-tooltip>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
const props = defineProps({
  tile: { type: Object, required: true },
  portraitUrl: { type: String, required: true },
  editable: { type: Boolean, default: false },
})

const emit = defineEmits(['set-hearts'])

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
.student-tile {
  height: 100%;
}

.indicator-unlocked {
  color: var(--q-primary);
  opacity: 1;
}

.indicator-locked {
  color: var(--q-dark);
  opacity: 0.35;
}

.benefit-tooltip {
  max-width: 22rem;
}

.heart-icon {
  font-size: 1.5rem;
}
</style>
