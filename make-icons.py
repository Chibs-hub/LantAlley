"""Generate the PWA icon set from the finished Lantern Alley lantern mark.

Two kinds are needed:
  - "any"      : the icon as-is, used in most places.
  - "maskable" : Android crops icons to a circle/squircle. Anything outside the
                 middle 80% can be cut off, so the art is padded onto a solid
                 background with a safe margin.
"""
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SRC = ROOT / "assets" / "branding" / "lantern-mark-v1.png"
OUT_DIR = ROOT / "icons"
BG = (14, 24, 48, 255)  # --ai-indigo-deep, matches the page and theme-color
SIZES = [192, 512]
RESAMPLE = Image.Resampling.LANCZOS

OUT_DIR.mkdir(parents=True, exist_ok=True)
master = Image.open(SRC).convert('RGBA')

for size in SIZES:
    plain = master.resize((size, size), RESAMPLE)
    plain.save(OUT_DIR / ('icon-%d.png' % size), format='PNG')

    # The master already has a full-bleed navy background and keeps the lantern
    # well inside the maskable safe zone. Padding the whole master again made
    # the lantern unreadably small on a phone home screen.
    maskable = master.resize((size, size), RESAMPLE)
    maskable.save(OUT_DIR / ('icon-%d-maskable.png' % size), format='PNG')

# iOS ignores the manifest and uses this; it must not be transparent.
apple = Image.new('RGBA', (180, 180), BG)
art = master.resize((150, 150), RESAMPLE)
apple.paste(art, (15, 15), art)
apple.convert('RGB').save(OUT_DIR / 'apple-touch-icon.png', format='PNG')

# Browsers still ask for the favicon before they read the web manifest.
# Keep it derived from the same master image rather than preserving an older,
# visually unrelated mark.
master.convert('RGBA').save(ROOT / 'lantern-alley.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])

for path in sorted(OUT_DIR.iterdir()):
    print('  %-28s %5.1f KB' % (path.name, path.stat().st_size / 1024))
