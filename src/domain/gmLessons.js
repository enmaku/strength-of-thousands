export function getGmLessons() {
  const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

  return [
    {
      title: 'Nantambu',
      caption: 'Reference · Song-Wind City gazetteer',
      href: `${pagesBase}/reference/sot-nantambu.html`,
    },
    {
      title: 'Magaambya & Jatembe',
      caption: 'Reference · history, Ten Magic Warriors, timeline',
      href: `${pagesBase}/reference/sot-magaambya-history.html`,
    },
    {
      title: 'Campus NPCs',
      caption: 'Reference · faculty, staff & Spire Dorm cohort',
      href: `${pagesBase}/reference/sot-campus-npcs.html`,
    },
    {
      title: 'Glossary & NPC quick ref',
      caption: 'Reference · session lookup sheet',
      href: `${pagesBase}/reference/sot-glossary-and-npcs.html`,
    },
    {
      title: 'Thematic GM guide',
      caption: 'Reference · themes, push moments, arcs',
      href: `${pagesBase}/reference/sot-thematic-guide.html`,
    },
    {
      title: 'Party — Your PCs in Book 1',
      caption: 'GM prep · spells, feats & hooks',
      href: `${pagesBase}/lessons/0008-party-character-analysis-gm-prep.html`,
    },
    {
      title: 'Academia Downtime',
      caption: 'GM prep · Study, Cram & Practical Research',
      href: `${pagesBase}/lessons/0007-academia-downtime-gm-prep.html`,
    },
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
}
