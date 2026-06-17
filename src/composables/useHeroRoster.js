import { ref, computed } from 'vue'
import catalog from '../../data/spire-students.json'
import { isGmMode } from '../domain/mode.js'
import { buildHeroTabs, defaultHearts } from '../domain/heroes.js'
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

  const tabs = computed(() => buildHeroTabs(roster.value, gmMode))

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
    heroes.value[slug] = {
      ...hero,
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

  function tilesForHero(slug) {
    const hero = heroes.value[slug]
    if (!hero) return []
    return buildHeroTiles(catalog, hero.relationships)
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
    heroes.value[heroSlug] = {
      ...saved,
      relationships: defaultHearts(catalogSlugs, saved.relationships),
    }
  }

  async function createHero(displayName) {
    if (!gmMode) return null

    const res = await fetch('/api/heroes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'Failed to create hero')
    }

    const created = await res.json()
    roster.value.push({ slug: created.slug, displayName: created.displayName })
    roster.value.sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
    )
    heroes.value[created.slug] = {
      displayName: created.displayName,
      relationships: defaultHearts(catalogSlugs, created.relationships),
    }
    return created.slug
  }

  function portraitUrl(thumb) {
    return staticUrl(`reference/images/spire-dorm/${thumb}`)
  }

  return {
    gmMode,
    catalog,
    roster,
    heroes,
    loading,
    error,
    tabs,
    loadRoster,
    loadHero,
    ensureHeroLoaded,
    tilesForHero,
    setDisposition,
    createHero,
    portraitUrl,
  }
}
