"""Build lantern-alley-artifact.html: a single self-contained page.

The published Claude Artifact cannot load sibling .js/.css files or local
images, so everything gets inlined here. The source of truth is the split
files (index.html + styles.css + app.js + assets); this output is generated
and should never be edited by hand.
"""
import base64
import os
import re

INDEX = 'index.html'
OUT = 'lantern-alley-artifact.html'

SCRIPTS = [
    'entrance-stage-logic.js',
    'moonview-inn-interactions.js',
    'n2-home-inn-stage.js',
    'app.js',
]

MIME = {'.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon'}


def read(path):
    return open(path, encoding='utf-8').read()


def data_uri(path):
    ext = os.path.splitext(path)[1].lower()
    payload = base64.b64encode(open(path, 'rb').read()).decode('ascii')
    return 'data:' + MIME.get(ext, 'application/octet-stream') + ';base64,' + payload


html = read(INDEX)

# The artifact host supplies its own <!doctype>/<head>/<body> wrapper.
html = re.sub(r'<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*', '', html, flags=re.I)
html = re.sub(r'\s*</head>\s*<body>\s*', '\n', html, flags=re.I)
html = re.sub(r'\s*</body>\s*</html>\s*$', '\n', html, flags=re.I)

# Strip the PWA wiring: an artifact is sandboxed, cannot register a service
# worker, and has no sibling manifest or icon files to fetch.
html = re.sub(r'[ \t]*<link rel="manifest"[^>]*>\n?', '', html)
html = re.sub(r'[ \t]*<link rel="apple-touch-icon"[^>]*>\n?', '', html)
html = re.sub(r'[ \t]*<link rel="icon"[^>]*>\n?', '', html)
html = re.sub(r'[ \t]*<meta name="apple-mobile-web-app[^>]*>\n?', '', html)
html = re.sub(r'[ \t]*<!-- iOS ignores the manifest[^>]*-->\n?', '', html)
html = re.sub(
    r'\n<script>\s*// Service workers need http\(s\)[\s\S]*?</script>\n',
    '\n',
    html,
)

# Inline the stylesheet.
html = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    '<style>\n' + read('styles.css') + '</style>',
)

# Inline each script in place, preserving load order.
for name in SCRIPTS:
    tag = '<script src="' + name + '"></script>'
    if tag not in html:
        raise SystemExit('missing script tag for ' + name)
    html = html.replace(tag, '<script>\n' + read(name) + '</script>')

# Inline every local image the page references.
images = sorted(set(re.findall(r'["\']((?:assets/[^"\']+|[\w.-]+\.ico))["\']', html)))
inlined = 0
for rel in images:
    path = rel.replace('/', os.sep)
    if not os.path.isfile(path):
        print('  skip (not found):', rel)
        continue
    html = html.replace('"' + rel + '"', '"' + data_uri(path) + '"')
    inlined += 1

open(OUT, 'w', encoding='utf-8', newline='').write(html)

size = len(html.encode('utf-8'))
print('inlined %d scripts, 1 stylesheet, %d images' % (len(SCRIPTS), inlined))
print('%s  %.2f MB' % (OUT, size / 1024 / 1024))
if size > 16 * 1024 * 1024:
    raise SystemExit('ERROR: exceeds the 16 MB artifact limit')
