import { deriveHeroTile } from './pathbuilder.js'

export function slugify(displayName) {
  return displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createHeroState(displayName, catalogSlugs) {
  const relationships = Object.fromEntries(catalogSlugs.map((slug) => [slug, 1]))
  return {
    displayName: displayName.trim(),
    relationships,
  }
}

export function isActiveHero(hero) {
  return hero?.active !== false
}

export function activeHeroes(heroes) {
  return heroes.filter(isActiveHero)
}

export function sortHeroes(heroes) {
  return [...heroes].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
  )
}

export function defaultHearts(catalogSlugs, relationships = {}) {
  return Object.fromEntries(
    catalogSlugs.map((slug) => [slug, Math.max(0, Math.min(5, relationships[slug] ?? 1))]),
  )
}

export function buildHeroTabs(heroes) {
  const sorted = sortHeroes(activeHeroes(heroes))
  return {
    heroes: sorted,
    defaultSlug: sorted[0]?.slug ?? null,
  }
}

const PRONOUNS_RE = /^[a-z]+(?:\/[a-z]+)+$/i

/** Split a trailing "he/him"-style segment off a " · "-separated tagline. */
export function splitTagline(tagline) {
  const parts = (tagline ?? '')
    .split('·')
    .map((p) => p.trim())
    .filter(Boolean)
  const last = parts[parts.length - 1]
  if (last && PRONOUNS_RE.test(last)) {
    return { tagline: parts.slice(0, -1).join(' · '), pronouns: last }
  }
  return { tagline: parts.join(' · '), pronouns: '' }
}

export function deriveHeroBioTile(hero) {
  if (!hero) return null
  const name = hero.displayName?.trim()
  const bio = hero.bio?.trim()
  if (!name || !bio) return null

  const tile = {
    name,
    ...splitTagline(hero.tagline),
    bio,
  }

  if (hero.build) {
    const stats = deriveHeroTile(hero.build)
    Object.assign(tile, stats)
  }

  return tile
}
