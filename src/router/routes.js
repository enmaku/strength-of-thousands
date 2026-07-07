const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'relationships', component: () => import('pages/RelationshipsPage.vue') },
      { path: 'study', component: () => import('pages/StudyPage.vue') },
      { path: 'heroes', component: () => import('pages/HeroesPage.vue') },
      { path: 'transcripts', component: () => import('pages/TranscriptsPage.vue') },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
