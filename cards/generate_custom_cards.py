#!/usr/bin/env python3
"""One-off card pages: a hand-picked mix of spells, items, actions and GM cards, front and back.

Usage: python3 -I cards/generate_custom_cards.py [--hero NAME] [--no-tabs] "[kind:]Name [xN], [kind:]Name, ..."

For replacing individual cards that were misprinted or damaged. Entries are comma- or newline-separated;
`spell:`, `item:` or `action:` names the deck (otherwise it is worked out, see detect_kind), and a trailing
`x2` prints two copies. `--hero` limits class features to that hero's class(es), as in a hero run.

Cards are built exactly as generate_cards.py builds them (same AoN text, same blacklist-free card layout, same
cached summaries), but AoN is only asked about names that are not already in cards/cache/aon/. Each card is drawn on
its own deck's template and its slot is copied onto one mixed page, so every card keeps its deck's tab position
(Spell left, Action middle, Item right on the front; mirrored on the back). Nine cards per page, in the order
given. Every page gets a back page.

GM cards (cards/gm/book*.py, drawn by generate_gm_cards.py) are found by title, full name or slug: `combat:`,
`npc:` or `campaign:` names the tab, `gm:` any tab, and `gm:book1:Name` (or `combat:book1:Name`) picks a book when
several books have a card of that name. An unprefixed name that matches a GM card is that card, unless an AoN
spell, item or action of that name is cached too, in which case the script asks for a prefix. GM cards need no AoN
lookup and no summaries. `--no-tabs` prints every card on the page with a plain top edge instead of its tab (handouts).

Cards too long for a front need a summary, as in generate_cards.py: they are written to
cards/cache/pending/custom-<deck>.json and the script exits 2; fill them in and re-run the same command.

Output: cards/custom/Custom <date time> - Cards.pdf and Custom <date time> - Cards (Back) pgN.pdf.
"""
import argparse
import datetime
import json
import re
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_cards as g
import generate_gm_cards as gm

DECKS = {"spell": "spells", "spells": "spells", "item": "items", "items": "items", "action": "actions", "actions": "actions",
         "combat": "combat", "npc": "npcs", "npcs": "npcs", "campaign": "campaign", "gm": "gm"}
OUT = g.CARDS / "custom"
PAGE_W, PAGE_H = 612, 792

# ---------- cache-first lookup ----------

_index = {}


def _cache_index(aon_kind):
    """Every cached AoN document of one kind, by lower-cased name and by AoN id (read once)."""
    if aon_kind not in _index:
        by_name, by_id = {}, {}
        for path in sorted((g.CACHE / aon_kind).glob("*.json")):
            try:
                doc = g.cache_load(path)
            except (ValueError, OSError):
                continue
            by_name.setdefault(doc.get("name", "").lower(), []).append(doc)
            if doc.get("id"):
                by_id.setdefault(doc["id"], []).append(doc)
        _index[aon_kind] = (by_name, by_id)
    return _index[aon_kind]


def find_cached(ref, aon_kind):
    """A cached document for `ref`, or None. Never touches the network.

    The hero runs cache an action under its name plus the hero's class ("aid--summoner.json"), so a plain
    name is also looked for under every class suffix, then by the name inside each cached document."""
    folder, key = g.CACHE / aon_kind, g.slug(ref)
    paths = [p for p in [folder / f"{key}.json", *sorted(folder.glob(f"{key}--*.json"))] if p.exists()]
    hits = g.best_hits([g.cache_load(p) for p in paths])
    if hits:
        return hits[0]
    name = ref
    cats = g.AON_CATEGORIES[aon_kind]
    for prefix, c in g.PREFIX_CATEGORIES.items():
        if ref.startswith(prefix):
            name, cats = ref[len(prefix):], c
    by_name, by_id = _cache_index(aon_kind)
    docs = by_id.get(ref[3:], []) if ref.startswith("id:") else by_name.get(name.lower(), [])
    hits = g.best_hits([d for d in docs if ref.startswith("id:") or d.get("category") in cats])
    return hits[0] if hits else None


def lookup(ref, aon_kind):
    """Cache first; AoN only for what is not cached (fetch_aon caches what it finds)."""
    return find_cached(ref, aon_kind) or g.fetch_aon(ref, aon_kind)


def detect_kind(name):
    """Which deck an unprefixed name belongs to. Cache first: exactly one deck with a cached entry wins.
    With nothing cached anywhere, AoN is asked for each deck. A name found in several decks is ambiguous."""
    cached = [k for k, cfg in g.KINDS.items() if find_cached(name, cfg["aon"])]
    found = cached or [k for k, cfg in g.KINDS.items() if g.fetch_aon(name, cfg["aon"])]
    return found


# ---------- request parsing ----------

def parse_requests(args):
    """-> [(deck or None, book or None, name, copies)] from the command-line words (commas and newlines separate entries)."""
    out = []
    for raw in re.split(r"[,;\n]", " ".join(args)):
        text = raw.strip()
        if not text:
            continue
        copies = 1
        if m := re.fullmatch(r"(.+?)\s*[x×]\s*(\d+)", text, re.I):
            text, copies = m.group(1).strip(), int(m.group(2))
        deck = book = None
        if m := re.match(r"(spells?|items?|actions?|combat|npcs?|campaign|gm)\s*:\s*(.+)", text, re.I):
            deck, text = DECKS[m.group(1).lower()], m.group(2).strip()
        if m := re.match(r"(book\d+)\s*:\s*(.+)", text, re.I):
            book, text = m.group(1).lower(), m.group(2).strip()
            deck = deck or "gm"
        out.append((deck, book, text, copies))
    return out


# ---------- universal actions carry a label and a "Trained" note on hero decks ----------

_universal = None


def universal_labels():
    """({AoN id: (subtitle, extra)}, {name: (subtitle, extra)}) for basic, exploration and skill actions, as a hero deck labels them.
    The first mention wins, as it does when a hero deck drops a repeat (Recall Knowledge appears under several skills)."""
    global _universal
    if _universal is None:
        everyone = {"build": {"proficiencies": {sk: g.TRAINED for sk in g.CORE_SKILLS}}}  # "Trained" depends on the skill's heading only
        by_id, by_name = {}, {}
        for ref, subtitle, extra in g.universal_actions(everyone):
            if ref.startswith("id:"):
                by_id.setdefault(ref[3:], (subtitle, extra))
            else:
                by_name.setdefault(ref.split(":", 1)[1].lower(), (subtitle, extra))
        _universal = by_id, by_name
    return _universal


def relabel_universal(card):
    """Give a basic / skill action the same subtitle and stats a hero deck prints, so its cached summary still matches."""
    if card.get("aon_category") not in ("action", "skill-general-action"):
        return
    by_id, by_name = universal_labels()
    label = by_id.get(card.get("aon_id")) or by_name.get(card["title"].lower())
    if label:
        subtitle, extra = label
        card["subtitle"] = subtitle
        card["stats"] = "; ".join(filter(None, [extra, card["stats"]]))
        g.rehash(card)


# ---------- pages ----------

def front_clip(i):
    """The slot's card plus its title tab. Margins stay inside the gaps (15.6 pt across, 9.7 pt down) between cards."""
    (x0, x1), (y0, y1) = g.FRONT_COLS[i % 3], g.FRONT_ROWS[i // 3]
    return fitz.Rect(x0 - 4, y0 - 6, x1 + 4, y1 + 2.5)


def back_clip(i, fields):
    """The same card's back, in its mirrored column, tab included (the box fill_back blanks for an unused slot)."""
    r, c = divmod(i, 3)
    if g.MIRROR_BACKS:
        c = 2 - c
    return fields[f"p2_r{r+1}_c{c+1}_back"] + (-8, -26, 8, 16)


def deck_page(deck, slots, back):
    """(doc, field rects) for one deck's template with its cards drawn: the player decks via generate_cards, the GM
    tabs via generate_gm_cards (which also swaps the tab label)."""
    if deck in gm.TABS:
        tpl, label, size = gm.TABS[deck]
        doc, page, fields = gm.template_page(g.CARDS / "templates" / f"Playing Card - {tpl}{' Backs' if back else ''}.pdf",
                                             label, size)
        for i, card in slots.items():
            if back:
                gm.draw_back(page, fields, i, card)
            else:
                gm.draw_front(page, fields, i, card, gm.GM / "art")
        return doc, fields
    template = g.KINDS[deck]["template"]
    doc = fitz.open(g.CARDS / "templates" / (template.replace(".pdf", " Backs.pdf") if back else template))
    fields = {w.field_name: w.rect for w in doc[0].widgets()}
    (g.fill_back if back else g.fill_front)(doc[0], slots)
    return doc, fields


def compose(chunk, back, no_tabs):
    """One page from up to nine (deck, card) pairs: each deck's cards are drawn on that deck's own template, then each
    card's slot is copied onto a blank page, so a page can mix decks without disturbing any deck's tab."""
    out = fitz.open()
    page = out.new_page(width=PAGE_W, height=PAGE_H)
    by_deck = {}
    for i, (deck, card) in enumerate(chunk):
        by_deck.setdefault(deck, {})[i] = card
    for deck, slots in by_deck.items():
        doc, fields = deck_page(deck, slots, back)  # draw every card first: show_pdf_page caches the source page
        for i in slots:
            rect = back_clip(i, fields) if back else front_clip(i)
            page.show_pdf_page(rect, doc, 0, clip=rect)
    if no_tabs:
        mirror = (lambda c: 2 - c) if (back and g.MIRROR_BACKS) else (lambda c: c)
        gm.strip_tabs(page, [(i // 3, mirror(i % 3)) for i in range(len(chunk))], back=back)
    return out


def build(chunks, stamp, no_tabs=False):
    OUT.mkdir(parents=True, exist_ok=True)
    name = f"Custom {stamp} - Cards" + (" (No Tabs)" if no_tabs else "")
    fronts = fitz.open()
    files = []
    for n, chunk in enumerate(chunks, 1):
        print(f"page {n}")
        fronts.insert_pdf(compose(chunk, False, no_tabs))
    fronts.save(OUT / f"{name}.pdf", garbage=4, deflate=True)
    files.append(f"{name}.pdf")
    for n, chunk in enumerate(chunks, 1):
        print(f"back for page {n}")
        compose(chunk, True, no_tabs).save(OUT / f"{name} (Back) pg{n}.pdf", garbage=4, deflate=True)
        files.append(f"{name} (Back) pg{n}.pdf")
    return files


def slot_map(chunks):
    for n, chunk in enumerate(chunks, 1):
        print(f"\npage {n} (front slot: row, column -> back column is mirrored)")
        for i, (deck, card) in enumerate(chunk):
            kind = gm.TABS[deck][1] if deck in gm.TABS else g.KINDS[deck]["label"][:-1]
            print(f"  r{i // 3 + 1} c{i % 3 + 1}  {kind:<8} {card['title']}")


# ---------- main ----------

def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--hero", help="hero whose class(es) decide which class features count")
    ap.add_argument("--no-tabs", action="store_true", help="plain top edge instead of the tab on every card (handouts)")
    ap.add_argument("entries", nargs="+", help='"[spell:|item:|action:|combat:|npc:|campaign:|gm:]Name [xN], ..."')
    opts = ap.parse_args()

    g.HERO_CLASSES.clear()
    if opts.hero:
        hero = json.loads((g.ROOT / "heroes" / f"{g.resolve_hero(opts.hero)}.json").read_text())
        g.HERO_CLASSES.update(c for c in (hero["build"].get("class"), hero["build"].get("dualClass")) if c)

    requests = parse_requests(opts.entries)
    if not requests:
        sys.exit("no cards requested")

    # Settle every card's deck before anything is built.
    resolved, unclear, missing = [], [], []
    for deck, book, name, copies in requests:
        if deck in ("gm", *gm.TABS) or (deck is None and gm.find(name, book=book)):
            hits = gm.find(name, None if deck in (None, "gm") else deck, book)
            cached = [k for k, cfg in g.KINDS.items() if find_cached(name, cfg["aon"])] if deck is None else []
            if not hits:
                missing.append(f"{deck}:{name}")
            elif len(hits) > 1 or cached:
                options = [f"{c['tab']}:{b}:{name}" for b, c in hits] + [f"{k[:-1]}:{name}" for k in cached]
                unclear.append(f"'{name}' matches more than one card: write one of {', '.join(options)}")
            else:
                (b, card), = hits
                if deck in (None, "gm"):
                    print(f"{name}: GM {gm.TABS[card['tab']][1]} ({b})")
                resolved.append(("gm", (card["tab"], card), copies))
            continue
        if deck is None:
            kinds = detect_kind(name)
            if len(kinds) > 1:
                unclear.append(f"'{name}' is in more than one deck ({', '.join(kinds)}): write spell:{name}, item:{name} or action:{name}")
                continue
            deck = kinds[0] if kinds else "actions"  # not found anywhere: reported as MISSING below
            if kinds:
                print(f"{name}: {deck[:-1]}")
        resolved.append((deck, name, copies))
    if unclear:
        sys.exit("\n".join(unclear))

    placed, passive = [], []  # placed: (deck, card) in request order, copies repeated
    canon = {}  # (deck, card id) -> the one card object, so a repeated card is summarised once
    for deck, name, copies in resolved:
        if deck == "gm":  # GM cards are complete as written: no AoN text, no summaries
            placed += [name] * copies
            continue
        cfg = g.KINDS[deck]
        cards, _, pas, miss = g.collect_cards(None, deck, entries=[name], explicit=True, fetch=lookup)
        missing += miss
        passive += pas
        for card in cards:
            if deck == "actions":
                relabel_universal(card)
            card = canon.setdefault((deck, card["id"]), card)
            placed += [(deck, card)] * copies
    for ref in missing:
        print("MISSING", ref)
    if passive:
        print(f"expanded {len(passive)} passive entr{'y' if len(passive) == 1 else 'ies'} into the action(s) they grant: {', '.join(passive)}")
    if not placed:
        sys.exit("nothing to print")

    # Summaries for cards whose text overflows the front, per deck.
    blocked = []
    for deck in g.KINDS:
        cards = [c for (d, k), c in canon.items() if d == deck]
        if not cards:
            continue
        cfg = g.KINDS[deck]
        g.KIND.update(name=deck, cache=cfg["aon"])
        todo, pending_file = g.resolve_summaries(cards, "custom", *g.measure_pages(cfg))
        if todo:
            g.PENDING.mkdir(parents=True, exist_ok=True)
            pending_file.write_text(json.dumps({"hero": "custom", "instructions": g.INSTRUCTIONS, "cards": todo}, indent=1))
            print(f"\n{len(todo)} {deck} card(s) need a summary (or a shorter one). Wrote {pending_file}")
            for e in todo:
                print(f"  - {e['name']}: {e['problem']}")
            blocked.append(pending_file)
        else:
            pending_file.unlink(missing_ok=True)
    if blocked:
        print("\nFill in 'front' and 'back' for each, then re-run this command.")
        sys.exit(2)

    chunks = [placed[i:i + 9] for i in range(0, len(placed), 9)]
    files = build(chunks, datetime.datetime.now().strftime("%Y-%m-%d %H%M%S"), opts.no_tabs)
    slot_map(chunks)
    for w in gm.WARN:
        print("GM card text too long:", w)
    print(f"\nwrote {len(placed)} card(s) on {len(chunks)} page(s) to {OUT.relative_to(g.ROOT)}:")
    for f in files:
        print("  ", f)


if __name__ == "__main__":
    main()
