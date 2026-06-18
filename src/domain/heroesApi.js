import { slugify } from './heroes.js'
import { createHeroFromImport, isPathbuilderIdInRoster, mergeHeroUpdate } from './pathbuilder.js'

export class HeroImportError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'HeroImportError'
    this.status = status
  }
}

export function planHeroImport(build, pathbuilderId, roster, heroesBySlug = {}) {
  if (isPathbuilderIdInRoster(pathbuilderId, Object.values(heroesBySlug))) {
    throw new HeroImportError(
      'This PathBuilder character is already in the roster — use Update on that hero instead',
      409,
    )
  }

  const slug = slugify(build.name)
  if (roster.some((entry) => entry.slug === slug) || heroesBySlug[slug]) {
    throw new HeroImportError('A hero with this name already exists', 409)
  }

  return { slug, hero: createHeroFromImport(build, pathbuilderId, []) }
}

export function planHeroImportWithCatalog(build, pathbuilderId, roster, catalogSlugs, heroesBySlug = {}) {
  const planned = planHeroImport(build, pathbuilderId, roster, heroesBySlug)
  return {
    slug: planned.slug,
    hero: createHeroFromImport(build, pathbuilderId, catalogSlugs),
  }
}

export function planHeroRefresh(existingHero, freshBuild) {
  if (!existingHero?.pathbuilderId) {
    throw new HeroImportError('Hero has no stored PathBuilder id', 400)
  }
  return mergeHeroUpdate(existingHero, freshBuild)
}
