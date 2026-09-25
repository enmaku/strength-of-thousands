<template>
  <q-card flat bordered class="hero-tile">
    <q-card-section class="hero-header q-pb-sm">
      <div class="text-h6 text-weight-bold">{{ tile.name }}</div>
      <div v-if="tile.tagline" class="text-caption sot-muted">{{ tile.tagline }}</div>
    </q-card-section>

    <q-card-section class="hero-bio q-pt-none">
      <p class="bio-text">{{ tile.bio }}</p>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  tile: { type: Object, required: true },
})
</script>

<style scoped>
.hero-tile {
  background: var(--sot-parchment-light);
  border-color: var(--sot-border);
  height: 100%;
}

.hero-header {
  border-bottom: 1px solid var(--sot-border);
}

.bio-text {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--sot-ink);
}
</style>
