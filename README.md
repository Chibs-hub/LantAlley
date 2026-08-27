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

The vocabulary catalogue is **derived from CC BY-SA 4.0 data**, and that follows
the data wherever it goes. The full chain, verified against the upstream sources
on 2026-08-27, is in **[NOTICE.md](NOTICE.md)**.

In short: `curriculum-catalog.js` is generated from
[OpenJLPT](https://github.com/evanclan/OpenJLPT), which is itself built from
JMdict/EDICT and KANJIDIC2 (EDRDG, CC BY-SA 4.0), Jonathan Waller's JLPT level
lists (CC BY), and Tatoeba example sentences (CC BY 2.0 FR).

Three consequences worth knowing before publishing anything:

1. **The derived data is CC BY-SA 4.0.** Distributing `curriculum-catalog.js`
   means distributing it under that licence, with attribution. This attaches to
   the data, not automatically to the rest of the code.
2. **The app must show attribution on screen.** The EDRDG licence is explicit
   that documentation is not enough for an application — it asks for a dedicated
   screen. This is the 「このゲームについて」 panel on the title screen.
3. **No official JLPT word list exists.** Every "N2" claim here rests on
   community approximations of an undisclosed syllabus, and the game says so.

One gap remains: the exact OpenJLPT commit used for the local copies in
`research/openjlpt/` was never recorded, so the catalogue cannot be traced to a
specific upstream version.

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
