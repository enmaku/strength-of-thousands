#!/usr/bin/env python3
"""Rebuild the fillable per-deck back templates in cards/templates/ from "Playing Card - Backs.pdf".

Usage: python3 -I cards/build_back_templates.py <plain-frame-backs.pdf>

The argument is the plain nine-frame back sheet with nine fillable fields p2_r<r>_c<c>_back.

Each output keeps the nine fillable fields and adds the deck's tab (Spell/Item/Action), mirrored
left-to-right from the front template because a back prints on the reverse of its front.
"""
import sys
from pathlib import Path

import fitz

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_cards as g

T = g.CARDS / "templates"
for deck in ("Spells", "Items", "Actions"):
    doc = fitz.open(sys.argv[1])
    page = doc[0]
    for r in range(3):
        for c in range(3):
            g.draw_back_tab(page, f"Playing Card - {deck}.pdf",
                            g.FRONT_COLS[c][0] - g.FRONT_COLS[0][0], g.FRONT_ROWS[r][0] - g.FRONT_ROWS[0][0])
    out = T / f"Playing Card - {deck} Backs.pdf"
    doc.save(out, garbage=4, deflate=True)
    print(out.name, len(list(fitz.open(out)[0].widgets())), "fields")
