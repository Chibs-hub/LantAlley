"""One-off: make web-sized WebP copies of the fox poses and point app.js at them.

The originals are ~2 MB PNGs at 1254px. They render at 92px on screen, so the
app was shipping roughly 18 MB of images no phone needs. The full-size PNGs
stay in assets/fox-poses/ as the masters.
"""
import os
import re

from PIL import Image

APP = 'app.js'
SRC_DIR = os.path.join('assets', 'fox-poses')
OUT_DIR = os.path.join('assets', 'fox')
SIZE = 320

os.makedirs(OUT_DIR, exist_ok=True)
app = open(APP, encoding='utf-8').read()

referenced = sorted(set(re.findall(r'assets/fox-poses/([\w-]+)\.png', app)))
if not referenced:
    raise SystemExit('no fox pose references found in ' + APP)

before = after = 0
for stem in referenced:
    src = os.path.join(SRC_DIR, stem + '.png')
    if not os.path.isfile(src):
        raise SystemExit('missing master image: ' + src)

    image = Image.open(src)
    image = image.convert('RGBA') if 'A' in image.mode or image.mode == 'P' else image.convert('RGB')
    if max(image.size) > SIZE:
        image = image.resize((SIZE, SIZE), Image.LANCZOS)

    out = os.path.join(OUT_DIR, stem + '.webp')
    image.save(out, format='WEBP', quality=82, method=6)

    before += os.path.getsize(src)
    after += os.path.getsize(out)
    app = app.replace('assets/fox-poses/' + stem + '.png', 'assets/fox/' + stem + '.webp')

open(APP, 'w', encoding='utf-8', newline='').write(app)

print('%d poses: %.1f MB -> %.0f KB' % (len(referenced), before / 1024 / 1024, after / 1024))
