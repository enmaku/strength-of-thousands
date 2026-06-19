import { describe, expect, it } from 'vitest'
import {
  defaultTranscriptSession,
  enrichPlayerMapForAssistant,
  isSameTranscriptSession,
  rawEditedTranscriptUrl,
  rawEditedTranscriptUrls,
  rawHeroJsonUrl,
  sessionPaths,
  sortTranscriptSessions,
} from './transcriptSessions.js'

const sessions = [
  {
    campaign: 'kibwe-homegame',
    sessionDir: 'session-03',
    sessionNumber: 3,
    sessionId: 'kibwe-homegame-session-03',
    label: 'Session 3',
  },
  {
    campaign: 'kibwe-homegame',
    sessionDir: 'session-05',
    sessionNumber: 5,
    sessionId: 'kibwe-homegame-session-05',
    label: 'Session 5',
  },
  {
    campaign: 'kibwe-homegame',
    sessionDir: 'session-01',
    sessionNumber: 1,
    sessionId: 'kibwe-homegame-session-01',
    label: 'Session 1',
  },
]

describe('sortTranscriptSessions', () => {
  it('sorts by session number descending by default', () => {
    expect(sortTranscriptSessions(sessions).map((session) => session.sessionNumber)).toEqual([
      5, 3, 1,
    ])
  })

  it('sorts ascending when requested', () => {
    expect(sortTranscriptSessions(sessions, 'asc').map((session) => session.sessionNumber)).toEqual(
      [1, 3, 5],
    )
  })
})

describe('defaultTranscriptSession', () => {
  it('returns the highest session number', () => {
    expect(defaultTranscriptSession(sessions)?.sessionNumber).toBe(5)
  })
})

describe('sessionPaths', () => {
  it('builds static and API paths', () => {
    expect(sessionPaths(sessions[1])).toEqual({
      base: 'transcripts/kibwe-homegame/session-05',
      api: 'kibwe-homegame/session-05',
    })
  })
})

describe('isSameTranscriptSession', () => {
  it('matches by session id', () => {
    expect(isSameTranscriptSession(sessions[0], sessions[0])).toBe(true)
    expect(isSameTranscriptSession(sessions[0], sessions[1])).toBe(false)
  })
})

describe('rawEditedTranscriptUrl', () => {
  it('builds a raw GitHub URL for edited.json', () => {
    expect(rawEditedTranscriptUrl(sessions[1])).toBe(
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/transcripts/kibwe-homegame/session-05/edited.json',
    )
  })
})

describe('rawHeroJsonUrl', () => {
  it('builds a raw GitHub URL for a hero file', () => {
    expect(rawHeroJsonUrl('taraan-skyseeker')).toBe(
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/heroes/taraan-skyseeker.json',
    )
  })
})

describe('enrichPlayerMapForAssistant', () => {
  it('adds heroUrls and per-player heroUrl when heroSlug is set', () => {
    const heroUrl =
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/heroes/taraan-skyseeker.json'

    expect(
      enrichPlayerMapForAssistant(
        {
          players: {
            Lisa: { character: 'Kadira', heroSlug: 'taraan-skyseeker' },
            Pablo: { role: 'gm' },
          },
        },
        ['taraan-skyseeker', 'xidic-goldenclaw'],
      ),
    ).toEqual({
      players: {
        Lisa: { character: 'Kadira', heroSlug: 'taraan-skyseeker', heroUrl },
        Pablo: { role: 'gm' },
      },
      heroUrls: {
        'taraan-skyseeker': heroUrl,
        'xidic-goldenclaw':
          'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/heroes/xidic-goldenclaw.json',
      },
    })
  })
})

describe('rawEditedTranscriptUrls', () => {
  it('returns one URL per session in input order', () => {
    expect(rawEditedTranscriptUrls(sessions)).toEqual([
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/transcripts/kibwe-homegame/session-03/edited.json',
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/transcripts/kibwe-homegame/session-05/edited.json',
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/transcripts/kibwe-homegame/session-01/edited.json',
    ])
  })
})
