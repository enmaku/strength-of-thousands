# Strength of Thousands — Campaign App

Companion web app for a Pathfinder 2e Strength of Thousands table. Glossary for product and domain terms used by campaign tools in this repo.

## Language

**GM mode**:
The app experience when run on `localhost` or `127.0.0.1` (any port) via the Quasar dev server. The GM is the sole editor of campaign state; the app is an internal table utility, not a public-facing product. The GM can edit relationship dispositions and study progress; state persists as JSON in the repo. The index page shows GM prep lessons and campaign tools.
_Avoid_: Admin mode, dev mode

**Player mode**:
The app experience when run from a deployed build (e.g. GitHub Pages). Campaign state is read-only; players see whatever the GM has committed and published. The same party views as GM mode — Relationships tabs, Heroes grid, and all tile content — without edit controls (no disposition or study editing). The index page shows campaign tools only; GM prep lesson links are hidden.
_Avoid_: Production mode, viewer mode

**Hero**:
The player character at the table — the in-fiction Magaambya student whose name appears in hero tiles, Relationship tabs, and JSON filenames. Each hero has their own relationship state toward every Spire student. One human player usually maps to one hero, but the app keys off the hero, not the person's real-world name.
_Avoid_: Player (when meaning the hero), PC, character

**Player**:
The human at the table. Distinguished from **Hero** — tabs and filenames use hero names, not player names.
_Avoid_: Using "player" in UI labels where you mean the hero

**Spire student**:
One of the peer NPCs in the Spire Dorm cohort — classmates heroes befriend during the adventure. The relationship tracker shows a fixed roster drawn from shared reference data; v1 includes the nine students in the portrait manifest. The roster is designed to be extended later (e.g. Goss, Mazta, Savana) without restructuring per-hero state.
_Avoid_: Classmate (acceptable in prose, but prefer Spire student in tool UI), NPC

**Disposition**:
How friendly a given hero is with a given Spire student, expressed as 0–5 hearts. Intentionally fuzzier than the rulebook's attitude tiers; the GM sets it by clicking hearts in GM mode. **1 heart** is the default for new heroes — even as strangers, Spire students share the Magaambya and start from a baseline of mutual goodwill. **0 hearts** means active dislike; reaching it takes deliberate in-fiction friction. Each click writes immediately to the hero file; publishing to players is a separate git commit/push.
_Avoid_: Attitude, relationship level, rating

**Classroom Advantage**:
A Spire student's Study/Cram benefit when befriended — e.g. Anchor Root lets Rain-Scribe crit failures count as failures. Unlocks at disposition 3+ (Liked). Tooltip shows full mechanical text from the catalog.
_Avoid_: Study bonus

**Uncommon rules**:
A spell, item, or other rules element a hero gains access to after befriending a Spire student (the book calls these Specialty Items). Unlocks at disposition 5 (Helpful). Tooltip shows the item/spell name and full mechanical text from the catalog.
_Avoid_: Specialty item

**Archives of Nethys**:
The table's rules reference for Pathfinder 2e content — [2e.aonprd.com](https://2e.aonprd.com/). Use when catalog entries need accurate 2e rules text for uncommon rules items and similar.
_Avoid_: AoN (fine in informal notes)

**Relationship tracker**:
A campaign tool showing one tab per hero. Each tab displays a tile grid of all Spire students with portrait, name, disposition hearts, and unlock indicators for Classroom Advantage and uncommon rules. Locked indicators appear muted; unlocked indicators are highlighted. Tooltips always show the full benefit text, even when locked. In GM mode the GM can edit dispositions only; in player mode the same view is read-only. Does not add heroes — roster comes from the **hero roster**.

**Study tracker**:
A campaign tool listing all heroes alphabetically on one screen. Each hero shows primary and secondary **branch** choice, **branch level** progress (0–20 with a **cap marker**), and gained branch benefits. In GM mode the GM sets branches, adjusts levels with +/−, can mark **starred branch** (banked Study success at cap), and toggle **uncapped branch** for Book 6. Players see read-only progress once branches are configured; unconfigured heroes show a muted placeholder. Branch rules text comes from the **branch catalog**; institutional Magaambya rank is out of scope.
_Avoid_: Academia page, rank tracker (when meaning institutional rank)

**Branch level**:
Progress in a primary or secondary branch (0–20), separate from character level. Primary cap equals character level unless uncapped; secondary cap equals half character level (floor). Advanced via Study/Cram in play; the app records current level only.
_Avoid_: Institutional rank, character level

**Primary branch** / **Secondary branch**:
Each hero’s two Magaambya branches of scholarship. Must differ. GM sets both on the Study page; stored in hero JSON. Levels tracked independently.
_Avoid_: Spire student branch (display-only on relationship tiles)

**Cap marker**:
Visual tick on the 0–20 progress bar at the current maximum branch level (character level for primary, half level for secondary, or 20 when uncapped).

**Starred branch**:
A ★ shown when a Study success would exceed cap — banked until character level rises, then applied automatically to the new cap.

**Uncapped branch**:
GM toggle per branch for Book 6 Endless Table — cap treated as 20 regardless of character level.

**Branch catalog**:
Shared reference data in `data/magaambya-branches.json` — branch names, badge images, branch-specific feats, and benefit tooltip text.

**Spire student catalog**:
Shared reference data for every Spire student on the roster — slug, display name, portrait, branch, Classroom Advantage description, and uncommon rules description. Hero files reference students by slug only. v1 covers the nine students in the portrait manifest only. Extending the roster (e.g. Goss, Mazta, Savana) and backfilling new students into existing heroes is a separate future effort.
_Avoid_: Student manifest, NPC list

**Hero bio**:
A short prose sketch of a hero for the Heroes page — who they are, why they came to the Magaambya, and what table play has already established. Written by the GM from session transcripts and table canon; not derived from mechanical sheet data.
_Avoid_: Stat block, character sheet summary, PathBuilder blurb

**Hero tagline**:
One muted identity line under the hero's name on a **hero tile** (ancestry/class/background/pronouns). Editorial copy in the hero file, not computed from a sheet export.
_Avoid_: Class line, build summary

**Hero file**:
Per-hero JSON storing display name, **hero tagline**, **hero bio**, disposition hearts keyed by Spire student slug, and optional study progress. May still carry a legacy PathBuilder `build` blob for other tools (e.g. study level); that blob is not the Heroes-page source of truth. The **slug** (filename key) is stable. Player mode reads committed JSON only.
_Avoid_: Treating PathBuilder as the live identity source for the Heroes page

**Hero roster**:
The set of heroes at the table. Each hero has one hero file, listed in `heroes/index.json`. The GM hand-edits JSON to add or remove heroes. An empty roster shows a setup prompt (GM mode) or a "no heroes yet" message (player mode). On the Heroes page, all heroes appear at once in a single responsive grid sorted alphabetically by display name.
_Avoid_: Import-only roster

**Heroes page**:
A **player-facing** campaign tool showing **all heroes at once** — no per-hero tabs. Each **hero tile** shows name, tagline, and bio so the table can remember who everyone is. Read-only in both modes; bios are edited in hero JSON and published via git.
_Avoid_: GM-only tool, character sheet, PathBuilder sync UI, combat reference grid

**Hero tile**:
One hero's compact card on the Heroes page — display name, **hero tagline**, and **hero bio**. Warm parchment surface; identical in player and GM mode.
_Avoid_: Full character sheet, portrait, combat snapshot stats, PathBuilder-derived vitals

**Campaign tool**:
A feature in the campaign app for table use during play (e.g. relationship tracker, Heroes page, Rules tab). Player-facing unless noted otherwise — published state is read-only for players; GM mode on localhost adds edit controls where applicable. Each tool has its own route; the index page links to them under a campaign tools section.
_Avoid_: Module, widget, GM-only page

**Player rules handout**:
A standalone HTML document under `lessons/` that teaches a Magaambya / table subsystem to players (e.g. academia downtime, branch implements, campus crafting). Spoiler-free and mechanics-first. Loaded in an iframe on the **Rules** tab when listed in the published catalog. Recipe: `reference/sot-player-rules-guide.md`. Exemplars: `lessons/0007-academia-downtime-gm-prep.html`, `lessons/0013-branch-implements-gm-prep.html`, `lessons/0014-campus-crafting.html`.
_Avoid_: GM prep lesson, session prep, treating `-gm-prep` in the filename as audience

**Rules tab**:
Campaign tool at `/rules` listing **published** player rules handouts (sidebar on desktop, dropdown on mobile). Selecting an entry loads that HTML in the main panel. Catalog: `src/domain/playerRules.js`.
_Avoid_: GM prep menu, Study page

**Published player rules**:
The explicit allow-list of handouts shown on the Rules tab (`getPublishedPlayerRules()`). Adding a file under `lessons/` does not publish it until it is registered here (and optionally mirrored under GM prep → Rules in `gmLessons.js`).
_Avoid_: “All HTML in lessons/”