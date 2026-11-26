#!/usr/bin/env python3
"""GM deck: Combat, NPCs and Campaign cards for one book of Strength of Thousands, "picture-first" layout.

Usage: python3 -I cards/generate_gm_cards.py [BOOK] [--preview DIR] [--no-tabs TAB ...]

BOOK (default: book1) names the content module cards/gm_<BOOK>.py, whose CARDS list holds the cards (gm_book1.py
gathers gm_book1_combat.py, gm_book1_npcs.py and gm_book1_campaign.py); art is read from
cards/gm/art/<tab>/<slug>.png (black-and-white pencil renders). Output goes to cards/gm/:
  GM <Book> - <Tab>.pdf               fronts, nine poker-size cards per letter page
  GM <Book> - <Tab> (Back) pgN.pdf    one back page per front page, columns mirrored for long-edge duplex
--preview DIR also writes a PNG of every page there, for checking the layout by eye.
--no-tabs TAB [...] also writes "GM <Book> - <Tab> (No Tabs).pdf" and its backs: the same cards with the tab cut
from the frame, for player handouts that shouldn't stick up in a deck box.

Layout (chosen from the prototype's three variants):
  front  title, subtitle, art on the top ~60% of the body, then a small "at a glance" band (stat table,
         affliction stage track, an NPC's quote, or a couple of key facts), traits/tags in the footer
  back   title, the full text as labelled paragraphs, ruled note lines in any space left over, source line

Tabs reuse the players' templates with the tab label swapped: Combat on the Spell template (left tab),
NPCs on the Action template (middle), Campaign on the Item template (right).

Text is 8pt and may shrink to the pipeline's legibility floor (generate_cards.FRONT_MIN, 7.25pt). Anything
that still doesn't fit is drawn smaller and listed at the end, so the content can be trimmed.
"""
import argparse
import importlib
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_cards as g  # noqa: E402  (slot geometry, fonts, MIRROR_BACKS, FRONT_MIN)

GM = g.CARDS / "gm"  # printable PDFs, plus the card art in gm/art/
TPL = g.CARDS / "templates"
TABS = {  # tab key: (template deck, tab label, label size)
    "combat": ("Spells", "Combat", 8.5),
    "npcs": ("Actions", "NPCs", 8.5),
    "campaign": ("Items", "Campaign", 7.0),
}
BASE_PT = 8.0
SCALE_LOW = g.FRONT_MIN / BASE_PT
ART_MAX = 0.80  # art takes whatever the at-a-glance band leaves, up to this share of the front body
NOTE_KINDS = {"npc", "location", "lore", "branch", "downtime", "rank"}  # backs that get ruled note lines
NOTE_GAP = 11  # pt between note lines

CSS = """
@font-face {font-family: tah; src: url(Tahoma.ttf);}
@font-face {font-family: tah; font-weight: bold; src: url("Tahoma Bold.ttf");}
@font-face {font-family: geo; src: url("Georgia Bold.ttf");}
* {margin: 0; padding: 0;}
body {font-family: tah; font-size: 8pt; line-height: 1.16;}
p {margin: 0 0 1.4pt 0;}
b {font-weight: bold;}
.c {text-align: center;}
.q {font-style: italic; text-align: center;}
.s {font-size: 6.8pt;}
.full {text-align: center; font-size: 6.8pt; margin-bottom: 2pt;}
table {border-collapse: collapse; width: 100%;}
td {border: 0.6pt solid black; text-align: center; padding: 0.8pt 0;}
td.l {text-align: left; padding-left: 3pt;}
"""
WARN = []
_ARCH = None


def archive():
    global _ARCH
    if _ARCH is None:
        _ARCH = fitz.Archive()
        _ARCH.add(str(g.FONT_DIR))
    return _ARCH


def html(page, rect, body, who):
    """Draw body in rect at 8pt, shrinking to the legibility floor; below that, draw anyway and log it."""
    spare, scale = page.insert_htmlbox(rect, body, css=CSS, archive=archive(), scale_low=SCALE_LOW)
    if spare < 0:
        spare, scale = page.insert_htmlbox(rect, body, css=CSS, archive=archive(), scale_low=0)
        WARN.append(f"{who}: shrunk to {BASE_PT * scale:.2f}pt")
    return spare, scale


def measure(rect, body):
    """Height the body needs at full size in a rect of this width (dry run on a scratch page)."""
    doc = fitz.open()
    page = doc.new_page(width=rect.width + 20, height=2000)
    spare, _ = page.insert_htmlbox(fitz.Rect(0, 0, rect.width, 2000), body, css=CSS, archive=archive(), scale_low=1)
    return 2000 - spare


def img(page, rect, path):
    """Fit an image into rect at its own aspect ratio, centred (keep_proportion isn't honoured on these pages)."""
    pix = fitz.Pixmap(str(path))
    scale = min(rect.width / pix.width, rect.height / pix.height)
    w, h = pix.width * scale, pix.height * scale
    cx, cy = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
    page.insert_image(fitz.Rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), filename=str(path), keep_proportion=False)


# ---------- content -> html ----------

def labelled(items):
    out = []
    for k, v in items:
        out.append(f"<p><b>{k}</b> {v}</p>" if k else f"<p>{v}</p>")
    return "".join(out)


def stat_table(stats):
    head = "".join(f"<td class='s'><b>{k}</b></td>" for k, _ in stats)
    vals = "".join(f"<td><b>{v}</b></td>" for _, v in stats)
    return f"<table><tr>{head}</tr><tr>{vals}</tr></table>"


def stage_track(stages):
    rows = "".join(f"<tr><td style='width:11pt'>&#9744;</td><td style='width:11pt'><b>{i}</b></td>"
                   f"<td class='l s'>{s}</td></tr>" for i, s in enumerate(stages, 1))
    return f"<table>{rows}</table>"


def band_html(c):
    """The small 'at a glance' block under the art."""
    parts = []
    if c.get("stats"):
        parts.append(stat_table(c["stats"]))
    if c.get("stages"):
        parts.append(stage_track(c["stages"]))
    if c.get("essence"):  # an NPC's roleplaying line: who they are and how they come across
        parts.append(f"<p class='q'>{c['essence']}</p>")
    if c.get("facts"):
        parts.append(labelled(c["facts"]))
    lines = c.get("lines") or []
    if lines:
        parts.append("<div style='margin-top:1.5pt'>" + "".join(f"<p class='c s'>{l}</p>" for l in lines) + "</div>")
    return "".join(parts)


def back_html(c):
    pre = f"<p class='full'>{c['fullname']}</p>" if c.get("fullname") else ""
    return pre + labelled(c["back"])


# ---------- drawing ----------

def front_slot(rects, i):
    t, body, foot = g.front_rects(rects, i)
    dy = t.y0 - 50
    return fitz.Rect(t.x0, 66 + dy, t.x1, 90 + dy), fitz.Rect(t.x0, 93 + dy, t.x1, 105 + dy), body, foot


def draw_front(page, rects, i, c, art_dir):
    title_r, sub_r, body, foot = front_slot(rects, i)
    g.fit_text(page, title_r, c["title"], "title", 14, align=1)
    g.fit_text(page, sub_r, c["subtitle"], "body", 9, align=1)
    one_line(page, foot + (4, 1, -4, -1), c["footer"])

    band = band_html(c)
    need = measure(body, band) if band else 0
    art_h = min(body.height * ART_MAX, body.height - need - 4)  # the band always gets the room it needs
    art_r = fitz.Rect(body.x0, body.y0, body.x1, body.y0 + art_h)
    path = art_dir / c["tab"] / f"{c['slug']}.png"
    if not path.exists():
        path = art_dir / "fallback.png"
        WARN.append(f"{c['title']}: no art, used the fallback")
    img(page, art_r, path)
    if band:
        html(page, fitz.Rect(body.x0, art_r.y1 + 3, body.x1, body.y1), band, f"{c['title']} (front)")


def draw_back(page, rects, i, c):
    r, col = divmod(i, 3)
    if g.MIRROR_BACKS:
        col = 2 - col
    title, text, cite = g.back_rects(rects[f"p2_r{r+1}_c{col+1}_back"])
    g.fit_text(page, title, c["title"], "title", 12, align=1)
    spare, _ = html(page, text, back_html(c), f"{c['title']} (back)")
    if c["kind"] in NOTE_KINDS and spare > NOTE_GAP * 2 + 6:
        y = text.y1 - spare + 9
        g.fit_text(page, fitz.Rect(text.x0, y, text.x1, y + 10), "Notes", "title", 7.5)
        y += 8 + NOTE_GAP
        while y <= text.y1:
            page.draw_line((text.x0, y), (text.x1, y), color=(0.55, 0.55, 0.55), width=0.4)
            y += NOTE_GAP
    label = f"Source: {c['cite']}"
    if g.text_width("body", label, 6) > cite.width:  # long citations drop the label rather than shrink past legibility
        label = c["cite"]
    one_line(page, cite, label)


def one_line(page, rect, text, size=6.5, floor=5.5):
    """Centred single line, shrunk until it fits the width."""
    while size > floor and g.text_width("body", text, size) > rect.width:
        size -= 0.25
    if g.text_width("body", text, size) > rect.width:
        WARN.append(f"too wide even at {floor}pt: {text}")
    page.insert_text((rect.x0 + (rect.width - g.text_width("body", text, size)) / 2, rect.y0 + rect.height / 2 + size * 0.35),
                     text, fontsize=size, **g.fontkw("body"))


def relabel(page, label, size):
    """Swap the template's tab text (Spell/Action/Item) for this tab's label, in place."""
    spans = [s for b in page.get_text("dict")["blocks"] for l in b.get("lines", []) for s in l["spans"]
             if s["text"].strip() in ("Spell", "Action", "Item")]
    for s in spans:
        page.add_redact_annot(fitz.Rect(s["bbox"]), fill=None)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    for s in spans:
        r = fitz.Rect(s["bbox"])
        w = fitz.get_text_length(label, "tibo", size)
        page.insert_text(((r.x0 + r.x1) / 2 - w / 2, s["origin"][1]), label, fontname="tibo", fontsize=size)


def template_page(path, label, size):
    doc = fitz.open(path)
    page = doc[0]
    rects = {w.field_name: w.rect for w in page.widgets()}
    for w in list(page.widgets()):
        page.delete_widget(w)
    relabel(page, label, size)
    return doc, page, rects


def build_tab(tab, cards, stem, art_dir, preview):
    deck, label, size = TABS[tab]
    for old in [GM / f"{stem} - {label}.pdf", *GM.glob(f"{stem} - {label} (Back) pg*.pdf")]:
        old.unlink(missing_ok=True)
    fronts = fitz.open()
    pages = [cards[i:i + 9] for i in range(0, len(cards), 9)]
    for n, chunk in enumerate(pages, 1):
        fdoc, fp, frects = template_page(TPL / f"Playing Card - {deck}.pdf", label, size)
        bdoc, bp, brects = template_page(TPL / f"Playing Card - {deck} Backs.pdf", label, size)
        for i, c in enumerate(chunk):
            draw_front(fp, frects, i, c, art_dir)
            draw_back(bp, brects, i, c)
        for i in range(len(chunk), 9):  # cover the frames of empty slots so no blank cards print
            r, col = divmod(i, 3)
            (x0, x1), (y0, y1) = g.FRONT_COLS[col], g.FRONT_ROWS[r]
            fp.draw_rect(fitz.Rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3), color=None, fill=(1, 1, 1), overlay=True)
            bc = 2 - col if g.MIRROR_BACKS else col
            bp.draw_rect(brects[f"p2_r{r+1}_c{bc+1}_back"] + (-8, -26, 8, 16), color=None, fill=(1, 1, 1), overlay=True)
        fronts.insert_pdf(fdoc)
        back_name = f"{stem} - {label} (Back) pg{n}.pdf"
        bdoc.save(GM / back_name, garbage=4, deflate=True)
        if preview:
            fp.get_pixmap(dpi=110).save(preview / f"{stem} - {label} - front {n}.png")
            bp.get_pixmap(dpi=110).save(preview / f"{stem} - {label} - back {n}.png")
    fronts.save(GM / f"{stem} - {label}.pdf", garbage=4, deflate=True)
    print(f"{label}: {len(cards)} cards on {len(pages)} pages -> {stem} - {label}.pdf + {len(pages)} back pages")


# ---------- lookup (used by generate_custom_cards.py) ----------

def books():
    """{book: module} for every GM book: a cards/gm_<book>.py module with STEM and CARDS (e.g. gm_book1 -> book1)."""
    out = {}
    for path in sorted(g.CARDS.glob("gm_book*.py")):
        mod = importlib.import_module(path.stem)
        if hasattr(mod, "STEM") and hasattr(mod, "CARDS"):
            out[path.stem.removeprefix("gm_")] = mod
    return out


def find(name, tab=None, book=None):
    """[(book, card)] whose title, full name or slug matches name (case-insensitive), optionally within one tab/book."""
    key = name.strip().lower()
    hits = []
    for bname, mod in books().items():
        if book and bname != book:
            continue
        for c in mod.CARDS:
            if tab and c["tab"] != tab:
                continue
            if key in {c["title"].lower(), (c.get("fullname") or "").lower()} or c["slug"] == g.slug(name):
                hits.append((bname, c))
    return hits


# ---------- tabless copies (player handouts) ----------

_PLAIN_TOP = {}


def plain_top(back=False):
    """PNG of slot 0's top edge with no tab, for a front or a back.

    Every deck shares one frame (the three front templates differ only in where the tab sits, and so do the three
    back templates), so the edge is built once from the Item template, whose tab sits off to one side: its clean
    half is mirrored onto the other half, which works because the frame is symmetric about the slot's centre line."""
    if back not in _PLAIN_TOP:
        import io
        from PIL import Image, ImageOps
        page = fitz.open(TPL / ("Playing Card - Items Backs.pdf" if back else "Playing Card - Items.pdf"))[0]
        clip = g.TAB_CLIP
        label_x = page.get_text("words", clip=clip)[0][0]
        pix = page.get_pixmap(dpi=600, clip=clip, alpha=False)
        im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        half = im.width // 2
        if label_x > (clip.x0 + clip.x1) / 2:  # tab on the right: keep the left half
            im.paste(ImageOps.mirror(im.crop((0, 0, half, im.height))), (im.width - half, 0))
        else:
            im.paste(ImageOps.mirror(im.crop((im.width - half, 0, im.width, im.height))), (0, 0))
        buf = io.BytesIO()
        im.save(buf, "PNG")
        _PLAIN_TOP[back] = buf.getvalue()
    return _PLAIN_TOP[back]


def strip_tabs(page, slots, back=False):
    """Give each (row, column) slot on a front or back page a plain top edge. For a back, pass the mirrored column."""
    png = plain_top(back)
    for r, c in slots:
        dx, dy = g.FRONT_COLS[c][0] - g.FRONT_COLS[0][0], g.FRONT_ROWS[r][0] - g.FRONT_ROWS[0][0]
        dest = g.TAB_CLIP + (dx, dy, dx, dy)
        page.draw_rect(dest, color=None, fill=(1, 1, 1), overlay=True)
        page.insert_image(dest, stream=png, overlay=True)


def untabbed_copy(tab, n_cards, stem):
    """'<stem> - <Tab> (No Tabs).pdf' and its back pages: the same cards with plain tops, for handing out."""
    _, label, _ = TABS[tab]
    src = fitz.open(GM / f"{stem} - {label}.pdf")
    for old in GM.glob(f"{stem} - {label} (No Tabs)*.pdf"):
        old.unlink()
    for n, page in enumerate(src, 1):
        used = range(min(9, n_cards - (n - 1) * 9))
        strip_tabs(page, [divmod(i, 3) for i in used])
        back = fitz.open(GM / f"{stem} - {label} (Back) pg{n}.pdf")
        mirror = (lambda c: 2 - c) if g.MIRROR_BACKS else (lambda c: c)
        strip_tabs(back[0], [(i // 3, mirror(i % 3)) for i in used], back=True)
        back.save(GM / f"{stem} - {label} (No Tabs) (Back) pg{n}.pdf", garbage=4, deflate=True)
    src.save(GM / f"{stem} - {label} (No Tabs).pdf", garbage=4, deflate=True)
    print(f"{label}: tabless copy -> {stem} - {label} (No Tabs).pdf + {len(src)} back pages")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("book", nargs="?", default="book1")
    ap.add_argument("--preview", type=Path)
    ap.add_argument("--no-tabs", nargs="*", default=[], metavar="TAB",
                    help="also write a tabless copy of these tabs (e.g. campaign), for player handouts")
    args = ap.parse_args()
    mod = importlib.import_module(f"gm_{args.book}")
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
    slugs = [c["slug"] for c in mod.CARDS]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    if dupes:
        sys.exit(f"duplicate slugs: {sorted(dupes)}")
    for tab in TABS:
        cards = [c for c in mod.CARDS if c["tab"] == tab]
        if cards:
            build_tab(tab, cards, mod.STEM, GM / "art", args.preview)
            if tab in args.no_tabs:
                untabbed_copy(tab, len(cards), mod.STEM)
    print("\n".join(["", "Needs trimming:"] + WARN) if WARN else "\nEverything fits at 7.25pt or larger.")


if __name__ == "__main__":
    main()
