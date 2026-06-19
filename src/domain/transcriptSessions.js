export function sortTranscriptSessions(sessions, direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1
  return [...sessions].sort((a, b) => (a.sessionNumber - b.sessionNumber) * factor)
}

export function defaultTranscriptSession(sessions) {
  return sortTranscriptSessions(sessions, 'desc')[0] ?? null
}

export function sessionPaths(session) {
  return {
    base: `transcripts/${session.campaign}/${session.sessionDir}`,
    api: `${session.campaign}/${session.sessionDir}`,
  }
}

export function isSameTranscriptSession(a, b) {
  if (!a || !b) return false
  return a.sessionId === b.sessionId
}

export const DEFAULT_RAW_TRANSCRIPT_BASE =
  'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main'

export function rawEditedTranscriptUrl(session, base = DEFAULT_RAW_TRANSCRIPT_BASE) {
  const root = base.replace(/\/$/, '')
  return `${root}/transcripts/${session.campaign}/${session.sessionDir}/edited.json`
}

export function rawEditedTranscriptUrls(sessions, base = DEFAULT_RAW_TRANSCRIPT_BASE) {
  return sessions.map((session) => rawEditedTranscriptUrl(session, base))
}

export function rawHeroJsonUrl(slug, base = DEFAULT_RAW_TRANSCRIPT_BASE) {
  const root = base.replace(/\/$/, '')
  return `${root}/heroes/${slug}.json`
}

export function enrichPlayerMapForAssistant(playerMap, heroSlugs = [], base = DEFAULT_RAW_TRANSCRIPT_BASE) {
  if (!playerMap) return null

  const heroUrls = Object.fromEntries(
    heroSlugs.map((slug) => [slug, rawHeroJsonUrl(slug, base)]),
  )

  const players = Object.fromEntries(
    Object.entries(playerMap.players ?? {}).map(([name, entry]) => {
      const heroSlug = entry?.heroSlug
      const heroUrl = heroSlug && heroUrls[heroSlug] ? heroUrls[heroSlug] : undefined
      return [
        name,
        heroUrl ? { ...entry, heroUrl } : entry,
      ]
    }),
  )

  return {
    ...playerMap,
    players,
    heroUrls,
  }
}
