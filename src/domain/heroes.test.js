import { describe, expect, it } from 'vitest'
import {
  buildHeroTabs,
  createHeroState,
  defaultHearts,
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
})
