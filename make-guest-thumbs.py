"""Make the small guest portraits the shift board shows.

The painted portraits in assets/inn/guests/ are 512x512 and about 250 KB
each. The board shows them at 34-56px, so twelve full-size files cost a
phone about 3 MB for faces the size of a thumbnail. This writes 192px copies
(enough for a 3x screen at 56px) to assets/inn/guests/small/.

Re-run after changing or adding a portrait:  py make-guest-thumbs.py
"""
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "inn" / "guests"
OUT = SRC / "small"
SIZE = 192


def main():
    OUT.mkdir(exist_ok=True)
    for path in sorted(SRC.glob("*-*.webp")):
        with Image.open(path) as im:
            small = im.convert("RGBA").resize((SIZE, SIZE), Image.LANCZOS)
            small.save(OUT / path.name, "WEBP", quality=86, method=6)
        print(path.name, (OUT / path.name).stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
