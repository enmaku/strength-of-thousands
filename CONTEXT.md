# Strength of Thousands — Campaign App

Companion web app for a Pathfinder 2e Strength of Thousands table. Glossary for product and domain terms used by campaign tools in this repo.

## Language

**GM mode**:
The app experience when run on `localhost` or `127.0.0.1` (any port) via the Quasar dev server. The GM is the sole editor of campaign state; the app is an internal table utility, not a public-facing product. The GM can edit relationship dispositions and import or refresh heroes from PathBuilder; state persists as JSON in the repo. The index page shows GM prep lessons and campaign tools.
_Avoid_: Admin mode, dev mode

**Player mode**:
The app experience when run from a deployed build (e.g. GitHub Pages). Campaign state is read-only; players see whatever the GM has committed and published. The same party views as GM mode — Relationships tabs, Heroes grid, and all tile content — without edit controls (no disposition editing, no hero import/update). The index page shows campaign tools only; GM prep lesson links are hidden.
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
How friendly a given hero is with a given Spire student, expressed as 0–5 hearts. Intentionally fuzzier than the rulebook's attitude tiers; the GM sets it by clicking hearts in GM mode. **1 heart** is the default for newly imported heroes — even as strangers, Spire students share the Magaambya and start from a baseline of mutual goodwill. **0 hearts** means active dislike; reaching it takes deliberate in-fiction friction. Each click writes immediately to the hero file; publishing to players is a separate git commit/push.
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
A campaign tool showing one tab per hero. Each tab displays a tile grid of all Spire students with portrait, name, disposition hearts, and unlock indicators for Classroom Advantage and uncommon rules. Locked indicators appear muted; unlocked indicators are highlighted. Tooltips always show the full benefit text, even when locked. In GM mode the GM can edit dispositions only; in player mode the same view is read-only. Does not add heroes — roster comes from the Heroes page via **PathBuilder import**.

**Spire student catalog**:
Shared reference data for every Spire student on the roster — slug, display name, portrait, branch, Classroom Advantage description, and uncommon rules description. Hero files reference students by slug only. v1 covers the nine students in the portrait manifest only. Extending the roster (e.g. Goss, Mazta, Savana) and backfilling new students into existing heroes is **out of scope** for the Heroes import project — a separate future effort.
_Avoid_: Student manifest, NPC list

**PathBuilder**:
The table's external character builder ([pathbuilder2e.com](https://pathbuilder2e.com/)). PathBuilder is the sole source of truth for hero identity and mechanical stats; the app imports from PathBuilder JSON export and does not support manual stat entry or other character sources.
_Avoid_: PC sheet app, character manager

**PathBuilder import**:
How heroes enter and refresh in the app — owned entirely by the Heroes page. In GM mode the GM provides a PathBuilder character URL or numeric id on add; the app fetches JSON from PathBuilder and stores the character id on the hero file. **Update** always re-fetches from that stored id — no re-paste dialog. On add, the hero file is created with **1 heart** toward every Spire student on the current v1 roster (nine students). Import rejects a PathBuilder id already present in the roster — use **Update** on that hero's tile instead. On update, the stored `build` blob refreshes from PathBuilder but existing relationship hearts are preserved (merge, never overwrite). Adds and updates are infrequent; brief PathBuilder outages are acceptable — the GM retries later. If a stored id must change, the GM edits the hero file by hand. Backfilling hearts when the catalog grows later is out of scope here.
_Avoid_: Sync, upload

**Hero file**:
Per-hero JSON storing the hero's display name, PathBuilder character id, the full PathBuilder **`build`** export object, and disposition hearts keyed by Spire student slug. Reference-card fields are **derived at runtime** from the stored `build` blob — not persisted separately — so future tools can use the same source data without re-importing. Player mode reads committed JSON only; no live PathBuilder fetch. The **slug** (filename key) is set on first import from the character name and never changes on update — even if the PathBuilder name changes, only `displayName` refreshes. Tooltip copy and unlock logic come from the catalog, not the hero file. Dispositions persist for the full campaign; nothing resets between books.

**Hero roster**:
The set of heroes at the table. Each hero has one hero file, created only via **PathBuilder import** on the Heroes page. Append-only in v1 — no in-app remove; the GM hand-edits JSON if a file must go. v1 ships with an empty roster after removing placeholder test heroes; real PCs are imported via Heroes. An empty roster shows a prompt to import a hero (GM mode) or a "no heroes yet" message (player mode). On the Heroes page, all heroes appear at once in a single grid, sorted alphabetically by display name.

**Heroes page**:
A **player-facing** campaign tool (not GM-only) showing **all heroes at once** on one screen — no per-hero tabs. Layout mimics a common GM PC reference sheet, but the audience is the whole table: players use it to see party identity and key stats at a glance, same as the GM. Each hero is a compact tile in a responsive grid (same general pattern as Spire student tiles on the Relationship tracker, but showing PC reference stats instead of disposition hearts). Follows the same mode split as other campaign tools: **player mode** shows the full grid read-only; **GM mode** adds **Add hero** (PathBuilder import) and per-tile **Update** (re-fetch). Tiles surface identity and the most important combat numbers without full character-sheet depth; field set is expandable later.
_Avoid_: GM-only tool, character sheet, per-hero tabs, stat block editor

**Hero tile**:
One hero's compact reference card within the Heroes page grid — identical content in player mode and GM mode; only import/update controls differ. Derived at runtime from the stored PathBuilder `build` blob. Header shows identity (name, level, ancestry, alignment) and a slash-separated **class line** (see below). Body shows PF2e combat snapshot stats: six ability modifiers, Fort/Ref/Will, AC, HP, speed, passive Perception, primary attack, spell attack and spell DC (primary class; blank if non-caster), equipment proficiency checkboxes, languages and lores. Reference-sheet density so the whole party is scannable on one screen.
_Avoid_: Full character sheet, portrait tile (unless added later), passive Insight, GM-only content

**Class line**:
Slash-separated identity on a hero tile (e.g. `Cleric / Witch / Winged Warrior`). Built from PathBuilder export in order: (1) `build.class`, (2) `build.dualClass` when set (dual-class variant — full second class), (3) every **archetype** from an Archetype Feat whose name ends with ` Dedication` — strip that suffix for display — in the order those feats appear in `build.feats`. Duplicate names are omitted. Spell stats still use primary class (`build.class`) only.
_Avoid_: Feat dump, spellcaster list

**Campaign tool**:
A feature in the campaign app for table use during play (e.g. relationship tracker, Heroes page). Player-facing unless noted otherwise — published state is read-only for players; GM mode on localhost adds edit/import controls. Each tool has its own route; the index page links to them under a campaign tools section.
_Avoid_: Module, widget, GM-only page
