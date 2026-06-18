<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          class="xs"
          flat
          round
          dense
          icon="menu"
          aria-label="Open menu"
          @click="leftDrawerOpen = true"
        />

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

        <q-space class="gt-xs" />

        <div class="row items-center no-wrap gt-xs">
          <q-tabs inline-label :model-value="activePath" align="right" shrink>
            <q-route-tab
              to="/heroes"
              name="/heroes"
              icon="groups"
              label="Heroes"
            />
            <q-route-tab
              to="/relationships"
              name="/relationships"
              icon="favorite"
              label="Relationships"
            />
            <q-route-tab
              to="/transcripts"
              name="/transcripts"
              icon="forum"
              label="Transcripts"
            />
          </q-tabs>
          <q-btn-dropdown
            v-if="gmMode"
            flat
            dense
            stretch
            label="GM prep"
            dropdown-icon="expand_more"
            class="q-ml-xs"
            content-class="bg-toolbar-menu"
          >
            <q-list
              dense
              class="bg-toolbar-menu"
              style="min-width: 220px"
            >
              <q-item
                v-for="lesson in lessons"
                :key="lesson.href"
                v-ripple
                clickable
                v-close-popup
                @click="openLessonInNewTab(lesson.href)"
              >
                <q-item-section>
                  <q-item-label>{{ lesson.title }}</q-item-label>
                  <q-item-label caption>{{ lesson.caption }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="open_in_new" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" overlay bordered class="xs">
      <q-list padding>
        <q-item
          v-ripple
          clickable
          to="/heroes"
          :active="route.path === '/heroes'"
          active-class="bg-grey-3 text-weight-medium"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>
          <q-item-section>Heroes</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          to="/relationships"
          :active="route.path === '/relationships'"
          active-class="bg-grey-3 text-weight-medium"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar>
            <q-icon name="favorite" />
          </q-item-section>
          <q-item-section>Relationships</q-item-section>
        </q-item>

        <q-item
          v-ripple
          clickable
          to="/transcripts"
          :active="route.path === '/transcripts'"
          active-class="bg-grey-3 text-weight-medium"
          @click="leftDrawerOpen = false"
        >
          <q-item-section avatar>
            <q-icon name="forum" />
          </q-item-section>
          <q-item-section>Transcripts</q-item-section>
        </q-item>

        <template v-if="gmMode">
          <q-separator spaced />
          <q-item-label header>GM prep</q-item-label>
          <q-item
            v-for="lesson in lessons"
            :key="lesson.href"
            v-ripple
            clickable
            @click="openLessonInNewTab(lesson.href)"
          >
            <q-item-section>
              <q-item-label>{{ lesson.title }}</q-item-label>
              <q-item-label caption>{{ lesson.caption }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="open_in_new" />
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getGmLessons } from '../domain/gmLessons.js'
import { isGmMode } from '../domain/mode.js'

const logoUrl = `${import.meta.env.BASE_URL}magaambya-symbol-topbar.png`
const gmMode = isGmMode()
const lessons = getGmLessons()

const route = useRoute()
const leftDrawerOpen = ref(false)

watch(
  () => route.path,
  () => {
    leftDrawerOpen.value = false
  },
)

function openLessonInNewTab(href) {
  window.open(href, '_blank', 'noopener,noreferrer')
  leftDrawerOpen.value = false
}

const activePath = computed(() => route.path)
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
