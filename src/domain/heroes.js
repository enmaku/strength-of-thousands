export function slugify(displayName) {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createHeroState(displayName, catalogSlugs) {
  const relationships = Object.fromEntries(catalogSlugs.map((slug) => [slug, 0]))
  return {
    displayName: displayName.trim(),
    relationships,
  }
}

export function sortHeroes(heroes) {
  return [...heroes].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
  )
}

export function defaultHearts(catalogSlugs, relationships = {}) {
  return Object.fromEntries(
    catalogSlugs.map((slug) => [slug, Math.max(0, Math.min(5, relationships[slug] ?? 0))]),
  )
}

export function buildHeroTabs(heroes, isGm) {
  const sorted = sortHeroes(heroes)
  return {
    heroes: sorted,
    showAddTab: isGm,
    defaultSlug: sorted[0]?.slug ?? null,
  }
}
