import { speakerFieldsForPlayer } from './transcriptSpeakers.js'
import { findRestoreInsertIndex } from './transcriptFeedOrder.js'

export class TranscriptEditError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = 'TranscriptEditError'
    this.status = status
  }
}

export function findEffectiveRemoveEntries(changelog) {
  const removeBySegmentId = new Map()

  for (const change of changelog?.changes ?? []) {
    if (change.segmentId === undefined) continue
    if (change.op === 'remove') {
      removeBySegmentId.set(change.segmentId, change)
    }
    if (change.op === 'restore') {
      removeBySegmentId.delete(change.segmentId)
    }
  }

  return removeBySegmentId
}

export function planSegmentUpdate(segments, changelog, segmentId, updates, playerMap = {}) {
  const text = updates.text?.trim()
  if (!text) {
    throw new TranscriptEditError('Text is required')
  }

  const segment = segments.find((entry) => entry.id === segmentId)
  if (!segment) {
    throw new TranscriptEditError('Segment not found', 404)
  }

  const speaker = updates.speaker?.trim() || segment.speaker
  const voice = updates.voice?.trim() || segment.voice

  if (!voice) {
    throw new TranscriptEditError('Voice is required')
  }

  if (!speaker) {
    throw new TranscriptEditError('Speaker is required')
  }

  const textChanged = segment.text !== text
  const speakerChanged = segment.speaker !== speaker
  const voiceChanged = segment.voice !== voice

  if (!textChanged && !speakerChanged && !voiceChanged) {
    return { segments, changelog, changed: false, segment }
  }

  const speakerFields = speakerChanged ? speakerFieldsForPlayer(speaker, playerMap) : {}
  const updatedSegment = {
    ...segment,
    text,
    speaker,
    voice,
    character: speakerChanged ? speakerFields.character : segment.character,
  }

  const changeEntries = []

  if (textChanged) {
    changeEntries.push({
      segmentId,
      op: 'replace',
      path: 'text',
      old: segment.text,
      new: text,
      reason: 'gm_edit',
      confidence: 1,
      flagged: false,
      category: 'gm_edit',
    })
  }

  if (speakerChanged) {
    changeEntries.push({
      segmentId,
      op: 'replace',
      path: 'speaker',
      old: segment.speaker,
      new: speaker,
      reason: 'gm_edit',
      confidence: 1,
      flagged: false,
      category: 'gm_edit',
    })
  }

  if (voiceChanged) {
    changeEntries.push({
      segmentId,
      op: 'set',
      path: 'voice',
      old: segment.voice,
      new: voice,
      reason: 'gm_edit',
      confidence: 1,
      flagged: false,
      category: 'gm_edit',
    })
  }

  const updatedSegments = segments.map((entry) =>
    entry.id === segmentId ? updatedSegment : entry,
  )

  const updatedChangelog = {
    ...changelog,
    generatedAt: new Date().toISOString(),
    changes: [...changelog.changes, ...changeEntries],
  }

  return {
    segments: updatedSegments,
    changelog: updatedChangelog,
    changed: true,
    segment: updatedSegment,
  }
}

export function planSegmentTextUpdate(segments, changelog, segmentId, newText) {
  return planSegmentUpdate(segments, changelog, segmentId, { text: newText }, {})
}

export function applySegmentSave(segments, saved) {
  return segments.map((entry) =>
    entry.id === saved.id ? { ...entry, ...saved, index: entry.index } : entry,
  )
}

export function planSegmentDelete(segments, changelog, segmentId) {
  const segment = segments.find((entry) => entry.id === segmentId)
  if (!segment) {
    throw new TranscriptEditError('Segment not found', 404)
  }

  const updatedSegments = segments
    .filter((entry) => entry.id !== segmentId)
    .map((entry, index) => ({ ...entry, index }))

  const changeEntry = {
    segmentId,
    op: 'remove',
    path: 'text',
    old: segment.text,
    new: null,
    speaker: segment.speaker,
    reason: 'gm_removed',
    confidence: 1,
    flagged: false,
    category: 'gm_edit',
  }

  const updatedChangelog = {
    ...changelog,
    generatedAt: new Date().toISOString(),
    changes: [...changelog.changes, changeEntry],
  }

  return {
    segments: updatedSegments,
    changelog: updatedChangelog,
    deletedSegmentId: segmentId,
  }
}

export function nextSegmentId(segments, changelog, normalizedIds = []) {
  const ids = new Set()

  for (const segment of segments) {
    ids.add(segment.id)
  }

  for (const id of normalizedIds) {
    ids.add(id)
  }

  for (const change of changelog?.changes ?? []) {
    if (change.segmentId != null) ids.add(change.segmentId)
    if (change.newSegmentId != null) ids.add(change.newSegmentId)
  }

  if (ids.size === 0) return 1
  return Math.max(...ids) + 1
}

export function planSegmentSplit(segments, changelog, segmentId, parts, normalizedIds = []) {
  const first = parts.firstText?.trim()
  const second = parts.secondText?.trim()

  if (!first || !second) {
    throw new TranscriptEditError('Both parts are required')
  }

  const segmentIndex = segments.findIndex((entry) => entry.id === segmentId)
  if (segmentIndex === -1) {
    throw new TranscriptEditError('Segment not found', 404)
  }

  const segment = segments[segmentIndex]
  const newSegmentId = nextSegmentId(segments, changelog, normalizedIds)
  const updatedOriginal = { ...segment, text: first }
  const newSegment = {
    ...segment,
    id: newSegmentId,
    text: second,
    sourceText: second,
    sourceSpeaker: segment.speaker,
    mechanics: [],
  }

  const updatedSegments = [
    ...segments.slice(0, segmentIndex),
    updatedOriginal,
    newSegment,
    ...segments.slice(segmentIndex + 1),
  ].map((entry, index) => ({ ...entry, index }))

  const changeEntries = [
    {
      segmentId,
      op: 'replace',
      path: 'text',
      old: segment.text,
      new: first,
      reason: 'gm_split',
      confidence: 1,
      flagged: false,
      category: 'gm_edit',
    },
    {
      segmentId,
      op: 'split',
      path: 'text',
      old: segment.text,
      new: [first, second],
      newSegmentId,
      reason: 'gm_split',
      confidence: 1,
      flagged: false,
      category: 'gm_edit',
    },
  ]

  const updatedChangelog = {
    ...changelog,
    generatedAt: new Date().toISOString(),
    changes: [...changelog.changes, ...changeEntries],
  }

  return {
    segments: updatedSegments,
    changelog: updatedChangelog,
    originalSegment: updatedOriginal,
    newSegment,
  }
}

function buildMinimalRestoredSegment(segmentId, removeEntry) {
  const speaker = removeEntry.speaker ?? 'Unknown'
  const text = removeEntry.old ?? ''

  return {
    id: segmentId,
    index: 0,
    sceneId: null,
    speaker,
    character: null,
    voice: 'player',
    contentType: 'game',
    text,
    mechanics: [],
    sourceText: text,
    sourceSpeaker: speaker,
  }
}

export function planSegmentRestore(segments, changelog, segmentId, normalizedById = new Map()) {
  if (segments.some((entry) => entry.id === segmentId)) {
    throw new TranscriptEditError('Segment is not deleted')
  }

  const removeEntry = findEffectiveRemoveEntries(changelog).get(segmentId)
  if (!removeEntry) {
    throw new TranscriptEditError('Deleted segment not found', 404)
  }

  const normalized = normalizedById.get(segmentId)
  const restored = normalized
    ? { ...normalized, text: removeEntry.old ?? normalized.text }
    : buildMinimalRestoredSegment(segmentId, removeEntry)

  const insertAt = findRestoreInsertIndex(segments, segmentId)
  const updatedSegments = [
    ...segments.slice(0, insertAt),
    restored,
    ...segments.slice(insertAt),
  ].map((entry, index) => ({ ...entry, index }))

  const changeEntry = {
    segmentId,
    op: 'restore',
    path: 'text',
    old: removeEntry.old,
    new: restored.text,
    speaker: restored.speaker,
    reason: 'gm_restored',
    confidence: 1,
    flagged: false,
    category: 'gm_edit',
  }

  const updatedChangelog = {
    ...changelog,
    generatedAt: new Date().toISOString(),
    changes: [...changelog.changes, changeEntry],
  }

  const segment = updatedSegments.find((entry) => entry.id === segmentId)

  return {
    segments: updatedSegments,
    changelog: updatedChangelog,
    segment,
  }
}
