import { describe, expect, it } from 'vitest'
import { buildStudentTile } from './tiles.js'

const catalogEntry = {
  slug: 'anchor-root',
  displayName: 'Anchor Root',
  branch: 'Rain-Scribe',
  portrait: 'anchor-root.jpg',
  thumb: 'anchor-root-120.jpg',
  classroomAdvantage: 'Study crit fail → fail.',
  uncommonRules: {
    name: 'Rhythm Bone',
    description: 'Records sounds.',
  },
}

describe('buildStudentTile', () => {
  it('defaults missing hearts to 1', () => {
    const tile = buildStudentTile(catalogEntry, undefined)
    expect(tile.disposition).toBe(1)
    expect(tile.classroomAdvantageUnlocked).toBe(false)
  })

  it('derives unlock flags from heart count', () => {
    const tile = buildStudentTile(catalogEntry, 3)
    expect(tile.classroomAdvantageUnlocked).toBe(true)
    expect(tile.uncommonRulesUnlocked).toBe(false)
  })

  it('passes through tooltip text', () => {
    const tile = buildStudentTile(catalogEntry, 0)
    expect(tile.classroomAdvantageTooltip).toBe('Study crit fail → fail.')
    expect(tile.uncommonRulesTooltip).toBe('Rhythm Bone: Records sounds.')
    expect(tile.uncommonRulesName).toBe('Rhythm Bone')
  })
})
