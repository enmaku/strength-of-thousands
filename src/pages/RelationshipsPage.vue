<template>
  <q-page class="q-pa-lg">
    <div class="column q-gutter-md">

      <q-banner v-if="error" class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner size="2rem" />
      </div>

      <template v-else-if="tabs.heroes.length === 0">
        <q-banner v-if="gmMode" class="sot-callout" rounded>
          No heroes yet.
          <router-link to="/heroes" class="text-primary">Import heroes on the Heroes page</router-link>
          to start tracking Spire Dorm friendships.
        </q-banner>
        <q-banner v-else class="bg-grey-2 sot-muted" rounded>
          No heroes published yet. Check back after the GM updates campaign state.
        </q-banner>
      </template>

      <template v-else>
        <q-tabs
          v-model="activeTab"
          dense
          align="left"
          active-color="primary"
          indicator-color="primary"
          @update:model-value="onTabChange"
        >
          <q-tab
            v-for="hero in tabs.heroes"
            :key="hero.slug"
            :name="hero.slug"
            :label="hero.displayName"
          />
        </q-tabs>

        <q-tab-panels v-model="activeTab" class="relationship-panels">
          <q-tab-panel
            v-for="hero in tabs.heroes"
            :key="hero.slug"
            :name="hero.slug"
            class="q-pa-none"
          >
            <div class="student-grid">
              <StudentTile
                v-for="tile in tilesForHero(hero.slug)"
                :key="tile.slug"
                :tile="tile"
                :portrait-url="portraitUrl(tile.thumb)"
                :portrait-full-url="portraitUrl(tile.portrait)"
                :editable="gmMode"
                @set-hearts="(hearts) => onSetHearts(hero.slug, tile.slug, hearts)"
              />
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import StudentTile from 'components/StudentTile.vue'
import { useHeroRoster } from '../composables/useHeroRoster.js'

const $q = useQuasar()
const {
  gmMode,
  loading,
  error,
  tabs,
  loadRoster,
  ensureHeroLoaded,
  tilesForHero,
  setDisposition,
  portraitUrl,
} = useHeroRoster()

const activeTab = ref(null)

watch(
  () => tabs.value.defaultSlug,
  (slug) => {
    if (slug) {
      activeTab.value = slug
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await loadRoster()
  if (tabs.value.defaultSlug) {
    activeTab.value = tabs.value.defaultSlug
    await ensureHeroLoaded(tabs.value.defaultSlug)
  }
})

async function onTabChange(name) {
  if (name) {
    try {
      await ensureHeroLoaded(name)
    } catch (err) {
      $q.notify({ type: 'negative', message: err.message })
    }
  }
}

async function onSetHearts(heroSlug, studentSlug, hearts) {
  try {
    await setDisposition(heroSlug, studentSlug, hearts)
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  }
}
</script>

<style scoped>
.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}

.relationship-panels {
  display: contents;
}

.relationship-panels :deep(.q-panel) {
  height: auto;
  overflow: visible;
}

.relationship-panels :deep(.q-panel > div) {
  height: auto;
}
</style>
