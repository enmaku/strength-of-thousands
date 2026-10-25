# Player arcs — chords and scheduling rules

Homebrew PC chords from `lessons/0009-player-tie-ins-gm-prep.html`, scheduled against the AP beat spine. **Scheduled beat rows now live in [`data/timeline.json`](../data/timeline.json)** (`lane: "player"`, keyed by `heroSlug`). This document owns the chords themselves, the dependency contract, and the "do not" rules — the *why* and the *constraints*, not the rows. Spoilers throughout, GM only.

Source of truth for the plots themselves is still `lessons/0009-player-tie-ins-gm-prep.html`. If a player invents conflicting canon, their version wins — revise this file, `data/timeline.json`, and the lesson together.

## Rules of the road

- **One beat per PC per window.** Six PCs, one beat each per ~3 sessions, is the maximum the spotlight can carry without the AP vanishing.
- **Never invent a scene the AP already has.** Seed in downtime, faculty asides, dreams, dorm friendship. The AP beat is the stage, not the script.
- **Only Taraan gets a private Jatembe conversation.** Everyone else pays off elsewhere. Lithrei gets one glance, maximum.
- **Don't double-book relationships.** Noxolo is Lithrei's. Koride's PC favorite is Yggostrus. Ahassunu is Lithrei's historian. Lumusi is Cy'An's kitchen. Haibram is Solanum's omen buddy; Taraan borrows him for flight only.

### Status

| PC | Chord | Where it stands after S7 |
|---|---|---|
| **Anya** | The wild that enrolled | **Undeveloped.** Two absences, no branch, no Study result, no implement. Bookkeeping is a few minutes at the table; the actual need is table-time with the cohort before S14. |
| **Cy'An** | Provider-as-identity | On track. Wound named in S1, Ot's lesson in S2, Bonding Meal in S4. Needs an empty-shift. |
| **Solanum** | Small life, large sky | On track. Glider in S2, chart talk available, red-star omen already at the table from Lithrei. Needs Lesedi. |
| **Yggostrus** | The sealed dragon | Behind on Koride. Phase 0 transactional visible in S1–S2; no warm Koride contact yet — the planned S7 beat did not land. |
| **Lithrei** | The unfinished student | On track. Noxolo warmth in S5, Pharasma study ongoing, red-star omen in S2. Needs Ahassunu. |
| **Taraan** | Ird / Inscribed One / flight | On track. Flight hunger and monument ethics both visible; no Ird echo yet. Needs an archive aside at S10. |

**S7 was a partial session.** The stump library's front half ran and the scrit fight ate the night; none of the five library player beats landed. They are re-scheduled to S8 with the rooms they belong to — nothing was lost, only displaced.

## Dependency contract

Each player beat needs an AP beat under it. This table is what makes the timing non-negotiable — it is a constraint, not a schedule. Session numbers match `data/timeline.json`.

| PC beat | Requires | Earliest | Latest before it loses its point |
|---|---|---|---|
| Taraan: first Ird echo (fragment, seven-fingered handprint) | Any ruin or archive scene with Izem or Ahassunu present | S21 (Hababe) | S42 (Bloodsalt) |
| Taraan: second echo / soul-trade motif | A civic archive or a Nantambu history site | S28 (Kalembi's home) | S45 |
| Taraan: "a debt of silence" rhyme | **Dimari-Diji on stage** | S65 (Osibu) | S69 (Jatembe located) |
| Taraan: private Jatembe conversation | **Jatembe freed and present, deferring spotlight** | S86 (Mandibles) | S89 (post-renaming) |
| Taraan: sanctuary in flight | A flying teacher or vehicle — Haibram, Tahenkot's airship | S74 (First Flight) | S87 |
| Lithrei: scrubbed student file | Ahassunu on stage + institutional-memory beat | S23 | S36 (graduation) |
| Lithrei: partial identity (role / era / death) | A trapped or captive spirit of consequence | S62 (Dajermube) | S69 |
| Lithrei: Unshadowed cohort mirror | **Hollowed cohort NPCs** | S90 | S98 |
| Lithrei: choose rest / integrate / witness | The shadow-fragment work | S95 | S97 |
| Yggostrus: Koride sees him as specimen | Koride running insect research on campus | S11 (Bug Problems) | S21 |
| Yggostrus: asymmetric care (unrepayable gift) | A PC is hurt for his sake | S23 | S42 |
| Yggostrus: unbinding A/B fork | Soul-trade or identity-for-power material | S76 (Iobane) | S80 |
| Yggostrus: speaks first to Koride | **Unshadowed Koride** | S92 | S92. There is no later window. |
| Anya: bond shown to community | First Masking (or the campus-defence spike if missed) | S14 | S66 |
| Anya: "the grounds brought her" | A guardian of a place speaking plainly about belonging | S65 (Dimari-Diji) | S98 |
| Cy'An: empty shift | Lumusi or Tzeniwe can cover | S11 | S25 |
| Cy'An: need that isn't material | A mission whose problem cannot be cooked | S26 (Flooded Workshop) | S38 |
| Cy'An: let a student fail safely | Has teaching duties | S39 | S54 |
| Cy'An: build the system, not spoon-feed | A disaster with more victims than helpers | S96 | S96. One window. |
| Solanum: Lesedi treats her charts as research | Lesedi on stage with the planetarium | S10 | S23 |
| Solanum: eclipse spike | Shrine of the Eclipse | S61 | S62 |
| Solanum: red star reveal | **Dimari-Diji names Akiton** | S69 | S70. Must not precede S69. |
| Solanum: Akiton wonder | Passage through the Doorway | S78 | S78 |

Two hard rules fall out of that table:

1. **Solanum's sky beats cannot run ahead of Dimari-Diji.** No portent may name Akiton, the Mandibles, or Jatembe early. Send images, not nouns.
2. **Lithrei's passenger is never Uduak.** Uduak's story closes at S17; the passenger's story closes at S95–S98. If the table starts merging them, correct it in narration.

---

## Taraan Skyseeker

Skyborn tengu · Cleric of Soralyon / Witch (The Inscribed One) · Archaeologist · familiar Erudite. Dorm: Okoro. Faculty: Izem Mezitani (Janatimo light). `heroSlug: taraan-skyseeker`

**Surface:** he wants altitude. Gliders, wind craft, whoever will teach him. Play this early and play it joyful — it is not the Ird plot, it is a man who named himself Skyseeker and cannot fly.

**The truth:** Ird is a living city, bound and harvested by a parasite caste, freed by Jatembe and the Ten Magic Warriors, and hidden behind a false story that Jatembe destroyed it. That city is his patron. The meeting is sealed behind amnesia so he cannot lead anyone back.

**Do not:** confirm Stone Ghost was Uduak; let divination pinpoint Ird; let Eru write the word "Ird" before S86.

---

## Lithrei Woeborn

Samsaran-mixed human · Oracle (Life) / Investigator · Haunted. Dorm: Noxolo. Faculty: Ahassunu (Zuma light). `heroSlug: lithrei-woeborn`

**The truth:** the passenger is a former Magaambya student who died badly on campus — neglect, a cover-up, or "for the good of the school." Not Uduak. Healer monks contained the echo; acceptance brought the problem home. Someone at the school may have arranged the letter quietly. Keep that soft and late.

**Do not:** make the passenger Uduak; let him take the Jatembe wink; let the ghost plot outshine the egg.

---

## Yggostrus

Dragonet (homing drake) · Summoner (dragon eidolon, acid) · Apsu · cursed former dragon. Dorm: Esi Djana. Faculty: the Session 1 druid mentor + Koride Ulawa. `heroSlug: yggostrus`

**The truth:** the eidolon is the rest of him — his sealed true shape, not a pet. Breaking the curse power-first reabsorbs him into a solitary tyrant. The Magaambya way is integration without erasing the cohort.

**GM rule:** progress advances when he acts through others — Aid, shared ritual, cohort risk on his behalf, accepting help he did not control.

**Open item:** his druid mentor — the woman who found him a century into the curse — has no name and no dossier in `reference/sot-campus-npcs.html`. She is his most beloved relationship and currently a pronoun. Name her before S11.

---

## Anya

Versatile human · Summoner (beast eidolon) · Feral child. Dorm: Anchor Root. Faculty: Takulu Ot. `heroSlug: anya`

**The truth:** the beast eidolon is a Magaambya-native wild spirit — a Rain-Scribe or campus genius-loci fragment — that chose a feral child as its route into the school's human community. Surface: she brought the wild to school. Truth: the wild enrolled itself through her. Its shape is a domestic cat the size of a lion. That is the tell.

**Status note:** two straight absences (S5, S6) — no branch, no Study result, no implement. That is a bookkeeping gap, not a penalty: Study is a downtime activity she is owed, and an absent player's character was attending class in-world. The real constraint is that her S14 payoff needs table-time behind it.

---

## Cy'An Copperbottom

Irongut goblin · Inventor (construct) / Wizard dedication · Cook. Dorm: Tzeniwe. Staff: Lumusi Yao (Takulu light). `heroSlug: cy-an-copperbottom`

**The wound:** worth equals usefulness. Already good at care. The flaw is that when they cannot provide — no soup angle, no fix, empty hands — the self blanks.

**Destination:** still a provider, but able to receive care, sit with someone else's struggle, and belong on a day they did jack shit. Teaching over fixing. Never stop being a cook-inventor; stop being a vending machine with anxiety.

---

## Solanum Calabash

Fruit leshy · Magus (Twisting Tree) · Astrologer. Dorm: Haibram. Faculty: Lesedi (Mafika light). `heroSlug: solanum-calabash`

**Two braids, no buried conspiracy.** *Sky:* astrologer portents → the Doorway → Akiton. One omen every few sessions, images only. *Scale:* Whispering Word, Archibald Candlethaw, "my life has been rather small" → the Magaambya widens her until she can stand under a wrong star and still send something home to the kitchen.

**Do not:** name Akiton, the Mandibles, or Jatembe in an early portent; give her a second cosmic secret; primary Noxolo or Lumusi.

---

## Cross-PC collisions to stage deliberately

| Session | Collision | Why it works |
|---|---|---|
| S17 | **Taraan and Lithrei, Stone Ghost** | Duty versus lived possession; the campaign's one clean two-hander |
| S11 | **Yggostrus and Cy'An, Koride's specimen** | Same branch, same errand, opposite wounds — one is dehumanized by attention, one by being relied on |
| S14 | **Everyone, First Masking** | The only ritual that pays all six chords at once |
| S65 | **Taraan, Anya, Lithrei, Solanum, Dimari-Diji** | Four arcs rhyme in one conversation without any of them resolving |
| S69 | **Solanum and Taraan, the Akiton hinge** | One gets the destination, one gets the sky. Different payoffs, same scene |
| S92 | **Yggostrus and Lithrei, Unshadowed Koride and Unshadowed cohort** | Hollowed authority and hollowed friends; the two PCs whose arcs are *about* what a school does with people |
| S96–S98 | **Cy'An and Anya, the disaster** | Build the system versus hold the ground; both are "belonging, expressed as work" |
