/**
 * Published player-facing rules handouts shown on the Rules tab.
 * Paths are relative to the site base (served from /lessons in dev and dist).
 * Recipe for new handouts: reference/sot-player-rules-guide.md
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
  ]
}
