import { describe, expect, it } from 'vitest'
import {
  buildTranscriptAssistantContext,
  serializeTranscriptAssistantContext,
  TRANSCRIPT_ASSISTANT_PROMPT,
} from './transcriptAssistantContext.js'

const sessions = [
  {
    campaign: 'kibwe-homegame',
    sessionDir: 'session-05',
    sessionNumber: 5,
    sessionId: 'kibwe-homegame-session-05',
    label: 'Session 5',
  },
]

const sessionMetas = [
  {
    sessionId: 'kibwe-homegame-session-05',
    campaign: 'Kibwe homegame',
    system: 'Pathfinder 1e',
    sessionNumber: 5,
    partyLevel: 5,
  },
]

describe('buildTranscriptAssistantContext', () => {
  it('assembles campaign context and transcript URLs', () => {
    const transcriptUrls = [
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/transcripts/kibwe-homegame/session-05/edited.json',
    ]
    const heroUrl =
      'https://raw.githubusercontent.com/enmaku/strength-of-thousands/refs/heads/main/heroes/taraan-skyseeker.json'

    expect(
      buildTranscriptAssistantContext({
        sessions,
        sessionMetas,
        playerMaps: {
          'kibwe-homegame': {
            players: {
              Lisa: { character: 'Kadira', heroSlug: 'taraan-skyseeker' },
            },
          },
        },
        heroSlugs: ['taraan-skyseeker'],
        transcriptUrls,
      }),
    ).toEqual({
      campaign: {
        slug: 'kibwe-homegame',
        name: 'Kibwe homegame',
        system: 'Pathfinder 1e',
        partyLevel: 5,
      },
      playerMap: {
        players: {
          Lisa: { character: 'Kadira', heroSlug: 'taraan-skyseeker', heroUrl },
        },
        heroUrls: {
          'taraan-skyseeker': heroUrl,
        },
      },
      sessions: [
        {
          sessionId: 'kibwe-homegame-session-05',
          sessionNumber: 5,
          partyLevel: 5,
        },
      ],
      transcriptUrls,
    })
  })
})

describe('serializeTranscriptAssistantContext', () => {
  it('returns a prompt followed by compact JSON', () => {
    const json = serializeTranscriptAssistantContext({ transcriptUrls: ['https://example.com/a.json'] })
    expect(json.startsWith(TRANSCRIPT_ASSISTANT_PROMPT)).toBe(true)
    expect(json).toBe(
      `${TRANSCRIPT_ASSISTANT_PROMPT}\n\n{"transcriptUrls":["https://example.com/a.json"]}`,
    )
  })
})
