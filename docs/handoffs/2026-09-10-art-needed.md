**Updated 2026-09-11 (v352).** Three of the items below arrived and are in:

- The 桜 wallpaper is painted (`assets/home/decor/wallpaper-sakura-v1.webp`), so
  the wallpaper queue is empty. It needed `blend:"normal"` as well as the file -
  the wall layer multiplies, which can only darken, and a pale sheet vanished
  under it. See the v351 change log entry.
- The app icon family and the favicon are rebuilt from the owner's own lantern
  illustration, via a new master `assets/branding/lantern-mark-v2.png`. The
  supplied art had rounded corners and a lantern reaching top and bottom, either
  of which Android's circular mask would have cut, so the master insets it to
  the 80% safe zone over a blurred continuation of itself rather than a flat
  pad. `make-icons.py` builds the set from that master.
- The social preview is the owner's wide village banner
  (`assets/social/lantern-alley-share-v2.jpg`, 1200x630).

**Held and unused:** a hanging-lantern photograph (1254x1254, on the owner's
desktop as `img/lantern.png`). Nothing in the game has a slot that size yet.
It is not a gap - it is a spare, recorded here so nobody commissions another.

Still outstanding: the 16 garden images below, and one title-screen background
specified next.

## Title-screen background - delivered

**Done 2026-09-11 (v353).** The owner exported the village scene with no text
on it, 1536x1024 at exactly 3:2, and it is the title screen now:
`assets/title/lantern-alley-title-v1.webp`. The top-down map painting it
replaced stays in the repository - the map screen still uses it.

The composition landed without adjustment. 言葉の路地 and LANTERN ALLEY sit over
the darkened left band, Kon stands over the wet cobbles at the lower right, and
the phone's `background-position: 54% center` puts the tea-house stairs and
lanterns in frame rather than empty sky. Checked at 320px, 390px and desktop.

## How this list was produced

Not by eye. Every catalogue item, wallpaper and garden species was asked
whether it carries an `image` field; the ones that do not fall back to inline
SVG in `decorArt` (app.js) or to a drawn plant in `plantArt`. Repeat with:

    node -e "var fs=require('fs'),vm=require('vm');var c=vm.createContext({});
    vm.runInContext(fs.readFileSync('home-decor.js','utf8'),c);
    var d=c.LanternHomeDecor;
    d.catalogue().forEach(function(i){ if(!d.getItem(i.id).image) console.log(i.id); });"

## 1. Garden - 16 images, highest value

`assets/home/garden/<species>-<stage>-gravel-v2.webp`

Four stages each, exactly these names: `planted`, `sprout`, `growing`,
`mature`. (`stageFor` in home-garden.js returns only those four. The two trees
have a five-stage set including `sapling` and `young`; these four do not.)

| species | ¥ | sceneWidth | kind |
| --- | --- | --- | --- |
| `hydrangea` あじさい | 240 | 14 | shrub |
| `lantern-flower-bed` | 200 | 15 | shrub |
| `chrysanthemum` 菊 | 110 | 10 | flower |
| `iris` あやめ | 90 | 8 | flower |

Match the existing set exactly - open `camellia-*-gravel-v2.webp` and
`sunflower-*-gravel-v2.webp` and work to those: same gravel bed beneath the
plant, same camera height, same evening light. `sceneWidth` is the mature
plant's width as a percentage of the scene, so the four stages share a frame
and grow within it rather than each being cropped to its own bounds.

Half the garden shop is placeholder, and the garden is the one reward that
grows out of study rather than being bought outright, so this is the batch
worth doing first.

## 2. Wallpaper - 1 image

`assets/home/decor/wallpaper-sakura-<colour>-v1.webp`

`wallpaper-sakura` 桜 ¥220. Currently generated blossoms, sitting next to
麻の葉 which is a real photographed pattern - the difference is visible in the
shop swatches.

A tileable sheet of about thirteen motifs, like the asanoha one. The renderer
repeats it at a third of the wall's width (`.home-wallpaper-art.is-raster`,
`background-size:34% auto`), which is what lands a motif near life size. It is
masked to the paper panels only, so the pattern needs to read at roughly 9cm
per motif rather than as a large-scale print.

## 3. Decor - 6 images

`assets/home/decor/<id>-v1.webp`

| id | name | ¥ | rests on | real size |
| --- | --- | --- | --- | --- |
| `brazier` | 火鉢 | **400** | floor | ~55cm |
| `mask` | 面 | **400** | wall, hangs | ~35cm |
| `books` | 本 | 110 | shelf | ~28cm stack |
| `fan` | 扇 | 90 | wall, hangs | ~35cm |
| `teapot` | 急須 | 70 | shelf | ~14cm |
| `sill-plant` | 小さな鉢 | 60 | veranda sill | ~30cm |

火鉢 and 面 are the joint most expensive decor in the game and both are line
drawings today. 本 and 急須 sit on a shelf at eye level, where the difference
between a photograph and a drawing is most obvious.

## Specifications

**Transparent, and cropped tight to the object.** This is not a preference. An
object's `anchorY` is where its contact point sits in the picture; a
photograph is anchored at 100, meaning its base is the bottom row of pixels.
Padding below the object therefore lifts it off whatever it stands on. That is
precisely the bug fixed in v332: the vector fallbacks stop at about y=14 in a
box ending at y=52, so a teapot anchored at 100 floated about 15px above its
plank in a 554px scene.

**Lit like the room.** The renderer grades every cutout for the hour - see the
`.home-item` and `.home-plant` filters in styles.css - but it is correcting a
picture, not inventing one. A flat, front-lit product shot fights the room's
warm evening light. The existing decor photographs are the reference.

**Resolution.** Enough to survive the largest camera. The interior scene is
`clamp(300px,50dvh,480px)` tall at 16/9, so up to about 853px wide; an object
at 14% of that is around 120px. Twice that is comfortable. The existing files
are 14-85KB each, which is the right ballpark.

## After the art lands - do not skip this

Replacing a vector with a photograph changes two numbers in `PRESENTATION`
(home-decor.js), and leaving them alone will look wrong:

1. **`anchorY` back to 100.** The measured values there - `brazier` 69.2,
   `teapot` and `books` 63.5, `sill-plant` 65.4 - describe where the *drawing*
   ends inside its padded box. A tight-cropped photograph ends at its base.
   `fan` and `mask` stay at 50: they hang from their middles.
2. **`width` down to the visible size.** Today's widths include the vector's
   empty box. The teapot is 8 but its drawing fills 47% of that, so a tight
   photograph of the same 14cm kyusu wants roughly 3.8. Check against the
   room's own scale: about 0.25% of the scene per centimetre at the front row,
   0.12% at the back wall.

Then add each new file to the `SHELL` array in `sw.js` **and commit it**. A
shell entry that is not in the repository 404s on the deployed site, and
install throws on any non-200 - that failure mode pinned every tester to their
existing build once already. The `every file the service worker pre-caches
actually exists` test in pwa.test.mjs asks `git ls-files`, not the filesystem,
and will catch it.

Finally, `available reward artwork is connected to matching shop items` in
home-decor.test.mjs maps ids to filenames; add the new ones there so a
renamed or missing file fails a test rather than a learner's room.

## Verification

    node --test
    node --check app.js && node --check home-decor.js
