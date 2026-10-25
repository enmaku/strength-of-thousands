import { describe, expect, it } from 'vitest'
import beats from '../../data/timeline.json'

// Player-facing prose. A beat may describe what happened; it may not tell the
// reader what it will lead to.
const FORWARD_REFERENCES = [
  /\bwill matter\b/i,
  /\bpays? off\b/i,
  /\bpayoff\b/i,
  /\bnobody knows\b/i,
  /\bnot yet\b/i,
  /\byears later\b/i,
  /\bfirst hint\b/i,
  /\bthe arc\b/i,
  /\bwhole book\b/i,
  /\brest of the book\b/i,
  /\bcomes back in Book\b/i,
  /\bthe campaign[’']s (cleanest|densest|longest|best)\b/i,
]

describe('timeline descriptions', () => {
  it('do not foreshadow later beats', () => {
    const offending = beats
      .filter((beat) =>
        FORWARD_REFERENCES.some((pattern) => pattern.test(`${beat.title} ${beat.description ?? ''}`)),
      )
      .map((beat) => beat.id)

    expect(offending).toEqual([])
  })
})

describe('timeline rows', () => {
  it('keep the session number in the id prefix in sync', () => {
    const drifted = beats
      .filter((beat) => {
        const prefix = /^s(\d+)-/.exec(beat.id)
        return prefix && Number(prefix[1]) !== beat.session
      })
      .map((beat) => `${beat.id} → session ${beat.session}`)

    expect(drifted).toEqual([])
  })

  it('store sessions in ascending display order', () => {
    const sessions = beats.filter((beat) => beat.lane !== 'book').map((beat) => beat.session)
    expect(sessions).toEqual([...sessions].sort((a, b) => a - b))
  })

  it('have unique ids', () => {
    expect(new Set(beats.map((beat) => beat.id)).size).toBe(beats.length)
  })
})
