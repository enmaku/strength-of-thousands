import { describe, expect, it } from 'vitest'
import {
  defaultVoiceForSpeaker,
  formatSpeakerLabel,
  isKnownSpeaker,
  listPlayerNames,
  listSpeakerOptions,
  listVoiceOptions,
  isGmSpeaker,
  speakerFieldsForPlayer,
} from './transcriptSpeakers.js'

const playerMap = {
  players: {
    Lisa: { character: 'Kadira' },
    Victoria: { character: 'Neo' },
    Dave: { character: 'Mr. Andy' },
    Pablo: { role: 'gm' },
    Brian: { character: null },
  },
}

describe('formatSpeakerLabel', () => {
  it('includes npc voices', () => {
    expect(formatSpeakerLabel('Pablo', 'Aliciet')).toBe('Pablo (as Aliciet)')
  })

  it('returns speaker alone for default player and narrator voices', () => {
    expect(formatSpeakerLabel('Lisa', 'player')).toBe('Lisa')
    expect(formatSpeakerLabel('Pablo', 'narrator')).toBe('Pablo')
  })

  it('returns speaker alone when voice is missing', () => {
    expect(formatSpeakerLabel('Lisa', null)).toBe('Lisa')
  })
})

describe('listVoiceOptions', () => {
  it('includes standard voices plus any used in the transcript', () => {
    const segments = [
      { voice: 'player' },
      { voice: 'narrator' },
      { voice: 'Aliciet' },
      { voice: 'Fister' },
    ]

    expect(listVoiceOptions(segments)).toEqual(['narrator', 'player', 'Aliciet', 'Fister'])
  })
})

describe('defaultVoiceForSpeaker', () => {
  it('returns narrator for the gm', () => {
    expect(defaultVoiceForSpeaker('Pablo', playerMap)).toBe('narrator')
  })
})

describe('listPlayerNames', () => {
  it('returns sorted player names', () => {
    expect(listPlayerNames(playerMap)).toEqual(['Brian', 'Dave', 'Lisa', 'Pablo', 'Victoria'])
  })
})

describe('listSpeakerOptions', () => {
  it('includes player map names, transcript speakers, and custom additions', () => {
    const segments = [{ speaker: 'Morley' }, { speaker: 'Lisa' }]

    expect(listSpeakerOptions(segments, playerMap, ['Guest'])).toEqual([
      'Brian',
      'Dave',
      'Guest',
      'Lisa',
      'Morley',
      'Pablo',
      'Victoria',
    ])
  })
})

describe('speakerFieldsForPlayer', () => {
  it('maps players to character and voice', () => {
    expect(speakerFieldsForPlayer('Lisa', playerMap)).toEqual({
      speaker: 'Lisa',
      character: 'Kadira',
      voice: 'player',
    })
  })

  it('maps the gm to narrator voice', () => {
    expect(speakerFieldsForPlayer('Pablo', playerMap)).toEqual({
      speaker: 'Pablo',
      character: null,
      voice: 'narrator',
    })
  })
})

describe('isKnownSpeaker', () => {
  it('accepts names from the player map', () => {
    expect(isKnownSpeaker('Victoria', playerMap)).toBe(true)
    expect(isKnownSpeaker('Unknown', playerMap)).toBe(false)
  })
})

describe('isGmSpeaker', () => {
  it('returns true when the player map marks the speaker as gm', () => {
    expect(isGmSpeaker('Pablo', playerMap)).toBe(true)
    expect(isGmSpeaker('Lisa', playerMap)).toBe(false)
  })
})
