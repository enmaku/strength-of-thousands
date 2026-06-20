const PROF_RANK_TRAINED = 2

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const SAVE_ABILITY = {
  fortitude: 'con',
  reflex: 'dex',
  will: 'wis',
}

export function parsePathbuilderId(input) {
  const trimmed = String(input ?? '').trim()
  if (!trimmed) {
    throw new Error('PathBuilder id or URL is required')
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }

  try {
    const url = new URL(trimmed)
    const id = url.searchParams.get('id')
    if (id && /^\d+$/.test(id)) {
      return Number(id)
    }
  } catch {
    // not a URL
  }

  throw new Error('Invalid PathBuilder id or URL')
}

export function pathbuilderJsonUrl(id) {
  return `https://pathbuilder2e.com/json.php?id=${id}`
}

export function extractBuildFromResponse(json) {
  if (!json || json.success !== true || !json.build) {
    throw new Error('PathBuilder response was not successful')
  }
  return json.build
}

export async function fetchPathbuilderBuild(pathbuilderId) {
  let res
  try {
    res = await fetch(pathbuilderJsonUrl(pathbuilderId))
  } catch {
    throw new Error(
      'Could not reach PathBuilder — check your network or open pathbuilder2e.com in this browser and retry',
    )
  }

  if (!res.ok) {
    throw new Error('PathBuilder is unavailable — try again later')
  }

  let json
  try {
    json = await res.json()
  } catch {
    throw new Error('PathBuilder returned an invalid response — try again later')
  }

  return extractBuildFromResponse(json)
}

export function dedicationArchetypeNames(feats) {
  return (feats ?? [])
    .map((feat) => feat[0])
    .filter((name) => name?.endsWith(' Dedication'))
    .map((name) => name.replace(/ Dedication$/, ''))
}

export function buildClassLine(build) {
  const parts = []
  if (build.class) parts.push(build.class)
  if (build.dualClass) parts.push(build.dualClass)

  const seen = new Set(parts)
  for (const archetype of dedicationArchetypeNames(build.feats)) {
    if (!seen.has(archetype)) {
      seen.add(archetype)
      parts.push(archetype)
    }
  }

  return parts.join(' / ')
}

function abilityMod(score) {
  return Math.floor((score - 10) / 2)
}

function abilityMods(abilities) {
  return Object.fromEntries(ABILITY_KEYS.map((key) => [key, abilityMod(abilities[key] ?? 10)]))
}

function profTotal(rank, abilityModValue, level, itemBonus = 0) {
  if (!rank) return abilityModValue + itemBonus
  return abilityModValue + rank + level + itemBonus
}

function itemBonusFor(mods, label) {
  return mods?.[label]?.['Item Bonus'] ?? 0
}

function computeSave(build, saveKey) {
  const ability = SAVE_ABILITY[saveKey]
  const mods = abilityMods(build.abilities ?? {})
  const rank = build.proficiencies?.[saveKey] ?? 0
  return profTotal(rank, mods[ability], build.level ?? 1, 0)
}

function computePerception(build) {
  const mods = abilityMods(build.abilities ?? {})
  const rank = build.proficiencies?.perception ?? 0
  return profTotal(rank, mods.wis, build.level ?? 1, itemBonusFor(build.mods, 'Perception'))
}

function computeMaxHp(build) {
  const attrs = build.attributes ?? {}
  const level = build.level ?? 1
  const conMod = abilityMod(build.abilities?.con ?? 10)
  const perLevel = (attrs.classhp ?? 0) + conMod + (attrs.bonushpPerLevel ?? 0)
  return (attrs.ancestryhp ?? 0) + perLevel * level + (attrs.bonushp ?? 0)
}

function pickPrimaryWeapon(weapons) {
  if (!weapons?.length) return null
  const starred = weapons.find((w) => w.default || w.starred)
  if (starred) return starred
  return weapons.reduce((best, w) => ((w.attack ?? 0) > (best.attack ?? 0) ? w : best))
}

function formatWeaponAttack(weapon) {
  if (!weapon) return null
  const pot = weapon.pot ?? 0
  const damage = pot ? `${weapon.die}+${pot}` : weapon.die
  return {
    name: weapon.display || weapon.name,
    bonus: weapon.attack,
    damage: `${damage} ${weapon.damageType}`,
  }
}

function primarySpellCaster(build) {
  const casters = (build.spellCasters ?? []).filter((c) => !c.innate)
  const classMatch = casters.find((c) => c.name === build.class)
  if (classMatch) return classMatch

  for (const archetype of dedicationArchetypeNames(build.feats)) {
    const archetypeMatch = casters.find((c) => c.name === `Archetype ${archetype}`)
    if (archetypeMatch) return archetypeMatch
  }

  if (build.dualClass) {
    return casters.find((c) => c.name === build.dualClass) ?? null
  }

  return null
}

function computeSpellStats(build) {
  const caster = primarySpellCaster(build)
  if (!caster) return { spellAttack: null, spellDc: null }

  const mods = abilityMods(build.abilities ?? {})
  const abilityModValue = mods[caster.ability] ?? 0
  const rank = caster.proficiency ?? 0
  const level = build.level ?? 1
  const total = profTotal(rank, abilityModValue, level, 0)
  return {
    spellAttack: total,
    spellDc: 10 + total,
  }
}

function trainedOrBetter(rank) {
  return (rank ?? 0) >= PROF_RANK_TRAINED
}

function isPathbuilderNoneSelected(value) {
  // PathBuilder emits "None selected" for unset list fields; treat as empty (see CONTEXT.md).
  return typeof value === 'string' && value.trim().toLowerCase() === 'none selected'
}

function withoutPathbuilderPlaceholders(values) {
  return (values ?? []).filter((value) => !isPathbuilderNoneSelected(value))
}

function computeProficiencies(build) {
  const prof = build.proficiencies ?? {}
  const wornShield = (build.armor ?? []).some((a) => a.worn && a.prof === 'shield')
  return {
    light: trainedOrBetter(prof.light),
    medium: trainedOrBetter(prof.medium),
    heavy: trainedOrBetter(prof.heavy),
    shield: trainedOrBetter(prof.shield) || wornShield,
    simple: trainedOrBetter(prof.simple),
    martial: trainedOrBetter(prof.martial),
  }
}

function formatLores(lores) {
  return (lores ?? [])
    .filter(([name]) => !isPathbuilderNoneSelected(name))
    .map(([name, rank]) => ({ name, rank }))
}

export function deriveHeroTile(build) {
  const mods = abilityMods(build.abilities ?? {})
  const primaryAttack = formatWeaponAttack(pickPrimaryWeapon(build.weapons))
  const spellStats = computeSpellStats(build)
  const speed = (build.attributes?.speed ?? 0) + (build.attributes?.speedBonus ?? 0)

  return {
    name: build.name,
    level: build.level,
    ancestry: build.ancestry,
    background: isPathbuilderNoneSelected(build.background) ? null : (build.background ?? null),
    classLine: buildClassLine(build),
    abilityMods: {
      str: mods.str,
      dex: mods.dex,
      con: mods.con,
      int: mods.int,
      wis: mods.wis,
      cha: mods.cha,
    },
    fortitude: computeSave(build, 'fortitude'),
    reflex: computeSave(build, 'reflex'),
    will: computeSave(build, 'will'),
    ac: build.acTotal?.acTotal ?? null,
    maxHp: computeMaxHp(build),
    speed,
    passivePerception: 10 + computePerception(build),
    primaryAttack,
    spellAttack: spellStats.spellAttack,
    spellDc: spellStats.spellDc,
    proficiencies: computeProficiencies(build),
    languages: withoutPathbuilderPlaceholders(build.languages),
    lores: formatLores(build.lores),
  }
}

export function createHeroFromImport(build, pathbuilderId, catalogSlugs) {
  const relationships = Object.fromEntries(catalogSlugs.map((slug) => [slug, 1]))
  return {
    pathbuilderId,
    displayName: build.name,
    build,
    relationships,
  }
}

export function mergeHeroUpdate(existingHero, freshBuild) {
  return {
    ...existingHero,
    displayName: freshBuild.name,
    build: freshBuild,
  }
}

export function isPathbuilderIdInRoster(id, heroes) {
  return heroes.some((hero) => hero.pathbuilderId === id)
}
