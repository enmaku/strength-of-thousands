/**
 * Shared display-order rules for interleaving deleted slots and restore inserts.
 * Active segments are ordered by `index`; ids may be non-monotonic (GM splits).
 */

export function shouldEmitDeletedBefore(deletedId, activeId, prevActiveId, minLaterActiveId) {
  return (
    deletedId > prevActiveId &&
    deletedId < activeId &&
    deletedId < minLaterActiveId
  )
}

export function buildMinLaterActiveIds(orderedSegments) {
  const minLaterActiveId = new Array(orderedSegments.length)
  let minLater = Number.POSITIVE_INFINITY
  for (let i = orderedSegments.length - 1; i >= 0; i--) {
    minLaterActiveId[i] = minLater
    minLater = Math.min(minLater, orderedSegments[i].id)
  }
  return minLaterActiveId
}

/**
 * Display-order insert index for restoring `segmentId`, matching deleted-slot
 * placement in the transcript feed. Do not use raw numeric id order.
 */
export function findRestoreInsertIndex(segments, segmentId) {
  const ordered = [...segments].sort((a, b) => a.index - b.index)
  const minLaterActiveId = buildMinLaterActiveIds(ordered)

  for (let i = 0; i < ordered.length; i++) {
    const prevActiveId = i > 0 ? ordered[i - 1].id : 0
    if (
      shouldEmitDeletedBefore(segmentId, ordered[i].id, prevActiveId, minLaterActiveId[i])
    ) {
      const at = segments.findIndex((entry) => entry.id === ordered[i].id)
      return at === -1 ? i : at
    }
  }

  return segments.length
}
