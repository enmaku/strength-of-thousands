import { describe, expect, it } from 'vitest'
import catalog from '../../data/magaambya-branches.json'
import {
  branchCap,
  branchReference,
  deriveGainedBenefits,
  normalizeStudy,
  parseStudy,
  planBranchDecrement,
  planBranchIncrement,
  validateStudyPatch,
} from './study.js'

const hero = (level, study = {}) => ({
  displayName: 'Test Hero',
  build: { level },
  study,
})

describe('branchCap', () => {
  it('caps primary at character level', () => {
    expect(branchCap('primary', 6, false)).toBe(6)
    expect(branchCap('primary', 6, true)).toBe(20)
  })

  it('caps secondary at half character level', () => {
    expect(branchCap('secondary', 1, false)).toBe(0)
    expect(branchCap('secondary', 6, false)).toBe(3)
  })
})

describe('planBranchIncrement', () => {
  it('increments below cap', () => {
    const study = parseStudy({ primaryBranch: 'rain-scribes', secondaryBranch: 'uzunjati', primaryLevel: 1 })
    const next = planBranchIncrement(study, 'primary', 3)
    expect(next.primaryLevel).toBe(2)
    expect(next.primaryStarred).toBe(false)
  })

  it('sets star at cap', () => {
    const study = parseStudy({
      primaryBranch: 'rain-scribes',
      secondaryBranch: 'uzunjati',
      primaryLevel: 3,
    })
    const next = planBranchIncrement(study, 'primary', 3)
    expect(next.primaryLevel).toBe(3)
    expect(next.primaryStarred).toBe(true)
  })
})

describe('planBranchDecrement', () => {
  it('clears star before decrementing level', () => {
    const study = parseStudy({
      primaryBranch: 'rain-scribes',
      secondaryBranch: 'uzunjati',
      primaryLevel: 3,
      primaryStarred: true,
    })
    const cleared = planBranchDecrement(study, 'primary')
    expect(cleared.primaryStarred).toBe(false)
    expect(cleared.primaryLevel).toBe(3)

    const lowered = planBranchDecrement(cleared, 'primary')
    expect(lowered.primaryLevel).toBe(2)
  })
})

describe('normalizeStudy', () => {
  it('applies banked star on character level-up', () => {
    const { study } = normalizeStudy(
      hero(3, {
        primaryBranch: 'rain-scribes',
        secondaryBranch: 'uzunjati',
        primaryLevel: 2,
        primaryStarred: true,
      }),
      catalog,
    )
    expect(study.primaryLevel).toBe(3)
    expect(study.primaryStarred).toBe(false)
  })
})

describe('deriveGainedBenefits', () => {
  it('shows only current steeped tier at 11', () => {
    const benefits = deriveGainedBenefits('rain-scribes', 11, catalog)
    const steeped = benefits.filter((b) => b.name.startsWith('Steeped in History'))
    expect(steeped).toHaveLength(1)
    expect(steeped[0].name).toBe('Steeped in History +2')
  })

  it('uses branch-specific names at 7, 8, 12, 20', () => {
    const benefits = deriveGainedBenefits('uzunjati', 20, catalog)
    const names = benefits.map((b) => b.name)
    expect(names).toContain('Uzunjati Storytelling')
    expect(names).toContain('Incredible Initiative')
    expect(names).toContain('Uzunjati Recollection')
    expect(names).toContain('Magical Paragon')
  })
})

describe('branchReference', () => {
  it('includes study skills and lore', () => {
    const branch = catalog.branches.find((b) => b.slug === 'rain-scribes')
    const ref = branchReference(branch)
    expect(ref.skills).toEqual(['Medicine', 'Nature', 'Survival'])
    expect(ref.lore).toContain('terrain')
    expect(ref.virtue).toBe('Adaptability')
  })
})

describe('validateStudyPatch', () => {
  it('rejects same primary and secondary', () => {
    const result = validateStudyPatch(
      { primaryBranch: 'rain-scribes', secondaryBranch: 'rain-scribes' },
      {},
      catalog,
    )
    expect(result.ok).toBe(false)
  })

  it('allows clearing a branch', () => {
    const result = validateStudyPatch(
      { primaryBranch: null },
      { primaryBranch: 'rain-scribes', secondaryBranch: 'uzunjati' },
      catalog,
    )
    expect(result.ok).toBe(true)
    expect(result.study.primaryBranch).toBeNull()
  })
})
