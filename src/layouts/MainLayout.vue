<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <router-link to="/" class="home-link toolbar-brand">
            <img
              :src="logoUrl"
              alt=""
              class="toolbar-logo"
              width="39"
              height="36"
            />
            Strength of Thousands
          </router-link>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
const logoUrl = `${import.meta.env.BASE_URL}magaambya-symbol-topbar.png`
</script>

<style scoped>
.home-link {
  color: inherit;
  text-decoration: none;
}

.toolbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.toolbar-logo {
  display: block;
  height: 36px;
  width: auto;
}
</style>
