import { describe, expect, it } from 'vitest'
import { deriveUnlocks } from './unlocks.js'

describe('deriveUnlocks', () => {
  it('locks both below 3 hearts', () => {
    expect(deriveUnlocks(2)).toEqual({
      classroomAdvantage: false,
      uncommonRules: false,
    })
  })

  it('unlocks classroom advantage at 3 hearts', () => {
    expect(deriveUnlocks(3)).toEqual({
      classroomAdvantage: true,
      uncommonRules: false,
    })
  })

  it('keeps uncommon rules locked at 4 hearts', () => {
    expect(deriveUnlocks(4)).toEqual({
      classroomAdvantage: true,
      uncommonRules: false,
    })
  })

  it('unlocks both at 5 hearts', () => {
    expect(deriveUnlocks(5)).toEqual({
      classroomAdvantage: true,
      uncommonRules: true,
    })
  })

  it('clamps out-of-range values', () => {
    expect(deriveUnlocks(-1).classroomAdvantage).toBe(false)
    expect(deriveUnlocks(99).uncommonRules).toBe(true)
  })
})
