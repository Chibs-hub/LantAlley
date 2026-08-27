# Lantern Alley

A browser-based JLPT N2 Japanese learning game. The player walks a small alley,
listens to or reads Japanese, and answers by doing the job — carrying a tray,
putting a room right, reading a notice — rather than by picking a vocabulary
card.

Five places, four episodes each, ten questions per episode: **200 authored
questions teaching 200 distinct words**, plus a generated practice layer of
**9,097 cards** covering the rest of the vocabulary catalogue.

## Running it

No installation, no package manager, no build step.

```bash
node --test
```

That runs the full suite (296 tests). To play it, open `index.html` in a modern
browser.

**Note:** service workers do not run from `file://`. Opening the file directly
works, but offline caching and home-screen install only happen when the app is
served over `http://localhost` or HTTPS.

## Where to start reading

**`PROJECT-HANDOFF.md`** is the real documentation: current status, the design
rules, the file map, how to verify a change, and a change log that records *why*
each decision was made rather than just what changed. Read section 0 first.

## Third-party data and attribution

The vocabulary catalogue is **derived from third-party data** and this matters
for anything published from it.

| Source | Used for | Licence |
| --- | --- | --- |
| [OpenJLPT](https://github.com/evanclan/OpenJLPT) | The N2/N3 vocabulary in `research/openjlpt/`, from which `curriculum-catalog.js` is generated | Stated by the upstream project as CC BY-SA 4.0 |
| Tatoeba | Example sentences carried through the OpenJLPT data | Tatoeba publishes under CC BY 2.0 FR |

**Two things are unresolved and should be settled before any public release:**

1. **Provenance is incomplete.** The exact upstream commit or release used for
   the local copies in `research/openjlpt/` was never recorded, so the catalogue
   cannot currently be traced to a specific version of its source.
2. **Share-alike has not been assessed.** If the upstream licence is CC BY-SA,
   the generated `curriculum-catalog.js` is a derived work and the obligation
   likely follows it. Nothing here currently carries that notice.

Neither is a blocker for private development. Both get harder to fix the longer
they are left, which is why they are written down here rather than in a comment.

## Artwork

The images under `assets/` were produced for this project; several are
AI-generated. Their provenance is not individually recorded. A handful of
unreferenced source images also sit at the repository root
(`HD3Dfox.png`, `fox-wave.png`, the `ChatGPT Image …` files) — they are working
files, not used by the game.

## Licence

**Not yet decided.** No licence file is present, so by default all rights are
reserved. This is deliberate: choosing a licence is a decision for the owner,
and the third-party obligations above should be settled first.

## Status

The course is complete and playable end to end. Two things are honestly
outstanding, both recorded in `PROJECT-HANDOFF.md` §10:

- **The Japanese has not been reviewed by a native speaker.** A self-review pass
  over the 200 questions found seven real faults in content already considered
  finished.
- **506 of the 620 spoken lines have no audio.** Four of the five places are
  read rather than heard, and on a device with no Japanese system voice they are
  silent.
