<template>
  <q-page class="q-pa-lg">
    <div class="column q-gutter-md">
      <div class="row items-center q-gutter-sm">
        <q-btn flat round icon="arrow_back" to="/" aria-label="Back to index" />
        <h1 class="text-h4 q-my-none">Relationship tracker</h1>
      </div>

      <q-banner v-if="error" class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner size="2rem" />
      </div>

      <template v-else-if="tabs.heroes.length === 0">
        <q-banner v-if="gmMode" class="bg-blue-1 text-blue-10" rounded>
          No heroes yet. Add a hero to start tracking Spire Dorm friendships.
        </q-banner>
        <q-banner v-else class="bg-grey-2 text-grey-9" rounded>
          No heroes published yet. Check back after the GM updates campaign state.
        </q-banner>
        <q-btn
          v-if="gmMode"
          color="primary"
          label="Add hero"
          icon="add"
          class="self-start"
          @click="openAddDialog"
        />
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
          <q-tab v-if="tabs.showAddTab" name="__add__" icon="add" aria-label="Add hero" />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated>
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

    <q-dialog v-model="addDialogOpen" persistent>
      <q-card style="min-width: 20rem">
        <q-card-section>
          <div class="text-h6">Add hero</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="newHeroName"
            label="Hero name"
            autofocus
            :rules="[(v) => !!v?.trim() || 'Name is required']"
            @keyup.enter="submitAddHero"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeAddDialog" />
          <q-btn
            flat
            label="Add"
            color="primary"
            :disable="!newHeroName.trim()"
            @click="submitAddHero"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  createHero,
  portraitUrl,
} = useHeroRoster()

const activeTab = ref(null)
const addDialogOpen = ref(false)
const newHeroName = ref('')

watch(
  () => tabs.value.defaultSlug,
  (slug) => {
    if (slug && activeTab.value !== '__add__') {
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
  if (name === '__add__') {
    openAddDialog()
    activeTab.value = tabs.value.heroes[0]?.slug ?? null
    return
  }
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

function openAddDialog() {
  newHeroName.value = ''
  addDialogOpen.value = true
}

function closeAddDialog() {
  addDialogOpen.value = false
}

async function submitAddHero() {
  const name = newHeroName.value.trim()
  if (!name) return

  try {
    const slug = await createHero(name)
    closeAddDialog()
    activeTab.value = slug
    $q.notify({ type: 'positive', message: `Added ${name}` })
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
</style>
