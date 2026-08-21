import json

proj = r'.'
scratch = r'.'

with open(proj + r'\lantern-alley.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open(scratch + r'\fox-datauris.json', 'r', encoding='utf-8') as f:
    fox = json.load(f)

scripts = {}
for name in ['entrance-stage-logic.js', 'moonview-inn-interactions.js', 'n2-home-inn-stage.js']:
    with open(proj + '\\' + name, 'r', encoding='utf-8') as f:
        scripts[name] = f.read()

old_tags = '<script src="entrance-stage-logic.js"></script>\n<script src="moonview-inn-interactions.js"></script>\n<script src="n2-home-inn-stage.js"></script>'

new_tags = (
    '<script>' + scripts['entrance-stage-logic.js'] + '</script>\n' +
    '<script>' + scripts['moonview-inn-interactions.js'] + '</script>\n' +
    '<script>' + scripts['n2-home-inn-stage.js'] + '</script>'
)

assert old_tags in html, 'script tag block not found'
html = html.replace(old_tags, new_tags)

path_map = {
    'assets/fox-poses/fox-neutral-idle.png': fox['idle'],
    'assets/fox-poses/fox-neutral-no-mouth-transparent.png': fox['talkBase'],
    'assets/fox-poses/fox-wave-closed-smile.png': fox['waveClosed'],
    'assets/fox-poses/fox-wave-small-open-mouth.png': fox['waveSmall'],
    'assets/fox-poses/fox-wave-konnichiwa-mouth.png': fox['waveOpen'],
    'assets/fox-poses/fox-invite-bow.png': fox['invite'],
    'assets/fox-poses/fox-celebration.png': fox['celebrate'],
    'assets/fox-poses/fox-try-again.png': fox['tryAgain'],
    'assets/fox-poses/fox-listening.png': fox['listen'],
}
count = 0
for old, new in path_map.items():
    n = html.count(old)
    assert n == 1, old + ' found ' + str(n) + ' times'
    html = html.replace(old, new)
    count += 1

with open(scratch + r'\lantern-alley-artifact.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('replaced', count, 'image paths')
size = len(html.encode('utf-8'))
print('output size:', size, 'bytes (~%.2f MB)' % (size/1024/1024))
