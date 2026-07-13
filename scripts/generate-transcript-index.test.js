import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PUBLISH_BASE,
  isPublishedSession,
  publishedTranscriptFileUrl,
  resolvePublishBase,
} from './generate-transcript-index.mjs'

describe('resolvePublishBase', () => {
  it('strips a trailing slash', () => {
    expect(resolvePublishBase('https://example.com/repo/')).toBe('https://example.com/repo')
  })

  it('falls back to the default publish base', () => {
    expect(resolvePublishBase()).toBe(DEFAULT_PUBLISH_BASE)
  })
})

describe('publishedTranscriptFileUrl', () => {
  it('builds a fully qualified edited.json URL', () => {
    expect(
      publishedTranscriptFileUrl(
        'kibwe-homegame',
        'session-05',
        'edited.json',
        'https://enmaku.github.io/strength-of-thousands',
      ),
    ).toBe(
      'https://enmaku.github.io/strength-of-thousands/transcripts/kibwe-homegame/session-05/edited.json',
    )
  })
})

describe('isPublishedSession', () => {
  it('treats missing published as true', () => {
    expect(isPublishedSession({})).toBe(true)
  })

  it('respects published: false', () => {
    expect(isPublishedSession({ published: false })).toBe(false)
  })

  it('respects published: true', () => {
    expect(isPublishedSession({ published: true })).toBe(true)
  })
})
