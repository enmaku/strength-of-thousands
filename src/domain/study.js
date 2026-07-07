import branchCatalog from '../../data/magaambya-branches.json'

const MAX_BRANCH_LEVEL = 20

const SHARED_MILESTONES = {
  1: {
    name: 'Additional Lore',
    description:
      'You gain the Additional Lore feat in a Lore skill associated with the branch.',
  },
  2: {
    name: 'Steeped in History +1',
    description:
      '+1 circumstance bonus to Recall Knowledge about the Magaambya, your branch tenets or history, and members of your branch. Increases to +2 at branch level 11.',
  },
  11: {
    name: 'Steeped in History +2',
    description:
      '+2 circumstance bonus to Recall Knowledge about the Magaambya, your branch tenets or history, and members of your branch.',
  },
  3: {
    name: 'Dedicated Attendant',
    description:
      'If you have completed your Perquisite, the first time you reach branch level 3 you gain Magaambyan Attendant Dedication as a bonus feat.',
  },
  4: {
    name: 'Skill Feat (Trained)',
    description:
      'Gain a skill feat requiring trained rank in one of the branch’s associated skills.',
  },
  5: {
    name: 'Branch Influence +1',
    description:
      '+1 circumstance bonus on Deception, Diplomacy, Intimidation, and Performance checks to interact with members of the branch. Increases to +2 at 13 and +3 at 17.',
  },
  13: {
    name: 'Branch Influence +2',
    description:
      '+2 circumstance bonus on Deception, Diplomacy, Intimidation, and Performance checks to interact with members of the branch.',
  },
  17: {
    name: 'Branch Influence +3',
    description:
      '+3 circumstance bonus on Deception, Diplomacy, Intimidation, and Performance checks to interact with members of the branch.',
  },
  6: {
    name: 'Skill Increase (Expert)',
    description:
      'Additional skill increase for a branch-associated skill, up to expert. At branch 10+, can raise to master; at 18, to legendary.',
  },
  9: {
    name: 'Skill Feat (Expert)',
    description:
      'Gain a skill feat requiring expert or trained rank in one of the branch’s associated skills.',
  },
  10: {
    name: 'Skill Increase (Master)',
    description:
      'Additional skill increase for a branch-associated skill, up to master if already expert.',
  },
  14: {
    name: 'Skill Increase (Master)',
    description:
      'Additional skill increase for a branch-associated skill, up to master if already expert.',
  },
  15: {
    name: 'Skill Feat (Master)',
    description:
      'Gain a skill feat requiring master or lower rank in one of the branch’s associated skills.',
  },
  16: {
    name: 'Make Your Own Luck',
    description:
      'Once per day, reroll a skill check with a branch-associated skill and take the new result (fortune effect).',
  },
  18: {
    name: 'Skill Increase (Legendary)',
    description:
      'Additional skill increase for a branch-associated skill, up to legendary if already master.',
  },
  19: {
    name: 'Skill Feat (Legendary)',
    description:
      'Gain a skill feat requiring legendary or lower rank in one of the branch’s associated skills.',
  },
}

const UPGRADE_GROUPS = [
  { levels: [2, 11], key: 'steeped' },
  { levels: [5, 13, 17], key: 'influence' },
]

export function defaultStudy() {
  return {
    primaryBranch: null,
    secondaryBranch: null,
    primaryLevel: 0,
    secondaryLevel: 0,
    primaryStarred: false,
    secondaryStarred: false,
    primaryUncapped: false,
    secondaryUncapped: false,
  }
}

export function parseStudy(raw) {
  if (!raw || typeof raw !== 'object') {
    return defaultStudy()
  }
  return {
    primaryBranch: raw.primaryBranch ?? null,
    secondaryBranch: raw.secondaryBranch ?? null,
    primaryLevel: clampLevel(raw.primaryLevel ?? 0),
    secondaryLevel: clampLevel(raw.secondaryLevel ?? 0),
    primaryStarred: Boolean(raw.primaryStarred),
    secondaryStarred: Boolean(raw.secondaryStarred),
    primaryUncapped: Boolean(raw.primaryUncapped),
    secondaryUncapped: Boolean(raw.secondaryUncapped),
  }
}

function clampLevel(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(MAX_BRANCH_LEVEL, Math.floor(n)))
}

export function branchCatalogSlugs(catalog = branchCatalog) {
  return catalog.branches.map((b) => b.slug)
}

export function branchBySlug(slug, catalog = branchCatalog) {
  return catalog.branches.find((b) => b.slug === slug) ?? null
}

export function branchCap(role, characterLevel, uncapped) {
  if (uncapped) return MAX_BRANCH_LEVEL
  const level = Math.max(0, Math.floor(Number(characterLevel) || 0))
  if (role === 'primary') return level
  return Math.floor(level / 2)
}

export function isStudyConfigured(study) {
  return Boolean(study?.primaryBranch && study?.secondaryBranch)
}

export function normalizeStudy(hero) {
  const study = parseStudy(hero?.study)
  const characterLevel = hero?.build?.level ?? 0

  const primaryCap = branchCap('primary', characterLevel, study.primaryUncapped)
  const secondaryCap = branchCap('secondary', characterLevel, study.secondaryUncapped)

  let changed = !hero?.study

  if (study.primaryStarred && study.primaryLevel < primaryCap) {
    study.primaryLevel = primaryCap
    study.primaryStarred = false
    changed = true
  }

  if (study.secondaryStarred && study.secondaryLevel < secondaryCap) {
    study.secondaryLevel = secondaryCap
    study.secondaryStarred = false
    changed = true
  }

  study.primaryLevel = clampLevel(study.primaryLevel)
  study.secondaryLevel = clampLevel(study.secondaryLevel)

  return { study, changed }
}

function milestoneLevelsForBranch(level) {
  const levels = new Set()
  for (const milestone of Object.keys(SHARED_MILESTONES).map(Number)) {
    if (milestone <= level) levels.add(milestone)
  }
  if (level >= 7) levels.add(7)
  if (level >= 8) levels.add(8)
  if (level >= 12) levels.add(12)
  if (level >= 20) levels.add(20)
  return levels
}

function resolveMilestoneName(level, branch) {
  if (level === 7) return branch.branchFeat6.name
  if (level === 8) return branch.generalFeat.name
  if (level === 12) return branch.branchFeat10.name
  if (level === 20) return branch.magicalParagon.name
  return SHARED_MILESTONES[level]?.name ?? `Level ${level}`
}

function resolveMilestoneDescription(level, branch) {
  if (level === 7) return branch.branchFeat6.description
  if (level === 8) return branch.generalFeat.description
  if (level === 12) return branch.branchFeat10.description
  if (level === 20) return branch.magicalParagon.description
  return SHARED_MILESTONES[level]?.description ?? ''
}

export function deriveGainedBenefits(branchSlug, level, catalog = branchCatalog) {
  const branch = branchBySlug(branchSlug, catalog)
  if (!branch || level <= 0) return []

  const activeLevels = milestoneLevelsForBranch(level)
  const suppressed = new Set()

  for (const group of UPGRADE_GROUPS) {
    const earned = group.levels.filter((l) => activeLevels.has(l))
    if (earned.length > 1) {
      for (const l of earned.slice(0, -1)) {
        suppressed.add(l)
      }
    }
  }

  return [...activeLevels]
    .filter((l) => !suppressed.has(l))
    .sort((a, b) => a - b)
    .map((l) => ({
      level: l,
      name: resolveMilestoneName(l, branch),
      description: resolveMilestoneDescription(l, branch),
    }))
}

export function branchReference(branch) {
  if (!branch) return null
  return {
    displayName: branch.displayName,
    virtue: branch.virtue,
    description: branch.description,
    skills: branch.skills,
    lore: branch.lore,
    generalFeat: branch.generalFeat.name,
    branchFeat6: branch.branchFeat6.name,
    branchFeat10: branch.branchFeat10.name,
  }
}

function branchTrack(study, role, characterLevel, catalog) {
  const isPrimary = role === 'primary'
  const branchSlug = isPrimary ? study.primaryBranch : study.secondaryBranch
  const branchLevel = isPrimary ? study.primaryLevel : study.secondaryLevel
  const starred = isPrimary ? study.primaryStarred : study.secondaryStarred
  const uncapped = isPrimary ? study.primaryUncapped : study.secondaryUncapped
  const cap = branchCap(role, characterLevel, uncapped)
  const branch = branchSlug ? branchBySlug(branchSlug, catalog) : null

  return {
    role,
    branchSlug,
    displayName: branch?.displayName ?? null,
    image: branch?.image ?? null,
    level: branchLevel,
    cap,
    starred,
    uncapped,
    atCap: branchLevel >= cap,
    benefits: branchSlug ? deriveGainedBenefits(branchSlug, branchLevel, catalog) : [],
    reference: branchReference(branch),
  }
}

export function deriveStudyCard(hero, catalog = branchCatalog) {
  const { study } = normalizeStudy(hero)
  const characterLevel = hero?.build?.level ?? 0
  const configured = isStudyConfigured(study)

  return {
    displayName: hero?.displayName ?? '',
    configured,
    characterLevel,
    study,
    primary: branchTrack(study, 'primary', characterLevel, catalog),
    secondary: branchTrack(study, 'secondary', characterLevel, catalog),
  }
}

export function planBranchIncrement(study, role, characterLevel) {
  const next = { ...study }
  const uncapped = role === 'primary' ? next.primaryUncapped : next.secondaryUncapped
  const cap = branchCap(role, characterLevel, uncapped)

  if (role === 'primary') {
    if (next.primaryLevel < cap) {
      next.primaryLevel = clampLevel(next.primaryLevel + 1)
    } else if (!next.primaryStarred) {
      next.primaryStarred = true
    }
  } else if (next.secondaryLevel < cap) {
    next.secondaryLevel = clampLevel(next.secondaryLevel + 1)
  } else if (!next.secondaryStarred) {
    next.secondaryStarred = true
  }

  return next
}

export function planBranchDecrement(study, role) {
  const next = { ...study }

  if (role === 'primary') {
    if (next.primaryStarred) {
      next.primaryStarred = false
    } else {
      next.primaryLevel = clampLevel(next.primaryLevel - 1)
    }
  } else if (next.secondaryStarred) {
    next.secondaryStarred = false
  } else {
    next.secondaryLevel = clampLevel(next.secondaryLevel - 1)
  }

  return next
}

export function validateStudyPatch(patch, existingStudy, catalog = branchCatalog) {
  const slugs = new Set(branchCatalogSlugs(catalog))
  const merged = { ...parseStudy(existingStudy), ...patch }

  if (patch.primaryBranch !== undefined && patch.primaryBranch !== null) {
    if (!slugs.has(patch.primaryBranch)) {
      return { ok: false, error: `Unknown branch slug: ${patch.primaryBranch}` }
    }
  }
  if (patch.secondaryBranch !== undefined && patch.secondaryBranch !== null) {
    if (!slugs.has(patch.secondaryBranch)) {
      return { ok: false, error: `Unknown branch slug: ${patch.secondaryBranch}` }
    }
  }

  if (merged.primaryBranch && merged.secondaryBranch && merged.primaryBranch === merged.secondaryBranch) {
    return { ok: false, error: 'Primary and secondary branch must differ' }
  }

  for (const key of ['primaryLevel', 'secondaryLevel']) {
    if (patch[key] !== undefined) {
      const value = Number(patch[key])
      if (!Number.isInteger(value) || value < 0 || value > MAX_BRANCH_LEVEL) {
        return { ok: false, error: `Invalid ${key}` }
      }
    }
  }

  for (const key of ['primaryStarred', 'secondaryStarred', 'primaryUncapped', 'secondaryUncapped']) {
    if (patch[key] !== undefined && typeof patch[key] !== 'boolean') {
      return { ok: false, error: `Invalid ${key}` }
    }
  }

  return { ok: true, study: merged }
}

export function mergeStudyPatch(existingStudy, patch, catalog = branchCatalog) {
  const result = validateStudyPatch(patch, existingStudy, catalog)
  if (!result.ok) return result
  return { ok: true, study: result.study }
}
