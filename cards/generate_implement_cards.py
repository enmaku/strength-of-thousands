"""Branch implement cards: fillable front/back PDFs on the Items frame. A high-tier implement spills onto more cards.

    python3 -I cards/generate_implement_cards.py [--fill FILE]

Builds one combined sheet set for every active hero who can cast spells and has a primary branch; the whole set is
rebuilt each run so no hero's typed values are lost. Rules: lessons/0013-branch-implements-gm-prep.html.

Implement details the hero JSON can't hold live in cards/branch-implements.json, keyed by hero slug:
    {"taraan-skyseeker": {"name": "Margent", "trait": "mental", "held": null,
                          "weapon": {"pathbuilder": "Margent", "proficiency": "simple", "die": "d4", ...}}}
"name" and "trait" fill those fields; "held" replaces the branch's example held benefit ("{n}" becomes the tier's
+1/+2/+3). A null or missing key leaves that detail to the sources below. "weapon.pathbuilder" names the hero's
Pathbuilder weapon that is the implement: its attack, damage and runes are read from the export every run; the stats
stored beside it are the fallback when the export has no weapon by that name.

The weapon block (a Strike line over, when the implement has runes, a "Runes:" field that wraps between runes) goes on the last face with room: under
the emblem on an empty back, else at the bottom of a face whose rows still fit beside it, else on one more card. Every
hero gets it; with no weapon recorded it prints blank to fill in.

Spells come from Pathbuilder's "Other Spells (Staves etc)" caster, by rank, with stats and charge cost from AoN; a rank
Pathbuilder lists replaces that rank's carried-over slots. With no trait from the file or the last print, a trait
every Pathbuilder spell shares (ignoring concentrate, manipulate and the like) becomes the binding trait.

Typed values carry over: before replacing a hero's PDFs the script reads every filled field (implement name, trait,
held benefit, each slot's spell/stats/cost by rank and slot number) and prefills the reprint with them. A held benefit
still in the branch's stock wording isn't carried, so its +1/+2/+3 follows the tier.

--fill overlays a JSON file of spells, strongest of all sources (heroes matched loosely: "taraan", "cyan", "yggo"):
    {"<hero>": {"spells": {"C": ["Daze", {"spell": "Message", "stats": "2 actions - 120'", "cost": "0"}], "1": [...]}}}
A bare name gets its stats line and cost from AoN; an entry's own "stats"/"cost" win. A rank listed replaces that
rank's slots (in order; missing entries leave slots blank); ranks not listed keep their values. "name"/"trait" are
accepted too, but belong in cards/branch-implements.json, which outlasts one run. Filled values must fit their field at its font size in WinAnsi characters; anything that
doesn't is reported and the run exits 2.

What the script works out (reprint when any of it changes, e.g. on a tier-up or when highest spell rank rises):
  - tier, and so which rank rows and how many slots each has, from the hero's primary branch level (heroes/<slug>.json "study")
  - the held benefit and its +1/+2/+3, from the primary branch and its level
  - charge pips from Pathbuilder spell slots: solid = highest spell rank + 1; dotted = highest rank the hero can
    *prepare* (trace that many when expending a slot; spontaneous-only casters get none)
Every field stays fillable: implement name, binding trait, held benefit, and each slot's spell, stats and cost.
Nothing printed or typed goes below g.FRONT_MIN. Spells fill faces in order (card 1 front, card 1 back, card 2 front,
...) a whole rank at a time; the held benefit and pips are on card 1's front only.

Output: cards/implements/Branch Implements.pdf + "Branch Implements (Back) pgN.pdf", every active hero's cards in
order, nine to a sheet, replaced on each run. Flatten (or "Print form fields") when printing.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_cards as g  # noqa: E402

ROOT = g.ROOT
HEROES = ROOT / "heroes"
OUT, STEM = g.CARDS / "implements", "Branch Implements"  # one sheet set for every active hero
EMBLEMS = g.CARDS / "gm" / "art" / "campaign"
DETAILS = g.CARDS / "branch-implements.json"
TEMPLATE = "Playing Card - Items.pdf"

# ---------- rules ----------

TIERS = [("Apprentice", 0), ("Attuned", 3), ("Adept", 5), ("Scholar", 7), ("Master", 9), ("Grandmaster", 12),
         ("Exalted", 15), ("Paragon-bound", 18), ("Paragon", 20)]
RANK_UNLOCK = [0, 0, 5, 7, 9, 12, 15, 18, 20]  # primary branch level that opens rank r; cantrip/1st open at the gift
SECOND_LOW_SLOT = 3  # Attuned gives the second cantrip and second 1st-rank slot

HELD = {
    "cascade-bearers": "+{n} circumstance to checks to Identify Magic or Recall Knowledge about magical phenomena.",
    "emerald-boughs": "+{n} circumstance to Diplomacy to Make an Impression or Request, and to Society to Recall "
                      "Knowledge about settlements and cultures you have visited.",
    "rain-scribes": "+{n} circumstance to Survival to Sense Direction, Subsist, or Track. Ignore the first square of "
                    "non-magical difficult terrain you enter each time you Stride.",
    "tempest-sun-mages": "+{n} circumstance to your Fortitude and Will DCs against attempts to Disarm you of the "
                         "implement or Shove you, and to Intimidation to Demoralize.",
    "uzunjati": "+{n} circumstance to Recall Knowledge, and to Performance when telling a story or orating.",
}


def tier_of(level):
    return [t for t, at in TIERS if level >= at][-1]


def slots_of(level):
    """[(rank, slot count)] for every rank the implement has at this primary branch level."""
    out = []
    for r, at in enumerate(RANK_UNLOCK):
        if level >= at:
            out.append((r, 2 if r >= 2 or level >= SECOND_LOW_SLOT else 1))
    return out


def held_bonus(level):
    return 1 if level <= 10 else 2 if level <= 16 else 3


def casting(build):
    """(highest spell rank, highest rank the hero prepares) from Pathbuilder slots; None if the hero can't cast."""
    casters = [c for c in build.get("spellCasters", [])
               if not c.get("innate") and not c.get("name", "").startswith("Other Spells")]
    if not any(any(c.get("perDay", [])) for c in casters):
        return None

    def top(cs):
        return max((r for c in cs for r, n in enumerate(c.get("perDay", [])) if r >= 1 and n), default=0)

    return min(top(casters), 10), min(top([c for c in casters if c.get("spellcastingType") == "prepared"]), 10)


# ---------- heroes ----------

def load_heroes():
    index = json.loads((HEROES / "index.json").read_text())
    heroes = []
    for entry in index:
        hero = json.loads((HEROES / f"{entry['slug']}.json").read_text())
        hero["slug"] = entry["slug"]
        hero["active"] = entry.get("active", True)
        heroes.append(hero)
    return heroes


def match_hero(heroes, w):
    key = w.lower().replace("’", "").replace("'", "").replace("-", "")
    if key in {h["slug"].replace("-", "") for h in heroes}:
        hits = [h for h in heroes if h["slug"].replace("-", "") == key]
    else:
        hits = [h for h in heroes if any(key in s.lower().replace("’", "").replace("'", "").replace("-", "")
                                         for s in (h["slug"], h["displayName"], *h["displayName"].split()))]
    if len(hits) != 1:
        sys.exit(f"'{w}' matches {[h['displayName'] for h in hits] or 'no hero'}")
    if key != hits[0]["slug"].replace("-", ""):
        print(f"--fill '{w}' matched {hits[0]['displayName']}")
    return hits[0]


def implement(hero):
    study = hero.get("study") or {}
    branch = study.get("primaryBranch")
    cast = casting(hero["build"])
    if not branch:
        return None, "no primary branch yet"
    if cast is None:
        return None, "can't cast spells yet"
    level = study.get("primaryLevel", 0)
    branches = {b["slug"]: b for b in json.loads((ROOT / "data" / "magaambya-branches.json").read_text())["branches"]}
    highest, prepared = cast
    emblem = EMBLEMS / f"{branch}.png"
    if not emblem.exists():
        sys.exit(f"{hero['displayName']}: no emblem for primary branch '{branch}' at {emblem.relative_to(ROOT)}")
    return {
        "hero": hero["displayName"], "slug": hero["slug"],
        "branch": branch, "branch_name": branches[branch]["displayName"], "emblem": emblem,
        "vals": {"name": "", "trait": "", "held": "", "weapon": "", "runes": "", "spells": {}}, "build": hero["build"], "filled": set(),
        "level": level, "tier": tier_of(level), "slots": slots_of(level),
        "held": HELD[branch].format(n=held_bonus(level)),
        "free": highest + 1, "dotted": prepared, "char_level": hero["build"]["level"],
    }, None


# ---------- geometry ----------
# Measured from the Items templates: slot 0's inner border runs x 57.8–209.8, y 51.8 (below the tab) – 267.8.
FRONT_BODY0 = fitz.Rect(59, 53, 208.5, 266.5)
TITLE_RULES0 = fitz.Rect(68, 88, 200, 112)     # the template's title rules: covered, the card draws its own
FOOTER_BOX0 = fitz.Rect(75, 247, 192.5, 265)    # the template's footer box: covered
MIN_PT = g.FRONT_MIN                            # nothing printed or typed on the card goes below this
ROW_MIN, ROW_MAX, GROUP_GAP = 22, 27, 1.0       # a slot row: spell name over a stats line
FOOTER_H = 10
PIP, PIP_GAP, PIPS_PER_ROW = 13, 5, 7  # 21 max = a neat 3x7 grid
GREY = (0.45, 0.45, 0.45)


def front_body(i):
    r, c = divmod(i, 3)
    dx, dy = g.FRONT_COLS[c][0] - g.FRONT_COLS[0][0], g.FRONT_ROWS[r][0] - g.FRONT_ROWS[0][0]
    return dx, dy, FRONT_BODY0 + (dx, dy, dx, dy)


def back_body(fields, i):
    r, c = divmod(i, 3)
    if g.MIRROR_BACKS:
        c = 2 - c
    f = fields[f"p2_r{r+1}_c{c+1}_back"]
    return fitz.Rect(f.x0 + 1, f.y0 - 6, f.x1 - 1, f.y1 + 7)


def inner(body):
    return fitz.Rect(body.x0 + 5, body.y0 + 3, body.x1 - 5, body.y1 - 2)


# ---------- drawing primitives ----------

FIT_FONT = {"TiBo": "tibo", "TiRo": "tiro", "Helv": "helv"}
PROBLEMS = []  # (from --fill, message)


def field(page, name, rect, font="TiBo", size=9, center=False, value="", imp=None, key=None, multiline=False):
    """A borderless text field, prefilled with value. A value that won't fit at size is logged in PROBLEMS."""
    if value:
        try:
            value.encode("cp1252")
            wide = not multiline and fitz.get_text_length(value, FIT_FONT[font], size) > rect.width - 4
            why = "too long" if wide else ""
        except UnicodeEncodeError:
            why = "has characters outside WinAnsi"
        if why:
            where = key if isinstance(key, str) else f"{'C' if key[0] == 0 else key[0]} slot {key[1]} {key[2]}"
            PROBLEMS.append((key in imp["filled"], f"{imp['hero']} {where}: {value!r} {why} for its {size:g}pt field"))
    w = fitz.Widget()
    w.field_type = fitz.PDF_WIDGET_TYPE_TEXT
    w.field_name = name
    w.rect = rect
    w.text_font = "TiRo" if font == "TiBo" else font  # PyMuPDF can't set Times-Bold itself; see times_bold()
    w.text_fontsize = size
    w.text_color = (0, 0, 0)
    w.border_width = 0
    w.fill_color = None
    w.field_value = value
    if multiline:
        w.field_flags |= fitz.PDF_TX_FIELD_IS_MULTILINE
    added = page.add_widget(w)
    if font == "TiBo":
        page.parent.xref_set_key(added.xref, "DA", f"(0 0 0 rg /TiBo {size:g} Tf)")
    if center:
        page.parent.xref_set_key(added.xref, "Q", "1")


def times_bold(doc):
    """Register Times-Bold (/TiBo) and Times-Roman (/TiRo) in the form's default resources for the fields that use them."""
    acro = doc.xref_get_key(doc.pdf_catalog(), "AcroForm")[1].split()[0]
    for key, base in (("TiBo", "Times-Bold"), ("TiRo", "Times-Roman")):
        font = doc.get_new_xref()
        doc.update_object(font, f"<</Type/Font/Subtype/Type1/BaseFont/{base}/Encoding/WinAnsiEncoding>>")
        doc.xref_set_key(int(acro), f"DR/Font/{key}", f"{font} 0 R")
    doc.xref_set_key(int(acro), "NeedAppearances", "true")


def text(page, rect, s, size=MIN_PT, align=1, color=(0, 0, 0)):
    """A body-font textbox. Too short a box makes insert_textbox drop the text silently, so this one never is."""
    rect = fitz.Rect(rect.x0, rect.y0, rect.x1, max(rect.y1, rect.y0 + size * 1.7))
    if page.insert_textbox(rect, s, fontsize=size, align=align, color=color, **g.fontkw("body")) < 0:
        raise ValueError(f"text doesn't fit: {s!r}")


def double_rule(page, x0, x1, y):
    page.draw_line((x0, y), (x1, y), color=(0, 0, 0), width=1.4)
    page.draw_line((x0, y + 2.1), (x1, y + 2.1), color=(0, 0, 0), width=0.4)


def pip_rows(n):
    return len(pip_row_sizes(n))


def pips(page, x0, x1, y, free, dotted):
    """Solid pips for free charges, sparse-dotted ones to trace over; rows from pip_row_sizes, each centred."""
    i = 0
    for row, in_row in enumerate(pip_row_sizes(free + dotted)):
        left = (x0 + x1 - in_row * PIP - (in_row - 1) * PIP_GAP) / 2
        for col in range(in_row):
            draw_pip(page, (left + col * (PIP + PIP_GAP) + PIP / 2, y + row * (PIP + PIP_GAP) + PIP / 2), i < free)
            i += 1


def pip_row_sizes(n):
    """7 to a row; a lone pip on the last row borrows 2 from the row above (15 -> 7-5-3, 8 -> 5-3)."""
    rows = [PIPS_PER_ROW] * (n // PIPS_PER_ROW) + ([n % PIPS_PER_ROW] if n % PIPS_PER_ROW else [])
    if len(rows) > 1 and rows[-1] == 1:
        rows[-2] -= 2
        rows[-1] += 2
    return rows


def draw_pip(page, centre, solid):
    s = page.new_shape()
    s.draw_circle(centre, PIP / 2 - 0.5)
    if solid:
        s.finish(color=(0, 0, 0), width=0.8)
    else:
        s.finish(color=(0, 0, 0), width=0.8, dashes="[0 2.25] 0", lineCap=1)
    s.commit()


# ---------- layout: the same arithmetic plans the cards and draws them ----------

HELD_LINES = 3  # room in the held field for a player's own wording


def held_height(s, width):
    """Height of the held field: its text wrapped in Helvetica at MIN_PT, never fewer than HELD_LINES lines."""
    lines, line = 1, ""
    for word in s.split():
        trial = f"{line} {word}".strip()
        if line and fitz.get_text_length(trial, "helv", MIN_PT) > width - 4:
            lines, line = lines + 1, word
        else:
            line = trial
    return max(lines, HELD_LINES) * MIN_PT * 1.2 + 4


def first_front_header(imp, c):
    """y offsets (relative to c.y0) of each piece on card 1's front, and where its rows start."""
    lay = {"name": 1, "tier": 18, "bound": 27.5, "rule": 39}
    lay["held"] = lay["rule"] + 6
    lay["held_h"] = held_height("While held: " + imp["held"], c.width - 4.5)
    lay["pips"] = lay["held"] + lay["held_h"] + 4
    lay["rows"] = lay["pips"] + pip_rows(imp["free"] + imp["dotted"]) * (PIP + PIP_GAP) + 2
    return lay


WEAPON_W = 139.5 - 12  # widest weapon text: inner card width less Preview's field padding
LINE_H = MIN_PT * 1.2


def rune_lines(runes):
    """'Runes: ...' broken between runes, never inside one's name; no lines at all when there are no runes."""
    if not runes:
        return []
    lines, items = ["Runes:"], runes.split(" · ")
    for k, item in enumerate(items):
        trial = f"{lines[-1]} · {item}" if lines[-1] != "Runes:" else f"Runes: {item}"
        tail = " ·" if k < len(items) - 1 else ""  # a line that breaks ends in " ·"
        if lines[-1] != "Runes:" and fitz.get_text_length(trial + tail, "helv", MIN_PT) > WEAPON_W:
            lines[-1] += " ·"
            lines.append(item)
        else:
            lines[-1] = trial
    return lines


def block_height(imp):
    """The weapon block: the rule above it, the Strike line, the runes lines (if any)."""
    lines = rune_lines(imp["weapon"]["runes"])
    return 6 + 11 + (len(lines) * LINE_H + 5 if lines else 0)


CONT_FRONT_ROWS = 34   # later cards' fronts: name, "continued", rule
BACK_ROWS = 17         # backs: name, rule


def rows_area(c, top):
    return fitz.Rect(c.x0, c.y0 + top, c.x1, c.y1 - FOOTER_H)


def take(groups, height):
    """Whole rank groups, in order, that fit in height at ROW_MIN; returns (taken, rest)."""
    used, taken = 0.0, []
    for gr in groups:
        need = gr[1] * ROW_MIN + (GROUP_GAP if taken else 0)
        if used + need > height:
            break
        taken.append(gr)
        used += need
    return taken, groups[len(taken):]


def plan(imp):
    """[{'front': groups, 'back': groups, 'weapon'?: face}, ...] — one entry per physical card.

    Spells fill faces in order. The weapon block then takes the last face with room, latest card's back first: an
    empty back (under the emblem), or a face whose rows still fit at ROW_MIN beside it; failing that, one more card."""
    c = inner(front_body(0)[2])
    rest, cards = list(imp["slots"]), []
    while rest or not cards:
        top = first_front_header(imp, c)["rows"] if not cards else CONT_FRONT_ROWS
        front, rest = take(rest, rows_area(c, top).height)
        back, rest = take(rest, rows_area(c, BACK_ROWS).height)
        cards.append({"front": front, "back": back})
    need = block_height(imp)
    for n in range(len(cards) - 1, -1, -1):
        for face in ("back", "front"):
            groups = cards[n][face]
            if face == "back" and not groups:
                cards[n]["weapon"] = face
                return cards
            top = (first_front_header(imp, c)["rows"] if n == 0 else CONT_FRONT_ROWS) if face == "front" else BACK_ROWS
            rows = sum(k for _, k in groups) * ROW_MIN + GROUP_GAP * max(0, len(groups) - 1)
            if rows + need <= rows_area(c, top).height:
                cards[n]["weapon"] = face
                return cards
    cards.append({"front": [], "back": [], "weapon": "back"})
    return cards


def spell_rows(page, imp, base, groups, area):
    """Rank groups of fillable rows (spell over stats, cost at the right); rows grow up to ROW_MAX when there's room."""
    n = sum(k for _, k in groups)
    h = min(ROW_MAX, (area.height - GROUP_GAP * (len(groups) - 1)) / n)
    name_pt = min(11.0, 8.5 + (h - ROW_MIN) * 0.45)
    stats_pt = MIN_PT + min(0.75, (h - ROW_MIN) * 0.15)
    rank_w, cost_w = 12, 16
    y = area.y0
    for r, k in groups:
        top = y
        for s in range(k):
            sx0, cx0 = area.x0 + rank_w + 3, area.x1 - cost_w
            split = y + 0.5 + name_pt * 1.35
            f = f"{base}.r{r}s{s + 1}"
            v = imp["vals"]["spells"].get(r, {}).get(s + 1, {})
            for kind, rect, font, size, center in (
                    ("spell", fitz.Rect(sx0, y + 0.5, cx0 - 2, split), "TiBo", name_pt, False),
                    ("stats", fitz.Rect(sx0, split, cx0 - 2, y + h - 0.5), "Helv", stats_pt, False),
                    ("cost", fitz.Rect(cx0, y + 1, area.x1, y + h - 1), "TiBo", name_pt, True)):
                field(page, f"{f}.{kind}", rect, font, round(size, 2), center, v.get(kind, ""), imp, (r, s + 1, kind))
            page.draw_line((sx0, y + h), (area.x1, y + h), color=(0.7, 0.7, 0.7), width=0.4)
            y += h
        page.draw_line((area.x0 + rank_w, top + 1), (area.x0 + rank_w, y - 1), color=(0, 0, 0), width=0.8)
        rk, size = ("C", 8.5) if r == 0 else (str(r), 10)
        x = area.x0 + (rank_w - fitz.get_text_length(rk, "tibo", size)) / 2 - 1
        page.insert_text((x, (top + y) / 2 + size * 0.35), rk, fontsize=size, fontname="tibo")
        y += GROUP_GAP


def footer(page, c, imp, n, of):
    label = imp["hero"] + (f" · card {n} of {of}" if of > 1 else "")
    text(page, fitz.Rect(c.x0, c.y1 - FOOTER_H + 0.5, c.x1, c.y1 + 1), label, color=GREY)


def name_field(page, imp, n, face, c, y, size):
    field(page, f"{imp['slug']}.c{n}.{face}.name", fitz.Rect(c.x0 + 6, y, c.x1 - 6, y + size * 1.35), "TiBo", size,
          True, imp["vals"]["name"], imp, "name")


def draw_front(page, i, imp, card, n, of):
    dx, dy, body = front_body(i)
    for cover in (TITLE_RULES0, FOOTER_BOX0):
        page.draw_rect(cover + (dx, dy, dx, dy), color=None, fill=(1, 1, 1), overlay=True)
    c = inner(body)
    if n == 1:
        lay = first_front_header(imp, c)
        name_field(page, imp, n, "front", c, c.y0 + lay["name"], 12)
        text(page, fitz.Rect(c.x0, c.y0 + lay["tier"], c.x1, c.y0 + lay["tier"] + 10),
             f"{imp['tier']} · {imp['branch_name']} {imp['level']}")
        lead = "Bound to"
        lead_w, trait_w = g.text_width("body", lead, MIN_PT), 52
        x = (c.x0 + c.x1 - lead_w - 3 - trait_w) / 2
        yb = c.y0 + lay["bound"]
        page.insert_text((x, yb + 7.4), lead, fontsize=MIN_PT, **g.fontkw("body"))
        box = fitz.Rect(x + lead_w + 3, yb - 0.5, x + lead_w + 3 + trait_w, yb + 9.5)
        page.draw_rect(box, color=GREY, width=0.4, radius=0.25)  # radius: fraction of the shorter side
        field(page, f"{imp['slug']}.trait", box, "TiRo", 8, center=True, value=imp["vals"]["trait"], imp=imp, key="trait")
        double_rule(page, c.x0, c.x1, c.y0 + lay["rule"])
        held = fitz.Rect(c.x0, c.y0 + lay["held"], c.x1, c.y0 + lay["held"] + lay["held_h"])
        page.draw_rect(held, color=None, fill=(0.93, 0.93, 0.93))
        page.draw_line((held.x0, held.y0), (held.x0, held.y1), color=(0, 0, 0), width=1.6)
        field(page, f"{imp['slug']}.held", held + (2.5, 0, 0, 0), "Helv", MIN_PT, value="While held: " + imp["held"],
              imp=imp, key="held", multiline=True)
        pips(page, c.x0, c.x1, c.y0 + lay["pips"], imp["free"], imp["dotted"])
        top = lay["rows"]
    else:
        name_field(page, imp, n, "front", c, c.y0 + 1, 12)
        text(page, fitz.Rect(c.x0, c.y0 + 18, c.x1, c.y0 + 28), "continued", color=GREY)
        double_rule(page, c.x0, c.x1, c.y0 + 29)
        top = CONT_FRONT_ROWS
    if card["front"]:
        area = rows_area(c, top)
        area.y1 -= block_height(imp) if card.get("weapon") == "front" else 0
        n_rows = sum(k for _, k in card["front"])
        area.y1 = min(area.y1, area.y0 + n_rows * ROW_MAX + GROUP_GAP * len(card["front"]))
        spell_rows(page, imp, f"{imp['slug']}.c{n}.front", card["front"], area)
    if card.get("weapon") == "front":
        weapon_block(page, imp, c, None)
    footer(page, c, imp, n, of)


def draw_back(page, fields, i, imp, card, n, of):
    c = inner(back_body(fields, i))
    if card["back"]:
        name_field(page, imp, n, "back", c, c.y0 + 1, 10)
        page.draw_line((c.x0, c.y0 + 15), (c.x1, c.y0 + 15), color=(0, 0, 0), width=0.8)
        area = rows_area(c, BACK_ROWS)
        area.y1 -= block_height(imp) if card.get("weapon") == "back" else 0
        n_rows = sum(k for _, k in card["back"])
        area.y1 = min(area.y1, area.y0 + n_rows * ROW_MAX + GROUP_GAP * len(card["back"]))
        spell_rows(page, imp, f"{imp['slug']}.c{n}.back", card["back"], area)
    else:
        mid = (c.y0 + c.y1) / 2
        cx, side = (c.x0 + c.x1) / 2, 64  # a square box: keep_proportion stretches a square image to fill a wide one
        page.insert_image(fitz.Rect(cx - side / 2, mid - 50, cx + side / 2, mid + 14), filename=str(imp["emblem"]))
        name_field(page, imp, n, "back", c, mid + 20, 12)
    if card.get("weapon") == "back":
        weapon_block(page, imp, c, None if card["back"] else (c.y0 + c.y1) / 2 + 40)
    footer(page, c, imp, n, of)


def weapon_block(page, imp, c, y):
    """The Strike line over the wrapping runes field, at y (under the emblem) or, with y None, just above the footer."""
    if y is None:
        y = c.y1 - FOOTER_H - block_height(imp) + 6
        page.draw_line((c.x0 + 20, y - 3), (c.x1 - 20, y - 3), color=GREY, width=0.4)
    lines = rune_lines(imp["weapon"]["runes"])
    field(page, f"{imp['slug']}.weapon", fitz.Rect(c.x0, y, c.x1, y + 10), "Helv", MIN_PT, True,
          imp["weapon"]["strike"], imp, "weapon")
    if lines:
        field(page, f"{imp['slug']}.runes", fitz.Rect(c.x0, y + 10, c.x1, y + 10 + len(lines) * LINE_H + 5), "Helv",
              MIN_PT, True, "\n".join(lines), imp, "runes", multiline=True)


# ---------- typed values: carried over from the last print, overlaid by --fill ----------

def outputs(d, stem):
    return [d / f"{stem}.pdf", *sorted(d.glob(f"{stem} (Back) pg*.pdf"))]


def carry_over(imp):
    """Read every filled field the hero has on the previous sheets into imp['vals']."""
    vals = imp["vals"]
    for path in [p for p in outputs(OUT, STEM) if p.exists()]:
        for page in fitz.open(path):
            for w in page.widgets():
                parts, v = w.field_name.split("."), (w.field_value or "").strip()
                if parts[0] != imp["slug"] or not v:
                    continue
                m = re.fullmatch(r"r(\d+)s(\d+)", parts[-2]) if len(parts) > 2 else None
                if parts[-1] in ("name", "trait", "held", "weapon", "runes"):
                    if parts[-1] == "runes":
                        v = " · ".join(x.strip() for x in re.split(r"\s*·\s*|\n", re.sub(r"(?i)^runes:", "", v))
                                       if x.strip())
                    vals[parts[-1]] = vals[parts[-1]] or v
                elif m and parts[-1] in ("spell", "stats", "cost"):
                    vals["spells"].setdefault(int(m[1]), {}).setdefault(int(m[2]), {})[parts[-1]] = v


def overlay(imp, fill, source="--fill"):
    """Apply a fill entry (--fill or Pathbuilder): name/trait if given, and each rank listed replaces that rank's slots."""
    vals, open_ranks = imp["vals"], dict(imp["slots"])
    for key in ("name", "trait"):
        if key in fill:
            vals[key] = str(fill[key]).strip()
            imp["filled"].add(key)
    for rank, entries in (fill.get("spells") or {}).items():
        r = 0 if str(rank).lower() in ("c", "cantrip", "cantrips") else int(rank)
        if r not in open_ranks:
            PROBLEMS.append((True, f"{imp['hero']} ({source}): rank {r} isn't open at {imp['tier']}"))
            continue
        if len(entries) > open_ranks[r]:
            PROBLEMS.append((True, f"{imp['hero']} ({source}): {len(entries)} spells for rank {r}, "
                                   f"which has {open_ranks[r]} slot(s)"))
        vals["spells"][r] = {}
        for s, e in enumerate(entries[:open_ranks[r]], 1):
            e = {"spell": e} if isinstance(e, str) else e
            row = {k: str(e[k]).strip() for k in ("spell", "stats", "cost") if e.get(k) not in (None, "")}
            if row.get("spell") and not ("stats" in row and "cost" in row):  # fill in what the entry left out
                row = {**(look_up(imp, row["spell"], r, source)[0]), **row}
            vals["spells"][r][s] = row
            imp["filled"].update((r, s, k) for k in ("spell", "stats", "cost"))


# ---------- Pathbuilder: the implement's spells live in the "Other Spells (Staves etc)" caster ----------

ACTIONS = {"Single Action": "1 action", "Two Actions": "2 actions", "Three Actions": "3 actions",
           "Reaction": "reaction", "Free Action": "free action", "Single Action to Three Actions": "1 to 3 actions",
           "Single Action or Two Actions": "1 or 2 actions", "Single Action to Two Actions": "1 or 2 actions"}
GENERIC_TRAITS = {"cantrip", "concentrate", "manipulate", "uncommon", "rare", "unique", "nonlethal", "subtle", "attack",
                  "focus", "arcane", "divine", "occult", "primal"}  # never a binding trait


def feet(s):
    return re.sub(r"(\d+)[ -](?:feet|foot)", r"\1'", s)


def stats_line(spell):
    """'2 actions - 30' - burst 5' - Will', trimmed from the end until it fits the narrowest stats field."""
    parts = [ACTIONS.get(spell.get("actions") or "", (spell.get("actions") or "").lower())]
    if spell.get("range_raw"):
        parts.append(feet(spell["range_raw"]))
    if spell.get("area_raw"):
        m = re.fullmatch(r"(\d+)-foot (\w+)", spell["area_raw"])
        parts.append(f"{m[2]} {m[1]}'" if m else feet(spell["area_raw"]))
    if spell.get("saving_throw") or spell.get("defense"):
        parts.append(spell.get("saving_throw") or spell["defense"])
    parts = [x.replace("\u2019", "'") for x in parts if x]
    c = inner(front_body(0)[2])
    width = c.width - 12 - 3 - 16 - 2 - 4  # spell_rows: rank column, gap, cost column, gap; field padding
    while len(parts) > 1 and fitz.get_text_length(" - ".join(parts), "helv", MIN_PT + 0.75) > width:
        parts.pop()
    return " - ".join(parts)


def implement_casters(build):
    return [c for c in build.get("spellCasters", []) if c.get("name", "").startswith("Other Spells")]


def look_up(imp, name, r, source):
    """({spell, stats, cost}, binding-trait candidates) for a spell inscribed at rank r, from AoN.

    Cost is r on any list the hero casts from (a caster's tradition or spells, or a focus spell), r + 1 off it."""
    spell = g.fetch_aon(name, "spell")
    if not spell:
        PROBLEMS.append((False, f"{imp['hero']} ({source}): {name!r} not found on AoN; printed without stats"))
        return {"spell": name}, None
    build, other = imp["build"], implement_casters(imp["build"])
    own = [c for c in build.get("spellCasters", []) if not c.get("innate") and c not in other]
    traditions = {c.get("magicTradition", "").lower() for c in own}
    known = {n for c in own for rk in c.get("spells", []) for n in rk.get("list", [])}
    known |= {n for t in (build.get("focus") or {}).values() for a in t.values()
              for n in a.get("focusCantrips", []) + a.get("focusSpells", [])}
    on_list = spell["name"] in known or any(t.lower() in traditions for t in spell.get("tradition", []))
    row = {"spell": spell["name"], "stats": stats_line(spell), "cost": str(r + (0 if on_list else 1))}
    return row, {t.lower() for t in spell.get("trait", [])} - GENERIC_TRAITS


def pathbuilder(imp):
    """The implement's spells from Pathbuilder as a fill entry, with stats and cost from AoN; None if it lists none."""
    ranks = {int(rk["spellLevel"]): list(rk["list"]) for c in implement_casters(imp["build"])
             for rk in c.get("spells", []) if rk.get("list")}
    if not ranks:
        return None
    entry, shared = {"spells": {}}, None
    for r, names in sorted(ranks.items()):
        entry["spells"][str(r)] = rows = []
        for name in names:
            row, traits = look_up(imp, name, r, "pathbuilder")
            rows.append(row)
            if traits is not None:
                shared = traits if shared is None else shared & traits
    if shared and len(shared) == 1:
        entry["trait"] = shared.pop()
    return entry


def details(imp):
    """Apply the hero's entry in DETAILS (name, trait, custom held benefit); returns report lines."""
    entry = json.loads(DETAILS.read_text()).get(imp["slug"], {}) if DETAILS.exists() else {}
    notes = []
    for key in ("name", "trait"):
        v = (entry.get(key) or "").strip()
        if v:
            if imp["vals"][key] and imp["vals"][key] != v:
                notes.append(f"  REPLACED carried-over {key}: {imp['vals'][key]}")
            imp["vals"][key] = v
            imp["filled"].add(key)
    notes += weapon(imp, entry)
    unprefix = lambda t: re.sub(r"(?i)^while held:\s*", "", t.strip())
    held, typed = unprefix(entry.get("held") or ""), unprefix(imp["vals"]["held"])
    if held:
        imp["held"] = held.replace("{n}", str(held_bonus(imp["level"])))
        notes.append("  held benefit from branch-implements.json")
    elif typed and typed not in {HELD[imp["branch"]].format(n=n) for n in (1, 2, 3)}:
        imp["held"] = typed
        notes.append("  held benefit carried over as typed (save it to branch-implements.json, with {n}, to scale it)")
    return notes


# ---------- the implement as a weapon ----------

DICE = {"": 1, "striking": 2, "greaterStriking": 3, "majorStriking": 4}
STRIKING = {"striking": "striking", "greaterStriking": "greater striking", "majorStriking": "major striking"}
DAMAGE = {"B": "bludgeoning", "P": "piercing", "S": "slashing"}
STAT_KEYS = ("proficiency", "die", "damageType", "potency", "striking", "runes", "attack", "damageBonus")


def weapon(imp, entry):
    """Set imp['weapon'] (Strike line, runes text without the 'Runes:' label) and return report lines.

    Stats come from the Pathbuilder weapon DETAILS names (live: attack and runes follow every export), else from the
    stats stored beside that name, else from what was typed on the last print."""
    stored = entry.get("weapon") or {}
    name = stored.get("pathbuilder")
    live = next((w for w in imp["build"].get("weapons", []) if name and w.get("name") == name), None)
    if live:
        w = {"proficiency": live.get("prof", ""), "die": live.get("die", ""), "damageType": live.get("damageType", ""),
             "potency": live.get("pot", 0), "striking": live.get("str", ""), "runes": live.get("runes", []),
             "attack": live.get("attack"), "damageBonus": live.get("damageBonus", 0)}
        note = f"  weapon from Pathbuilder's {name!r}"
    elif any(k in stored for k in STAT_KEYS):
        w = stored
        note = "  weapon from branch-implements.json" + (f" (no {name!r} in Pathbuilder)" if name else "")
    else:
        imp["weapon"] = {"strike": imp["vals"]["weapon"], "runes": imp["vals"]["runes"]}
        return ([f"  weapon: no {name!r} in Pathbuilder and no stats stored"] if name else []) + \
               (["  weapon carried over as typed"] if imp["vals"]["weapon"] else [])
    imp["weapon"] = {"strike": strike_line(w), "runes": " · ".join(
        ([f"+{w['potency']}"] if w.get("potency") else []) + ([STRIKING[w["striking"]]] if w.get("striking") else [])
        + [r.lower() for r in w.get("runes") or []])}
    imp["filled"].update(("weapon", "runes"))
    return [f"{note}: {imp['weapon']['strike']}" + (f"; runes {imp['weapon']['runes']}" if imp["weapon"]["runes"] else "")]


def strike_line(w):
    """'Simple · Strike +4 · 1d4 bludgeoning'; drops the proficiency when the line won't fit at MIN_PT."""
    attack = f"Strike {w['attack']:+d}" if isinstance(w.get("attack"), int) else "Strike +?"
    dice = f"{DICE[w.get('striking') or '']}{w.get('die', '')}"
    bonus = f"+{w['damageBonus']}" if w.get("damageBonus") else ""
    damage = f"{dice}{bonus} {DAMAGE.get(w.get('damageType', ''), w.get('damageType', ''))}".strip()
    line = " · ".join(x for x in (w.get("proficiency", "").capitalize(), attack, damage) if x)
    if fitz.get_text_length(line, "helv", MIN_PT) > WEAPON_W:
        line = f"{attack} · {damage}"
    return line


def dropped(imp):
    """Carried-over values with no slot on the new cards."""
    open_ranks = dict(imp["slots"])
    return [f"rank {r} slot {s}: {v.get('spell', '')}" for r, row in imp["vals"]["spells"].items()
            for s, v in row.items() if v and (r not in open_ranks or s > open_ranks[r])]


# ---------- build ----------

def build(imps):
    """Every hero's cards in order, nine to a sheet, in OUT; returns the front PDF's path."""
    OUT.mkdir(parents=True, exist_ok=True)
    for old in outputs(OUT, STEM):
        old.unlink(missing_ok=True)
    cards = []
    for imp in imps:
        planned = plan(imp)
        cards += [(imp, card, n, len(planned)) for n, card in enumerate(planned, 1)]
    fronts = fitz.open()
    for sheet, start in enumerate(range(0, len(cards), 9), 1):
        chunk = cards[start:start + 9]
        doc = fitz.open(g.CARDS / "templates" / TEMPLATE)
        page = doc[0]
        for w in list(page.widgets()):
            page.delete_widget(w)
        for i, (imp, card, n, of) in enumerate(chunk):
            draw_front(page, i, imp, card, n, of)
        blank_unused(page, len(chunk))
        fronts.insert_pdf(doc)

        bdoc = fitz.open(g.CARDS / "templates" / TEMPLATE.replace(".pdf", " Backs.pdf"))
        bpage = bdoc[0]
        fields = {w.field_name: w.rect for w in bpage.widgets()}
        for w in list(bpage.widgets()):
            bpage.delete_widget(w)
        for i, (imp, card, n, of) in enumerate(chunk):
            draw_back(bpage, fields, i, imp, card, n, of)
        used = {(i // 3, 2 - i % 3 if g.MIRROR_BACKS else i % 3) for i in range(len(chunk))}
        for r in range(3):
            for col in range(3):
                if (r, col) not in used:
                    bpage.draw_rect(fields[f"p2_r{r+1}_c{col+1}_back"] + (-8, -26, 8, 16), color=None, fill=(1, 1, 1))
        times_bold(bdoc)
        bdoc.save(OUT / f"{STEM} (Back) pg{sheet}.pdf", garbage=4, deflate=True)
    times_bold(fronts)
    fronts.save(OUT / f"{STEM}.pdf", garbage=4, deflate=True)
    return OUT / f"{STEM}.pdf"


def blank_unused(page, used):
    for i in range(used, 9):
        r, c = divmod(i, 3)
        (x0, x1), (y0, y1) = g.FRONT_COLS[c], g.FRONT_ROWS[r]
        page.draw_rect(fitz.Rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3), color=None, fill=(1, 1, 1), overlay=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--fill", type=Path, help="JSON of spells (and names, traits) to prefill, keyed by hero")
    args = ap.parse_args()
    everyone = load_heroes()
    fills = {}
    if args.fill:
        for key, entry in json.loads(args.fill.read_text()).items():
            fills[match_hero(everyone, key)["slug"]] = entry
    imps = []
    for hero in [h for h in everyone if h["active"]]:
        imp, why = implement(hero)
        if not imp:
            print(f"skip  {hero['displayName']}: {why}" + (" (its --fill entry is unused)" if hero["slug"] in fills else ""))
            continue
        carry_over(imp)
        imp["notes"] = details(imp)
        before = {r: [v.get("spell", "") for _, v in sorted(row.items())] for r, row in imp["vals"]["spells"].items()}
        pb = pathbuilder(imp)
        if pb:
            if imp["vals"]["trait"]:
                pb.pop("trait", None)
            overlay(imp, pb, "pathbuilder")
            listed = "; ".join(f"{'C' if r == '0' else r}: {', '.join(x['spell'] for x in rows)}" for r, rows in pb["spells"].items())
            notes = [f"  pathbuilder {listed}" + (f"; bound to {pb['trait']} (the one trait every spell shares)" if "trait" in pb else "")]
            for r in map(int, pb["spells"]):
                old, new = [x for x in before.get(r, []) if x], [x["spell"] for x in pb["spells"][str(r)]]
                if old and old != new:
                    notes.append(f"  REPLACED carried-over {'C' if r == 0 else r}: {', '.join(old)}")
            imp["notes"] += notes
        if hero["slug"] in fills:
            overlay(imp, fills.pop(hero["slug"]))
        imps.append(imp)
    for slug in fills:
        PROBLEMS.append((True, f"--fill names {slug}, who isn't an active hero"))
    if not imps:
        sys.exit("no cards to build")
    for imp in imps:
        slots = " ".join(f"{'C' if r == 0 else r}x{k}" for r, k in imp["slots"])
        filled = sum(bool(v.get("spell")) for row in imp["vals"]["spells"].values() for v in row.values())
        print(f"card  {imp['hero']}: {imp['tier']} ({imp['branch_name']} {imp['level']}, emblem {imp['emblem'].name}), "
              f"slots {slots}, pips {imp['free']} solid + {imp['dotted']} dotted, {len(plan(imp))} card(s), "
              f"{filled} spell(s) prefilled")
        for n in imp.get("notes", []):
            print(n)
        for d in dropped(imp):
            print(f"  DROPPED {d} (no such slot any more)")
    print(f"wrote {build(imps).relative_to(ROOT)} and its back page(s)")
    for from_fill, msg in PROBLEMS:
        print(("PROBLEM " if from_fill else "LONG    ") + msg)
    if any(from_fill for from_fill, _ in PROBLEMS):
        sys.exit(2)


if __name__ == "__main__":
    main()
