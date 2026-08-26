# Five-Stage N2 Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cover N2 across a five-location game - every curated N2 vocabulary item tested at least once - with twenty authored story episodes teaching high-value language deeply and a generated catalog practice layer covering the rest with balanced vocabulary, grammar, kanji, reading and listening; immediate mistake correction; delayed review; and one randomized all-stage Mistake Review.

**Architecture:** Keep the dependency-free browser application, but separate curriculum data, question validation, review scheduling and stage content from `app.js`. Each stage exports the same episode contract. Pure engines remain Node-testable; `app.js` only coordinates state and rendering.

**Tech Stack:** Plain HTML, CSS and JavaScript; Node built-in test runner; browser `localStorage`; pre-rendered Edge TTS audio; service worker; standalone artifact builder.

**Spec:** `docs/superpowers/specs/2026-08-25-five-stage-n2-curriculum-design.md`

## Global Constraints

- Japanese is used for story, prompts, answer content and feedback. English is allowed only in How to interact and Entrance mechanic labels.
- Every question has exactly one primary reviewed target and exactly one valid answer.
- Coverage is the goal: every item in the project catalog - curated OpenJLPT n2 plus n3 plus the project supplement - is a primary target at least once. Delivery constraints bend to that, not the reverse.
- Two tiers. Tier 1 is 200 authored story questions with artwork, native review and pre-rendered audio. Tier 2 is generated catalog practice covering the remaining roughly 1,500 items, with no bespoke artwork and no pre-rendered audio.
- Each episode contains exactly 3 Learn, 3 Practice and 4 Challenge questions. Each stage has four episodes, so 40 Tier 1 questions per stage and 200 in the course.
- Every question has exactly one primary target. Slot credit for extra material processed but not judged is capped at three per question and never decides correctness.
- Per stage, Tier 1: 12 verb, 16 other vocabulary, 6 grammar and 6 kanji primary targets, summing to exactly 40.
- Grammar and kanji have no source in the repository. Their slots stay specified but unmet, and the game claims N2 vocabulary coverage only, until a source is approved.
- No answer type requires typing Japanese.
- The repair timer is a per-question-type budget carried in the question data, not a flat five seconds. It starts only after the prompt is fully available and audio has ended, and pauses while the document is hidden.
- The service worker precaches only the Entrance and app skeleton. Each stage caches its own audio and artwork on entry.
- The standalone artifact is an Entrance plus Inn Episode 1 demo and must build under 15 MB. It cannot hold the course.
- Correct repair answers leave the queue; wrong answers and timeouts move to the end.
- Mistake Review mixes all locations and displays one small source note.
- Concrete actions are used only when the Japanese meaning naturally maps to the action.
- The app stays dependency-free at runtime and works through `file://`, PWA and the standalone artifact.
- Every project edit updates `PROJECT-HANDOFF.md` in the same change.
- Do not commit, push, publish or deploy without owner approval.

---

### Task 1: Canonical curriculum catalog and coverage audit

**Files:**
- Create: `curriculum-catalog.js`
- Create: `curriculum-catalog.test.mjs`
- Create: `research/build-n2-catalog.mjs`
- Create: `research/n2-catalog-review.json`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: `research/openjlpt/n2.json` and `n3.json` (3,577 unique words combined, no overlap) and `research/jlpt-n5-n2-action-vocabulary.csv`.
- Produces additionally: `research/n2-supplement.json` for items the source omits.
- Produces: `LanternCurriculumCatalog.items`, `getItem(id)`, `validateCatalog()`, `getCoverage(assignments)`.

- [ ] **Step 1: Write the failing catalog contract test**

```js
test("catalog distinguishes source records from reviewed product items", () => {
  const catalog = loadCatalog();
  // 引き受ける is absent from every local OpenJLPT file, so it can only come
  // from the project supplement. If this resolves to a sourced record, the
  // supplement has been merged wrongly.
  const item = catalog.getItem("v-hikiukeru");
  assert.equal(item.canonical, "引き受ける");
  assert.ok(item.aliases.includes("引受ける"));
  assert.equal(item.source, "project");
  assert.equal(item.levelClaim, "N2-focused");
  assert.equal(item.reviewed, true);
});

test("kana-only headwords are their own reading, not excluded", () => {
  const catalog = loadCatalog();
  assert.equal(catalog.validateCatalog().excluded.length, 1);
  assert.ok(catalog.getItem("v-atatameru-food"), "温める must exist even though the source only has 暖める");
});
```

- [ ] **Step 2: Run the test and confirm the catalog is absent**

Run: `node --test curriculum-catalog.test.mjs`

Expected: FAIL because `curriculum-catalog.js` does not exist.

- [ ] **Step 3: Build the reviewed catalog generator**

Curate n2 and n3 together, not only the verbs - Tier 2 coverage depends on it. A curation pass has already been run and the data is clean: 1,792 of 1,793 n2 records are testable, the sole failure being the malformed `あげる (=やる)`. There are no duplicate words, no annotation noise in headwords and no kanji inside reading fields. Kana-only headwords are their own reading and must not be excluded for a blank `reading` field. All 1,537 n2 example sentences contain their headword exactly, so cloze generation needs no fuzzy matching.

The real work is not cleaning but **supplementing**. Measured gaps: 11 of 29 probed common N2 words are absent from all four local files, including `引き受ける`, `取り組む`, `落ち着く`, `促す`, `把握` and `温める`. Three of the game's five current Inn targets are absent. The source contains `暖める` but not `温める`, which would reintroduce a Japanese error this project already fixed.

`research/n2-supplement.json` holds project-authored entries with the same fields, marked `source: "project"` so they are never mistaken for sourced data. Seed it with the five Inn targets.

An item is testable only when it has a canonical spelling, a reading and at least one meaning. Everything else stays in the excluded list with a reason, visible rather than silently dropped.

`build-n2-catalog.mjs` must normalize orthographic aliases without silently merging distinct words. `n2-catalog-review.json` records canonical spelling, reading, type, source IDs, validity, active priority and reviewer note. Invalid or malformed source records remain visible in an excluded list with a reason.

```js
{
  "id": "v-hikiukeru",
  "canonical": "引き受ける",
  "reading": "ひきうける",
  "type": "verb",
  "aliases": ["引受ける"],
  "source": ["openjlpt-n2"],
  "reviewed": true,
  "activePriority": "core"
}
```

- [ ] **Step 4: Add deterministic coverage reporting**

`getCoverage(assignments)` returns exact totals for catalog items seen, primary-tested and mastered, grouped by item type, tier and official question family. It reports missing IDs instead of percentages alone, and separates testable items from excluded ones so coverage is never inflated by counting records the curation rejected.

Add a partition function assigning each testable item to one of the five locations by theme, so each location owns roughly 300 items.

- [ ] **Step 5: Run catalog tests and inspect the report**

Run: `node --test curriculum-catalog.test.mjs`

Expected: PASS, with the five current Inn targets resolved through reviewed entries or explicit substitution records.

- [ ] **Step 6: Ask for commit approval**

If approved: `git add curriculum-catalog.js curriculum-catalog.test.mjs research/build-n2-catalog.mjs research/n2-catalog-review.json PROJECT-HANDOFF.md` then `git commit -m "feat: add reviewed N2 curriculum catalog"`.

### Task 2: Shared episode and question contract

**Files:**
- Create: `learning-content.js`
- Create: `learning-content.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `build-artifact.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: catalog item IDs from Task 1.
- Produces: `LanternLearningContent.validateStage(stage)`, `getEpisode(stage, number)`, `getDayQuestions(episode, day)`, `makeRepairQuestion(question)`.

- [ ] **Step 1: Write failing validation tests**

```js
test("an episode has the fixed 3-3-4 progression", () => {
  const result = content.validateStage(sampleStage);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(sampleStage.episodes[0].days.map(d => d.questions.length), [3, 3, 4]);
});

test("English answer content is rejected", () => {
  const bad = structuredClone(sampleStage);
  bad.episodes[0].days[0].questions[0].options = ["Replace it", "Warm it"];
  assert.match(content.validateStage(bad).errors.join(" "), /English.*answer/);
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `node --test learning-content.test.mjs`

Expected: FAIL because the validator does not exist.

- [ ] **Step 3: Implement the stage schema**

```js
{
  key: "home-inn",
  episodes: [{
    id: "inn-e01",
    sourceNote: "月見宿・第一話「最初のお客様」",
    intro: { jp: "...", audio: true },
    days: [
      { day: 1, mode: "learn", questions: [] },
      { day: 2, mode: "practice", questions: [] },
      { day: 3, mode: "challenge", questions: [] }
    ]
  }]
}
```

Validation checks counts, primary targets, reviewed catalog IDs, answer cardinality, phase duplication, English leakage, source notes, feedback, audio flags and repair compatibility.

- [ ] **Step 4: Register the new script in every delivery path**

Load `curriculum-catalog.js` and `learning-content.js` before stage files in `index.html`. Add both to `sw.js` and `build-artifact.mjs`; bump the worker cache once at final delivery rather than after each intermediate task.

- [ ] **Step 5: Run contract and delivery tests**

Run: `node --test learning-content.test.mjs pwa.test.mjs`

Expected: PASS except for later stage assets intentionally not yet referenced.

- [ ] **Step 6: Ask for commit approval**

If approved, commit Task 2 files with message `feat: define shared episode question contract`.

### Task 3: Review scheduler and timed correction queue

**Files:**
- Create: `review-engine.js`
- Create: `review-engine.test.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: question IDs, answer outcomes and timestamps.
- Produces: `createRepairQueue(misses)`, `answerRepair(queue, id, correct)`, `recordOutcome(progress, outcome)`, `getDueItems(progress, now)`, `isMastered(itemProgress)`.

- [ ] **Step 1: Write the queue behavior tests**

```js
test("correct repair leaves while wrong repair moves to the end", () => {
  let queue = review.createRepairQueue(["q1", "q2", "q3"]);
  queue = review.answerRepair(queue, "q1", false).queue;
  assert.deepEqual(queue, ["q2", "q3", "q1"]);
  queue = review.answerRepair(queue, "q2", true).queue;
  assert.deepEqual(queue, ["q3", "q1"]);
});
```

- [ ] **Step 2: Write delayed mastery tests**

Use fixed UTC timestamps. Assert due intervals near 1, 3, 7 and 14 days, and assert mastery only after two delayed correct answers where one is at least seven days after first success.

- [ ] **Step 3: Run tests and confirm failure**

Run: `node --test review-engine.test.mjs`

Expected: FAIL because `review-engine.js` does not exist.

- [ ] **Step 4: Implement pure immutable queue and schedule functions**

Timeout uses outcome `timeout`, returns the item to the end and does not assign a linguistic misconception. Wrong uses outcome `incorrect` plus `errorTag`. Correct removes the active mistake record.

- [ ] **Step 5: Run the review tests**

Run: `node --test review-engine.test.mjs`

Expected: PASS with no timers or DOM dependencies.

- [ ] **Step 6: Ask for commit approval**

If approved, commit Task 3 files with message `feat: add correction and delayed review engine`.

### Task 4: Generic progress model and stage controller

**Files:**
- Modify: `app.js`
- Modify: `lantern-map.js`
- Modify: `lantern-map.test.mjs`
- Create: `learning-progress.test.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: stage contract from Task 2 and review state from Task 3.
- Produces: persisted `lanternAlley.v3`, generic `enterEpisode(stageKey, episodeId)`, `answerQuestion(questionId, answer)`, `resumeLearning()`.

- [ ] **Step 1: Write a failing v2-to-v3 migration test**

```js
test("v2 Inn completion survives v3 migration", () => {
  const migrated = migrateProgress({ stageProgress: { homeInn: { medal: "silver", phase: "challenge" } } });
  assert.equal(migrated.version, 3);
  assert.equal(migrated.stages["home-inn"].medal, "silver");
});
```

- [ ] **Step 2: Write generic location status tests**

Assert all four non-final stages can be entered after Entrance, Shrine remains locked until the four stages complete, and `記憶の灯` appears after the first mistake. Assert a declined location survives a reload and yields the welcome-back reply on return; this behaviour existed in v2 and was lost during a concurrent edit, so it needs a test rather than an assumption.

- [ ] **Step 3: Run the tests and confirm old Inn-only state fails**

Run: `node --test learning-progress.test.mjs lantern-map.test.mjs`

Expected: FAIL on missing v3 structure and generic stage keys.

- [ ] **Step 4: Implement v3 state without deleting v2 migration input**

```js
{
  version: 3,
  stages: { "home-inn": { episode: 1, day: 1, question: 0, medal: "none", declined: false } },
  items: {},
  mistakes: [],
  repairQueue: [],
  mastered: []
}
```

Do not delete the v2 loader until migration tests cover no progress, partial Inn progress and completed Inn progress.

- [ ] **Step 5: Replace Inn-specific progression branches with stage contract calls**

Keep existing public behavior for the current Inn until Task 6 migrates its data.

- [ ] **Step 6: Run progress and existing regression suites**

Run: `node --test entrance-stage.test.mjs lantern-map.test.mjs learning-progress.test.mjs n2-home-inn-stage.test.mjs`

Expected: PASS.

- [ ] **Step 7: Ask for commit approval**

If approved, commit Task 4 files with message `refactor: generalize stage progress and navigation`.

### Task 5: Adaptive question renderer

**Files:**
- Create: `question-renderer.js`
- Create: `question-renderer.test.mjs`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: validated question records and answer callback.
- Produces: renderers for `single-choice`, `image-choice`, `direct-action`, `ordered-action`, `sentence-order`, `evidence-choice`, `information-entry` and `quick-response`.

- [ ] **Step 1: Write failing renderer contract tests**

Assert every renderer exposes one named primary answer action, static two-to-three choices remain visible, English appears only in How to interact, and keyboard activation reaches the same answer callback as pointer activation.

- [ ] **Step 2: Add correction timer state tests**

Assert the timer is absent outside correction, begins after audio ends, pauses while the document is hidden, and timeout emits exactly one `timeout` outcome. Assert the budget comes from the question record, defaulting to 8 seconds, 5 for single-word recognition and 12 for a full-sentence repair prompt.

- [ ] **Step 3: Run tests and confirm failure**

Run: `node --test question-renderer.test.mjs`

Expected: FAIL because the renderer does not exist.

- [ ] **Step 4: Implement the smallest renderer per question type**

Reuse the cinematic shell, dialogue controller, feedback area and current room interaction engine. Do not put every question type into `app.js`.

- [ ] **Step 5: Add responsive styles**

Desktop may split context and answers. At 760px and below, stack the answer surface and keep Kon's current line visible. Timed correction uses no room scene and has one prominent timer.

- [ ] **Step 6: Run automated and rendered checks**

Run: `node --test question-renderer.test.mjs n2-home-inn-stage.test.mjs`

Then verify at 1280x720, 390x844 and 360x640 with keyboard-only completion and 200% text zoom.

- [ ] **Step 7: Ask for commit approval**

If approved, commit Task 5 files with message `feat: add adaptive N2 question renderer`.

### Task 6: Migrate Moonview Inn into four episodes

**Files:**
- Modify: `n2-home-inn-stage.js`
- Modify: `n2-home-inn-stage.test.mjs`
- Modify: `moonview-inn-interactions.js`
- Modify: `collect-spoken-lines.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: Tasks 1-5 contracts.
- Produces: four Inn episodes, 40 validated questions and the first complete location path.

- [ ] **Step 1: Write the fixed episode-count and story-order tests**

Assert four episodes, ten questions each, the exact episode titles from the spec, and one continuous festival-guest story.

- [ ] **Step 2: Write coverage tests for the Inn**

Assert 12 verb, 16 other vocabulary, 6 grammar and 6 kanji primary targets, summing to exactly the stage's 40 questions, plus all planned Inn question families. Assert no question carries more than three slot credits and that slot credit never appears in answer evaluation. The current five verbs must remain traceable to Episode 1.

- [ ] **Step 3: Resolve the three-day story conflict before authoring**

A concurrent edit frames the Inn as one three-day arc: 「三日間、宿の仕事を手伝ってくれませんか」. Four per-episode three-day arcs make twelve days, and that line becomes false. Get an owner decision, then make the Japanese and the structure agree. Recommended: keep the per-episode arc and rewrite the invitation as an open-ended request, with Episode 1 covering the first three days.

- [ ] **Step 4: Author Episode 1 using the current verified interactions**

Keep only decisive actions. Heating tea or soup uses the stove; rice uses the microwave. Replacing an item ends when the old object is removed and the new one is installed. No extra warm button exists.

- [ ] **Step 5: Author Episodes 2-4 from the Inn matrix**

Each episode must pass `validateStage`, include contextual correct and incorrect Kon feedback, and provide atomic repair forms for missed targets. The owner reviews the Japanese after the stage is authored, so authoring is not gated on review; corrections re-render only the clips whose text changed.

- [ ] **Step 6: Run Inn tests before audio generation**

Run: `node --test curriculum-catalog.test.mjs learning-content.test.mjs review-engine.test.mjs question-renderer.test.mjs n2-home-inn-stage.test.mjs moonview-inn-interactions.test.mjs`

Expected: PASS except audio coverage tests.

- [ ] **Step 7: Generate and verify Inn audio**

After explicit approval to send Japanese dialogue to Microsoft Edge TTS, run the full Python interpreter with `generate-audio.py`. Confirm every collected line has one local MP3.

- [ ] **Step 8: Ask for commit approval**

If approved, commit Task 6 files and generated audio with message `feat: expand Moonview Inn curriculum`.

### Task 6A: Delivery and scale gate

This task exists because the previous draft deferred every delivery question to Task 12, after all content was authored. One stage of rework is an acceptable cost for discovering a wall; five stages of authored and natively reviewed questions is not.

Run this immediately after the Inn is complete with real audio, and do not start Task 7 until it passes.

**Files:**
- Modify: `sw.js`
- Modify: `pwa.test.mjs`
- Modify: `build-artifact.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: the finished Inn stage, its audio, its artwork and its catalog partition.
- Produces: per-stage caching, an enforced artifact size ceiling and measured per-stage costs.

- [ ] **Step 1: Measure the real cost of one finished stage**

Record clip count, audio bytes, artwork bytes, curated catalog bytes and the resulting artifact size. The catalog ships in the shell as data, so confirm its size is a shell cost rather than a per-stage one. Compare against the section 3.2 projection of roughly 150 clips and 6.9 MB per stage. If a finished stage costs materially more, the episode count is wrong and the spec must change before four more stages are authored.

- [ ] **Step 2: Write failing tests for per-stage caching**

Assert the install shell contains the Entrance and app skeleton but not stage audio or stage artwork, that entering a stage caches that stage's assets, and that an offline reload of a visited stage still works while an unvisited stage degrades without breaking the app.

- [ ] **Step 3: Replace the all-or-nothing precache**

`cache.addAll` fails the whole install if a single entry 404s, which is correct for a small shell and unacceptable for a 34 MB course. Keep `addAll` for the shell; cache stage assets per stage on entry, tolerating individual failures with a logged miss rather than a dead install.

- [ ] **Step 4: Enforce the artifact ceiling in the builder**

`build-artifact.mjs` builds the Entrance plus Inn Episode 1 demo and exits non-zero above 15 MB, naming the largest inlined contributors. A build that silently produces an unpublishable file is worse than a failed build.

- [ ] **Step 5: Run delivery tests and an offline walkthrough**

Run: `node --test pwa.test.mjs entrance-stage.test.mjs n2-home-inn-stage.test.mjs`

Then load the app, enter the Inn, go offline and reload; confirm the visited stage still plays its audio.

- [ ] **Step 6: Record the measured numbers in the handoff and ask for commit approval**

Write the actual per-stage cost and the projected course total. If the projection now exceeds the budget, stop and revise the spec rather than continuing to Task 7.

### Task 6B: Catalog practice layer

This is the task that makes N2 coverage reachable. Tier 1 teaches roughly 200 items deeply; without this layer the other roughly 1,500 curated items are never tested and the coverage claim is false.

Cards are generated from the curated catalog, never hand-authored. The work is curation plus one generator, not 1,500 questions.

**Files:**
- Create: `catalog-practice.js`
- Create: `catalog-practice.test.mjs`
- Modify: `lantern-map.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: curated catalog and partitions from Task 1, scheduling from Task 3, renderers from Task 5.
- Produces: `buildPracticeCards(item)`, `getPracticeSession(stageKey, progress, now)`, `answerPracticeCard(id, outcome)`.

- [ ] **Step 1: Write failing card-generation tests**

Assert three card types generate from source data alone: reading from written form, meaning from word, and cloze from the record's own example sentence. Assert an item with no reading generates no reading card, an item with no example generates no cloze card, and an excluded record generates nothing at all. Assert every generated card has exactly one correct answer and that distractors come from the same partition and part of speech, so they are plausible rather than absurd.

- [ ] **Step 2: Write session and coverage tests**

Assert a session draws from the location's own partition plus items already due, that it prefers unseen items until the partition is seen, and that answering marks the item tested in `getCoverage`. Assert cards carry no pre-rendered audio requirement.

- [ ] **Step 3: Run tests and confirm failure**

Run: `node --test catalog-practice.test.mjs`

Expected: FAIL because the generator does not exist.

- [ ] **Step 4: Implement generation and session selection**

Kana-only items get meaning and cloze cards but no reading card. Distractor selection must be deterministic under an injected random function so tests are stable.

- [ ] **Step 5: Surface practice inside each location**

Practice is reached from within the location as Kon's 稽古, not as a separate flashcard mode, so coverage is distributed through the game. Reuse the correction card surface from Task 5. Show partition progress as seen and tested counts, never as a bare percentage.

- [ ] **Step 6: Run practice, review and coverage suites**

Run: `node --test catalog-practice.test.mjs review-engine.test.mjs curriculum-catalog.test.mjs question-renderer.test.mjs`

Expected: PASS, with a coverage report showing the Inn partition reachable.

- [ ] **Step 7: Ask for commit approval**

If approved, commit Task 6B with message `feat: add generated catalog practice layer`.

### Task 7: Build Lantern Market

**Files:**
- Create: `n2-market-stage.js`
- Create: `n2-market-stage.test.mjs`
- Create: `assets/market/`
- Modify: `lantern-map.js`
- Modify: `index.html`
- Modify: `collect-spoken-lines.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: shared content, renderer and review contracts.
- Produces: four Market episodes, 40 questions and a complete Market location.

- [ ] **Step 1: Write stage structure, coverage and map-entry tests**

Assert the four Market episode titles from the spec, exact 3-3-4 counts, the 12/16/6/6 primary-target split summing to 40, the three-slot cap and no duplicate Inn primary prompts.

- [ ] **Step 2: Author reviewed stage data**

Use the market matrix in order. Transactions use constrained totals and records; customer dialogue accepts every linguistically legitimate reply unless the task explicitly requires one consequence.

- [ ] **Step 3: Create one complete illustrated market scene system**

All answer targets must be visible, non-overlapping and understandable without labels that reveal the answer. Reuse one environment across related questions while varying evidence.

- [ ] **Step 4: Validate Japanese, interactions and source notes**

Run: `node --test n2-market-stage.test.mjs learning-content.test.mjs question-renderer.test.mjs`

Expected: PASS.

- [ ] **Step 5: Generate audio and verify desktop/mobile rendering**

Use the same voice and dialogue timing as the Entrance and Inn. Verify no scroll trap and no misdrop at 360px.

- [ ] **Step 6: Ask for commit approval**

If approved, commit Task 7 with message `feat: add Lantern Market stage`.

### Task 8: Build Evening Moon Tea House

**Files:**
- Create: `n2-tea-house-stage.js`
- Create: `n2-tea-house-stage.test.mjs`
- Create: `assets/tea-house/`
- Modify: `lantern-map.js`
- Modify: `index.html`
- Modify: `collect-spoken-lines.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: shared contracts.
- Produces: four Tea House episodes, 40 questions and a complete Tea House location.

- [ ] **Step 1: Write structure and legitimate-social-reply tests**

Assert all four episode titles, the 12/16/6/6 split and that offers, invitations and disagreements never turn valid refusal into a wrong answer.

- [ ] **Step 2: Author the stage around intention and register**

Use quick response, key-point listening, paraphrase and integrated conversation more often than object movement. Every reply option must be natural Japanese with a distinct social consequence.

- [ ] **Step 3: Build the illustrated tea-house shell and simple answer surfaces**

Keep Kon and speakers large in the environment. Dialogue and answer choices remain separate. Do not add decorative controls to abstract questions.

- [ ] **Step 4: Validate stage, audio and responsive behavior**

Run: `node --test n2-tea-house-stage.test.mjs learning-content.test.mjs review-engine.test.mjs question-renderer.test.mjs`

Expected: PASS.

- [ ] **Step 5: Ask for commit approval**

If approved, commit Task 8 with message `feat: add Evening Moon Tea House stage`.

### Task 9: Build Alley Station

**Files:**
- Create: `n2-station-stage.js`
- Create: `n2-station-stage.test.mjs`
- Create: `assets/station/`
- Modify: `lantern-map.js`
- Modify: `index.html`
- Modify: `collect-spoken-lines.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: shared contracts.
- Produces: four Station episodes, 40 questions and a complete Station location.

- [ ] **Step 1: Write schedule, announcement and constraint tests**

Assert each timetable question has one solution, every announcement question identifies its audio evidence, and all four episode titles and the 12/16/6/6 split match the spec.

- [ ] **Step 2: Author the stage around reading and listening under disruption**

Use tickets, signs, timetables and announcements. Challenge hides transcripts for listening items but never hides evidence required for reading items.

- [ ] **Step 3: Build the station scene with separated targets**

Interactive route, ticket and platform targets must remain distinct on phone and desktop. Incorrect taps cannot trigger dialogue advance.

- [ ] **Step 4: Validate stage, audio and responsive behavior**

Run: `node --test n2-station-stage.test.mjs learning-content.test.mjs question-renderer.test.mjs`

Expected: PASS.

- [ ] **Step 5: Ask for commit approval**

If approved, commit Task 9 with message `feat: add Alley Station stage`.

### Task 10: Build Lantern Keeper Shrine and final course ending

**Files:**
- Create: `n2-shrine-stage.js`
- Create: `n2-shrine-stage.test.mjs`
- Create: `assets/shrine/`
- Modify: `lantern-map.js`
- Modify: `app.js`
- Modify: `index.html`
- Modify: `collect-spoken-lines.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: completion status from the four open stages and global coverage report.
- Produces: four Shrine episodes, final integrated challenge and open-map ending.

- [ ] **Step 1: Write unlock and ending tests**

Assert Shrine is locked until Inn, Market, Tea House and Station are complete; the final completion returns to an open map and does not force a destination.

- [ ] **Step 2: Write final coverage-gate tests**

Assert every testable curated vocabulary item is a primary target in Tier 1 or Tier 2 and that the report names any missing IDs; assert all official N2 question families have at least one item; assert each stage meets its Tier 1 slots; and assert grammar and kanji are reported unmet while no approved source exists.

- [ ] **Step 3: Author the four Shrine episodes**

Use longer reading, integrated listening and cross-stage language transfer. Cultural facts are explained in the story and never assumed as prior knowledge.

- [ ] **Step 4: Build the final illustrated stage and conclusion**

The final scene visibly resolves the Lantern Festival. Kon summarizes progress in Japanese, then offers one return-to-map action.

- [ ] **Step 5: Validate stage and complete-course behavior**

Run: `node --test n2-shrine-stage.test.mjs lantern-map.test.mjs learning-progress.test.mjs curriculum-catalog.test.mjs`

Expected: PASS.

- [ ] **Step 6: Ask for commit approval**

If approved, commit Task 10 with message `feat: add Shrine finale and course completion`.

### Task 11: Add randomized all-stage Mistake Review

**Files:**
- Create: `mistake-review-stage.js`
- Create: `mistake-review-stage.test.mjs`
- Modify: `lantern-map.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: unresolved mistake records from Task 3 and source notes from stage content.
- Produces: `buildMistakeSession(mistakes, random)`, `answerMistake(id, outcome)`, `getMistakeReviewState()`.

- [ ] **Step 1: Write randomization and source-note tests**

Use an injected deterministic random function. Assert the session mixes stages, avoids adjacent identical targets when possible and preserves each question's source note.

- [ ] **Step 2: Write empty, resume and completion tests**

Assert the map destination appears after the first mistake, an interrupted queue resumes exactly, and zero mistakes produces Kon's cleared state plus one return action.

- [ ] **Step 3: Run tests and confirm failure**

Run: `node --test mistake-review-stage.test.mjs`

Expected: FAIL because the stage does not exist.

- [ ] **Step 4: Implement the focused quiz surface**

Reuse the correction card and timer. Do not show five stage columns or the full action scenes. Show one compact source note below Kon's line.

- [ ] **Step 5: Run review, navigation and responsive tests**

Run: `node --test mistake-review-stage.test.mjs review-engine.test.mjs lantern-map.test.mjs question-renderer.test.mjs`

Expected: PASS.

- [ ] **Step 6: Ask for commit approval**

If approved, commit Task 11 with message `feat: add randomized Mistake Review stage`.

### Task 12: Audio, offline delivery, artifact and final verification

**Files:**
- Modify: `collect-spoken-lines.js`
- Modify: `generate-audio.py`
- Regenerate: `audio-index.js`
- Regenerate: `assets/audio/`
- Modify: `sw.js`
- Modify: `pwa.test.mjs`
- Regenerate: `lantern-alley-artifact.html`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: all five stages, review stage, maps and assets.
- Produces: complete local/PWA build and standalone artifact.

- [ ] **Step 1: Write delivery tests for every referenced script, asset and spoken line**

The PWA suite must fail if a stage script is absent from the shell, an image is missing, or a spoken line has no clip. Stage audio and artwork are cached per stage rather than precached, so assert the shell excludes them and each stage supplies its own list. The artifact is the Entrance plus Inn Episode 1 demo, so assert it contains those and stays under 15 MB rather than asserting it contains every stage.

- [ ] **Step 2: Generate the final audio set after content freeze**

Obtain explicit approval before sending the Japanese text to Microsoft Edge TTS. Generate per stage so one location's content change never forces regenerating the other four. Prune stale clips and verify the voice is consistent across Entrance, all stages and feedback. Note that bare `python` on this machine is the Microsoft Store alias stub; use the full interpreter path.

- [ ] **Step 3: Bump the worker cache and rebuild the artifact**

Set one new cache version after all shell files are final. Run: `node build-artifact.mjs`, which now exits non-zero above 15 MB.

- [ ] **Step 4: Run the complete automated suite**

Run:

```powershell
node --test entrance-stage.test.mjs lantern-map.test.mjs moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs curriculum-catalog.test.mjs learning-content.test.mjs review-engine.test.mjs learning-progress.test.mjs question-renderer.test.mjs catalog-practice.test.mjs n2-market-stage.test.mjs n2-tea-house-stage.test.mjs n2-station-stage.test.mjs n2-shrine-stage.test.mjs mistake-review-stage.test.mjs pwa.test.mjs
node --check app.js
node --check sw.js
git diff --check
```

Expected: every test passes, syntax checks exit 0 and `git diff --check` reports no new whitespace errors.

- [ ] **Step 5: Complete rendered walkthroughs**

Walk Entrance, one complete episode in each stage, a timeout correction, interrupted correction resume, mixed Mistake Review, Shrine unlock and final ending. Check 1280x720, 390x844 and 360x640; keyboard-only; 200% text; missing-audio fallback; offline reload.

- [ ] **Step 6: Record exact verification evidence in the handoff**

Write test totals, artifact bytes, cache version, audio line count and any blocked browser checks. Do not claim verification that was not run.

- [ ] **Step 7: Ask for commit and publication approval separately**

Commit only if approved. Publish or update the external artifact URL only under a separate explicit approval.

## Near-term plan (2026-08-26)

Written after reviewing what is actually wired. The Inn plays end to end, but of
the five engines built in Tasks 1-5, two have **zero references in `app.js`**,
and the game teaches **10 words against a 3,579-item catalog** - 0.3% of the
coverage the spec is built around. The order below is chosen so each step makes
the next one possible, rather than by what is most visible.

### Step A - Adopt v3 progress (small, unblocks everything)

`learning-progress.js` is tested and unused; the game still stores the v2 shape.
Adopting it is the keystone: it is where episode position, the repair queue and
per-item state have to live.

Do it first because of a live bug: `previewState` is memory-only and
`repairQueue` has no references in `app.js`, so **reloading during an episode
loses the shift and the correction queue**. The spec requires that queue to
survive a reload, and a learner will hit this before they hit anything else.

- Load through `migrateProgress` on boot; keep the v2 loader until migration is
  covered for no progress, partial Inn progress and a completed Inn.
- Persist `stages[key].episode`, the question index, `repairQueue`, `mistakes`
  and `items`.
- Resume mid-episode and mid-correction, since both are now interruptible.

Done when: start an episode, answer three questions, reload, and land back on
question four with the same misses recorded.

### Step B - Tier 2 catalog practice (large, the actual goal)

Task 6B in the plan above. This is the difference between a demo and a course:
without it the catalog is a data file nobody reads.

Depends on Step A for item states - "seen", "tested", "mastered" have nowhere to
live until v3 is adopted.

Build the generator first and one location's partition second. Three card types
from data the catalog already has: reading from written form, meaning from word,
cloze from the record's own example sentence. No new artwork, no new audio.

Done when: the Inn's partition is reachable as Kon's 稽古, and `getCoverage`
reports a number that moves as the learner works.

### Step C - One rendering test that actually renders (small, overdue)

Around 262 assertions across the suites match source text rather than run code.
That is how `challenge is not defined` shipped: question 2 had a running clock
and no answer buttons while every test stayed green.

Add a minimal DOM harness - a fake `document` is enough for `renderInto` - and
assert a question is **answerable**: controls exist, a click reaches the answer
callback, and a wrong answer leaves the explanation on screen. One honest test
here is worth twenty string matches.

### Step D - Episode 2 (medium, content)

The four official N2 item types still missing: 表記, 語形成, 文の組み立て and
文章の文法. `sentence-order` is already declared in the renderer with nothing
calling it, so 文の組み立て is mostly wiring.

Deliberately after C: authoring more content on an untested renderer repeats the
mistake that let the crash through.

### Step E - Remove the test controls (trivial, last)

**Skip to next day** and **Preview Episode 1** ship in the build today. They stay
until the end because every step above is verified through them; removing them
first would make the work slower without making the game better. Remove or flag
them before anyone learns from this.

## Plan self-review

- Spec coverage: Tasks 1-12 plus 6A and 6B cover catalog, content contract, question types, review, progress, five stages, global review, audio and delivery.
- Scale: coverage of every curated N2 vocabulary item, reached through 200 authored Tier 1 questions plus a generated Tier 2 layer, so audio stays at about 33 MB while coverage goes to 100% of the curated file. Each stage's 40 questions carry exactly 40 primary targets, so the coverage assertions are satisfiable.
- Delivery risk is checked at Task 6A after one finished stage, not at Task 12 after five.
- Known blockers carried into execution: no approved grammar or kanji catalog source. The reviewer question is closed (the owner reviews after authoring) and the Inn three-day story conflict is resolved.
- Placeholder scan: every implementation step has a concrete file, interface, command and expected result.
- Interface consistency: every stage consumes `LanternLearningContent`; all answer outcomes flow through `review-engine.js`; `app.js` owns orchestration only.
- Scope split: each task produces an independently testable deliverable and can be reviewed before the next stage begins.
