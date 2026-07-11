import { describe, expect, it } from 'vitest'
import {
  applySegmentSave,
  nextSegmentId,
  planSegmentDelete,
  planSegmentRestore,
  planSegmentSplit,
  planSegmentTextUpdate,
  planSegmentUpdate,
  TranscriptEditError,
} from './transcriptEdits.js'

const playerMap = {
  players: {
    Lisa: { character: 'Kadira' },
    Pablo: { role: 'gm' },
    Victoria: { character: 'Neo' },
  },
}

const segments = [
  { id: 1, text: 'Hello world', sourceText: 'Hello world', speaker: 'Lisa', voice: 'player' },
  { id: 2, text: 'Another line', sourceText: 'Another line', speaker: 'Pablo', voice: 'narrator' },
]

const changelog = {
  sessionId: 'test-session',
  schemaVersion: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  changes: [],
}

describe('planSegmentTextUpdate', () => {
  it('rejects empty text', () => {
    expect(() => planSegmentTextUpdate(segments, changelog, 1, '   ')).toThrow(
      TranscriptEditError,
    )
  })

  it('returns unchanged result when text matches', () => {
    const result = planSegmentTextUpdate(segments, changelog, 1, 'Hello world')
    expect(result.changed).toBe(false)
    expect(result.changelog.changes).toHaveLength(0)
  })

  it('updates segment text and appends a gm_edit changelog entry', () => {
    const result = planSegmentTextUpdate(segments, changelog, 1, 'Hello there')

    expect(result.changed).toBe(true)
    expect(result.segment.text).toBe('Hello there')
    expect(result.changelog.changes).toHaveLength(1)
    expect(result.changelog.changes[0]).toMatchObject({
      segmentId: 1,
      op: 'replace',
      path: 'text',
      old: 'Hello world',
      new: 'Hello there',
      reason: 'gm_edit',
      category: 'gm_edit',
      flagged: false,
    })
  })

  it('throws when segment is missing', () => {
    expect(() => planSegmentTextUpdate(segments, changelog, 99, 'Nope')).toThrow(
      TranscriptEditError,
    )
  })
})

describe('planSegmentUpdate', () => {
  it('updates speaker and related fields with a speaker changelog entry', () => {
    const result = planSegmentUpdate(
      segments,
      changelog,
      1,
      { text: 'Hello world', speaker: 'Victoria', voice: 'player' },
      playerMap,
    )

    expect(result.changed).toBe(true)
    expect(result.segment.speaker).toBe('Victoria')
    expect(result.segment.character).toBe('Neo')
    expect(result.segment.voice).toBe('player')
    expect(result.changelog.changes).toHaveLength(1)
    expect(result.changelog.changes[0]).toMatchObject({
      segmentId: 1,
      op: 'replace',
      path: 'speaker',
      old: 'Lisa',
      new: 'Victoria',
      reason: 'gm_edit',
      category: 'gm_edit',
    })
  })

  it('logs both text and speaker changes when both change', () => {
    const result = planSegmentUpdate(
      segments,
      changelog,
      1,
      { text: 'Hello there', speaker: 'Pablo', voice: 'narrator' },
      playerMap,
    )

    expect(result.segment.text).toBe('Hello there')
    expect(result.segment.speaker).toBe('Pablo')
    expect(result.segment.character).toBeNull()
    expect(result.segment.voice).toBe('narrator')
    expect(result.changelog.changes).toHaveLength(3)
  })

  it('allows custom speakers and applies default voice fields', () => {
    const result = planSegmentUpdate(
      segments,
      changelog,
      1,
      { text: 'Hello world', speaker: 'Guest', voice: 'player' },
      playerMap,
    )

    expect(result.changed).toBe(true)
    expect(result.segment.speaker).toBe('Guest')
    expect(result.segment.character).toBeNull()
    expect(result.segment.voice).toBe('player')
    expect(result.changelog.changes).toHaveLength(1)
    expect(result.changelog.changes[0]).toMatchObject({
      segmentId: 1,
      op: 'replace',
      path: 'speaker',
      old: 'Lisa',
      new: 'Guest',
    })
  })

  it('updates voice with a set changelog entry', () => {
    const result = planSegmentUpdate(
      segments,
      { ...changelog, changes: [] },
      2,
      { text: 'Another line', speaker: 'Pablo', voice: 'Aliciet' },
      playerMap,
    )

    expect(result.changed).toBe(true)
    expect(result.segment.voice).toBe('Aliciet')
    expect(result.changelog.changes).toHaveLength(1)
    expect(result.changelog.changes[0]).toMatchObject({
      segmentId: 2,
      op: 'set',
      path: 'voice',
      old: 'narrator',
      new: 'Aliciet',
    })
  })
})

describe('planSegmentDelete', () => {
  it('removes the segment, reindexes, and logs a remove entry', () => {
    const result = planSegmentDelete(segments, changelog, 1)

    expect(result.segments).toHaveLength(1)
    expect(result.segments[0].id).toBe(2)
    expect(result.segments[0].index).toBe(0)
    expect(result.deletedSegmentId).toBe(1)
    expect(result.changelog.changes).toHaveLength(1)
    expect(result.changelog.changes[0]).toMatchObject({
      segmentId: 1,
      op: 'remove',
      path: 'text',
      old: 'Hello world',
      new: null,
      speaker: 'Lisa',
      reason: 'gm_removed',
      category: 'gm_edit',
    })
  })

  it('throws when segment is missing', () => {
    expect(() => planSegmentDelete(segments, changelog, 99)).toThrow(TranscriptEditError)
  })
})

describe('planSegmentRestore', () => {
  const normalizedById = new Map([
    [
      1,
      {
        id: 1,
        index: 0,
        sceneId: 'test',
        speaker: 'Lisa',
        character: 'Kadira',
        voice: 'player',
        contentType: 'game',
        text: 'Hello world',
        mechanics: [],
        sourceText: 'Hello world',
        sourceSpeaker: 'Lisa',
      },
    ],
  ])

  it('restores a deleted segment, reindexes, and logs a restore entry', () => {
    const deleted = planSegmentDelete(segments, changelog, 1)
    const result = planSegmentRestore(deleted.segments, deleted.changelog, 1, normalizedById)

    expect(result.segments).toHaveLength(2)
    expect(result.segments[0].id).toBe(1)
    expect(result.segments[0].index).toBe(0)
    expect(result.segments[1].id).toBe(2)
    expect(result.segments[1].index).toBe(1)
    expect(result.segment.speaker).toBe('Lisa')
    expect(result.changelog.changes).toHaveLength(2)
    expect(result.changelog.changes[1]).toMatchObject({
      segmentId: 1,
      op: 'restore',
      path: 'text',
      old: 'Hello world',
      new: 'Hello world',
      speaker: 'Lisa',
      reason: 'gm_restored',
      category: 'gm_edit',
    })
  })

  it('throws when the segment is already present', () => {
    expect(() => planSegmentRestore(segments, changelog, 1, normalizedById)).toThrow(
      TranscriptEditError,
    )
  })

  it('throws when the segment was not deleted', () => {
    expect(() => planSegmentRestore(segments, changelog, 99, normalizedById)).toThrow(
      TranscriptEditError,
    )
  })

  it('inserts by feed display order when a high split id sits early', () => {
    const active = [
      { id: 5, index: 0, text: 'First', speaker: 'Pablo', voice: 'narrator' },
      { id: 351, index: 1, text: 'Split half', speaker: 'Pablo', voice: 'narrator' },
      { id: 6, index: 2, text: 'Next', speaker: 'Lisa', voice: 'player' },
    ]
    const withDelete = {
      ...changelog,
      changes: [
        {
          segmentId: 7,
          op: 'remove',
          path: 'text',
          old: 'After next',
          new: null,
          speaker: 'Lisa',
          reason: 'gm_removed',
          category: 'gm_edit',
        },
      ],
    }

    // Old id-order insert would place 7 before 351. Feed order puts it after 6.
    const result = planSegmentRestore(active, withDelete, 7)
    expect(result.segments.map((segment) => segment.id)).toEqual([5, 351, 6, 7])
    expect(result.segments.map((segment) => segment.index)).toEqual([0, 1, 2, 3])
  })

  it('inserts between neighbors the way deleted slots are shown', () => {
    const active = [
      { id: 10, index: 0, text: 'A', speaker: 'Pablo', voice: 'narrator' },
      { id: 11, index: 1, text: 'B', speaker: 'Lisa', voice: 'player' },
      { id: 15, index: 2, text: 'C', speaker: 'Dave', voice: 'narrator' },
    ]
    const withDelete = {
      ...changelog,
      changes: [
        {
          segmentId: 12,
          op: 'remove',
          path: 'text',
          old: 'Middle',
          new: null,
          speaker: 'Lisa',
          reason: 'gm_removed',
          category: 'gm_edit',
        },
      ],
    }

    const result = planSegmentRestore(active, withDelete, 12)
    expect(result.segments.map((segment) => segment.id)).toEqual([10, 11, 12, 15])
  })
})

describe('applySegmentSave', () => {
  it('merges saved fields without changing display index', () => {
    const local = [
      { id: 5, index: 0, text: 'First half', speaker: 'Pablo' },
      { id: 351, index: 1, text: 'Second half', speaker: 'Pablo' },
      { id: 6, index: 2, text: 'Next line', speaker: 'Lisa' },
    ]
    const saved = { id: 351, index: 0, text: 'Updated half', speaker: 'Pablo' }

    const updated = applySegmentSave(local, saved)

    expect(updated.map((segment) => segment.id)).toEqual([5, 351, 6])
    expect(updated[1]).toMatchObject({ id: 351, index: 1, text: 'Updated half' })
  })
})

describe('nextSegmentId', () => {
  it('returns one greater than the highest known id', () => {
    expect(nextSegmentId(segments, changelog, [99])).toBe(100)
  })
})

describe('planSegmentSplit', () => {
  const richSegments = [
    {
      id: 5,
      index: 0,
      text: 'Alpha beta gamma',
      sourceText: 'Alpha beta gamma',
      speaker: 'Pablo',
      voice: 'narrator',
      character: null,
      sceneId: 'test',
      contentType: 'game',
      mechanics: [{ kind: 'note' }],
    },
    {
      id: 6,
      index: 1,
      text: 'Next',
      sourceText: 'Next',
      speaker: 'Lisa',
      voice: 'player',
    },
  ]

  it('splits a segment into two, inserts by index, and logs split metadata', () => {
    const result = planSegmentSplit(
      richSegments,
      changelog,
      5,
      { firstText: 'Alpha', secondText: 'beta gamma' },
      [6],
    )

    expect(result.newSegment.id).toBe(7)
    expect(result.originalSegment.text).toBe('Alpha')
    expect(result.newSegment.text).toBe('beta gamma')
    expect(result.newSegment.speaker).toBe('Pablo')
    expect(result.newSegment.voice).toBe('narrator')
    expect(result.newSegment.sourceText).toBe('beta gamma')
    expect(result.newSegment.mechanics).toEqual([])
    expect(result.segments.map((segment) => segment.id)).toEqual([5, 7, 6])
    expect(result.segments.map((segment) => segment.index)).toEqual([0, 1, 2])
    expect(result.changelog.changes).toHaveLength(2)
    expect(result.changelog.changes[1]).toMatchObject({
      segmentId: 5,
      op: 'split',
      newSegmentId: 7,
      new: ['Alpha', 'beta gamma'],
      reason: 'gm_split',
      category: 'gm_edit',
    })
  })

  it('rejects empty parts', () => {
    expect(() =>
      planSegmentSplit(richSegments, changelog, 5, { firstText: 'Only one', secondText: '  ' }),
    ).toThrow(TranscriptEditError)
  })

  it('throws when segment is missing', () => {
    expect(() =>
      planSegmentSplit(richSegments, changelog, 99, { firstText: 'A', secondText: 'B' }),
    ).toThrow(TranscriptEditError)
  })
})
