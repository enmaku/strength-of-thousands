# Session prep lessons — how to write the next one

Repeatable recipe for **Sessions** GM prep HTML under `lessons/`. Menu wiring: `src/domain/gmLessons.js` → section `id: 'sessions'`.

## What a session prep is

One HTML file the GM opens before that night’s game. It is **not** a full book lesson (those stay under Books). It answers:

1. Where did we leave off? (`reference/sot-session-log.md`)
2. How much book content is **realistic** this session?
3. What must I know to run that slice cold?
4. Which **player tie-in** drips and **NPC hitches** belong in this window?
5. How do I advance PC stories at AP pace without stealing the spotlight?

## Filename & menu

- File: `lessons/00NN-session-N-prep.html` (next free number; title Session N Prep).
- Caption in menu: short scope, e.g. `GM prep · Perquisite days 2–3`.
- Newest sessions at top of the Sessions list is fine; keep ascending session numbers in captions.

## Required sections (in order)

Copy structure/CSS from the latest session prep or from Book 1 lesson styles (parchment vars, green header, spoiler boxes, quiz).

1. **Header** — Session N · Book/Chapter · one-line scope.
2. **Left off / start cold** — 3–6 bullets from session log + transcript.
3. **Pace estimate** — expected / stretch / cut-early. Cite why (prior session density + encounter weight).
4. **Tonight’s book content** — beat-by-beat for estimated material only; cite extract pages or Book lesson anchors. Stat-block pointers, not full bestiary reprint.
5. **NPC introductions** — who debuts; planned PC relationships from `0009-player-tie-ins-gm-prep.html` + any Session 1 canon.
6. **Player story moves** — one small advance per PC that matches AP chapter; explicit “don’t do yet” list.
7. **Table risks** — nonlethal mandate, party weaknesses, Magaambya accountability sidebar, time sinks.
8. **Self-check quiz** — 3–4 questions.
9. **Ask the teacher** + links (session log, Book lesson, tie-ins, campus NPCs).
10. **After you run it** — reminder to update `sot-session-log.md` before Session N+1 prep.

## Estimating pace

| Signal | Implication |
|--------|-------------|
| Prior session spent most of the night on one social sandbox | Next: **1 dense day** or **1 social + 1 light**, not four |
| Combat + investigation + optional research | Count as a full evening alone if players dig |
| Timed 8-hour Cascade-style day | Can fill a session; don’t stack Emerald mail same night unless Cascade flies |
| Level-up ceremony / Severe fight | Prefer as session climax or dedicated night — not bolted after three RP days |
| Six players with strong RP | Add ~30–50% time vs “module as written” |

Always prefer **under-scheduling** with a stretch goal over a packed checklist that rushes relationships.

## Knowledge sources (don’t trust memory)

1. `reference/sot-session-log.md` — table truth.
2. `reference/sot-extracts/*.txt` — book text for the slice.
3. Relevant `lessons/0001`–`0006` book prep + `0009` tie-ins + `0008` party analysis.
4. Latest `transcripts/.../session-NN/edited.json` for tone and unfinished threads.
5. `RESOURCES.md` / Paizo GM Reference thread for author intent when pacing is ambiguous.

## After the session

Update the session log:

- Mark Perquisite / chapter checklist rows.
- **Covered / Not covered / seeds planted**.
- Revise the pace model with actuals.
- Note any player-invented canon that overrides tie-in plans.

Then draft Session N+1 from the new bookmark.
