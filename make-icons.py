"""Generate the PWA icon set from lantern-alley.ico.

Two kinds are needed:
  - "any"      : the icon as-is, used in most places.
  - "maskable" : Android crops icons to a circle/squircle. Anything outside the
                 middle 80% can be cut off, so the art is padded onto a solid
                 background with a safe margin.
"""
import os

from PIL import Image

SRC = 'lantern-alley.ico'
OUT_DIR = 'icons'
BG = (14, 24, 48, 255)  # --ai-indigo-deep, matches the page and theme-color
SIZES = [192, 512]

os.makedirs(OUT_DIR, exist_ok=True)
master = Image.open(SRC).convert('RGBA')

for size in SIZES:
    plain = master.resize((size, size), Image.LANCZOS)
    plain.save(os.path.join(OUT_DIR, 'icon-%d.png' % size), format='PNG')

    # Maskable: art occupies the middle 60%, leaving a generous safe zone.
    canvas = Image.new('RGBA', (size, size), BG)
    inner = int(size * 0.6)
    art = master.resize((inner, inner), Image.LANCZOS)
    offset = (size - inner) // 2
    canvas.paste(art, (offset, offset), art)
    canvas.save(os.path.join(OUT_DIR, 'icon-%d-maskable.png' % size), format='PNG')

# iOS ignores the manifest and uses this; it must not be transparent.
apple = Image.new('RGBA', (180, 180), BG)
art = master.resize((150, 150), Image.LANCZOS)
apple.paste(art, (15, 15), art)
apple.convert('RGB').save(os.path.join(OUT_DIR, 'apple-touch-icon.png'), format='PNG')

for name in sorted(os.listdir(OUT_DIR)):
    print('  %-28s %5.1f KB' % (name, os.path.getsize(os.path.join(OUT_DIR, name)) / 1024))
