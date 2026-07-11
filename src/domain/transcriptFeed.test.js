import { describe, expect, it } from 'vitest'
import {
  buildTranscriptFeed,
  deletedItemsLabel,
  extractRemovedSegments,
  findRestoreInsertIndex,
} from './transcriptFeed.js'

const segments = [
  { id: 2, text: 'A', speaker: 'Pablo' },
  { id: 3, text: 'B', speaker: 'Lisa' },
  { id: 5, text: 'C', speaker: 'Dave' },
]

const changelog = {
  changes: [
    { op: 'remove', segmentId: 4, old: 'Removed one', reason: 'ooc_removed' },
    { op: 'remove', segmentId: 9, old: 'Removed nine', reason: 'ooc_removed' },
    { op: 'remove', segmentId: 10, old: 'Removed ten', reason: 'ooc_removed' },
    { op: 'replace', segmentId: 2, old: 'Old A', new: 'A' },
  ],
}

describe('extractRemovedSegments', () => {
  it('returns remove entries that are not in the edited transcript', () => {
    const removed = extractRemovedSegments(
      changelog,
      segments,
      new Map([[4, { speaker: 'Victoria', voice: 'player' }]]),
    )

    expect(removed).toEqual([
      { segmentId: 4, text: 'Removed one', speaker: 'Victoria', voice: 'player' },
      { segmentId: 9, text: 'Removed nine', speaker: 'Unknown', voice: null },
      { segmentId: 10, text: 'Removed ten', speaker: 'Unknown', voice: null },
    ])
  })

  it('prefers speaker from the changelog entry', () => {
    const withSpeaker = {
      changes: [{ op: 'remove', segmentId: 4, old: 'Removed one', speaker: 'Dave' }],
    }

    expect(extractRemovedSegments(withSpeaker, segments)).toEqual([
      { segmentId: 4, text: 'Removed one', speaker: 'Dave', voice: null },
    ])
  })

  it('ignores segments that were restored after deletion', () => {
    const withRestore = {
      changes: [
        { op: 'remove', segmentId: 4, old: 'Removed one', speaker: 'Dave' },
        { op: 'restore', segmentId: 4, old: 'Removed one', new: 'Removed one', speaker: 'Dave' },
      ],
    }

    expect(extractRemovedSegments(withRestore, segments)).toEqual([])
  })
})

describe('buildTranscriptFeed', () => {
  it('interleaves deleted segments at their original positions', () => {
    const removed = extractRemovedSegments(changelog, segments)
    const feed = buildTranscriptFeed(segments, removed)

    expect(feed.map((item) => item.type)).toEqual([
      'segment',
      'segment',
      'deleted',
      'segment',
      'deleted',
    ])
    expect(feed[2].items.map((item) => item.segmentId)).toEqual([4])
    expect(feed[4].items.map((item) => item.segmentId)).toEqual([9, 10])
    expect(feed[1].segment.id).toBe(3)
    expect(feed[3].segment.id).toBe(5)
  })

  it('groups adjacent deleted ids together', () => {
    const removed = [
      { segmentId: 4, text: 'Four', speaker: 'Lisa' },
      { segmentId: 9, text: 'Nine', speaker: 'Pablo' },
      { segmentId: 10, text: 'Ten', speaker: 'Pablo' },
    ]
    const feed = buildTranscriptFeed(segments, removed)

    expect(feed.map((item) => item.type)).toEqual([
      'segment',
      'segment',
      'deleted',
      'segment',
      'deleted',
    ])
    expect(feed[2].items).toHaveLength(1)
    expect(feed[4].items).toHaveLength(2)
  })

  it('orders active segments by index when ids are out of chronological order', () => {
    const splitSegments = [
      { id: 5, index: 0, text: 'First half', speaker: 'Pablo' },
      { id: 351, index: 1, text: 'Second half', speaker: 'Pablo' },
      { id: 6, index: 2, text: 'Next line', speaker: 'Lisa' },
    ]
    const removed = [{ segmentId: 4, text: 'Removed four', speaker: 'Dave' }]
    const feed = buildTranscriptFeed(splitSegments, removed)

    expect(feed.map((item) => item.type)).toEqual(['deleted', 'segment', 'segment', 'segment'])
    expect(feed[0].items.map((item) => item.segmentId)).toEqual([4])
    expect(feed.slice(1).map((item) => item.segment.id)).toEqual([5, 351, 6])
  })

  it('does not dump deleted segments between split halves with a high new id', () => {
    const splitSegments = [
      { id: 5, index: 0, text: 'First half', speaker: 'Pablo' },
      { id: 351, index: 1, text: 'Second half', speaker: 'Pablo' },
      { id: 6, index: 2, text: 'Next line', speaker: 'Lisa' },
    ]
    const removed = [
      { segmentId: 4, text: 'Removed four', speaker: 'Dave' },
      { segmentId: 7, text: 'Removed seven', speaker: 'Lisa' },
      { segmentId: 8, text: 'Removed eight', speaker: 'Lisa' },
      { segmentId: 20, text: 'Removed twenty', speaker: 'Pablo' },
    ]
    const feed = buildTranscriptFeed(splitSegments, removed)

    expect(feed.map((item) => item.type)).toEqual([
      'deleted',
      'segment',
      'segment',
      'segment',
      'deleted',
      'deleted',
    ])
    expect(feed[0].items.map((item) => item.segmentId)).toEqual([4])
    expect(feed.slice(1, 4).map((item) => item.segment.id)).toEqual([5, 351, 6])
    expect(feed[4].items.map((item) => item.segmentId)).toEqual([7, 8])
    expect(feed[5].items.map((item) => item.segmentId)).toEqual([20])
  })

  it('scales linearly for large active lists without changing placement', () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      id: i * 2 + 1,
      index: i,
      text: `S${i}`,
      speaker: 'Dave',
    }))
    const removed = Array.from({ length: 100 }, (_, i) => ({
      segmentId: i * 2 + 2,
      text: `R${i}`,
      speaker: 'Lisa',
    }))
    const feed = buildTranscriptFeed(many, removed)
    expect(feed.filter((item) => item.type === 'segment')).toHaveLength(200)
    expect(feed.filter((item) => item.type === 'deleted')).toHaveLength(100)
    expect(feed[0].type).toBe('segment')
    expect(feed[1].type).toBe('deleted')
    expect(feed[1].items[0].segmentId).toBe(2)
  })
})

describe('findRestoreInsertIndex', () => {
  it('matches deleted-slot placement when split ids break monotonic order', () => {
    const active = [
      { id: 5, index: 0 },
      { id: 351, index: 1 },
      { id: 6, index: 2 },
    ]
    expect(findRestoreInsertIndex(active, 4)).toBe(0)
    expect(findRestoreInsertIndex(active, 7)).toBe(3)

    const withFour = buildTranscriptFeed(active, [{ segmentId: 4, text: 'x', speaker: 'A' }])
    expect(withFour[0].type).toBe('deleted')

    const withSeven = buildTranscriptFeed(active, [{ segmentId: 7, text: 'x', speaker: 'A' }])
    expect(withSeven.at(-1).type).toBe('deleted')
    expect(withSeven.at(-1).items[0].segmentId).toBe(7)
  })
})

describe('deletedItemsLabel', () => {
  it('uses singular and plural labels', () => {
    expect(deletedItemsLabel(1)).toBe('1 deleted item')
    expect(deletedItemsLabel(3)).toBe('3 deleted items')
  })
})
