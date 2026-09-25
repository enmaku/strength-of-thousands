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
          No heroes yet. Add hero JSON under <code>heroes/</code> and list them in
          <code>heroes/index.json</code>.
        </q-banner>
        <q-banner v-else class="bg-grey-2 sot-muted" rounded>
          No heroes published yet. Check back after the GM updates campaign state.
        </q-banner>
      </template>

      <template v-else>
        <div class="row q-col-gutter-md">
          <div
            v-for="hero in sortedRoster"
            :key="hero.slug"
            class="col-12 col-sm-6 col-md-4"
          >
            <HeroTile
              v-if="heroTileFor(hero.slug)"
              :tile="heroTileFor(hero.slug)"
            />
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import HeroTile from 'components/HeroTile.vue'
import { useHeroRoster } from '../composables/useHeroRoster.js'

const {
  gmMode,
  loading,
  error,
  sortedRoster,
  loadRoster,
  loadAllHeroes,
  heroTileFor,
} = useHeroRoster()

onMounted(async () => {
  await loadRoster()
  if (sortedRoster.value.length) {
    await loadAllHeroes()
  }
})
</script>
