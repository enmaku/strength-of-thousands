import { findEffectiveRemoveEntries } from './transcriptEdits.js'

export function extractRemovedSegments(changelog, segments, segmentMetaById = new Map()) {
  if (!changelog?.changes) return []

  const visibleIds = new Set(segments.map((segment) => segment.id))
  const removed = []

  for (const [segmentId, change] of findEffectiveRemoveEntries(changelog)) {
    if (visibleIds.has(segmentId)) continue

    const meta = segmentMetaById.get(segmentId)
    removed.push({
      segmentId,
      text: change.old ?? '',
      speaker: change.speaker ?? meta?.speaker ?? 'Unknown',
      voice: meta?.voice ?? null,
    })
  }

  return removed.sort((a, b) => a.segmentId - b.segmentId)
}

function shouldEmitDeletedBefore(deletedId, activeId, prevActiveId, minLaterActiveId) {
  return (
    deletedId > prevActiveId &&
    deletedId < activeId &&
    deletedId < minLaterActiveId
  )
}

function emitDeletedGroups(feed, removedQueue, shouldEmit) {
  while (removedQueue.length > 0 && shouldEmit(removedQueue[0].segmentId)) {
    const items = [removedQueue.shift()]
    while (
      removedQueue.length > 0 &&
      shouldEmit(removedQueue[0].segmentId) &&
      removedQueue[0].segmentId === items[items.length - 1].segmentId + 1
    ) {
      items.push(removedQueue.shift())
    }

    feed.push({
      type: 'deleted',
      key: `deleted-${items[0].segmentId}-${items[items.length - 1].segmentId}`,
      items,
    })
  }
}

export function buildTranscriptFeed(segments, removedSegments) {
  const orderedSegments = [...segments].sort((a, b) => a.index - b.index)
  const removedQueue = [...removedSegments].sort((a, b) => a.segmentId - b.segmentId)
  const feed = []

  const minLaterActiveId = new Array(orderedSegments.length)
  let minLater = Number.POSITIVE_INFINITY
  for (let i = orderedSegments.length - 1; i >= 0; i--) {
    minLaterActiveId[i] = minLater
    minLater = Math.min(minLater, orderedSegments[i].id)
  }

  for (let i = 0; i < orderedSegments.length; i++) {
    const segment = orderedSegments[i]
    const prevActiveId = i > 0 ? orderedSegments[i - 1].id : 0

    emitDeletedGroups(feed, removedQueue, (deletedId) =>
      shouldEmitDeletedBefore(deletedId, segment.id, prevActiveId, minLaterActiveId[i]),
    )

    feed.push({ type: 'segment', key: `segment-${segment.id}`, segment })
  }

  emitDeletedGroups(feed, removedQueue, () => true)

  return feed
}

export function deletedItemsLabel(count) {
  return count === 1 ? '1 deleted item' : `${count} deleted items`
}
