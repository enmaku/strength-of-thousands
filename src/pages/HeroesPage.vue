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
          No heroes yet. Import a character from PathBuilder to build the party roster.
        </q-banner>
        <q-banner v-else class="bg-grey-2 sot-muted" rounded>
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
        <div v-if="gmMode" class="row">
          <q-btn
            color="primary"
            label="Add hero"
            icon="add"
            class="self-start"
            @click="openAddDialog"
          />
        </div>

        <div class="hero-grid">
          <template v-for="hero in sortedRoster" :key="hero.slug">
            <HeroTile
              v-if="heroTileFor(hero.slug)"
              :tile="heroTileFor(hero.slug)"
              :editable="gmMode"
              :updating="refreshingSlug === hero.slug"
              @refresh="onRefresh(hero.slug)"
            />
          </template>
        </div>
      </template>
    </div>

    <q-dialog v-model="addDialogOpen" persistent>
      <q-card style="min-width: 20rem">
        <q-card-section>
          <div class="text-h6">Import hero</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="importInput"
            label="PathBuilder URL or character id"
            autofocus
            hint="e.g. 450903 or pathbuilder2e.com/json.php?id=…"
            :rules="[(v) => !!v?.trim() || 'URL or id is required']"
            @keyup.enter="submitImport"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="closeAddDialog" />
          <q-btn
            flat
            label="Import"
            color="primary"
            :disable="!importInput.trim() || importing"
            :loading="importing"
            @click="submitImport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
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
  loadRoster,
  loadAllHeroes,
  ensureHeroLoaded,
  heroTileFor,
  importHero,
  refreshHero,
} = useHeroRoster()

const addDialogOpen = ref(false)
const importInput = ref('')
const importing = ref(false)
const refreshingSlug = ref(null)

onMounted(async () => {
  await loadRoster()
  if (sortedRoster.value.length) {
    await loadAllHeroes()
  }
})

function openAddDialog() {
  importInput.value = ''
  addDialogOpen.value = true
}

function closeAddDialog() {
  addDialogOpen.value = false
}

async function submitImport() {
  const input = importInput.value.trim()
  if (!input) return

  importing.value = true
  try {
    const slug = await importHero(input)
    closeAddDialog()
    $q.notify({ type: 'positive', message: `Imported ${sortedRoster.value.find((h) => h.slug === slug)?.displayName ?? 'hero'}` })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    importing.value = false
  }
}

async function onRefresh(slug) {
  refreshingSlug.value = slug
  try {
    await ensureHeroLoaded(slug)
    await refreshHero(slug)
    $q.notify({ type: 'positive', message: 'Hero updated from PathBuilder' })
  } catch (err) {
    $q.notify({ type: 'negative', message: err.message })
  } finally {
    refreshingSlug.value = null
  }
}
</script>

<style scoped>
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
  gap: 1rem;
}
</style>
