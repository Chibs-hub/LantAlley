# Word Teaching Step Design

## Goal

Teach each focus word before it is tested, and remove the cold open that tested
it first. A lesson currently names its words twice and teaches them nowhere; a
learner meets an N2 word for the first time as a four-option question with
nothing to reason from.

## Product brief

- **User:** A Japanese learner reaching a new place, who may have no prior
  knowledge of any of its words.
- **Job:** Understand what a word means and how it is used, before being asked
  to use it for credit.
- **Current behaviour:** The stage board names five words with a gloss. The
  cold open then asks a question about a word nobody has been taught. Day 1
  repeats that question if it was missed, which is the usual case. A margin
  card repeats word, reading and gloss while the learner is already answering.
- **Desired outcome:** Between the board and Day 1 sits a teaching step: one
  word at a time, with an authored sentence showing the word at work, and one
  unscored check.
- **Success signal:** A learner can say what a word means and give the pattern
  it appears in before the first graded question of the day.
- **Non-goals:** No new artwork. No audio in this change. No rewrite of the
  200 authored questions. No change to the four SRS interval steps already in
  use, nor to the miss penalty.

## Why the cold open goes

It is not a scene. `N2HomeInnStage.coldOpen` is two Kon replies; the question
is encounter one, played early and unscored. Removing it loses no story beat,
because the guest it introduces is the guest Day 1 introduces.

Its own day-goal text is the argument against it:

    coldopen: "まだ習っていない言葉ばかりです。できなくて大丈夫、今日から一緒に覚えましょう。"

A step that opens by saying it is fine to fail it is carrying no weight. Worse,
`coldOpenSkipFirst` is set only when the answer was correct, so a miss replays
that encounter as Day 1's first question. For a word never seen, a four-option
guess is about 75% likely to miss, which makes the repeat the default path
rather than the edge case. Six commits have been spent explaining this
mechanism: 53f5c60, 4c948bb, dc65e16, 32218cf, ed623f4, 59489f7.

Productive failure needs the learner to hold some resource to reason with. An
unrecognised word and four options is not that.

## Where it fits

Two parallel systems exist and both need the step.

| | intro stage (`N2HomeInnStage`) | episodes (`LanternEpisodeStages`) |
| --- | --- | --- |
| shape | 5 encounters over 3 days | 20 episodes, 10 words each |
| board | per day, from `loc.encounters` (app.js:3604) | 今夜の言葉 per episode (app.js:2806) |
| cold open | yes, only here | no |

Resulting flow:

- **Intro:** stage board, teaching step, Day 1 board, Day 1
- **Episodes:** 今夜の言葉 board, teaching step, Day 1

The step teaches only words the board marks as new. The two boards decide
"new" differently, and this is deliberate rather than an inconsistency to fix
here:

| | how "known" is decided | persists across sessions |
| --- | --- | --- |
| episodes | `masteredByStage[key]` contains the id | yes |
| intro | `trainingCorrectWords[word]` | no, reset at stage start |

So a replayed intro stage re-teaches all five words. That is correct: the
intro is the onboarding, and a learner returning to it has asked to start over.

## The teaching card

A new pure module, `word-teaching.js`, holding no DOM and no timers, in the
same style as `review-engine.js`. It resolves a focus word into a card:

    {
      id,            // catalogue id
      word,          // 揃える
      reading,       // そろえる, from the catalogue
      sense,         // getCardSense override, else catalogue gloss
      sentence,      // AUTHORED, required
      sentenceFocus, // substring of `sentence` to highlight
      pattern,       // 〜を揃える
      image          // null; the slot art drops into later
    }

`sentence` and `pattern` are authored per stage. Everything else is derived
from data that already exists, following the precedent of `getCardSense`,
which exists because the catalogue's first sense is sometimes wrong for a
specific story.

`sentenceFocus` defaults to the first occurrence of `word` in `sentence`, and
may be authored where the word appears inflected and the plain form does not
match.

### Why the sentence must be authored

The catalogue cannot carry this. Of the 200 focus words, 197 come from
OpenJLPT and 3 are project-authored, and they are not comparable:

| source | words | median example |
| --- | --- | --- |
| project | 3 | 23 characters |
| openjlpt | 197 | 9 characters |

135 of the 200 examples are under 12 characters, which is too short to show
grammar in context, and N2 is tested through grammar and collocation in
context. The register is wrong for a polite service setting, and some examples
teach the wrong thing outright:

- `案内` gives 「ご案内します。」 - a set phrase that never uses the noun
- `断る` gives 「僕だったら、断るな。」 - 僕 register, against the inn's Japanese
- `掃除` gives 「大掃除の時間よ。」 - teaches a different word
- `揃える` gives 「トムはとっても頭がいいって、人々は口を揃える。」 - 口を揃える is
  an idiom meaning to speak in unison, while the game teaches 揃える as tidying
  a room. Studying this sentence would actively mislead.

No item in the catalogue has `reviewed: true`. All 3,579 are unreviewed.

### Why no image

84 of the 200 focus words are verbs or abstract nouns where a picture is
ambiguous: a drawing of a tidy shelf could mean tidy, shelf, arrange or
finished. About 116 are concrete enough to illustrate. Illustration is
therefore a partial answer to a full problem, and the project already has 23
placeholder images outstanding from the art handoff.

The card carries an `image` field that renders nothing when null, so artwork
drops in later without a redesign. This is the pattern the garden used to ship
playable ahead of its photographs.

What does the teaching work instead, at no asset cost: the word set large with
furigana rather than at list-row size, the authored sentence with the target
word highlighted in place, and the collocation pattern, which is the part of an
N2 word that makes it usable and that no picture conveys.

### Why no audio in this change

`LanternAlleyAudio` maps exact sentence strings to pre-rendered clips, so 200
authored sentences means 200 new clips. That needs `generate-audio.py`, a
Python runtime, and TTS credentials, and `pwa.test.mjs` enforces that every
spoken line installs with the service worker shell. Generating clips before the
sentences are final would also waste the work. Audio is a follow-up, taken once
the text has settled.

## The no-stakes check

After each study card, one recognition question over the word just studied.

- Unscored, unpaid, and not recorded to `reviewProgress`
- A wrong answer reveals the correct one and moves on; it is never repeated

Not feeding the schedule is a rule, not an omission. `review-engine.js` already
refuses to treat same-session repetition as retrieval - "repeating an item
minutes after getting it right is recognition, not retrieval" - so recording a
check taken seconds after study would contradict the engine's own reasoning.

Never repeating the missed word is the specific failure of the cold open, and
is not reintroduced here.

## Removing the cold open

Delete, across 21 references in app.js:

- `coldOpen` from `N2HomeInnStage`, and `coldopen` from `DAY_GOALS`,
  `DAY_KINDS`, `getDayMeta` and `getDayAnnouncement`
- `state.coldOpenSkipFirst`, `state.coldOpenRetryPending`, `resolveColdOpen`
- every `stagePhase === "coldopen"` branch

Saves paused mid-cold-open already resume as `learn` (app.js:4007), so no new
migration is required.

Three test files carry cold-open assertions that are **deleted rather than
repaired**, because the behaviour they protect is being removed on purpose:

- `n2-home-inn-stage.test.mjs:1247` and `:1274` - two whole tests
- `pwa.test.mjs:970` - asserts cold-open clips install with the shell
- `walkthrough.test.mjs:253` - a save fixture pinned to `phase: "coldopen"`

## Spacing schedule change

One change, separable from everything above and landing first:

    INTERVALS = [1, 3, 7, 14]  ->  [1, 3, 7, 14, 30, 90]

The schedule never graduated past 14 days, and mastered items are never
retired, so reviews accumulate until they consume the whole daily session and
new words stop being introduced. Simulated against the real engine at 20 cards
a day for 365 days:

| intervals | accuracy | words met after a year |
| --- | --- | --- |
| `[1,3,7,14]` | 100% | 280 |
| `[1,3,7,14]` | 85% | 219 |
| `[1,3,7,14,30,90]` | 85% | 630 |

The ceiling is `session size x longest interval`, and 20 x 14 = 280 matches the
simulation exactly. The catalogue holds 3,579 items, so the current schedule
delivers about 6% of it in a year.

Deliberately **not** changed:

- **The miss penalty stays a reset to step 0.** `review-engine.test.mjs:60`
  asserts this by name and it is a defensible decision: a missed word needs
  rebuilding.
- **Mastered items are not retired.** The 90-day tail already does the work,
  and retiring them entirely would remove any chance of noticing decay.
  "Mastered" here means two delayed successes over seven days, which is not
  the same as known for ever.

Appending to `INTERVALS` breaks no existing test: the schedule tests exercise
only indices 0 and 1 (`review-engine.test.mjs:53-58`).

## Testing

**Content validation**, in the style of `learning-content.js`, so a content bug
fails a test rather than being found by playing:

- every focus word in every stage resolves to a teach entry
- `sentence` contains `word`, or an explicit `sentenceFocus` says where it is
- `sentence` is at least 12 characters, so a 9-character fragment of the kind
  the catalogue is full of cannot be pasted in
- `pattern` is present and contains the word

**Flow:**

- no `coldopen` phase is reachable from any entry point
- the teaching step appears between the board and the first graded question
- it teaches only the words the board marks new
- a save written mid-cold-open resumes into the teaching step

**No-stakes guarantee:** answering the check, right or wrong, leaves
`reviewProgress`, `money` and `masteredByStage` untouched.

**Schedule:** a simulation test pinning the reachable-word ceiling, so a future
change to `INTERVALS` or session size cannot silently regress it.

## Sequencing

The 200 sentences are the critical path; nothing ships without them. So the
work is staged per place rather than all at once:

1. The interval change, alone. Small, independently valuable, no content.
2. `word-teaching.js`, the card, the check, and cold-open removal, with the
   intro stage's 5 words and home-inn's 40 authored. This is shippable.
3. The remaining four places, 40 words each, one place per batch.

A handoff document lists all 200 words with their current catalogue example, so
the authoring is a review of what is being replaced rather than a blank page.

## Open questions

None blocking. Audio and artwork are both deferred by decision, and both drop
into fields the card already has.
