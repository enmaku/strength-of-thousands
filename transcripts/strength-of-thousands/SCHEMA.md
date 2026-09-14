# Transcript schema (Strength of Thousands)

Schema version 1. Layered artifacts per session live under `session-NN/`.

## Layers

| File | Purpose |
|------|---------|
| `raw.json` | Immutable Whisper export |
| `normalized.json` | IDs + provenance; no semantic edits |
| `edited.json` | Clean session archive (game content only) |
| `changelog.json` | Structured edit log + flags |
| `meta.json` | Session metadata (`published: false` omits the session from `transcripts/index.json`) |

Set `"published": false` in `meta.json` to keep session files in the repo without listing them in the viewer index. Omit the field (or set `true`) to publish.

## Segment

```json
{
  "id": 1,
  "index": 0,
  "sceneId": "setting-overview",
  "speaker": "Dave",
  "character": null,
  "voice": "narrator",
  "contentType": "ooc",
  "text": "...",
  "mechanics": [],
  "sourceText": "...",
  "sourceSpeaker": "Dave"
}
```

### Fields

- **id** — Stable 1-based integer; assigned at normalize, never reused.
- **index** — 0-based display order in `edited.json`.
- **sceneId** — Session scene slug (see Scenes below).
- **speaker** — Player name at the table, GM name when `player-map.json` marks `role: "gm"`, or `GM Note` for archival annotations (neutral gray in the viewer).
- **character** — PC name when speaker is a player; `null` for GM.
- **voice** — Archive display voice: PC name for in-fiction player speech; `player` for table talk; `narrator` or NPC name for GM.
- **contentType** — `game`, `recap`, or `ooc`.
- **text** — Idealized, readable archive.
- **mechanics** — Optional structured rolls/checks alongside spoken text.
- **sourceText** / **sourceSpeaker** — Whisper values at normalize time.

## Scenes (Book 1)

| sceneId | Title |
|---------|-------|
| `setting-overview` | Session zero — campaign pitch |
| `character-intros` | Session zero — player character introductions |
| `welcome-walk` | Arrival; interview with Takulu Ot |
| `perquisite` | Five-day branch service tasks |
| `recap` | Session 2 — recap of arrival and first Perquisite |
| `gremlin-task` | Session 2 — Tempest-Sun pugwampi barn (Esi, Anchor Root) |
| `split-investigation` | Session 2 — tunnels, dorm search, spellskins, Chizire |
| `next-morning` | Session 2 — Ot's next exam, Noxolo, Cy'An counsel |
| `research` | Session 2 — tunnel map, library, downtime, kholo rites |
| `oils-briefing` | Session 3 — Mariama / Anchor Root Cascade oils task |
| `scarlet-cap` | Session 3 — jungle trek and scarlet-cap harvest |
| `umbo-combat` | Session 3 — first combat vs Umbo |
| `oils-gathering` | Session 3 — caterpillars, bones, finish ingredients |
| `fey-abeyance` | Session 3 — process oils; fey-abeyance ritual on bells |
| `aftermath` | Session 3 — Mariama ethics, dorm, Rain-Scribe downtime |
| `morning-downtime` | Session 4 — bonding meal; Cy'An backstory; pre-mail morning |
| `emerald-briefing` | Session 4 — Ignaci + Tzeniwe mail task; elephant birds |
| `mail-sort` | Session 4 — sort basket; easy vs hard letters |
| `easy-deliveries` | Session 4 — city vignettes (Chinasa, Ige, Musubu, Jatau) |
| `lamp-dispute` | Session 4 — Mauxi lamp; Ndidi vs Jatia |
| `hard-deliveries` | Session 4 — rural parcels, unclear addresses |
| `mail-return` | Session 4 — ginger beer close |
| `introduction-ceremony` | End of Ch 1; gremlin attack |
| `campus-semester` | Classes, teacher missions, dorm life |
| `first-masking` | Ch 2 ceremony; giant insect attack |
| `archhorn-tunnels` | Ch 3 library tunnels; Stone Ghost |

Add scene ids as play progresses.
