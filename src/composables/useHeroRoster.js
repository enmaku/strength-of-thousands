import { ref, computed } from 'vue'
import catalog from '../../data/spire-students.json'
import branchCatalog from '../../data/magaambya-branches.json'
import { isGmMode } from '../domain/mode.js'
import { buildHeroTabs, defaultHearts, sortHeroes } from '../domain/heroes.js'
import { deriveHeroTile, fetchPathbuilderBuild, parsePathbuilderId } from '../domain/pathbuilder.js'
import {
  deriveStudyCard,
  normalizeStudy,
  parseStudy,
  planBranchDecrement,
  planBranchIncrement,
} from '../domain/study.js'
import { buildHeroTiles } from '../domain/tiles.js'

const pagesBase = import.meta.env.BASE_URL.replace(/\/$/, '')

function staticUrl(path) {
  const base = pagesBase || ''
  return `${base}/${path}`.replace(/\/+/g, '/')
}

export function useHeroRoster() {
  const gmMode = isGmMode()
  const roster = ref([])
  const heroes = ref({})
  const loading = ref(true)
  const error = ref(null)

  const catalogSlugs = catalog.map((s) => s.slug)

  const tabs = computed(() => buildHeroTabs(roster.value))
  const sortedRoster = computed(() => sortHeroes(roster.value))

  async function loadRoster() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(staticUrl('heroes/index.json'))
      if (!res.ok) throw new Error('Failed to load hero roster')
      roster.value = await res.json()
    } catch (err) {
      error.value = err.message
      roster.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadHero(slug) {
    const res = await fetch(staticUrl(`heroes/${slug}.json`))
    if (!res.ok) throw new Error(`Failed to load hero ${slug}`)
    const hero = await res.json()
    const { study } = normalizeStudy(hero)
    heroes.value[slug] = {
      ...hero,
      study,
      relationships: defaultHearts(catalogSlugs, hero.relationships),
    }
    return heroes.value[slug]
  }

  async function ensureHeroLoaded(slug) {
    if (!heroes.value[slug]) {
      await loadHero(slug)
    }
    return heroes.value[slug]
  }

  async function loadAllHeroes() {
    await Promise.all(roster.value.map((entry) => loadHero(entry.slug)))
  }

  function tilesForHero(slug) {
    const hero = heroes.value[slug]
    if (!hero) return []
    return buildHeroTiles(catalog, hero.relationships)
  }

  function heroTileFor(slug) {
    const hero = heroes.value[slug]
    if (!hero?.build) return null
    return deriveHeroTile(hero.build)
  }

  async function setDisposition(heroSlug, studentSlug, hearts) {
    if (!gmMode) return

    const hero = heroes.value[heroSlug]
    if (!hero) return

    const relationships = { ...hero.relationships, [studentSlug]: hearts }
    hero.relationships = relationships

    const res = await fetch(`/api/heroes/${heroSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relationships: { [studentSlug]: hearts } }),
    })

    if (!res.ok) {
      await loadHero(heroSlug)
      throw new Error('Failed to save disposition')
    }

    const saved = await res.json()
    const { study } = normalizeStudy(saved)
    heroes.value[heroSlug] = {
      ...saved,
      study,
      relationships: defaultHearts(catalogSlugs, saved.relationships),
    }
  }

  async function setStudy(heroSlug, patch) {
    if (!gmMode) return

    const hero = heroes.value[heroSlug]
    if (!hero) return

    const previousStudy = hero.study ? { ...parseStudy(hero.study) } : undefined
    const mergedStudy = { ...parseStudy(hero.study), ...patch }
    const optimistic = normalizeStudy({ ...hero, study: mergedStudy })
    heroes.value[heroSlug] = { ...hero, study: optimistic.study }

    const res = await fetch(`/api/heroes/${heroSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ study: patch }),
    })

    if (!res.ok) {
      if (previousStudy) {
        heroes.value[heroSlug] = { ...hero, study: previousStudy }
      } else {
        await loadHero(heroSlug)
      }
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to save study progress')
    }

    const saved = await res.json()
    const { study } = normalizeStudy(saved)
    heroes.value[heroSlug] = {
      ...saved,
      study,
      relationships: defaultHearts(catalogSlugs, saved.relationships),
    }
  }

  async function incrementBranch(heroSlug, role) {
    const hero = heroes.value[heroSlug]
    if (!hero) return
    const level = hero.build?.level ?? 0
    const study = planBranchIncrement(parseStudy(hero.study), role, level)
    const patch =
      role === 'primary'
        ? { primaryLevel: study.primaryLevel, primaryStarred: study.primaryStarred }
        : { secondaryLevel: study.secondaryLevel, secondaryStarred: study.secondaryStarred }
    await setStudy(heroSlug, patch)
  }

  async function decrementBranch(heroSlug, role) {
    const hero = heroes.value[heroSlug]
    if (!hero) return
    const study = planBranchDecrement(parseStudy(hero.study), role)
    const patch =
      role === 'primary'
        ? { primaryLevel: study.primaryLevel, primaryStarred: study.primaryStarred }
        : { secondaryLevel: study.secondaryLevel, secondaryStarred: study.secondaryStarred }
    await setStudy(heroSlug, patch)
  }

  function studyCardFor(slug) {
    const hero = heroes.value[slug]
    if (!hero) return null
    return deriveStudyCard(hero, branchCatalog)
  }

  function branchOptions(excludeSlug = null) {
    return branchCatalog.branches
      .filter((b) => b.slug !== excludeSlug)
      .map((b) => ({ label: b.displayName, value: b.slug }))
  }

  async function importHero(input) {
    if (!gmMode) return null

    const pathbuilderId = parsePathbuilderId(input)
    const build = await fetchPathbuilderBuild(pathbuilderId)

    const res = await fetch('/api/heroes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathbuilderId, build }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to import hero')
    }

    const created = await res.json()
    roster.value.push({ slug: created.slug, displayName: created.displayName })
    roster.value.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
    )
    heroes.value[created.slug] = {
      ...created,
      relationships: defaultHearts(catalogSlugs, created.relationships),
    }
    return created.slug
  }

  async function refreshHero(slug) {
    if (!gmMode) return null

    const hero = heroes.value[slug]
    if (!hero?.pathbuilderId) {
      throw new Error('Hero has no stored PathBuilder id')
    }

    const build = await fetchPathbuilderBuild(hero.pathbuilderId)

    const res = await fetch(`/api/heroes/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: true, build }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to update hero')
    }

    const updated = await res.json()
    const { study } = normalizeStudy(updated)
    heroes.value[slug] = {
      ...updated,
      study,
      relationships: defaultHearts(catalogSlugs, updated.relationships),
    }

    const entry = roster.value.find((h) => h.slug === slug)
    if (entry) {
      entry.displayName = updated.displayName
      roster.value.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
      )
    }

    return updated
  }

  function portraitUrl(thumb) {
    return staticUrl(`reference/images/spire-dorm/${thumb}`)
  }

  function branchImageUrl(image) {
    return staticUrl(`reference/images/branches/${image}`)
  }

  return {
    gmMode,
    catalog,
    branchCatalog,
    roster,
    sortedRoster,
    heroes,
    loading,
    error,
    tabs,
    loadRoster,
    loadHero,
    ensureHeroLoaded,
    loadAllHeroes,
    tilesForHero,
    heroTileFor,
    studyCardFor,
    branchOptions,
    setDisposition,
    setStudy,
    incrementBranch,
    decrementBranch,
    importHero,
    refreshHero,
    portraitUrl,
    branchImageUrl,
  }
}
