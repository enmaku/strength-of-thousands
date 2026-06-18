import { describe, expect, it } from 'vitest'
import {
  defaultTranscriptSession,
  isSameTranscriptSession,
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
