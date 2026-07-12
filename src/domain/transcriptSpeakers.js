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

function playerCharacterNames(playerMap) {
  return new Set(
    Object.values(playerMap?.players ?? {})
      .map((player) => player.character)
      .filter(Boolean),
  )
}

function orderVoiceOptions(voices, standards) {
  const remaining = new Set(voices)
  const ordered = []

  for (const standard of standards) {
    if (remaining.has(standard)) {
      ordered.push(standard)
      remaining.delete(standard)
    }
  }

  return [...ordered, ...[...remaining].sort((a, b) => a.localeCompare(b))]
}

function listAllVoiceOptions(segments) {
  const voices = new Set(['narrator', 'player'])

  for (const segment of segments) {
    if (segment.voice) voices.add(segment.voice)
  }

  return orderVoiceOptions(voices, ['narrator', 'player'])
}

function listGmVoiceOptions(segments, playerMap) {
  const playerVoices = new Set(['player', ...playerCharacterNames(playerMap)])
  const voices = new Set(['narrator'])

  for (const segment of segments) {
    if (segment.voice && !playerVoices.has(segment.voice)) {
      voices.add(segment.voice)
    }
  }

  return orderVoiceOptions(voices, ['narrator'])
}

function listPlayerVoiceOptions(speaker, playerMap) {
  const voices = new Set(['player'])
  const character = playerMap?.players?.[speaker]?.character
  if (character) voices.add(character)
  return orderVoiceOptions(voices, ['player'])
}

export function listVoiceOptions(segments, speaker = null, playerMap = null) {
  if (speaker && isGmSpeaker(speaker, playerMap)) {
    return listGmVoiceOptions(segments, playerMap)
  }

  if (speaker && isKnownSpeaker(speaker, playerMap)) {
    return listPlayerVoiceOptions(speaker, playerMap)
  }

  return listAllVoiceOptions(segments)
}

export function canAddCustomVoice(speaker, playerMap) {
  if (!speaker) return true
  if (isGmSpeaker(speaker, playerMap)) return true
  if (isKnownSpeaker(speaker, playerMap)) return false
  return true
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
