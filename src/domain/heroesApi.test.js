import { describe, expect, it } from 'vitest'
import fixture from './fixtures/pathbuilder-450903.json'
import { HeroImportError, planHeroImportWithCatalog, planHeroRefresh } from './heroesApi.js'

const taraanBuild = fixture.build

describe('planHeroImportWithCatalog', () => {
  it('returns hero file and slug for a new import', () => {
    const result = planHeroImportWithCatalog(taraanBuild, 450903, [], ['anchor-root'])

    expect(result.slug).toBe('taraan-skyseeker')
    expect(result.hero.pathbuilderId).toBe(450903)
    expect(result.hero.displayName).toBe('Taraan Skyseeker')
    expect(result.hero.relationships).toEqual({ 'anchor-root': 1 })
  })

  it('rejects duplicate pathbuilder id', () => {
    const heroesBySlug = {
      'taraan-skyseeker': { pathbuilderId: 450903 },
    }

    expect(() =>
      planHeroImportWithCatalog(taraanBuild, 450903, [], ['anchor-root'], heroesBySlug),
    ).toThrow(HeroImportError)

    try {
      planHeroImportWithCatalog(taraanBuild, 450903, [], ['anchor-root'], heroesBySlug)
    } catch (err) {
      expect(err.status).toBe(409)
      expect(err.message).toContain('Update')
    }
  })

  it('rejects duplicate slug', () => {
    expect(() =>
      planHeroImportWithCatalog(taraanBuild, 450903, [{ slug: 'taraan-skyseeker', displayName: 'Taraan' }], [
        'anchor-root',
      ]),
    ).toThrow(HeroImportError)
  })
})

describe('planHeroRefresh', () => {
  it('merges fresh build while preserving relationships', () => {
    const existing = {
      pathbuilderId: 450903,
      displayName: 'Old',
      build: { name: 'Old', level: 1 },
      relationships: { 'anchor-root': 4 },
    }

    const refreshed = planHeroRefresh(existing, taraanBuild)
    expect(refreshed.displayName).toBe('Taraan Skyseeker')
    expect(refreshed.build).toEqual(taraanBuild)
    expect(refreshed.relationships).toEqual({ 'anchor-root': 4 })
    expect(refreshed.pathbuilderId).toBe(450903)
  })
})
