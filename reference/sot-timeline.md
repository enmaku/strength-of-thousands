# Campaign timeline — pacing model and projection

Planning spine for Strength of Thousands. **Beat data now lives in [`data/timeline.json`](../data/timeline.json)** — every story beat, player beat, and book header, with its session number, page refs, confidence, and reveal flag. This document keeps the pacing model, drift rules, projections, and open items; the per-session beat tables moved to JSON. Spoilers throughout.

Companion docs:

- [`sot-player-arcs.md`](sot-player-arcs.md) — per-PC chords, the foreshadowing dependency contract, and each PC's "do not" list
- [`sot-session-log.md`](sot-session-log.md) — what the table actually did; the source of truth for "played"
- [`sot-campaign-overview.md`](sot-campaign-overview.md) — condensed overview
- [`sot-thematic-guide.html`](sot-thematic-guide.html) — themes and push moments
- `reference/sot-extracts/*.txt` — full book text; page refs are book page numbers

## How to use

1. Before writing a session prep, filter `data/timeline.json` for this session's beats. Note the beat, the level, and the player beats due (link through to `sot-player-arcs.md`).
2. Check the dependency contract in `sot-player-arcs.md` before cutting or reordering anything.
3. After play, update `sot-session-log.md`, then flip that beat's `revealed` to `true` in `data/timeline.json` (or use the Timeline page in GM mode) and set its `confidence` to `played`.
4. Treat session numbers past ~S20 as a pacing forecast, not a schedule. Beat **order** and the **gaps between a seed and its payoff** are load-bearing; absolute numbers are not.

### Editing the JSON

`data/timeline.json` is a plain array; **array order is display order**. One row per beat:

| Field | Meaning |
|---|---|
| `id` | Unique kebab string, e.g. `s13-story-first-masking` |
| `book` | 1–6 |
| `session` | Projected/actual session number, or `null` for a book header |
| `lane` | `story`, `player`, or `book` |
| `title` | Required |
| `description` | Optional prose. Player-visible on story/player beats; **GM-only on book headers** (they summarize a whole book and cannot be shown without spoiling its arc). Write it in past tense about what happened — no foreshadowing, no "this matters later", no references to future books or arcs |
| `source` | Optional page refs (`p46–48`); story beats only |
| `confidence` | `played`, `firm`, `projected`, or `optional` |
| `heroSlug` | Player beats only — a slug from `heroes/index.json` |
| `revealed` | The only visibility flag. Reveal == played |

Book headers appear once per book, immediately before that book's first beat. Player beats are sparse by design: not every hero has a beat in every session.

### Confidence markers

| Marker | Meaning |
|---|---|
| **played** | Already happened. Session number and content are table fact. |
| **firm** | Locked by the book; next 2–3 sessions already decided. Accurate within ±1. |
| **projected** | Beat order fixed by the book; session number is a pace estimate. ±2 in Book 1, widening to ±4 by Book 6. |
| **optional** | Skippable or reorderable (sandbox missions, side events). Cut if behind, expand if ahead. |

## The spine

Book-level metadata (not beat rows).

| Book | Sessions | Levels | Rank | Module pages |
|---|---|---|---|---|
| 1 — Kindled Magic | 1–18 | 1→4 | Initiate → Attendant | 100 |
| 2 — Spoken on the Song Wind | 19–36 | 4→8 | Attendant → Conversant → Lore-speaker | 100 |
| 3 — Hurricane's Howl | 37–54 | 8→12 | Lore-speaker (teacher) | 100 |
| 4 — Secrets of the Temple-City | 55–69 | 12→15 | Lore-speaker | 100 |
| 5 — Doorway to the Red Star | 70–87 | 15→18 | Lore-speaker | 100 |
| 6 — Shadows of the Ancients | 88–98 | 18→20 | Magic Warrior | 100 |

Levels above follow each module's **printed advancement track** (B1 end 4, B2 end 8, B3 end 12, B4 end 15, B5 end 18, B6 end 20).

## Pacing model

### Observed

| Session | Book / chapter | Content covered | Added to repo |
|---|---|---|---|
| 0 | — | Session zero: pitch, six characters, branches/ranks framing | Jun 2026 |
| 1 | B1 Ch1 | Arrival, Welcome Walk, Ot interview, dorm tour, Perquisite day 1 (Rain-Scribes) | Jul 2026 |
| 2 | B1 Ch1 | Day 2 (Tempest-Sun barn) + player-led tunnel/Uduak investigation | Aug 2026 |
| 3 | B1 Ch1 | Day 3 (Cascade oils, Umbo, fey-abeyance) + aftermath | Aug 2026 |
| 4 | B1 Ch1 | Bonding Meal + day 4 (Emerald mail, full sandbox) | Sep 2026 |
| 5 | B1 Ch1 | Day 5 (Uzunjati) + Introduction Ceremony ambush + interrogation | Oct 2026 |
| 6 | B1 Ch2 | One full Study block, implements, all four classmate favors, Cricket Theft | Oct 2026 |
| 7 | B1 Ch2 | Ot's reading list + the stump library — scrits, silverfish, B2–B6 searched; no debrief | Oct 2026 |
| 8 | B1 Ch2 | *Next:* finish the stump library, then Monochrome Murmurs | — |

### Calibration

- **Book 1 Chapter 1 — 20 module pages — took 5 sessions.** One Perquisite day per session, plus arrival, plus the ceremony. Hardest data point available; use as base rate.
- **One scene cluster per session.** A service day, a teacher errand, an investigation site, a dungeon level, or one social sandbox evening. Two small clusters fit only when neither is combat.
- **Combat is cheap; investigation is expensive.** Session 2 spent a night on a barn then most of the same night on player-driven tunnels. Session 4 spent a whole evening on mail delivery because the table talks.
- **A dungeon with a fight in it is two sessions (S7, reconfirmed).** The stump library was scoped as one night — eight rooms, a short scrit fight, five fixed books. Two combats plus five rooms of searching finished the building but not the errand: the last two rooms and the debrief went to S8. Plan **two nights for any site whose first room is a combat**; split exploration and fight rather than assuming the fight is a five-minute tax.
- **Ordered searching is cheap (S7).** B2–B6 took under an hour once the table agreed on numeric order. The combats were the cost, not the exploration.
- **~2 sessions per month observed** (Jun–Oct 2026: sessions 1–7). Used only for the rough calendar column.
- **Six RP-heavy players.** Add 30–50% against "module as written"; sandbox chapters compress less than expected because the table investigates.

### Cost constants

| Unit | Cost | Notes |
|---|---|---|
| Perquisite day / teacher errand | 1 session | Established by S1–S5 and the locked Ch 2 order. |
| Study downtime block | 1 session | S6 fit a full Study plus four favors — high-water mark for density. |
| Investigation site (multi-room building) | 1–2 sessions | Hababe, Oba Eze's lot, a manor floor. |
| Dungeon level / prison tier | 1–2 sessions | Bloodsalt, Vacant Eye, the Cathedral. Two if the first room is a fight (S7). |
| Social sandbox (Mzali influence, conversant missions) | 1 session per 2 NPCs or 1 mission | Compresses if the table stops probing. |
| Chapter finale combat | 1 session | Do not bolt onto a full RP night. |

### Acceleration levers

Projection lands at ~98 sessions (≈4 years at observed rate). Levers in order of return:

1. **Cut the conversant sandbox (B2 Ch2) to 5 missions** — saves 2 sessions. The chapter explicitly says to pick a subset.
2. **Run Book 5's nine faculty events across 2 sessions instead of 4** — saves 2. Explicitly order-free and skippable.
3. **Compress Book 4's Mzali influence to 4 NPCs / 3 rounds** — saves 2. The chapter is a favour-grind by design.
4. **Trim Book 3's savanna to one travel session** — saves 2. One encounter per day as written, reorderable.
5. **Do not** compress Book 1, B2 Ch1, or Book 6. Book 1 sets the cohort; B2 Ch1 sets the egg; Book 6 is the payoff everything was seeded for.

## Milestone index

Calendar and rank projections — not beat rows, so this stays here. Session numbers match `data/timeline.json`.

| Session | Milestone | Level | Rank | Calendar (approx.) |
|---|---|---|---|---|
| S5 | Introduction Ceremony survived | 2 | Initiate | Oct 2026 |
| S14 | First Masking; spirit masks | 3 | Attendant | Mar 2027 |
| S17 | Stone Ghost defeated | 4 | Attendant | Apr 2027 |
| S18 | **Book 1 ends** — griffons, anadi arrived | 4 | Attendant | Apr 2027 |
| S21 | Janatimo's investigations complete | 5 | Attendant | Jul 2027 |
| S24 | Conversant promotion ceremony | 6 | Conversant | Aug 2027 |
| S32 | Flooded manor briefing | 7 | Conversant | Nov 2027 |
| S36 | **Graduation at the name obelisk** | 8 | Lore-speaker | Feb 2028 |
| S40 | I'boko vanishes; Bloodsalt expedition | 9 | Lore-speaker | Apr 2028 |
| S49 | Prison of the Vacant Eye | 10 | Lore-speaker | Aug 2028 |
| S52 | Jula campaign opens | 11 | Lore-speaker | Oct 2028 |
| S54 | **Book 3 ends** — Ajbal Kimon falls | 12 | Lore-speaker | Nov 2028 |
| S60 | Audience with Walkena | 13 | Lore-speaker | Feb 2029 |
| S62 | Temple of Dajermube cleansed | 14 | Lore-speaker | Mar 2029 |
| S69 | **Book 4 ends** — Osibu saved; Jatembe located | 15 | Lore-speaker | Jul 2029 |
| S76 | Doorway plazas cleared; Iobane alliance | 16 | Lore-speaker | Sep 2029 |
| S79 | Hall of Reason relieved | 17 | Lore-speaker | Nov 2029 |
| S86 | **Jatembe freed.** Book 5 climax | 18 | Lore-speaker | Mar 2030 |
| S88 | **Magic Warrior renaming** | 18 | Magic Warrior | May 2030 |
| S92 | Egg shrinks the party; Koride confronted | 19 | Magic Warrior | Jul 2030 |
| S95 | Vesicant Egg claimed; restored | 20 | Magic Warrior | Sep 2030 |
| S98 | **Campaign ends** — Slana hatches | 20 | Magic Warrior | Oct 2030 |

## Played so far — what the backdated record buys us

Sessions 0–7 are played. S7 added Solanum's first kill and the skull bead; Taraan's Ird chord, Solanum's sky chord, Cy'An's provider wound, Yggostrus's Koride contact and Anya's eidolon premise are all already on stage. The only PC with nothing seeded is Anya (two straight absences), and the only relationship the tie-in doc promises but the table hasn't built is Yggostrus ↔ Koride.

Session 7 is a **partial** session: the stump library's first half ran and no player beats landed. Everything from Monochrome Murmurs onward slid one session; the five library player beats moved to S8 intact.

Per-session detail for those sessions lives in `data/timeline.json` and in [`sot-session-log.md`](sot-session-log.md). S7 is revealed through the stump's first half; its five player beats are still unrevealed on S8.

## Book structure

Chapter names, module page spans, and the ordering notes that are not beat rows. Rows for every session are in `data/timeline.json`.

| Book | Chapter | Pages |
|---|---|---|
| 1 | Ch 1 — Orientation | p8–30 |
| 1 | Ch 2 — First of Many | p31–45 |
| 1 | Ch 3 — Stone-Cast Shadows | p49–60 |
| 2 | Ch 1 — The Learned One Returns | p5–19 |
| 2 | Ch 2 — Service to the City (sandbox; ~7 of 10) | p23–53 |
| 2 | Ch 3 — The Flooded Mansion | p56–67 |
| 3 | Ch 1 — The Missing Student | p5–25 |
| 3 | Ch 2 — Vanished Villagers | p28–39 |
| 3 | Ch 3 — Prison of the Vacant Eye | p43–53 |
| 3 | Ch 4 — Jula's Plight | p55–69 |
| 4 | Ch 1 — Words for the Dead | p5–29 |
| 4 | Ch 2 — Raising the Sun | p32–43 |
| 4 | Ch 3 — Guardians of the Golden City | p49–62 |
| 5 | Ch 1 — Pranksters and Preparations | p5–34 |
| 5 | Ch 2 — Beyond the Door | p34–55 |
| 5 | Ch 3 — Thousands and Thousands | p57–69 |
| 6 | Ch 1 — Unshadowed Academy | p8–27 |
| 6 | Ch 2 — The Endless Table | p31–45 |
| 6 | Ch 3 — The Unborn King | p47–60 |

**Book 1 correction to carry forward:** the session log schedules two more Study blocks plus the four remaining errands — 8 nights for Ch 2 (S7–S14), because the stump library took two. Ch 2 is 17 module pages. If the table chafes, drop the second Study (S13) and fold First Masking into S13. That is the safest cut in the book: the masks matter more than the branch level.

**Book 2 sandbox cut list:** *Busker Woes, Oozing into Trouble, Trouble from the Skies, Saving Goana, Carving Trouble* are skippable unless a PC hook demands one. Cut them in `data/timeline.json` if they are never scheduled.

## Drift rules

### Running long

- **Cut Study blocks before errands.** Branch level is the cheapest thing to lose; NPC contact is not.
- **Cut optional sandbox missions** (B2 Ch2, B5 Ch1 events). Explicitly reorderable and skippable.
- **Never cut a chapter finale** or a session where a player beat is marked *owed* in [`sot-player-arcs.md`](sot-player-arcs.md).
- **Merge ceremony into aftermath** — level up at the end of the fight rather than a separate scene.

### Running short

- **Expand Spire Dorm and cohort life.** Every book after 1 has less of it, and it is the load-bearing theme for Book 6.
- **Add a Study block** with a branch-virtue conversation (see [thematic guide toolkit](sot-thematic-guide.html#toolkit)).
- **Use the unused conversant missions** (Busker Woes, Saving Goana, Carving Trouble) as PC-specific hooks.

### Player absent

- **Never replay the missed scene.** Two sentences of recap, then normal participation.
- **Never make the absence a scene.** Anya's two absences are handled at S7–S8, not litigated.
- **Move owed beats forward, not backward.** A beat can slip to the next session in the same window; it cannot be pulled earlier than its dependency.

### Table invents conflicting canon

The table wins. Revise [`sot-player-arcs.md`](sot-player-arcs.md), `lessons/0009-player-tie-ins-gm-prep.html`, and `data/timeline.json` together, then check the dependency contract for anything downstream.

## Known open items

- **Yggostrus ↔ Koride is unbuilt.** Fix at S10 at the latest; ideally a warm exchange at S7 or S8.
- **Yggostrus's druid mentor has no name** and no dossier in `sot-campus-npcs.html`. She is his most beloved relationship and currently only a pronoun.
- **Anya's arc is undeveloped.** No branch, no Study result, no implement, and two absences — so no accumulated table-time for the S13 First Masking to draw on. The bookkeeping is ten minutes; the real need is two ordinary nights where she is in scenes.
- **Solanum's branch debt** — Tempest-Sun 0 after a failed Study. Give her a success before First Masking, or the mask lands on a character who feels like a failure.
- **`sot-campaign-overview.md` advancement lists** still break Book 3 out as 9/10/11/12 without the Ch 2→Ch 3 ordering note. Cosmetic; this document and `data/timeline.json` are authoritative.
- **`heroes/*.json` bios lag** roughly to S4–S5 and predate the S6 branch picks. The session log is the freshest truth, not the hero files.

## Sources

- `reference/sot-extracts/*.txt` — six adventure texts: chapter synopses, advancement tracks, encounter headings, page refs
- [`data/timeline.json`](../data/timeline.json) — canonical beat rows (story, player, book headers)
- [`sot-session-log.md`](sot-session-log.md) — table truth through S6
- [`sot-player-arcs.md`](sot-player-arcs.md) — per-PC chords and the dependency contract
- `lessons/0001`–`0006` book preps; `lessons/0009` Player Tie-Ins; `lessons/0008` party analysis
- `transcripts/strength-of-thousands/session-00…06` (session 07 pending)
