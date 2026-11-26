#!/usr/bin/env python3
"""PROTOTYPE — throwaway. Three competing layouts for the GM deck (Combat / NPCs / Campaign tabs).

Question this answers: what should GM cards look like on the existing playing-card templates?
Each variant is one front page + one back page with the same nine sample cards:
  row 1 Combat   (Spells template, tab relabelled): creature, hazard, affliction
  row 2 NPCs     (Actions template):                 student w/ portrait, teacher w/ portrait, NPC with no art
  row 3 Campaign (Items template):                   branch, location, lore

Variants (structurally different, not restyles):
  A  Ledger        — text-first. Front is a dense labelled reference; art goes on the back.
  B  Picture-first — art (or a big visual: stat band, stage track) dominates the front; all text on the back.
  C  Sidebar       — front split into a narrow left rail (stat boxes / portrait / key facts) and a text column.

Run:  python3 -I cards/prototype_gm_card_layouts.py OUT_DIR
Content is hard-coded sample data from Kindled Magic; nothing here is production code.
"""
import sys
from io import BytesIO
from pathlib import Path

import fitz
import numpy as np
from PIL import Image, ImageFilter, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_cards as g  # noqa: E402  (reuse rect maths + MIRROR_BACKS)

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
ROOT = g.ROOT
TPL = g.CARDS / "templates"
SCRATCH = OUT.parent  # pencil portraits made earlier this session live beside OUT
BOOK1 = Path.home() / "Dropbox/Gaming Books/Pathfinder/Strength of Thousands/strength-of-thousands-1-kindled-magic_compress.pdf"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")

# ---------- art (pencil-darker, as chosen) ----------

def pencil(img: Image.Image, px=360) -> Image.Image:
    gimg = ImageOps.autocontrast(img.convert("L").resize((px, px), Image.LANCZOS), cutoff=1)
    a = np.asarray(gimg, float)
    b = np.asarray(ImageOps.invert(gimg).filter(ImageFilter.GaussianBlur(6)), float)
    d = np.clip(a * 255 / np.maximum(255 - b, 1), 0, 255) / 255
    d = np.clip((d - 0.25) / 0.75, 0, 1) ** 1.8 * 255
    d[d > 232] = 255
    return Image.fromarray(d.astype("uint8"))


def square_on_white(im: Image.Image, pad=0.06) -> Image.Image:
    box = ImageOps.invert(im.convert("L")).point(lambda v: 255 if v > 12 else 0).getbbox() or (0, 0, *im.size)
    im = im.crop(box)
    side = int(max(im.size) * (1 + 2 * pad))
    out = Image.new("RGB", (side, side), "white")
    out.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
    return out


def book_image(xref):
    doc = fitz.open(BOOK1)
    b = doc.extract_image(xref)
    im = Image.open(BytesIO(b["image"])).convert("RGB")
    if b.get("smask"):
        a = Image.open(BytesIO(doc.extract_image(b["smask"])["image"])).convert("L").resize(im.size)
        bg = Image.new("RGB", im.size, "white")
        bg.paste(im, mask=a)
        im = bg
    return im


ART = OUT / "art"
ART.mkdir(exist_ok=True)
pencil(square_on_white(book_image(1667))).save(ART / "gnagrif.png")          # Kindled Magic p83
emblem = Image.open(ROOT / "reference/images/branches/rain-scribes.jpg")
em = ImageOps.autocontrast(emblem.convert("L"), cutoff=1)
Image.frombytes("L", em.size, em.tobytes()).save(ART / "rain-scribes.png")  # drop the RGB ICC profile
for slug, src in [("haibram", SCRATCH / "bw/haibram-thodja--pencil-darker.png"),
                  ("koride", SCRATCH / "portraits/faculty/koride-ulawa--pencil-darker.png")]:
    Image.open(src).save(ART / f"{slug}.png")

# ---------- sample cards (Kindled Magic) ----------

A1, A2, R = "◆", "◆◆", "⤾"  # action glyphs (rendered in text; production would use the action PNGs)

CARDS = [
    # --- Combat ---
    dict(kind="creature", title="Gnagrif", subtitle="Creature 2", footer="Uncommon, NE, Tiny, Fey, Gremlin",
         art="gnagrif.png", cite="Kindled Magic pg. 83",
         stats=[("AC", "18"), ("HP", "35"), ("Fort", "+9"), ("Ref", "+10"), ("Will", "+5"), ("Per", "+7")],
         front=[("Speed", "20 ft, burrow 10, climb 10"),
                ("Melee " + A1, "light hammer +10 (agile), 1d6+4 B"),
                ("Ranged " + A1, "light hammer +10 (thrown 20 ft), 1d6+4 B"),
                ("Stomp Around " + A1, "its square + adjacent empty squares become difficult terrain (not for it)"),
                ("Soften Stone " + R, "foe Strides/Steps into adjacent difficult terrain: DC 18 Reflex or prone")],
         back=[("Weakness", "cold iron 3"),
               ("Lurk " + A2, "melds into adjacent stone: Take Cover, Hide"),
               ("Eat Rocks " + A1, "2d4+2 to objects, ignores Hardness 2"),
               ("Spells", "DC 16: <i>shatter</i>, <i>speak with animals</i>"),
               ("Tactics", "Stomp, then Soften Stone whoever steps in")]),
    dict(kind="hazard", title="Centipede Carcasses", subtitle="Hazard 5 · Complex", footer="Complex, Mechanical, Trap",
         art=None, cite="Kindled Magic pg. 50",
         stats=[("Stealth", "+11"), ("AC", "22"), ("Fort", "+15"), ("Ref", "+9"), ("Hard", "12"), ("HP", "20")],
         front=[("Volley of Legs " + R, "a carcass is touched: everyone within 30 ft takes 4d4 P (DC 22 basic Reflex); area becomes difficult terrain. Roll initiative."),
                ("Routine " + A1, "everyone within 30 ft of a live carcass takes 6d4 P (DC 22 basic Reflex)"),
                ("Disable", "DC 23 Nature (trained) or DC 21 Thievery (expert), each of 3 carcasses")],
         back=[("Description", "Three giant centipede carcasses rigged with wire springs that fling sharpened legs around the room."),
               ("Per carcass", "Hardness 12, HP 20 (BT 10); immune to crits, precision, object immunities"),
               ("Legs on the floor", "Striding more than 10 ft through the area: DC 20 Acrobatics or 1d4 P"),
               ("Ends", "when all three are disabled or expended, or after 10 rounds")]),
    dict(kind="affliction", title="Sleeping Sickness", subtitle="Disease · DC 18 Fort", footer="Disease",
         art=None, cite="Kindled Magic pg. 81 (giant tsetse fly)",
         stages=["enfeebled 1", "enfeebled 1 + drained 1", "unconscious", "unconscious", "dead"], interval="1 day",
         front=[("Source", "giant tsetse fly proboscis Strike")],
         back=[("Each interval", "Fort save. Crit success −2 stages; success −1; failure +1; crit failure +2."),
               ("Stage 1 cured", "below stage 1 the disease ends"),
               ("At the table", "lasts days: keep this card out after the fly is dead")]),
    # --- NPCs ---
    dict(kind="npc", title="Haibram", fullname="Haibram Thodja", subtitle="Dwarf · Rain-Scribe initiate", footer="Spire Dorm · Rain-Scribe",
         art="haibram.png", cite="Kindled Magic pg. 71",
         quote="“Any chicken that comes too close to me is endangered.”",
         front=[("Is", "Mbe’ke dwarf daredevil; hang-glides; fights with wind as much as a weapon"),
                ("Wants", "an open secret: the Tempest-Sun Mages, and fire. Hasn’t committed.")],
         back=[("Likes", "Koride’s teaching. Drinks with Chizire; spars with Esi and Mariama."),
               ("Classroom Advantage", "Cram for Rain-Scribe classes: Study three times, not twice"),
               ("Uncommon rules", "<i>airburst</i> (spell 1)"),
               ("Find him", "Spire Dorm; the Sparring Field"),
               ("Notes", "<br>______________________")]),
    dict(kind="npc", title="Koride", fullname="Koride Ulawa", subtitle="Human · Rain-Scribe teacher", footer="Faculty · Rain-Scribe",
         art="koride.png", cite="Kindled Magic pg. 30",
         quote="“Premature conclusions are the bane of logical evaluation.”",
         front=[("Is", "best entomologist in generations; loves fungus, decay, insects"),
                ("Flaws", "shrugs off safety rules, skips commitments, indulges favorites")],
         back=[("Wants", "specimens, gathered by her newest students"),
               ("Likes / dislikes", "Anchor Root, Haibram, Chizire like her. Esi despises her."),
               ("Find her", "Heron Archives"),
               ("Offers", "classes; errands (Bug Problems)"),
               ("Notes", "<br>______________________")]),
    dict(kind="npc", title="Janatimo", fullname="Janatimo", subtitle="Half-elf · Uzunjati lore-speaker", footer="Faculty · Learned One",
         art=None, cite="Kindled Magic pg. 59",
         quote="Takulu’s mentor; “rarely stays in one place for long.”",
         front=[("Is", "itinerant storyteller; one of the cleverest lore-speakers"),
                ("Role", "the expert Takulu sends for when a mystery outgrows him")],
         back=[("Arrives", "start of Book 2"),
               ("Find him", "on the road, mostly"),
               ("Notes", "<br>______________________<br>______________________")]),
    # --- Campaign ---
    dict(kind="branch", title="Rain-Scribes", subtitle="Branch · Adaptability", footer="Medicine, Nature, Survival",
         art="rain-scribes.png", cite="Kindled Magic pg. 66",
         facts=[("Virtue", "Adaptability"), ("Study", "Medicine, Nature, Survival"), ("Lore", "a terrain")],
         front=[("Creed", "admit the error, update the theory; help travelers through uncertain country"),
                ("Animal", "Golden Snake, the Tireless Guide (Tireless Hall)")],
         back=[("Teacher", "Koride Ulawa"),
               ("Students", "Anchor Root (Study crit fail → fail), Haibram (Cram 3×)"),
               ("Branch feats", "7 Sustenance · 12 Mobility · 20 Magical Paragon; general feat at 8: Fleet"),
               ("Implement traits", "animal, plant, healing (or water/air)")]),
    dict(kind="location", title="Heron Archives", subtitle="Campus location", footer="Black Heron building",
         art=None, cite="Kindled Magic pg. 30",
         facts=[("Who", "Koride, Takulu"), ("Era", "Jatembe’s first ten")],
         front=[("What", "one of the ten original buildings, named for Black Heron of the Ten Magic Warriors"),
                ("Who’s here", "Koride’s office; Takulu’s office on the top floor")],
         back=[("Koride’s office", "heavy curtains, low oil lamps, glass cases of insects and reptiles, a surly vulture in a hanging cage"),
               ("Sneaking in", "DC 15 Stealth, or DC 15 Deception to pass as a regular"),
               ("Notes", "<br>______________________<br>______________________")]),
    dict(kind="lore", title="Jatembe & the Ten", subtitle="Lore · Society / Academia Lore", footer="Recall Knowledge",
         art=None, cite="GM-set DCs",
         dcs=[("15", "Old-Mage Jatembe and the Ten Magic Warriors rekindled wizardry after Earthfall."),
              ("20", "Their students built the Magaambya; the first ten buildings each bear one Warrior’s name."),
              ("25", "The Elephant’s Chronicles tell it: snake, leopard, spider, hyena, elephant.")],
         front=[], back=[("Where to learn more", "Archhorn Library; the tower mosaics"),
                         ("Notes", "<br>______________________<br>______________________")]),
]
ROW_DECK = {0: ("Spells", "Combat"), 1: ("Actions", "NPCs"), 2: ("Items", "Campaign")}
TAB_SIZE = {"Combat": 8.5, "NPCs": 8.5, "Campaign": 7.0}

# ---------- html helpers ----------

ARCH = fitz.Archive()
ARCH.add(str(FONT_DIR))
ARCH.add(str(ART))
CSS = """
@font-face {font-family: tah; src: url(Tahoma.ttf);}
@font-face {font-family: tah; font-weight: bold; src: url("Tahoma Bold.ttf");}
@font-face {font-family: geo; src: url("Georgia Bold.ttf");}
* {margin: 0; padding: 0;}
body {font-family: tah; font-size: 8pt; line-height: 1.18;}
p {margin: 0 0 1.5pt 0;}
b {font-weight: bold;}
.c {text-align: center;}
.q {font-style: italic; text-align: center;}
.h {font-family: geo; font-size: 7pt; letter-spacing: 0.6pt; border-bottom: 0.6pt solid black; margin: 3pt 0 1.5pt 0;}
.big {font-family: geo; font-size: 13pt;}
.small {font-size: 6.5pt;}
table {border-collapse: collapse; width: 100%;}
td {border: 0.6pt solid black; text-align: center; padding: 1pt 0;}
"""
WARN = []


def html(page, rect, body, scale_low=0.9, who=""):
    """8pt text, allowed down to ~7.2pt (the pipeline's legibility floor). If it still won't fit, draw it anyway
    at whatever size fits and log it, so an overflow is visible instead of silently blank."""
    spare, scale = page.insert_htmlbox(rect, body, css=CSS, archive=ARCH, scale_low=scale_low)
    if spare < 0:
        spare, scale = page.insert_htmlbox(rect, body, css=CSS, archive=ARCH, scale_low=0)
        WARN.append(f"too long, shrunk to {8 * scale:.1f}pt: {who}")
    return scale


def lines_html(items):
    return "".join(f"<p><b>{k}</b> {v}</p>" for k, v in items)


def headed_html(items):
    return "".join(f"<div class='h'>{k.upper()}</div><p>{v}</p>" for k, v in items)


def stat_line(stats):
    return " · ".join(f"<b>{k}</b> {v}" for k, v in stats)


def stat_table(stats):
    head = "".join(f"<td class='small'><b>{k}</b></td>" for k, _ in stats)
    vals = "".join(f"<td><b>{v}</b></td>" for _, v in stats)
    return f"<table><tr>{head}</tr><tr>{vals}</tr></table>"


def stage_track(card, big=False):
    rows = "".join(f"<tr><td style='width:14pt'>&#9744;</td><td style='width:14pt'><b>{i}</b></td>"
                   f"<td style='text-align:left; padding-left:3pt'>{s}</td></tr>" for i, s in enumerate(card["stages"], 1))
    return f"<table>{rows}</table><p class='c small'>interval {card['interval']}</p>"


def img(page, rect, name):
    # keep_proportion isn't honoured on these template pages, so fit a centred square ourselves (all art is square)
    side = min(rect.width, rect.height)
    cx, cy = (rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2
    page.insert_image(fitz.Rect(cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2),
                      filename=str(ART / name), keep_proportion=False)


def placeholder(page, rect, text):
    page.draw_rect(rect, color=(0.6, 0.6, 0.6), width=0.5, dashes="[2 2] 0")
    html(page, rect + (0, rect.height / 2 - 10, 0, 0), f"<p class='c small'>{text}</p>")

# ---------- slot geometry (from the real templates) ----------

def front_slot(rects, i):
    t, body, foot = g.front_rects(rects, i)
    dy = t.y0 - 50
    return (fitz.Rect(t.x0, 66 + dy, t.x1, 90 + dy), fitz.Rect(t.x0, 93 + dy, t.x1, 105 + dy), body, foot)


def chrome(page, rects, i, card):
    title_r, sub_r, body, foot = front_slot(rects, i)
    g.fit_text(page, title_r, card["title"], "title", 14, align=1)
    g.fit_text(page, sub_r, card["subtitle"], "body", 9, align=1)
    g.fit_text(page, foot + (2, 1, -2, -1), card["footer"], "body", 6.5, align=1, vcenter=True)
    return body


def back_title(page, box, card):
    t, text, cite = g.back_rects(box)
    g.fit_text(page, t, card["title"], "title", 12, align=1)
    g.fit_text(page, cite, f"Source: {card['cite']}", "body", 6.5, align=1, vcenter=True)
    return text

# ---------- Variant A: Ledger (text-first) ----------

def a_front(page, body, c):
    parts = []
    if c.get("fullname") and c["fullname"] != c["title"]:
        parts.append(f"<p class='c small'>{c['fullname']}</p>")
    if c.get("stats"):
        parts.append(f"<p class='c'>{stat_line(c['stats'])}</p>")
    if c.get("stages"):
        parts.append(f"<p><b>Interval</b> {c['interval']}</p>" + "".join(
            f"<p><b>Stage {i}</b> {s}</p>" for i, s in enumerate(c["stages"], 1)))
    if c.get("facts"):
        parts.append(lines_html(c["facts"]))
    if c.get("dcs"):
        parts.append("".join(f"<p><b>DC {d}</b> {t}</p>" for d, t in c["dcs"]))
    if c.get("quote"):
        parts.append(f"<p class='q'>{c['quote']}</p>")
    parts.append(lines_html(c["front"]))
    html(page, body, "".join(parts), who=f"A front {c['title']}")


def a_back(page, text, c):
    if c.get("art"):
        side = 46
        mid = (text.x0 + text.x1) / 2
        img(page, fitz.Rect(mid - side / 2, text.y0, mid + side / 2, text.y0 + side), c["art"])
        # text flows below the art; keep it simple for a prototype
        text = fitz.Rect(text.x0, text.y0 + side + 2, text.x1, text.y1)
    html(page, text, lines_html(c["back"]), who=f"A back {c['title']}")

# ---------- Variant B: Picture-first ----------

def b_front(page, body, c):
    split = body.y0 + body.height * 0.66
    top = fitz.Rect(body.x0, body.y0, body.x1, split)
    low = fitz.Rect(body.x0, split + 2, body.x1, body.y1)
    if c.get("art"):
        img(page, top, c["art"])
    elif c.get("stages"):
        html(page, top, f"<p class='c big'>Stages</p>{stage_track(c, big=True)}", who=f"B top {c['title']}")
    elif c.get("dcs"):
        html(page, top, "".join(f"<p class='c big'>DC {d}</p>" for d, _ in c["dcs"]) +
             "<p class='c small'>(what each reveals: see reverse)</p>", who=f"B top {c['title']}")
    else:
        placeholder(page, top + (14, 4, -14, -4), "no art")
    if c.get("stats"):
        html(page, low, stat_table(c["stats"]), who=f"B low {c['title']}")
    elif c.get("quote"):
        html(page, low, f"<p class='q'>{c['quote']}</p>", who=f"B low {c['title']}")
    elif c.get("facts"):
        html(page, low, lines_html(c["facts"][:2]), who=f"B low {c['title']}")
    else:
        html(page, low, lines_html(c["front"][:1]), who=f"B low {c['title']}")


def b_back(page, text, c):
    items = list(c["front"]) + list(c["back"])
    pre = ""
    if c.get("stages"):
        pre = "".join(f"<p><b>Stage {i}</b> {s}</p>" for i, s in enumerate(c["stages"], 1))
    if c.get("dcs"):
        pre = "".join(f"<p><b>DC {d}</b> {t}</p>" for d, t in c["dcs"])
    if c.get("fullname") and c["fullname"] != c["title"]:
        pre = f"<p class='c small'>{c['fullname']}</p>" + pre
    html(page, text, pre + lines_html(items), who=f"B back {c['title']}")

# ---------- Variant C: Sidebar ----------

RAIL = 40


def c_front(page, body, c):
    rail = fitz.Rect(body.x0, body.y0, body.x0 + RAIL, body.y1)
    main = fitz.Rect(body.x0 + RAIL + 5, body.y0, body.x1, body.y1)
    page.draw_line(fitz.Point(rail.x1 + 2, rail.y0), fitz.Point(rail.x1 + 2, rail.y1), color=(0, 0, 0), width=0.6)
    if c.get("stats"):
        rail_html = "".join(f"<p class='c'><span class='small'>{k}</span><br><b>{v}</b></p>" for k, v in c["stats"])
        html(page, rail, rail_html, who=f"C rail {c['title']}")
    elif c.get("stages"):
        html(page, rail, "".join(f"<p class='c'><b>{i}</b><br><span class='small'>{s}</span></p>"
                                 for i, s in enumerate(c["stages"], 1)), who=f"C rail {c['title']}")
    elif c.get("art"):
        img(page, fitz.Rect(rail.x0, rail.y0, rail.x1, rail.y0 + RAIL), c["art"])
        tags = c.get("facts") or [("", c["footer"])]
        html(page, fitz.Rect(rail.x0, rail.y0 + RAIL + 3, rail.x1, rail.y1),
             "".join(f"<p class='c small'><b>{k}</b><br>{v}</p>" for k, v in tags), who=f"C rail tags {c['title']}")
    elif c.get("dcs"):
        html(page, rail, "".join(f"<p class='c'><span class='small'>DC</span><br><b>{d}</b></p>" for d, _ in c["dcs"]))
    else:
        placeholder(page, fitz.Rect(rail.x0, rail.y0, rail.x1, rail.y0 + RAIL), "no art")
        if c.get("facts"):
            html(page, fitz.Rect(rail.x0, rail.y0 + RAIL + 3, rail.x1, rail.y1),
                 "".join(f"<p class='c small'><b>{k}</b><br>{v}</p>" for k, v in c["facts"]))
    parts = []
    if c.get("quote"):
        parts.append(f"<p class='q'>{c['quote']}</p>")
    if c.get("dcs"):
        parts.append("".join(f"<p>{t}</p>" for _, t in c["dcs"]))
    if c.get("stages"):
        parts.append(f"<p><b>Interval</b> {c['interval']}</p>")
    parts.append(lines_html(c["front"]))
    html(page, main, "".join(parts), who=f"C main {c['title']}")


def c_back(page, text, c):
    pre = f"<p class='c small'>{c['fullname']}</p>" if c.get("fullname") and c["fullname"] != c["title"] else ""
    html(page, text, pre + headed_html(c["back"]), who=f"C back {c['title']}")


VARIANTS = {"A": ("Ledger", a_front, a_back), "B": ("Picture-first", b_front, b_back), "C": ("Sidebar", c_front, c_back)}

# ---------- template plumbing ----------

def relabel(page, label):
    spans = [s for b in page.get_text("dict")["blocks"] for l in b.get("lines", []) for s in l["spans"]
             if s["text"].strip() in ("Spell", "Action", "Item")]
    for s in spans:
        page.add_redact_annot(fitz.Rect(s["bbox"]), fill=None)
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_NONE)
    size = TAB_SIZE[label]
    for s in spans:
        r = fitz.Rect(s["bbox"])
        w = fitz.get_text_length(label, "tibo", size)
        page.insert_text(((r.x0 + r.x1) / 2 - w / 2, s["origin"][1]), label, fontname="tibo", fontsize=size)


def deck_page(path, label):
    doc = fitz.open(path)
    page = doc[0]
    rects = {w.field_name: w.rect for w in page.widgets()}
    for w in list(page.widgets()):
        page.delete_widget(w)
    relabel(page, label)
    return doc, page, rects


def front_clip(i):
    (x0, x1), (y0, y1) = g.FRONT_COLS[i % 3], g.FRONT_ROWS[i // 3]
    return fitz.Rect(x0 - 4, y0 - 6, x1 + 4, y1 + 2.5)


def build(key):
    name, front_fn, back_fn = VARIANTS[key]
    fronts, backs = fitz.open(), fitz.open()
    fpage = fronts.new_page(width=612, height=792)
    bpage = backs.new_page(width=612, height=792)
    for row, (deck, label) in ROW_DECK.items():
        fdoc, fp, frects = deck_page(TPL / f"Playing Card - {deck}.pdf", label)
        bdoc, bp, brects = deck_page(TPL / f"Playing Card - {deck} Backs.pdf", label)
        clips = []
        for col in range(3):  # draw the whole row first: show_pdf_page caches the source page on first copy
            i = row * 3 + col
            card = CARDS[i]
            body = chrome(fp, frects, i, card)
            front_fn(fp, body, card)
            bc = 2 - col if g.MIRROR_BACKS else col
            box = brects[f"p2_r{row+1}_c{bc+1}_back"]
            back_fn(bp, back_title(bp, box, card), card)
            clips.append((front_clip(i), box + (-8, -26, 8, 16)))
        for fclip, bclip in clips:
            fpage.show_pdf_page(fclip, fdoc, 0, clip=fclip)
            bpage.show_pdf_page(bclip, bdoc, 0, clip=bclip)
    stem = f"Prototype {key} - {name}"
    fronts.save(OUT / f"{stem} - Fronts.pdf", garbage=4, deflate=True)
    backs.save(OUT / f"{stem} - Backs.pdf", garbage=4, deflate=True)
    fpage.get_pixmap(dpi=110).save(OUT / f"{stem} - Fronts.png")
    bpage.get_pixmap(dpi=110).save(OUT / f"{stem} - Backs.png")
    print(f"{key} {name}: {stem} - Fronts/Backs .pdf/.png")


for k in VARIANTS:
    build(k)
print("\n".join(WARN) or "no overflows")
