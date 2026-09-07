# Inn stage rebuild plan

Written 2026-09-07 on `codex/inn-learning-redesign`.

## Status

| | Item | State |
|---|---|---|
| 5B | Service worker installs the shell audio only | **done** - v262, 26.6 MB to 2.27 MB |
| C2 | First-attempt-only credit | **done** - v263 |
| C8 | Wrong-answer sound | **done** - v263 |
| C1 | All five words on all three days | **done** - v264, 15 clips rendered |
| C3 | Job board | **done** - v267 |
| C5 | Day 3 format split | **done** - 温める and 引き受ける use recorded listening prompts |
| C6 | Review ladder | **done** - v270 |
| C7 | Two gates (silver today, gold on retention) | **done** - v270 |
| W1 | Rewrite the throwaway distractors | not started |
| W2 | Two more scenes for 引き受ける | not started |
| W3 | Per-day story order | not started |

Two things found while building, recorded because they change the plan:

- **C2 was bigger than written.** Every retryable wrong answer returned before
  reaching `answerStage`, so a Learn or Practice miss was never scheduled for
  spaced review either. Section 9 credited the code with doing this correctly;
  it did not. Only Challenge misses were ever scheduled.
- **The audio estimate was wrong.** Section 5 said three clips, having counted
  only the requests. A newly covered word brings its narration and its success
  reply with it, so it was fifteen.
- **The review ladder's rungs were constrained by audio.** Section C6 proposed
  cloze, then a guided task, then audio. The guided rung had to use Day 1's own
  situation rather than variant A: variant A's requests are the one line set
  with no recorded clips, because nothing else ever speaks them.
- **Two ladder bugs were invisible to unit tests.** The cloze's wrong-answer
  branch never reached `answerStage`, so a missed review cloze offered no way
  forward and the next press restarted Day 3; and resuming into review rebuilt
  the identical Day 3 questions. Both were found by playing it in a browser.
  Anything that changes phase flow needs a walkthrough test, not a data test.

## What is left

`W1`-`W3` remain content work needing a native check:

- **W1** the four cloze options behave like two - one real near-miss and two
  throwaways.
- **W2** 引き受ける has one scenario, so its review ladder repeats a screen.
- **W3** the five words run in the same order every day.

This plan rebuilds how the Moonview Inn stage teaches its five words. It comes
out of a review of the current flow, and every claim below was checked against
the code rather than remembered. Line references are to the state of the branch
at commit `75efefe`.

---

## 1. Why

### 1a. The coverage ladder runs backwards

As difficulty rises, coverage falls:

| Day | Support | Words covered |
|---|---|---|
| Day 1 基礎 | Japanese + romaji + English + hint | all 5 |
| Day 2 実践 | glosses only | 3 (揃える, 温める, 引き受ける) |
| Day 3 挑戦 | audio only | 2 (揃える, 調整) |

The easiest day tests everything and the final exam tests 40 percent of it.
`取り替える` is asked exactly once, on Day 1, with hints on, and never again -
yet the stage can still be marked mastered.

### 1b. The mastery gate cannot be failed

`hasTrainingEvidence` requires each of the five words to have been answered
correctly once, anywhere, in any phase. Two things make that nearly free:

- Learn and Practice offer unlimited retries (`isSingleAttemptPhase`,
  app.js:5703). You cannot fail those days, only take longer.
- Credit is granted on the eventual correct answer, not the first one
  (`state.trainingCorrectWords[focusWord] = true`, app.js:5618). Brute-forced
  answers count as evidence of understanding.

So "mastered" currently means "clicked every word correctly at least once,
eventually, with help on."

### 1c. The learner is never told what they are learning

There is no screen anywhere that names the five target words, and no screen
that reports which ones are still weak. Per-word state is tracked internally
(`trainingCorrectWords`, `challengeCorrectWords`) and surfaced only as a medal
colour on the map.

---

## 2. Target flow

```
job board: tonight's five jobs              <- names the learning goal first
   |
   v
cold open (one unsupported task)             <- single attempt, unscored
   |
   v
Day 1 基礎   5 guided tasks, full support
   |
   v
job board (jobs check off)                  <- same screen, revisited
   |
   v
Day 2 実践   5 tasks, mixed format
   |
   v
job board
   |
   v
Day 3 挑戦   5 tasks, audio only            <- the real final test
   |
   v
review ladder, per missed word
   |  pass 1 in-session, different format, repeat until clean
   |  passes 2-3 handed to the spaced engine, on later days
   v
all 5 cleared today -> Episode 1 unlocks (silver)
all 5 held across spaced passes -> 習得 (gold)
```

---

## 3. Changes

### C1. Cover all five words on all three days

**What:** `getPhaseItems` returns all five for `practice` and `challenge`.

**Why:** fixes 1a. A final test that covers 40 percent of the material cannot
gate anything honestly.

**Cost:** Day 2 grows 3 to 5, Day 3 grows 2 to 5. Content already exists -
`practiceWordChoice` has entries for all five words and only three are ever
shown. A full clean run goes from about 10 tasks to about 15, roughly 12-15
minutes. The three days are played once, so this is affordable.

**Where:** `n2-home-inn-stage.js`, `getPhaseItems` and the `practice` /
`challenge` arrays.

### C2. Credit only first-attempt correct answers

**What:** `trainingCorrectWords` is set only when the answer is right on the
first try. Retried answers still teach, still pay, still advance - they just do
not count as evidence.

**Why:** fixes 1b. Without this, every gate built in this plan is decorative.

**Do not change:** `scheduleReview(targetId, isCorrect)` at app.js:5612 is
already called with the first-attempt result, so the spaced engine records the
failure honestly today. That separation is correct. Keep it.

**Cost:** small - one flag on the prompt, checked at app.js:5618.

### C3. Job board replaces the word list and the progress readouts

**What:** one screen, styled as the innkeeper's board of jobs for the shift.
Shown before the cold open, and again between days. Five jobs, each carrying its
word. Completed jobs check off as words are cleared.

**Why:** the learner needs to know the target words up front and needs to see
what is still weak - but three separate status screens in a fifteen minute
session stop the story dead, and grey chips read as failure. One board that
fills in is a checklist, not a report card, and it fits the fiction.

**Placement:** before the cold open. Live testing showed that putting an
unsupported task first felt like being dropped into unexplained work. The
board names the five-word goal without telling the learner which word solves
the cold-open scene.

**Cost:** new screen in `app.js`, new styles. Save format gains per-word state.

### C4. Day 2 retrieves all five words in a new format

**What:** five four-choice Japanese clozes with support reduced (no romaji and
no full-sentence translation).

**Why:** Day 1 tests whether the learner can carry out each job. Day 2 changes
the retrieval demand consistently: read a new sentence and choose the Japanese
form that fits it. The four choices include the important near miss rather than
letting the learner repeat the room solution from memory.

### C5. Day 3 keeps the mechanic only where the action carries the meaning

| Word | Day 3 format | Why |
|---|---|---|
| 揃える | mechanic | doing it yourself is exactly 揃える vs 揃う |
| 取り替える | mechanic | swapping one thing for another is physical |
| 調整 | mechanic | the stepper is the concept |
| 温める | audio + 4-option choice | the distinction is food vs room, not action |
| 引き受ける | audio + 4-option choice | it is a decision, not an action |

**Why:** by the final test you already know 揃える means line them up. Dragging
cushions a third time is busywork with a listening test attached. Three slow
and two fast also makes Day 3 short and tense rather than a slower replay of
Day 1, and lands closer to Episode 1's format so it works as the on-ramp.

**Bonus:** this removes the `引き受ける` coin flip. Its task today is a
two-button accept/decline, which is a 50/50 guess sitting inside the final
test. `practiceWordChoice[4]` already has four authored options
(引き受けて / 引き止めて / 引き出して / 引き返して). Reuse them. The yes/no
story decision stays on Day 1 where it belongs, so nothing is lost.

### C6. Review ladder: same word, new format, new scene

**What:** a missed word comes back in a different format each pass.

```
missed 取り替える
  pass 1  cloze          汚れたシーツを新しいシーツに(  )    pick 取り替えて vs 代えて
  pass 2  guided task    swap the burned-out bulb, no romaji
  pass 3  audio only     third scene, listen then act
```

Recognise, then do, then hear. The scene changes each pass (sheet, bulb,
towel), so the learner takes away that 取り替える means *swap for another of the
same kind* rather than one memorised sentence.

**Split across time:** pass 1 runs in-session, immediately after the miss,
repeating until clean - so the learner can finish tonight. Passes 2 and 3 are
handed to `review-engine.js`, which already implements 1/3/7/14 day spacing and
is already fed by every answer. Do not build a second loop that traps the
learner in the stage.

**Where:** `challengeMisses` becomes a per-word pass counter rather than a flat
list of prompts. New `getReviewLadder(word, passNumber)` in
`n2-home-inn-stage.js`. Review branch of `advanceStagePhase` loops until clear.

### C7. Two gates, using the medals that already exist

| Medal | Means |
|---|---|
| Silver | cleared all five at Day 3 difficulty today -> Episode 1 unlocks |
| Gold / 習得 | held all five across the later spaced passes |

**Why:** blocking Episode 1 for three days would be bad game design, but
"mastered" should mean retention rather than one good afternoon. Splitting the
gate gets both. Replaces `hasTrainingEvidence` as the mastery test.

### C8. Add a wrong-answer sound

**What:** one low note, same Web Audio synthesis as `playCoinSound`
(app.js:1538), following the same voice switch.

**Why:** correct answers get an instant non-verbal signal (coin chime, fox
celebrates, green 正解 stamp, +yen chip). Wrong answers get Kon speaking and a
red もう一度 stamp, but no cue sound - you have to read or listen to know. Both
modalities exist, but only one outcome has an instant one.

---

## 4. Content work

These are authoring tasks, not code, and each needs a native check.

### W1. Rewrite the throwaway distractors

Each cloze has one real near-miss (揃う vs 揃える, 調節 vs 調整, 代える vs
取り替える) and two obviously wrong options (散らかして, 片付けて). Four options
that behave like two make the item a coin flip. One pass per word.

### W2. Two more scenes for 引き受ける

All three interaction sets point at the same accept/decline errand screen, so
a three-pass review ladder would show the same screen twice. C5 removes it from
the Day 3 gate, which is the urgent half, but the ladder still needs variety.

### W3. Per-day story order

The same five words run in the same order three days running, which is where a
spiral starts feeling like a grind. This cannot be fixed by shuffling: there is
a comment in `n2-home-inn-stage.js` recording that an earlier shuffle
(2, 0, 4, 1, 3) made the day jump from after dark to the next morning to before
closing, because each narration is tied to its own task. Each day needs its own
coherent shift order written instead.

---

## 5. Audio: reuse first, generate last

An earlier draft of this plan asked for eight new clips. Checking which lines
already have audio brings that down to three, because the formats chosen in C5
can be pointed at lines that are already recorded.

### 5a. What already exists

[verified: every `jp` line in `n2-home-inn-stage.js` cross-checked against
`audio-index.js`]

| Array | Used by | Clips present |
|---|---|---|
| `encounters` | Day 1 | **5 of 5** |
| `practiceWordChoice` | Day 2 cloze | 3 of 5 (missing 取り替える, 調整) |
| `practiceVariantsB` | Day 3 | 2 of 5 (missing 取り替える, 温める, 引き受ける) |
| `practiceVariantsA` | nothing - dead for audio today | 0 of 5 |

Day 1 needs nothing. `practiceVariantsA`'s lines are never spoken under the
current design, which is why none were ever generated and why nothing is
broken.

### 5b. Day 3 costs one clip, not five

C5 moves 温める and 引き受ける to audio plus four-option choice. Those questions
should speak the cloze line, and both cloze lines are already recorded:

| Word | Day 3 format | Line it speaks | Audio |
|---|---|---|---|
| 揃える | mechanic | `practiceVariantsB[0]` | have it |
| 取り替える | mechanic | `practiceVariantsB[1]` | **generate** |
| 調整 | mechanic | `practiceVariantsB[3]` | have it |
| 温める | audio + choice | `practiceWordChoice[2]` | have it |
| 引き受ける | audio + choice | `practiceWordChoice[4]` | have it |

So C5 pays for itself twice: it removes the 引き受ける coin flip *and* it lands
the two reassigned words on clips that already exist.

**Unverified:** those two cloze lines contain `（　　）`. What Edge TTS rendered
for the blank has not been listened to. If it reads the brackets aloud rather
than pausing, these two need re-recording with a natural spoken phrasing.
Listen before relying on this.

### 5c. Total generation ask

| For | Lines |
|---|---|
| Day 3 covering 取り替える | 1 (`切れた電球を回収箱に入れて、新しい電球に取り替えてください。`) |
| Day 2 covering all five in cloze | 2 (`practiceWordChoice[1]`, `[3]`) |
| **Minimum to ship C1 + C5** | **3** |
| C4's two guided Day 2 items, if they use variant A scenes | +2 |

Three clips is about 120 KB. Five is about 200 KB.

### 5d. Missing audio degrades, it does not break

`speak()` tries the pre-rendered clip and falls back to
`speakWithSynthesis()` - the browser's own voice - when there is no file
(app.js:288). So a missing clip is a quality regression, not a crash. That
makes generation schedulable rather than blocking.

### 5e. Approval

`generate-audio.py` sends Japanese text to Microsoft Edge TTS, an external
service, and is approval-gated every time. Ask before running, and scope the
run - it renders every missing line project-wide by default, which has already
caused one oversized run this branch.

---

## 5B. Data footprint

### The clips themselves are already efficient

605 clips, 26.6 MB, mean 45 KB, encoded 48 kbps mono at 24 kHz - Edge TTS's
sensible default for speech. There are **no orphaned files and no duplicate or
near-duplicate keys**; the index and the directory agree exactly. Re-encoding
lower would hurt intelligibility for a few MB and needs ffmpeg, which is not
installed. **Do not re-encode.**

### The problem is what gets downloaded, not how big each file is

`sw.js` pushes every clip in the index into `SHELL` (sw.js:133-135), and
install fetches all of it before the app is usable offline. Attributing every
clip to its source file:

| Source | Clips | Weight |
|---|---|---|
| `n2-market-episodes.js` | 111 | 5.12 MB |
| `n2-inn-episodes.js` | 111 | 4.96 MB |
| `n2-teahouse-episodes.js` | 114 | 4.88 MB |
| `n2-station-episodes.js` | 111 | 4.80 MB |
| `n2-shrine-episodes.js` | 112 | 4.67 MB |
| `n2-home-inn-stage.js` (the three days) | 41 | 1.98 MB |
| `entrance-stage-logic.js` | 4 | 0.16 MB |
| `app.js` | 1 | 0.07 MB |

A brand new player can reach the Entrance and the Inn's three days. That is
**2.2 MB of audio they can use, and 24.4 MB - 92 percent - for four stages
behind progression gates**, downloaded before they can answer one question.

### Fix

Keep in `SHELL` only what is reachable at install: the entrance, the Inn's
three days, and `app.js`. Fetch each episode's audio when its stage unlocks.
The fetch handler already caches successful same-origin responses at runtime
(sw.js:188-194), so most of the machinery exists - the change is to stop
listing episode audio in `SHELL`.

**Trade-off to decide:** a player who installs for offline use and later
reaches an episode with no network gets browser-voice fallback instead of
Nanami. Mitigate by prefetching the next stage's clips in the background when
a stage unlocks. This is worth doing regardless of the rebuild, and it is
independent of it - it can ship first.

---

## 6. What does not change

- The cold open stays first, stays single-attempt, and stays before the job
  board. Failing it is what it is for.
- Wrong-answer feedback still never names the target word, so the learner
  cannot read the answer off the correction.
- `scheduleReview` keeps recording the first-attempt result.
- Day 3 stays audio-only for text support. That ladder already works.
- Episode 1 is untouched by this plan.

---

## 7. Order of work

1. **C2** (first-attempt credit) and **C8** (wrong-answer sound). Small, and C2
   is load-bearing for everything after it.
2. **C1** (full coverage) and **C5** (Day 3 format split). This is the honest
   final test, and it is the core of the rebuild.
3. **C3** (job board). Needs the save-format migration.
4. **C6** (review ladder) and **C7** (two gates).
5. **W1**, **W2**, **W3** content passes, each reviewed by a native speaker.

Audio (section 5) is needed before step 2 ships, but only three clips, and
missing ones fall back to the browser voice rather than breaking.

The service worker split (section 5B) is independent of all of this and can
ship first - it removes 24 MB from a new player's install on its own.

---

## 8. Known costs and risks

- **Save migration.** `stageProgress.homeInn` gains per-word pass state.
  Existing saves must not break.
- **Tests.** Fourteen test files touch this flow. `walkthrough.test.mjs`
  auto-plays the stage and will need the new loop. Suite is 433/433 today and
  must stay green.
- **Session length.** 10 tasks to about 15, plus in-session review passes. This
  is the deliberate price of a final test that covers what it claims.
- **Unverifiable by reasoning.** Whether the result is boring is a playtest
  question. This plan names where it is structurally likely to drag; only
  playing it can confirm. Worth playing the current Day 2 back to back before
  rebuilding it.

---

## 9. Does this actually teach? A review of the plan itself

Sections 1 to 8 fix how the stage *measures* learning: honest coverage, a gate
that can be failed, review that repeats until clean, retention separated from
performance. All of that is worth doing and none of it makes the learner better
at Japanese by itself. Reviewing the plan against how words are actually
acquired turns up three gaps it does not address.

### G1. Everything is recognition. Nothing is production.

Every format in the plan - guided task, cloze, audio plus choice - asks the
learner to *pick* or to *manipulate*. Not one asks them to produce 揃える from
memory. Four-option multiple choice is the weakest form of retrieval practice,
and the plan doubles down on it across all three days.

**Add:** one assembly item per word. `n2-inn-episodes.js` already defines a
`sentence-order` type for Episode 2's 文の組み立て, and `question-renderer.js`
already renders it. Reusing that renderer in the days costs no new machinery -
only the sentences.

### G2. The near-miss pairs are the real N2 target, and they are only distractors

揃える/揃う, 温める/暖める, 調整/調節, 取り替える/代える. These pairs are the
entire difficulty of this word set, and today each one appears as one wrong
option among four. A learner can clear the stage without ever being asked to
*contrast* the pair directly.

**Add:** one contrast item per pair - two sentences, both correct, assign the
right form to each. This is the item that proves the distinction is understood
rather than that the right button was findable.

### G3. Half of Episode 1 tests words the three days never teach

[verified: Episode 1's ten targets against the days' five focus words]

| Taught in the days | Never taught, tested in Episode 1 |
|---|---|
| 揃える 取り替える 温める 調整 引き受ける | **案内 注文 掃除 確認 断る** |

The days teach five words slowly and the episode - timed, no hints - asks about
ten. This is a bigger learning problem than anything in sections 1 to 8, and
the plan as written walks straight past it.

It is cheaper to fix than it looks. Three of the five already appear in the
days' own text (掃除 seven times, 確認 seven, 案内 three), and all five are in
the curriculum catalog, so `LanternGloss` can already annotate them wherever
they appear. Only 注文 and 断る are genuinely absent.

**Add:** let the days' narration carry all five as glossed support words, and
work 注文 and 断る into a line each. They then reach Episode 1 as words met in
context rather than words seen for the first time under a clock - which is what
an episode should be testing.

### What the plan already gets right, and should not lose

- The cold open creates the need before the teaching. Keep it first.
- Support fades day by day: romaji, then glosses, then audio alone.
- Spaced review at 1/3/7/14 days, fed by first-attempt results.
- Wrong answers explain the word the learner reached for instead of naming the
  target. That is the single best teaching moment in the stage.
- C2's first-attempt-only credit is what turns a tap-until-green screen into
  actual retrieval practice.

### One risk the plan introduces

The job board (C3) lists the five target words. If it is reachable *during* a
question, Day 2 and Day 3 answers can be read straight off it. It must be a
between-days screen only.
