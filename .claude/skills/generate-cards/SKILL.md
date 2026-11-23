---
name: generate-cards
description: Generate printable spell, item and action reference-card PDFs for the heroes, or only the new and changed cards with diff. Usage - /generate-cards [hero-slug] [diff]
argument-hint: "[hero-slug] [diff]"
disable-model-invocation: true
---

# Generate Cards

Reference-card PDFs for every hero, built from the Pathbuilder JSON in `heroes/` with rules text from Archives of Nethys. The script does the building; you write the summaries for cards too long for a card front.

## Run

Arguments: `$ARGUMENTS`

- No hero: every hero not marked `"active": false` in `heroes/index.json`. This is the default.
- A hero name limits the run to that hero. Pass it as typed (`taraan`, `cyan`, `cy-an`, `yggo`): the script matches loosely against slug, display name and each word of the name, tolerates a typo, and prints the hero it chose. When a name fits several heroes it exits with the candidates; ask the user which one they meant.
- `diff` adds `--diff`.

```
python3 -I cards/generate_cards.py [hero as typed] [--diff]
```

Exit 0: finished. Exit 2: summaries needed, so go to Summarize. Any other exit: report the traceback.

## Summarize

The output names each pending file written to `cards/cache/pending/`. Work from the files the output names; others in that folder are stale.

Each pending file's `instructions` field holds the writing rules. Each card in it carries the full `text`, the stats line the card prints itself, and `front_budget_chars` / `back_budget_chars`. Fill in `front` and `back` for every card, save, and re-run the same command. The script checks the real fit at the minimum legible font size and returns anything too long with a `problem` note, your attempt kept in place; shorten that side and re-run.

Done: the command exits 0 and no pending files are named. Summaries are cached per card, so one written for a hero is reused for every hero who has the card.

## Report

Open with the hero the name resolved to when the script printed a "matched" line. Per hero and deck, give the card count and the PDFs written. For a diff, give the script's NEW / CHANGED / REMOVED / SOURCE lines as printed, then the `(changes ...)` PDFs it wrote. List `MISSING` names once; most are Pathbuilder labels with no AoN entry (heritages, class frameworks, sub-choices), so call out only those that look like usable actions or items.

Leave `cards/blacklist.json`, `heroes/` and `cards/templates/` as they are (the generator reads `Playing Card - <Deck>.pdf` for fronts and `Playing Card - <Deck> Backs.pdf` for backs, so both must exist). Suggest blacklist entries in the report when a deck looks bloated.

## Output

Everything lands in `cards/<slug>/`, named for the hero's first name.

| File | Holds |
|---|---|
| `<Name> - <Spells\|Items\|Actions>.pdf` | the fronts, 9 cards per page |
| `<Name> - <Deck> (Back) pgN.pdf` | the backs for front page N, one single-page file each |
| `<Name> - <Deck> (changes <date time>).pdf` (+ its backs) | diff only: just the new and changed cards; never overwritten by later runs |

Every front page has a back file, built on that deck's own fillable back template (`cards/templates/Playing Card - <Deck> Backs.pdf`). Each back shows the frame, scrollwork and the deck's tab (Spell / Item / Action). The tab is mirrored left-to-right from the front, since a back prints on the reverse of its front: a tab at the left of the front sits at the right of the back. Cards with summary text show title, text and a "Full rules" citation; cards without back text show the frame, tab and title only. Slots with no card stay blank. Cards with summary text sit at the front of each deck. Back columns are mirrored for flipping the sheet over its long edge (`MIRROR_BACKS` in the script if a printer disagrees).

If the front templates change, rebuild the back templates with `python3 -I cards/build_back_templates.py <plain-frame-backs.pdf>`, where the argument is the plain nine-frame back sheet with its nine fillable fields.

## How diff decides

Every completed run writes a record to `cards/cache/runs/<slug>/<deck>/`; `--diff` compares against the latest one for that hero and deck. A card is NEW when its id is absent, CHANGED when anything printed on either side differs, REMOVED when it dropped out (blacklisted, passive, or no longer granted), SOURCE when only the AoN text moved. REMOVED and SOURCE are reported, never printed. With nothing different the run reports "no changes" and writes nothing. The first run for a hero and deck has no record, so it builds the full deck as the baseline.
