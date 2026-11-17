#!/usr/bin/env python3
"""Card generator (test run) for one hero.

Usage: python3 -I cards/generate_cards.py [hero-id|all] [spells|items|actions|all] [--diff]

No hero means all active heroes (heroes/index.json, minus "active": false); no deck means all three.

--diff compares against the hero's last recorded run (cards/cache/runs/): it rebuilds the full PDFs
if anything printed changed, and also writes a timestamped "(changes ...)" PDF holding only the
new and changed cards. Removed cards and source-text-only changes are reported in text.

Cards whose text cannot fit on the front at FRONT_MIN pt need an LLM-written summary
(front + back). The script writes those cards to cards/cache/pending/<hero>-spells.json and
exits with status 2; fill in the "front" / "back" fields and run it again. Accepted summaries
are cached in cards/cache/summaries/spell/ and reused until the AoN text changes.
"""
import datetime
import hashlib
import json
import re
import sys
import urllib.request
from collections import deque, namedtuple
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parent.parent
CARDS = ROOT / "cards"
CACHE = CARDS / "cache" / "aon"
ES_URL = "https://elasticsearch.aonprd.com/aon/_search"


# ---------- Archives of Nethys (cached) ----------

def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


AON_CATEGORIES = {"spell": ["spell"], "item": ["equipment", "weapon", "armor", "shield"],
                  "action": ["feat", "class-feature", "familiar-ability", "action", "heritage", "skill-general-action"]}
# Lookup prefixes that restrict which AoN categories a name may resolve to.
PREFIX_CATEGORIES = {"gen:": ["action", "skill-general-action"], "pet:": ["animal-companion"], "rit:": ["ritual"]}
CATEGORY_RANK = {"feat": 0, "class-feature": 1, "familiar-ability": 2, "action": 3, "heritage": 4}
HERO_CLASSES = set()  # set by main(); class features of other classes are not candidates
PREFERRED_SOURCES = ("Player Core", "GM Core")


ROMAN = r"(?:I{1,3}|IV|VI{0,3}|IX|X)"


def _search_cat(name, category, size=10):
    return _search(name, None, size, [category])


def _search(name, kind, size=10, categories=None):
    query = {"size": size, "query": {"bool": {
        "must": [{"match_phrase": {"name": name}}],
        "filter": [{"terms": {"category": categories or AON_CATEGORIES[kind]}}]}}}
    req = urllib.request.Request(
        ES_URL, json.dumps(query).encode(),
        {"Content-Type": "application/json", "User-Agent": "strength-of-thousands-card-script"})
    return [h["_source"] for h in json.load(urllib.request.urlopen(req, timeout=30))["hits"]["hits"]]


def _now():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def cache_load(path):
    """Read a cached AoN document. Entries cached before fetch times were recorded get the file's mtime."""
    doc = json.loads(path.read_text())
    doc.setdefault("_fetched_at", datetime.datetime.fromtimestamp(path.stat().st_mtime).astimezone().isoformat(timespec="seconds"))
    return doc


def cache_save(path, doc):
    path.parent.mkdir(parents=True, exist_ok=True)
    doc["_fetched_at"] = _now()
    path.write_text(json.dumps(doc, indent=1))


def _classes(s):
    c = s.get("class") or []
    return {c} if isinstance(c, str) else set(c)


def _search_ids(ids):
    req = urllib.request.Request(
        ES_URL, json.dumps({"size": len(ids), "query": {"ids": {"values": ids}}}).encode(),
        {"Content-Type": "application/json", "User-Agent": "strength-of-thousands-card-script"})
    return [h["_source"] for h in json.load(urllib.request.urlopen(req, timeout=30))["hits"]["hits"]]


def aon_page(name, category):
    """A rules/skill page (cached). Prefers the remaster (Player Core) version."""
    path = CACHE / "page" / f"{category}-{slug(name)}.json"
    if path.exists():
        return cache_load(path)
    hits = [h for h in _search_cat(name, category) if h["name"] == name]
    hits.sort(key=lambda h: (bool(h.get("remaster_id")), not h.get("legacy_id")))
    cache_save(path, hits[0])
    return hits[0]


def fetch_aon(name, kind):
    """Look up `name` on AoN (kind: 'spell', 'item' or 'action'); cached under cards/cache/aon/<kind>/.

    A name ending in a roman numeral ("Smuggler's Sack II") is usually a subtype of a parent item
    with no entry of its own; AoN stores those as variants named like "Smuggler's Sack (Type II)".
    """
    key = slug(name) + (("--" + slug("-".join(sorted(HERO_CLASSES)))) if kind == "action" else "")
    path = CACHE / kind / f"{key}.json"
    if path.exists():
        return cache_load(path)
    if name.startswith("id:"):  # an exact AoN document id, e.g. from a skill page's action list
        hits = _search_ids([name[3:]])
        if hits:
            cache_save(path, hits[0])
        return hits[0] if hits else None
    cats = None
    for prefix, c in PREFIX_CATEGORIES.items():
        if name.startswith(prefix):
            name, cats = name[len(prefix):], c
    size = 60 if kind == "action" else 10
    hits = [h for h in _search(name, kind, size, cats) if h["name"].lower() == name.lower()]
    if not hits and (m := re.fullmatch(rf"(.+?)\s+({ROMAN})", name)):
        base, num = m.groups()
        pat = re.compile(rf"{re.escape(base)} \((?:[A-Za-z]+ )?{num}\)", re.I)
        hits = [h for h in _search(base, kind, 40) if pat.fullmatch(h["name"])]
    # A class feature only counts if it belongs to one of the hero's classes.
    hits = [h for h in hits if h["category"] != "class-feature" or not HERO_CLASSES or _classes(h) & HERO_CLASSES]
    if not hits:
        return None
    # Prefer the current (remastered) entry: legacy entries carry a remaster_id, their
    # replacements carry a legacy_id; then prefer the core remaster books.
    hits.sort(key=lambda s: (CATEGORY_RANK.get(s["category"], 9), bool(s.get("remaster_id")), not s.get("legacy_id"),
                             not (s.get("source_raw") or [""])[0].startswith(PREFERRED_SOURCES)))
    cache_save(path, hits[0])
    return hits[0]


def clean(md, name=""):
    """AoN markdown -> plain text, one paragraph / list item / table row per line."""
    md = re.sub(r"<actions string=\"([^\"]*)\" ?/>", r"(\1)", md)
    md = re.sub(r"</t[dh]>\s*<t[dh]>", ": ", md)            # table cells -> "1: effect"
    md = re.sub(r"</tr>|</li>|</ul>|</table>|<br ?/?>|</p>", "\n", md)
    md = md.replace("<li>", "\u2022 ")
    md = re.sub(r"<[^>]+>", "", md)
    md = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", md)         # links -> link text
    md = md.replace("**", "").replace("_", "")
    md = md.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-")
    lines = []
    for line in md.split("\n"):
        line = re.sub(r"\s+", " ", line).strip()
        if re.fullmatch(r"-{3,}", line) or re.fullmatch(r"#+\s*" + re.escape(name), line):
            continue
        lines.append(re.sub(r"^#+\s*", "", line))
    return "\n".join(l for l in lines if l)


def spell_card(s):
    if s["category"] == "ritual":  # cast time, cost and checks come from the header block
        return action_card(s)
    body_md = s["markdown"].split("\n---\n", 1)[1] if "\n---\n" in s["markdown"] else ""
    kind = s.get("spell_type", "Spell")
    stats = []
    for label, key in (("Range", "range_raw"), ("Area", "area_raw"), ("Targets", "target"),
                       ("Save", "saving_throw"), ("Duration", "duration_raw")):
        if s.get(key):
            stats.append(f"{label} {s[key]}")
    traits = ", ".join(t for t in s.get("trait", []) if t != kind)  # "Cantrip" is already in the subtitle
    card = {
        "id": slug(s["name"]),
        "source": (s.get("source_raw") or [""])[0],
        "title": s["name"],
        "subtitle": f"{kind} {s['level']}",
        "actions": s.get("actions", ""),
        "stats": "; ".join(stats),
        "desc": clean(body_md, s["name"]).split("\n"),  # paragraphs; first one is the card-front summary
        "footer": traits,
    }
    card["hash"] = hashlib.sha1("\n".join([card["stats"], *card["desc"]]).encode()).hexdigest()[:12]
    return card


ITEM_STATS_SKIP = {"Source", "Price", "Favored Weapon"}


def head_stats(md, skip=ITEM_STATS_SKIP):
    """Every '**Label** value' pair in an AoN header block (between </traits> and the first rule)."""
    head = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", md.partition("\n---\n")[0].split("</traits>", 1)[-1])
    head = re.sub(r"<[^>]+>", "\n", head)
    return [f"{label.strip()} {clean(value).strip()}" for label, value in
            re.findall(r"\*\*([^*]+)\*\*[ \t]*\n?[ \t]*([^*\n]*)", head)
            if label.strip() not in skip and clean(value).strip() not in ("", "-")]


def trait_labels(md, s):
    return ", ".join(re.findall(r'<trait label="([^"]+)"', md.split("</traits>", 1)[0]) or s.get("trait", []))


def action_cost(s):
    """'Reaction', 'Single Action', 'Two Actions to Three Actions', ... ('' for passive entries)."""
    m = re.search(r'<actions string="([^"]*)"', s["markdown"].split("</title>", 1)[0])
    return (s.get("actions") or (m.group(1) if m else "") or "").strip()


def companion_card(s):
    """Animal companion entry: attacks, stats and Support Benefit as description lines."""
    md = s["markdown"]
    after = md.split("</traits>", 1)[-1]
    after = re.sub(r"<row[^>]*>(.*?)</row>", lambda m: re.sub(r"\s*\n\s*", "; ", m.group(1).strip()), after, flags=re.S)
    after = re.sub(r"\*\*(Melee|Ranged)\*\*\s*<actions string=\"([^\"]*)\" ?/>\s*", r"**\1** (\2) ", after)
    after = re.sub(r",\s*\n\s*\*\*Damage\*\*", ", **Damage**", after)
    lines = [l for l in clean(after, s["name"]).split("\n") if l and not l.startswith("Source ")]
    card = {"id": slug(s["name"]), "source": (s.get("source_raw") or [""])[0], "title": s["name"],
            "subtitle": "Animal Companion", "actions": "", "stats": "", "desc": lines,
            "footer": trait_labels(md, s), "aon_category": "animal-companion"}
    card["hash"] = hashlib.sha1("\n".join(lines).encode()).hexdigest()[:12]
    return card


def linked_actions(s):
    """Action documents a class feature / companion embeds (<document id="action-N"/>), e.g. Spellstrike."""
    return re.findall(r'<document level="\d" id="(action-\d+)"', s["markdown"])


def action_card(s):
    if s["category"] == "animal-companion":
        return companion_card(s)
    md = s["markdown"]
    body_md = re.split(r"<title\s+level=\"2\"", md.partition("\n---\n")[2])[0]  # drop "leads to..." lists
    m = re.search(r'right="([^"]+)"', md)
    stats = head_stats(md, {"Source"})
    card = {
        "id": slug(s["name"]),
        "source": (s.get("source_raw") or [""])[0],
        "title": s["name"],
        "subtitle": (m.group(1) if m else s["category"].replace("-", " ").title()).strip(),
        "actions": action_cost(s),
        "stats": "; ".join(stats),
        "desc": [l for l in clean(body_md, s["name"]).split("\n") if l],
        "footer": trait_labels(md, s),
        "aon_category": s["category"],
    }
    card["hash"] = hashlib.sha1("\n".join([card["stats"], *card["desc"]]).encode()).hexdigest()[:12]
    return card


def item_card(s):
    md = s["markdown"]
    head, _, body_md = md.partition("\n---\n")
    body_md = re.split(r"<title\s+level=\"2\"", body_md)[0]  # drop variant lists / generic rules sections
    m = re.search(r'right="([^"]+)"', md)
    subtitle = m.group(1) if m else "Item"
    # Variant entries (e.g. "Smuggler's Sack (Type II)") carry the parent's whole page; add the
    # variant's own section and use its own level.
    vm = re.search(r'<title\s+level="2"[^>]*>\s*' + re.escape(s["name"]) + r"\s*</title>(.*?)(?=<title\s+level=\"2\"|\Z)",
                   md, re.S)
    if vm:
        subtitle = f"{s.get('category', 'item').capitalize() if s.get('category') != 'equipment' else 'Item'} {s['level']}"
        vlines = [l for l in clean(vm.group(1).split("\n---\n", 1)[-1]).split("\n")
                  if not re.match(r"(Source|Price|Bulk)\b", l) and l != s["name"]]
        label = s["name"].split("(")[-1].rstrip(")") + ": " if "(" in s["name"] else ""
        if vlines:
            body_md += "\n" + label + " ".join(vlines)
    stats = head_stats(md)
    card = {
        "id": slug(s["name"]),
        "source": (s.get("source_raw") or [""])[0],
        "title": s["name"],
        "subtitle": subtitle,
        "actions": "",
        "stats": "; ".join(stats),
        "desc": [l for l in clean(body_md, s["name"]).split("\n") if l],
        "footer": trait_labels(md, s),  # labels keep e.g. "Fatal 1d10"
    }
    card["hash"] = hashlib.sha1("\n".join([card["stats"], *card["desc"]]).encode()).hexdigest()[:12]
    return card


# ---------- Hero data ----------

CORE_SKILLS = ["acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy", "intimidation",
               "medicine", "nature", "occultism", "performance", "religion", "society", "stealth", "survival", "thievery"]
TRAINED = 2  # Pathbuilder proficiency ranks: 0 untrained, 2 trained, 4 expert, 6 master, 8 legendary


def _doc_ids(md):
    return re.findall(r'id="((?:action|skill-general-action)-\d+)"', md)


def universal_actions(hero):
    """Actions every character has, derived the way Pathbuilder's Actions tab does it:
    basic + specialty basic actions, then each core skill's untrained actions, plus its trained
    actions when the hero's rank is trained or better. Entries are (ref, subtitle, extra stat)."""
    refs = []
    for page in ("Basic Actions", "Specialty Basic Actions"):
        refs += [("id:" + i, "Basic Action", "") for i in _doc_ids(aon_page(page, "rules")["markdown"])]
    refs += [("id:" + i, "Exploration Activity", "") for i in _doc_ids(aon_page("Exploration Activities", "rules")["markdown"])]
    prof = hero["build"].get("proficiencies", {})
    for sk in CORE_SKILLS:
        parts = re.split(r'<title level="2">([^<]*)</title>', aon_page(sk.title(), "skill")["markdown"])
        for heading, body in zip(parts[1::2], parts[2::2]):
            if "Actions" not in heading:
                continue
            trained = "Untrained" not in heading
            if trained and prof.get(sk, 0) < TRAINED:
                continue
            names = (["gen:" + n for n in re.findall(r"^- \[([^\]]+)\]\(/Skills\.aspx[^)]*General=true\)", body, re.M)]
                     if "General" in heading else ["id:" + i for i in _doc_ids(body)])
            refs += [(n, f"{sk.title()} Action", "Trained" if trained else "") for n in names]
    return refs


def hero_actions(hero):
    """Feats, class features / specials and familiar abilities (passives are dropped later), then the
    universal basic and skill actions."""
    b = hero["build"]
    names = [f[0] for f in b.get("feats", [])] + list(b.get("specials", []))
    for fam in b.get("familiars", []):
        names += fam.get("abilities", [])
    entries = list(dict.fromkeys(names))
    for pet in b.get("pets", []):  # "Giant Widow (Nyame) - Young Scorpion" -> card titled with the companion's own name
        if pet.get("type") == "Animal Companion" and pet.get("animal"):
            entries.append(("pet:" + pet["animal"], "Animal Companion", "", pet["name"].split(" - ")[0].strip(),
                            bool(pet.get("mature"))))  # advanced maneuvers only once mature
    return entries + universal_actions(hero)


def hero_items(hero):
    b = hero["build"]
    names = [w["name"] for w in b.get("weapons", [])] + [a["name"] for a in b.get("armor", [])] \
        + [e[0] for e in b.get("equipment", [])]
    return list(dict.fromkeys(names))

def hero_spells(hero):
    names = []
    for caster in hero["build"].get("spellCasters", []):
        for lvl in caster.get("spells", []):
            names += lvl["list"]
    for trad in hero["build"].get("focus", {}).values():
        for abil in trad.values():
            names += abil.get("focusCantrips", []) + abil.get("focusSpells", [])
    names += ["rit:" + r for r in hero["build"].get("rituals", [])]
    return list(dict.fromkeys(names))  # unique, ordered


# ---------- PDF ----------

# Card fonts: role -> (PDF font name, font file). Tahoma ships with macOS.
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
FONTS = {"body": ("tahoma", FONT_DIR / "Tahoma.ttf"),
         "title": ("georgiab", FONT_DIR / "Georgia Bold.ttf")}


def fontkw(role):
    name, path = FONTS[role]
    return {"fontname": name, "fontfile": str(path)}


def text_width(role, text, size):
    return fitz.Font(fontfile=str(FONTS[role][1])).text_length(text, size)


def fit_text(page, rect, text, font, size, max_size=None, min_size=4, align=0, vcenter=False):
    size = min(size, max_size or size)
    while size >= min_size:
        # Dry run on an uncommitted Shape: the return value is the leftover height.
        spare = page.new_shape().insert_textbox(rect, text, fontsize=size, align=align, **fontkw(font))
        if spare >= 0:
            if vcenter:
                dy = spare / 2 + 1
                rect = fitz.Rect(rect.x0, rect.y0 + dy, rect.x1, rect.y1 + dy)
            page.insert_textbox(rect, text, fontsize=size, align=align, **fontkw(font))
            return size
        size -= 0.25
    return None


ICON_FILES = {"single action": "single", "two actions": "two", "three actions": "three",
              "reaction": "reaction", "free action": "free"}
ICON_H = 11  # points; all icons share one scale so the reaction arrow is naturally shorter
_icon_px = {}


def action_icons(actions):
    """'Two Actions to Three Actions' -> [('icon', path), ('text', 'to'), ('icon', path)]."""
    parts = []
    for i, piece in enumerate(re.split(r"\s+to\s+", actions.strip(), flags=re.I)):
        if i:
            parts.append(("text", "to"))
        key = ICON_FILES.get(piece.lower())
        parts.append(("icon", CARDS / "templates" / f"action-{key}.png") if key else ("text", piece))
    return parts


def draw_subtitle(page, rect, text, actions, size=10):
    """Centre `text` followed by action icons on one line inside rect."""
    parts = [("text", text)] + (action_icons(actions) if actions else [])
    items, total = [], 0
    for kind, v in parts:
        if kind == "text":
            w = text_width("body", v, size)
        else:
            if v not in _icon_px:
                pm = fitz.Pixmap(str(v))
                _icon_px[v] = (pm.width, pm.height)
            pw, ph = _icon_px[v]
            w = ICON_H * pw / 411  # 411 px = height of the tallest icon
        items.append((kind, v, w))
        total += w + 3
    x = rect.x0 + (rect.width - (total - 3)) / 2
    mid = (rect.y0 + rect.y1) / 2
    for kind, v, w in items:
        if kind == "text":
            page.insert_text((x, mid + size * 0.32), v, fontsize=size, **fontkw("body"))
        else:
            h = ICON_H * _icon_px[v][1] / 411
            page.insert_image(fitz.Rect(x, mid - h / 2, x + w, mid + h / 2), filename=str(v))
        x += w + 3


FRONT_MIN = 7.25   # smallest font that stays legible on a printed card
SEE_REVERSE = "-See Reverse-"
SEE_REVERSE_H = 11
CITE_H = 18          # reserved at the bottom of a card back for the source citation
MIRROR_BACKS = True  # sheet is flipped on its long edge, so back columns are mirrored
PENDING = CARDS / "cache" / "pending"
KIND = {"name": "spells", "cache": "spell"}  # set by main(); decides summary dir / pending file

INSTRUCTIONS = (
    "For each card, fill in 'front' and 'back'. The script prints the stats line itself (Trained, Requirements, "
    "Trigger, Range, Save, Usage, ...), so say nothing the stats line already says. 'front' is the gist of the card "
    "(what the spell, item or action does, one to three sentences) and fits in about front_budget_chars. "
    "'back' is the rules condensed: every number, die, DC, duration, condition and degree-of-success result "
    "(Crit Success / Success / Failure / Crit Failure), plus heightening, in about back_budget_chars. "
    "Keep rules faithful: drop flavour and boilerplate, add nothing. Plain text (no markdown), '-' for dashes, "
    "'\\n' between lines. Leave out 'See Reverse' and the source citation; the script prints both. Budgets are "
    "estimates: the script checks the real fit at the minimum font size and returns anything too long here with "
    "a 'problem' note, your attempt kept in place."
)


def fits(page, rect, text, size=FRONT_MIN, role="body", align=1):
    return page.new_shape().insert_textbox(rect, text, fontsize=size, align=align, **fontkw(role)) >= 0


def front_rects(rects, i):
    """Title/body/footer rects for card slot i (0-8) on a front page."""
    r, c = divmod(i, 3)
    pre = f"p1_r{r+1}_c{c+1}_"
    t, body, foot = rects[pre + "title"], rects[pre + "body"], rects[pre + "foot" + "er"]
    return t, fitz.Rect(body.x0 + 6, body.y0 + 3, body.x1 - 6, foot.y0 - 6), foot


def back_rects(box):
    """(title, text, citation) rects inside one card-back field."""
    box = fitz.Rect(box.x0 + 8, box.y0 + 8, box.x1 - 8, box.y1 - 8)
    return (fitz.Rect(box.x0, box.y0, box.x1, box.y0 + 16),
            fitz.Rect(box.x0, box.y0 + 20, box.x1, box.y1 - CITE_H - 2),
            fitz.Rect(box.x0, box.y1 - CITE_H, box.x1, box.y1))


def front_text(card, summary_front=None):
    return "\n".join(filter(None, [card["stats"], summary_front if summary_front is not None else "\n".join(card["desc"])]))


def capacity(page, rect, sample, prefix=""):
    """Approximate characters of `sample`-like text that fit in rect at FRONT_MIN."""
    sample = (sample + " ") * (3000 // max(len(sample), 1) + 1)
    lo, hi = 0, 2000
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fits(page, rect, prefix + sample[:mid]):
            lo = mid
        else:
            hi = mid - 1
    return lo


def check_summary(front_page, front_body, back_page, back_text, card, front, back):
    problems = []
    front_rect = fitz.Rect(front_body.x0, front_body.y0, front_body.x1, front_body.y1 - SEE_REVERSE_H)
    if not front.strip():
        problems.append("front is empty")
    elif not fits(front_page, front_rect, front_text(card, front)):
        problems.append(f"front overflows at {FRONT_MIN}pt - shorten it")
    if not back.strip():
        problems.append("back is empty")
    elif not fits(back_page, back_text, back, align=0):
        problems.append(f"back overflows at {FRONT_MIN}pt - shorten it")
    return problems


def tidy(text):
    return text.replace("\u2013", "-").replace("\u2014", "-").replace("\u2212", "-").strip()


def summaries_dir():
    return CARDS / "cache" / "summaries" / KIND["cache"]


def summary_path(card):
    return summaries_dir() / f"{card['id']}.json"


def load_summary(card):
    path = summary_path(card)
    if path.exists():
        data = json.loads(path.read_text())
        if data.get("hash") == card["hash"]:
            return data
    return None


def resolve_summaries(cards, label, front_page, front_body, back_page, back_text):
    """Attach summaries to cards that overflow. Returns the pending entries that still need work."""
    pending_file = PENDING / f"{label}-{KIND['name']}.json"  # label = hero id here
    attempts = {}
    if pending_file.exists():
        for e in json.loads(pending_file.read_text())["cards"]:
            attempts[e["id"]] = e
    todo = []
    for card in cards:
        card["summary"] = None
        if fits(front_page, front_body, front_text(card)):
            continue  # whole text fits on the front
        if (saved := load_summary(card)) is not None:
            card["summary"] = saved
            continue
        a = attempts.get(card["id"], {})
        front, back = tidy(a.get("front", "")), tidy(a.get("back", ""))
        problems = ["no summary written yet"] if not (front or back) and a.get("hash", card["hash"]) == card["hash"] \
            else check_summary(front_page, front_body, back_page, back_text, card, front, back)
        if a and a.get("hash") != card["hash"]:
            problems, front, back = ["AoN text changed since this entry was written - rewrite it"], "", ""
        if not problems:
            data = {"hash": card["hash"], "front": front, "back": back}
            summaries_dir().mkdir(parents=True, exist_ok=True)
            summary_path(card).write_text(json.dumps(data, indent=1))
            card["summary"] = data
            continue
        front_rect = fitz.Rect(front_body.x0, front_body.y0, front_body.x1, front_body.y1 - SEE_REVERSE_H)
        sample = " ".join(card["desc"])
        todo.append({
            "id": card["id"], "name": card["title"], "hash": card["hash"],
            "kind": card["subtitle"] + (f" ({card['actions']})" if card["actions"] else ""),
            "traits": card["footer"], "stats_printed_on_front": card["stats"],
            "text": card["desc"],
            "front_budget_chars": capacity(front_page, front_rect, sample, card["stats"] + "\n"),
            "back_budget_chars": capacity(back_page, back_text, sample),
            "front": front, "back": back, "problem": "; ".join(problems),
        })
    return todo, pending_file


FRONT_COLS = [(55.8, 212.2), (227.8, 384.2), (399.8, 556.0)]
FRONT_ROWS = [(35.8, 269.5), (279.2, 513.0), (522.5, 756.2)]


def fill_front(page, cards):
    """Draw up to 9 cards onto one front page. Returns {slot index: card} for cards that get a back."""
    rects = {w.field_name: w.rect for w in page.widgets()}
    backs = {}
    for i, card in enumerate(cards):
        t, body, foot = front_rects(rects, i)
        # Title sits above the thick rule, subtitle between the rules.
        dy = t.y0 - 50  # row-1 title field top is y=50 in PyMuPDF coords
        fit_text(page, fitz.Rect(t.x0, 66 + dy, t.x1, 90 + dy), card["title"], "title", 14, align=1)
        draw_subtitle(page, fitz.Rect(t.x0, 93 + dy, t.x1, 105 + dy), card["subtitle"], card["actions"])
        if card["summary"] is None:
            size = fit_text(page, body, front_text(card), "body", 10, align=1, min_size=FRONT_MIN)
        else:
            backs[i] = card
            size = fit_text(page, fitz.Rect(body.x0, body.y0, body.x1, body.y1 - SEE_REVERSE_H),
                            front_text(card, card["summary"]["front"]), "body", 10, align=1, min_size=FRONT_MIN)
            page.insert_textbox(fitz.Rect(body.x0, body.y1 - SEE_REVERSE_H, body.x1, body.y1),
                                SEE_REVERSE, fontsize=FRONT_MIN, align=1, **fontkw("body"))
        if size is None:
            print(f"  ! front overflows at {FRONT_MIN}pt: {card['title']}")
        print(f"  {card['title']:<24} front {size}pt" + ("  (summary + back)" if card["summary"] else ""))
        if card["footer"].strip():
            fit_text(page, fitz.Rect(foot.x0 + 2, foot.y0 + 1, foot.x1 - 2, foot.y1 - 1),
                     card["footer"], "body", 6.5, align=1, vcenter=True)
        else:  # no traits: cover the template's empty footer box
            page.draw_rect(foot + (-3, -3, 3, 3), color=None, fill=(1, 1, 1), overlay=True)
    # Cover the frame of every unused slot so no empty cards get printed. The spell, item and action
    # templates share one frame grid (measured from the rendered templates); gaps between cards
    # are 15.6pt wide and 9.7pt tall, so a 3pt margin never touches a neighbour.
    for i in range(len(cards), 9):
        r, c = divmod(i, 3)
        (x0, x1), (y0, y1) = FRONT_COLS[c], FRONT_ROWS[r]
        page.draw_rect(fitz.Rect(x0 - 3, y0 - 3, x1 + 3, y1 + 3), color=None, fill=(1, 1, 1), overlay=True)
    for w in list(page.widgets()):
        page.delete_widget(w)
    return backs


def fill_back(page, slots):
    """slots: {front slot index: card} -> one back page, columns mirrored if needed."""
    rects = {w.field_name: w.rect for w in page.widgets()}
    # Cover the template's frame for every slot that has no back, so no empty frames get printed.
    # (The frames are raster strips; a white box is far smaller than blanking pixels.)
    used = {(i // 3, 2 - i % 3 if MIRROR_BACKS else i % 3) for i in slots}
    for r in range(3):
        for c in range(3):
            if (r, c) not in used:
                page.draw_rect(rects[f"p2_r{r+1}_c{c+1}_back"] + (-8, -16, 8, 16), color=None, fill=(1, 1, 1), overlay=True)
    for i, card in slots.items():
        r, c = divmod(i, 3)
        if MIRROR_BACKS:
            c = 2 - c
        title, text, cite = back_rects(rects[f"p2_r{r+1}_c{c+1}_back"])
        fit_text(page, title, card["title"], "title", 12, align=1)
        size = fit_text(page, text, card["summary"]["back"], "body", 10, min_size=FRONT_MIN)
        if size is None:
            print(f"  ! back overflows at {FRONT_MIN}pt: {card['title']}")
        fit_text(page, cite, f"Full rules: {card['source']}", "body", 6.5, align=1, vcenter=True)
        print(f"  back: {card['title']:<24} {size}pt")
    for w in list(page.widgets()):
        page.delete_widget(w)


def build_pdfs(cards, outdir, label, template, kind_label):
    """Write '<label> - <Kind>.pdf' plus one '<label> - <Kind> (Back) pgN.pdf' per front page that has backs.

    Back pages are separate single-page PDFs, fed through the printer one at a time. Front pages
    with no back text get no back file.
    """
    # Only this deck's own files: timestamped "(changes ...)" PDFs from earlier diffs must survive.
    for old in [outdir / f"{label} - {kind_label}.pdf", *outdir.glob(f"{label} - {kind_label} (Back) pg*.pdf")]:
        old.unlink(missing_ok=True)
    files = []
    fronts = fitz.open()
    back_slots = {}
    for n, start in enumerate(range(0, len(cards), 9), 1):
        chunk = cards[start:start + 9]
        print(f"page {n}")
        doc = fitz.open(CARDS / "templates" / template)
        back_slots[n] = fill_front(doc[0], chunk)
        fronts.insert_pdf(doc)
    fronts.save(outdir / f"{label} - {kind_label}.pdf", garbage=4, deflate=True)  # garbage=4 dedupes the repeated template images
    files.append(f"{label} - {kind_label}.pdf")

    needed = [n for n in sorted(back_slots) if back_slots[n]]
    for n in needed:
        print(f"back for page {n}")
        doc = fitz.open(CARDS / "templates" / "Playing Card - Backs.pdf")
        fill_back(doc[0], back_slots[n])
        doc.save(outdir / f"{label} - {kind_label} (Back) pg{n}.pdf", garbage=4, deflate=True)
        files.append(f"{label} - {kind_label} (Back) pg{n}.pdf")
    return len(fronts), needed, files


def is_blacklisted(kind, requested_name, s):
    """True if cards/blacklist.json excludes this entry (by AoN category, subcategory or name)."""
    rules = json.loads((CARDS / "blacklist.json").read_text()).get(kind, {})
    low = lambda xs: {x.lower() for x in xs}
    requested_name = re.sub(r"^(gen|pet|rit|id):", "", requested_name)
    return (requested_name.lower() in low(rules.get("names", []))
            or s["name"].lower() in low(rules.get("names", []))
            or (s.get("item_category") or "").lower() in low(rules.get("categories", []))
            or (s.get("item_subcategory") or "").lower() in low(rules.get("subcategories", [])))


KINDS = {
    "spells": {"aon": "spell", "label": "Spells", "template": "Playing Card - Spells.pdf",
               "names": hero_spells, "card": spell_card},
    "items": {"aon": "item", "label": "Items", "template": "Playing Card - Items.pdf",
              "names": hero_items, "card": item_card},
    "actions": {"aon": "action", "label": "Actions", "template": "Playing Card - Actions.pdf",
                "names": hero_actions, "card": action_card,
                "keep": lambda card: bool(card["actions"]) or card.get("aon_category") in ("action", "skill-general-action", "animal-companion")},
}


# ---------- Run records (what each run produced, so a later run can tell what changed) ----------

RUNS = CARDS / "cache" / "runs"
RECORD_VERSION = 1


def _sha(obj):
    return hashlib.sha1(json.dumps(obj, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]


def render_fields(card):
    """Short hash per printed part of a card, so a diff can say what changed."""
    sm = card.get("summary")
    parts = {"title": card["title"], "subtitle": card["subtitle"], "actions": card["actions"],
             "stats": card["stats"], "footer": card["footer"],
             "front": sm["front"] if sm else card["desc"],
             "back": sm["back"] if sm else None,
             "cited": card["source"] if sm else None}  # the source line only prints on a back
    return {k: _sha(v) for k, v in parts.items()}


def render_fingerprint(card):
    """Hash of everything printed on a card (both sides). Same input -> same hash, so a changed
    hash means the printed card changed: AoN text, a rewritten summary, traits, or hero-driven labels."""
    return _sha(render_fields(card))


def hero_context(hero):
    """Snapshot of the hero inputs that decide which cards exist, readable enough to explain a diff."""
    b = hero["build"]
    return {
        "name": b["name"], "class": b.get("class"), "dualClass": b.get("dualClass"), "level": b.get("level"),
        "proficiencies": b.get("proficiencies", {}),
        "feats": [f[0] for f in b.get("feats", [])], "specials": b.get("specials", []),
        "familiar_abilities": [a for fam in b.get("familiars", []) for a in fam.get("abilities", [])],
        "pets": [p.get("name") for p in b.get("pets", [])], "rituals": b.get("rituals", []),
        "weapons": [w.get("name") for w in b.get("weapons", [])], "armor": [a.get("name") for a in b.get("armor", [])],
        "equipment": [e[0] for e in b.get("equipment", [])],
    }


def record_run(hero_id, label, kind, hero, cards, skipped, passive, missing, outputs, diff=None):
    """Write cards/cache/runs/<hero>/<kind>/<timestamp>.json; returns its path."""
    rules = json.loads((CARDS / "blacklist.json").read_text()).get(kind, {})
    stamp = _now()
    record = {
        "version": RECORD_VERSION, "timestamp": stamp, "hero": hero_id, "label": label, "kind": kind,
        "hero_sha": _sha(hero["build"]), "blacklist_sha": _sha(rules), "blacklist": rules,
        "hero_context": hero_context(hero),
        "cards": [{
            "id": c["id"], "title": c["title"], "subtitle": c["subtitle"],
            "page": i // 9 + 1, "slot": i % 9 + 1,
            "render_sha": render_fingerprint(c), "fields": render_fields(c),
            "source_sha": c["hash"], "summarized": bool(c.get("summary")),
            "aon_id": c.get("aon_id"), "aon_fetched": c.get("aon_fetched"),
        } for i, c in enumerate(cards)],
        "blacklisted": skipped, "passive": passive, "missing": missing,
        "outputs": outputs,
    }
    if diff:
        record["diff"] = diff
    path = RUNS / hero_id / kind / (stamp.replace(":", "")[:17] + ".json")  # 2026-11-16T153012
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(record, indent=1, ensure_ascii=False))
    return path


RANK_NAMES = {0: "untrained", 2: "trained", 4: "expert", 6: "master", 8: "legendary"}


def latest_record(hero_id, kind):
    files = sorted((RUNS / hero_id / kind).glob("*.json"))
    return json.loads(files[-1].read_text()) if files else None


def hero_changes(old, new):
    """Human-readable differences between two hero_context snapshots."""
    out = [f"{k}: {old.get(k)} -> {new.get(k)}" for k in ("class", "dualClass", "level") if old.get(k) != new.get(k)]
    op, np_ = old.get("proficiencies", {}), new.get("proficiencies", {})
    for k in sorted(set(op) | set(np_)):
        if op.get(k, 0) != np_.get(k, 0):
            out.append(f"{k}: {RANK_NAMES.get(op.get(k, 0), op.get(k, 0))} -> {RANK_NAMES.get(np_.get(k, 0), np_.get(k, 0))}")
    for k in ("feats", "specials", "familiar_abilities", "pets", "rituals", "weapons", "armor", "equipment"):
        o, n = old.get(k, []), new.get(k, [])
        delta = [f"+{x}" for x in n if x not in o] + [f"-{x}" for x in o if x not in n]
        if delta:
            out.append(f"{k}: {', '.join(delta)}")
    return out


def diff_cards(prev, cards):
    """Compare current cards with the last record. Returns (new, changed[(card, parts)], source_only, removed)."""
    prev_by = {c["id"]: c for c in prev["cards"]}
    new, changed, source_only = [], [], []
    for c in cards:
        p = prev_by.get(c["id"])
        if p is None:
            new.append(c)
        elif p["render_sha"] != render_fingerprint(c):
            fields = render_fields(c)
            changed.append((c, [k for k, v in fields.items() if p.get("fields") and p["fields"].get(k) != v]))
        elif p["source_sha"] != c["hash"]:
            source_only.append(c)  # AoN text moved but the printed card (via its summary) did not
    current = {c["id"] for c in cards}
    return new, changed, source_only, [p for i, p in prev_by.items() if i not in current]


Entry = namedtuple("Entry", "ref subtitle extra title follow", defaults=(None, "", None, True))


def collect_cards(hero, kind):
    """Resolve a hero's names to cards. Returns (cards, blacklisted, passive, missing)."""
    cfg = KINDS[kind]
    cards, skipped, passive, missing = [], [], [], []
    queue = deque(Entry(*e) if isinstance(e, tuple) else Entry(e) for e in cfg["names"](hero))
    while queue:
        e = queue.popleft()
        s = fetch_aon(e.ref, cfg["aon"])
        if not s:
            missing.append(e.ref)
            continue
        if is_blacklisted(kind, e.ref, s):
            if s["name"] not in skipped:  # several skills can lead to the same action
                skipped.append(s["name"])
            continue
        card = cfg["card"](s)
        card["aon_id"], card["aon_fetched"] = s.get("id"), s.get("_fetched_at")
        if e.title:  # e.g. an animal companion's own name
            card["title"], card["id"] = e.title, slug(e.title)
        if e.subtitle:  # universal entry: label it, note any requirement, keep it even without an action cost
            card["subtitle"] = e.subtitle
            card["stats"] = "; ".join(filter(None, [e.extra, card["stats"]]))
        if e.title or e.subtitle:
            card["hash"] = hashlib.sha1("\n".join([card["title"], card["stats"], *card["desc"]]).encode()).hexdigest()[:12]
        if any(c["id"] == card["id"] for c in cards):
            continue  # same action reached twice (e.g. Recall Knowledge from several skills)
        # A class feature with no cost of its own usually embeds the action it grants (Spellstrike,
        # Overdrive, ...); companions embed their advanced maneuver. Process those links next.
        links = linked_actions(s) if kind == "actions" and e.follow and (
            s["category"] == "animal-companion" or not card["actions"]) else []
        for i in reversed(links):
            queue.appendleft(Entry("id:" + i))
        if e.subtitle or cfg.get("keep", lambda c: True)(card):
            cards.append(card)
        elif not links:
            passive.append(s["name"])
    return cards, skipped, passive, missing


def run(hero_id, kind, diff):
    """Build one hero's deck. Returns "built", "unchanged" (diff found nothing) or "blocked" (summaries needed)."""
    cfg = KINDS[kind]
    KIND.update(name=kind, cache=cfg["aon"])
    hero = json.loads((ROOT / "heroes" / f"{hero_id}.json").read_text())
    label = hero["build"]["name"].split()[0]  # "Taraan Skyseeker (Lisa)" -> "Taraan"
    HERO_CLASSES.clear()
    HERO_CLASSES.update(c for c in (hero["build"].get("class"), hero["build"].get("dualClass")) if c)
    cards, skipped, passive, missing = collect_cards(hero, kind)
    for ref in missing:
        print("MISSING", ref)
    if skipped:
        print(f"skipped {len(skipped)} blacklisted: {', '.join(skipped)}")
    if passive:
        print(f"skipped {len(passive)} passive (no action cost): {', '.join(passive)}")

    # Measurement pages for the fit checks (front slot 0 and back slot 0 are representative).
    front_page = fitz.open(CARDS / "templates" / cfg["template"])[0]
    back_page = fitz.open(CARDS / "templates" / "Playing Card - Backs.pdf")[0]
    _, front_body, _ = front_rects({w.field_name: w.rect for w in front_page.widgets()}, 0)
    _, back_text, _ = back_rects({w.field_name: w.rect for w in back_page.widgets()}["p2_r1_c1_back"])

    todo, pending_file = resolve_summaries(cards, hero_id, front_page, front_body, back_page, back_text)
    if todo:
        PENDING.mkdir(parents=True, exist_ok=True)
        pending_file.write_text(json.dumps({"hero": hero_id, "instructions": INSTRUCTIONS, "cards": todo}, indent=1))
        print(f"\n{len(todo)} card(s) need a summary (or a shorter one). Wrote {pending_file}")
        for e in todo:
            print(f"  - {e['name']}: {e['problem']}")
        print("Fill in 'front' and 'back' for each, then re-run this command.")
        return "blocked"
    pending_file.unlink(missing_ok=True)

    # Cards that need a back go first (stable within each group), so backs only have to be printed
    # for the first page(s) of a deck and every later page has none.
    cards = [c for c in cards if c["summary"]] + [c for c in cards if not c["summary"]]

    outdir = CARDS / hero_id
    outdir.mkdir(parents=True, exist_ok=True)
    kind_label = cfg["label"]
    prev = latest_record(hero_id, kind) if diff else None
    build_full, changes_cards, diff_info = True, [], None

    if diff and prev is None:
        print("diff: no previous run recorded, so building the full deck as the baseline.")
    elif diff:
        new, changed, source_only, removed = diff_cards(prev, cards)
        hero_ch = hero_changes(prev["hero_context"], hero_context(hero))
        rules = json.loads((CARDS / "blacklist.json").read_text()).get(kind, {})
        print(f"diff against the run of {prev['timestamp']}:")
        if hero_ch:
            print("  hero changes:", "; ".join(hero_ch))
        if prev["blacklist"] != rules:
            print("  blacklist rules changed")
        for c in new:
            print(f"  NEW      {c['title']}")
        for c, parts in changed:
            print(f"  CHANGED  {c['title']}" + (f" ({', '.join(parts)})" if parts else ""))
        gone = {n.lower(): why for why, names in (("blacklisted", skipped), ("passive", passive), ("not found on AoN", missing)) for n in names}
        for p in removed:
            print(f"  REMOVED  {p['title']} ({gone.get(p['title'].lower(), 'no longer granted by the hero data')}) - not printed")
        for c in source_only:
            print(f"  SOURCE   {c['title']}: AoN text changed, printed card unchanged - not printed")
        out_names = [f"{label} - {kind_label}.pdf"]
        if not (new or changed or removed or source_only or hero_ch or prev["blacklist"] != rules):
            print("  no changes.")
            return "unchanged"
        build_full = bool(new or changed or removed) or not (outdir / out_names[0]).exists()
        ids = {c["id"] for c in new} | {c["id"] for c, _ in changed}
        changes_cards = [c for c in cards if c["id"] in ids]
        diff_info = {"against": prev["timestamp"], "hero_changes": hero_ch, "new": [c["title"] for c in new],
                     "changed": [{"title": c["title"], "parts": parts} for c, parts in changed],
                     "removed": [p["title"] for p in removed], "source_only": [c["title"] for c in source_only]}

    outputs = []
    if build_full and not cards:  # e.g. every item is blacklisted gear: nothing to print
        for old in [outdir / f"{label} - {kind_label}.pdf", *outdir.glob(f"{label} - {kind_label} (Back) pg*.pdf")]:
            old.unlink(missing_ok=True)
        print("no cards for this deck.")
    elif build_full:
        pages, back_pages, files = build_pdfs(cards, outdir, label, cfg["template"], kind_label)
        outputs += files
        print(f"wrote {len(cards)} cards, {pages} pages; backs needed for pages {back_pages}")
    elif diff:
        print("full PDFs unchanged (nothing printed changed).")
    if changes_cards:
        stamp = datetime.datetime.now().strftime("%Y-%m-%d %H%M")
        pages, back_pages, files = build_pdfs(changes_cards, outdir, label, cfg["template"], f"{kind_label} (changes {stamp})")
        outputs += files
        print(f"wrote changes PDF: {len(changes_cards)} card(s), {pages} page(s): {files[0]}")
    print("recorded run:", record_run(hero_id, label, kind, hero, cards, skipped, passive, missing, outputs, diff_info).relative_to(ROOT))
    return "built"


def active_heroes():
    """Slugs from heroes/index.json, minus heroes marked "active": false."""
    index = json.loads((ROOT / "heroes" / "index.json").read_text())
    return [h["slug"] for h in index if h.get("active") is not False]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    diff = "--diff" in sys.argv or "diff" in args  # bare "diff" works too, as the skill passes it
    args = [a for a in args if a != "diff"]
    target = args[0] if args else "all"  # no hero named: every active hero
    kinds = [args[1]] if len(args) > 1 and args[1] != "all" else list(KINDS)
    heroes = active_heroes() if target == "all" else [target]
    for h in heroes:
        if not (ROOT / "heroes" / f"{h}.json").exists():
            sys.exit(f"no such hero: {h} (heroes/{h}.json)")
    results = []
    for h in heroes:
        for k in kinds:
            print(f"\n===== {h} / {k}{' (diff)' if diff else ''} =====")
            results.append((h, k, run(h, k, diff)))
    print("\n===== summary =====")
    for h, k, status in results:
        print(f"  {h:22} {k:8} {status}")
    if any(status == "blocked" for _, _, status in results):
        print("\nsummaries needed: fill in 'front' and 'back' in each file in cards/cache/pending/, then re-run this command.")
        sys.exit(2)


if __name__ == "__main__":
    main()
