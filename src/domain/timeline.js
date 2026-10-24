export const STORY_COLOR = '#204050'

export function buildTimelineGroups(beats, { gmMode = false } = {}) {
  const groups = []
  let currentSession = null

  for (const beat of beats) {
    if (beat.lane === 'book') {
      groups.push({ type: 'book', beat, beats: [] })
      currentSession = null
      continue
    }

    if (currentSession !== beat.session) {
      groups.push({ type: 'session', session: beat.session, beats: [] })
      currentSession = beat.session
    }

    groups.at(-1).beats.push(beat)
  }

  if (gmMode) return groups

  return groups.filter((group, index) =>
    group.type === 'book'
      ? hasRevealedBeatBeforeNextBook(groups, index)
      : group.beats.some((beat) => beat.revealed),
  ).map((group) =>
    group.type === 'book'
      ? group
      : { ...group, beats: group.beats.filter((beat) => beat.revealed) },
  )
}

function hasRevealedBeatBeforeNextBook(groups, startIndex) {
  for (let i = startIndex + 1; i < groups.length; i++) {
    if (groups[i].type === 'book') return false
    if (groups[i].beats.some((beat) => beat.revealed)) return true
  }
  return false
}

function scopeFor(target) {
  if (target.lane === 'player') {
    return (beat) => beat.lane === 'player' && beat.heroSlug === target.heroSlug
  }
  return (beat) => beat.lane === 'story' || beat.lane === 'book'
}

export function revealTo(beats, { id }) {
  return setRevealed(beats, id, (index, targetIndex) => index <= targetIndex, true)
}

export function hideFrom(beats, { id }) {
  return setRevealed(beats, id, (index, targetIndex) => index >= targetIndex, false)
}

function setRevealed(beats, id, inRange, revealed) {
  const targetIndex = beats.findIndex((beat) => beat.id === id)
  if (targetIndex === -1) return [...beats]

  const inScope = scopeFor(beats[targetIndex])

  return beats.map((beat, index) =>
    inScope(beat) && inRange(index, targetIndex) ? { ...beat, revealed } : beat,
  )
}

export function visibleBeats(beats, { gmMode = false } = {}) {
  return gmMode ? beats : beats.filter((beat) => beat.revealed)
}

export function heroColor(heroSlug, playerMap) {
  const players = Object.values(playerMap?.players ?? {})
  const player = players.find((entry) => entry.heroSlug === heroSlug)
  return player?.color ?? STORY_COLOR
}
