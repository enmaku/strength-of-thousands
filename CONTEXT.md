# Strength of Thousands — Campaign App

Companion web app for a Pathfinder 2e Strength of Thousands table. Glossary for product and domain terms used by campaign tools in this repo.

## Language

**GM mode**:
The app experience when run on `localhost` or `127.0.0.1` (any port) via the Quasar dev server. The GM can edit campaign state (e.g. relationship dispositions) that persists as JSON in the repo. The index page shows GM prep lessons and campaign tools.
_Avoid_: Admin mode, dev mode

**Player mode**:
The app experience when run from a deployed build (e.g. GitHub Pages). Campaign state is read-only; players see whatever the GM has committed and published. All hero tabs are visible — same party view as GM mode, without heart editing or the add-hero control. The index page shows campaign tools only; GM prep lesson links are hidden.
_Avoid_: Production mode, viewer mode

**Hero**:
The player character at the table — the in-fiction Magaambya student whose name appears on tabs and in JSON files. Each hero has their own relationship state toward every Spire student. One human player usually maps to one hero, but the app keys off the hero, not the person's real-world name.
_Avoid_: Player (when meaning the hero), PC, character

**Player**:
The human at the table. Distinguished from **Hero** — tabs and filenames use hero names, not player names.
_Avoid_: Using "player" in UI labels where you mean the hero

**Spire student**:
One of the peer NPCs in the Spire Dorm cohort — classmates heroes befriend during the adventure. The relationship tracker shows a fixed roster drawn from shared reference data; v1 includes the nine students in the portrait manifest. The roster is designed to be extended later (e.g. Goss, Mazta, Savana) without restructuring per-hero state.
_Avoid_: Classmate (acceptable in prose, but prefer Spire student in tool UI), NPC

**Disposition**:
How friendly a given hero is with a given Spire student, expressed as 0–5 hearts. Intentionally fuzzier than the rulebook's attitude tiers; the GM sets it by clicking hearts in GM mode. Each click writes immediately to the hero file; publishing to players is a separate git commit/push.
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
A campaign tool showing one tab per hero. Each tab displays a tile grid of all Spire students with portrait, name, disposition hearts, and unlock indicators for Classroom Advantage and uncommon rules. Locked indicators appear muted; unlocked indicators are highlighted. Tooltips always show the full benefit text, even when locked. In GM mode the GM can edit dispositions and add heroes; in player mode the same view is read-only.

**Spire student catalog**:
Shared reference data for every Spire student on the roster — slug, display name, portrait, branch, Classroom Advantage description, and uncommon rules description. Hero files reference students by slug only; extending the roster means adding a catalog entry, not migrating hero files. Students appear in book order (as in *Kindled Magic*).
_Avoid_: Student manifest, NPC list

**Hero file**:
Per-hero JSON storing the hero's display name and disposition hearts keyed by Spire student slug. Tooltip copy and unlock logic come from the catalog, not the hero file. Dispositions persist for the full campaign; nothing resets between books.

**Hero roster**:
The set of heroes at the table. Each hero has one hero file. New heroes are added in GM mode via a "+" control; only a display name is required, and all dispositions start at 0. An empty roster shows a prompt to add a hero (GM mode) or a "no heroes yet" message (player mode). Hero tabs are sorted alphabetically by display name; the add-hero tab is always last. On load, the first hero alphabetically is selected.

**Campaign tool**:
A feature in the campaign app for table use during play (e.g. relationship tracker). Each tool has its own route; the index page links to them under a campaign tools section.
_Avoid_: Module, widget
