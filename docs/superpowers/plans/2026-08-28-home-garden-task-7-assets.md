# Task 7 Brief: Complete Initial Asset Catalogue

Read this first. It is the complete Task 7 requirement.

Kept here rather than beside the SDD ledger because `.superpowers/` is gitignored:
a brief written for another session is no use if it never leaves this machine.

Written by the session that finished Tasks 4, 5, 6 and 8. That session has no
image-generation tool, so this task was handed back. Everything else in the plan
is done and nothing waits on this - the game ships and plays without it, with one
plant species and drawn furniture.

## Everything is already built and running on stand-in art

Nothing here is blocked and nothing needs wiring. All eight plant species are in
the shop, all four growth stages render, and the wallpaper system works. What is
showing is drawn from data rather than painted, and it is meant to be replaced.

**Swapping in a real plant set is one line of code:**

1. Drop the four files into `assets/home/garden/` using the exact names below.
2. Add a block to `PLANT_ART` in `app.js` naming all four stage paths in full.
3. Add the four paths to the shell list in `sw.js`.

That is the whole change. `plantFigure()` in `app.js` is the only thing that
decides between painted and drawn, and every caller goes through it, so the
shop card, the storage card, the yard and the tutorial gift all switch together.
`pwa.test.mjs` fails the build if a species is switched on before its files are
on disk and cached - which is the safety net, so use it.

**Write the paths out in full, never build them by concatenation.** The
standalone artifact build inlines pictures by finding their paths in the source,
so a path assembled at runtime is invisible to it: every planted camellia was a
broken image in the artifact while looking perfectly fine served as files.


**Swapping in real decor** is even smaller: add `image: "assets/home/decor/{id}-v1.png"`
to that item in `home-decor.js` and add the path to `sw.js`. **Keep the existing
`svg:`** - it stays as the fallback when an image fails to load, and
`home-decor.test.mjs` asserts every item still has one.

**Wallpaper** currently uses tiling SVG patterns, which is genuinely a good fit
for a seamless repeat - a few hundred bytes, no seam at any scale. Replace one
only if a raster version looks materially better: give the entry in `WALLPAPERS`
an `image` instead of a `pattern`.

## Context

The house and garden are built and working, on stand-in art. What is missing is
the painted version:

- Seven of the eight plant species are drawn from data rather than painted.
- Thirteen of the fourteen decor items still render as their inline SVG.
- Both wallpaper patterns are tiling SVG rather than raster.

`assets/home/incoming-user/` holds the 21 PNGs the owner supplied. Read
`image-inventory-report.md` before choosing any of them. They are source
candidates, not production assets; each needs cleanup and renaming.

## Files owned by this task

- New assets under `assets/home/garden/`, `assets/home/decor/`, `assets/home/interior/`
- `home-garden.js` (only to add art metadata, not to change growth rules)
- `home-decor.js` (only to add `image:` fields)
- `app.js` (only `PLANT_ART` and, if the baselines below are met, deleting `PLANT_BASE`; the drawn stand-ins in `placeholderPlant`/`PLANT_TINT` can go once every species is painted)
- `sw.js` (every new asset must be pre-cached)
- `PROJECT-HANDOFF.md`

Do not change the garden engine's rules, the tutorial, or the growth credit.
Those are approved and tested. Do not commit without the owner's authorization.

## The one constraint that matters most

**Every stage of a species must share a baseline and a frame.**

The camellia set does not. Its four files have their alpha bottoms at 77.4%,
82.7%, 94.0% and 94.5% of frame, and `mature` is a different aspect ratio to the
other three. A single anchor left the seedling hovering above its bed, so
`PLANT_BASE` in `app.js` exists purely to compensate, with one hand-measured row
per species.

If every stage of a species is generated in the same frame, at the same scale,
with the plant's foot at the same height, then `PLANT_BASE` can be deleted and no
new row is ever needed. **Do this rather than adding seven more rows of
measurements.** If it cannot be done, measure each stage's alpha bounding box and
add its row.

Regenerating the four camellia stages to a consistent baseline is worth doing at
the same time.

## Required plant assets

Four stages each - `planted`, `sprout`, `growing`, `mature` - named
`assets/home/garden/{id}-{stage}-v1.png`:

| id | Japanese (already in `PLANT_JP`) | kind | matures at |
|---|---|---|---|
| `cherry-tree` | 桜 | tree | 12 lessons |
| `japanese-maple` | もみじ | tree | 10 |
| `pine-tree` | 松 | tree | 8 |
| `hydrangea` | あじさい | shrub | 7 |
| `iris` | あやめ | flower | 2 |
| `chrysanthemum` | 菊 | flower | 3 |
| `lantern-flower-bed` | ほおずきの花壇 | shrub | 5 |

That is 28 files. `camellia` already exists (and is worth redoing, see above).

The four stages must read as one plant growing, not four different plants:
`planted` is bare soil with a seedling, `mature` is the species in flower or full
leaf. A tree at `mature` should be visibly taller than a flower at `mature` -
the price and the lesson cost differ, and the picture is what makes that land.

## Required decor assets

Transparent replacements at `assets/home/decor/{id}-v1.png`, matching the
interior's perspective and warm lantern lighting:

`rug-plain` 敷物, `plant-small` 鉢植え, `low-table` 座卓, `brazier` 火鉢,
`scroll` 掛け軸, `wall-lamp` 掛け行灯, `fan` 扇, `mask` 面, `teapot` 急須,
`books` 本, `cat-figure` 招き猫, `sill-plant` 小さな鉢, `wind-chime` 風鈴.

`floor-cushion-navy` already has its picture.

Each item has a `kind` that decides where it can stand - `floor`, `wall`,
`shelf`, `sill` - and the art has to suit it. A wall item is seen face-on; a
floor item is seen from slightly above, as the room is.

Add `image:` to each entry in `home-decor.js`. **Keep the existing `svg:`**: it is
the fallback when an image fails to load, and `home-decor.test.mjs` asserts every
item still has one.

## Required wallpaper assets

**Optional.** The 壁紙 tab, the catalogue, the wall layer and the persistence are
all built and working on tiling SVG patterns, which suit a seamless repeat well.
Produce `assets/home/interior/wallpaper-{asanoha,sakura}-v1.webp` only if a raster
version looks materially better than the vector one; 無地 needs no file at all,
because it is the room as painted.

## Sizes

Everything here is pre-cached by the service worker, so the whole set downloads
before a learner can play offline. Generate large, then cut down.

The camellia set and the cushion arrived as 1.2-1.6MB PNGs at 1300-1700px wide,
for pictures shown at roughly 150px. Resampled to 640px and saved as WebP at
quality 88 they came to 27-90KB each - **6.8MB became 0.3MB, and nothing about
how they look on screen changed.** The whole shipped asset set is now 720KB.

So: **640px on the long edge, WebP with alpha, quality 88.** Keep PNG only where
it genuinely gives cleaner transparent edges. `PLANT_ART` in `app.js` holds each
stage path in full, so either extension is fine.

Check the alpha bounding box before and after with a threshold (alpha > 24), not
a raw `getbbox()`: lossy WebP leaves a haze of alpha 1-8 across the transparent
area, which makes a raw box read as the whole frame.

## How to know it is done

`node --test` passes, including `pwa.test.mjs`'s "every picture the home can show
is on disk and cached" - which reads `PLANT_ART` directly, so adding a
species to the shop before its four files exist fails the build. Add each finished
species to `PLANT_ART` in `app.js`; that is what puts it in the shop.

Then look at it: place one of each plant and each decor item, at desktop and at
320px, and check nothing hovers, sinks, or overlaps.
