# Word Teaching Step Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach each focus word before it is tested, and extend the spacing schedule so the game can reach more than 280 words.

**Architecture:** A new pure module `word-teaching.js` resolves a focus word into a teaching card (word, reading, sense, authored sentence, highlight span, collocation pattern, empty image slot). The Inn's onboarding stage renders those cards one at a time between the word board and Day 1, each followed by one unscored check. Separately, `review-engine.js` gains two longer intervals. The dead `coldopen` phase is deleted.

**Tech Stack:** Plain ES5 browser JavaScript in IIFE modules on `window`/`self`, no build step, no dependencies. Tests are `node:test` + `node:assert/strict` in `*.test.mjs`, loading modules through `node:vm`. DOM tests use the hand-written `dom-harness.mjs`.

**Spec:** `docs/superpowers/specs/2026-09-10-word-teaching-step-design.md`

## Global Constraints

- Files are UTF-8 **without BOM**, LF endings. No smart quotes, no em dashes.
- Modules are ES5 IIFEs assigning to `root` where `root` is `typeof self !== "undefined" ? self : this`. No `const`, `let`, arrow functions, or template literals in shipped `.js` files. Test files (`.mjs`) may use modern syntax.
- Pure modules take `now`/`random` as arguments. No `Date.now()`, no timers, no DOM.
- Every new `.js` file must be added to **three** places or it 404s in production: a `<script src="NAME.js?v=NNN">` tag in `index.html`, the `SHELL` array in `sw.js`, and it must be committed to git. `pwa.test.mjs` checks the shell against `git ls-files`, not the filesystem.
- Any shipped change bumps the cache version everywhere: `CACHE_VERSION` in `sw.js`, and every `?v=` stamp in `index.html`, `manifest.webmanifest`, `sw.js`. Current version is **338**; this plan ships **339**.
- No Latin letters in Japanese answer content. Only "How to interact" copy may be English.
- Run the full suite with `node --test`. It takes about 160 seconds; do not assume a subset is enough before committing.

## Scope

This plan delivers a shippable increment: the spacing fix, the teaching module, and the Inn onboarding stage (5 words) teaching properly. The episode path (20 episodes, 200 authored sentences) is deliberately a **follow-up plan** - it is content work of a different shape and this increment is independently valuable without it.

---

### Task 1: Extend the spacing schedule

The schedule never graduates past 14 days, so reviews accumulate until they fill the daily session and new words stop being introduced. The reachable ceiling is `session size x longest interval` = 20 x 14 = 280 words.

**Files:**
- Modify: `review-engine.js:17`
- Test: `review-engine.test.mjs`

**Interfaces:**
- Consumes: nothing
- Produces: `LanternReviewEngine.INTERVALS` becomes `[1, 3, 7, 14, 30, 90]`. No signature changes; `recordOutcome`, `getDueItems`, `isMastered` keep their shapes.

- [x] **Step 1: Write the failing test**

Add to the end of `review-engine.test.mjs`. This simulates the real session loop from `dailySessionCards` (app.js:2412-2429): due items first, oldest first, then unseen filler.

```javascript
/* The ceiling is session size times the longest interval, because an item that
 * comes back every N days occupies 1/N of a session slot for ever and nothing
 * retires. At [1,3,7,14] that is 20 x 14 = 280 words, against a catalogue of
 * 3,579 - so a learner stops meeting new words about a month in. This test
 * pins the ceiling so a change to INTERVALS or SESSION_SIZE cannot quietly
 * lower it again. */
function reachableWords(review, size, days, poolSize) {
  let progress = {};
  let now = T0;
  let introduced = 0;
  for (let d = 0; d < days; d++) {
    const due = review.getDueItems(progress, now).slice(0, size);
    const session = [...due];
    while (session.length < size && introduced < poolSize) {
      session.push("item-" + introduced++);
    }
    for (const id of session) {
      progress = review.recordOutcome(progress, { id, correct: true, now });
    }
    now += DAY;
  }
  return Object.keys(progress).length;
}

test("the schedule lets a daily learner reach far more than one session's worth of words", () => {
  const review = load();
  assert.deepEqual([...review.INTERVALS], [1, 3, 7, 14, 30, 90],
    "the ladder needs rungs past a fortnight or reviews eat the whole session");
  assert.ok(reachableWords(review, 20, 365, 3579) > 900,
    "a year of perfect daily practice should reach past 900 words, not stall near 280");
});
```

- [x] **Step 2: Run it and watch it fail**

```bash
node --test --test-name-pattern "far more than one session" review-engine.test.mjs
```

Expected: FAIL on the `deepEqual`, actual `[1, 3, 7, 14]`.

- [x] **Step 3: Extend the intervals**

In `review-engine.js`, replace line 17 and add the reasoning above it:

```javascript
  /* Rungs past a fortnight exist because nothing retires.
   *
   * An item that returns every N days occupies 1/N of a session slot for ever,
   * so the words a daily learner can hold is bounded by session size times the
   * longest interval. At [1,3,7,14] with a 20-card session that is 280, against
   * a catalogue of 3,579 - and reviews fill the session about a month in, after
   * which no new word is ever introduced. Adding 30 and 90 raises the same
   * arithmetic to 1,800.
   *
   * Not retirement: a mastered word still comes back, just rarely. Mastery here
   * is two delayed successes over seven days, which is not the same as knowing
   * something for ever, and a schedule that never asks again cannot notice
   * decay. */
  var INTERVALS = [1, 3, 7, 14, 30, 90];
```

- [x] **Step 4: Run the review-engine tests**

```bash
node --test review-engine.test.mjs
```

Expected: PASS, 12 tests. The existing schedule tests exercise only indices 0 and 1, so appending cannot disturb them.

- [x] **Step 5: Run the full suite**

```bash
node --test
```

Expected: PASS. Confirm `fail 0` before continuing.

- [x] **Step 6: Commit**

```bash
git add review-engine.js review-engine.test.mjs
git commit -m "Give the review ladder two rungs past a fortnight"
```

---

### Task 2: The `word-teaching.js` module

**Files:**
- Create: `word-teaching.js`
- Test: `word-teaching.test.mjs`

**Interfaces:**
- Consumes: `LanternCurriculumCatalog.getItem(id)` returning `{canonical, reading, meanings[], level}`.
- Produces:
  - `LanternWordTeaching.buildCard(entry, item, sense)` returns `{id, word, reading, sense, sentence, before, focus, after, pattern, image}` or `null` when `entry` is missing.
  - `LanternWordTeaching.validateEntries(words, entries)` returns an array of error strings, empty when valid.
  - `LanternWordTeaching.MIN_SENTENCE` is `12`.
  - `entry` shape authored by stages: `{sentence, pattern, focus}` where `focus` is optional.
  - `before`/`focus`/`after` split `sentence` so a renderer can highlight the target in place without doing string work itself.

- [x] **Step 1: Write the failing test**

Create `word-teaching.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./word-teaching.js", import.meta.url), "utf8"), context);
  return context.LanternWordTeaching;
}

const ITEM = { canonical: "揃える", reading: "そろえる", meanings: ["to put things in order"], level: "N2" };

test("a card splits its sentence so the word can be highlighted where it stands", () => {
  const teach = load();
  const card = teach.buildCard(
    { sentence: "お客様の分のスリッパを四つ揃えてください。", pattern: "〜を揃える" },
    ITEM, null);
  assert.equal(card.focus, "揃え", "the highlight covers the stem that actually appears");
  assert.equal(card.before + card.focus + card.after, card.sentence,
    "the three parts must rebuild the sentence exactly, or the renderer drops text");
  assert.equal(card.image, null, "art has a slot but nothing in it yet");
});

test("the sense prefers a stage override over the catalogue gloss", () => {
  const teach = load();
  const withOverride = teach.buildCard({ sentence: "これは揃える例文です。", pattern: "〜を揃える" }, ITEM, "adjustment");
  assert.equal(withOverride.sense, "adjustment");
  const without = teach.buildCard({ sentence: "これは揃える例文です。", pattern: "〜を揃える" }, ITEM, null);
  assert.equal(without.sense, "to put things in order");
});

test("a word with no teaching entry yields no card rather than a blank one", () => {
  const teach = load();
  assert.equal(teach.buildCard(null, ITEM, null), null);
});

test("validation catches the ways an authored entry goes wrong", () => {
  const teach = load();
  const words = [{ word: "揃える", item: ITEM }];

  assert.deepEqual(teach.validateEntries(words, {}), [
    "揃える has no teaching entry",
  ]);

  const short = teach.validateEntries(words, { "揃える": { sentence: "揃える。", pattern: "〜を揃える" } });
  assert.equal(short.length, 1);
  assert.match(short[0], /at least 12/, "a 9-character fragment is the catalogue's failing, not ours");

  const missing = teach.validateEntries(words, {
    "揃える": { sentence: "タオルを新しいものにしてください。", pattern: "〜を揃える" },
  });
  assert.equal(missing.length, 1);
  assert.match(missing[0], /does not contain/, "a sentence that never uses the word teaches nothing");

  const noPattern = teach.validateEntries(words, {
    "揃える": { sentence: "スリッパを四つ揃えてください。", pattern: "" },
  });
  assert.equal(noPattern.length, 1);
  assert.match(noPattern[0], /pattern/);

  assert.deepEqual(teach.validateEntries(words, {
    "揃える": { sentence: "スリッパを四つ揃えてください。", pattern: "〜を揃える" },
  }), []);
});
```

- [x] **Step 2: Run it and watch it fail**

```bash
node --test word-teaching.test.mjs
```

Expected: FAIL, cannot read `word-teaching.js` (ENOENT).

- [x] **Step 3: Write the module**

Create `word-teaching.js`:

```javascript
/* What a learner is shown about a word before being asked to use it.
 *
 * The boards already name the five words of a stage; nothing taught them. This
 * turns a focus word into the card that does, and it is pure so the content
 * rules can be tested without a browser.
 *
 * The sentence is authored per stage rather than taken from the catalogue.
 * Of the 200 focus words, 197 come from OpenJLPT with a median example of nine
 * characters - too short to show the grammar N2 is tested on - and some teach
 * the wrong thing outright: the catalogue's example for 揃える is 口を揃える,
 * an idiom meaning to speak in unison, while the game teaches it as tidying a
 * room.
 */
(function(root){
  "use strict";

  // Below this a sentence is a fragment rather than a use. The catalogue's
  // median example is nine characters, which is exactly what this excludes.
  var MIN_SENTENCE = 12;

  /* Where the word actually appears in its sentence.
   *
   * A verb is usually inflected - 揃える becomes 揃えて - so looking for the
   * dictionary form finds nothing. Falling back to the longest leading run of
   * the word that does appear catches the stem, which is the part worth
   * highlighting. An entry may name `focus` outright where even that is wrong.
   */
  function locate(sentence, word, authored){
    if(authored && sentence.indexOf(authored) >= 0) return authored;
    if(sentence.indexOf(word) >= 0) return word;
    for(var end = word.length - 1; end > 0; end -= 1){
      var stem = word.slice(0, end);
      if(sentence.indexOf(stem) >= 0) return stem;
    }
    return "";
  }

  function buildCard(entry, item, sense){
    if(!entry || !item) return null;
    var sentence = entry.sentence || "";
    var focus = locate(sentence, item.canonical, entry.focus);
    var at = focus ? sentence.indexOf(focus) : -1;
    return {
      id: item.id || null,
      word: item.canonical,
      reading: item.reading || "",
      // The catalogue's first sense is the general one and is sometimes wrong
      // for a particular story, which is why getCardSense already exists.
      sense: sense || (item.meanings && item.meanings[0]) || "",
      sentence: sentence,
      before: at >= 0 ? sentence.slice(0, at) : sentence,
      focus: at >= 0 ? focus : "",
      after: at >= 0 ? sentence.slice(at + focus.length) : "",
      pattern: entry.pattern || "",
      // Art has somewhere to go and nothing in it. 84 of the 200 focus words
      // are verbs or abstract nouns a picture cannot disambiguate, so the step
      // does not wait on illustration.
      image: entry.image || null
    };
  }

  /* Content bugs are cheap to introduce and expensive to notice by playing, so
   * they fail a test instead - the same argument learning-content.js makes. */
  function validateEntries(words, entries){
    var errors = [];
    (words || []).forEach(function(row){
      var word = row.word;
      var entry = (entries || {})[word];
      if(!entry){ errors.push(word + " has no teaching entry"); return; }
      var sentence = entry.sentence || "";
      if(sentence.length < MIN_SENTENCE){
        errors.push(word + " has a sentence of " + sentence.length
          + " characters; at least " + MIN_SENTENCE + " are needed to show a use");
        return;
      }
      if(!locate(sentence, word, entry.focus)){
        errors.push(word + " has a sentence that does not contain the word");
        return;
      }
      if(!entry.pattern){
        errors.push(word + " has no pattern, which is the part that makes it usable");
      }
    });
    return errors;
  }

  root.LanternWordTeaching = {
    MIN_SENTENCE: MIN_SENTENCE,
    buildCard: buildCard,
    validateEntries: validateEntries
  };
})(typeof self !== "undefined" ? self : this);
```

- [x] **Step 4: Run the tests**

```bash
node --test word-teaching.test.mjs
```

Expected: PASS, 4 tests.

- [x] **Step 5: Commit**

```bash
git add word-teaching.js word-teaching.test.mjs
git commit -m "Add the module that turns a focus word into a teaching card"
```

---

### Task 3: Register the module so it ships

A new `.js` file that is not in all three places 404s on the deployed site, and the service worker install throws on any non-200 - which once pinned every tester to their existing build.

**Files:**
- Modify: `index.html:357` (after `review-engine.js`), every `?v=338` stamp
- Modify: `sw.js:10` (`CACHE_VERSION`), `sw.js:37` (SHELL, after `review-engine.js`), every `?v=338` stamp
- Modify: `manifest.webmanifest`, every `?v=338` stamp

- [x] **Step 1: Add the script tag**

In `index.html`, directly after the `review-engine.js` line:

```html
<script src="word-teaching.js?v=338"></script>
```

- [x] **Step 2: Add it to the service worker shell**

In `sw.js`, in the `SHELL` array directly after `"./review-engine.js",`:

```javascript
  "./word-teaching.js",
```

- [x] **Step 3: Bump the cache version everywhere**

Every `337`-to-`338` style stamp moves to `339`. Verify first that every occurrence is a version stamp and not data:

```bash
for f in index.html manifest.webmanifest sw.js; do
  echo "$f total=$(grep -o '338' $f | wc -l) stamps=$(grep -o '?v=338' $f | wc -l) cache=$(grep -o 'lantern-alley-v338' $f | wc -l)"
done
```

Expected: for each file, `total` equals `stamps` plus `cache`. Then:

```bash
sed -i 's/?v=338/?v=339/g; s/lantern-alley-v338/lantern-alley-v339/g' index.html manifest.webmanifest sw.js
```

Use `sed`, not PowerShell: `Set-Content -Encoding utf8` on Windows PowerShell 5.1 writes a BOM, which these files must not have.

- [x] **Step 4: Verify the registration**

```bash
node --test pwa.test.mjs
```

Expected: PASS. This is the test that checks every shell entry is tracked by `git ls-files` and that every local asset carries the current stamp. It will fail until the next step commits the new file.

- [x] **Step 5: Commit**

```bash
git add index.html sw.js manifest.webmanifest word-teaching.js
git commit -m "Ship word-teaching.js in the shell as v339"
```

- [x] **Step 6: Re-run the shell test now the file is tracked**

```bash
node --test pwa.test.mjs
```

Expected: PASS.

---

### Task 4: Author the five teaching entries for the Inn

Three of the five already have project-quality sentences in the catalogue and are reused verbatim. Two do not: the catalogue teaches `揃える` through an idiom that means something else, and `調整` through a clarinet.

**Files:**
- Modify: `n2-home-inn-stage.js` (add `TEACHING`, export `getTeaching`)
- Test: `n2-home-inn-stage.test.mjs`

**Interfaces:**
- Consumes: `LanternWordTeaching.validateEntries`
- Produces: `N2HomeInnStage.getTeaching(focusWord)` returns the authored `{sentence, pattern}` entry or `null`.

- [x] **Step 1: Write the failing test**

Add to `n2-home-inn-stage.test.mjs`:

```javascript
test("every word the Inn teaches carries an authored sentence and pattern", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./curriculum-catalog.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("./word-teaching.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("./n2-home-inn-stage.js", import.meta.url), "utf8"), context);

  const stage = context.N2HomeInnStage;
  const catalog = context.LanternCurriculumCatalog;
  const words = stage.encounters.map((e) => ({
    word: e.focusWord,
    item: catalog.getItem(stage.getTargetId(e.focusWord)),
  }));
  const entries = {};
  words.forEach((row) => { entries[row.word] = stage.getTeaching(row.word); });

  assert.deepEqual(context.LanternWordTeaching.validateEntries(words, entries), [],
    "a stage may not teach a word it has written no sentence for");
});
```

- [x] **Step 2: Run it and watch it fail**

```bash
node --test --test-name-pattern "authored sentence and pattern" n2-home-inn-stage.test.mjs
```

Expected: FAIL - `stage.getTeaching is not a function`.

- [x] **Step 3: Add the teaching entries**

In `n2-home-inn-stage.js`, after the `DAY_KINDS` block:

```javascript
  /* The sentence each word is taught with, and the pattern it lives in.
   *
   * Authored here rather than taken from the catalogue because the catalogue
   * cannot carry this. Its examples for these five run to a median of nine
   * characters, which is too short to show the grammar N2 tests, and two are
   * actively wrong for this stage: 揃える is exampled by 口を揃える, an idiom
   * meaning to speak in unison, and 調整 by tuning a clarinet. The three that
   * are kept below are the catalogue's project-written entries, which were
   * authored for this inn in the first place.
   *
   * The pattern is the part that makes an N2 word usable and the part no
   * picture can convey, so it is a required field rather than a nicety.
   */
  var TEACHING = {
    "揃える": {
      sentence:"お客様の分のスリッパを四つ揃えてください。",
      pattern:"〜を揃える"
    },
    "取り替える": {
      sentence:"古いタオルを新しいタオルに取り替えてください。",
      pattern:"〜を〜に取り替える"
    },
    "温める": {
      sentence:"お茶をコンロでもう一度温めてください。",
      pattern:"〜を温める"
    },
    "調整": {
      sentence:"夕食の開始時刻を調整していただけますか。",
      pattern:"〜を調整する"
    },
    "引き受ける": {
      sentence:"今夜の夕食の配膳を引き受けていただけませんか。",
      pattern:"〜を引き受ける"
    }
  };

  function getTeaching(focusWord){
    return TEACHING[focusWord] || null;
  }
```

Add to the export object alongside `getCardSense`:

```javascript
    getTeaching:getTeaching,
```

- [x] **Step 4: Run the test**

```bash
node --test --test-name-pattern "authored sentence and pattern" n2-home-inn-stage.test.mjs
```

Expected: PASS.

- [x] **Step 5: Run the full suite**

```bash
node --test
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add n2-home-inn-stage.js n2-home-inn-stage.test.mjs
git commit -m "Write the five sentences the Inn teaches its words with"
```

**Note for the reviewer:** these five sentences are drafts by a non-native writer. The repository owner is a native speaker and reviews Japanese directly; flag them for that review rather than treating them as final.

---

### Task 5: Delete the cold open

All of this has been unreachable since v326 (commit 9681960 hardcoded `var phase = "learn"` at the entry point, and nothing assigns `stagePhase = "coldopen"`). Nothing a learner sees changes.

**Files:**
- Modify: `app.js` - 21 references
- Modify: `n2-home-inn-stage.js` - `coldOpen`, and the `coldopen` keys in `DAY_GOALS`, `DAY_KINDS`, `getDayMeta`, `getDayAnnouncement`
- Modify: `n2-home-inn-stage.test.mjs:1247`, `:1274` - delete both tests
- Modify: `pwa.test.mjs:970` - delete the test
- Modify: `walkthrough.test.mjs:253` - retarget the fixture

- [x] **Step 1: Write the test that pins what must survive**

A pre-v326 save can still carry `phase: "coldopen"`, and the guard that maps it to `learn` must stay. Replace the fixture at `walkthrough.test.mjs:253` with a named test:

```javascript
test("a save written before v326 still opens, though the cold open is gone", () => {
  // v326 stopped routing anyone into the cold open, but a save paused inside
  // one is still on disk somewhere. The phase no longer exists; the guard that
  // maps it to Day 1 is the only reason such a save is not stuck.
  const game = boot({
    version: 3, characterSelected: true, playerCharacter: "woman",
    visited: ["entrance"], starred: [], money: 0,
    stages: { "home-inn": { phase: "coldopen", question: 0 } },
    stageProgress: { homeInn: { phase: "coldopen" } },
  }, "?skip=1");
  game.$("btn-start").click();
  game.clock.advance(600);
  assert.equal(game.errors.length, 0, "an old save must not throw on load");
});
```

- [x] **Step 2: Run it and confirm it passes before the removal**

```bash
node --test --test-name-pattern "written before v326" walkthrough.test.mjs
```

Expected: PASS. It is a characterisation test - it must pass both before and after, which is what makes it useful.

- [x] **Step 3: Delete the cold open from the stage data**

In `n2-home-inn-stage.js`: delete the `coldOpen` object and its comment; delete the `coldopen:` key from `DAY_GOALS` and `DAY_KINDS`; delete `coldOpen:coldOpen,` from the exports; delete any `coldopen` branch in `getDayMeta` and `getDayAnnouncement`.

- [x] **Step 4: Delete the cold open from app.js**

Find every reference and remove it:

```bash
grep -n "coldopen\|coldOpen" app.js
```

Remove: `state.coldOpenSkipFirst` and `state.coldOpenRetryPending` (declarations and all uses), `resolveColdOpen` (app.js:7357) and its call sites, every `stagePhase === "coldopen"` branch, and inside `stageJobBoard` the `var opening = phase === "coldopen"` line plus the four ternaries reading `opening` - keeping the non-opening side of each.

**Keep** the resume guard at app.js:4007 exactly as it is:

```javascript
      state.stagePhase = resumed.phase === "coldopen" ? "learn" : (resumed.phase || "learn");
```

- [x] **Step 5: Delete the tests that protect dead data**

Delete `n2-home-inn-stage.test.mjs:1247` ("the cold open has its own replies and its own day badge") and `:1274` ("the cold open announces a guest, not Day 1") in full. Delete `pwa.test.mjs:970` ("Kon's answers to the cold open are spoken like the rest of her lines") in full - it asserts that two clips totalling 74KB install with the first-run audio group for lines nobody can hear.

Leave the two `.mp3` files on disk. Once unreferenced they cost nothing, and deleting generated audio is easy to regret.

- [x] **Step 6: Verify nothing but the guard survives**

```bash
grep -n "coldopen\|coldOpen" app.js n2-home-inn-stage.js *.test.mjs
```

Expected: exactly two hits - the resume guard in `app.js` and the characterisation test in `walkthrough.test.mjs`.

- [x] **Step 7: Run the full suite**

```bash
node --test
```

Expected: PASS, with three fewer tests than before.

- [x] **Step 8: Commit**

```bash
git add app.js n2-home-inn-stage.js n2-home-inn-stage.test.mjs pwa.test.mjs walkthrough.test.mjs
git commit -m "Clear out the cold open, unreachable since v326"
```

---

### Task 6: Render the teaching card

**Files:**
- Modify: `app.js` - new `renderTeachingCard`, called from the board's begin button
- Modify: `styles.css` - `.teach-card` block
- Test: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: `LanternWordTeaching.buildCard`, `N2HomeInnStage.getTeaching`, `state.teachQueue`
- Produces: `state.teachQueue` (array of focus words remaining), `state.teachIndex`. When the queue empties, control passes to the existing `startStagePhase(loc, "learn")`.

- [x] **Step 1: Write the failing test**

```javascript
test("the Inn teaches each word before the first question that scores it", () => {
  const game = boot(null, "?skip=1");
  game.$("btn-start").click();
  game.clock.advance(600);
  game.doc.querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("月見宿")).click();
  game.clock.advance(4000);
  game.doc.querySelectorAll("button").find((b) => /手伝います/.test(b.textContent)).click();
  game.clock.advance(1200);

  // The board still names the five words first.
  assert.equal(game.doc.querySelectorAll(".job-board").length, 1);
  game.$("btn-jobs-begin").click();
  game.clock.advance(200);

  const card = game.doc.querySelector(".teach-card");
  assert.ok(card, "a word is taught before it is asked about");
  assert.ok(card.textContent.includes("揃える"), "the first word is the first encounter's word");
  assert.ok(card.textContent.includes("〜を揃える"), "the pattern is shown, not just the gloss");
  assert.ok(game.doc.querySelector(".teach-focus"),
    "the word is highlighted inside its sentence, not only glossed beside it");
  assert.equal(game.doc.querySelectorAll(".teach-card img").length, 0,
    "no artwork exists yet and the card must not leave a broken slot");
});
```

- [x] **Step 2: Run it and watch it fail**

```bash
node --test --test-name-pattern "teaches each word before" walkthrough.test.mjs
```

Expected: FAIL - `.teach-card` is null.

- [x] **Step 3: Render the card**

Add to `app.js` near `stageJobBoard`:

```javascript
  /* One word, taught, before anything scores it.
   *
   * The boards name the five words and the margin card in Day 1 repeats word,
   * reading and gloss while the learner is already being scored. Neither
   * teaches. This does: the word at a size worth reading, the authored
   * sentence with the word highlighted where it stands, and the pattern it
   * lives in - which is the part of an N2 word that makes it usable.
   */
  function renderTeachingCard(loc){
    var word = state.teachQueue[state.teachIndex];
    if(!word){ startStagePhase(loc, "learn"); return; }
    var targetId = loc.getTargetId ? loc.getTargetId(word) : null;
    var item = targetId && typeof LanternCurriculumCatalog !== "undefined"
      ? LanternCurriculumCatalog.getItem(targetId) : null;
    var entry = loc.getTeaching ? loc.getTeaching(word) : null;
    var sense = loc.getCardSense ? loc.getCardSense(word) : null;
    var card = (typeof LanternWordTeaching !== "undefined")
      ? LanternWordTeaching.buildCard(entry, item, sense) : null;
    // A word with no authored sentence is a content bug caught by a test, but
    // a learner mid-stage should still move rather than meet a blank screen.
    if(!card){ state.teachIndex += 1; renderTeachingCard(loc); return; }

    $("stage-phase-badge").textContent = "あたらしい言葉";
    $("jp-line").textContent = "コン：「まず、この言葉を覚えましょう。」";
    $("romaji-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";

    $("scene").innerHTML = '<div class="teach-card">'
      + '<p class="teach-count">' + (state.teachIndex + 1) + ' / ' + state.teachQueue.length + '</p>'
      + '<p class="teach-word"><ruby>' + card.word + '<rt>' + card.reading + '</rt></ruby></p>'
      + '<p class="teach-sense" lang="en">' + card.sense + '</p>'
      + '<p class="teach-pattern">' + card.pattern + '</p>'
      + '<p class="teach-sentence">' + card.before
      + '<span class="teach-focus">' + card.focus + '</span>' + card.after + '</p>'
      + '<button class="btn btn-primary" id="btn-teach-next">つぎへ</button>'
      + '</div>';

    $("btn-teach-next").addEventListener("click", function(event){
      event.stopImmediatePropagation();
      state.teachIndex += 1;
      renderTeachingCard(loc);
    });
  }
```

In `stageJobBoard`'s `btn-jobs-begin` handler, when the phase is `learn` and the queue has not been built, build it and hand over:

```javascript
      if(phase === "learn" && loc.getTeaching){
        state.teachQueue = loc.encounters.filter(function(item){
          return !state.trainingCorrectWords[item.focusWord];
        }).map(function(item){ return item.focusWord; });
        state.teachIndex = 0;
        if(state.teachQueue.length){ renderTeachingCard(loc); return; }
      }
```

Add `teachQueue:[]` and `teachIndex:0` to the state defaults near `encounterIndex` (app.js:132).

- [x] **Step 4: Style the card**

Add to `styles.css` beside the `.job-board` rules:

```css
  /* A word being taught is read, not scanned, so it is set at a size that
     rewards looking at it - the boards already do the list-row version. */
  .teach-card{max-width:520px;margin:0 auto;padding:22px 18px;border-radius:14px;
    background:rgba(38,22,13,.82);border:1px solid rgba(255,224,170,.28);text-align:center}
  .teach-count{font-size:.78rem;opacity:.7;margin:0 0 10px}
  .teach-word{font-family:'Shippori Mincho',serif;font-size:2.4rem;margin:0 0 6px;color:#ffe1a2}
  .teach-word rt{font-size:.34em;opacity:.85}
  .teach-sense{font-size:.95rem;opacity:.85;margin:0 0 14px}
  .teach-pattern{display:inline-block;padding:4px 12px;border-radius:999px;
    background:rgba(15,8,5,.55);color:#ffd489;font-size:1rem;margin:0 0 16px}
  .teach-sentence{font-size:1.15rem;line-height:1.9;margin:0 0 18px}
  /* The word is highlighted where it stands rather than repeated underneath,
     so what is learned is the word doing its job in a sentence. */
  .teach-focus{color:#ffd489;font-weight:700;border-bottom:2px solid rgba(255,212,137,.5)}
```

- [x] **Step 5: Run the test**

```bash
node --test --test-name-pattern "teaches each word before" walkthrough.test.mjs
```

Expected: PASS.

- [x] **Step 6: Run the full suite**

```bash
node --test
```

Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add app.js styles.css walkthrough.test.mjs
git commit -m "Teach each Inn word before the first question that scores it"
```

---

### Task 7: The no-stakes check

**Files:**
- Modify: `app.js` - `renderTeachingCheck`
- Modify: `styles.css` - reuse `.teach-card`, add `.teach-check`
- Test: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: `state.teachQueue`, `state.teachIndex`, `LanternCurriculumCatalog`
- Produces: nothing persistent. This is the point of the task.

- [x] **Step 1: Write the failing test**

```javascript
test("the teaching check costs nothing, however it is answered", () => {
  const game = boot(null, "?skip=1");
  game.$("btn-start").click();
  game.clock.advance(600);
  game.doc.querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("月見宿")).click();
  game.clock.advance(4000);
  game.doc.querySelectorAll("button").find((b) => /手伝います/.test(b.textContent)).click();
  game.clock.advance(1200);
  game.$("btn-jobs-begin").click();
  game.clock.advance(200);
  game.$("btn-teach-next").click();
  game.clock.advance(200);

  const before = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  const options = game.doc.querySelectorAll(".teach-check button");
  assert.ok(options.length >= 2, "a check offers a choice");

  // Answer it wrongly on purpose: the cold open's failure was that a miss came
  // back, and nothing here may repeat or record.
  const wrong = options.find((b) => b.dataset.correct !== "1") || options[0];
  wrong.click();
  game.clock.advance(200);

  const after = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.deepEqual(after.reviewProgress || {}, before.reviewProgress || {},
    "a check taken seconds after study is recognition, not retrieval");
  assert.equal(after.money, before.money, "studying is not paid work");
  assert.deepEqual(after.masteredByStage || {}, before.masteredByStage || {},
    "and it does not count toward the mastery gate");
  assert.ok(game.doc.querySelector(".teach-answer"),
    "a miss is answered rather than repeated");
});
```

- [x] **Step 2: Run it and watch it fail**

```bash
node --test --test-name-pattern "check costs nothing" walkthrough.test.mjs
```

Expected: FAIL - `.teach-check` is null.

- [x] **Step 3: Point the card's button at the check**

In `renderTeachingCard` from Task 6, the button currently advances straight to
the next word. Replace that handler so studying leads to one attempt:

```javascript
    $("btn-teach-next").addEventListener("click", function(event){
      event.stopImmediatePropagation();
      renderTeachingCheck(loc, card);
    });
```

The `state.teachIndex += 1` that used to live here moves into the check's own
"next" button, added below, so a word advances only once it has been tried.

- [x] **Step 4: Render the check**

Add beneath `renderTeachingCard`:

```javascript
  /* One retrieval attempt, immediately, worth nothing.
   *
   * Worth nothing on purpose. review-engine.js refuses to treat repetition
   * inside one session as retrieval - "repeating an item minutes after getting
   * it right is recognition, not retrieval" - so recording this would
   * contradict the engine's own rule and inflate the schedule with successes
   * that prove nothing.
   *
   * A miss is answered and left. Sending it round again is exactly what the
   * cold open did, and what made the opening feel stuck.
   */
  function renderTeachingCheck(loc, card){
    var others = loc.encounters
      .filter(function(item){ return item.focusWord !== card.word; })
      .map(function(item){ return item.focusWord; });
    var options = [card.word].concat(others.slice(0, 2));
    // Deterministic placement from the word itself, so the answer is not
    // always first and the same word always sits in the same place.
    var at = card.word.length % options.length;
    options.splice(at, 0, options.splice(0, 1)[0]);

    $("scene").innerHTML = '<div class="teach-card">'
      + '<p class="teach-sense" lang="en">' + card.sense + '</p>'
      + '<p class="teach-question">どの言葉ですか。</p>'
      + '<div class="teach-check">' + options.map(function(word){
          return '<button type="button" class="btn" data-correct="'
            + (word === card.word ? "1" : "0") + '">' + word + '</button>';
        }).join("") + '</div>'
      + '<div class="teach-answer-slot"></div>'
      + '</div>';

    $("scene").querySelectorAll(".teach-check button").forEach(function(button){
      button.addEventListener("click", function(event){
        event.stopImmediatePropagation();
        if($("scene").querySelector(".teach-answer")) return;
        var right = button.getAttribute("data-correct") === "1";
        $("scene").querySelector(".teach-answer-slot").innerHTML =
          '<p class="teach-answer">' + (right ? "そうです。" : "正しい答えは「" + card.word + "」です。")
          + '</p><button class="btn btn-primary" id="btn-teach-next">つぎへ</button>';
        $("btn-teach-next").addEventListener("click", function(next){
          next.stopImmediatePropagation();
          state.teachIndex += 1;
          renderTeachingCard(loc);
        });
      });
    });
  }
```

Note: nothing in this function writes to `state` beyond `teachIndex`, and `saveProgress()` is never called.

- [x] **Step 5: Style the check**

```css
  .teach-question{font-size:1.05rem;margin:0 0 14px}
  .teach-check{display:flex;flex-direction:column;gap:8px;align-items:stretch}
  .teach-check button{font-family:'Shippori Mincho',serif;font-size:1.2rem;padding:12px}
  .teach-answer{margin:16px 0 12px;font-size:1.05rem;color:#ffd489}
```

- [x] **Step 6: Run the test**

```bash
node --test --test-name-pattern "check costs nothing" walkthrough.test.mjs
```

Expected: PASS.

- [x] **Step 7: Run the full suite**

```bash
node --test
```

Expected: PASS.

- [x] **Step 8: Commit**

```bash
git add app.js styles.css walkthrough.test.mjs
git commit -m "Give each taught word one attempt that costs nothing"
```

---

### Task 8: Record the change

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/handoffs/` - new handoff for the remaining 195 sentences

- [x] **Step 1: Add the changelog entry**

Newest at the top, as a `###` heading directly under the "Adding an entry" line. Cover: why the schedule gained two rungs and the ceiling arithmetic; that the teaching step exists and what it shows; that the check is unscored and why; that the cold open was already unreachable and is now gone along with 74KB of first-run audio; and that the five sentences are drafts awaiting native review.

- [x] **Step 2: Write the handoff for the remaining sentences**

Create `docs/handoffs/2026-09-10-teaching-sentences.md` listing all 195 focus words still needing a sentence and pattern, grouped by place, each with its current catalogue example so the author is reviewing a replacement rather than facing a blank page. Generate the list with:

```bash
node -e "
var fs=require('fs'),vm=require('vm');var c=vm.createContext({});c.self=c;c.window=c;
['curriculum-catalog.js','n2-home-inn-stage.js','n2-inn-episodes.js','n2-market-episodes.js','n2-teahouse-episodes.js','n2-station-episodes.js','n2-shrine-episodes.js'].forEach(function(f){try{vm.runInContext(fs.readFileSync(f,'utf8'),c);}catch(e){}});
var S=c.LanternEpisodeStages,cat=c.LanternCurriculumCatalog;
['home-inn','market','tea-house','station','shrine'].forEach(function(k){
  var st=S.get?S.get(k):S[k],seen={};
  console.log('## '+k+String.fromCharCode(10));
  st.episodes.forEach(function(ep){ep.days.forEach(function(d){d.questions.forEach(function(q){
    if(!q.target||seen[q.target])return; seen[q.target]=1;
    var it=cat.getItem(q.target),ex=((it.examples||[])[0]||{}).ja||'(none)';
    console.log('- '+it.canonical+' ('+it.reading+') '+(it.meanings[0]||''));
    console.log('  - catalogue: '+ex);
  });});});
});
" > docs/handoffs/2026-09-10-teaching-sentences.md
```

Then hand-write the document's opening: the two specifications that are load-bearing rather than preferences - at least 12 characters, because the catalogue's median of nine is what this replaces, and the sentence must contain the word, because a validation test asks - plus the note that a `pattern` is required and is the part that makes an N2 word usable.

- [x] **Step 3: Run the full suite one last time**

```bash
node --test
```

Expected: PASS, `fail 0`.

- [x] **Step 4: Commit**

```bash
git add CHANGELOG.md docs/handoffs/2026-09-10-teaching-sentences.md
git commit -m "Record the teaching step and list the sentences still to write"
```

---

## Follow-up, not in this plan

- **The episode path.** Wire the same teaching step into the 今夜の言葉 board (app.js:2806) and author 195 more sentences. Separate plan; this one ships without it.
- **Audio.** 200 clips through `generate-audio.py`, once the sentences are final. Needs a Python runtime, which is not installed on the current machine.
- **Artwork.** The `image` field renders nothing today. About 116 of the 200 words are concrete enough to illustrate; the other 84 are verbs and abstract nouns a picture cannot disambiguate.
