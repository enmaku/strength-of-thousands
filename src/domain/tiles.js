import { deriveUnlocks } from './unlocks.js'

export function buildStudentTile(catalogEntry, hearts) {
  const disposition = Math.max(0, Math.min(5, hearts ?? 0))
  const unlocks = deriveUnlocks(disposition)

  return {
    slug: catalogEntry.slug,
    displayName: catalogEntry.displayName,
    branch: catalogEntry.branch,
    portrait: catalogEntry.portrait,
    thumb: catalogEntry.thumb,
    disposition,
    classroomAdvantageUnlocked: unlocks.classroomAdvantage,
    uncommonRulesUnlocked: unlocks.uncommonRules,
    classroomAdvantageTooltip: catalogEntry.classroomAdvantage,
    uncommonRulesTooltip: `${catalogEntry.uncommonRules.name}: ${catalogEntry.uncommonRules.description}`,
    uncommonRulesName: catalogEntry.uncommonRules.name,
  }
}

export function buildHeroTiles(catalog, relationships) {
  return catalog.map((entry) => buildStudentTile(entry, relationships[entry.slug]))
}
