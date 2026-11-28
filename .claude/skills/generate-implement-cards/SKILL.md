---
name: generate-implement-cards
description: Generate the fillable branch-implement tracker sheet for every active hero, sized to each hero's branch tier and prefilled from Pathbuilder and saved implement details. Usage - /generate-implement-cards [spells, implement details, or a JSON file]
argument-hint: "[spells | implement details | JSON file]"
disable-model-invocation: true
---

# Generate Implement Cards

Laminated write-on cards for each hero's branch implement. The script builds everything from its sources: tier, rank rows and slots, held benefit, charge pips, the primary branch's emblem, card count, each spell row's stats line and charge cost (from AoN), and the implement's Strike line and runes (from Pathbuilder). Your job is recording what the user tells you in the right source, then running it.

## Sources

Each field comes from the first source that has it:

| Field | Sources, strongest first |
|---|---|
| Implement name, binding trait, held benefit | `cards/branch-implements.json` > typed on the hero's last print > (trait) the one trait every Pathbuilder implement spell shares > (held) the branch's stock benefit |
| Weapon (Strike line and runes) | the Pathbuilder weapon `branch-implements.json` names, read live > the stats stored beside that name > typed on the last print |
| Spells, by rank | `--fill` > Pathbuilder's `Other Spells (Staves etc)` caster > typed on the last print |

- **`cards/branch-implements.json`** is keyed by hero slug and holds `name`, `trait`, `held` and `weapon`. In `held`, write `{n}` where the tier's +1/+2/+3 goes, so it scales on reprint. A `null` means "not recorded". `weapon.pathbuilder` is the name of the hero's Pathbuilder weapon that is the implement; the other `weapon` keys are a fallback snapshot in Pathbuilder's terms (`proficiency`, `die`, `damageType`, `potency`, `striking`, `runes`, `attack`, `damageBonus`).
- **Pathbuilder:** players who track their implement there put its spells in the generic "Other Spells (Staves etc)" tab, which is read straight from `heroes/<slug>.json`.
- **Typed values:** each run reads back whatever was typed into the previous sheet before replacing it, so reprinting is always safe. It can't see a copy filled outside `cards/implements/`; if the user filled one elsewhere, ask for its path and read its fields.
- **Ranks replace, they don't add:** a rank from `--fill` or Pathbuilder replaces every slot at that rank.

## Run

Arguments: `$ARGUMENTS`

Every run rebuilds the whole sheet for every hero not marked `"active": false` in `heroes/index.json` (Anya has left the campaign). Heroes with no primary branch or no spellcasting are skipped with a reason. There is no per-hero run: a partial sheet would drop the other heroes' typed values. When the user names heroes, those names only say whose details or spells to record. Anything they give, record per Record first, then run.

```
python3 -I cards/generate_implement_cards.py [--fill FILE]
```

- **Exit 0:** finished.
- **Exit 2:** the output has `PROBLEM` lines. Fix the source and re-run the same command.
- **Any other exit:** report the traceback.

## Record

- **Name, binding trait, or a custom held benefit** (e.g. "Taraan's implement is Margent"): edit the hero's entry in `cards/branch-implements.json`, adding the entry if it's missing. These details persist across every future run.
- **Which weapon is the implement:** set `weapon.pathbuilder` to its exact name in the hero's `build.weapons`, and snapshot its stats beside it from that entry (`prof`, `die`, `damageType`, `pot`, `str`, `runes`, `attack`, `damageBonus`). If the user doesn't say which, look for a simple weapon whose name isn't on AoN; implements are entered as custom or renamed items. Propose it and let the user confirm.
- **Weapon changes** (runes added, attack changed): the live Pathbuilder weapon wins, so the player re-exports. For a hero without a Pathbuilder weapon, edit the stored snapshot. A card printed without runes has no runes line to write in, so it needs the reprint.
- **Spells for a hero who tracks them in Pathbuilder** (the hero's `Other Spells (Staves etc)` caster lists any): Pathbuilder wins on the next run, so tell the user to update Pathbuilder too. Use `--fill` to print the change now.
- **Spells for anyone else** (a list, prose, or the user's own JSON in any shape): write a `--fill` JSON file in your scratchpad, keyed by hero name as the user typed it (matched loosely; if a name fits several heroes the script exits listing them, so ask the user which one they meant). The format is in `--help`.
  - Give each spell as a bare name under its rank, and the script looks up stats and cost on AoN. Give `stats` or `cost` only when the user states them.
  - A rank you list replaces that rank, so for "add Fear to rank 1", read the hero's current fields first and list the whole rank. Fields are read with PyMuPDF from `cards/implements/Branch Implements*.pdf`; names start with the hero's slug and end `r<rank>s<slot>.spell|stats|cost`.
  - The fill file is one-shot (the PDF keeps the values afterward), so don't commit it.

A `PROBLEM` line means one of these:

- **Rank not open, or more spells than slots:** this comes from the user's input or their Pathbuilder. Tell them what doesn't fit; don't drop spells on your own.
- **Value too long for its field:** shorten the stats line, then abbreviate the spell name (e.g. `Subconscious Sugg.`), in a `--fill` entry. Shorten an over-long name or trait in `branch-implements.json`. Re-run.
- **Characters outside WinAnsi:** replace them and re-run.

Done: the command exits 0 with no `PROBLEM` lines.

## Report

For each hero, from the `card` line, give:

- tier and branch
- emblem
- pips (solid + dotted)
- card count
- spells prefilled

Under each `card` line, pass on its notes:

- `pathbuilder` spells and any inferred binding trait. Suggest saving an inferred trait to `branch-implements.json` once the user confirms it.
- the `weapon` line and where its stats came from. When it says the named weapon isn't in Pathbuilder, the stats are the stored snapshot; ask whether the item was renamed. Heroes with no weapon recorded print a blank Strike line; offer to identify theirs (see Record).
- `REPLACED` lines: a stronger source overwrote what was typed.
- a held benefit carried over as typed: suggest saving it to `branch-implements.json` with `{n}`.
- `LONG` lines: typed values that overflow their field, which viewers will shrink below the font floor.
- `DROPPED` lines.
- AoN lookups that failed.

Also list skipped heroes with the script's reason, then the sheet files written. Leave `heroes/` and `cards/templates/` as they are.

## Output

One combined set in `cards/implements/`, every hero's cards in roster order:

| File | Holds |
|---|---|
| `Branch Implements.pdf` | the fronts, nine cards to a page |
| `Branch Implements (Back) pgN.pdf` | the backs for front page N, mirrored for a long-edge flip |

Card 1's front carries the implement's name, the binding-trait box, the held-benefit field and the charge pips. Spells fill the faces in order (card 1 front, card 1 back, card 2 front, and so on), one whole rank at a time. A back with no spells shows the branch emblem and the implement's name. The weapon block (Strike line, then a `Runes:` field that wraps between runes, left off when the implement has none) takes the last face with room for it. When none has room it adds a card, which happens when a hero's spells exactly fill their cards. Every field stays fillable. Reprint when a hero's primary branch tier or highest spell rank rises, or when the implement's spells change. Print with form fields included, or flatten first.
