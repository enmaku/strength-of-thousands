<template>
  <q-page class="q-pa-lg">
    <div class="column q-gutter-md">
      <q-banner v-if="error" class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner size="2rem" />
      </div>

      <template v-else-if="sortedRoster.length === 0">
        <q-banner v-if="gmMode" class="sot-callout" rounded>
          No heroes yet.
          <router-link to="/heroes" class="text-primary">Import heroes on the Heroes page</router-link>
          to start tracking branch study.
        </q-banner>
        <q-banner v-else class="bg-grey-2 sot-muted" rounded>
          No heroes published yet. Check back after the GM updates campaign state.
        </q-banner>
      </template>

      <template v-else>
        <div class="column q-gutter-md study-hero-list">
          <template v-for="hero in sortedRoster" :key="hero.slug">
            <StudyHeroCard
              v-if="studyCardFor(hero.slug)"
              :card="studyCardFor(hero.slug)"
              :editable="gmMode"
              :primary-options="branchOptions(studyCardFor(hero.slug)?.study.secondaryBranch)"
              :secondary-options="branchOptions(studyCardFor(hero.slug)?.study.primaryBranch)"
              :branch-image-url="branchImageUrl"
              @branch-change="(patch) => onBranchChange(hero.slug, patch)"
              @increment="(role) => onIncrement(hero.slug, role)"
              @decrement="(role) => onDecrement(hero.slug, role)"
              @toggle-uncapped="(role) => onToggleUncapped(hero.slug, role)"
            />
          </template>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useQuasar } from 'quasar'
import StudyHeroCard from 'components/StudyHeroCard.vue'
import { useHeroRoster } from '../composables/useHeroRoster.js'

const $q = useQuasar()
const {
  gmMode,
  loading,
  error,
  sortedRoster,
  loadRoster,
  loadAllHeroes,
  studyCardFor,
  branchOptions,
  branchImageUrl,
  setStudy,
  incrementBranch,
  decrementBranch,
} = useHeroRoster()

onMounted(async () => {
  await loadRoster()
  if (sortedRoster.value.length > 0) {
    try {
      await loadAllHeroes()
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message })
    }
  }
})

async function onBranchChange(heroSlug, patch) {
  try {
    await setStudy(heroSlug, patch)
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  }
}

async function onIncrement(heroSlug, role) {
  try {
    await incrementBranch(heroSlug, role)
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  }
}

async function onDecrement(heroSlug, role) {
  try {
    await decrementBranch(heroSlug, role)
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  }
}

async function onToggleUncapped(heroSlug, role) {
  const card = studyCardFor(heroSlug)
  if (!card) return
  const key = role === 'primary' ? 'primaryUncapped' : 'secondaryUncapped'
  try {
    await setStudy(heroSlug, { [key]: !card.study[key] })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  }
}
</script>

<style scoped>
.study-hero-list {
  max-width: 56rem;
}
</style>
