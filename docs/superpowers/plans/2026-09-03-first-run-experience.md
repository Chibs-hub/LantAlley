# First-Run Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give a new learner a reason to want the Inn's teaching, a stated purpose for the game, and a reason to come back tomorrow.

**Architecture:** A new stage phase, `coldopen`, reuses the whole existing render and answer path for the Inn's first encounter with all support suppressed and all scoring bypassed. Two dialogue strings change. Nothing about the ten questions, the day model, mastery, or the economy moves.

**Tech Stack:** Vanilla JS in one IIFE (`app.js`), stage content in `n2-home-inn-stage.js`, CSS in `styles.css`, tests with `node --test` against the fake DOM in `dom-harness.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-03-first-run-experience-design.md`

## Global Constraints

- Branch: stay on `codex/inn-learning-redesign`. Do not merge to `master`.
- Answer content stays Japanese; operating instructions stay English. Pinned by `question-renderer.test.mjs`.
- Bump `CACHE_VERSION` in `sw.js` and every `?v=` stamp in `index.html` together; `pwa.test.mjs` checks they agree.
- Write files as UTF-8 without BOM, plain ASCII in code, Japanese only inside string literals.
- `node --test` must pass at the end of every task. It is 414/414 at the start of this plan.
- Every new Japanese string is authored here for the owner to review; do not block on that review.

---

### Task 1: Cold-open content and phase metadata

**Files:**
- Modify: `n2-home-inn-stage.js:10-15` (DAY_META), and the module's return object near `n2-home-inn-stage.js:643`
- Test: `n2-home-inn-stage.test.mjs`

**Interfaces:**
- Produces: `N2HomeInnStage.coldOpen` = `{ wrongReply: string, correctReply: string }`, and `getDayMeta("coldopen")` returning `{day:0, label:"はじめの仕事", mode:"ためし", difficulty:"", stars:""}`.

- [ ] **Step 1: Write the failing test**

Add to `n2-home-inn-stage.test.mjs`:

```javascript
test("the cold open has its own replies and its own day badge", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  assert.ok(stage.coldOpen, "the stage has no cold-open content");
  // Kon absorbs a miss rather than scoring it, and offers the three days.
  assert.match(stage.coldOpen.wrongReply, /三日/);
  assert.doesNotMatch(stage.coldOpen.wrongReply, /間違/);
  // A learner who already knows the word is not sent to remedial practice.
  assert.match(stage.coldOpen.correctReply, /ご存じ/);

  // The badge must not claim this is Day 1 - Day 1 comes after it.
  const meta = stage.getDayMeta("coldopen");
  assert.notEqual(meta.label, "一日目");
  assert.equal(meta.stars, "");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test n2-home-inn-stage.test.mjs`
Expected: FAIL, "the stage has no cold-open content"

- [ ] **Step 3: Add the content**

In `n2-home-inn-stage.js`, add to `DAY_META` (after the `review` entry):

```javascript
    coldopen:{day:0,label:"はじめの仕事",mode:"ためし",difficulty:"",stars:""}
```

Add near the other content objects, above the return:

```javascript
  /* The first guest arrives before any teaching, and the learner almost
   * certainly cannot help her yet. That is the point: the three days are an
   * answer to a problem they have just felt rather than homework set in
   * advance. Kon absorbs the outcome - nothing here is scored, paid or
   * recorded - and the correct branch exists so a learner who already knows
   * 揃える is not sent to remedial practice. */
  var coldOpen = {
    wrongReply:"コン：「大丈夫ですよ。お客様は私が。三日ありますから、一緒に覚えていきましょう。」",
    correctReply:"コン：「よくご存じですね。では、残りの言葉も見ていきましょう。」"
  };
```

Add `coldOpen:coldOpen,` to the returned object beside `intro:intro,`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test n2-home-inn-stage.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add n2-home-inn-stage.js n2-home-inn-stage.test.mjs
git commit -m "Add cold-open replies and its day badge to the Inn stage"
```

---

### Task 2: Suppress support and retries during the cold open

**Files:**
- Modify: `app.js` — the romaji gate at ~2608, the hint gate at ~2613, the encounter counter at ~2610, and the four `stagePhase === "challenge"` single-attempt gates at ~5112, ~5122, ~5144, ~5552
- Test: `walkthrough.test.mjs`

**Interfaces:**
- Produces: `isSingleAttemptPhase()` returning true for `challenge` and `coldopen`.
- Consumes: nothing from Task 1 at runtime; the phase string `"coldopen"` is the only shared name.

- [ ] **Step 1: Write the failing test**

Add to `walkthrough.test.mjs`:

```javascript
test("the cold open shows the request with every support withheld", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  assert.equal(game.$("stage-phase-badge").textContent.indexOf("一日目"), -1,
    "the cold open must not claim to be Day 1");
  assert.equal(game.doc.querySelectorAll(".inn-new-word").length, 0,
    "the new-word card is the main support and must be absent");
  assert.equal(game.$("romaji-line").style.display, "none",
    "romaji must be withheld");
  assert.equal(game.$("hint-btn").style.display, "none",
    "the hint button must be withheld");
  assert.equal(game.$("encounter-status").style.display, "none",
    "the cold open is one unscored task, not question 1 of 5");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test walkthrough.test.mjs`
Expected: FAIL — the badge reads 一日目 because `enterTheInn` currently lands on Day 1.

- [ ] **Step 3: Add the helper and widen the gates**

Add beside `offerRetry` in `app.js`:

```javascript
  // Challenge is scored on one attempt, and so is the cold open - for the
  // opposite reason. Challenge withholds a retry because the shift is timed;
  // the cold open withholds one because failing is what it is for.
  function isSingleAttemptPhase(){
    return state.stagePhase === "challenge" || state.stagePhase === "coldopen";
  }
```

Change the romaji gate to withhold romaji in the cold open:

```javascript
    $("romaji-line").style.display = state.romajiOn && state.stagePhase !== "challenge" && state.stagePhase !== "coldopen" ? "block" : "none";
```

Change the hint gate:

```javascript
    $("hint-btn").style.display = isSingleAttemptPhase() ? "none" : "block";
```

Change the encounter counter, which currently reads `$("encounter-status").style.display = "block";`:

```javascript
    $("encounter-status").style.display = state.stagePhase === "coldopen" ? "none" : "block";
```

Replace `state.stagePhase === "challenge"` with `isSingleAttemptPhase()` at the three `performInnAction` sites (`nearMiss`, `wrongVerb`, and the `result.outcome === "wrong"` branch) and at the guard on the first line of `offerRetry`.

- [ ] **Step 4: Run test to verify it still fails for the right reason**

Run: `node --test walkthrough.test.mjs`
Expected: still FAIL on the badge — nothing routes into `coldopen` yet. Task 3 does that. The other four assertions are now satisfied once the phase is entered.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "Withhold support and retries during the cold-open phase"
```

---

### Task 3: Route the intro into the cold open, and the cold open into Day 1

**Files:**
- Modify: `app.js` — the accept handler at ~2576, and `answerStage` at ~5473
- Test: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: `N2HomeInnStage.coldOpen` from Task 1; `isSingleAttemptPhase()` from Task 2.
- Produces: `resolveColdOpen(isCorrect, loc)`.

- [ ] **Step 1: Write the failing test**

Add to `walkthrough.test.mjs`:

```javascript
test("the cold open is unscored and hands over to Day 1", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  // Answer it wrongly on purpose: this is the moment the learner cannot do it.
  const zones = game.doc.querySelectorAll(".inn-drop-zone").filter(game.visible);
  const objects = game.doc.querySelectorAll(".inn-object").filter(game.visible);
  assert.ok(objects.length && zones.length, "the cold open renders its room");
  objects[0].click();
  zones[zones.length - 1].click();
  game.clock.advance(4000);

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.money || 0, 0, "the cold open must not pay");
  assert.equal(Object.keys(saved.reviewProgress || {}).length, 0,
    "the cold open is a demonstration, not evidence, and must not be scheduled");

  // And it hands over to Day 1, where the support comes back.
  game.clock.advance(4000);
  assert.match(game.$("stage-phase-badge").textContent, /一日目/,
    "the cold open must lead into Day 1");
  assert.equal(game.doc.querySelectorAll(".inn-new-word").length, 1,
    "Day 1 restores the new-word card");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test walkthrough.test.mjs`
Expected: FAIL — `enterTheInn` lands straight on Day 1, so the new-word card is already present and the money assertion trips.

- [ ] **Step 3: Route in and out**

Change the accept handler so the first visit opens with the guest:

```javascript
    $("btn-accept-helper").addEventListener("click", function(){
      startStagePhase(loc, "coldopen");
    });
```

Add `resolveColdOpen` beside `answerStage`:

```javascript
  /* The cold open borrows Day 1's first encounter and throws away the result.
   * Nothing is paid, scheduled, mastered or starred: the learner has not been
   * taught the word yet, so an answer here is evidence of nothing. Kon
   * absorbs it and the three days begin. */
  function resolveColdOpen(isCorrect, loc){
    state.answered = true;
    var stage = loc.coldOpen ? loc : getLocation(state.currentKey);
    var reply = stage.coldOpen
      ? (isCorrect ? stage.coldOpen.correctReply : stage.coldOpen.wrongReply)
      : "";
    $("narration").textContent = reply;
    showFeedback(true, isCorrect ? "けっこうです。" : "ここからが練習です。");
    $("btn-next").textContent = "一日目をはじめる →";
    $("next-row").style.display = "block";
  }
```

Add the early branch at the top of `answerStage`, before the challenge branch:

```javascript
    if(state.stagePhase === "coldopen"){
      resolveColdOpen(isCorrect, stage);
      return;
    }
```

`showPracticeTranslation(false)` and `showKonStageResponse` run above it today; move the cold-open branch above both so neither fires.

Make the continue button leave the phase. In the `btn-next` handler, before the existing `continueStageEncounter` call:

```javascript
    if(state.stagePhase === "coldopen"){
      startStagePhase(getLocation(state.currentKey), "learn");
      return;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test walkthrough.test.mjs`
Expected: PASS, including Task 2's suppression test.

- [ ] **Step 5: Commit**

```bash
git add app.js walkthrough.test.mjs
git commit -m "Open the Inn with an unscored first guest before the three days"
```

---

### Task 4: Do not replay the cold open on a resumed stage

**Files:**
- Modify: `app.js` — the accept handler from Task 3 if needed; verify against `enterLocation`'s existing first-visit condition
- Test: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: `resolveColdOpen` from Task 3.

- [ ] **Step 1: Write the failing test**

```javascript
test("a resumed stage does not replay the cold open", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-stage").click();
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");

  const reloaded = boot(saved, "?skip=1");
  reloaded.$("btn-start").click();
  reloaded.clock.advance(500);
  const inn = reloaded.doc.querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("月見宿"));
  inn.click();
  reloaded.clock.advance(500);

  assert.equal(reloaded.$("stage-phase-badge").textContent.indexOf("はじめの仕事"), -1,
    "a learner with progress must not be shown the first guest again");
});
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `node --test walkthrough.test.mjs`
Expected: PASS without further change, because `enterLocation` only calls `renderStageIntro` when `state.stageProgress.homeInn` is absent, and the cold open now sits behind that same button. If it FAILS, the resumed render is reaching the accept button; in that case gate the accept handler on `!state.stageProgress.homeInn` and route straight to `"learn"` otherwise.

- [ ] **Step 3: Apply the gate only if Step 2 failed**

```javascript
    $("btn-accept-helper").addEventListener("click", function(){
      startStagePhase(loc, state.stageProgress.homeInn ? "learn" : "coldopen");
    });
```

- [ ] **Step 4: Run the full suite**

Run: `node --test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app.js walkthrough.test.mjs
git commit -m "Keep the cold open to a learner's first visit"
```

---

### Task 5: Name the lanterns at the gate, and name tomorrow at the end

**Files:**
- Modify: `app.js:34` (Entrance `followUpCorrect.jp`), `app.js:~5495` (mastery message)
- Test: `entrance-stage.test.mjs`, `walkthrough.test.mjs`

**Interfaces:** none. Two string changes.

- [ ] **Step 1: Write the failing tests**

Add to `entrance-stage.test.mjs`:

```javascript
test("the Entrance says what the alley's lanterns are for", () => {
  // The map reads 灯り 0 / 6 from the first moment it is seen, and nothing
  // ever said what that counts or why it matters.
  assert.match(html, /灯り[^"]*戻り|消えています/);
});
```

Add to `walkthrough.test.mjs`:

```javascript
test("finishing the Inn points at tomorrow's review", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-stage").click();
  assert.match(game.$("feedback-text").textContent, /明日/,
    "the schedule really does hold these words for tomorrow, so the closing line should say so");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test entrance-stage.test.mjs walkthrough.test.mjs`
Expected: FAIL on both.

- [ ] **Step 3: Change the two strings**

Entrance `followUpCorrect.jp` becomes:

```javascript
        jp:"上手です！日本語を聞いて行動できました。この路地の灯りは、今は消えています。言葉をひとつずつ覚えるたびに、灯りがひとつずつ戻ります。さあ、行きたい場所を選んでください。",
```

Update its `romaji` in the same object to match:

```javascript
        romaji:"Jouzu desu! Nihongo o kiite koudou dekimashita. Kono roji no akari wa, ima wa kiete imasu. Kotoba o hitotsu zutsu oboeru tabi ni, akari ga hitotsu zutsu modorimasu. Saa, ikitai basho o erande kudasai.",
```

The mastery message becomes:

```javascript
          showFeedback(true, "三日目の挑戦を達成しました。" + state.challengeScore + "/" + items.length + "、五つの言葉を思い出せました。明日、この五つの言葉をもう一度たしかめましょう。");
```

- [ ] **Step 4: Run the full suite**

Run: `node --test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app.js entrance-stage.test.mjs walkthrough.test.mjs
git commit -m "Name the lanterns at the gate and tomorrow's review at the end"
```

---

### Task 6: Cache bump and live verification

**Files:**
- Modify: `index.html` (26 `?v=` stamps), `sw.js` (`CACHE_VERSION`)

- [ ] **Step 1: Bump the version**

```bash
sed -i 's/v=237/v=238/g' index.html && sed -i 's/lantern-alley-v237/lantern-alley-v238/' sw.js
grep -c "v=238" index.html && grep -n 'var CACHE_VERSION' sw.js
```

Expected: `26`, and `lantern-alley-v238`.

- [ ] **Step 2: Run the full suite**

Run: `node --test`
Expected: PASS

- [ ] **Step 3: Verify live in the browser**

Start the preview server, clear storage and the service worker, and load `http://localhost:8743/?bust=coldopen`. Walk it as a new learner: the gate, the bow, Kon's lantern line, the map, the Inn, accept the job.

Confirm by observation and measurement:
- The first guest's task appears with no new-word card, no romaji, no hint button and no 「問題 1 / 5」 counter.
- Answering it wrongly produces Kon's reply and a continue button, no stamp of failure, and `money` and `reviewProgress` both still empty in `localStorage`.
- Continuing lands on Day 1 with the new-word card, romaji and hint restored, asking the same cushion task.
- Finishing the stage shows the closing line naming tomorrow.

- [ ] **Step 4: Commit**

```bash
git add index.html sw.js
git commit -m "Cache v238 for the first-run experience"
```

---

## Self-Review

**Spec coverage.** Change 1 (cold open) is Tasks 1-4. Change 2 (lanterns) and Change 3 (tomorrow) are Task 5. The spec's "what does not change" list is honoured: no task edits the ten questions, the day model, mastery, unlocking, the economy, or any asset. The spec's structural suggestion of a separate `renderColdOpen` is deliberately not followed - reusing `startStagePhase` with a new phase string gets the same suppression for free through gates that already key off `state.stagePhase`, and adds less code. The spec's testing list maps to Tasks 2, 3, 4 and 5.

**Placeholders.** None. Every step carries the code or command it needs. Task 4 Step 2 has a conditional outcome, which is a real branch in the work rather than a placeholder, and Step 3 gives the exact code for the failing case.

**Type consistency.** `isSingleAttemptPhase()` is defined in Task 2 and used in Tasks 2 and 3. `resolveColdOpen(isCorrect, loc)` is defined and called in Task 3. `N2HomeInnStage.coldOpen.wrongReply` / `.correctReply` are created in Task 1 and read in Task 3. The phase string is `"coldopen"` everywhere, never `"cold-open"` or `"coldOpen"`.

**Known risk carried from the spec.** The cold open must stay one task and one reply. If implementation finds the arrange room needs more than one interaction to reach a resolvable state, stop and re-check the design rather than letting it become a two-question quiz.
