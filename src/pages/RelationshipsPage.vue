<template>
  <q-page
    class="relationships-page column"
    :class="{ 'relationships-page--mobile': $q.screen.xs }"
    :style-fn="pageStyle"
  >
    <div v-if="error" class="col-auto relationships-page__banner">
      <q-banner class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>
    </div>

    <div v-if="loading" class="col row flex-center q-pa-xl">
      <q-spinner size="2rem" />
    </div>

    <template v-else-if="tabs.heroes.length === 0">
      <div class="col relationships-page__empty">
        <q-banner v-if="gmMode" class="sot-callout" rounded>
          No heroes yet.
          <router-link to="/heroes" class="text-primary">Import heroes on the Heroes page</router-link>
          to start tracking Spire Dorm friendships.
        </q-banner>
        <q-banner v-else class="bg-grey-2 sot-muted" rounded>
          No heroes published yet. Check back after the GM updates campaign state.
        </q-banner>
      </div>
    </template>

    <template v-else>
      <div v-if="$q.screen.xs" class="col-auto relationships-select">
        <q-select
          v-model="activeTab"
          :options="heroSelectOptions"
          emit-value
          map-options
          dense
          outlined
          options-dense
          behavior="menu"
          :clearable="false"
          aria-label="Adventurer"
          @update:model-value="onTabChange"
        />
      </div>

      <q-tabs
        v-else
        v-model="activeTab"
        class="col-auto"
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

      <q-scroll-area v-if="$q.screen.xs" class="col relationships-scroll">
        <div class="relationships-scroll__inner">
          <div class="student-grid">
            <StudentTile
              v-for="tile in tilesForHero(activeTab)"
              :key="tile.slug"
              :tile="tile"
              :portrait-url="portraitUrl(tile.thumb)"
              :portrait-full-url="portraitUrl(tile.portrait)"
              :editable="gmMode"
              @set-hearts="(hearts) => onSetHearts(activeTab, tile.slug, hearts)"
            />
          </div>
        </div>
      </q-scroll-area>

      <div v-else class="col relationships-scroll relationships-scroll--desktop">
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
      </div>
    </template>
  </q-page>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
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

const heroSelectOptions = computed(() =>
  tabs.value.heroes.map((hero) => ({
    label: hero.displayName,
    value: hero.slug,
  })),
)

function pageStyle(offset, height) {
  const filled = `${height - offset}px`
  if ($q.screen.xs) {
    return {
      height: filled,
      minHeight: filled,
      maxHeight: filled,
    }
  }
  return { minHeight: filled }
}

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
.relationships-page {
  padding: 1.5rem;
}

.relationships-page--mobile {
  padding: 0;
}

.relationships-page__banner,
.relationships-page__empty {
  padding: 1rem 1.5rem;
}

.relationships-select {
  padding: 0.75rem 1rem;
  background: var(--sot-parchment-light);
  border-bottom: 1px solid var(--sot-border);
}

.relationships-scroll__inner {
  padding: 1rem 1rem 1.5rem;
}

.relationships-scroll--desktop {
  padding-top: 1rem;
  overflow: visible;
}

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
