<template>
  <button
    type="button"
    class="portrait-lightbox-trigger"
    :aria-label="`View portrait of ${alt}`"
    @click="open = true"
  >
    <slot />
  </button>

  <q-dialog v-model="open" maximized transition-show="fade" transition-hide="fade">
    <div class="portrait-lightbox-backdrop column items-center justify-center" @click="open = false">
      <q-card flat class="portrait-lightbox-card bg-transparent" @click.stop>
        <q-card-section class="row items-start justify-end q-pa-sm">
          <q-btn flat round dense icon="close" color="white" aria-label="Close" @click="open = false" />
        </q-card-section>
        <q-card-section class="q-pt-none column items-center">
          <q-img
            :src="fullSrc"
            :alt="alt"
            fit="contain"
            class="portrait-lightbox-image"
            spinner-color="white"
          />
          <div class="text-h6 text-white q-mt-md text-center">{{ alt }}</div>
        </q-card-section>
      </q-card>
    </div>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  fullSrc: { type: String, required: true },
  alt: { type: String, required: true },
})

const open = ref(false)
</script>

<style scoped>
.portrait-lightbox-trigger {
  padding: 0;
  border: none;
  background: none;
  cursor: zoom-in;
  border-radius: 4px;
  line-height: 0;
}

.portrait-lightbox-trigger:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.portrait-lightbox-backdrop {
  min-height: 100%;
  background: rgba(0, 0, 0, 0.88);
}

.portrait-lightbox-card {
  max-width: min(42rem, 92vw);
  width: 100%;
}

.portrait-lightbox-image {
  width: min(36rem, 88vw);
  max-height: 75vh;
}
</style>
