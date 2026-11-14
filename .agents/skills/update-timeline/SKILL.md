---
name: update-timeline
description: Updates the player-facing campaign timeline in data/timeline.json after a cleaned session transcript — reveals beats the table played, edits beats that drifted, adds or reorders beats, cascades projected session numbers, and strips spoilers from revealed prose. Use immediately after /clean-game-transcript, or when the GM says the timeline is behind play.
disable-model-invocation: true
---

# Update Timeline

Bring `data/timeline.json` (the **Timeline** campaign tool at `/timeline`) into line with what the table
actually played. Run this immediately after `/clean-game-transcript` on the same session, while the
editorial decisions are still in context.

The transcript answers *what happened*. This skill decides what that means for the beats.

**The point of this skill is that the file ends up matching the table.** The GM can already click
Reveal; running the skill means every played session is reconciled — revealed rows rewritten to what
happened, unplayed rows moved forward, early-played rows pulled back to the night they happened, and
overflow given rows. Do not hand those decisions back as "flags for the GM". Fix them, then report what
you did. The only thing left for the GM is a whole-tail pacing shift, and even that comes with your
recommendation.

## Read first

| Source | Why |
|---|---|
| `CONTEXT.md` § Timeline / Beat / Reveal | Vocabulary and the reveal contract. Use these words. |
| `docs/adr/0003-timeline-json-canonical.md` | Why JSON is canonical and how it is edited. |
| `data/timeline.json` | The rows you are changing. |
| `transcripts/<campaign>/session-NN/edited.json` | Normally already in context. Skim it; do not re-clean it. |
| `reference/sot-session-log.md` | How prior sessions were logged; the last two sessions show the drift style. |
| `reference/sot-timeline.md` § Editing the JSON | Field contract and confidence markers. |

Read the session log and `sot-timeline.md` **only as needed** — the first run after a session usually
needs the pacing/confidence conventions, not a full reread.

## Non-negotiables

1. **Reveal means played.** Never reveal a beat the table did not reach, and never set `revealed: true`
   on anything whose `confidence` is not `played`. A partial session reveals only its played part.
2. **No spoilers, and no hints.** The timeline is player-facing. Once a beat is revealed, players read
   its description. Revealed prose states what happened, in past tense, and stops there: no "will
   matter later", no portents, no unresolved foreshadowing, no explanation of what an event meant in
   the AP, no naming of a mystery the table has not solved yet.
3. **No future-text leakage at rest.** Unrevealed beats may exist in the file but are never rendered to
   players, so their prose can be planning-forward. The moment a beat is about to be revealed, rewrite
   its description as history first.
4. **Reveal is a prefix, per lane.** Story beats and book headers share one scope; each hero's player
   beats form their own scope (`scopeFor()` in `src/domain/timeline.js`). The GM's Reveal/Hide buttons
   assume this. Do not create gaps — the whole point of editing the file directly instead of clicking
   the buttons is to reveal a *shallower* frontier than "everything above here".
5. **Array order is display order.** Sessions ascend, books ascend, book headers sit immediately before
   their first beat.
6. **`id` prefix tracks `session`.** `s<session>-lane-hero-slug`. Moving a beat renames its id, and
   `src/domain/timelineContent.test.js` fails if you forget.
7. **Work at the frontier.** Only the session(s) this run is revealing are in scope. Do not re-audit
   prose that was vetted at an earlier reveal.
8. **Every beat stands alone.** A beat is read as a single row on a timeline page, out of order, by a
   player who has not opened the transcript. It may not rely on another beat, a session log, or the
   reader's memory of the night to make sense. Name the people, say what the errand was, and gloss any
   unfamiliar thing the first time it appears in that description. See § Self-contained, not shorthand.
9. **Nothing stays scheduled in a played session.** When a run finishes, every row at or before the
   frontier session is revealed as played. A planned row the table did not reach — including an absent
   hero's — is **moved forward** to a later session, not left behind and not silently deleted. A planned
   row that was only partly played is **split**: the played part revealed, the unplayed core moved
   forward. `check-timeline.mjs` fails on any unrevealed row at or before the frontier.
10. **Played early means it moves back to the night it happened.** If the table played content that a
    *later* row schedules — an errand pulled forward, a debut that came early — that row moves to the
    session where it was played (renamed, revealed, rewritten), or is split if the table only got
    partway. The same content is never scheduled twice: once it is history, the forecast copy goes.
    Always search the whole unrevealed schedule for the places, NPCs, and errands the transcript
    touched, not just the rows numbered for this session.
11. **Revealed rows describe what was played, not what was planned.** The plan's details are not
    facts. If a planned detail did not happen (the bells were never rehung; Ot never asked who fixed
    the door), it comes out of the revealed text. If it still matters, it moves forward in its own row.

## Procedure

### 1. Establish the frontier

```bash
node .agents/skills/update-timeline/scripts/check-timeline.mjs
```

It reports the last revealed session, structural errors (prefix drift, gaps in a reveal lane, book
header placement, unknown hero slugs, revealed-without-`played`), and — for the newest revealed session
only — warnings for future-facing wording. Run it before and after your edits.

If this run is catching up several sessions at once, scope the prose check to all of them:

```bash
node .agents/skills/update-timeline/scripts/check-timeline.mjs --since 7
```

Then read the transcript and write down, in order:

- **What the session actually covered**, as beats — including what it *did not* finish.
- **Every hero's own moment**, if any. Player beats are sparse by design; absence is normal, not a gap
  to fill by inventing scenes. Do not write a player beat for a hero who was absent or passive.
- **Anything the table invented** that contradicts a planned beat. The table wins (see
  `reference/sot-timeline.md` § Drift rules).

Then build a **reconciliation ledger** before editing anything. It has one line for every row
scheduled for the session, every later row whose content the transcript touched (search titles and
descriptions for the places, NPCs, and errands), and every played scene that has no row. Each line gets
exactly one outcome:

| Outcome | What you do |
|---|---|
| Played as planned | Reveal; rewrite as history (§ 2) |
| Played differently | Reveal; rewrite to what happened, dropping planned details that did not occur (§ 2) |
| Partly played | Split: reveal the played part, move the unplayed core forward (§ 2, § 3) |
| Not reached | Move forward (§ 3) — never left in a played session |
| Played early | Pull the later row back to this session; split if partial (§ 3) |
| Superseded | The table made it moot (merged into another row, or contradicted). Delete the unrevealed row and say why |
| Played, no row | Add a row (§ 4) |

No row in scope may be left without an outcome. Do not stop at "this needs the GM's call": the ledger
is your call, and the report is where the GM checks it.

### 2. Reveal what happened

For each scheduled beat the session delivered: set `confidence: "played"` and `revealed: true`.
Then rewrite its `description` as **history**, because the planned text was written as a forecast.

- Keep the beat's `id`, `book`, `session`, `source` (story beats only) and position.
- Past tense, concrete, table-specific. Name what the cohort did and how, not what it was supposed to
  demonstrate.
- **Self-contained.** Name the people, say what the errand was, and gloss anything unfamiliar on first
  mention in that description — the row is read on its own, not in transcript order (§ 5b).
- Preserve the tone of the surrounding revealed prose — dry, observational, occasionally wry. Read three
  neighbouring revealed beats and match them.
- Use spoken names, not full ones (`.cursor/rules/spoken-names.mdc`). Keep initialisms like `MODU`
  capitalised.
- If the session only *partly* delivered a beat, **split it**: reveal a beat that describes the played
  part, and leave the remainder scheduled ahead with its own title and description. The stump-library
  errand in sessions 7–8 is the worked example of this.

### 3. Edit beats that drifted

The plan is a forecast; the table is the fact. When the session reordered, merged, or skipped content:

- **Not reached → moved forward** (the default for anything unplayed). Renumber `session` and the `id`
  prefix, and move the row to its new place in the array. See *Choosing where a beat lands* below.
- **Played early → pulled back.** Move the later row to the session where it was played, rename it,
  reveal it, rewrite it. If the table only got partway, split it: the played part comes back, a row for
  the remainder stays ahead (usually the very next session).
- **Superseded** — delete the unrevealed row and say why. Deleting a revealed row would erase history;
  only delete unrevealed rows. When you remove a beat, check `reference/sot-player-arcs.md`
  § Dependency contract for a player beat that needed it.
- **Merged** — fold two beats into one row and say both things in the description.
- **Rewritten** — when the table's version is better than the plan's. Say so in your summary.

#### Choosing where a beat lands

Moving a beat forward is a scheduling decision, so make it like a GM would, not like a sort routine:

- **Dependency first.** The beat needs its stage: the NPC on screen, the place visited, the errand
  running (`reference/sot-player-arcs.md` § Dependency contract). Land it in the first later session
  whose story beat provides that, not merely the next session number.
- **Keep setups ahead of payoffs.** If the moved beat primes another planned beat (a teacher's hint that
  makes a hero notice a slip later), it must still land before or with that beat, never after.
- **The hero must be able to be there.** An absent hero's beat moves to the next session they can
  attend; never write it as if they were present for the night they missed.
- **Do not stack.** Player beats are sparse. Avoid putting more than two beats for one hero in one
  session, and spread a session's player beats across heroes when you have a choice.
- **Shed what play overtook.** Details the table contradicted (an item now in another hero's hands, a
  question an NPC already answered) are dropped from the moved row, not carried forward.
- When the move changes when a player beat lands, update its window in the dependency contract.

### 4. Add what the plan missed

Beats the table created that no row predicted go in the right position:

- Session number = the session it happened in, and the `id` prefix must match.
- Lane: `story` for cohort-level events, `player` for one hero's moment with that hero's `heroSlug`.
  Never invent a `player` beat from a heroic-sounding description of a shared scene.
- Insert *after* the session's story beat and before the next session's rows; within a session, follow
  the zones already in the file (story first, then player beats).
- `confidence: "played"`, `revealed: true`, description as history.

### 5. Scrub the prose you are revealing

Scrub **only the beats this run touches** — the ones you just wrote or are about to reveal. Do not
re-audit beats revealed in earlier sessions: their prose was vetted when they were revealed, and a
campaign this long would otherwise re-check the same rows forever. The one exception is a specific
earlier beat that this session's play has made *newly* wrong (the session contradicted it); fix that row
and say so.

For each beat in scope, delete:

- Forward pointers ("this will matter", "the first hint", "not yet", "years later", "the payoff").
- Explanations of a mystery the table has not solved in play, even when the AP states it plainly. If a
  description says who someone really is, what is really in the vault, or where a rumour leads, and the
  session has not established it at the table, cut that clause.
- Metaphors that function as forecasts — "the debt that had been following her", "the shape of what is
  coming". Past tense alone is not enough; the sentence must not promise anything.
- Any reference to books, chapters, or beats that have not been played. Book headers may describe the
  book they head, but only in terms of the year the cohort is in, not its arc.

The test that matters: **would this sentence give a player something to expect?** You are writing
tonight's history for an audience that has just lived it. Anything they did not learn at the table stays
out, and anything that hints at where it leads stays out.

Check the session log for what the table has *not* yet learned; anything the new prose volunteers about
those things is a spoiler.

Player beats for an inactive hero stay revealed as history and are otherwise untouched — see
`CONTEXT.md` § Active hero.

### 5b. Self-contained, not shorthand

A revealed beat is rendered as one row in a list. Readers arrive at it from a search, from a bookmark,
or by scrolling past forty other rows. They have not read the transcript, they have not read the row
above, and if they are catching up weeks later they have not got the night in their head either. Write
each description so it survives being read alone.

The failure mode is **shorthand**: a sentence that is true and even evocative but leans on context that
lives somewhere else. It reads fine to the person who just ran the session, which is exactly why it
survives review.

| Shorthand | Why it fails | Self-contained |
|---|---|---|
| "Taraan had a use for him right now, so making the trip worthwhile was in his own best interest." | Which trip? Which use? Nothing in the row says. | "On the walk to the market, Yggostrus explained why he was helping: Taraan had a use for him, so it was in his own best interest to make the trip worthwhile." |
| "Cy'An crammed Cascade twice and earned a star." | "Cram" and "star" are table jargon the row never defines. | "Cy'An crammed Cascade Bearers twice in one night — two Study rolls instead of one — and finished with a point in the branch and a second banked against the cap." |
| "The eidolon earns its keep." | Assumes the reader knows what an eidolon is here. | "Anya did not need the eidolon for this one." + name what she did instead. |
| "Erudite maps the tunnels." | Who is Erudite? | "Taraan sent Erudite, his familiar, down overnight to map the tunnels under the barn and the dorm." |

What that means in practice:

- **Introduce, don't assume.** First appearance of a person, place, or thing in a description gets a
  four-to-eight-word gloss in apposition: "Haibram, the Rain-Scribe candidate with the paper-winged
  contraption"; "scrits — gremlins with permanently ink-stained hands that ruin books". _Subsequent_
  mentions in the same description can use the bare name.
- **Name the errand, not the label.** "The Rain-Scribe errand was five rare Ojofiri chicks from the
  Kafesi Market" beats "day one of the Perquisite". If a description says "the fight" or "the trip" or
  "the ritual", the same description must already have said which one.
- **Gloss the mechanic in fiction.** Branch points, Stars, Study, Cram, hero points, and Perquisite
  beads are real things at this table and fine to mention — but say what they meant in the scene
  ("a second banked against the cap", "two Study rolls instead of one", "one of the beads the school
  gives for work done") rather than dropping the keyword bare. `.cursor/rules/spoken-names.mdc` already
  covers initialisms like `MODU`.
- **Pronouns need an antecedent in the row.** If a paragraph opens "She forgave him personally", the
  sentence before it has to have said who she and he are.
- **No cross-references.** Not "the omen from session two", not "the tunnel business", not "as
  before". If the fact matters, restate it in a clause.

The test: **hand the row to someone who was not at the table, with no other row visible, and see
whether they can say what happened and who it happened to.** If they have to ask a question, the row
is not finished. This is separate from, and additional to, the spoiler scrub below — a sentence can be
perfectly non-foreshadowing and still be unreadable in isolation.

Do not let this push descriptions past three or four sentences. Self-contained is not exhaustive:
gloss what a stranger needs, cut what only the table would care about.

### 6. Cascade the schedule

If the session ran long (one planned session of content bled into two) or ran short, the whole projected
tail moves. Do not renumber by hand:

```bash
# preview, then repeat with --write
node .agents/skills/update-timeline/scripts/shift-sessions.mjs \
  --from s10-story-study-block --delta 1
```

It shifts every beat from that id onward by whole sessions and renames the id prefixes. It refuses a
shift that would reorder the timeline or duplicate an id, so a move that collides with a row staying
put has to be an explicit edit. Book headers stay put.

Moving the tail is a **pacing** decision, so make it deliberately and say what you moved. Do not churn
the projection if the drift is within the confidence band (`projected` is ±2 in Book 1, ±4 by Book 6).
Prefer to re-plan the *next two or three* sessions (set them `firm`) and leave the far tail alone.

Re-planning the near sessions is not optional after a session that ran long or pulled content forward:
the next two sessions must read as a plausible night each, with the moved beats placed per *Choosing
where a beat lands*. If pulling content forward leaves a session with no story beat and the drift is
within the band, leave the tail and say in the report which shift you recommend and when to make it.

### 7. Verify

```bash
node .agents/skills/update-timeline/scripts/check-timeline.mjs
npx vitest run src/domain/timelineContent.test.js
```

Both must be clean of errors — including the stale-row check, which fails on any unrevealed row at or
before the frontier. Warnings from the checker are review prompts, not failures: reread the
flagged sentence and decide. Ordinary future tense about a recurring weekly thing ("each Study day
will…") is not a spoiler.

`timelineContent.test.js` checks every row rather than the frontier, because it is a cheap regex guard
on the committed file. If it flags an old row you did not touch, leave the row alone and say so in the
report — do not reopen settled prose to satisfy a heuristic.

Then read the timeline as a player: `http://localhost:9000/#/timeline?gmMode=false` on the dev server,
if the GM has it running (never start, stop, or probe it yourself — `.cursor/rules/no-dev-server.mdc`;
read the revealed rows out of the JSON instead).
That is the actual acceptance test — the revealed list should read as history, with nothing in it
pointing forward. Read it stitched or not, but at least once as a stranger: pick rows at random and
check they make sense with their neighbours out of view (§ 5b).

Then update the prose docs that quote session facts. This is part of the run, not a follow-up to offer:

- `reference/sot-session-log.md` — the session's entry, plus the pace model if this session was a new
  calibration point.
- `reference/sot-timeline.md` § Pacing model § Observed / § Played so far — when the frontier moved.
- `reference/sot-player-arcs.md` § Status — when a player beat landed or slipped.

Leave `src/pages/TimelinePage.vue`, `src/domain/timeline.js` and the dev API alone; this skill only
edits data.

## Writing a revealed description

Revealed prose is the campaign's public record of a night's play. Aim for one to three sentences that
would still make sense to a player who was not at the table.

| Weak | Reason | Better |
|---|---|---|
| "The cohort visits the stump library, foreshadowing Ot's real motive." | Spoiler + author's note | "Ot sends the cohort to a half-built library in a hollow stump. Scrits have been eating the books." |
| "They will finish the stump next time." | Forecast | (leave unfinished work to the unrevealed beat ahead) |
| "Cy'An repairs a hinge, showing they need to be needed." | Thesis in the text | "Cy'An fixes a hinge Ot noticed. They offer it as help, not proof." |
| "Ot notices later and asks who did it." (planned; Ot only tested the door) | Planned detail stated as fact | "Afterward Ot tested the door, jiggled it, and said, “I will take that.”" |
| "Solanum gets a Tempest-Sun success." | Mechanics, not story | "Solanum finds the reading nook and turns a failed Study into a research project." |
| "Yggostrus explains why he is helping on the trip." | Shorthand — no antecedent for the trip (§ 5b) | "On the walk to the market, Yggostrus explained why he was helping: Taraan had a use for him, so it was in his own best interest to make the trip worthwhile." |

Past tense, third person, no second-person address, no dice rolls or DCs unless the number itself is the
story. Confidence, page refs, and reveal state carry the mechanics; the description carries the fiction.

## Report

Close with a short summary the GM can check at a glance:

- Session number and what it covered in one line.
- **Revealed** — ids, one per line.
- **Edited** — ids, and what changed.
- **Added** — ids, and why the plan missed them.
- **Pulled back** — later rows the table played early: old id → new id.
- **Moved forward** — unplayed rows: old id → new id, and why that session (its stage, its order).
- **Superseded** — deleted unrevealed rows, and what made them moot.
- **Tail** — how far it shifted, or why it did not and what shift you recommend.
- **Carried over** — any earlier row you had to fix because this session contradicted it, quoted.
- **Left alone** — an old row a regex flagged that you deliberately did not reopen.
- **Self-contained** — any row that read fine in context but needed a gloss to stand alone, quoted
  before/after.

Do not commit. The GM reviews the diff and publishes by committing `data/timeline.json`.
