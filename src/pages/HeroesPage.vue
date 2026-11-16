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
        <q-banner v-if="hasOnlyInactiveHeroes" class="bg-grey-2 sot-muted" rounded>
          No active heroes. Past heroes still appear in the
          <router-link to="/transcripts" class="text-primary">Transcripts</router-link> and
          <router-link to="/timeline" class="text-primary">Timeline</router-link>.
        </q-banner>
        <q-banner v-else-if="gmMode" class="sot-callout" rounded>
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
            >
              <q-btn
                v-if="gmMode && heroes[hero.slug]?.pathbuilderId"
                flat
                dense
                color="primary"
                label="Sync"
                :loading="refreshingSlug === hero.slug"
                @click="onRefresh(hero.slug)"
              />
            </HeroTile>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import HeroTile from 'components/HeroTile.vue'
import { useHeroRoster } from '../composables/useHeroRoster.js'

const $q = useQuasar()

const {
  gmMode,
  loading,
  error,
  sortedRoster,
  hasOnlyInactiveHeroes,
  heroes,
  loadRoster,
  loadAllHeroes,
  heroTileFor,
  ensureHeroLoaded,
  refreshHero,
} = useHeroRoster()

const refreshingSlug = ref(null)

onMounted(async () => {
  await loadRoster()
  if (sortedRoster.value.length) {
    await loadAllHeroes()
  }
})

async function onRefresh(slug) {
  refreshingSlug.value = slug
  try {
    await ensureHeroLoaded(slug)
    await refreshHero(slug)
    $q.notify({ type: 'positive', message: 'Hero synced from PathBuilder' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    refreshingSlug.value = null
  }
}
</script>
