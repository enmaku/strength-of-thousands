<template>
  <q-page class="q-pa-lg">
    <div class="column q-gutter-md" style="max-width: 40rem">
      <h1 class="text-h4 q-my-none">Strength of Thousands</h1>
      <p class="text-body1 sot-muted">
        Campaign companion for the Pathfinder 2e Strength of Thousands table. Track Spire Dorm
        friendships, browse campaign tools, and access GM prep when running locally.
      </p>

      <q-list bordered class="rounded-borders">
        <q-item-label header>Campaign tools</q-item-label>
        <q-item clickable v-ripple to="/relationships">
          <q-item-section avatar>
            <q-icon name="favorite" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Relationship tracker</q-item-label>
            <q-item-label caption>Spire Dorm friendships and classroom benefits</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-list v-if="gmMode" bordered class="rounded-borders">
        <q-expansion-item label="GM prep lessons (static HTML)">
          <q-item
            v-for="lesson in lessons"
            :key="lesson.href"
            clickable
            tag="a"
            :href="lesson.href"
            target="_blank"
            rel="noopener"
          >
            <q-item-section>
              <q-item-label>{{ lesson.title }}</q-item-label>
              <q-item-label caption>{{ lesson.caption }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="open_in_new" />
            </q-item-section>
          </q-item>
        </q-expansion-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
import { isGmMode } from '../domain/mode.js'

const gmMode = isGmMode()
const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

const lessons = [
  {
    title: 'Book 1 — Kindled Magic',
    caption: 'GM prep · levels 1→4',
    href: `${pagesBase}/lessons/0001-kindled-magic-gm-prep.html`,
  },
  {
    title: 'Book 2 — Spoken on the Song Wind',
    caption: 'GM prep · levels 4→8',
    href: `${pagesBase}/lessons/0002-spoken-on-the-song-wind-gm-prep.html`,
  },
  {
    title: "Book 3 — Hurricane's Howl",
    caption: 'GM prep · levels 8→12',
    href: `${pagesBase}/lessons/0004-hurricanes-howl-gm-prep.html`,
  },
  {
    title: 'Book 4 — Secrets of the Temple-City',
    caption: 'GM prep · levels 12→15',
    href: `${pagesBase}/lessons/0005-secrets-temple-city-gm-prep.html`,
  },
  {
    title: 'Book 5 — Doorway to the Red Star',
    caption: 'GM prep · levels 15→18',
    href: `${pagesBase}/lessons/0006-doorway-to-the-red-star-gm-prep.html`,
  },
  {
    title: 'Book 6 — Shadows of the Ancients',
    caption: 'GM prep · levels 18→20',
    href: `${pagesBase}/lessons/0003-shadows-of-the-ancients-gm-prep.html`,
  },
]
</script>
