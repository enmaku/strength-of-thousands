#!/usr/bin/env python3
"""Extract Spire Dorm student portraits from Kindled Magic with white backgrounds."""

from __future__ import annotations

import json
import sys
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path.home() / "Dropbox/Gaming Books/Pathfinder/Strength of Thousands/strength-of-thousands-1-kindled-magic_compress.pdf"
OUT_DIR = ROOT / "reference/images/spire-dorm"

STUDENTS = [
    (69, 1321, "anchor-root", "Anchor Root"),
    (70, 1336, "chizire", "Chizire"),
    (70, 1340, "esi-djana", "Esi Djana"),
    (71, 1357, "haibram-thodja", "Haibram Thodja"),
    (71, 1361, "ignaci-canterells", "Ignaci Canterells"),
    (72, 1378, "mariama-keitana", "Mariama Keitana"),
    (72, 1382, "noxolo", "Noxolo"),
    (73, 1399, "okoro-obiyo", "Okoro Obiyo"),
    (73, 1403, "tzeniwe", "Tzeniwe"),
]


def extract_with_white_bg(doc: fitz.Document, xref: int) -> Image.Image:
    base = doc.extract_image(xref)
    rgb = Image.open(BytesIO(base["image"])).convert("RGB")
    smask_xref = base.get("smask")
    if not smask_xref:
        return rgb

    mask_base = doc.extract_image(smask_xref)
    alpha = Image.open(BytesIO(mask_base["image"]))
    if alpha.mode != "L":
        alpha = alpha.convert("L")
    if alpha.size != rgb.size:
        alpha = alpha.resize(rgb.size, Image.Resampling.LANCZOS)

    out = Image.new("RGB", rgb.size, (255, 255, 255))
    out.paste(rgb, mask=alpha)
    return out


def crop_portrait(raw: Image.Image) -> Image.Image:
    w, h = raw.size
    side = min(w, h)
    left = (w - side) // 2
    top = max(0, (h - side) // 10)
    return raw.crop((left, top, left + side, min(h, top + side)))


def save_portraits(doc: fitz.Document, out_dir: Path) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest: list[dict] = []

    for page_no, xref, slug, name in STUDENTS:
        crop = crop_portrait(extract_with_white_bg(doc, xref))
        portrait_path = out_dir / f"{slug}.jpg"
        thumb_path = out_dir / f"{slug}-120.jpg"

        crop.save(portrait_path, "JPEG", quality=88, optimize=True)
        thumb = crop.copy()
        thumb.thumbnail((120, 120), Image.Resampling.LANCZOS)
        thumb.save(thumb_path, "JPEG", quality=85, optimize=True)

        manifest.append(
            {
                "slug": slug,
                "name": name,
                "portrait": f"{slug}.jpg",
                "thumb": f"{slug}-120.jpg",
                "source_page": page_no,
                "xref": xref,
            }
        )
        print(f"{name}: {crop.size[0]}x{crop.size[1]}")

    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


def main() -> int:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf_path.is_file():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 1

    doc = fitz.open(pdf_path)
    try:
        manifest = save_portraits(doc, OUT_DIR)
    finally:
        doc.close()

    print(f"Exported {len(manifest)} portraits to {OUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
