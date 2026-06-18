export function sortTranscriptSessions(sessions, direction = 'desc') {
  const factor = direction === 'asc' ? 1 : -1
  return [...sessions].sort((a, b) => (a.sessionNumber - b.sessionNumber) * factor)
}

export function defaultTranscriptSession(sessions) {
  return sortTranscriptSessions(sessions, 'desc')[0] ?? null
}

export function sessionPaths(session) {
  return {
    base: `transcripts/${session.campaign}/${session.sessionDir}`,
    api: `${session.campaign}/${session.sessionDir}`,
  }
}

export function isSameTranscriptSession(a, b) {
  if (!a || !b) return false
  return a.sessionId === b.sessionId
}
