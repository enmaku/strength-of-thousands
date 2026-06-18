# Transcript schema (Kibwe homegame)

Schema version 1. Layered artifacts per session live under `session-NN/`.

## Layers

| File | Purpose |
|------|---------|
| `raw.json` | Immutable Whisper export |
| `normalized.json` | IDs + provenance; no semantic edits |
| `edited.json` | Clean session archive (game content only) |
| `changelog.json` | Structured edit log + flags |
| `meta.json` | Session metadata |

Future: `approved.json` after GM sign-off.

## Segment

```json
{
  "id": 1,
  "index": 0,
  "sceneId": "aliciet-office",
  "speaker": "Pablo",
  "character": null,
  "voice": "narrator",
  "contentType": "game",
  "text": "...",
  "mechanics": [
    {
      "kind": "check",
      "skill": "Perception",
      "rolls": [{ "character": "Kadira", "raw": 13, "total": null }]
    }
  ],
  "sourceText": "...",
  "sourceSpeaker": "Pablo"
}
```

### Fields

- **id** — Stable 1-based integer; assigned at normalize, never reused. After GM splits, new segments get `max(known ids) + 1` and may sort after later source ids — that is expected.
- **index** — 0-based display order in `edited.json`. Authoritative for transcript UI ordering; renumbered after delete, restore, or split.
- **sceneId** — One of: `aliciet-office`, `white-marks-war-council`, `bwamandu-fisters-bar`, `fisters-planning`.
- **speaker** — Player name at the table, or `Pablo` for GM.
- **character** — PC name when speaker is a player; `null` for GM.
- **voice** — Archive display voice: PC name for in-fiction player speech; `player` for table talk; `narrator` or NPC name for GM. Assigned in the editorial pass, not by script.
- **contentType** — `game`, `recap`, or `ooc`. Segments removed by the editorial pass are omitted from `edited.json` (`op: remove` in changelog only).
- **text** — Idealized, readable archive (what happened / what characters said). Updated by the LLM editorial pass and GM edits.
- **mechanics** — Optional structured rolls/checks alongside spoken text.
- **sourceText** / **sourceSpeaker** — Whisper values at normalize time. **Do not rewrite during the editorial pass** — only `text` idealizes. GM text edits also leave `sourceText` unchanged (viewer diff compares `sourceText` → `text`). GM **split** children set `sourceText` to their initial `text` (no Whisper line for that half).

## Changelog entry

```json
{
  "segmentId": 12,
  "op": "replace",
  "path": "text",
  "old": "Alicia",
  "new": "Aliciet",
  "reason": "proper_noun",
  "confidence": 0.95,
  "flagged": false,
  "category": "proper_noun"
}
```

### Operations

- `replace` — Field value change
- `remove` — Segment dropped from edited (pipeline OOC/filler or GM delete)
- `restore` — GM undelete; segment reinserted into edited
- `merge` — Multiple source IDs → one edited segment
- `split` — One source ID → multiple edited segments (`newSegmentId` on the changelog entry)
- `set` — New field value (voice, sceneId, character, mechanics)
- `flag` — No change applied; needs human review

### Categories

`proper_noun`, `mundane_typo`, `ooc_removed`, `filler_removed`, `clarity_edit`, `merge`, `split`, `voice`, `scene`, `mechanics`, `diarization`, `uncertain`, `gm_edit`

Pipeline categories come from the LLM editorial pass. **`gm_edit`** is used by the Transcripts viewer (localhost) for manual edit, split, delete, and restore.

## Scenes

| sceneId | Title |
|---------|-------|
| `aliciet-office` | Aliciet's office through coin handoff |
| `white-marks-war-council` | White Marks war council |
| `bwamandu-fisters-bar` | Walk to Bwamandu / Fister's / Morley's speech |
| `fisters-planning` | Planning at the bar through session end |
