# Attribution and licensing

The vocabulary catalogue in this project is derived from open data. This file
records where each part came from and what that obliges. **Verified against the
upstream sources on 2026-08-27**, not assumed.

## The chain

`curriculum-catalog.js` is generated from the files in `research/openjlpt/`,
which come from the [OpenJLPT](https://github.com/evanclan/OpenJLPT) project.
OpenJLPT is itself assembled from four upstream sources:

| Data | Source | Licence |
| --- | --- | --- |
| Readings and glosses | JMdict / EDICT, [EDRDG](https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project) | CC BY-SA 4.0 |
| Kanji readings, meanings, stroke counts, grade, frequency | [KANJIDIC2](https://www.edrdg.org/wiki/index.php/KANJIDIC_Project), EDRDG | CC BY-SA 4.0 |
| N5–N1 level assignments | Jonathan Waller, [tanos.co.uk](https://www.tanos.co.uk/jlpt/) | CC BY |
| Example sentences | [Tatoeba](https://tatoeba.org/) | CC BY 2.0 FR |

OpenJLPT distributes the combined dataset under **CC BY-SA 4.0**, as the
ShareAlike provision of its upstream sources requires.

## What that obliges

**The derived data is CC BY-SA 4.0.** `curriculum-catalog.js` is a derivative of
CC BY-SA 4.0 data, so the share-alike provision follows it: if that file is
distributed, it must be under the same licence, with attribution and a link to
it.

Note that this attaches to the **data**, not automatically to the rest of the
code. The game's own source — the episodes, the engine, the artwork — is a
separate question the owner has not yet decided.

**Applications must show attribution on screen.** The EDRDG licence is explicit
that acknowledgement in documentation is not enough for an app: it asks for a
dedicated screen, such as an About menu, rather than only a startup splash. This
project satisfies that with the 「このゲームについて」 panel on the title screen.

**The data should be kept reasonably current.** The EDRDG asks that
redistributed dictionary data not be left to rot.

## An honest gap

The exact OpenJLPT commit or release used for the local copies in
`research/openjlpt/` **was never recorded**, so the catalogue cannot be traced
to a specific upstream version. Everything above is verified; the version is
not. Re-pulling from a recorded commit is the fix, and it would also refresh the
data as the licence asks.

## One thing worth being honest with learners about

The Japan Foundation does not publish official N5–N1 vocabulary or kanji lists.
Every JLPT level assignment in this catalogue — and therefore every claim this
game makes about what is "N2" — comes from Jonathan Waller's community lists.
They are careful, widely used approximations of an undisclosed syllabus, not the
real thing. The game should never claim more than that.
