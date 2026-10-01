/**
 * Published player-facing rules handouts shown on the Rules tab.
 * Paths are relative to the site base (served from /lessons in dev and dist).
 * Recipe for new handouts: reference/sot-player-rules-guide.md
 *
 * The Rules tab selects a handout with `?doc=<id>` on `/rules`
 * (`/#/rules?doc=branch-implements`).
 */
export function getPublishedPlayerRules() {
  const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

  return [
    {
      id: 'academia-downtime',
      title: 'Academia Downtime',
      caption: 'Study, Cram & Practical Research',
      href: `${pagesBase}/lessons/0007-academia-downtime-gm-prep.html`,
    },
    {
      id: 'magaambya-branches',
      title: 'Magaambya Branches',
      caption: 'Virtues, members & branch levels',
      href: `${pagesBase}/lessons/0018-magaambya-branches.html`,
    },
    {
      id: 'branch-implements',
      title: 'Branch Implements',
      caption: 'Magaambyan staves',
      href: `${pagesBase}/lessons/0013-branch-implements-gm-prep.html`,
    },
    {
      id: 'campus-crafting',
      title: 'Campus Crafting',
      caption: 'Downtime item crafting',
      href: `${pagesBase}/lessons/0014-campus-crafting.html`,
    },
    {
      id: 'spirit-masks',
      title: 'Spirit Masks',
      caption: 'First Masking, familiar, transfer & craft',
      href: `${pagesBase}/lessons/0015-spirit-masks.html`,
    },
  ]
}

export function rulesDocIdFromQuery(value, catalog = getPublishedPlayerRules()) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw === '') return null
  return catalog.some((doc) => doc.id === raw) ? raw : null
}

export function rulesPageHref(docId, pagesBase = import.meta.env.BASE_URL) {
  if (!rulesDocIdFromQuery(docId)) return null
  const prefix = String(pagesBase ?? '').replace(/\/$/, '')
  return `${prefix}/#/rules?doc=${encodeURIComponent(docId)}`
}
