<template>
  <q-card flat bordered class="study-hero-card">
    <q-card-section class="q-pb-sm">
      <div class="text-h6 text-weight-medium">{{ card.displayName }}</div>
    </q-card-section>

    <q-card-section v-if="!card.configured" class="q-pt-none">
      <template v-if="editable">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              :model-value="card.study.primaryBranch"
              :options="primaryOptions"
              label="Primary branch"
              emit-value
              map-options
              clearable
              dense
              outlined
              @update:model-value="(v) => onBranchChange('primaryBranch', v)"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              :model-value="card.study.secondaryBranch"
              :options="secondaryOptions"
              label="Secondary branch"
              emit-value
              map-options
              clearable
              dense
              outlined
              @update:model-value="(v) => onBranchChange('secondaryBranch', v)"
            />
          </div>
        </div>
      </template>
      <p v-else class="text-body2 sot-muted q-mb-none">Study track not set up yet.</p>
    </q-card-section>

    <template v-else>
      <q-card-section class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <BranchStudyColumn
              :track="card.primary"
              :image-url="branchImageUrl(card.primary.image)"
              :editable="editable"
              @increment="$emit('increment', 'primary')"
              @decrement="$emit('decrement', 'primary')"
              @toggle-uncapped="$emit('toggle-uncapped', 'primary')"
              @benefit-click="openBenefit"
            />
          </div>
          <div class="col-12 col-md-6">
            <BranchStudyColumn
              :track="card.secondary"
              :image-url="branchImageUrl(card.secondary.image)"
              :editable="editable"
              @increment="$emit('increment', 'secondary')"
              @decrement="$emit('decrement', 'secondary')"
              @toggle-uncapped="$emit('toggle-uncapped', 'secondary')"
              @benefit-click="openBenefit"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="editable" class="q-pt-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              :model-value="card.study.primaryBranch"
              :options="primaryOptions"
              label="Primary branch"
              emit-value
              map-options
              clearable
              dense
              outlined
              @update:model-value="(v) => onBranchChange('primaryBranch', v)"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              :model-value="card.study.secondaryBranch"
              :options="secondaryOptions"
              label="Secondary branch"
              emit-value
              map-options
              clearable
              dense
              outlined
              @update:model-value="(v) => onBranchChange('secondaryBranch', v)"
            />
          </div>
        </div>
      </q-card-section>
    </template>

    <q-dialog v-model="benefitOpen">
      <q-card class="benefit-detail-card">
        <q-card-section>
          <div class="text-h6">{{ benefitTitle }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ benefitBody }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" @click="benefitOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import BranchStudyColumn from 'components/BranchStudyColumn.vue'

defineProps({
  card: { type: Object, required: true },
  editable: { type: Boolean, default: false },
  primaryOptions: { type: Array, required: true },
  secondaryOptions: { type: Array, required: true },
  branchImageUrl: { type: Function, required: true },
})

const emit = defineEmits(['branch-change', 'increment', 'decrement', 'toggle-uncapped'])

const benefitOpen = ref(false)
const benefitTitle = ref('')
const benefitBody = ref('')

function onBranchChange(field, value) {
  emit('branch-change', { [field]: value ?? null })
}

function openBenefit(benefit) {
  benefitTitle.value = benefit.name
  benefitBody.value = benefit.description
  benefitOpen.value = true
}
</script>

<style scoped>
.study-hero-card {
  background: var(--sot-parchment-light);
  border-color: var(--sot-border);
}

.benefit-detail-card {
  min-width: 20rem;
  max-width: min(28rem, 92vw);
}
</style>
