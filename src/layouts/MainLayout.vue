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
              label="Social"
            />
            <q-route-tab
              to="/study"
              name="/study"
              icon="school"
              label="Study"
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

      <nav class="mobile-nav xs" aria-label="Primary">
        <router-link
          v-for="item in mobileNavItems"
          :key="item.to"
          :to="item.to"
          class="mobile-nav__item"
          :class="{ 'mobile-nav__item--active': route.path === item.to }"
        >
          <q-icon :name="item.icon" size="1.35rem" />
          <span class="mobile-nav__label">{{ item.label }}</span>
        </router-link>
      </nav>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getGmLessons } from '../domain/gmLessons.js'
import { isGmMode } from '../domain/mode.js'

const logoUrl = `${import.meta.env.BASE_URL}magaambya-symbol-topbar.png`
const gmMode = isGmMode()
const lessons = getGmLessons()

const route = useRoute()

const mobileNavItems = [
  { to: '/heroes', icon: 'groups', label: 'Heroes' },
  { to: '/relationships', icon: 'favorite', label: 'Social' },
  { to: '/study', icon: 'school', label: 'Study' },
  { to: '/transcripts', icon: 'forum', label: 'Transcripts' },
]

function openLessonInNewTab(href) {
  window.open(href, '_blank', 'noopener,noreferrer')
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

.mobile-nav {
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  padding: 0.35rem 0.25rem 0.5rem;
  border-top: 1px solid rgba(252, 242, 209, 0.15);
}

.mobile-nav__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  padding: 0.25rem 0.15rem;
  color: var(--sot-parchment-light);
  opacity: 0.55;
  text-decoration: none;
  min-width: 0;
}

.mobile-nav__item--active {
  opacity: 1;
}

.mobile-nav__label {
  font-size: 0.65rem;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
}
</style>
