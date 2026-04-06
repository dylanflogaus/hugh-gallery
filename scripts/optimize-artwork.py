#!/usr/bin/env python3
"""
Create web-optimized WebP versions of artwork JPG files.

Input:  artwork/*.jpg
Output: artwork/web/*.webp
"""

from pathlib import Path
from PIL import Image, ImageOps


SOURCE_DIR = Path(__file__).resolve().parents[1] / "artwork"
OUTPUT_DIR = SOURCE_DIR / "web"
MAX_LONG_EDGE = 1800
WEBP_QUALITY = 76


def optimize_one(src: Path, dest: Path) -> None:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        w, h = im.size
        long_edge = max(w, h)
        if long_edge > MAX_LONG_EDGE:
            scale = MAX_LONG_EDGE / float(long_edge)
            new_size = (max(1, int(w * scale)), max(1, int(h * scale)))
            im = im.resize(new_size, Image.Resampling.LANCZOS)
        im.save(dest, "WEBP", quality=WEBP_QUALITY, method=6, optimize=True)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(SOURCE_DIR.glob("*.jpg"))
    if not files:
        print("No JPG files found in artwork/.")
        return

    for src in files:
        out = OUTPUT_DIR / f"{src.stem}.webp"
        optimize_one(src, out)

    print(f"Optimized {len(files)} image(s) into {OUTPUT_DIR.relative_to(SOURCE_DIR.parent)}")


if __name__ == "__main__":
    main()
