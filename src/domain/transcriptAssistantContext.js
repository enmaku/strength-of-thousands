import { enrichPlayerMapForAssistant } from './transcriptSessions.js'

export const TRANSCRIPT_ASSISTANT_PROMPT = `Use the following campaign context as the source of truth for this conversation.

Before answering any questions:
1. Fetch every URL in transcriptUrls and every URL in playerMap.heroUrls (and any player heroUrl fields).
2. Do not report a fetch failure without actually trying the URL.
3. Reply first with a short source inventory — each URL and whether it loaded (✓ or ✗).
4. Do not answer campaign questions until that inventory is complete.

When answering:
- Use transcripts for session events and dialogue.
- Use hero files for stats, abilities, equipment, relationships, and backstory.
- Answer only from fetched materials. Say "not covered" when something is missing.
- Do not infer from Pathfinder rules, AP lore, or outside knowledge.
- Try to account for player error in names and other details. Their memory and spelling are not perfect.`

export function buildTranscriptAssistantContext({
  sessions,
  sessionMetas = [],
  playerMaps = {},
  heroSlugs = [],
  transcriptUrls = [],
}) {
  const metasBySessionId = new Map(
    sessionMetas.filter(Boolean).map((meta) => [meta.sessionId, meta]),
  )
  const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber)
  const primarySlug = sortedSessions[0]?.campaign ?? null
  const latestSession = sortedSessions[sortedSessions.length - 1]
  const latestMeta = latestSession ? metasBySessionId.get(latestSession.sessionId) : null
  const firstMeta = sortedSessions[0]
    ? metasBySessionId.get(sortedSessions[0].sessionId)
    : null

  return {
    campaign: {
      slug: primarySlug,
      name: latestMeta?.campaign ?? firstMeta?.campaign ?? primarySlug,
      system: latestMeta?.system ?? firstMeta?.system ?? null,
      partyLevel: latestMeta?.partyLevel ?? null,
    },
    playerMap: primarySlug
      ? enrichPlayerMapForAssistant(playerMaps[primarySlug], heroSlugs)
      : null,
    sessions: sortedSessions.map((session) => {
      const meta = metasBySessionId.get(session.sessionId)
      return {
        sessionId: session.sessionId,
        sessionNumber: session.sessionNumber,
        partyLevel: meta?.partyLevel ?? null,
      }
    }),
    transcriptUrls,
  }
}

export function serializeTranscriptAssistantContext(context) {
  return `${TRANSCRIPT_ASSISTANT_PROMPT}\n\n${JSON.stringify(context)}`
}
