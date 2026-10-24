import { describe, expect, it } from 'vitest'
import {
  activeHeroes,
  buildHeroTabs,
  createHeroState,
  defaultHearts,
  deriveHeroBioTile,
  isActiveHero,
  slugify,
  sortHeroes,
} from './heroes.js'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Kira Moonwhisper')).toBe('kira-moonwhisper')
  })

  it('trims whitespace', () => {
    expect(slugify('  Zara  ')).toBe('zara')
  })
})

describe('createHeroState', () => {
  it('initializes all catalog students at 1 heart', () => {
    const slugs = ['anchor-root', 'chizire']
    const hero = createHeroState('Test Hero', slugs)
    expect(hero.displayName).toBe('Test Hero')
    expect(hero.relationships).toEqual({
      'anchor-root': 1,
      chizire: 1,
    })
  })
})

describe('isActiveHero', () => {
  it('treats a missing flag as active', () => {
    expect(isActiveHero({ displayName: 'Taraan' })).toBe(true)
  })

  it('treats active: true as active', () => {
    expect(isActiveHero({ active: true })).toBe(true)
  })

  it('only excludes an explicit false', () => {
    expect(isActiveHero({ active: false })).toBe(false)
  })
})

describe('activeHeroes', () => {
  it('drops heroes marked inactive and keeps the rest', () => {
    const heroes = [
      { slug: 'a', displayName: 'Anya', active: false },
      { slug: 't', displayName: 'Taraan' },
    ]
    expect(activeHeroes(heroes).map((hero) => hero.slug)).toEqual(['t'])
  })
})

describe('sortHeroes', () => {
  it('sorts alphabetically by display name', () => {
    const heroes = [
      { slug: 'z', displayName: 'Zara' },
      { slug: 'a', displayName: 'Alice' },
    ]
    expect(sortHeroes(heroes).map((h) => h.displayName)).toEqual(['Alice', 'Zara'])
  })
})

describe('defaultHearts', () => {
  it('defaults missing slugs to 1', () => {
    expect(defaultHearts(['a', 'b'], { a: 3 })).toEqual({ a: 3, b: 1 })
  })

  it('clamps heart values to 0–5', () => {
    expect(defaultHearts(['a'], { a: 9 })).toEqual({ a: 5 })
  })
})

describe('buildHeroTabs', () => {
  const heroes = [
    { slug: 'z', displayName: 'Zara' },
    { slug: 'a', displayName: 'Alice' },
  ]

  it('returns sorted heroes with first as default', () => {
    const tabs = buildHeroTabs(heroes)
    expect(tabs.heroes.map((h) => h.slug)).toEqual(['a', 'z'])
    expect(tabs.defaultSlug).toBe('a')
  })

  it('returns null default slug for empty roster', () => {
    expect(buildHeroTabs([]).defaultSlug).toBeNull()
  })

  it('excludes inactive heroes from tabs and default slug', () => {
    const tabs = buildHeroTabs([
      { slug: 'a', displayName: 'Alice', active: false },
      { slug: 'z', displayName: 'Zara' },
    ])
    expect(tabs.heroes.map((h) => h.slug)).toEqual(['z'])
    expect(tabs.defaultSlug).toBe('z')
  })

  it('returns null default slug when every hero is inactive', () => {
    const tabs = buildHeroTabs([{ slug: 'a', displayName: 'Alice', active: false }])
    expect(tabs.heroes).toEqual([])
    expect(tabs.defaultSlug).toBeNull()
  })
})

describe('deriveHeroBioTile', () => {
  it('returns name, tagline, and bio', () => {
    expect(
      deriveHeroBioTile({
        displayName: 'Anya',
        tagline: 'Human summoner · she/her',
        bio: 'Grew up in the wild with her eidolon.',
      }),
    ).toEqual({
      name: 'Anya',
      tagline: 'Human summoner · she/her',
      bio: 'Grew up in the wild with her eidolon.',
    })
  })

  it('returns null without a bio', () => {
    expect(deriveHeroBioTile({ displayName: 'Anya', tagline: 'x' })).toBeNull()
  })

  it('defaults missing tagline to empty string', () => {
    expect(deriveHeroBioTile({ displayName: 'Anya', bio: 'A brief bio.' })).toEqual({
      name: 'Anya',
      tagline: '',
      bio: 'A brief bio.',
    })
  })
})
