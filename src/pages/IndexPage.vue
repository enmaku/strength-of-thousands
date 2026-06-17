<template>
  <q-page class="q-pa-lg">
    <div class="column q-gutter-md" style="max-width: 40rem">
      <h1 class="text-h4 q-my-none">Strength of Thousands</h1>
      <p class="text-body1 text-grey-8">
        GM tools and references for the Pathfinder 2e adventure path. Player tools and campaign
        utilities will live here; for now this is a blank shell alongside the teaching workspace.
      </p>

      <q-list bordered class="rounded-borders">
        <q-item-label header>GM prep lessons (static HTML)</q-item-label>
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
      </q-list>

      <p class="text-caption text-grey-7">
        Lesson links work on the deployed site after build. In local dev, open files from
        <code>lessons/</code> directly or run <code>./scripts/build-for-pages.sh</code>.
      </p>
    </div>
  </q-page>
</template>

<script setup>
const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

const lessons = [
  {
    title: 'Book 1 — Kindled Magic',
    caption: 'GM prep lesson',
    href: `${pagesBase}/lessons/0001-kindled-magic-gm-prep.html`,
  },
  {
    title: 'Book 2 — Spoken on the Song Wind',
    caption: 'GM prep lesson',
    href: `${pagesBase}/lessons/0002-spoken-on-the-song-wind-gm-prep.html`,
  },
  {
    title: 'Book 6 — Shadows of the Ancients',
    caption: 'GM prep lesson',
    href: `${pagesBase}/lessons/0003-shadows-of-the-ancients-gm-prep.html`,
  },
]
</script>
