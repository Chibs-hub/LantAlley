# Inn stage rebuild plan

Status: proposed, not started. Written 2026-09-07 on `codex/inn-learning-redesign`.

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
cold open (one task you cannot do yet)      <- unchanged, single attempt
   |
   v
job board: tonight's five jobs              <- NEW, replaces nothing today
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
Shown after the cold open, and again between days. Five jobs, each carrying its
word. Completed jobs check off as words are cleared.

**Why:** the learner needs to know the target words up front and needs to see
what is still weak - but three separate status screens in a fifteen minute
session stop the story dead, and grey chips read as failure. One board that
fills in is a checklist, not a report card, and it fits the fiction.

**Placement:** after the cold open, never before it. The cold open works
because you feel the need before you are given the words.

**Cost:** new screen in `app.js`, new styles. Save format gains per-word state.

### C4. Day 2 uses mixed formats

**What:** 3 cloze plus 2 guided tasks with support reduced (no romaji).

**Why:** five cloze items in a row is read-blank-tap five times, with no scene,
no mechanic and no consequence. It costs only about forty seconds more than
three, but attention is not measured in seconds. Coverage is about words, not
about the format being uniform.

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

## 5. Approvals needed

**Audio generation.** Eight spoken lines have no pre-rendered clip, and Day 3
at five words needs them [verified: all 21 Inn `jp` lines cross-checked against
`audio-index.js`]:

```
二つのマットに、同じ向きの座布団を二枚ずつ揃えてください。
汚れたシーツを洗濯かごに入れて、新しいシーツに取り替えてください。
ごはんを電子レンジで温めてください。
Cグループは18時以降、Dグループは20時までに夕食を始められます。... 調整してください。
朝食の配膳を引き受けてください。
切れた電球を回収箱に入れて、新しい電球に取り替えてください。
スープをコンロで温めてください。
荷物を運ぶ仕事を引き受けてください。
```

The two remaining uncovered lines contain `（　　）` and are cloze prompts that
are read rather than spoken, so they correctly have no audio.

`generate-audio.py` sends Japanese text to Microsoft Edge TTS, an external
service, and is approval-gated every time. Ask before running, and scope the
run - it renders every missing line project-wide by default, which has already
caused one oversized run this branch.

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

Audio (section 5) is needed before step 2 ships.

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
