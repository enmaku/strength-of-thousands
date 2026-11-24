---
name: generate-custom-card-page
description: Generate one-off front and back card pages for a hand-picked mix of spells, items and actions, to replace cards that were misprinted or damaged. Usage - /generate-custom-card-page <card list>
argument-hint: "<Heal, item:Backpack, Seek x2, ...>"
disable-model-invocation: true
---

# Generate Custom Card Page

Replacement cards for individual misprints. Takes any mix of spells, items and actions and lays them out, in the order given, nine to a page with a matching back page for every front page. Built by the same code as `/generate-cards` (`cards/generate_cards.py`), so a card looks and reads the same as in the hero deck.

## Run

Arguments: `$ARGUMENTS`

Turn the request into one comma-separated list and pass it as a single quoted argument:

```
python3 -I cards/generate_custom_cards.py [--hero <hero as typed>] "Heal, item:Backpack, Seek x2, spell:Alarm"
```

- Names are as Archives of Nethys spells them. Fix obvious capitalization; do not guess at a name the user did not give.
- `spell:`, `item:` or `action:` in front of a name states its deck. Without it the script works the deck out: a name with a cached entry in exactly one deck is that deck's; with nothing cached it asks AoN about each deck. A name found in several decks makes the script exit with the options; ask the user which one they meant, or add the prefix when the user already said (e.g. "the spell Aid"). It prints `<name>: <deck>` for every guess.
- `x2` after a name prints two copies (both sides).
- `--hero` is only needed for a class feature that several classes share a name for (e.g. Spellstrike); it limits those to the hero's class(es).
- A ritual is `spell:rit:<Name>`; an animal companion cannot be requested.
- Blacklisted names are printed anyway: asking for a card by name overrides `cards/blacklist.json`.

Exit 0: finished. Exit 2: summaries needed, so go to Summarize. Exit 1 or a traceback: report it.

Card text comes from the cache first (`cards/cache/aon/`, summaries in `cards/cache/summaries/`); AoN is only asked about names never cached before, and what it returns is cached for next time. Basic and skill actions get the same label and "Trained" note a hero deck prints, so a summary written for a hero deck is reused.

## Summarize

Same as `/generate-cards`. Cards whose text will not fit a front need a summary. The output names each pending file written (`cards/cache/pending/custom-<spells|items|actions>.json`). Each holds an `instructions` field and, per card, the `text`, the stats line, and `front_budget_chars` / `back_budget_chars`. Fill in `front` and `back`, save, and re-run the exact same command. Anything still too long comes back with a `problem` note; shorten and re-run. Done when the command exits 0.

## Report

Per card, say which slot it landed in (the script prints the map) so the user can match replacements to the cards they are replacing, and say which deck any unprefixed name resolved to. List `MISSING` names (not on AoN under that name) and any passive entry that was expanded into the action it grants. Give the PDFs written.

## Output

Written to `cards/custom/`, stamped with the run time so earlier pages are never overwritten:

| File | Holds |
|---|---|
| `Custom <date time> - Cards.pdf` | the fronts, nine per page, decks mixed |
| `Custom <date time> - Cards (Back) pgN.pdf` | the backs for front page N, one single-page file each |

Every card sits in its own deck's frame with the tab in that deck's position (Spell left, Action middle, Item right on a front), so mixed pages need no special handling when cut and sleeved. The backs are mirrored left-to-right exactly as in `/generate-cards`, with the same duplex assumption (`MIRROR_BACKS` in `cards/generate_cards.py`). Cards with no summary still get a back (frame, tab and title only), because the sheet is printed as a whole.

Leave `heroes/`, `cards/blacklist.json` and `cards/templates/` as they are. Do not commit the output unless asked.

## How it works

Each deck's cards are drawn on that deck's own front and back template, then each card's slot is copied as a vector clip onto one blank page. Slot clips are sized to stay inside the gaps between cards, so the tab, which sits above the card, comes along without touching a neighbour.
