const GM_SPEAKER = 'Pablo'

const DEFAULT_VOICES = new Set(['player', 'narrator'])

export function formatSpeakerLabel(speaker, voice) {
  if (!voice || DEFAULT_VOICES.has(voice)) return speaker
  return `${speaker} (as ${voice})`
}

export function defaultVoiceForSpeaker(speaker, playerMap) {
  return speakerFieldsForPlayer(speaker, playerMap).voice
}

export function listPlayerNames(playerMap) {
  return Object.keys(playerMap?.players ?? {}).sort((a, b) => a.localeCompare(b))
}

export function listSpeakerOptions(segments, playerMap, extraSpeakers = []) {
  const names = new Set([...listPlayerNames(playerMap), ...extraSpeakers])

  for (const segment of segments) {
    if (segment.speaker) names.add(segment.speaker)
  }

  return [...names].sort((a, b) => a.localeCompare(b))
}

export function listVoiceOptions(segments) {
  const voices = new Set(['narrator', 'player'])

  for (const segment of segments) {
    if (segment.voice) voices.add(segment.voice)
  }

  const ordered = []
  for (const standard of ['narrator', 'player']) {
    if (voices.has(standard)) {
      ordered.push(standard)
      voices.delete(standard)
    }
  }

  return [...ordered, ...[...voices].sort((a, b) => a.localeCompare(b))]
}

export function speakerFieldsForPlayer(speaker, playerMap) {
  const player = playerMap?.players?.[speaker]

  if (!player) {
    return {
      speaker,
      character: null,
      voice: speaker === GM_SPEAKER ? 'narrator' : 'player',
    }
  }

  if (player.role === 'gm') {
    return { speaker, character: null, voice: 'narrator' }
  }

  return {
    speaker,
    character: player.character ?? null,
    voice: 'player',
  }
}

export function isKnownSpeaker(speaker, playerMap) {
  return Boolean(playerMap?.players?.[speaker])
}

export function isGmSpeaker(speaker, playerMap) {
  return playerMap?.players?.[speaker]?.role === 'gm'
}
