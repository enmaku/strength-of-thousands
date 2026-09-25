# Player rules handouts — how to write the next one

Repeatable recipe for **player-facing rules HTML** under `lessons/`. Exemplars: `0007-academia-downtime-gm-prep.html`, `0013-branch-implements-gm-prep.html`, `0014-campus-crafting.html`, `0015-spirit-masks.html`.

These are **not** GM prep. They ship to players on the app’s **Rules** tab. Spoiler-free, mechanics-first, and safe to open mid-session.

## What a rules handout is

One self-contained HTML page that teaches a Magaambya / table subsystem the players need to operate (academia downtime, branch implements, and similar). It answers:

1. What is this subsystem, in one claim?
2. What do I do at the table (choices, checks, costs)?
3. Where do I look up the long tables when I need them?
4. Can I prove I understood the rules (self-check)?
5. Optional: how do I track this in Pathbuilder?

It does **not** answer GM pacing, book spoilers, “how to run this,” or which session to schedule it.

## Publishing (app wiring)

A handout is only player-visible when listed in **both** places that matter for discovery:

| Surface | File | Role |
|---------|------|------|
| **Rules tab** (players + GM) | `src/domain/playerRules.js` → `getPublishedPlayerRules()` | Canonical **published** list. Sidebar / mobile dropdown + iframe load. |
| GM prep → Rules | `src/domain/gmLessons.js` → section `id: 'rules'` | Convenience open-in-new-tab for the GM. Same HTML files. |

Static HTML is served from `/lessons` in dev and copied into `dist` by `scripts/copy-teaching-assets.mjs`. The Rules page iframes the `href` as-is — keep documents standalone (own CSS + any quiz JS).

Filename may still end in `-gm-prep.html` for historical numbering; treat that as an accident of path, not audience. New files can use a clearer name if you prefer; keep numbering unique under `lessons/`.

## Filename, title, menu copy

- **Title (`<title>` + `<h1>`):** short player name — e.g. `Academia downtime`, `Branch implements`.
- **Header pitch:** one sentence under the h1 (what it is / when you use it). No “Lesson —” kicker, no “GM prep” framing.
- **Published caption** (`playerRules.js`): terse scope, e.g. `Study, Cram & Practical Research`.
- **GM menu caption** (`gmLessons.js`): `Player rules · …` so it stays distinct from Sessions / Books.

## Visual / CSS contract

Copy styles from an exemplar — do not invent a new palette. Shared conventions:

- Parchment page vars (`--bg`, `--ink`, `--green`, `--gold`, …), serif body, sans for UI chrome.
- Gradient header; `main` max-width ~46rem.
- `.callout` for the overview thesis (and rare mid-page emphasis).
- Tables for reference ladders; `.branch-card` when per-branch blocks help.
- `nav.toc` strip under the header (in-page anchors only).
- Quiz card styles + `.quiz-summary` / `.quiz-reset` as in exemplars.
- Collapsible Pathbuilder block: `details.pathbuilder` (same CSS as exemplars).

## Required sections (in order)

1. **Header** — h1 + one-line pitch.
2. **TOC** — `nav.toc` links to every major section, including Pathbuilder (if present) and Self-check. Pathbuilder **before** Self-check in the TOC and body.
3. **Overview** — short `.callout` thesis + a paragraph of orientation. Cite AoN / book pages in `.cite` when useful.
4. **Mechanical body** — only what players need. Group by verb or object (“Study”, “Casting and charges”), not by “GM notes.” Reference tables are fine; say when a section is lookup-only.
5. **Pathbuilder** (optional but preferred when sheet tracking is non-obvious) — collapsed `<details class="pathbuilder">` **above** the quiz.
6. **Self-check** — conceptual quiz (see below).
7. **Footer** — one muted line naming the table rules topic. No link farms.

Baseline PF2e that the subsystem sits on top of: **short paragraph + AoN cite**, not an encyclopedia of Earn Income / Craft / etc. Point out that academia (or similar) is story-scheduled while normal downtime stays available.

## Voice and content rules

- Address **you** (the player / hero). Write for the table, not the GM binder.
- Keep **reference tables** (branch benefits, upgrade ladders, skill lists). Players look them up; they do not memorize them for the quiz.
- Prefer Magaambya / table house rules spelled out next to published staff / downtime rules, with AoN links for the published baseline.
- App chrome names: the relationship tool is **Social** in the nav (route may still be `/relationships`). Say “Social page,” not “Relationships page.”
- “Relationship tracker” is fine as the in-fiction / tool concept name.

## Links

| Allowed | Forbidden in the handout body/footer |
|---------|--------------------------------------|
| In-page `#anchors` | Other `lessons/*-gm-prep.html` (or any GM-only HTML) |
| Archives of Nethys (and similar public rules) | External GM blogs / prep dumps in the footer |
| This site’s **player** surfaces by UI name (Social, Study, Rules) | “Further reading” that is actually GM prep |

**External links** always use `target="_blank" rel="noopener noreferrer"` so the Rules iframe does not navigate away.

Cross-linking **another published player rules handout** is fine if both are in `playerRules.js`; exemplars currently stay self-contained.

## Self-check quiz

Match the implements / downtime quiz machinery (copy the `<script>` block and adapt labels).

**Design**

- About **10** multiple-choice questions.
- Test **concepts and procedures**, not table recall. Bad: “What general feat does Rain-Scribes get at branch 8?” Good: “Cram is available when a branch is…?”
- Each `.quiz` has `data-answer` and `data-section` (section id for the deep-link on a miss).
- One shot per question; wrong answers link to the relevant section; show score + reset; treat **8 / 10** as pass (same threshold as exemplars).

**Do not** quiz Pathbuilder steps.

## Pathbuilder appendix

Use when players will need sheet work beyond “tick a published option.”

- Collapsed by default (`<details>`).
- Numbered steps with Pathbuilder menu labels; note that labels drift by platform/version.
- Call out anything Pathbuilder **will not** enforce (house rules, always-preparable staves, Magaambya product-identity renames such as **Collegiate Attendant Dedication** for Magaambyan Attendant).
- Bonus feats / dedications: **Custom Feat Choices** (or equivalent) so branch gifts do not consume level-up feat slots.
- Counters and **unconditional** held bonuses: custom buffs; leave fiddly conditional riders as gear notes.
- Keep it shorter than the rules body — tooling only.

## Anti-patterns

- GM pacing, book-by-book schedules, spoiler boxes, “running it at the table”
- Opening with a long PF2e downtime/activity catalog
- Quiz questions that require memorizing benefit tables
- Linking GM prep lessons or GM-facing external notes from the player page
- Leaving Pathbuilder **below** the quiz or omitting it from the TOC
- External links that replace the iframe document (missing `target="_blank"`)
- Inventing morals or house rules that contradict Magaambya values / table canon already in `NOTES.md` and the thematic guide

## Checklist for a new handout

1. Write/adapt HTML from an exemplar; strip any GM-only residue.
2. Add TOC, overview callout, Pathbuilder (if needed) **above** quiz, modern self-check.
3. Audit every `href`: externals open in a new tab; no GM prep targets.
4. Register in `src/domain/playerRules.js` (published list) and, if useful for the GM, `gmLessons.js` Rules section.
5. Skim in the Rules tab iframe (`/#/rules`) on desktop and mobile.
6. Note the file under Standing prep / player rules in `NOTES.md` if it is campaign-standing content.
