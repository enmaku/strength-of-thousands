import { describe, expect, it } from 'vitest'
import fixture from './fixtures/pathbuilder-450903.json'
import {
  buildClassLine,
  createHeroFromImport,
  deriveHeroTile,
  extractBuildFromResponse,
  isPathbuilderIdInRoster,
  mergeHeroUpdate,
  parsePathbuilderId,
  pathbuilderJsonUrl,
} from './pathbuilder.js'

const taraanBuild = fixture.build
const TARAAN_URL = 'https://pathbuilder2e.com/json.php?id=450903'

describe('parsePathbuilderId', () => {
  it('accepts bare integer id', () => {
    expect(parsePathbuilderId('450903')).toBe(450903)
  })

  it('accepts full PathBuilder URL', () => {
    expect(parsePathbuilderId(TARAAN_URL)).toBe(450903)
  })

  it('rejects invalid input', () => {
    expect(() => parsePathbuilderId('not-an-id')).toThrow('Invalid PathBuilder id or URL')
  })
})

describe('pathbuilderJsonUrl', () => {
  it('returns canonical URL', () => {
    expect(pathbuilderJsonUrl(450903)).toBe(TARAAN_URL)
  })
})

describe('extractBuildFromResponse', () => {
  it('throws when success is false', () => {
    expect(() => extractBuildFromResponse({ success: false })).toThrow(
      'PathBuilder response was not successful',
    )
  })

  it('returns build from successful response', () => {
    expect(extractBuildFromResponse(fixture)).toEqual(taraanBuild)
  })
})

describe('buildClassLine', () => {
  it('orders class, dual class, and dedication archetypes', () => {
    expect(buildClassLine(taraanBuild)).toBe('Cleric / Witch / Winged Warrior')
  })

  it('includes dedication archetypes regardless of feat type label', () => {
    expect(
      buildClassLine({
        class: 'Inventor',
        feats: [['Wizard Dedication', null, 'Awarded Feat', 1]],
      }),
    ).toBe('Inventor / Wizard')
  })
})

describe('deriveHeroTile', () => {
  it('uses archetype spellcasting from dedication feats', () => {
    const tile = deriveHeroTile({
      class: 'Inventor',
      level: 1,
      abilities: { int: 14 },
      feats: [['Wizard Dedication', null, 'Awarded Feat', 1]],
      spellCasters: [
        {
          name: 'Archetype Wizard',
          ability: 'int',
          proficiency: 2,
          innate: false,
        },
      ],
    })

    expect(tile.classLine).toBe('Inventor / Wizard')
    expect(tile.spellAttack).toBe(5)
    expect(tile.spellDc).toBe(15)
  })

  it('derives Taraan reference stats', () => {
    const tile = deriveHeroTile(taraanBuild)

    expect(tile.name).toBe('Taraan Skyseeker')
    expect(tile.level).toBe(2)
    expect(tile.ancestry).toBe('Tengu')
    expect(tile.background).toBe('Archaeologist')
    expect(tile.classLine).toBe('Cleric / Witch / Winged Warrior')

    expect(tile.abilityMods).toEqual({
      str: 0,
      dex: 2,
      con: 0,
      int: 4,
      wis: 3,
      cha: 1,
    })

    expect(tile.ac).toBe(19)
    expect(tile.speed).toBe(20)
    expect(tile.maxHp).toBe(22)
    expect(tile.fortitude).toBe(6)
    expect(tile.reflex).toBe(6)
    expect(tile.will).toBe(9)
    expect(tile.passivePerception).toBe(17)

    expect(tile.primaryAttack).toEqual({
      name: 'Wordreaper',
      bonus: 7,
      damage: 'd4+1 S',
    })

    expect(tile.spellAttack).toBe(7)
    expect(tile.spellDc).toBe(17)

    expect(tile.proficiencies).toEqual({
      light: true,
      medium: true,
      heavy: false,
      shield: true,
      simple: true,
      martial: false,
    })

    expect(tile.languages).toEqual([
      'Dwarven',
      'Elven',
      'Empyrean',
      'Mwangi',
      'Xanmba',
      'Tengu',
    ])

    expect(tile.lores).toEqual([
      { name: 'Ancient Regional', rank: 2 },
      { name: 'Tengu', rank: 2 },
    ])
  })

  it('treats PathBuilder "None selected" as empty for languages and lores', () => {
    const tile = deriveHeroTile({
      ...taraanBuild,
      languages: ['Common', 'None selected', 'Elven'],
      lores: [
        ['Hunting', 2],
        ['None selected', 2],
      ],
    })

    expect(tile.languages).toEqual(['Common', 'Elven'])
    expect(tile.lores).toEqual([{ name: 'Hunting', rank: 2 }])
  })

  it('hides languages section when only placeholder is present', () => {
    const tile = deriveHeroTile({
      ...taraanBuild,
      languages: ['None selected'],
      lores: [],
    })

    expect(tile.languages).toEqual([])
    expect(tile.lores).toEqual([])
  })

  it('omits background when PathBuilder placeholder is set', () => {
    const tile = deriveHeroTile({
      ...taraanBuild,
      background: 'None selected',
    })

    expect(tile.background).toBeNull()
  })
})

describe('createHeroFromImport', () => {
  it('seeds relationships at 1 heart for every catalog student', () => {
    const slugs = ['anchor-root', 'chizire']
    const hero = createHeroFromImport(taraanBuild, 450903, slugs)

    expect(hero).toEqual({
      pathbuilderId: 450903,
      displayName: 'Taraan Skyseeker',
      build: taraanBuild,
      relationships: { 'anchor-root': 1, chizire: 1 },
    })
  })
})

describe('mergeHeroUpdate', () => {
  it('preserves relationships and pathbuilder id while refreshing build', () => {
    const existing = {
      pathbuilderId: 450903,
      displayName: 'Old Name',
      build: { name: 'Old Name', level: 1 },
      relationships: { 'anchor-root': 3 },
    }
    const freshBuild = { ...taraanBuild, name: 'Taraan Skyseeker' }

    expect(mergeHeroUpdate(existing, freshBuild)).toEqual({
      pathbuilderId: 450903,
      displayName: 'Taraan Skyseeker',
      build: freshBuild,
      relationships: { 'anchor-root': 3 },
    })
  })
})

describe('isPathbuilderIdInRoster', () => {
  it('detects duplicate pathbuilder id', () => {
    const heroes = [{ pathbuilderId: 450903 }, { pathbuilderId: 999 }]
    expect(isPathbuilderIdInRoster(450903, heroes)).toBe(true)
    expect(isPathbuilderIdInRoster(111, heroes)).toBe(false)
  })
})
