# Lantern Alley Project Handoff

Last updated: 2026-08-27

## 0. Current status

**The course is complete and playable end to end.** Five locations, four episodes each, ten questions per episode: 20 episodes and 200 authored questions teaching 200 distinct words. `validateStage` passes for every stage with nothing filtered out - including the four-episodes-per-stage rule, which had been excluded from the Inn's tests for months because the Inn had only one episode.

| Place | Episodes | Story |
| --- | --- | --- |
| 路地の入口 | tutorial | Meeting Kon; answering Japanese with an action. |
| 月見宿 | 4 | 宵の一時間 / 予約帳 / 戻り客 / 宿を閉じる |
| 灯り市 | 4 | 宵の値段 / 品書き / 人の波 / 店じまい |
| 夕月茶屋 | 4 | お運び / 品書きを直す / 混み合う夕 / 店を閉める |
| 路地駅 | 4 | 終電まで / 窓口の書き付け / 放送が鳴る / 忘れ物 |
| 灯守神社 | 4 | 宵宮 / 立て札 / 太鼓が鳴る / 後始末 |

Every place covers all five official item types. The four written ones - 表記, 語形成, 文の組み立て, 文章の文法 - live in each place's second episode, because a spelling cannot be heard and a sentence you assemble is one you are looking at.

**Verification.** 259 automated tests pass, 0 fail. Bare `node --test` is the correct command. The standalone artifact is 9.58 MB and the service-worker cache is `lantern-alley-v100`.

**The one open decision.** Audio has not been generated for the four newer places. The course speaks 620 lines; 114 have clips. Inlining the remaining 506 would take the artifact to roughly 31 MB against a hard 16 MB limit, so on 2026-08-27 the owner chose to skip the audio run for now and to drop the Artifact as the delivery surface later, so that the finished game can ship with its voice. Nothing has been sent to Microsoft Edge TTS.

**What that costs today.** On the four newer places a listening item is read rather than heard. The clock is paced by the length of the line instead of by a recording, so nothing is unplayable, but the five-second items are tighter than they are at the Inn, where the clip plays first and the learner has already heard the request before the clock starts.

**Still outstanding.** The Japanese has not been reviewed by the owner, who is a native speaker and reviews after authoring rather than during. The two dashed test controls - **Skip to next day** and **Preview Episode** - still ship in the build.

## 1. Project summary

Lantern Alley is a local, browser-based JLPT N2 learning game. The player walks a small map, listens to or reads Japanese, and answers by doing the job rather than by picking a vocabulary card.

Two layers carry the language:

- **Tier 1, the story episodes.** 200 authored questions across five places. Each has a Japanese prompt, four choices, an explanation for every choice including the wrong ones, and a short correction form that returns at the end of the shift if it was missed.
- **Tier 2, Kon's practice (コンの稽古).** Reading, meaning and cloze cards generated from the 3,579-item vocabulary catalog - 9,097 cards, no item unreachable. This is what makes covering the catalog affordable: the story teaches 200 words deeply, and practice reaches the rest.

An episode is one shift in three parts (3 Learn, 3 Practice, 4 Challenge) against a clock, followed by 間違い直し, a timed correction round over only the items that were missed.

The project covers its own named vocabulary catalog. It does not claim complete JLPT N2 coverage: the official exam publishes no fixed post-2010 vocabulary, grammar or kanji list, and no grammar or kanji catalog has been approved for this project.

## 2. How to run the game

No installation or package manager is required.

1. Open `index.html` in Microsoft Edge, Google Chrome, or another modern browser.
2. Select `路地へ入る`.
3. Open `Moonview Inn` from the map.
4. If an older version is visible after an update, press `Ctrl+F5`.

Japanese audio plays from pre-rendered neural-voice MP3s, so pronunciation is identical on every device. If a line has no clip the game falls back to browser speech synthesis.

## 3. The central design rule

**The Japanese sentence must be the only thing that tells the player what to do.**

Every change below follows from that rule. If the scene, a label, an instruction, or the set of available objects narrows the answer on its own, the item is testing something other than Japanese comprehension and must be fixed.

Two consequences worth stating plainly:

- The scene never states its own solution rule. It may describe what is visible ("cushions differ in colour, size and facing") but never how to group or which to pick.
- The scene never reveals which action is wanted. All object-moving encounters show the same room, so the verb in the sentence is what selects the action.

## 4. Current learning design

### The shape of an episode

Every episode is ten questions in a 3-3-4 shape, told as one continuous shift:

- **Day 1 - Learn.** Three guided items, the request written out in full.
- **Day 2 - Practice.** Three items in changed situations.
- **Day 3 - Challenge.** Four items, longer and harder, including the reading.
- **間違い直し.** Only the items that were missed, on a shorter clock. Three tries at any one card, then Kon gives the answer and leaves it for a later review - an uncapped queue held a learner who could not get one card right for ever.

### Clocks

| Kind of question | Time |
| --- | --- |
| Short spoken reply | 5 or 8 seconds |
| Integrated or judgement item | 12 seconds |
| Spelling, word formation | 20 seconds |
| Sentence assembly | 30 seconds |
| Reading and passage items | 120 seconds |

The official paper allows roughly 80 seconds an item. Kon's briefing states the rules of the shift before the first question, and a test asserts the briefing never promises more time than the questions actually give.

### Where the answer sits

The correct choice is placed by a hash of the question id. Authored by hand it landed first 73% of the time, and in the correction round 100% of the time, which meant "always tap the top one" scored 73% without reading any Japanese. It is now 25/25/25/25 and 50/50. Re-run `node research/balance-answers.mjs <file>` after authoring; it carries each explanation note with its option and refuses to leave a sentence-assembly item in its own answer order.

### The words each place teaches

The catalog is partitioned five ways. Partitioning was round-robin, which dealt the market words like 血液, 競馬 and 国籍 - so the words a story actually teaches are now **pinned** to the place that teaches them in `research/authored-targets.json`, and everything else still spreads evenly. Coverage is a property of the practice pool, not of which forty words a story happens to use. Partitions stay balanced at roughly 700-730 items each.

## 5. Progress and scoring

Progress is stored in `localStorage` under `lanternAlley.v3`. The v2 key is read once and migrated, then left alone, so rolling back to an older build does not lose a learner's progress.

The record holds visited and starred places, the Inn's three-day position, which episodes are finished (`episodesDone`), which places have been entered (`stageStarted`), the state of every catalog item met in practice (`items`), and any shift left half-finished - including its correction queue, so a reload during an episode no longer throws the hour away.

A place's lantern lights when **every** one of its episodes is finished, not one of them.

Browser progress is not part of the project folder. Copying the folder transfers the game, not a player's saved progress.

## 6. Main files

### Content - the course itself

| File | Purpose |
| --- | --- |
| `n2-inn-episodes.js` | 月見宿, four episodes. Registers itself in `LanternEpisodeStages`. |
| `n2-market-episodes.js` | 灯り市, four episodes. |
| `n2-teahouse-episodes.js` | 夕月茶屋, four episodes. |
| `n2-station-episodes.js` | 路地駅, four episodes. |
| `n2-shrine-episodes.js` | 灯守神社, four episodes. |
| `n2-home-inn-stage.js` | The Inn's original three-day stage, with the shared room and its drag-and-drop objects. Still the way the Inn is first entered. |
| `curriculum-catalog.js` | Generated. 3,579 catalog items, partitioned five ways. Do not edit by hand. |
| `research/authored-targets.json` | The words each place teaches, pinned to that place before the round-robin runs. |
| `research/build-n2-catalog.mjs` | Rebuilds the catalog from the OpenJLPT sources plus the project supplement. |

### Engine

| File | Purpose |
| --- | --- |
| `app.js` | The controller: map, episodes, practice, speech, progress, scene rendering, drag-and-drop. |
| `learning-content.js` | The episode contract, and `validateStage`. |
| `question-renderer.js` | Turns a question into controls and a clock. The only part that touches the DOM, and it takes an injectable `document`. |
| `review-engine.js` | The correction queue and the spaced-review intervals. Caps a card at three tries. |
| `learning-progress.js` | The v3 progress model. |
| `catalog-practice.js` | Tier 2: builds reading, meaning and cloze cards from the catalog. |
| `lantern-map.js` | The map model. Node-testable, no DOM. |
| `entrance-stage-logic.js` | The Entrance, plus the shared dialogue reveal controller. |
| `moonview-inn-interactions.js` | Pure state engine for the Inn's room interactions. |

### Tooling

| File | Purpose |
| --- | --- |
| `research/balance-answers.mjs` | Moves each correct answer to a position derived from its question id. Run after authoring. |
| `build-artifact.mjs` | Builds `lantern-alley-artifact.html`, inlining every script, style, image and audio clip. The maintained builder; the `.py` one still works but needs the full interpreter path. |
| `generate-audio.py` | Renders every spoken line to MP3 with `ja-JP-NanamiNeural`. Hashes the text, so only changed lines cost anything. Needs network. |
| `collect-spoken-lines.js` | Collects the spoken Japanese. Walks every registered stage. |
| `audio-index.js` | Generated. Maps each line to its clip; imported by the page and by `sw.js`. |
| `dom-harness.mjs` | A DOM small enough to read, so tests can render rather than match source text. |
| `visual-smoke.mjs` | Manual screenshot script. Needs a browser on port 9223. Deliberately not named `*.test.mjs`. |
| `sw.js`, `manifest.webmanifest`, `icons/` | The PWA shell. Bump `CACHE_VERSION` on every shipped change. |
| `assets/` | Character art, the Inn room and its object sprites, and the generated audio. |

## 7. Testing and verification

```powershell
node --test
```

That is now the correct command and it needs no file list. 259 tests pass, 0 fail.

The suite guards three different things.

**The design rule.** The arrange scene never states its own grouping rule; the grouping attribute exists only in the Japanese; narration describes evidence without naming the required action; encounter titles are story beats, never verbs.

**The course as a whole** (`curriculum.test.mjs`, nothing filtered): five places, 20 episodes, 200 questions, 200 distinct words, no prompt reused anywhere, every word taught by the place whose partition holds it, every place covering all five item types, four choices and four explanations everywhere, answer content in Japanese only, briefings never promising more time than the questions give, counters that stop at 九つ.

**What a player would actually see** (`walkthrough.test.mjs`). This one boots the real `index.html` with every script and plays the game against `dom-harness.mjs`, solving the room the way the sentence tells it to. The invariant is blunt on purpose: wherever the game waits for the player, there is something to click.

That last suite exists because roughly 260 assertions match the *source text* of `app.js`, which is how `challenge is not defined` once shipped green - the string the test looked for was still in the file while the question rendered a running clock and no buttons. When the walkthrough was written, the bug's exact shape was reinjected: all 42 assertions in the suites covering that code passed, and the walkthrough failed with the real `ReferenceError`.

**Verify through the built artifact, not the dev server.** The dev server has repeatedly served stale files even after unregistering the service worker; the artifact has no service worker at all.

## 8. Publishing to the Artifact

The desktop shortcut points at a published Claude Artifact, not at the local file. The two are separate: editing the source files does **not** update the shortcut until the artifact is republished.

To republish:

1. Run `node build-artifact.mjs` to regenerate `lantern-alley-artifact.html`.
2. Publish that file to the existing artifact URL, passing the URL so it updates in place rather than creating a second artifact.

Current artifact: `https://claude.ai/code/artifact/951c7147-1dcf-4b9d-aced-2928ce94eb74`

An artifact cannot load sibling `.js` files or local images, which is why the build step inlines everything.

## 9. Change log and reasons

### 2026-08-27 - Review pass over all 200 questions

Asked for after the course was finished: check the material for coherence, and check that the questions and answers follow ordinary life logic. Seven real faults came out of it.

**An arithmetic error that two episodes disagreed about.** The market's takings item multiplied out to 4,690 yen while the option marked correct said 5,630 - and episode 4's accounts then opened with 5,630 as the evening's takings. The quantities are now 14 fruit, 5 boxed lunches and 3 bags, which is 5,830 less two 100-yen discounts, so the two episodes are one evening again.

**A notice that contradicted its own timetable.** The station's lost-property record had the extra train arriving at 11:20, but the timetable in episode 1 makes the extra train the 11:40 up-train; 11:20 is a down-train. The record now names trains by their timetable times.

**A question with two defensible answers.** The shrine's capacity item described a waiting group of three and then asked how many could enter. "Ten more may enter" and "yes, all three may" were both true. It now asks how many remain after that group is admitted, which is one number and uses all three stated rules.

**Kon promising more than the game gave.** Every briefing says 読む問題は二分, and every passage item ran on ninety seconds. All twenty are now two minutes, which is also what the owner asked for when reading items were first lengthened.

**An ambiguous rule.** The teahouse menu said お値段は変わりません without saying what the price does not change from. It now names the price.

**Two Japanese errors.** 二十四つ and 二十三つ appeared in three places; the つ counter stops at 九つ. And 見よく is not a word. Tea is now counted in 杯 rather than つ.

**One more ambiguity, in Episode 1.** A guest saying their tea has gone cold could reasonably be answered by replacing it - 取り替える was a distractor but was as defensible as 温める. The guest now asks for the same tea to be made warm again.

**Guards added** so each class of fault fails a test rather than waiting for a reader: briefing promises against actual clocks, the ★ explanation against the presence of a ★ item, counters past 九つ, and a set of instruction-and-opposite pairs where the correct answer must not be the opposite of what was asked.

259 tests, 0 failures.

### 2026-08-27 - Delivery decision: the Artifact cannot carry the finished game

**The measurement.** With all five places authored, the course speaks 620 lines. 114 have clips; 506 do not. Inlined as data URIs that is roughly 31 MB against an Artifact hard limit of 16 MB. Even the listening prompts alone - the 110 lines where the audio *is* the question - come to 6.9 MB on top of a build that is already 9.58 MB, and the scene art inside it has been WebP-optimised once already.

**The decision, taken by the owner on 2026-08-27.** Skip the audio run for now, and plan to drop the Artifact as the delivery surface in order to finish the full game. The Artifact stays useful as a preview of what exists today; it cannot be what the finished five-location course ships as.

**What that means in practice.** The new locations run on `spokenDuration()` - the clock is paced by the length of the line rather than by a recording - so nothing is unplayable and no question dies before it can be read. What is missing is the listening practice itself: on the four new places a listening item is read rather than heard, and on a device with no Japanese voice it is silent.

`collect-spoken-lines.js` now walks every registered stage rather than the Inn alone, so whenever the audio run does happen it will pick up all 506 lines without further change. Nothing was sent to Microsoft Edge TTS.

### 2026-08-26 - Step D: Episode 2 「予約帳」 and the four missing item types

**What was missing.** The official N2 paper has six vocabulary and grammar item types. Episode 1 carried two of them. 表記, 語形成, 文の組み立て and 文章の文法 had no home, and `sentence-order` sat declared in the renderer with nothing calling it.

**Why they are a second episode rather than more of the first.** All four are written Japanese. You cannot hear a spelling, and a sentence you assemble is a sentence you are looking at. Episode 1 is an hour of listening at the counter; Episode 2 is the paperwork that hour left behind - the book, the notices, the seal. The item types arrive with the work instead of being bolted onto a shift that was already about speaking. Most of Episode 2 is therefore silent, and its clocks are longer: 20 seconds for a spelling, 90 for a passage, against the exam's rough 80 seconds an item.

**Ten questions, ten Inn words**: 書類, 報告, 通知, 判子, 郵送, 削除, 延期, 指定, 満員, 清書 - all in the Inn's own catalog partition, because coverage is counted per location.

**A mistake caught while authoring.** The sentence-assembly pieces were first listed in their correct order, which meant the answer was "count to the star" and the Japanese never had to be read. They are shown scrambled now, and a test asserts that the pieces as displayed do not spell the finished sentence.

**Two rendering problems found by playing it.**

The four written types all answer through a plain list of choices, so the answer type alone could not say what the job was: a spelling question was telling the learner to "choose the reply Kon is asking for". The renderer now picks its how-to line by skill when one applies.

An answered question keeps its choices on screen while the explanation is read, and they were still live-looking but inert - a learner who answered wrong and then tapped the one they now believed was right got nothing at all. Choices are disabled on answer, the picked one stays lit and the rest dim.

**The Inn now moves on.** `currentEpisode()` returns the first unfinished episode; finishing one records it in `episodesDone`, which persists. A saved shift carries its `episodeId`, so a half-finished Episode 1 can never be resumed into Episode 2's questions.

**Verified** in the built artifact and in the harness: both episodes validate against the shared contract, Episode 2 opens as 第二話「予約帳」, all ten questions render with four choices, the passage items land in the wide document panel with their conditions written down, a wrong answer explains the choice that was taken, and the correction round runs. The walkthrough test plays from the entrance through the three days, Episode 1, its corrections and into Episode 2, and asserts the new item types were actually asked. 240 tests, 0 failures. Cache `lantern-alley-v93`, artifact 7.93 MB.

**Audio, since done.** The owner approved the Edge TTS run, so Episode 2's spoken lines now have real clips: 23 rendered, 91 unchanged, nothing pruned - the generator hashes the text, so only new lines cost anything. `collect-spoken-lines.js` already walked every episode, so no collector change was needed. Episode 2 speaks Kon's intro, the briefing, the one listening prompt, and both feedback lines for all ten questions.

Two of those lines read a star aloud - 「★は三番目です」 - because the feedback names the slot the learner was looking at. Worth an ear during review.

The artifact went from 7.93 MB to 9.36 MB: 23 clips inlined as data URIs, still well under the 15 MB ceiling. Verified in the built artifact that all 114 clips are present and that an Episode 2 clip decodes and reports its 7.01s duration. Cache `lantern-alley-v94`.

### 2026-08-26 - Step C: a test that actually renders the game

**The gap this closes.** Around 260 of this suite's assertions match the *source text* of `app.js`. That is how `challenge is not defined` shipped green: the string the test looked for was still in the file while question 2 rendered a running clock and no buttons. Reading source cannot see an empty screen.

**What was built.** `dom-harness.mjs` is a DOM small enough to read - elements, ids, classes, text, events with bubbling, a tag-soup `innerHTML` parser (app.js writes markup as strings and then looks up ids inside it), and a clock the test advances by hand so a six-second dialogue delay costs nothing. No dependency was added; this project has none, and jsdom would have brought a `package.json` and a `node_modules` for one file.

`walkthrough.test.mjs` boots the real `index.html` with all thirteen scripts and plays the game. It solves the room the way the sentence tells it to rather than knowing the answers: the cushions are grouped on the attribute the prompt names, the swap sends the worn thing out before the new one goes in, and the schedule reads its two-hour gap out of the sentence. The Challenge phase writes only 「音声を聞いてください。」, so the driver recovers the request by playing the audio index backwards - it listens, as a learner does.

The invariant it checks is blunt on purpose: **at every point where the game waits for the player, there is something to click.** It now runs the entrance, all three days, and into Episode 1's timed questions.

**Proof it works.** The bug's exact shape was reinjected - a stale identifier in `renderPreviewQuestion`, after the clock starts and before the buttons exist. All 42 assertions in the three suites covering that code passed. The walkthrough failed with the real `ReferenceError`. `app.js` was then restored byte for byte.

**Four harness gaps the game found**, each a real thing app.js relies on: `style.setProperty` for the scene art, `data-*` mirrored into `dataset` (the drop zones are matched by `zone.dataset.key`, and without it every placement scored as the wrong verb), `insertAdjacentHTML`, and the `value` attribute mirrored onto range inputs (without it every arrival time came out `NaN`).

**One thing that looked like a bug and was not.** The audio question appeared to hang forever. Audio playback is a promise, and a promise settles only when the stack yields - the walkthrough now yields between steps. The game's own fallback was fine.

**Verified.** 229 tests, 0 failures, bare `node --test`. Nothing ships: test files are not in `sw.js` or the artifact, and the artifact is unchanged at 7.92 MB.

### 2026-08-26 - Step B: the catalog is now playable, not just counted

**Why this exists.** The stated goal is covering N2. The story episode teaches ten words deeply, with artwork, audio and authored feedback - a method that cannot reach 3,579 items and should not try. Until today the catalog was data the game shipped and never showed. This layer turns it into practice generated from fields the catalog already holds, so the work is curating one dataset instead of authoring thousands of questions.

**What was added.** `catalog-practice.js` builds three card kinds per item: reading (kanji headwords only - a kana headword is its own answer), meaning, and cloze from the item's own example. Measured yield over the full catalog is 3,036 reading, 3,579 meaning and 2,482 cloze cards - 9,097 in all, with no item unreachable. Distractors are drawn from the item's own partition, so they are words met in the same place rather than noise, and they are deduplicated by value so a card can never carry two correct answers.

Cloze requires a kanji headword. Without that rule 「あっ」 was blanked out of 「何かあった？」, leaving 「何か（　　）た？」, which asks nothing. Three of the catalog's 3,307 examples do not contain their own headword; the same rule already excludes them.

**Where it lives, and why it moved.** The entry was first placed in the map's detail shelf and verified unreachable: an earlier change made clicking a destination enter it, so the shelf never stays on screen. It now sits in the map's progress row as 「コンの稽古　n / 716」.

It unlocks on having *started* the Inn, not on mastering it. `visited` is only set on mastery, so the first gate hid the button from every learner who had not already finished the stage - which is exactly the learner practice is for.

**Two gaps found while verifying.** A finished session dropped straight back to the map with the score computed and discarded, so a session ended with no sense of how it went; there is now a completion card with Kon's line and the score. And `renderPracticeCard` hid the feedback row without clearing its text, so the previous verdict flashed back for a frame on the next answer.

**Also.** `visual-smoke-test.mjs` is renamed `visual-smoke.mjs`. It is a manual script needing a browser on port 9223, and its `.test.mjs` name made bare `node --test` fail for anyone who did not know to exclude it - a footgun this document had to warn about twice. Bare `node --test` is now the correct command: 224 tests, 0 failures.

**Verified** in the built artifact rather than the dev server, which has repeatedly served stale files. From cleared storage: the entry appears after starting the Inn, opens an eight-card session, cards render with four choices, answering advances the counter, the completion card shows 2 / 8, returning to the map shows 「コンの稽古　8 / 716」, and after a reload the count is restored and the next session serves words not yet seen. Item states persist under `items` in `lanternAlley.v3` as 2 tested and 6 seen. Cache is `lantern-alley-v91`; the artifact is 7.92 MB and has not been republished.

### 2026-08-26 - Step A: progress moved to v3, and an episode now survives a reload

**The bug this fixes.** `previewState` was memory-only and `repairQueue` had no references in `app.js`, so reloading during an episode threw away the whole shift and the correction queue with it. The spec requires that queue to survive a reload, and it is the part a learner would least want to lose.

v2 had nowhere to put any of it. The record only knew about the three days.

**What changed.** The game now writes `lanternAlley.v3` through `learning-progress.js`, which was tested and entirely unused until today. The v2 key is read once and migrated, then left in place - if this build is rolled back, that record is still the learner's progress. The migration is written out once on boot rather than re-run on every load.

The day controller was not rewritten. `legacyViewOf` translates v3 back into the shape it already reads, because the two carry identical facts and a controller rewrite would have been risk without benefit.

Episode state is saved at five points: advancing a question, recording a miss, opening the correction round, settling a repair card, and finishing. Entering the Inn resumes an unfinished shift instead of replaying the days.

Verified in the artifact, three cases:

- **Mid-episode reload.** Answered one, missed one deliberately, answered a third, reloaded: resumed at 4/10 on 食事どき with the miss still recorded.
- **Mid-correction reload.** Resumed straight into 間違い直し at 1/2 with the queue intact and the five-second clock running.
- **A v2 learner.** Silver medal still shown, resumed at 三日目・挑戦 3/5, and v3 written on boot with question, score, correct words, misses, medal and the declined flag all carried across.

**Still dead:** `LanternCurriculumCatalog` has zero references in `app.js`. That is Step B, and it is the one that moves coverage off 0.3%.

Cache `lantern-alley-v88`, artifact 7.91 MB, 212 of 212 tests pass.

### 2026-08-26 - The three days now lead into the episode

They did not. Finishing the days - challenge, then focused review, then mastery - called `showMap()`, so the learner was returned to the alley and the episode existed with nothing leading to it except a test button. The days taught five words and then stopped; the shift they were training for was unreachable in normal play.

Mastery now starts the episode. The test control does the same when skipped past the last day, so both routes behave alike rather than the aid hiding the handover.

`startEpisodePreview` is renamed `startEpisode`. It stopped being a preview the moment the game routed players through it - the name would have been the only thing still calling it optional.

Kon connects the halves: 「三日間の練習、お疲れさまでした。今夜はお祭りの前の晩です。お客様が次々にいらっしゃいますから、いよいよ本番です。」

The shape of a location is now legible: three days of training, one hour of service, then the correction round for whatever was missed, then back to the map.

Verified in the artifact: past the last day the episode card opens on 第一話「宵の一時間」 with that line, and the map is not shown.

Cache `lantern-alley-v86`, artifact 7.90 MB, 210 of 210 tests pass.

### 2026-08-26 - Reading gets its own document panel and two minutes

Two changes for readability, both requested by the owner.

**A notice is a document, not dialogue.** It was being rendered inside Kon's speech card, which is 326px wide in the split desktop layout - 190 characters of notice in a bubble sized for one spoken line. Multi-line prompts now render as a document in the answer panel instead, at **665px**, with the heading on its own rule, one fact per line at 32px leading, the ※ conditions set apart with a hanging indent, and the question separated below. `font-variant-numeric: tabular-nums` keeps the times aligned. Kon's card now carries only 「【二階のお知らせ】を読んでください。」

This is what the earlier clarity fix could not achieve on its own: the writing was already plain, but the column was too narrow for any of it to scan.

**Two minutes to answer**, up from 40 and 35 seconds. The exam averages roughly 80 seconds per item across all of reading, and a learner meeting a notice for the first time should be reading rather than racing. The briefing states it plainly: 「読む問題は二分あります。短い返事は五秒です。」 The test floor moved from 35 to 120 seconds.

Verified in the artifact: the notice renders in a 665px panel against a 326px speech card, ten body lines, two rule lines, the question separated, and 118.8 seconds on the clock.

Cache `lantern-alley-v84`, artifact 7.81 MB, 209 of 209 tests pass.

### 2026-08-26 - The rewritten reading item was confusing, not hard

The owner, a native speaker, found the new notice confusing. That is a fault in the item, not a sign it reached N2.

Checked the official aim: N2 reading is materials **written clearly**, and 情報検索 asks whether the learner can find needed information among a lot of it. The difficulty is volume and matching stated conditions - not inference.

Mine required an inference from silence. It asked which rooms could be cleaned now while 八番 was already clean, and never stated that an already-cleaned room is excluded. A reader could reasonably argue 八番 qualifies: it is empty, so cleaning could be started there. **Two defensible answers is a broken item.** The schedule had the same fault in miniature - 「お出しするのに一時間かかります」 does not say whether that is the serving or the meal.

Rewritten so nothing turns on an unstated rule:

- The notice is now one room per line with its status, the way a real staff board reads, and both exclusions are written down: 「※お帰りになった部屋だけ、今から掃除します。」 and 「※工事中の部屋と、掃除が終わっている部屋はしません。」 Only 三番と五番 survive.
- The schedule states durations plainly and both conditions explicitly, so 六時 is the only answer that satisfies them.

The schedule lost length when the vagueness went, dropping to 115 characters. Rather than pad it, it now carries realistic detail that is irrelevant to the question - breakfast, the shop's closing time, where the fireworks are seen. Skipping past what you do not need **is** 情報検索, so the length now comes from the format rather than from filler: 165 characters.

A test asserts each reading item states at least two explicit conditions with ※, so an answer can never again depend on something the page does not say.

Final: notice 190 characters at 40 seconds, schedule 165 at 35.

Cache `lantern-alley-v83`, artifact 7.81 MB, 209 of 209 tests pass.

### 2026-08-26 - Reading items recalibrated against the real N2 exam

Looked up the official structure rather than guessing at difficulty. N2 is 105 minutes for about 78 items across Language Knowledge and Reading, plus 50 minutes of listening. Vocabulary alone is six item types and 32 items: 漢字読み 5, 表記 5, 語形成 5, 文脈規定 7, 言い換え類義 5, 用法 5. Reading runs 内容理解（短文）about 200 characters, 内容理解（中文）about 500, 情報検索 about 700, 主張理解（長文）about 900, plus 統合理解 comparing two texts.

Measured ours against that. The formats were right - the cloze items are 文脈規定, the paraphrase is 言い換え類義, the replies are 即時応答, the notice and schedule are 情報検索 in miniature. The **length** was not: our two reading items were 53 and 49 characters. One line each, so there was nothing to hold in mind and nothing to retrieve.

Rewritten:

| Item | Was | Now |
| --- | --- | --- |
| 情報検索 notice | 53 chars, 18s | **216 chars, 40s** |
| Schedule | 49 chars, 25s | **151 chars, 35s** |

The notice is now a real board: eight rooms, each in a different state - departing tomorrow, just left, staying until the day after, closed for building work, arriving this evening, already cleaned - plus two rules about which may be entered. Only two rooms satisfy everything. Each distractor is wrong for its own reason, so the item rewards reading rather than elimination.

The schedule adds a second dependent duration and an ordering constraint, so the answer has to be counted backwards from the fireworks through the bath and then the dinner.

`.jp-line` now uses `white-space: pre-line`. Without it a notice collapses into one paragraph and the retrieval becomes a wall of text.

Tests pin it: reading items must be at least 150 characters, laid out with line breaks, given at least 35 seconds, and carry four distinct distractor notes.

**Deliberately not done.** Four official item types are still missing - 表記, 語形成, 文の組み立て and 文章の文法 - and `sentence-order` sits declared in the renderer with nothing calling it. Those belong in Episode 2 rather than crammed into an episode that already tells one coherent hour. Our clock is also far tighter than the exam's roughly 80 seconds per item; that is a game device, not a calibration error.

Verified in the artifact: 216 characters over 19 rendered lines, no overflow, a 40 second budget, four choices.

Cache `lantern-alley-v82`, artifact 7.81 MB, 208 of 208 tests pass.

### 2026-08-26 - New object image wired in, cut out, and shipped

A concurrent session added a per-object photo path - `visual.assets` alongside the sprite sheet, so one object can use a dedicated image while the rest stay sprite cells - plus sprite rotation and zoom. It arrived with `assets/inn/sheet-stained-messy-v1.png` for the stained sheet, and 207 tests passing.

Two delivery problems with the file itself:

- **It was a 1.16 MB lossless PNG.** Converted to WebP like the rest of the scene art.
- **It had a black background, not transparency.** Every corner sampled `(0,0,0)` and the top edge was uniformly black, so over the tatami it would have rendered as a black rectangle - the same failure the Entrance fox poses had with their pale canvases. Keyed out on luminance with a feathered rim between 26 and 64, cropped to the subject, and saved with alpha: **1.16 MB to 23.7 KB**, 55% of the image removed as background, corner alpha 0.

**A verification note.** The dev server kept executing a stale copy of the stage file for several checks - it still had the sprite cell the source no longer defines - even after unregistering the worker, clearing caches and refetching. The built artifact has no service worker, so checking there settled it: `assets` present, sprite cell gone, image inlined. When the local page and the source disagree, trust the artifact.

Verified in the artifact: the stained sheet renders as a photo element at 512x295 with `object-fit: contain`, and no image on the page is broken.

Cache `lantern-alley-v81`, artifact 7.81 MB, 207 of 207 tests pass.

### 2026-08-26 - Larger room objects and an unmistakably used sheet

The supply objects now use larger photographic art: all ten fit in one desktop shelf row and switch to five columns by two rows on narrow screens. The four cushions use the photographic sprite sheet with independent size and direction transforms, replacing the old flat SVG silhouettes. The two mats have stronger green edging, inset borders and woven texture so their boundaries remain obvious.

The used sheet now uses the generated asset `assets/inn/sheet-stained-messy-v1.png`. It is wrinkled, stained, rotated and hanging crooked over the futon so the learner can immediately see that it needs changing. A luminance mask removes the image's dark generation background in Chromium without changing the visible sheet. The sheet asset is included in offline precaching and the standalone build.

Verified in the rebuilt artifact at 1280 by 720. All 207 tests pass, syntax checks are clean, cache is `lantern-alley-v81`, and the artifact is 9.32 MB.

### 2026-08-26 - The explanation of a wrong answer no longer disappears

Choosing wrongly showed the gloss and then wiped it, so the one thing worth reading was the thing the learner could not read.

Two causes, both leftovers from when this content allowed retries:

- A wrong answer called `setTimeout(renderPreviewQuestion, 1800)`, re-rendering the same question after 1.8 seconds and clearing the feedback with it. Retrying also makes no sense inside a timed hour - the guest has already been kept waiting - and the item is due back in the correction round regardless.
- It then armed the same auto-advance a correct answer uses, so even without the re-render it would have moved on when Kon stopped speaking.

A correct answer still advances by itself: first tap finishes Kon's line, the next moves on. **A wrong answer now waits for the learner**, with the button reading 「読みました。次へ →」 so it is clear that continuing is their call. The timeout message also says the question will return: 「時間切れです。お客様を待たせました。この問題は最後にもう一度出ます。」

Verified live: chose wrongly, tapped repeatedly, waited nine seconds past the old auto-advance window - the explanation 「「いいえ、分かりません。」 = "I don't know" - leaves the guest standing at the desk」 was still on screen and the question had not moved.

Cache `lantern-alley-v80`, artifact 7.78 MB, 206 of 206 tests pass.

### 2026-08-26 - Stale reply over a silent question, four choices, and a clock that fits the work

**A reading question displayed the previous question's answer.** The screenshot showed the schedule item while Kon's speech card still read 「座布団が同じ大きさになりました…「揃える」です。」 - the reply to the item before it.

The cause was not the text but who owned it. Spoken questions go through `speak()`, which hands the line to the dialogue controller. Silent ones wrote straight to `#jp-line`, so the controller was still revealing the previous reply and painted it back over the new prompt a frame later. Silent questions now call `dialogueFlow.start(text, false)`, so the controller owns the line either way.

**Four choices, not three.** Every episode question now has four options and four glosses. The added distractors are near misses rather than filler: 座布団が揃います。 for the intransitive pair, 引き出します。 alongside 引き受ける and 引き止める, 取り替えます。 offered for tea that only needs warming.

**The clock now fits the work.** A schedule has to be understood before it can even be attempted, so it cannot share a budget with a one-word service reply:

| Question | Was | Now |
| --- | --- | --- |
| Reading the notice | 12s | 18s |
| Reconciling the schedule | 12s | 25s |
| Final integrated reply | 8s | 12s |

The briefing states this: 「読む問題は時間が長く、短い返事は五秒です。」 A test asserts reading questions get at least 18 seconds and that nothing but a one-word service decision runs on five.

Verified live: questions 1 to 7 each show four choices, and the reading pair open with their own prompts at 17.2 and 24.2 seconds.

Cache `lantern-alley-v79`, artifact 7.78 MB, 206 of 206 tests pass.

### 2026-08-25 - Two episode questions could not be answered from what they showed

The owner spotted that question 1 asks 「二人ですが、部屋はありますか。」 while the learner has no way to know whether a room is free. The correct reply was therefore unreachable by reasoning - only by guessing, or by noticing that the other two options sound unhelpful.

Checked all ten against the same standard: can this be answered from what is on screen? Eight passed. The 断る item already did it properly by stating 「部屋は二つしか空いていません」 before asking. Two failed:

- **Question 1** now opens with 「二人部屋がひとつ空いています。」 so the state of the inn is known before the guest speaks.
- **Question 2** asked 「夕食は何がありますか。」 and expected 「ご注文をうかがいます。」, which does not answer what was asked. The guest now says 「そろそろ夕食をお願いしたいのですが。」, so taking the order is the reply that fits.

A test now asserts that any question turning on availability states what is available, and that the ordering item has the guest actually asking to order.

**Also fixed: the instruction label printed twice.** The markup carried its own `<strong>How to interact</strong>` while `.inn-stage .inn-instruction::before` prints the same words, so the panel read "How to interact How to interact Choose the reply Kon is asking for." Removed from the two panels inside `.inn-stage`; the Entrance keeps its own, since `.inn-control-help` styles the `<strong>` as its label rather than using a pseudo-element.

Cache `lantern-alley-v78`, artifact 7.77 MB, 204 of 204 tests pass.

### 2026-08-25 - Feedback stops handing over the answer; the correction round announces its clock

**A wrong answer was giving away the right one.** The Inn said "That action does not fit this situation. Compare it with 「取り替える」 and try again." - which ends the question rather than teaching it, since a wrong answer here can be retried. Feedback now names what the learner chose and what the request wants, in English, without naming the target: "You chose to hide the luggage. The request asks you to put the used item in the bin the sentence names, then fit its fresh counterpart."

The near-miss explanations were leaking the same way - 「揃う is intransitive... 揃える is transitive」 names the answer sitting in the option list. They now name only the word that was chosen: 「揃う is intransitive: it describes the cushions coming to match by themselves. Here you are the one making them match.」 A test asserts no wrong-answer feedback anywhere contains its item's target word.

Two gaps this exposed: the 引き受ける near miss had no explanation at all - there were four for five words, so choosing 引き止める on Day 2 produced empty feedback - and an empty explanation was returned verbatim rather than falling back.

**The correction round now announces itself.** A stricter clock should not appear unannounced. Kon says 「お疲れさまでした。最後に、間違えた仕事だけをもう一度確認します。今度は時間が短いので、すぐに答えてください。」 over a card stating how many items are coming back, that short items are five seconds, that a timeout is not counted as a mistake, and that clearing them all ends the round.

The countdown now reads 「のこり 4.3 秒 / 5 秒」 rather than a bare number, so the budget is visible as well as the remainder, and the bar turns red in the last two seconds.

Verified live: missed one question deliberately, reached the announced round, saw 「のこり 4.3 秒 / 5 秒」 on a five-second card and the urgent state at 0.9 seconds.

Cache `lantern-alley-v77`, artifact 7.72 MB, 202 of 202 tests pass.

### 2026-08-25 - A wrong answer now says what the wrong answer meant

Choosing wrongly showed 「もう一度考えてみましょう。」, which tells the learner nothing about the word they actually reached for. Every option now carries a gloss, shown when that option is picked: 「いいえ、分かりません。」 = "I don't know" - leaves the guest standing at the desk.

The glosses name the word rather than only judging the choice, so the near misses teach: 暖める warms a room or the air rather than a drink; 引き止める stops someone leaving; 引き返す turns back the way you came; 片づける clears the cushions away so the guest has nowhere to sit.

This is English, like the existing near-miss explanations and How to interact. It appears only after an answer, so it cannot be read instead of the Japanese.

**A bug this surfaced.** Rewriting the episode left a reference to a `challenge` variable that no longer existed. It threw inside the question render, after the scene markup was written but before the answer controls were built - so the second question showed a running clock and no way to answer. The tests did not catch it because they read source text rather than running the render; the browser console did, immediately. Removed.

Verified live: the briefing lists its four rules, question 1 shows three replies with the clock waiting on the audio, and choosing 「いいえ、分かりません。」 explains itself while Kon says 「お客様を待たせてしまいました。まず部屋へご案内します。」

Cache `lantern-alley-v76`, artifact 7.62 MB, 200 of 200 tests pass.

### 2026-08-25 - An episode is a timed service hour, not a fourth run at the days

The owner's objection was right: the episode repeated the same three situations - cushions, towel, tea - so it read as a replay rather than a new thing.

**What an episode is now.** The three days teach five words slowly, with the room in front of you and time to think. An episode is one continuous hour of service: 「宵の一時間」, the hour before the festival when guests arrive one after another. Every request is answered against a clock, and **the clock is the guest waiting** rather than a quiz gimmick. Same inn, different pressure.

Ten new situations, ten distinct targets, none reused from the days: 案内 / 注文 / 温める / 取り替える / 揃える / 掃除 / 調整 / 確認 / 引き受ける / 断る. The last is new to the game and worth having - politely refusing an impossible request is part of service, and it pairs against 引き受ける.

**The clock starts when Kon stops talking.** For spoken requests the countdown is armed through `afterSpeech`, so the learner is timed on understanding rather than on listening. Written requests start immediately. Budgets come from the question: 5 seconds for a one-word service decision, 8 for a reply, 12 for reading a notice or a schedule.

**Kon explains the rules first.** An episode runs differently from the days, so a briefing card states them in Japanese before the first guest: guests are waiting, the clock starts after the audio, the speaker button repeats a line, and mistakes come back at the end.

The contract's three days become the three parts of the evening - 宵の口, 食事どき, 仕上げ - so the 3-3-4 shape validates unchanged while reading as one shift.

A timeout now records the item as missed and moves on with 「時間切れです。お客様を待たせました。」, feeding the correction loop already built.

**Delivery: the 15 MB ceiling fired, and the fix was overdue.** Adding the episode's audio pushed the artifact to 15.05 MB and the build failed, naming its largest contributors. The real weight was never the code: `room-empty-v4.png` and `wooden-gate-v1.png` were lossless PNGs at 2.17 MB and 2.35 MB, which base64 badly. Converting the four scene images to WebP, the same treatment the fox poses had:

| Asset | Before | After |
| --- | --- | --- |
| room-empty-v4 | 2.17 MB | 0.14 MB |
| wooden-gate-v1 | 2.35 MB | 0.24 MB |
| player-actions-v1 | 0.93 MB | 0.16 MB |
| room-objects-v2 | 0.76 MB | 0.10 MB |

**Artifact 14.63 MB to 7.62 MB**, leaving over 7 MB of headroom rather than 0.4. The PNG masters stay in the repo; the sprite-gutter test still decodes the master by hand, since the WebP is generated from it.

Verified live: Entrance art, the illustrated room at 1400x933 from the WebP, ten shelf objects, nine zones, and no broken images anywhere in the flow.

Cache `lantern-alley-v74`, 199 of 199 tests pass.

### 2026-08-25 - Episode transition, and the timed correction loop finally runs

**A transition into the episode.** Clicking the preview button dropped straight into question 1: the Inn's room vanished and an unrelated question appeared. Kon now introduces the episode first, on a card showing 第一話 and 「最初のお客様」 - the story name parsed from the source note, not the internal English title - with a 始めましょう button.

Two mistakes while building it, both worth recording:

- The card faded in by toggling a class one frame after insertion. The toggle raced the render and often never applied. Replaced with a CSS animation on mount.
- That animation then left the card **invisible**: it animated `opacity` from 0, and a global `prefers-reduced-motion` rule in this stylesheet kills animations with `!important`. An element whose visibility depends on an animation therefore stays at the from-state. The card is now plainly visible and only its transform is animated. Never let a decorative animation decide whether content can be seen.

**間違い直し now exists.** The five-second correction loop has been specified since the curriculum design, and `review-engine.js` and `question-renderer.js` have had the queue and the timer built and tested for a while, but nothing ran them. The preview now ends in the loop:

- Only missed items appear.
- The clock is per question type from the question data - 5 seconds for single-word recognition, 8 by default, 12 for a full sentence - not a flat five.
- A correct answer leaves the queue; a wrong answer explains and returns the item to the back.
- **A timeout is not a misconception**: 「時間切れです。もう一度出ます。」 and the item simply comes back.
- The loop ends with 「間違えた仕事は全部できました。お疲れさまでした。」

One real bug found by playing it: a timer left over from the previous card was settling the next one, disabling its buttons and freezing its clock the instant it appeared. Each card now carries a token, and both the interval and `settleRepair` ignore anything from an older card.

Verified live: missed question 1 deliberately, answered the rest, reached 間違い直し with 1/1 and a 5-second clock, let it time out once and watched the item return, then answered at 4.3 seconds remaining and reached the cleared state.

Cache `lantern-alley-v72`, artifact 14.63 MB, 199 of 199 tests pass.

### 2026-08-25 - Tapping advances the preview after a correct answer

The main game arms advancement through `afterSpeech`, so a tap finishes Kon's line and the next tap moves on. The preview harness only wired the Next button, so a correct answer sat there until the button was clicked.

`advancePreviewLater` now arms the same continuation, guarded on the question index so a stale continuation cannot skip ahead if the learner has already moved. The button stays as the visible fallback for when the voice never reports finishing.

Verified live: answer question 1 correctly, first tap finishes the reply 「はい、「揃える」は「そろえる」と読みます。」, second tap moves to question 2 「冷めたお茶を、もう一度（　）ください。」.

Cache `lantern-alley-v70`, artifact 14.62 MB, 198 of 198 tests pass.

### 2026-08-25 - Episode 1 preview route (testing only)

Episode 1 has existed in the new contract with audio since Task 6, but nothing routed a player to it: the Inn still runs the legacy encounter flow, and `question-renderer.js` was loaded and never called. A second test control, **Preview Episode 1 (test)**, now walks the episode so the new question types can be judged before the controller is rewritten around them.

Deliberately thin. It uses the real episode data and the real renderer, but not the room interactions, so the three action questions show their prompt and a confirm with 「この問題は部屋の操作で答えます（プレビューでは省略）。」 rather than a working scene. The point is to judge the questions, not to ship a second game loop.

Walked all ten:

| | Day | Skill | Answer |
| --- | --- | --- | --- |
| 1 | 一日目 | kanji | そろえて / ととのえて / あつめて |
| 2 | 一日目 | vocabulary | 温めて / 暖めて / 冷やして |
| 3 | 一日目 | vocabulary-action | room, skipped in preview |
| 4 | 二日目 | vocabulary-action | room, skipped in preview |
| 5 | 二日目 | vocabulary | 準備 / 案内 / 確認 |
| 6 | 二日目 | reading | 13時 / 14時 / 12時 |
| 7 | 三日目 | listening-task | room, skipped in preview |
| 8 | 三日目 | listening-point | 掃除 / 案内 / 確認 |
| 9 | 三日目 | quick-response | paraphrase of 引き受ける |
| 10 | 三日目 | integrated | 部屋へ案内します。 and two others |

Day 3 stays audio-first inside the preview as well, and the run ends by returning to the map.

**Both test controls must be removed before this reaches learners.**

Cache `lantern-alley-v69`, artifact 14.62 MB, 197 of 197 tests pass.

### 2026-08-25 - Kon's name tab landed on the narration

The 「コン (Kon)」 tab is drawn as a `::before` hanging 29px above the speech card. In the Entrance that space is empty alley, but the Inn's stacked column puts the narration directly above, so the tab covered its last line. Measured: narration ended at y=241, the tab started at y=221 - a 20px overlap.

Reserving 26px was not enough, since the tab sits 29px up: measured again at -3px, still touching. At 38px the tab clears the narration by 9px and still sits above its own card. A test pins the value.

Cache `lantern-alley-v68`, artifact 14.61 MB, 196 of 196 tests pass.

### 2026-08-25 - Day 2 translation is a full sentence, and it leaves with the question

**The blank is gone from the English.** It read 「Please (    ) two cushions…」, which is awkward, and it was unnecessary: English collapses the very distinction each item tests. 揃える and 揃う both come out as "arrange", 温める and 温まる both as "warm", so naming the verb in the translation does not reveal which Japanese word fits the blank. The translations are now plain sentences.

**The translation no longer sits under Kon's reply.** Once an answer is given, the Japanese on screen is Kon's response, and leaving the question's English beneath it read as a mistranslation of what she had just said. The translation is now tied to the question: shown while the question waits, cleared when Kon answers, and restored when the question comes back after a wrong answer.

Clearing the class alone was not enough - the correct-answer branch re-adds `show` further down, which brought the English back. The helper clears the text as well.

Verified live across a full item: translation visible with the question, still present when the question returns after choosing 揃って, and empty once 揃えて is accepted and Kon replies 「はい、座布団の向きを自分の手で同じにするので「揃える」です。」.

Cache `lantern-alley-v67`, artifact 14.61 MB, 195 of 195 tests pass.

### 2026-08-25 - Day 2: English instead of romaji, four choices instead of three

Two changes requested by the owner, both scoped to Day 2.

**The question shows the English translation where the romaji was.** By the second day the learner should be reading kana and kanji rather than leaning on romaji, but still needs to know what the sentence means. The translation keeps the blank, so it describes the sentence without answering it - "Please (    ) two cushions facing the same way on each of the two mats." It is visible with the question rather than after the answer, which is the opposite of every other day, where meaning is revealed only once an answer is given so it cannot be read instead of the Japanese.

The support ladder is now:

| Day | Mode | Question shows | Answer |
| --- | --- | --- | --- |
| 一日目 | 基礎 | Japanese, romaji, English, hint | move the objects |
| 二日目 | 実践 | Japanese and English translation | four Japanese words |
| 三日目 | 挑戦 | audio only | move the objects |

**Four Japanese choices instead of three.** Practice now builds its own options rather than borrowing the three keys the acting days use, so each item has a correct answer, its near miss, and two further plausible wrong words:

- 揃えて / 揃って / 散らかして / 片付けて
- 取り替えて / 代えて / そのままにして / 洗って
- 温めて / 温まって / 冷やして / 焼いて
- 調整して / 調節して / 放置して / 中止して
- 引き受けて / 引き止めて / 引き出して / 引き返して

The last set is four 引き compounds, which is a harder discrimination than a single obviously wrong option.

One existing test asserted that undertake items never carry a near miss, which is right for the days that actually make the offer - marking a reply as a near miss would prejudge a social choice - but wrong for Day 2, where the same item is a vocabulary cloze and 引き止めて is a fair distractor. That assertion is now scoped to the offer days.

Verified live: 二日目・実践 ★★☆, the cloze question, the English translation visible, empty romaji, and four all-Japanese choices.

Cache `lantern-alley-v65`, artifact 14.61 MB, 194 of 194 tests pass.

### 2026-08-25 - Remaining graphics bugs fixed and a full playthrough verified

**The supply shelf could not show what the sentence asks about.** Each zabuton was a 26px icon inside a 60px button, so colour, size and direction were indistinguishable - and those are exactly the three attributes the request names. The shelf art is now 48px. Measured afterwards, all three attributes are distinct: red rgb(194,84,58) against blue rgb(63,110,168); scale 1 against 0.62; and 21x39 portrait against 39x21 landscape for 縦向き versus 横向き. The tray does not overflow.

**The unexplained drop shadow is resolved.** After the wood tokens were applied at the right specificity, both the room objects and the Day 2 buttons compute `rgba(55, 30, 18, 0.76)` with border `rgb(140, 86, 45)` at a 12px radius - the Entrance's values. The earlier rule enumeration that reported "no matching rule" was an unreliable probe rather than evidence; the computed style is the ground truth and it now matches.

**Full playthrough from a cleared save:** Entrance tutorial with the bow card, 「路地を見る」 appearing and leading to the map, six destinations, the Inn entered in one click, the festival invitation with 「はい、喜んで手伝います。」, and Day 1 opening at 一日目・基礎 ★☆☆ with 1/5 and ten objects on the shelf.

Encounter 1 solved by grouping on the named attribute: 正解 stamp, contextual reply, then a clean advance to 2/5 「At the washstand」. Encounter 2 solved as an ordered action: after the first step 「古い物を外しました。次に新しい物を選んでください。」, then 正解 and 「ありがとうございます。新しいタオルになりました。」 - so the 取り替える rewrite works end to end.

Cache `lantern-alley-v64`, artifact 14.61 MB, 193 of 193 tests pass.

No known visual or logic bugs remain open in the Inn.

### 2026-08-25 - Full stage pass: three more bugs, and the room art is visible again

Walked all fifteen items as data and then rendered each day.

**Day 3 was still typing out its own request.** The previous fix routed both render paths through `getWrittenPrompt`, and it still showed the sentence, because `speak()` drives the clip *and* the on-screen reveal from the same string - so the reveal retyped the request a few milliseconds after `getWrittenPrompt` had correctly written 「音声を聞いてください。」. `speak()` now takes a separate `displayText`, so the audio and the written line can differ. Verified: during the reveal the line reads 「音」, and after it completes it still reads 「音声を聞いてください。」. A test fails if any request is spoken without a display override.

**A clarifying question was wired to the refusal branch.** Encounter 5 has two option keys but carried three Japanese labels, so the `decline` key rendered as 「何時からですか。」 - asking when it starts ended the stage. Two labels for two keys now.

**The illustrated room was hidden behind its own drop zones.** They were solid cream cards over the artwork. They keep the wood frame and drop shadow but now let the room show through, and each label sits on its own dark chip so it stays legible over the art. The two "overlapping" zone pairs found by the audit were 1px edge contacts, not real overlaps.

Verified per day:

| | Badge | Prompt | Answer surface | Room |
| --- | --- | --- | --- | --- |
| Day 1 | 一日目・基礎 ★☆☆ | full request, no overflow | 10 objects, 9 zones | art loaded |
| Day 2 | 二日目・実践 ★★☆ | cloze | 揃えて / 揃って / 散らかして | none, by design |
| Day 3 | 三日目・挑戦 ★★★ | 音声を聞いてください。 | 10 objects, 9 zones | art loaded |

No English reaches any answer surface, and the shoji is gone from every scene.

Cache `lantern-alley-v63`, artifact 14.61 MB, 191 of 191 tests pass.

Still not addressed: the supply-shelf cushions render as small coloured bars that do not read as zabuton at that size.

### 2026-08-25 - Day 2 dialogue item answered the wrong question; Day 3 revealed its request

**The cloze had yes/no answers.** Day 2's dialogue item showed 「明日の朝食の配膳を（　　）くれませんか。」 above the replies 「はい、引き受けます。」 and 「すみません、引き受けられません。」. The question and the answers were about different things: `isWordChoiceDay` excluded the `undertake` mechanic while the prompt had already been swapped for its cloze. Every Day 2 item is now a cloze, including that one, so it offers 引き受けて / 引き止めて. The decline branch still lives on Day 1, where the offer is actually made. A test asserts no Day 2 option is a sentence reply.

**Day 3 printed the request it is supposed to speak.** Two paths set the prompt: advancing an encounter goes through `getWrittenPrompt`, but entering a stage printed `prompt.jp` directly, so arriving at Challenge showed the sentence in writing instead of 「音声を聞いてください。」. A test now fails if any render path prints the request directly.

**A regression I introduced last round.** I had added `word-break:keep-all` to the request line. Japanese has no spaces, so that stopped the line breaking at all and pushed it past the card edge - which is the clipped text in the screenshot. Reverted to wrapping anywhere, which is normal for Japanese.

**And the stacking fix from last round was not working.** `#dialogue-shell` computes as **grid**, not flex, so `flex-direction:column` did nothing and the fox kept its own column. Collapsing the shell to `display:block` gives the sentence the full card: 275px of a 325px card, about 12 characters per line, no overflow.

Cache `lantern-alley-v61`, artifact 14.61 MB, 190 of 190 tests pass.

### 2026-08-25 - Day 1 request was wrapping to four characters per line

Measured at 1152x927, the width the owner reported from: `#jp-line` was **86px** inside a 200px speech card, about **four characters per line** for a normal N2 request. The sentence is the one thing the learner must read, and it was the least readable element on screen.

Cause: the Inn's dialogue is a flex row of the fox and the speech card, sitting in the split desktop layout's narrow context column. The fox took roughly 38% of a 325px column and left the speech 200px.

A first attempt scoped the fix to `.dialogue:not(.entrance-dialogue)` and did nothing, because **Kon-led stages deliberately share `.entrance-dialogue` for the transparent fox** - `shouldUseTransparentFox("home-inn", true)` is true by design. Excluding that class excluded exactly the case that needed fixing. Scoping by `#screen-game:not(.entrance-stage)` targets the Inn while leaving the Entrance's own dock layout alone.

Below 1400px the Inn now stacks the fox above the speech, so the sentence gets the full column: **432px, about 20 characters per line, two lines** instead of a stub. A test pins both rules.

**Kon greeted three times in a row.** The day announcement, the welcome-back line and the situation were concatenated: 「一日目です…」「お帰りなさい…」「もうすぐ最初のお客様が…」. The day announcement already places the learner, so it now replaces the resume greeting rather than stacking with it. Resolving the greeting twice also consumed the one-shot resume flag on the first call and returned a different line on the second, so it is now resolved once.

**The skip-day control** was present but at 75% opacity in a crowded header. It is now full opacity and will not wrap.

Cache `lantern-alley-v59`, artifact 14.61 MB, 188 of 188 tests pass.

Still open from this pass: the illustrated room draws placed objects as large pale cards over the artwork, and the supply shelf renders cushions as small coloured bars that do not read as zabuton at that size. Both are visual rather than functional, and neither has been changed yet.

### 2026-08-25 - Day 2 questions rewritten for multiple choice

The owner pointed out that Day 2's question and answer did not fit together, and they were right in the worst way: **the question contained its own answer.** Day 2 kept the Day 1 request 「二つのマットに、同じ向きの座布団を二枚ずつ揃えてください。」 - an imperative to perform an action - and then asked the learner to pick 揃える from a list. The verb was already printed in the prompt, so the item tested reading, not comprehension.

Day 2 now has its own sentences, written as cloze with the verb removed and options in the form the blank requires:

| Situation | Question | Choices |
| --- | --- | --- |
| cushions | 二つのマットに、同じ向きの座布団を二枚ずつ（　　）ください。 | 揃えて / 揃って / 散らかして |
| linen | 汚れたシーツを洗濯かごに入れて、新しいシーツに（　　）ください。 | 取り替えて / 代えて / そのままにして |
| rice | 冷めたごはんを、電子レンジで（　　）ください。 | 温めて / 温まって / 冷やして |
| arrivals | 二つのグループの到着時間を（　　）ください。 | 調整して / 調節して / 放置して |
| breakfast | 明日の朝食の配膳を（　　）くれませんか。 | 引き受けて / 引き止めて |

A test now asserts every Day 2 prompt is a cloze and never contains the stem of its own answer, so this specific failure cannot return.

**Two mistakes of mine were caught by existing tests, which is what they are for.** The first draft set the rice situation as 「冷めたスープを、コンロで」 while the underlying Day 2 interaction is rice in the microwave - the appliance test failed with "requires the microwave but never names it". The second draft replaced Kon's replies with generic word explanations, and the contextual-response test failed because a reply must still confirm what happened in the story, not just name the word. Both are fixed.

Five tests encoded the old design - practice repeating the Day 1 request verbatim, and near misses always appearing in dictionary form. They now accept the te-form a blank requires, so 揃う on Day 3 and 揃って on Day 2 are both recognised as the same near miss.

The audio-coverage test was rewritten to check prompts the player can actually reach, via `getPhaseItems`, rather than every `jp:` literal in the source. The old Day 2 request strings remain in the file as unused data, and requiring clips for them would render audio nobody hears.

Ten clips regenerated, ten pruned. Cache `lantern-alley-v57`, artifact 14.61 MB, 187 of 187 tests pass.

### 2026-08-25 - Click the map to enter, plus a testing skip-day control

**Entering a stage now takes one click on the place itself.** Selecting a destination and then finding a separate action button made the map behave like a list with a picture behind it. Clicking a place runs its action directly. Places with no action - the 準備中 ones - still only select, so their story shows and nothing dead is offered. The detail button remains for keyboard users and as the visible label of what will happen.

**Skip to next day (test).** A dashed, clearly labelled control in the day badge row that jumps to the next day without answering the current one, so a day can be reached without playing the previous one. It appears only inside a stage that has days, and the label and dashed border keep it from reading as part of the lesson. It has no effect on the last day beyond returning to the map.

Rendered check: one click on 月見宿 entered the stage, and the control stepped 一日目・基礎 ★☆☆ to 二日目・実践 ★★☆ to 三日目・挑戦 ★★★.

This control is a testing aid. It should be removed, or hidden behind a flag, before the game is shared with learners.

Cache `lantern-alley-v56`, artifact 14.65 MB, 186 of 186 tests pass.

### 2026-08-25 - Inn framing brought into line with the Entrance

The owner reported that some scenes do not match the Entrance. Comparing computed styles rather than impressions:

| Surface | Entrance | Inn, before |
| --- | --- | --- |
| Panel border | 2px #8c562d | 2px #9d7d50 |
| Corner radius | 12px | 14px |
| Instruction band | 2px, 12px radius | 1px rgba(203,145,85,.78), 9px radius |
| Drop shadow | rgba(55,30,18,.76) | #80643f |

Same game, two different woods. Shared tokens now live in `:root` - `--wood-edge`, `--wood-shadow`, `--wood-radius`, `--paper` - and the Inn adopts the Entrance's values rather than the reverse, because the Entrance is the approved illustrated look. The question renderer's controls use the same tokens, so anything built on the new contract inherits the look instead of drifting again.

One override needed the selector `.inn-stage .inn-instruction` to match the existing specificity; a plain class selector lost to it silently, which is the usual way a "fix" appears to do nothing.

Verified live: the Inn reply buttons and instruction band now compute to 2px #8c562d at a 12px radius with the Entrance's paper gradient.

**Open cosmetic item.** The reply buttons still compute the old drop shadow #80643f rather than the token. Enumerating the matched rules at runtime found no stylesheet rule setting `box-shadow` on that element, which contradicts the computed value, so the cause is not yet identified. Border, radius and background all match, so the visible difference is small, but it is unexplained rather than accepted.

Cache `lantern-alley-v55`, artifact 14.65 MB, 186 of 186 tests pass.

### 2026-08-25 - Day 2 is a different exercise, and the day badge was never updating on resume

**The shoji is gone entirely.** Suppressing it only for the schedule was not enough - the same absolutely positioned decoration then covered the reply buttons on the dialogue scene. It was backdrop for scenes with no illustrated room, but those scenes put their controls exactly where it sat. A backdrop that covers the answer is worse than no backdrop.

**The real reason Day 2 looked like Day 1.** `renderStagePrompt` sets the day badge and the encounter counter, and it runs only when advancing an encounter or starting a phase - never when resuming into a stage from the map. A returning learner therefore saw the markup defaults: the badge read "Learn" and the counter read 1 of 5 regardless of the actual day. The content was different; the labelling said otherwise. Resume now sets both from the live phase.

**Day 2 now asks the words a different way.** Repeating Day 1's drag with one attribute changed tested the same skill twice, and the owner asked for a different kind of question rather than the same exercise. Practice drops the room and asks the learner to name the action in Japanese, choosing between the verb, its intransitive partner and a plausible wrong action - 揃える / 揃う / 散らかす. With no objects to move there is no answering by trial and error, and the intransitive partner is a real N2 trap rather than an obviously silly option.

The three days now differ in kind, not only in support:

| Day | Question type | Support |
| --- | --- | --- |
| 一日目 基礎 | move the objects in the room | romaji, English meaning, hint |
| 二日目 実践 | choose the Japanese word | romaji only |
| 三日目 挑戦 | move the objects, prompt spoken only | none |

Rendered check at day 2: badge 「二日目・実践 ★★☆」, choices 揃える / 揃う / 散らかす, zero draggable objects, no shoji, romaji visible, English meaning empty.

The dialogue encounter keeps its own replies, and Challenge keeps the physical action so the audio-only day still tests comprehension through doing.

Three tests added: the word-choice day exists and its options are Japanese, the shoji is gone from every scene, and resume sets the badge and counter from the live phase.

Cache `lantern-alley-v54`, artifact 14.65 MB, 186 of 186 tests pass.

### 2026-08-25 - A correct answer could strand the player; retry hardened

Investigating a report that a mistake left no way to try again turned up a worse bug on the **correct** path.

`scheduleCorrectAdvance` hides the Continue button and hands advancement to `afterSpeech`. But `afterSpeech` only called `dialogueFlow.setContinuation(next)` and **ignored the fallback delay it was passed**. Advancement therefore depended entirely on the voice reporting that it had finished. If a clip 404s, autoplay is blocked before the first gesture, the tab is muted, or synthesis has no Japanese voice, `voiceFinished()` never fires - and the player is left on a correct answer with the Continue button hidden and nothing to click.

Two safety nets, because either alone still leaves a gap:

- `afterSpeech` now arms a fallback that fires the continuation at `fallbackDelay + 6000`, guarded so it can only run once.
- `scheduleCorrectAdvance` restores the Continue button at `delay + 2500` if the advance has not happened, so there is always a visible way forward.

A test pins both. It previously asserted only that advancement waits for speech, which is exactly the behaviour that caused the stranding.

**Retry after a mistake.** Learn and Practice already rebuilt the scene through the engine's wrong-answer path, and a rendered check confirms it: grouping the cushions by colour when the sentence asks for 向き shows Kon's correction and resets the tray to 10 objects with the scene answerable again. Two paths did *not* rebuild - a near-miss option chosen outside Challenge, and any wrong answer reaching `answerStage` outside Challenge - so both now call a shared `offerRetry`, which re-renders after 900ms and prints 「もう一度どうぞ。」.

Challenge remains one attempt by design; a missed word returns in focused review.

**Also fixed:** feedback read as a bare "Correct! " in Practice and Challenge. The English meaning was removed from those days by the difficulty ladder, and the string concatenated it unconditionally. It now falls back to 「正解です。」.

Cache `lantern-alley-v52`, artifact 14.64 MB, 183 of 183 tests pass.

### 2026-08-25 - Schedule scene render fix and a real difficulty ladder

Two problems reported from a screenshot of the 調整 encounter.

**A decorative shoji was painted over the arrivals board.** Measured at 1280x720: the `.shoji` element sat at 1051,245 (84 x 92) and overlapped the timeline, the arrival controls and the second time card. It is the backdrop for scenes that have no illustrated room, which is right for the dialogue scene but wrong here - the schedule board *is* the content, so furniture drawn over it hides the thing being answered. The shoji is now suppressed for the `coordinate` mechanic. Re-measured after the fix: no overlap, all seven hour labels from 9:00 to 15:00 visible, confirm button present.

**Verification note worth remembering.** This fix appeared not to work through four rounds of checking. The cause was layered caching: the service worker is cache-first, so `fetch(..., {cache:"reload"})` was served from its cache, and when the worker was bumped it re-cached a stale `app.js` straight out of the browser's HTTP cache. The order that actually works is unregister the worker, delete the caches, refetch each shell file from the network while nothing is intercepting, and only then reload so the new worker caches fresh files.

**The three days did not differ in difficulty.** Day 1 and Day 2 showed the same romaji, the same English meaning and the same hint; only the situation changed. Day 3 hid romaji and hints but still showed the English meaning, which contradicts the design rule that Challenge is audio-first.

Support is now withdrawn one layer per day:

| Day | Mode | Shown |
| --- | --- | --- |
| 一日目 | 基礎 | Japanese, romaji, English meaning, hint |
| 二日目 | 実践 | Japanese and romaji only |
| 三日目 | 挑戦 | audio only; the written prompt is 「音声を聞いてください。」 |

A test pins all three rows plus the audio-first Challenge prompt, so the ladder cannot quietly flatten again.

Cache `lantern-alley-v50`, artifact 14.64 MB, 183 of 183 tests pass.

### 2026-08-25 - Object swaps now teach 取り替える; 代える kept for its real sense

Checked the game's Japanese against JMdict through jisho.org, since the local OpenJLPT files carry no usage notes.

Confirmed correct: 温める / あたためる is genuinely **N2**, so the local file's omission is a real gap rather than a level judgement; 引き受ける / ひきうける is **N2**; 取り替える / とりかえる is **N4**, matching the local label; and the readings claimed for 揃える, 調整 and the rest match.

**Found a real error.** JMdict gives explicit usage notes for かえる: 替える is "replace", 換える is "exchange", and 代える is "to substitute (person, staff member, player)". The Inn asked the learner to 「新しいタオルに代えてください」 and the same for 電球 and シーツ - swapping one object for another of the same kind, which is not what 代える means. This is the same class of mistake as 暖める versus 温める, which this project already corrected once.

The owner's reasoning settled the fix: because the task is not inferable from the scene, the sentence has to be unambiguous. 取り替える means exactly one thing - swap this object for that one - while 代える forces the learner to pick a sense before they can act, and the sense the kanji carries is the wrong one.

Changes: the towel, bulb and sheet requests now use 取り替える, with romaji updated. The near miss for that item is no longer the transitivity partner 代わる but 代える itself, explained as substituting a person or role, 「コンに代えて私が案内します」. That converts the bug into the contrast an N2 learner actually needs. Episode 1 in the new contract moved to the `v-torikaeru` target with a matching repair form.

Three tests pinned the old wording and were updated, including the verified near-miss list. Three clips regenerated, three pruned.

**A correction to an earlier entry.** This document previously recorded that the catalog alias `引受る` was non-standard okurigana and had been corrected to `引受ける`. JMdict lists 引き受ける, 引受ける, 引きうける and **引受る** as written forms, so the original alias was valid. The claim was tagged unverified at the time and was wrong.

**Also withdrawn:** an earlier suggestion that 配膳, 帳場 and 回収箱 read as dated or specialised. They were chosen for the setting, and the owner is right that they fit it - 帳場 is the traditional term for an inn's front desk, 配膳 is standard inn vocabulary, and 回収箱 suits back-of-house better than a katakana alternative. That flag was judging register out of context.

Verified: 182 of 182 tests pass, cache `lantern-alley-v49`, artifact 14.64 MB, 87 spoken lines with clips.

### 2026-08-25 - Task 6 Episode 1 authored, and Task 6A caught the wall it was built for

**Episode 1 in the new contract.** `n2-inn-episodes.js` expresses "First guests" as 3 Learn, 3 Practice and 4 Challenge questions, validated by `learning-content.js`. Nine tests cover it. Targets: 揃える, 温める, 代える, 準備, 調整, 掃除, 引き受ける and 案内, all resolving in the catalog.

Two authoring mistakes were caught by the validator written in Task 2, which is the return on having written it first:

- Question 1 listed its own primary target as slot credit. The contract forbids that outright, because a slot must never be the thing correctness is judged on.
- An early draft offered 「すみません、引き受けられません。」 as a gradeable wrong option, quietly reintroducing the decline bug. Episode 1 now teaches 引き受ける by paraphrase instead, and a test asserts no refusal is ever offered as a gradeable option.

The 温める item deliberately keeps 暖める as its near miss rather than omitting it. The distinction between the two is the lesson, and the catalog source ships only 暖める.

**The delivery gate fired.** Adding one episode of content took the artifact from 14.25 MB to **15.54 MB**, past the 15 MB ceiling, with 27 new clips. One episode of twenty. Had this been discovered at Task 12 as originally planned, it would have arrived after roughly 200 authored questions instead of ten.

`build-artifact.mjs` now does two things it did not before:

- **Ships a demo catalog.** The artifact is the Entrance plus Inn Episode 1, so it inlines only the Inn's partition plus whatever Episode 1 teaches: 723 items instead of 3,579. Verified that all eight taught words survive the subset.
- **Fails loudly above 15 MB**, naming the largest inlined contributors, rather than emitting a file that cannot be published.

Artifact is now **14.63 MB**, cache `lantern-alley-v48`, 87 spoken lines with clips at 3,810 KB.

Verified: 182 of 182 tests pass across eleven suites.

**Still to do before the Inn is playable in the new format:** the controller swap deferred from Task 4. `app.js` still runs the legacy encounter flow from `n2-home-inn-stage.js`, and the renderer is loaded but not yet called. Episode 1 exists, validates and has audio; nothing routes a player through it yet.

### 2026-08-25 - Inn invitation made open-ended, resolving the story conflict

The Inn promised exactly 「三日間」 while the approved design gives each episode its own three-day arc. Four episodes make twelve days, so from Episode 2 onward Kon's opening promise would have been false - the kind of contradiction a learner notices before a developer does.

Fixed by making the invitation open-ended and tying it to the Lantern Festival, which is already the frame connecting all five locations:

- 「月見宿へようこそ。お祭りの間はお客様が続けて来るので、私一人では仕事が間に合いません。」
- 「日本語の練習をしながら、お祭りの間、宿の仕事を手伝ってくれませんか？」
- 「はい、喜んで手伝います。」

Episode 1 still covers the first three days, so 一日目, 二日目 and 三日目 remain true inside an episode. A test now asserts the invitation never promises a fixed number of days, so the contradiction cannot return by editing one line.

Three clips regenerated and three pruned. Cache `lantern-alley-v47`, artifact 14.25 MB, 173 of 173 tests pass.

The spec's open decision list is down to three: no named native reviewer, no approved grammar or kanji source, and whether the artifact demo is worth maintaining.

### 2026-08-25 - Task 5 complete: adaptive question renderer

Split into a pure description and a thin DOM adapter. `describe()` decides what a question is as data - which controls exist, which one is primary, what Challenge hides - so the accessibility and language-leak rules are tested in Node rather than eyeballed. `renderInto()` is the only part that touches the DOM and takes the document, so it can be pointed at any container.

Ten tests, written first. Rules pinned: every answer type produces controls; exactly one control is the primary action; every control has an accessible name and is keyboard reachable; choices stay visible rather than hidden in a select; no English reaches answer content while How to interact stays English; Challenge hides romaji, meaning and hints; and no timer exists outside correction.

**A real bug surfaced while writing the timer tests.** `tickTimer` recomputed the remaining time from `startedAt` while also overwriting `remaining`, so every tick re-subtracted time already deducted. A five-second repair would have expired in roughly two. The anchor now advances with the clock. Pausing while the document is hidden and a timeout firing exactly once are both pinned by tests.

Browser verification at 360x640, with a probe rendered by the real module rather than a mock:

- Pointer and keyboard reach the same callback through the same path, and both answers arrived in order.
- Every control is focusable and carries its Japanese label as its accessible name.
- Exactly one primary control.

The first rendered check found a genuine gap: with no styles, controls used fixed-pixel browser defaults and did not grow at 200% text zoom, which is how labels get clipped. Controls are now sized in em. Re-measured: button height grows from 49px to 138px at 200%, no label is clipped, there is no horizontal overflow, and on a phone each choice takes its own row rather than two long Japanese replies wrapping into unreadable columns.

Registered in `index.html`, `sw.js` and `build-artifact.mjs`. Cache `lantern-alley-v46`. Artifact 14.25 MB.

Verified: 173 of 173 tests pass across ten suites.

**Not yet wired into the game.** The renderer is loaded but nothing calls it, because the Inn content is still in the old encounter format. Wiring happens in Task 6 along with the controller swap deferred from Task 4.

### 2026-08-25 - Task 4 (partial): version 3 progress model and migration

`learning-progress.js` defines what a progress record contains and how an older one becomes a newer one. Pure and immutable; `app.js` still owns storage and rendering. Nine tests, written first, all passing.

Version 2 stored one hard-coded Inn record under a camelCase `homeInn` key and a phase name. Version 3 is generic across stages, keyed by the same stage keys the map uses, and stores a story day rather than a phase. Focused review maps to day 3, not a fourth day.

Migration decisions:

- **Never invent a medal.** An absent medal migrates to `none` rather than being guessed from how far the learner happened to reach.
- **The declined flag survives.** Losing it would drop the welcome-back reply and greet a returning learner as though nothing had happened.
- **A version 3 record passes through unchanged**, so migrating twice is safe.
- **One mistake record per question, not per attempt**, so missing the same item three times shows it once in review.

**Deliberately not done yet:** the plan's Task 4 also calls for replacing the Inn-specific progression branches in `app.js` with stage-contract calls. That is held until Task 6, when the Inn content actually moves to the new episode format. Rewriting the controller now would mean maintaining two shapes at once against content that has not changed yet, with a second session editing the same file. The module and its migration are complete and tested; only the controller swap is deferred.

Registered in `index.html`, `sw.js` and `build-artifact.mjs`. Cache `lantern-alley-v45`. Artifact unchanged at 14.24 MB.

Verified: 163 of 163 tests pass across nine suites.

### 2026-08-25 - Task 3 complete: correction queue and delayed review

`review-engine.js` is pure and immutable, with no DOM, no timers and no `Date.now()`. Every function takes `now` explicitly, so the fourteen-day schedule is tested with fixed timestamps rather than by waiting. Nine tests, written first, all passing.

Two mechanisms live here and are deliberately not merged:

- **The repair queue** clears today's mistakes before the learner leaves. Correct answers leave immediately; wrong answers and timeouts go to the back.
- **Delayed review** brings correct material back at about 1, 3, 7 and 14 days. Only this can produce mastery.

Decisions worth recording:

- **A timeout is not a misconception.** It returns the item to the queue with `unresolvedFluency` set and no error tag, so being slow is never recorded as misunderstanding a word.
- **Only the head of the queue can be answered.** A stale click from a re-render is ignored rather than silently reordering the queue.
- **Same-day repetition does not count.** Answering an item correctly minutes after the first success is recognition, not retrieval, so it neither advances the schedule nor counts toward mastery. A test pins this, because it is the difference between real spacing and a progress bar that can be farmed in one sitting.
- **A wrong answer resets to the first interval** and records its error tag.
- **Mastery requires two delayed successes with at least seven days between the first success and the last**, so it cannot be reached in a single session by design.
- **Due items are returned oldest first**, so a learner returning after a long gap meets what they have held longest.

Registered in `index.html`, `sw.js` and `build-artifact.mjs`. Cache `lantern-alley-v44`. Artifact unchanged at 14.24 MB, since the engine is a few kilobytes.

Verified: 154 of 154 tests pass across eight suites.

### 2026-08-25 - Task 2 complete: shared episode and question contract

`learning-content.js` is now the single decider of whether stage content is valid. Content bugs are cheap to introduce and expensive to notice by playing, so they are caught here rather than in a browser.

Written test-first: 11 contract tests failed against a missing module, then passed. Rules enforced: four episodes per stage; 3, 3, 4 questions per episode; exactly one primary target that must exist in the catalog; exactly one correct answer; at most three slot credits, and a primary target may never also be slot credit; no English in answer content; no prompt reused across phases; and repair timers restricted to the 5, 8 or 12 second budget.

`free-text` is deliberately absent from the answer types, so no answer can require a Japanese IME. That is a mechanical obstacle rather than a comprehension one.

One finding from writing the tests: the first fixture reused a single prompt for all forty questions, and the validator rejected it. The rule was right and the fixture was wrong, which is the outcome worth having from a test-first pass.

Both new scripts are registered in `index.html`, `sw.js` and `build-artifact.mjs`, loaded before the stage files. Cache moved to `lantern-alley-v43`.

Verified: 145 of 145 tests pass across seven suites.

**Delivery headroom is now thin.** The artifact grew from 13.10 MB to 14.24 MB when the 1.13 MB catalog was inlined. That leaves 0.76 MB before the 15 MB build ceiling this project set itself and 1.76 MB before the hard 16 MB limit. The artifact is meant to be an Entrance plus Inn Episode 1 demo, so it does not need all 3,579 catalog items; shipping only the Inn partition would return roughly 0.9 MB. This is the decision Task 6A exists to force, and it has arrived earlier than expected.

### 2026-08-25 - Task 1 complete: curated curriculum catalog

Built the reviewed catalog and its coverage audit. Written test-first: eight contract tests failed against a missing module, then passed against the generated one.

Result: **3,579 items** from OpenJLPT n2 plus n3 plus the project supplement, with exactly **one exclusion** - the malformed `あげる (=やる)`, whose headword carries an annotation. 589 verbs. 3,307 items carry an example sentence, so cloze cards are available for 92% of the catalog. The generated file is 1.13 MB, a shell cost rather than a per-stage one.

Files: `research/build-n2-catalog.mjs` (generator), `research/catalog-api.js` (the API embedded into the output), `research/n2-supplement.json` (project-authored words), `curriculum-catalog.js` (generated, do not hand-edit) and `curriculum-catalog.test.mjs`.

Decisions worth recording:

- **A build step, not runtime JSON.** The game must work from `file://`, where fetching a sibling JSON is blocked. The output assigns to `self`, matching `audio-index.js`.
- **Kana headwords keep their own reading.** 294 of n2's 295 blank `reading` fields are kana words. Excluding them for a blank field would have dropped a sixth of the vocabulary; a test now pins this.
- **The supplement is marked `source: "project"`** so authored words can never be mistaken for sourced data. It holds `引き受ける` (absent from every local file), `温める` (the source has only `暖める`, for air and rooms, which would reintroduce a fixed error) and `取り替える` (present only as N4).
- **Nothing claims reviewed status.** No native reviewer is named, so every item is `reviewed: false` and `validateCatalog` returns a warning rather than an error, which reports the gap honestly without blocking the build.
- **Ids are stable ASCII** minted from a kana-to-romaji table and a sorted item order, so regenerating does not churn ids.
- **Partitions are round-robin**, giving 716/716/716/716/715 across the five locations. Thematic partitioning is better for the story and can replace this without changing the interface; alphabetical grouping would have handed one location every word starting with the same kana.

Verified: 134 of 134 tests pass across six suites. `curriculum-catalog.js` is not yet loaded by `index.html`, the worker or the artifact; registration is Task 2.

### 2026-08-25 - Declining Kon's request is a branch again, not a wrong answer

The Inn had been changed to score 「すみません、引き受けられません。」 as an incorrect answer, with a retry reply asking again. That contradicted the owner's instruction and the design rule in section 7 of the spec: declining a genuine social offer is not linguistically wrong. It also taught the opposite of the lesson, because a learner who understood 引き受ける perfectly and chose to refuse was told they had made a comprehension error.

Restored behaviour: declining plays Kon's disappointed reply, 「そうですか……。残念ですが、仕方がありません。気が変わったら、いつでも戻ってきてください。」, costs no heart, and returns the learner to the map. The refusal is saved, so coming back leads with 「コン：「戻ってきてくれたんですね！とても嬉しいです。」」 before the request is made again. Accepting is unchanged.

Implementation: `declineStageWork` in `app.js`, `state.stageDeclined` and `state.resumedAfterDecline`, `declined` persisted in stage progress, and `getStorySetup(item, resumed, afterDecline)` in the stage file. The decline reply is now collected by `collect-spoken-lines.js` and has its own clip; the return greeting is displayed rather than spoken, so it needs none.

The test `declining a daily duty asks again instead of ending the three-day story` asserted the removed behaviour directly, including `assert.doesNotMatch(html, /function declineStageWork/)`. It was replaced with one asserting the branch exists, that returning leads with the welcome, and that an ordinary entry does not.

Verified: 126 of 126 tests pass, 60 spoken lines with 60 clips at 2,832 KB, cache `lantern-alley-v42`, artifact 13.10 MB. Nothing committed or published.

### 2026-08-25 - Inn delivery completed after the chronology fixes

Generated the ten missing clips with `ja-JP-NanamiNeural`, the same voice as the Entrance, so no line falls back to a device voice. Ten stale clips from replaced dialogue were pruned in the same run. `audio-index.js` was regenerated, so the page and the worker share one clip list.

Cache moved from `lantern-alley-v40` to `lantern-alley-v41`. Version 40 was set before the audio and stage edits landed, so returning installed players would have kept the old shell and the old dialogue.

Verified: 126 of 126 tests pass across the five suites, `node --check` passes on `app.js` and `sw.js`, `git diff --check` reports only the repository's existing LF-to-CRLF notices, and the rebuilt standalone artifact is 13.02 MB, below the 16 MB limit.

Nothing has been committed or published.

### 2026-08-25 - Fixed two story-chronology breaks in the Inn

Checked the Inn's game logic and story coherence against the new three-day frame. The mechanics are sound - one shared room, the verb selects the action, the 調整 time puzzle is internally consistent at 14:00 train, 1 hour travel, 2 hours cleaning, next guest 15:00, answer 13:00. Two chronology breaks were found and fixed.

**Day 1 ran backwards.** Encounter 4 opened with 「朝になりました」 and set a checkout time, then encounter 5 returned to 「一日目の最後に」 and the evening meal. The narration is now day-1 planning - the guests are resting and Kon settles tomorrow's schedule in advance - so the same puzzle, the same Japanese request and the existing test expectations for 14時, 2時間 and target 13 all still hold.

**Day 3 jumped around in time.** Challenge ran its questions in the order 2, 0, 4, 1, 3, so the day went from after dark, to the next morning, to the last guests, to a corridor at dusk, to before closing the front desk. Each narration is tied to its own task, so the order cannot be shuffled independently of the story. Challenge now runs in story order and stays harder by hiding romaji and hints and by using the variant-B situations, which is where its difficulty actually came from.

The existing test `the story runs in order across the learn phase` had encoded the day-1 bug as correct; its own comment read "arrival -> next morning -> dinner service". It has been corrected, and two regression tests added: no learn beat may announce a new morning, and the challenge day must run in story order.

Targeted suites: 65 of 65 pass. Full five-suite run: 124 of 126, with the only failures being missing audio.

**Correction to the previous entry: 10 spoken lines lacked clips, not 2.** Nine were already missing from the three-day dialogue edits, and this change added one more, the rewritten day-1 planning narration. All ten have since been rendered with the same Nanami neural voice, and ten stale clips from replaced dialogue were pruned. `assets/audio` now holds 59 clips at 2,774 KB.

Still open: declining a requested duty is currently scored as an incorrect answer, which contradicts the owner's earlier instruction that refusing should be a real branch, and the design rule at section 7 of the spec that declining a genuine social offer is not linguistically wrong.

### 2026-08-25 - Handoff synchronized with the current build and course plan

Replaced the stale 500-question, ten-episode summary with the approved two-tier plan: 20 story episodes and 200 Tier 1 questions plus generated Tier 2 catalog practice. Recorded the current three-day Inn edits, two missing audio clips, targeted 76/78 test result, unreconstructed artifact, source provenance, untracked planning documents and the remaining curriculum decisions. No game code, audio, artifact, commit or publication was changed as part of this documentation update.

### 2026-08-25 - Curated the local OpenJLPT N2 list and measured it

Ran a curation pass over `research/openjlpt/*.json` rather than continuing to plan against assumptions. Two results, in opposite directions.

**The data is cleaner than the spec claimed.** Curating `n2.json` yields 1,792 testable items from 1,793; the sole failure is the malformed `あげる (=やる)`. There are 0 duplicate words, 0 headwords with annotation or whitespace noise, and 0 kanji inside a reading field. The earlier claim that 295 records lack a reading was misleading and has been corrected: 294 of those are kana-only headwords that are their own reading. All 1,537 example sentences contain their headword exactly, with no conjugated-stem mismatches, so Tier 2 cloze generation needs no fuzzy matching. Curation is not the bottleneck.

**The source is not the N2 vocabulary set.** A 29-item probe of common N2 vocabulary found 11 absent from all four local files, including `引き受ける`, `取り組む`, `落ち着く`, `促す`, `把握` and `温める`. Three of the game's own five Inn targets are absent: `温める`, `引き受ける`, and `取り替える`, which appears only as N4. The level labels also do not match the exam - `影響`, `状況`, `対象`, `傾向`, `需要`, `供給` and `検討` are labelled n3 while an N2 learner needs them - so a large part of what N2 tests sits in `n3.json`.

**One gap would reintroduce a fixed bug.** The source contains `暖める` but not `温める`. This project already corrected exactly that distinction once: `暖める` is for air and rooms, `温める` for food and drink, and the Inn teaches reheating tea. Covering the source faithfully would put the wrong verb back into the game.

Revisions made:

- The base catalog is now OpenJLPT **n2 plus n3**, 3,577 unique words with no overlap between the files, 3,304 carrying example sentences - not `n2.json` alone.
- A project supplement, `research/n2-supplement.json`, holds items the source omits, authored with the same fields and marked `source: "project"` so they are never mistaken for sourced data. The five Inn targets seed it.
- The coverage claim is now coverage **of the named project catalog**, with provenance reported. The game does not claim to cover the JLPT N2 vocabulary list, because no reference list exists locally to verify that against.
- Task 1 now curates n2 and n3 together, must not exclude kana-only headwords for a blank reading field, and carries tests asserting that `引き受ける` resolves to the supplement and that `温める` exists despite the source holding only `暖める`.
- Per-location partitions grow from roughly 300 items to roughly 700.
- New open decision: no reference N2 list exists locally, so the catalog's gaps can be sampled but not measured.

Catalog size is a shell cost rather than a per-stage one: the cleaned `n2.json` is 0.69 MB, so an n2+n3 catalog is roughly 3.8 MB raw before trimming to one example per item.

### 2026-08-25 - Curriculum re-anchored on actual N2 coverage

The owner restated the goal: cover N2 across the game. The previous revision had cut the course to 200 tested targets to fit the delivery format, which inverted the priority - 200 targets is 11% of the 1,793-record vocabulary file, so the course would have been comfortably deliverable and would not have met its own purpose. Delivery bends; coverage does not.

Measured against the local source before revising:

| Area | Scope | Source present |
| --- | --- | --- |
| Vocabulary | 1,793 records | `research/openjlpt/n2.json` |
| Grammar | roughly 150-200 patterns | none |
| Kanji | roughly 350-400 new | none |

Vocabulary data quality, measured: 295 records (16%) lack a reading, 300 are kana-only, 3 carry slash variants, 1,537 include an example sentence.

**Why the old model could not reach coverage.** It had exactly one way to teach an item: an authored, illustrated, natively reviewed, voiced question at roughly three audio clips each. That method cannot scale to 1,793 items and should not try. The fix is two tiers with costs an order of magnitude apart:

- Tier 1, 200 authored story questions across 20 episodes, with artwork, native review and pre-rendered Nanami audio. High-value language taught deeply; the story lives here.
- Tier 2, catalog practice generated from the curated data - reading from written form, meaning from word, and cloze built from each record's own example sentence. No bespoke artwork, no pre-rendered audio. Generated, not authored.

Tier 2 is what makes the coverage claim honest, because the work moves from authoring roughly 1,500 questions to curating one dataset once.

Coverage is distributed rather than bolted on: the catalog is partitioned across the five locations by theme, roughly 300 items each, and practice is reached from inside a location as Kon's 稽古 rather than as a separate flashcard mode.

Delivery is unchanged by the growth in coverage, because only Tier 1 dialogue and listening questions get pre-rendered audio: still about 150 clips and 6.9 MB per stage, about 33 MB for the course. The artifact remains an Entrance plus Inn Episode 1 demo that must build under 15 MB, and the worker still caches per stage rather than precaching everything.

New Task 6B builds the practice layer. Task 1 now curates the whole file rather than only the verbs, keeps rejected records visible with reasons, and separates testable from excluded items so coverage is never inflated. Task 10's final gate asserts every testable item is tested in one tier or the other.

**Grammar and kanji are now a blocker on the stated goal, not just on authoring.** Neither has any source in the repository. Until one is approved, the game claims N2 vocabulary coverage, names its source, and reports grammar and kanji as unmet rather than implying them.

### 2026-08-25 - Five-stage curriculum plan revised to a deliverable size

Reviewed the approved curriculum spec and 12-task plan against the repository. The direction held up; the sizing did not. Three faults would have surfaced only after large amounts of content had been authored and natively reviewed.

**The course did not fit the delivery format.** Neither document mentioned a size budget. Measured: 59 clips, 2.63 MB, averaging 45.7 KB, with the artifact already at 12.92 MB of a hard 16 MB ceiling for one stage. The 500-question draft projected roughly 1,800 clips, about 80 MB of audio, or about 107 MB once base64-inlined. `sw.js` also precached everything through `cache.addAll`, which is all-or-nothing.

**The per-stage counts were arithmetically impossible.** The spec required one primary target per question, while the tasks asserted 25 verbs, 55 other vocabulary, 20 grammar and 60 kanji items per stage - 160 tested items across 100 questions. The 80 vocabulary and 20 grammar targets alone consumed every question, leaving none for 60 kanji slots. Written as tests, Task 6 could never have gone green.

**The Inn story conflicts with a concurrent edit.** `n2-home-inn-stage.js` is being reframed as a single three-day arc, 「三日間、宿の仕事を手伝ってくれませんか」, while the plan gives each episode its own three-day arc. Recorded as an open decision that blocks Task 6.

Revisions made:

- Four episodes per stage instead of ten: 20 episodes and 200 questions, sized against measured audio cost of roughly 150 clips and 6.9 MB per stage, about 33 MB for the course. The 3-3-4 ten-question episode shell is unchanged. The six deferred episodes per stage are listed rather than discarded.
- Primary targets and slot credit are now distinct. Each stage's 12 verb, 16 vocabulary, 6 grammar and 6 kanji primary targets sum to exactly its 40 questions; slot credit is capped at three per question and can never decide correctness.
- Delivery is a design constraint: the shell precaches only the Entrance and skeleton, stages cache their own assets on entry, audio generates per stage, and the artifact is an Entrance plus Inn Episode 1 demo whose build fails above 15 MB rather than emitting an unpublishable file.
- New Task 6A runs the delivery and scale gate immediately after the first finished stage. Discovering the ceiling there costs one stage of rework; at Task 12 it would have cost 200 authored and reviewed questions.
- The repair timer is a per-type budget in the question data, defaulting to 8 seconds, rather than a flat 5. Five seconds is enough to recognize one word but not to read three N2 options after audio.
- No answer type requires typing Japanese; `information-entry` selects from values visible in the record.
- The catalog alias `引受る` was corrected to `引受ける`. It was baked into a contract test, and the non-standard okurigana is the same class of error as the earlier 暖める and 揃う fixes. Still worth a native check.
- Declining a location offer is now a listed reachable state and is persisted in v3 progress, with a test. This behaviour existed in v2 and was lost during a concurrent edit.
- Acceptance criteria are now individually checkable, and state plainly what is not claimed.
- Open decisions recorded: no named native reviewer for 200 questions, the Inn story conflict, no approved grammar or kanji catalog source, and whether the artifact demo is worth maintaining.

The migration test shape in Task 4 was checked against real storage and is correct: v2 does write `stageProgress.homeInn` with `phase` and `medal`.

### 2026-08-24 - The finished Entrance was clipped away, not just below the fold

The first fix for the missing continue button was incomplete. It rescued `#next-row` but not `#feedback-row`, and it only held on tall screens.

The real cause is that `#screen-game.entrance-stage` is `overflow:hidden` so the alley cannot spill. Everything after `#scene` - the hint button, the result stamp and the continue button - is therefore *clipped away*, not merely pushed below the fold, and cannot be reached by scrolling. It also explains why the shared mobile sticky rule never helped: `position:sticky` needs a scrolling ancestor, and this box does not scroll.

Worse, the first fix's `.entrance-stage .next-row{position:absolute}` outranked that shared sticky rule on specificity, so it disabled pinning on phones as well.

Measured at 360x640 before the fix: the button sat at 687px in a 640px viewport with the result at 782px, both outside the stage box. At 390x844 the same code passed, which is why the first round of phone QA missed it.

The fix:

- Desktop (761px and up) keeps the button in the spent action dock's slot, with the result just above it.
- Phones use `position:fixed`, the only way out of an `overflow:hidden` box.
- `.answer-workspace` is `z-index:2`, so a z-index on the rows inside it could not beat `.learning-context` at `z-index:5` and the dialogue painted over them. The workspace is lifted instead - but only inside the phone media block, because on desktop that also lifts `#scene` over Kon's speech card. Both states were verified by hit-testing, not by position alone.
- The dialogue is pinned too on phones. The stage is taller than a short screen, so the dialogue was anchored to a stage bottom below the viewport while the dock was anchored to the viewport, and the two collided over Kon's reply.

Verified at 360x640, 390x844 and 1280x720: Kon's reply, the result and the button are all on screen, none overlapping, and each is the topmost element at its own centre. Cache bumped to `lantern-alley-v37`.

A regression test now pins the whole contract, including that the workspace lift stays phone-only.

Note: two audio tests fail against a concurrent session's in-progress rework of `n2-home-inn-stage.js` into a three-day arc. Those lines have no clips yet. That work is deliberately left uncommitted here.

### 2026-08-24 - One three-day agreement and explicit day difficulty approved

The owner approved removing the end-of-Day-1 next-day work confirmation. Kon will ask once at the Inn entrance for three days of help. The phases become `一日目・基礎 ★☆☆`, `二日目・実践 ★★☆`, and `三日目・挑戦 ★★★`; the existing focused review remains part of Day 3. The `引き受ける` lesson becomes a normal same-day inn duty, and declining that duty is an incorrect answer that asks the learner to help rather than ending the stage. Regression expectations were updated first and are expected to fail until dialogue, phase metadata, transitions and obsolete decline state are corrected.

The local OpenJLPT N2 source contains 1,793 entries, including 385 entries whose English meanings explicitly begin with `to`. Five locations with only five target verbs each would cover 25 verbs, so it cannot cover every N2 verb. The source also uses variants such as `暖める` for the project's context-correct `温める` and `引受る` for `引き受ける`, while verbal nouns such as `調整` are not counted by the simple English-meaning filter. A complete five-location curriculum therefore needs canonical aliases and multiple three-day chapters per location; this architectural curriculum expansion is not being silently folded into the current Inn dialogue change.

Production now uses one three-day agreement in the Inn introduction. Day metadata and Japanese day announcements are supplied by the stage and rendered in the phase badge and first story beat. The Day 1 `引き受ける` request is now tonight's dinner service; declining any daily duty follows the ordinary incorrect-answer path, and obsolete decline/resume state and exit logic were removed. Every phase now uses the explicit replies `はい、引き受けます。` and `すみません、引き受けられません。`. Day completion and Challenge/Review completion controls now use Japanese story copy. Regression expectations were updated to the approved dialogue and sequence. The offline worker is now `lantern-alley-v40`. Changed neural voice clips and the standalone artifact still need regeneration.

### 2026-08-24 - Shorter 5/5/5 Inn progression approved

The owner found Practice and Challenge too repetitive and approved a smaller progression: 5 guided Learn encounters, 5 mixed Practice encounters using changed situations, 5 new audio-only Challenge encounters, then focused review of missed verbs only. Regression expectations now describe this 5/5/5 behavior and focused-review completion; they are expected to fail until the phase data, mastery threshold and review transition are updated.

The stage data now contains one changed Practice situation and one distinct audio-only Challenge situation per target word. Perfect Challenge mastery is 5/5 with all five words covered; otherwise only missed verbs return, and recalling those completes the stage without replaying the full Challenge. Score copy now uses the actual Challenge length. The offline cache contract expects `lantern-alley-v39`, so the worker version remains the final production update before verification.

Regression checks that previously selected the removed second Practice set by fixed array indexes now locate the corresponding retained Practice or Challenge situation by word and variant. The main learning-phase summary in this handoff now also reflects 5/5/5 and focused-review completion.

The service worker now uses `lantern-alley-v39`, completing the offline update path for the shorter stage.

The standalone artifact was rebuilt with the 5/5/5 stage: 6 scripts, 1 stylesheet and 77 images inlined, 13,545,596 bytes (12.92 MB). The full suite passes all 122 tests and the three production scripts pass syntax checks; final diff verification remains before handoff.

### 2026-08-24 - Moonview Inn cinematic shell approved

The owner approved matching Moonview Inn to the Alley Entrance: dark indigo framing, walnut stage and dialogue docks, cream washi speech, larger transparent Kon, and the illustrated room kept as the primary answer canvas. The existing learning interactions and content remain unchanged. A regression contract was added first and is expected to fail until the new `inn-stage` shell is wired and styled for desktop and mobile.

The `home-inn` location now activates an isolated `inn-stage` visual shell. Desktop uses a compact wooden header, a Kon-and-dialogue dock beside the framed illustrated room, and a labelled interaction strip; phones stack the same pieces without sticky dialogue overlap. The cache contract now expects `lantern-alley-v38`, so the service worker version must be bumped before final verification.

The service worker now uses `lantern-alley-v38`, preventing installed copies from retaining the previous Inn layout.

`lantern-alley-artifact.html` was rebuilt with the Inn shell: 6 scripts, 1 stylesheet and 77 images inlined, 12.92 MB. Rendered desktop and phone checks plus the complete automated suite remain before final sign-off.

Final automated verification passes all 121 tests, syntax checks for `app.js`, `n2-home-inn-stage.js` and `sw.js`, and `git diff --check` with only the repository's existing LF-to-CRLF warnings. The artifact is 13,545,291 bytes (12.92 MB). The available browser session blocked both `file://` and loopback preview URLs, so rendered viewport QA could not be completed in this run; no publish, commit, push or deployment was performed.

### 2026-08-24 - Published Entrance still hides the Alley button on a phone

The owner reported that after Kon says to explore the alley, no control appears. Reproduction separated the two delivery surfaces: the current source page shows `路地を見る` after a correct bow at 390x844, but `lantern-alley-artifact.html` was generated at 16:39 before the mobile completion CSS changed at 16:51. The standalone artifact therefore contains the button logic but not the later fixed-position phone layout, so its completed controls remain clipped by the Entrance stage.

The explicit button remains preferable to an automatic transition because Kon asks the learner to choose a destination and the learner may still be reading the final Japanese line. A regression contract now requires the standalone artifact to contain the completed phone layout for both the Alley button and Kon's final dialogue before the artifact is rebuilt.

Because the same CSS is part of the installable PWA shell, its cache contract now requires `lantern-alley-v37`; reusing version 36 would leave previously installed copies on the clipped layout even after the source and artifact are corrected.

The service worker now uses `lantern-alley-v37`. The standalone artifact still needs rebuilding before the new delivery regression can pass.

`lantern-alley-artifact.html` has now been rebuilt from the corrected mobile CSS: 6 scripts, 1 stylesheet and 77 images inlined, 12.91 MB. The next check is the green regression run and a fresh 390x844 completion render from the rebuilt artifact itself.

The new artifact regression passes. Fresh browser QA then ran the rebuilt standalone artifact through the complete Entrance at 390x844: after Bow, `路地を見る` is visible at the bottom of the viewport while Kon's final Japanese remains readable above it; selecting the button opens the six-destination alley map with Moonview Inn available. No automatic transition was added.

Final verification rebuilt the artifact at 13,540,033 bytes (12.91 MB), passed all 120 defined tests, passed syntax checks for `app.js`, `n2-home-inn-stage.js` and `sw.js`, and passed `git diff --check` with only the repository's existing LF-to-CRLF warnings. No commit, push, publish or deployment was performed, so the local artifact is corrected but the published Claude Artifact still requires explicit owner approval to republish.

### 2026-08-24 - Entrance had no way to continue to the alley

After the bow, Kon said 「これから路地を歩いて、行きたい場所を選んでください。」 and the player was stranded: no button, no auto-advance.

The button was being created correctly - `#next-row` was `display:block` with the text 路地を見る. The problem was purely layout. `.entrance-stage #scene` is `height:100%` and fills its whole grid row, so every sibling after it is pushed past the bottom of the stage. Measured at 1280x720: the button's top edge sat at 725px in a 720px viewport, with the stage ending at 692px. It was rendered, just permanently off-screen.

Once the tutorial is answered the action dock has done its job, so a new `entrance-complete` state hides the dock and gives the continue button that slot. Measured after the fix: 587-636px on desktop and 687-756px at 390x844, both inside the viewport and inside the stage, with no horizontal overflow. The button navigates to the six-destination map.

Cache bumped to `lantern-alley-v36`, and the pinned version assertion in `pwa.test.mjs` updated with it.

### 2026-08-24 - Illustrated build committed and published; handoff corrected

The illustrated Entrance, map system and inn artwork had been verified but left uncommitted and unpublished across sessions. All of it is now in git as one commit, and the 12.91 MB artifact is published to the live URL.

Four inaccuracies in this document were corrected while doing so:

- Section 7's test command omitted `lantern-map.test.mjs`, so it reported 112 tests when the suite is 119. Corrected to the five-module command already documented further down.
- The file table said Python is not installed. It is; bare `python` is the Microsoft Store alias stub, so the Python builder needs the full interpreter path. `node build-artifact.mjs` remains the maintained one.
- `docs/superpowers/` was described as entirely predating the redesign, but now also holds the current 2026-08-24 specs.
- `lantern-map.js` was missing from the file table.

### 2026-08-24 - Larger Entrance cast and separate dialogue dock approved

The owner approved bringing the Entrance closer to the supplied mock: a much larger learner blended into the alley, Kon standing separately in the scene, and a bottom dock that keeps dialogue and action cards separate from both characters. The existing transparent assets will be reused unless rendered scaling proves inadequate. A regression contract was added before implementation to require avatar relocation, restoration for other stages, large desktop cast dimensions and a bottom-aligned dialogue area.

Rendered QA found that the older Entrance pose files contained opaque pale canvases, so CSS alone could not blend the enlarged Kon into the alley. Eight replacement PNG cutouts are now stored under `assets/fox/*-transparent-v2.png`. Each file was checked as `Format32bppArgb` with corner alpha `0`; failed checkerboard generations were rejected and regenerated from the original pose sources. Runtime and offline-cache wiring are the next steps.

The PWA regression contract now requires cache version `lantern-alley-v35` and all eight transparent version 2 poses in the offline shell before production wiring.

Production now uses the transparent version 2 pose set for every Entrance Kon state, including idle, wave variants, invitation, celebration, correction and listening. The service worker was bumped to `lantern-alley-v35` and now pre-caches this exact pose set; the existing transparent no-mouth speech base remains unchanged.

The first artifact rebuild correctly embedded the new files but failed the repository's 16 MB delivery limit at 27.34 MB because the eight lossless PNG cutouts add roughly 11 MB. The approved visual design is unchanged; the next correction is to encode the same alpha cutouts as efficient WebP assets and update the contracts and references before rebuilding.

The eight cutouts were resized to a maximum 512-pixel edge and encoded as alpha WebP at quality 86 with alpha quality 100. Metadata checks report `hasAlpha: true` for every result. The production set totals 314,954 bytes instead of 11,664,030 bytes, and all runtime, test and offline-cache references now point to `*-transparent-v2.webp`.

The rebuilt self-contained artifact now succeeds at 12.91 MB with 6 scripts, 1 stylesheet and 77 images inlined. A test run issued immediately before that rebuild still saw the previous oversized artifact and failed only its file-size assertion; this assertion must be rerun against the new 12.91 MB output during final verification.

Fresh-origin rendered QA passed at 1280x720 and 390x844. On desktop, the learner and transparent Kon stand independently in the alley above separate wooden dialogue and action docks. On mobile, both characters remain above the dialogue, the dialogue remains above the action cards, all three English action labels are visible, and the complete stage fits in the viewport without requiring a page scroll. No pose shows an opaque square or checkerboard.

Final verification on 2026-08-24 rebuilt the artifact at 13,536,996 bytes (12.91 MB), passed all 119 defined tests, passed `node --check app.js`, and passed `git diff --check` with only the repository's existing LF-to-CRLF warnings. No commit, push, publish or deployment was performed.

After verification, the eight unused 11 MB PNG intermediates were removed from `assets/fox`; the eight referenced alpha WebP production files remain. The original full-resolution generated outputs remain recoverable in Codex's generated-image folder.

The Entrance now relocates the live Kon avatar into the scene while preserving the same element and speech pose system; entering any other stage restores it to `dialogue-shell`. On desktop the learner is 170 x 340 px and Kon occupies a 170 x 220 px scene layer. The dialogue and action cards use adjacent wood-framed bottom panels, with a Kon name tab and HOW TO INTERACT embedded above the choices. Mobile keeps the characters large at 112 x 224 and 112 x 145 px, then stacks dialogue above the action row when choices appear.

Initial mobile render QA found the stacked dock covering Kon and the learner's legs, while the HOW TO INTERACT copy overlapped the cards. A regression contract now requires both characters to rise above the dock, 162 px of dock clearance, and a 42 px instruction band above the action cards before the mobile CSS correction.

The mobile correction raises both scene characters to a 302 px bottom offset while choices are present, reserves 162 px beneath the dialogue, and increases the action dock's top padding to 42 px. The interaction sentence therefore has its own band and neither character sits behind the dialogue card.

Clean mobile render QA then exposed opaque pale canvases inside Kon's listening and other pose files. This defeats the approved requirement that the larger character blend into the alley. A regression contract now requires versioned transparent production cutouts for all eight previously opaque Entrance poses before their generated replacements are wired into the app.

### 2026-08-24 - Entrance action-card labels corrected to English

The owner clarified that the words beneath the illustrated Entrance actions are control descriptions, so they must be English even though Kon's spoken request remains Japanese. A regression contract now requires `Bow`, `Wave` and `Clap` in both the shared tutorial model and the rendered app data before the production labels are changed.

The production action-card labels are now `Bow`, `Wave` and `Clap` in both `entrance-stage-logic.js` and `app.js`. The Japanese request, hint and response text are unchanged, so the player still demonstrates comprehension of Kon's Japanese rather than reading a translated answer sentence.

The offline-delivery contract now requires cache version 34 before rebuilding, so installed copies receive the corrected labels rather than retaining the version 33 shell.

`sw.js` now uses `lantern-alley-v34` for this label correction.

The standalone artifact was rebuilt with the corrected English action labels: 6 scripts, 1 stylesheet and 77 images inlined, 12.58 MB total.

Verification passed: the artifact contains all three English labels, `node --check app.js` passed, `git diff --check` found no whitespace errors, and the five defined suites passed 117 of 117 tests.

### 2026-08-24 - Clear zabuton direction and illustrated Entrance gate planned

The owner confirmed two visual corrections. Moonview Inn must show unmistakable vertical versus horizontal zabuton without changing the Japanese question. The Entrance must match the approved wooden-gate reference more closely, using a dedicated gate scene and one consistent human character for idle, bow, wave and clap. Regression contracts were added before production changes.

Generated and saved two project assets: `assets/entrance/wooden-gate-v1.png` (1536 x 1024) and `assets/entrance/player-actions-v1.png` (1774 x 887, true RGBA transparency). The gate contains no characters or UI. The pose sheet contains the same learner in idle, bow, wave and clap poses with equal horizontal cells.

Moonview Inn now renders cushions from their actual `color`, `size` and `dir` data instead of the inconsistent first row of the old sprite sheet. The base silhouette is landscape; 縦向き rotates 90 degrees and 横向き remains horizontal. Woven seams, curved padding and a central tuft make each object read as a zabuton at small sizes.

The Entrance bow contract was updated before implementation: the learner must switch to the dedicated side-view bow cell rather than distort or rotate a front-facing SVG. The pose holds for the existing 1.25-second decisive-action window and reduced-motion still shows the correct static pose.

Production now uses the dedicated gate background and transparent four-pose learner sheet. The old inline stick-figure SVG and its limb-distortion animations were removed. Both the learner in the scene and the three answer cards use the same character artwork, with the bow card and performed bow showing the unmistakable side-view pose. The Entrance header was restyled as a compact wooden plaque so it belongs to the gate scene while preserving the existing Japanese lesson and answer logic.

The offline-delivery regression contract now requires both new Entrance images, cache version 33, the new bow artwork rule, and the complete removal of `PLAYER_SVG`. This was added before changing the service worker or rebuilding the standalone artifact.

`sw.js` now pre-caches both Entrance production assets and uses `lantern-alley-v33`, ensuring returning installed-app users do not remain on the old entrance scene.

The standalone desktop artifact was rebuilt from the updated sources. It inlines 6 scripts, 1 stylesheet and 77 images and is 12.58 MB, below the 16 MB artifact limit.

Rendered QA used a clean local origin to avoid the old service-worker cache. At 1280 x 720, the gate, learner and all three illustrated action cards remain inside the 1000 px stage. At 390 x 844, the Entrance is 374.4 px wide with no horizontal overflow; all three cards are visible. The Moonview shelf also shows the four zabuton as unmistakable portrait/landscape pairs, with the full illustrated room remaining 331.2 px wide. The old localhost preview may show stale emoji cards until its v33 worker takes control after reload.

Final verification: the standalone build completed at 12.58 MB, `node --check app.js` passed, `git diff --check` found no whitespace errors, and the five defined automated suites passed 117 of 117 tests. Unfiltered `node --test` additionally discovers `visual-smoke-test.mjs`; that optional script could not connect to its separate expected browser endpoint at `127.0.0.1:9223`, while in-app rendered QA was completed through the clean preview above.

### 2026-08-24 - Entrance rendered QA found header stretching and weak dialogue contrast

At a 1280 x 720 desktop viewport, CSS Grid stretched the Entrance header row to 216px and the pale speech card inherited white scene text. Added a regression contract before correcting the row sizing and explicit speech color.

The Entrance grid now uses an auto-sized header plus a flexible scene row, and the speech card explicitly uses dark text. This preserves the full-height alley composition without wasting the upper third of the screen.

The regression suite passed 21 of 21 Entrance tests, then `lantern-alley-artifact.html` was rebuilt with the corrected CSS (6 scripts, 1 stylesheet and 75 images inlined; 8.40 MB).

Rendered action QA exposed a second issue: rotating the front-facing player by 28 degrees looked like a sideways lean, not an お辞儀. The bow contract now requires vertical lowering and foreshortening of the upper body while the legs remain fixed.

The bow now compresses the upper-body depth to 72% and lowers it 12px at the hold point, then returns upright. Reduced-motion users receive the same recognizable bowed pose without animation.

The revised bow passed all 21 Entrance tests and the standalone desktop artifact was rebuilt again with the final motion.

Returning-player QA found that `最初から` cleared progress but opened the map, which skipped Kon's required greeting and mechanics lesson. A regression assertion now requires reset to re-enter the Entrance.

`最初から` now clears saved progress and immediately starts the Entrance greeting, matching the first-time route.

The reset route passed the complete 21-test Entrance suite and the standalone artifact was rebuilt with the corrected flow.

Phone QA at 390 x 844 found no horizontal overflow, but the opening Kon still had an opaque white square. A regression contract now requires the transparent fox source and a small CSS smile for the static title pose.

The title now uses `fox-neutral-no-mouth-transparent.webp` inside a positioned wrapper, with a small CSS smile aligned beneath the nose. The background scene can show cleanly around Kon at every breakpoint.

The transparent title pose passed all 21 Entrance tests and the standalone artifact was rebuilt (6 scripts, 1 stylesheet and 75 images inlined; 8.42 MB).

Final offline review found that the Entrance QA fixes were made after cache v31 was introduced. The delivery regression now requires v32 so installed users cannot remain on the earlier redesigned shell.

`sw.js` now uses `lantern-alley-v32`; installing the final build replaces v31 and discards older shell caches on activation.

Final verification: JavaScript syntax checks passed, all 114 self-contained automated tests passed with zero failures, `git diff --check` found no whitespace errors, and `lantern-alley-artifact.html` is 8,824,384 bytes. No commit, push, publish or deployment was performed.

Rendered QA used the rebuilt standalone artifact at 1280 x 720, 390 x 844 and 320 x 720. The opening and Entrance had no horizontal overflow, the Entrance header remained compact, actions stayed hidden until the request, reset returned to the greeting, and the browser console reported no warnings or errors.

Newest first. Each entry records why the change was made, because the reasoning is harder to recover than the code.

### 2026-08-24 - Cinematic opening, Entrance, bow, and room-light design approved

The approved direction makes the first experience part of the same illustrated world as the map. The opening becomes a full-scene cover using the Lantern Alley artwork, a large `言葉の路地` title, Kon in the foreground, one Japanese entry action, and only a compact saved-progress note when needed. The Entrance becomes a dedicated gate scene with Kon and the learner together, three-step progress, dialogue along the bottom, and picture-first actions shown only when Kon asks the learner to act. `HOW TO INTERACT` remains the only English helper and sits outside the answer content.

The learner's bow will keep both feet planted and move the straight upper body from the hips through a 25 to 30 degree bend, brief pause, and natural return. Bulb-replacement encounters will begin dim, stay dim after the broken bulb is removed, then brighten with a warm fixture-centered glow as soon as the new bulb is installed. This visual result adds no extra answer step and has a reduced-motion path. The complete approved contract is `docs/superpowers/specs/2026-08-24-opening-entrance-lighting-redesign.md`. Production code has not changed at this checkpoint; the next step is implementation planning.

Implementation is authorized. The TDD sequence is recorded in `docs/superpowers/plans/2026-08-24-opening-entrance-lighting-implementation.md`: cinematic opening, dedicated Entrance and corrected bow, pure bulb light state and visual feedback, then offline rebuild and adaptive verification. The project owner requested implementation now, so execution will continue inline in this task. No commit, push, or remote publication is authorized.

TDD Task 1 starts with an opening-screen regression contract. It requires the project-owned alley artwork, Japanese title and entry controls, compact returning-progress state, and removal of the long legacy English introduction. Production opening markup and styling remain unchanged until this test fails for those expected missing cinematic elements.

The Task 1 red check failed on the legacy title card as expected. The opening now uses the illustrated alley as a full-scene cover, with a dominant `言葉の路地`, small `LANTERN ALLEY`, foreground Kon, and one Japanese entry action. Returning progress is a compact Japanese status line; `路地へ戻る` and the secondary `最初から` appear only when progress exists. The long English premise paragraph is removed because the Entrance tutorial teaches it inside the world.

TDD Task 2 starts with three focused contracts: a pure 1/3, 2/3, 3/3 tutorial progress model; a dedicated illustrated Entrance scene whose picture actions remain hidden until the request; and a corrected 1.2-second bow with stable legs, a hip pivot, a 28-degree bend, and reduced-motion handling. Production Entrance logic, composition, and motion remain unchanged until these checks fail for the expected missing behavior.

The Task 2 red run failed on all three intended boundaries. The Entrance now has a pure three-beat progress helper and visible `路地の入口 1 / 3` state, while the existing fourth completion step still opens the map. The game shell receives a dedicated illustrated Entrance class: Kon and the learner occupy the same alley scene, dialogue remains along the lower edge, and the picture-first actions plus `HOW TO INTERACT` stay invisible until the request. The learner SVG now names its stable leg group separately; the complete upper body pivots from the hips to 28 degrees for 1.2 seconds before the answer resolves, with an explicit reduced-motion pose.

The first cross-stage Task 3 red run caught one Entrance compatibility regression: changing the semantic helper source to uppercase broke the existing control-help contract. The source is restored to `How to interact`, while CSS renders it visually uppercase. This preserves the approved appearance and the established readable label; the bulb-light tests remain intentionally red.

TDD Task 3 starts with a pure lighting-state matrix and rendered-effect contract. Only replacement of the bulb may return `dim` before installation or `bright` after it; towel replacement and warming must remain `normal`. The room effect must use pointer-transparent overlays, a fixture-centered warm result, and an explicit reduced-motion path. Production interaction logic and room styling remain unchanged until these checks fail for the expected missing helper and classes.

The Task 3 red checks failed because the lighting helper and visual classes did not exist. `MoonviewInnInteractions.getRoomLightState()` now returns `dim` only for an uninstalled bulb, `bright` after that bulb is installed, and `normal` for every other target or mechanic. `app.js` maps that pure state onto the illustrated viewport. Pointer-transparent CSS layers darken the room without obscuring objects, then remove the darkness and pulse a warm radial glow from the wall fixture over 650 milliseconds. Reduced-motion mode changes directly to the settled warm state. `applyReplace()` is unchanged, so installing the bulb remains the decisive final action with no added step.

TDD Task 4 starts at offline delivery. The new regression check requires cache version `lantern-alley-v31` and requires the standalone artifact to include the cinematic Japanese opening, Entrance progress model, corrected 1.2-second bow, and bulb dim/bright state system. The source implementation is green, but `sw.js` and the generated standalone file remain unchanged until this delivery test fails on the old cache and artifact.

The Task 4 red run failed first on the expected old cache version. `sw.js` is now `lantern-alley-v31`, ensuring returning installed-app users receive the redesigned shell. The standalone artifact still needs regeneration before the complete delivery contract can pass.

`node build-artifact.mjs` regenerated `lantern-alley-artifact.html` from the updated source. The builder inlined 6 scripts, 1 stylesheet, and 75 images; the standalone file is 8.40 MB. Delivery tests and rendered desktop/phone verification are still required before completion.

### 2026-08-24 - Illustrated map and future-stage system approved for specification

The approved map direction replaces the abstract dashed-node graph with one elevated illustrated Lantern Alley neighborhood. Six stable places form the world: 路地の入口, 月見宿, 灯り市, 夕月茶屋, 路地駅 and 灯守神社. Selecting a destination updates one compact story panel explaining why Kon would go there; entering remains a separate primary action. Desktop shows the complete alley, while phone keeps the same spatial arrangement and stacks the detail panel below it.

Only the Entrance and Moonview Inn are implemented today. The four future places must therefore use an honest 準備中 state with no dead or disabled enter button until each full story, lesson, interaction, audio set, tests and responsive scene are complete. The approved behavior and future-stage contract are documented in `docs/superpowers/specs/2026-08-24-lantern-alley-map-stage-system-design.md`. This entry records design approval only; production map files have not yet changed.

Implementation is authorized. The task-by-task TDD and verification sequence is documented in `docs/superpowers/plans/2026-08-24-lantern-alley-map-stage-system-implementation.md`. No production map source has changed at this checkpoint.

TDD Task 1 started with `lantern-map.test.mjs`. The red contract requires six stable map destinations while proving that the four future places resolve to `preparing` and return no navigation action. Production map code is intentionally still absent until this test fails for the expected missing-module reason.

The Task 1 red test failed only because `lantern-map.js` was absent. The minimal map model now defines six frozen destination records, resolves completed/in-progress/available/preparing from existing progress, and returns navigation actions only for the Entrance and Moonview Inn. `index.html` loads the model before `app.js`; no renderer or visual map changes are included in this step.

TDD Task 2 started with semantic-shell and interaction-boundary checks. They require one live destination detail region, `aria-pressed` map selection, a separate model-derived navigation action, and no visible action when a selected place is Preparing. The existing lesson test now explicitly distinguishes the two playable stage engines from the six-place visual map.

The Task 2 checks failed on the legacy graph and direct-entry renderer. The map markup now has one destination layer and one Japanese `aria-live` detail shelf. `app.js` renders all six model destinations, updates `aria-pressed` selection without navigating, and shows a separate action only when `LanternAlleyMap.getAction()` returns the Entrance or Moonview Inn. Future places update their story and 準備中 status but expose no enter control.

The first Task 2 green run caught a progress regression: removing the old node label also removed Moonview Inn's medal. The selected destination status now carries the existing bronze, silver or gold medal beside 学習中 or 完了. Navigation still reads the already-resolved action and cannot enter a Preparing place.

TDD Task 3 started with the visual contract. It requires a project-owned `assets/map/lantern-alley-map-v1.jpg`, a complete 3:2 map, selected-state styling, 44px compact destination controls and removal of the obsolete dashed graph and circular-node CSS.

The Task 3 test failed because the approved artwork was not yet owned by the project. The generated 1200 by 800 map was copied non-destructively to `assets/map/lantern-alley-map-v1.jpg`. The old graph CSS is replaced by the illustrated 3:2 scene, labeled lantern pins, explicit selected/completed/preparing states and a wood-and-washi Kon detail shelf. The map width also responds to viewport height so common desktop screens keep the complete map and detail together; phone widths retain 44px controls and stack the action below the story.

TDD Task 4 started with offline and standalone-delivery checks. They require the service worker to cache both the map model and exact artwork, and require `lantern-alley-artifact.html` to contain all six Japanese destinations, the semantic live detail, model-driven rendering and the exact embedded JPEG without a remaining local map URL.

The Task 4 red run failed exactly at the delivery boundary: `lantern-map.js` and the map JPEG were absent from the offline shell, and the old standalone file contained neither destination data nor artwork. `sw.js` now pre-caches both under `lantern-alley-v30`. The standalone file still needs regeneration before this cycle can turn green.

The first rebuild reported only five inlined scripts and the standalone test remained red because `build-artifact.mjs` used a hard-coded list that omitted `lantern-map.js`. The already-failing exact-artifact test covers this regression. The builder now places the map model before `app.js`; the next rebuild must report six scripts and embed the six destination records.

Rendered phone verification found a separate navigation bug: switching from the title to the map preserved the title button's lower scroll position, leaving the map header above the viewport. A new red regression check requires `showMap()` to reset the document to the top before rendering the destination view.

The phone scroll regression failed against the existing `showMap()` and is now fixed with an immediate top reset before map rendering. This affects only navigation into the map; map selection itself does not change scroll position.

Implementation is complete. The production map now shows the approved elevated Lantern Alley artwork from `assets/map/lantern-alley-map-v1.jpg`, with six Japanese destinations rendered from the testable `lantern-map.js` model. The Entrance and Moonview Inn have real enter/replay/continue actions; 灯り市, 夕月茶屋, 路地駅 and 灯守神社 remain selectable 準備中 places with story context and no dead action. Selection updates one `aria-live` Kon detail shelf, preserves Moonview Inn medals, and map entry resets to the top on phone screens.

Final verification passed all five self-contained automated test modules: 106 tests with 0 failures. Run them with `node --test entrance-stage.test.mjs lantern-map.test.mjs moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs pwa.test.mjs`. Do not use bare `node --test` as the automated-suite command: Node also discovers `visual-smoke-test.mjs`, which is a manual browser-driving screenshot script that requires a browser already listening on port 9223. `lantern-map.js`, `app.js` and `build-artifact.mjs` pass `node --check`, and `git diff --check` reports only the repository's existing LF-to-CRLF notices. Browser walkthrough completed the Entrance, opened the map, selected a Preparing destination with no enter button, and entered Moonview Inn through the separate map action. Desktop, 390px and 320px rendered checks kept all six destinations visible with no horizontal scrolling; the 320px layout kept the full map, Kon story and primary action organized in one column. The service-worker cache is `lantern-alley-v30`. The rebuilt standalone artifact inlines 6 scripts, 1 stylesheet and 75 images, is 7.96 MB, and embeds the exact map JPEG. The local desktop file is updated; the remote Claude Artifact URL has not been republished.

### 2026-08-24 - Authentic washitsu light correction

The recessed wall box in version 3 reads as a display niche rather than a believable room light. Reference review found wood-framed washi wall sconces used in Japanese rooms and ryokan, including fixtures with replaceable E17 bulbs. The approved correction replaces only that niche with a compact wood-and-washi wall sconce whose open underside keeps the bulb replacement action understandable. `assets/inn/room-empty-v4.png` is saved at the original 1536 by 1024 dimensions and is now the shared-room background. The existing 45/23/11/15 percent hotspot centers the draggable bulb over the sconce's underside socket. The offline cache is `lantern-alley-v29`.

Browser verification at 1366 by 768 confirmed the broken bulb sprite sits over the underside socket and the complete fixture remains inside the room. At 390 by 844 the sconce stays recognizable, the shelf remains five columns, and there is no horizontal overflow. The browser console had no warnings or errors. The standalone artifact embeds the exact version 4 image, was rebuilt with 5 scripts, 1 stylesheet and 74 images, and is 8,089,398 bytes. All 97 tests pass, and the changed JavaScript files pass syntax checks.

### 2026-08-24 - Integrated room shelf and lower light fixture

The approved visual correction makes the illustrated room and its draggable supply shelf read as one continuous game surface, matching the latest mockup while keeping every item as a real accessible control. The light fixture and its drop target moved lower so the bulb is not cut off by the top of the room. Desktop keeps one ten-item shelf row; narrow screens use a five-column, two-row shelf directly below the room. `assets/inn/room-empty-v3.png` was generated as a precise edit of version 2: only the upper-center light niche moved downward, with the shelf intentionally left to accessible HTML. The room renderer wraps the picture and shelf in one framed composite; the bulb hotspot is aligned at 45/23/11/15 percent, and the offline cache is `lantern-alley-v28`.

Browser checks at 1366 by 768 and 390 by 844 measured a zero-pixel gap between room and shelf, no horizontal overflow, a fully inset bulb target, and ten versus five shelf columns. A tap-placement check moved one cushion out of the shelf and into the first mat, proving the controls remained functional after nesting. The browser console had no warnings or errors. The standalone artifact was rebuilt with 5 scripts, 1 stylesheet and 74 images and is 8,122,514 bytes. All 97 tests pass, and the three changed JavaScript files pass syntax checks.

### 2026-08-24 - Conversation controls expanded to the full game surface

The learner no longer has to target Kon's speech bubble. Any click or tap on a non-control area inside the active game screen now uses the same dialogue flow: while Kon speaks it stops the voice and reveals the complete line; once `▼` is ready, the next background click advances. Clicking an answer, draggable object, audio button, hint, navigation control, input, label or other explicit control performs only that control's action and never also advances the conversation. Unanswered requests remain locked.

The shared dialogue controller exposes the surface-routing rule, with focused tests proving that two background clicks finish then advance, while controls are ignored in both speaking and ready states. Browser verification found one related state-loss bug: replaying a story line through the audio button used the normal new-line path and cleared its pending continuation. Replay now has a separate controller path that restarts text and audio while preserving the continuation. The offline cache is `lantern-alley-v27`. All 97 tests pass, both edited JavaScript files pass syntax checks, and the rebuilt standalone artifact is 8,284,350 bytes. Desktop and 390 by 844 browser checks confirmed background finish/advance, control protection, replay preservation, unanswered-request locking, no horizontal overflow and zero console errors.

### 2026-08-24 - Click once to finish Kon's line, then click again to continue

Kon's dialogue now reveals progressively while her MP3 or device voice plays. The speech bubble shows `»` while speaking and `▼` when the next dialogue or question is ready. A first click, tap, Enter or Space during speech cancels the current audio and reveals the entire Japanese line without advancing. A second activation advances only when the story has registered a continuation. Requests that still need a learner action ignore further dialogue clicks, so answers and drag controls cannot be bypassed.

Natural speech completion reveals the full line and arms a single click instead of automatically changing the question. Correct-answer responses and the Entrance introduction use the same controller. The speaker button replays the complete stored line even if only part of it is currently visible. Browser testing verified the partial-line state, first-click completion, second-click progression, unanswered-question lock, keyboard activation and the compact visual indicator. The offline cache is now `lantern-alley-v26`.

Five controller behavior tests cover first-click cancellation, exactly-once advancement, unanswered-question protection, natural speech completion and complete-line replay. A sixth regression check requires the rebuilt standalone artifact to contain the controller and its accessible dialogue controls. `node build-artifact.mjs` rebuilt the standalone file with five inlined scripts, one stylesheet and 74 images. All 94 tests pass, both edited JavaScript files pass syntax checks, and the artifact is 8,283,336 bytes. An uncached standalone browser run confirmed partial text, first-click completion, second-click progression and zero console errors.

### 2026-08-24 - Room-object visibility and destination-separation correction started

The latest visual review found three concrete interaction failures in the illustrated room: the large red cushion crosses into the neighboring sprite cell, a dragged item can render behind the room because it has no explicit stacking level, and the microwave target overlaps both the futon and the second mat targets. Regression checks were added first. They require transparent gutters around every sprite cell, a visible high-layer drag state, permanently recognizable mat edges, and a three-percent safety gap between appliance targets and the mats or futon. These checks are intentionally red until the corrected artwork and UI implementation are applied.

The revised non-destructive background is now saved as `assets/inn/room-empty-v2.png`. It preserves the same room style and fixture set, moves the appliance cabinet into a separate center-right kitchen area, keeps the futon at the far-right edge with open floor between them, and gives both mats darker raised woven borders. Production still points to version 1 until the matching hotspot update is applied and verified.

The corrected object sheet is saved non-destructively as `assets/inn/room-objects-v2.png`. Each original object was alpha-cropped, uniformly reduced to preserve the large-versus-small cushion distinction, centered in an exact 314-pixel cell, and surrounded by transparent padding. This removes neighboring-cell fragments without changing the objects themselves. Production still points to version 1 until the visual contract passes against the new sheet.

Production now uses both version 2 assets. The hotspot map was realigned to the new artwork: the kitchen targets occupy the center-right cabinet, the futon starts at 77 percent of the room width, and the two mat targets sit lower in the room. Appliance targets now have at least a three-percent safety gap from every mat and the futon. The drag state uses a high stacking layer and ignores pointer hit-testing while moving, so the item stays visible without blocking destination detection. Both mat hotspots have a permanent woven overlay and inset edge, while labels remain hidden. The offline cache is now `lantern-alley-v21` and pre-caches only the version 2 production artwork.

Uncached browser testing found that the general drag rule was still losing `position: fixed` in the CSS cascade: the later illustrated-object rule restored `position: relative`, so a dragged item received its shelf offset twice and moved outside the viewport. A new regression check now requires an illustrated-room-specific fixed-position override. That check is red until the cascade correction is applied.

The illustrated-room-specific drag override is now placed after the regular illustrated object state and keeps the moving object fixed to viewport coordinates. It also suppresses the shelf hover translation during the drag. The cache is now `lantern-alley-v22`, ensuring returning browsers receive this final cascade correction.

A second uncached pointer test confirmed the object is visible and fixed at a high layer, but the synthetic pointer stream stops after the first move and never reaches release. The current hypothesis is that applying `pointer-events: none` to the original element conflicts with its pointer capture. Because drop detection already compares pointer coordinates against every destination rectangle, disabling pointer events is unnecessary. A regression check now requires the moving source to retain pointer events through release; it is red until that focused correction is applied.

The dragged source now retains pointer events while remaining fixed at z-index 1000. This allows its existing pointer capture to receive the full movement and release stream; destination detection still uses pointer coordinates and is unchanged. The cache is now `lantern-alley-v23` so the pointer correction replaces the earlier version 22 styles.

The version 23 browser check rejected that hypothesis: the synthetic drag still stopped after the first move. The remaining root cause is listener scope. `makeDraggable` listens for movement and release only on the original button, so any failed pointer capture lets the stream leave the element and strands it in the dragging state. A new regression check requires temporary window-level move and release listeners for the duration of an active drag, with cleanup after release. This check is red until the event-tracking correction is applied.

`makeDraggable` now installs window-level pointer move, release and cancel listeners only while a drag is active, filters them to the initiating pointer ID, and removes all three listeners on completion. Pointer capture remains as the preferred path, while the window listeners provide a fallback when capture is unavailable. The cache is now `lantern-alley-v24` because `app.js` changed.

At 390 by 844, the room and shelf fit without horizontal overflow, but browser geometry found a separate compact-layout issue: a legacy 64-pixel minimum height enlarges illustrated appliance hotspots beyond their mapped fixtures. The stove then overlaps the microwave, and the microwave overlaps the second mat. New red checks require the stove and microwave metadata to have a real gap and require illustrated hotspots to keep their mapped bounds instead of inheriting the legacy card minimum.

Illustrated hotspots now keep their percentage-mapped dimensions instead of inheriting the old 64-pixel answer-card minimum. The stove, microwave and mats were tightened to their visible fixture bounds with three-percent vertical safety gaps. This removes compact-layout overlap while preserving the background alignment. The cache is now `lantern-alley-v25`.

Final uncached interaction verification succeeded at 1280 by 720 and 390 by 844: a real pointer drag moved one cushion from the shelf to a mat, removed the active drag state, cleared hover state, and updated the count to 1 of 4. Compact geometry showed separate gaps between stove, microwave, mats and futon, with no horizontal overflow and no console errors. The artifact check verifies the exact version 2 background and sprite bytes, the window-level drag tracking, the compact hotspot override, and the absence of external room paths. It does not check the cache version because the standalone artifact intentionally omits the service worker.

`node build-artifact.mjs` rebuilt `lantern-alley-artifact.html` from the corrected source. It inlined five scripts, one stylesheet and 74 images; the resulting standalone file is 7.90 MB. It embeds both version 2 room assets as image data rather than external paths. The standalone artifact intentionally omits the service worker; cache version 25 applies to the regular local/PWA build.

Final verification for this correction: all 88 automated tests pass, all three edited JavaScript files pass syntax checks, the artifact is 8,278,679 bytes and below the 16 MB limit, and desktop plus phone browser runs completed a real drag with no console errors.

### 2026-08-24 - Illustrated room implemented and verified

The approved version 3 room is implemented in the game. The production artwork is saved in `assets/inn/`: `room-empty-v1.png` is a 1536 by 1024 room with recognizable fixtures and no movable answers, and `room-objects-v1.png` is a transparent 4 by 4 sprite sheet containing all 13 movable items. The shared `ROOM.visual` data maps each movable item to one sprite cell and each of the nine valid destinations to a bounded percentage hotspot over its real fixture. The separation prevents a moved item from remaining duplicated in the background. A visual-contract regression test enforces the complete map and passes with all 13 items and all nine destinations present exactly once. Existing Japanese-learning behavior, tap and drag controls, replacement order, appliance rules, and responsive stage layout remain unchanged. The implementation checklist is in `docs/superpowers/plans/2026-08-24-illustrated-room-implementation.md`.

Renderer integration checks require and now pass for the approved 3:2 room artwork, fixture-aligned hotspots, responsive image shelf, and captions that stay hidden until hover, focus, or selection.

The renderer now builds that illustrated surface: the empty room is the interaction background, destination buttons sit over their actual fixtures, and independent sprites move among the room and wooden supply shelf. Cushions remain visible on their mat, removed items remain visible in the correct basket or recycling box, installed items appear on their fitting, and warmed dishes appear on the named appliance with steam. Object names stay hidden until hover, keyboard focus, or selection. On phones the supply shelf changes from ten columns to five so its objects remain large enough to tap.

Both illustrated room assets are now in the service worker shell, and the cache version is `lantern-alley-v20`. The offline regression check prevents either image from being omitted in a future update. Version 20 includes the placed-object visibility fix, caption-position correction, and phone shelf ordering for returning users.

Desktop visual verification found that the old towel and burnt bulb buttons were present and correctly mapped, but a legacy `.answer-workspace` width rule won the CSS cascade and collapsed their inner sprites to 0 by 0 pixels. A focused regression check now reproduces that specificity conflict before the override is added.

The illustrated-room override now has enough specificity to restore a real sprite box inside every occupied hotspot while keeping the hotspot's mapped size. This is intentionally scoped to `.inn-room-illustrated`; the schedule and dialogue layouts retain their existing answer-workspace rules.

The first browser reload still showed the collapsed objects because cache version 17 had already stored the pre-fix stylesheet. Inspection of the loaded CSS rules confirmed the new selector was absent. The cache was therefore advanced to version 18 rather than changing the renderer again.

Tap-to-place verification then moved both red cushions onto one mat and confirmed their shelf buttons disappeared. The focused mat's label appeared directly over the cushion, however, which added text back on top of the image. A regression check now requires hotspot captions to sit outside the object picture.

Hotspot captions now open just above their fixture instead of covering it; the wall light is the only exception and opens downward because it sits at the top edge. Names remain available on hover or keyboard focus without obscuring the answer image.

At a 390 by 844 phone viewport, the room scales to 331 by 221 and the shelf correctly becomes five columns, but the shelf begins below the first screen because the full Japanese room description is always expanded. New adaptive checks require that description to be an optional Japanese disclosure and require the phone shelf to precede the room; selecting an item then uses the existing automatic scroll to reveal its destination.

The room description is now collapsed under `部屋の様子`, and the phone layout places the five-column supply shelf before the room. The desktop layout keeps the approved room-first composition. On a phone, tapping an item immediately uses the existing `scrollIntoView` path to bring the illustrated destinations into view.

The existing Python artifact builder could not run on this machine because neither `python` nor `py` is installed. `build-artifact.mjs` now provides the same dependency-free inlining and 16 MB limit check through the Node runtime already used by the tests. The Python builder remains available for other environments.

The Node build produced an 8.75 MB `lantern-alley-artifact.html` with 74 local images inlined. A regression check now verifies that the illustrated room is present as image data, no `assets/inn/` path remains external, and the result stays below the artifact host's 16 MB limit.

Final verification: 82 automated tests pass. Desktop testing completed one arrange, one two-step towel replacement and one stove-based tea warming; each moved sprite disappeared from its prior location and appeared once at its destination. At 390 by 844, the shelf rendered in five columns before the room, the room measured 331 by 221, and selecting an item automatically scrolled 165 pixels to expose the destination hotspots.

### 2026-08-21 - Illustrated room mockup now uses recognizable physical objects (not implemented)

The first mockups still represented the room with abstract line icons and CSS shapes, so several destinations did not resemble a real towel rack, lamp, appliance, bed, or Japanese room. Version 3 replaces that placeholder scene with generated soft 3D ryokan artwork. It visibly includes the two mats, old towel and rack, laundry basket, recycling box, burnt-out bulb and light fixture, worn bedding, stove, microwave, four distinct cushions, fresh towel, new bulb, clean sheet, tea, soup, and rice. Text remains outside the room artwork; the picture is intended to become the interactive surface itself. This remains a mockup and has not changed the game source.

### 2026-08-21 - Illustrated room mockup revised after the latest behavior changes (not implemented)

The second visual mockup was checked against the newest handoff before presentation. It keeps the tap-first instruction visible outside the answer scene, preserves appliance names in Japanese, supports the explicitly requested two-step replacement action, assumes the new touch tolerance and no-penalty missed drops, and does not turn the real 手伝います / 手伝えません branch back into a right-or-wrong reply. The missing Kon preview image was also fixed. This remains a visual proposal; no game source or behavior was changed.

### 2026-08-21 - Declining Kon's offer is a real choice, not a wrong answer

The final encounter offered three replies (accept, ask when, refuse) and treated anything but acceptance as a mistake to retry. Refusing is a legitimate answer to 引き受けていただけませんか, so the branch is now real:

- Two replies only: 手伝います。 / 手伝えません。
- Declining plays a disappointed line from Kon, costs no heart, and returns the player to the map.
- The refusal is stored as `declined` in the stage progress.
- Coming back later is greeted with コン：「戻ってきてくれたんですね！とても嬉しいです。」 rather than the neutral resume line.

One bug surfaced while wiring it: **two render paths were setting the narration**, and the general location render overwrote the story-aware one, so the welcome-back line never appeared. Both now call one `stageNarrationFor()` helper, and the one-shot resume flags are cleared when the encounter advances rather than during render - the two paths were previously consuming each other's flag.

Verified end to end: declining gives the sad reply with 3/3 hearts intact and exits to the map; returning shows the warm greeting; accepting still completes the stage.

### 2026-08-21 - Illustrated room visual direction proposed (not implemented)

A visual mockup proposes replacing the answer area's repeated dashed button grid with an illustrated inn room. Kon's Japanese request becomes the strongest visual element, romaji stays optional, the always-visible English interaction instruction moves outside the answer scene, movable objects sit on a wooden shelf, and room destinations use recognizable pictures with labels appearing only on selection or focus. The proposal preserves the identical shared room and does not reveal which action the Japanese requested. This is a design proposal only; the game source has not yet been changed to match it.

### 2026-08-21 - The request names the appliance it requires

The room offers a コンロ and a 電子レンジ, and the engine rejects the wrong one, but the Japanese only said 温めてください. The learner had to work out which appliance suits tea versus rice - kitchen sense, not Japanese. Same flaw as the 代える bin step: a requirement the player must infer rather than read.

The appliance is now named, which also puts the で particle to work:

- お茶をコンロでもう一度温めてください。
- スープをコンロで温めてください。
- ごはんを電子レンジで温めてください。

A test enforces this generally: for every warm item, the Japanese must contain the word for the appliance its target dish requires. Adding a dish that needs an unstated appliance now fails the suite.

### 2026-08-21 - Objects sometimes refused to move on touch

Reported as "it doesn't move sometimes", which is the signature of an intermittent input bug rather than a broken mechanic. Two causes, both silent:

**The drag threshold was 6px.** A finger tap routinely slides further than that, so ordinary taps were being classified as drags. The threshold is now 16px for touch and pen, still 6px for a mouse, taken from `event.pointerType`.

**A drag that landed on nothing did nothing.** `dropped()` returned early on a null zone, so a mis-aimed drag gave no feedback at all and looked like the object was stuck. Releasing away from any destination, or back onto the zone the object already occupies, now selects the object instead - the tap-to-place flow simply continues, and it is not scored as a wrong answer.

Verified with synthetic touch events: a 10px jitter tap selects (previously did nothing), a genuine drag released over empty space picks the object up with no penalty, and the normal two-step swap still completes.

### 2026-08-21 - Zone captions uncovered, Entrance pacing, and 代える asks for both steps

Three problems from phone testing.

**Objects covered their zone's caption.** `.inn-placed-object` was `position:absolute` at the zone's top-right, so the icon sat on top of the label: タオル掛け rendered as "タオル…", and 照明 and ベッド were half-hidden. Placed objects now flow above the caption and the zone grows to fit both. Verified: all three captions render in full with no overlap and every object inside its zone.

**The Entrance talked over itself.** The speech-aware pacing added earlier only covered the inn's advance path. The Entrance tutorial still stepped on fixed 2,600 ms and 6,600 ms timers, and the clips run longer than that, so Kon was cut off twice before the player was even asked anything. The wait logic is now a shared `afterSpeech()` helper used by both the tutorial chain and `scheduleCorrectAdvance`, so a third caller cannot reintroduce the bug by copying the old pattern.

**代える hid half its task.** Binning the old towel was required but never asked for, so the player had to guess it from an English instruction line. Rather than automate the step away, the Japanese now names both actions: 古いタオルを洗濯かごに入れて、新しいタオルに代えてください。The order is part of what the sentence teaches instead of an unstated rule, which keeps the two-step meaning of 代える intact. Same for the bulb (回収箱) and sheet. Three clips re-rendered, three pruned.

### 2026-08-21 - Entering the alley goes straight to the Entrance

"Enter the Alley" opened the map, which asks a first-time player to choose a destination before anything has explained what the game is or how to answer. The Entrance is where Kon teaches both, so a player with no progress now lands there directly.

Returning players still get the map, which is the more useful landing screen once the tutorial is done. The switch is simply whether `state.visited.entrance` is set.

### 2026-08-21 - Wait for Kon to finish speaking before advancing

The encounter advanced on a fixed 1,100 ms timer after a correct answer, but Kon's spoken reply runs far longer than that. She was cut off mid-sentence and the next question loaded over her, which throws away the listening practice the reply exists to give.

Advancing now waits for the audio clip's `ended` event, then pauses 700 ms so the transition does not feel abrupt. When a line has no clip it polls `speechSynthesis.speaking` instead. A 20-second cap means a stalled or autoplay-blocked clip can never strand the learner.

One subtlety: the code deliberately does **not** check `clip.paused`. `play()` is asynchronous, so a clip that is about to start still reports paused at the moment the advance is scheduled, and checking it would fall straight back to the old fixed delay.

Measured after the fix: praise clip 9.12 s, audio ended at 10.48 s, advanced at 11.20 s - a 721 ms pause after speech. Previously it advanced at 1.10 s, roughly 8 seconds early.

**Kon's replies had no audio at all.** `collect-spoken-lines.js` gathered requests and narration but never `getKonResponse`, so praise and correction fell back to the device voice and Kon sounded like a different character mid-encounter. The collector now walks every success, retry and per-option reply: 62 lines, up from 40. A test asserts every Kon response has a clip.

### 2026-08-21 - Mobile: tap-to-place made visible, and the continue button pinned

Two problems reported from a real phone.

**Dragging still felt mandatory.** Tap-to-place had shipped, but the instruction read "Drag objects between the places shown" and never mentioned tapping. Worse, that text sat inside a collapsed `<details>`, so most players never opened it. A shortcut nobody is told about does not exist. The instruction is now a plain always-visible line leading with the easier path: "Tap an object, then tap where it goes. Dragging works too."

**The continue button was below the fold.** On a phone the answer room is taller than the screen, so the button after it required scrolling to find. Below 760px `.next-row` is now `position:sticky; bottom:0` with a fade behind it and a full-width target, respecting `env(safe-area-inset-bottom)` for notched phones. Desktop keeps it in normal flow.

Verified at 390x844: the instruction is visible without interaction, and the continue button pins to the viewport bottom at any scroll position with a 340x49 target. At 1366x768 it stays static.

### 2026-08-21 - Adaptive stage shell keeps the request beside the answer

The game screen was a 680px vertical stack, so learners often had to scroll past Kon's Japanese request before they could see all destinations, objects, or schedule controls. The screen now expands to 1100px and uses a 38/62 learning-context and answer-workspace split on wide displays.

Below 760px the regions stack, the complete Japanese request stays sticky for the full answer workspace, and the page uses one natural scroll rather than a nested answer pane. Screens 800px high or shorter reduce decorative padding and room height without shrinking Japanese text or touch targets. Object rooms, schedules, reply choices, and the Entrance tutorial each use the same shell with interaction-specific density.

The shared object room was compacted separately because its source objects were stretching destination rows and making the answer area taller than the viewport. Destination zones now use a denser adaptive grid, objects already located in the room are positioned without increasing row height, and the answer tray wraps with smaller gaps while preserving 48px controls.

Rendered checks verified scroll-free task layouts at 1366x768 and 1024x768. At 390x844 the layout stacks without horizontal overflow, and Kon's complete Japanese request remains fixed at the top while the learner scrolls through the answer room. The browser console was clean in a fresh standalone-artifact preview.

The title and map remain at their previous 680px width. The service-worker cache is `lantern-alley-v6`, and the standalone artifact was rebuilt.

### 2026-08-21 - Alley Entrance now uses the same neural voice

The Entrance tutorial was not included in audio generation, so its four lines fell back to the browser's device voice while Moonview Inn used `ja-JP-NanamiNeural`. `collect-spoken-lines.js` now walks the Entrance tutorial flow as well as the inn stage. Four matching clips were added, the offline cache was refreshed, and regression tests require both the generator and `audio-index.js` to cover every spoken Entrance line.

### 2026-08-21 - Tap-to-place, so mobile does not require long drags

On a phone the tray sits below the destinations, so answering meant dragging an object almost the full height of the screen, one-handed, while the page tried to scroll under the finger.

Now every movable object supports both:

- **Tap the object, then tap where it goes.** The object lifts, the destinations pulse, and the status line reads 置く場所を選んでください。Tapping the same object again deselects.
- **Dragging still works**, unchanged, for anyone who prefers it.

Two details that were easy to get wrong:

- A finished drag also emits a `click`. Without a guard that click would immediately re-select the object that was just placed, so `makeDraggable` sets `data-dragged` and the tap handler skips that one event.
- Worn items are rendered **inside** their source zone, not in the tray. The wiring therefore lives in `makeMovable()` shared by both, and the item's click uses `stopImmediatePropagation` so tapping it does not also fire the enclosing zone's drop handler.

This is also an accessibility win: the objects and zones are real `<button>`s, so the whole room is now operable by keyboard, which dragging never was.

Mobile layout was tightened at the same time. The `max-width:620px` rule had been *raising* `min-height` to 390px, which pushed destinations further off-screen; it now lets the room shrink to its content and reduces icon, padding and gap sizes.

Selecting an object also scrolls the destinations into view with `block:"nearest"`, which does nothing when they are already visible.

### 2026-08-21 - Two Japanese corrections before sharing

Found while reviewing whether the project was fit to share. Both were teaching errors, not style preferences.

**暖める to 温める.** 暖める is for air, rooms and bodies (部屋を暖める). Food and drink take 温める. The game was using 暖める for tea, rice and soup across four items and the rendered audio, teaching a collocation a native speaker would immediately flag. The word is replaced everywhere, including its 温まる near-miss, and the three affected clips were re-rendered.

**揃える now pairs with 揃う, not 整う.** The near-miss explanation presented 整う as the intransitive partner of 揃える, but 整う pairs with 整える. The item exists precisely to drill that transitive/intransitive distinction, so naming the wrong partner taught a false relationship in the worst possible place.

Two tests lock these in: no `暖` may appear anywhere in the stage data, and every near-miss must be the true intransitive partner of its target.

`generate-audio.py` now also prunes clips whose line no longer exists, so edited sentences do not leave stale audio behind to be cached forever. The re-run rendered 3 lines, kept 33, and pruned 3.

Still open for a native reviewer: `代える` is used for swapping a towel or a bulb, where `取り替える` is more idiomatic.

### 2026-08-21 - Pre-rendered neural audio replaces device speech synthesis

All 40 spoken lines are now MP3s rendered with `ja-JP-NanamiNeural` via `edge-tts` (free, no API key). `generate-audio.py` regenerates them; clips are named by a hash of the sentence, so re-running only renders lines that actually changed.

Why this mattered more than it sounds:

- **The Challenge phase is audio-only.** If the device has no Japanese voice, that phase was not degraded, it was unplayable. iOS Safari frequently has none and additionally requires a user gesture before `speechSynthesis` will make a sound.
- **Pronunciation is the product.** Device voices vary from decent to robotic; a language app cannot teach a pronunciation that changes per phone.

`speak()` now tries the clip first and falls back to `speechSynthesis` when a line has no clip, or when autoplay is blocked. Nothing breaks if a clip is missing.

`audio-index.js` assigns to `self`, not `window`, so `sw.js` can `importScripts()` the same file to build its pre-cache list. The audio paths therefore have one source of truth rather than being copied into the worker by hand. All 40 clips are cached; audio works offline.

**Generation needs network; playback never does.** Re-run `generate-audio.py` after editing any Japanese, then bump `CACHE_VERSION` in `sw.js`.

### 2026-08-21 - Installable as a PWA, plays offline

The game is now a Progressive Web App: it installs to a phone home screen, launches without browser chrome, and runs with no network.

- `manifest.webmanifest` declares standalone display, portrait, and the theme colour.
- `sw.js` pre-caches the 24-file app shell and serves cache-first, which suits a game that has no server to be fresher than.
- iOS ignores the manifest, so `apple-mobile-web-app-*` meta tags and an opaque `apple-touch-icon` are set separately.
- Icons are generated by `make-icons.py`, including **maskable** variants. Android crops icons to a circle; without a maskable version with a safe margin, the artwork gets its edges cut off.
- Registration is guarded on `location.protocol`, so opening `index.html` over `file://` still works, just without offline support.

**Verified by stopping the web server and reloading**: the page, styles, all three engines, the fox images and a playable encounter all came back from cache.

`pwa.test.mjs` guards the fragile part: `cache.addAll()` rejects if a single listed file 404s, which disables offline support silently. The test asserts every path in the shell list exists, every manifest icon exists, and every script tag in `index.html` is covered by the shell.

**Bump `CACHE_VERSION` in `sw.js` whenever a shell file changes**, or returning players keep the old build.

`build-artifact.py` strips the PWA wiring, since a sandboxed artifact cannot register a service worker or fetch sibling icons.

### 2026-08-21 - Split the monolith and externalized the images (groundwork for PWA/mobile)

Preparation for packaging the game as a web/mobile app. The single 1.2 MB `lantern-alley.html` is gone, replaced by `index.html` + `styles.css` + `app.js`.

Why each part mattered:

- **1084 KB of the HTML was four base64 Kon wave frames** inside the script. A browser cannot cache a data URI separately from the page, so every visit re-downloaded them. They are now `assets/kon/*.webp`, 36 KB total.
- **The fox poses were 1254px PNGs, about 2 MB each.** They render at 92px. The app was shipping roughly 18 MB of images no phone needs; they are now 320px WebP in `assets/fox/`, 69 KB for all nine. The full-size PNGs stay in `assets/fox-poses/` as masters.
- **CSS and JS were inline**, so any edit invalidated the whole file for returning visitors. Split out so they cache independently.
- **The page had no DOCTYPE, `<head>`, `<body>` or viewport meta.** Without `viewport` a phone renders it at desktop width and zooms out, which would have made every touch target unusably small.

Total payload: about 18 MB down to 276 KB. Git was initialized first, so each step is revertible.

`build-artifact.py` was rewritten to inline the split files, since the Claude Artifact cannot load sibling files. The artifact dropped from 1.26 MB to 0.31 MB.

### 2026-08-21 - Replacement actions now use real object locations

Used objects no longer begin loose in the answer tray or go into a generic bin. The old towel starts on the towel rack and goes to the laundry basket; the stained sheet starts on the bed and goes to laundry; the broken bulb starts in the light and goes to recycling. Each clean replacement then goes into the vacated location. Arrange requests now explicitly ask for two matching cushions on each mat, so grouping by colour, direction, or size matches the Japanese request.

### 2026-08-21 - Alley Entrance became the mechanics tutorial

Kon now greets the learner, explains that requests are answered through actions, then asks for a simple bow. The three actions are labeled in Japanese, while the How to interact instruction remains English. After success, Kon invites the learner to explore and the `路地を見る` button returns to the map so the next destination remains the learner's choice.

### 2026-08-21 - The learner becomes Kon's helper before work begins

The first Moonview Inn visit now opens with Kon welcoming the learner, explaining that one employee is absent, and asking for help while practising Japanese. The learner accepts with はい、手伝います before the first room task appears. This introduction is shown only before inn progress exists; later visits resume the established helper shift.

### 2026-08-21 - Japanese context remains visible on entry and resume

Challenge previously replaced Kon's story setup with a generic audio instruction. Resuming saved progress could therefore open directly on a request such as warming soup with no reason. Kon's Japanese situation setup now remains visible in every phase, and a resumed visit begins with a short Japanese welcome-back line. Only the How to interact guidance remains English.

### 2026-08-21 - Kon explains each request and Practice shows complete Japanese

Removed the artificial blanks from Practice, including the hidden 暖め stem. Kon now speaks before every Learn and Practice request, explains why the task matters in the current inn scene, and carries the learner through one continuous guest-service story. Challenge remains audio-only after its short situation setup.

### 2026-08-21 - Learn and Practice requests separated

Practice no longer repeats the five Learn requests. Each word now has two new Practice situations, while Learn keeps the ordered inn story. The phase is shown in its own badge instead of being mixed into the story title, and a Restart from Learn button clears only Moonview Inn lesson progress. The phase controls are hidden outside lesson locations.

### 2026-08-21 - The five Learn encounters became one story, and titles stopped naming the answer

Two problems. First, the scene header read "REPLACE THE TOWEL", "WARM THE TEA" and so on: the English verb was printed above the Japanese sentence, so the item gave itself away. Titles are now story beats - "At the washstand", "The tray has gone cold" - and a test asserts no title contains an action verb.

Second, the encounters were five unrelated vignettes with no thread between them, and the shared room read as an arbitrary pile of props. The Learn phase is now one evening-to-morning shift at the inn: a guest is due, you ready the room, they arrive, you serve them, next morning they ask to stay longer, and after they leave the innkeeper asks about tomorrow. Each narration refers back to the previous beat. The room description was rewritten as one coherent half-prepared guest room rather than a props list. A test checks the four time markers still appear in order.

Practice and Challenge shuffle their items, so a strict sequence is impossible there; their narrations stay situational but describe the same inn.

### 2026-08-21 - 引き受ける answered by the reply alone

The item used to ask 明日の案内を引き受けていただけませんか, then require the player to pick the map from map/keys/luggage and drag it to the lobby. A native speaker could not tell what was wanted: the sentence never names an object, so "案内 therefore map" is a guess, and the destination was arbitrary. 引き受ける is about taking a job on, so the reply now **is** the answer. Three spoken options: はい、引き受けます (correct), いいえ、行かないでください (the 引き止める near-miss, which triggers the specific explanation), and すみません、できません (a plain refusal). No object hunt, no destination.

### 2026-08-21 - Instruction and clue moved out of the answer area

Both panels rendered inside the room box, so the shoji screen showed through their translucent backgrounds and collided with the text. They now sit above the room as opaque panels, leaving the room to contain only things the player acts on.

### 2026-08-21 - One shared room, so the verb decides the action

Previously each encounter had its own scene: cushions for 揃える, worn items for 代える, a stove for 暖める. That meant the scene announced the verb before the player read anything, so the Practice blank tested nothing and the Challenge audio was partly redundant. The three object-moving encounters now render one identical room; only the sentence's verb selects the correct action. A wrong-verb action is rejected with specific feedback.

### 2026-08-21 - Dead code removed

Removed `INN_VISUALS`, five unreachable branches in `performInnAction`, the `innSelectedItem` and `warmTimer` variables, the `BADGE_GLYPHS` and icon-badge system, five unused icons, the `inn-reference` block, and about 20 orphaned CSS rules. All were verified unreachable first. `iconButton` lost two arguments that every call site passed identically.

### 2026-08-20 - 暖める reduced to a single action

Warming used a press-and-hold stove control with a temperature band. That tested reaction timing, not Japanese. Placing the named dish on the stove is now the entire answer.

### 2026-08-20 - Scenes stopped stating their own answer

The arrange clue used to read "the reference alcove pairs each Moon or Sun tagged pillow with the futon carrying the same tag", which is a rulebook: the puzzle was solvable without reading Japanese. Replaced with cushions varying on three crossed attributes, where the sentence names which attribute to unify. The same principle was applied to the other four words: every scene now offers several plausible objects and the sentence names the target. The 調整 constraint bands and the English restatement of the times were removed for the same reason.

### 2026-08-20 - Wrong-answer buttons removed from four mechanics

A clickable distractor next to a discriminating action lets the player answer without engaging the action. Removed from 揃える, 代える, 暖める and 調整, whose actions are themselves the assessment. Kept for 引き受ける, where the answer genuinely is one simple binary choice.

### 2026-08-20 - Drag-and-drop, icon-only labels

Answers became draggable objects moved onto zones in the room, and visible captions were reduced to short Japanese words with full descriptions kept in `aria-label`. Reason: too much English text on screen, and the previous item/target pairs read as a matching puzzle.

### 2026-08-20 - UTF-8 charset fix

The old single-file `lantern-alley.html` had no `<meta charset>`, so browsers decoded the Japanese and emoji as Latin-1 and rendered mojibake. Added as the first line of the file.

### 2026-08-20 - Okurigana corrections

`引受る` corrected to `引き受ける` and `代る` to `代わる` throughout. The old spellings were inconsistent with the game's own example sentences. This also fixed a silent bug: the Practice fill-in-blank stem map never matched, so that word's prompt was never actually blanked.

## 10. Known limitations

- **No audio on four of the five places.** 506 of the 620 spoken lines have no clip. Listening items there are read rather than heard, and on a device with no Japanese voice they are silent. This is a deliberate, recorded decision, not an oversight - see section 0.
- **The five-second items are tighter without audio.** At the Inn the clip plays before the clock starts, so the request has already been heard. Elsewhere the learner reads it cold.
- **The Japanese has not been reviewed.** 200 questions, five story arcs and every piece of Kon's dialogue were authored in this project and have not been checked by a native speaker. The owner reviews after authoring.
- **Two test controls still ship.** **Skip to next day** and **Preview Episode** are dashed buttons in the live build.
- **The Artifact cannot carry the finished game.** With audio it is about 31 MB against a 16 MB limit.
- **Catalog provenance is incomplete.** The exact OpenJLPT commit used for the local copies was not recorded.
- **No grammar or kanji catalog is approved**, so the project may claim coverage only of its named vocabulary catalog.
- **The Inn is entered through its old three-day stage**, while the four newer places drop straight into their first episode. The two entry paths are different by history rather than by design.

## 11. Recommended next work

In the order that gets the most for the least:

1. **Native review of the Japanese.** Everything else is cheap to change; this is the thing only the owner can do. `generate-audio.py` hashes its input, so corrections cost only the lines that changed.
2. **Decide the delivery surface.** The Artifact cannot hold the finished game. Until that is settled the audio run cannot be spent well.
3. **Generate the audio** once the surface is known. `collect-spoken-lines.js` already walks every stage, so the run needs no code change.
4. **Remove or flag the two test controls.** Left until last on purpose: every step above is verified through them. Note that they are currently the only quick way into a later episode without replaying what comes before, so removing them should come with a proper way to resume a place.
5. **Give the four newer places their scene art.** They render on the shared workspace today. Nothing depends on this; it is the visible half of the work.
6. **Reconcile the Inn's two entry paths** so all five places are entered the same way.

## 12. Handoff rules for the next developer or AI session

### Working agreement with the owner

- **Commit verified fixes without asking.** The owner asked for this directly. A fix is committable once its tests pass and, where it is visible, it has been checked in the browser. Write the message about the cause, not the symptom.
- **Ask before `git push`, before publishing the Artifact, and before anything that is not a fix** - new features, large refactors, deleting work.
- **Anything that leaves the machine is approval-gated.** Audio generation sends Japanese text to Microsoft Edge TTS. Ask, every time.
- **The owner is a native Japanese speaker and reviews after authoring, not during.** Do not gate work on review and do not raise "needs native review" as a blocker. Author it, then present it. Flag specific word choices worth a second opinion as questions in the summary.
- **Flag a hard blocker before building a substitute**, not after.

### Design rules

- Never let the scene, a label, or the object set reveal the answer. See section 3.
- Practice must not display the target word or name the required English action.
- A wrong answer explains the choice the learner actually made. "Not that one" teaches nothing.
- Every harder item carries exactly one relevant close N2 near-miss.
- A question must be answerable from what it shows. Two defensible answers is a broken item, not a hard one - every condition the answer turns on has to be written down.
- English appears only in the how-to line and the explanation notes. Never in answer content.

### Mechanical rules, each of which exists because it was broken once

- **Run `node research/balance-answers.mjs` after authoring questions.** By hand, the correct answer lands first far too often.
- **Bump `CACHE_VERSION` in `sw.js`** (and the matching assertion in `pwa.test.mjs`) on every shipped change.
- **Verify through the built artifact, not the dev server.** The dev server serves stale files.
- **Prefer a test that renders over a test that matches source text.** `walkthrough.test.mjs` exists because a source-text suite passed while the game crashed.
- **Check that a catalog id exists before using it as a target.** Eleven invented ids reached a draft in one sitting.
- **Keep this file current.** On every change, update the affected sections and add a section 9 entry stating the reason, not just the edit.
- Remember that editing the local file does not update the desktop shortcut. See section 8.
- Do not claim full N2 coverage. The project covers its own named vocabulary catalog.

## 13. Sharing checklist

1. Include the entire `IJLG` folder.
2. Keep the relative paths under `assets`, `research` and `docs` unchanged.
3. Ask the recipient to open `PROJECT-HANDOFF.md` first.
4. Ask them to run the automated test command before making changes.
5. Remind them that browser progress is separate from the folder.
