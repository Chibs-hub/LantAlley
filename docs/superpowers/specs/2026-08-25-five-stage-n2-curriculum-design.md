# Five-Stage N2 Curriculum Design

Date: 2026-08-25
Status: Approved direction, planning only

## 1. Product brief

- User: an intermediate Japanese learner who has completed the Alley Entrance tutorial.
- Job: learn and retain practical N2 Japanese through a coherent story without reading crowded screens or repeating one interaction format.
- Current behavior: Moonview Inn teaches five verbs through Learn, Practice, Challenge and focused review. It does not systematically cover grammar, kanji, reading or the official listening question families.
- Desired outcome: five connected locations cover N2 across the game - every curated N2 vocabulary item is tested at least once - while teaching high-value language deeply through story and repeatedly recovering weak knowledge.
- Success signal: the learner can finish all five locations, answer delayed reviews, and see measurable seen, tested and mastered coverage by skill.
- Non-goals: claiming an official exhaustive N2 word list, reproducing copyrighted JLPT questions, or turning every vocabulary item into a drag interaction.
- Object: a curriculum item, question, episode, stage, mistake record or review record.
- Action and consequence: answering updates item knowledge; a correct answer clears the current attempt, while mastery requires delayed retrieval. Resetting progress is the only destructive action.
- Permissions: all content is local; no account or permission state exists.
- Open decisions: exact third-party grammar and kanji catalogs require a separately approved source before content authoring.

## 2. Verified scope and limits

The official JLPT publishes test areas and question purposes, but not a fixed post-2010 vocabulary, grammar or kanji list. The local OpenJLPT N2 file contains 1,793 vocabulary records, of which 1,792 survive curation; an English-meaning filter finds 384 verb-like records. The data is internally clean, but measurement showed it is not the N2 set: 11 of 29 probed common N2 words are absent from all four local files, its level labels place much N2-relevant vocabulary in n3, and it contains 暖める without 温める. It must therefore be curated, combined with n3 and supplemented before it becomes a product contract.

The game will say "N2-focused", name its source and report its own catalog size. It will not say that its catalog is the official N2 list, and after the measurements above that statement is a finding rather than a precaution.

## 3. Coverage model

**The goal is to cover N2 across the game.** An earlier revision cut the course to 200 tested targets to fit the delivery format. That inverted the priority: 200 targets is 11% of the vocabulary file, so the course would have been comfortably deliverable and would not have met its own purpose. Delivery bends; coverage does not.

### 3.1 What the local source actually contains

A curation pass was run against the local files before writing these targets. Results, measured:

| File | Records | Unique words |
| --- | --- | --- |
| `n2.json` | 1,793 | 1,793 |
| `n3.json` | 1,784 | 1,784 |
| n2 + n3 combined | 3,577 | no overlap between the two |

**The data is clean.** Curating `n2.json` yields 1,792 testable items out of 1,793 - a single malformed record, `あげる (=やる)`. The earlier claim that 295 records lack a reading was misleading: 294 of those are kana-only headwords that are their own reading. Measured further: 0 duplicate words, 0 headwords carrying annotation or whitespace noise, 0 kanji appearing inside a reading field, and 1,537 records with an example sentence.

**Cloze generation is fully viable.** All 1,537 example sentences contain their headword exactly, with no conjugated-stem mismatches. Tier 2's most valuable card type therefore needs no fuzzy matching.

**But the source is not the N2 vocabulary set, in either direction.**

- It has real gaps. A 29-item probe of common N2 vocabulary found 11 absent from all four local files, including `引き受ける`, `取り組む`, `落ち着く`, `促す`, `把握` and `温める`.
- Three of the game's five current Inn targets are absent: `温める`, `引き受ける` and `取り替える` - the last appears only as N4.
- Its level labels do not match the exam. `影響`, `状況`, `対象`, `傾向`, `需要`, `供給` and `検討` are all labelled n3, and `割合` n4, though an N2 learner needs them. A large part of what N2 tests sits in `n3.json`.

**One gap is actively dangerous.** The source contains `暖める` but not `温める`. This project already fixed exactly that error once: `暖める` is for air and rooms, `温める` for food and drink, and the Inn teaches reheating tea. Covering the source faithfully would reintroduce a bug the game has already corrected.

Consequences for the coverage claim:

1. The base catalog is **OpenJLPT n2 plus n3**, 3,577 unique words, 3,304 with example sentences - not `n2.json` alone.
2. A **project supplement** holds items the source omits but the game needs, authored with the same fields and marked with `source: "project"` so they are never mistaken for sourced data. The five Inn targets seed it.
3. The game claims coverage **of its own named catalog**, and reports the catalog's provenance. It does not claim to cover the JLPT N2 vocabulary list, because no reference list exists locally to verify that against. Acquiring one is an open decision.

Grammar and kanji have no source at all and cannot be claimed until one is approved.

Catalog size is a shell cost, not a per-stage one: the cleaned `n2.json` is 0.69 MB, so an n2+n3 catalog is roughly 3.8 MB raw before trimming to one example per item.

### 3.2 Two tiers, because cost per item differs by two orders of magnitude

The reason the earlier draft could not reach coverage is that it had one way to teach an item: an authored, illustrated, natively reviewed, voiced question. At roughly three audio clips and bespoke authoring per question, that method cannot scale to 1,793 items and should not try.

**Tier 1 - Story episodes.** Five locations, four episodes each, ten questions per episode: 200 authored questions carrying 200 primary targets. Illustrated scenes, Kon's dialogue, pre-rendered Nanami audio, native review. This is where high-value language is taught deeply and where the story lives.

**Tier 2 - Catalog practice.** Cards generated from the curated catalog, covering the remaining vocabulary. Three card types, all derivable from data the source already has: reading from written form, meaning from word, and cloze from the record's own example sentence (1,537 records supply one). Text-only, no bespoke artwork, no pre-rendered audio. Generated, not authored.

Tier 2 is what makes coverage reachable. Its cost per item is close to zero once the catalog is curated, because the work moves from authoring 1,600 questions to curating one dataset.

### 3.3 Coverage targets

- **Every item in the project catalog is a primary target at least once**, in Tier 1 or Tier 2. The catalog is curated OpenJLPT n2 plus n3 plus the project supplement. This is the coverage claim, and `getCoverage` reports missing IDs rather than a percentage.
- Roughly 200 high-value items, including the 384 verb-like records in `n2.json` after curation, are taught in Tier 1 story episodes. Supplement items the game already teaches, such as `温める` and `引き受ける`, are Tier 1 targets by default.
- The remainder are covered by Tier 2 catalog practice.
- Mastery for any item, in either tier, still requires delayed retrieval as defined in section 8.
- Grammar and kanji targets are specified but marked unmet until a source is approved.

### 3.4 Tier 1 question composition

A question has exactly one **primary target**: the item its correctness is judged on. A question may additionally carry **slot credit** for material it forces the learner to process but does not judge separately - most often a kanji or orthography question presenting several readings at once. Slot credit is capped at three per question and can never decide correctness.

This distinction is what keeps the counts consistent. Without it, per-stage targets exceed the number of questions in the stage, which is how the previous draft became unsatisfiable.

Per stage, across the 40 Tier 1 questions:

| Role | Questions | Notes |
| --- | --- | --- |
| Verb primary targets | 12 | high-value action verbs |
| Other vocabulary primary targets | 16 | nouns, adjectives, adverbs, expressions |
| Grammar primary targets | 6 | form selection or sentence composition |
| Kanji or orthography primary targets | 6 | up to 3 readings each as slot credit |
| **Total** | **40** | one primary target per question, exactly |

Tier 1 course totals: 60 verbs, 80 other vocabulary concepts, 30 grammar targets and 30 kanji questions carrying up to 90 reading slots. Every remaining curated item is covered by Tier 2.

Tier 2 cards carry one primary target each and no slot credit.

### 3.5 Coverage is distributed, not bolted on

The catalog is partitioned across the five locations by theme. At an n2+n3 base of 3,577 words plus supplements, each location owns roughly 700 items. A location's practice layer draws only from its own partition plus items already due for review. Practice is reached from inside the location, framed as Kon's 稽古 rather than a separate flashcard mode, so the game covers N2 throughout rather than in an appendix.

A location is complete when its four episodes are complete, its correction queue is empty, and its partition has been seen. Testing every item in a partition is not required to finish a location; it is required to finish the course.

### 3.6 Delivery budget

Measured: 59 clips, 2.63 MB, averaging 45.7 KB per clip. The standalone artifact is 12.92 MB against a hard 16 MB ceiling with one stage inlined.

The two-tier split is what keeps this tractable. **Only Tier 1 story dialogue and listening-family questions get pre-rendered audio.** Tier 2 has no pre-rendered audio and uses the existing device speech-synthesis fallback where a reading is wanted. Projected: roughly 150 clips and 6.9 MB per stage, about 33 MB for the course, unchanged by the growth in coverage.

Three delivery constraints follow:

- **The standalone artifact cannot hold the course.** It ships as a demo: the Entrance plus Inn Episode 1. The full course is delivered through the local files and the PWA. The build must fail above 15 MB rather than emit an unpublishable file.
- **The service worker must not precache everything.** `cache.addAll` is all-or-nothing. The shell precaches the Entrance and app skeleton; each stage caches its own audio and artwork on entry. The curated catalog is data, not media, and ships in the shell.
- **Audio generates per stage**, so a content change in one location never regenerates the other four.

## 4. World and stage order

The annual Lantern Festival connects every location.

1. Moonview Inn: visitors arrive and the inn needs help.
2. Lantern Market: merchants prepare and operate the festival market.
3. Evening Moon Tea House: residents and visitors meet, make arrangements and resolve misunderstandings.
4. Alley Station: transport disruption threatens the festival schedule.
5. Lantern Keeper Shrine: the community completes the ceremony and the story concludes.

Moonview Inn, Lantern Market, Evening Moon Tea House and Alley Station can be chosen in any order after the Entrance. Lantern Keeper Shrine unlocks after those four location stages are complete. This preserves map choice while giving the story one conclusion (`rule/preserve-mental-model`).

Each opening uses Kon in the illustrated environment, not a detached lesson menu. Kon explains why the learner is present before asking for help. Each episode ending changes the location story and returns to the location episode path. A completed location returns to the open map.

## 5. Stage episode plans

Each stage has four episodes. The earlier draft listed ten per stage; the six dropped per stage are recorded in section 15 as the first candidates if the course is extended after the delivery budget is re-checked.

Episodes were selected so each stage still covers a concrete-action family, an information or reading family, a listening family and an integrated finale.

### 5.1 Moonview Inn

Story purpose: serve festival visitors across several busy days while learning household, service and responsibility language.

| Episode | Story problem | Main language function | Dominant question family |
| --- | --- | --- | --- |
| 1. First guests | Prepare rooms before a family arrives | requests and concrete transitive verbs | action comprehension |
| 2. Reservations | Compare names, dates and room records | confirmation and matching information | information retrieval |
| 3. Complaints | Hear a problem, apologize and offer a remedy | reason, concession and apology | quick response |
| 4. Festival morning | Complete service and send guests onward | summary, gratitude and handover | thematic comprehension |

Existing targets `揃える`, `代える`, `温める`, `調整` and `引き受ける` belong to Episode 1. Five primary targets in a ten-question episode is already dense; if authoring finds it crowded, `調整` moves to Episode 4, where scheduling language belongs anyway. Native review must settle whether specific replacement requests should teach `取り替える` while retaining `代える` in a contrast item.

**Story conflict resolved.** The Inn had been framed as a single three-day arc, 「三日間、宿の仕事を手伝ってくれませんか」, while this spec gives each episode its own three-day arc - four episodes would make twelve days and that line false from Episode 2 onward. The invitation is now open-ended and tied to the Lantern Festival, which is already the frame connecting all five locations: 「お祭りの間、宿の仕事を手伝ってくれませんか？」. Episode 1 still covers the first three days, so the per-episode day labels stay true. A test asserts the invitation never promises a fixed number of days.

### 5.2 Lantern Market

Story purpose: help merchants prepare supplies, serve customers and keep the festival market operating fairly.

| Episode | Story problem | Main language function | Dominant question family |
| --- | --- | --- | --- |
| 1. Stall setup | Arrange signs, stock and walking space | placement and preparation | action comprehension |
| 2. Prices | Explain totals, change and discounts | calculation language and conditions | information retrieval |
| 3. Deliveries | Respond to a delayed or incomplete shipment | cause, result and scheduling | task listening |
| 4. Night market | Balance crowds, stock and announcements | prioritization and integrated decisions | integrated comprehension |

### 5.3 Evening Moon Tea House

Story purpose: help with service and community conversations where intention, politeness and inference matter more than visible actions.

| Episode | Story problem | Main language function | Dominant question family |
| --- | --- | --- | --- |
| 1. Orders | Confirm several similar orders | counters, modifiers and confirmation | key-point listening |
| 2. Polite requests | Choose wording appropriate to relationship | register and indirect requests | usage |
| 3. Conversation | Identify what a speaker implies rather than states | intention and inference | general-outline listening |
| 4. Community meeting | Summarize proposals and select an agreed plan | argument structure and synthesis | integrated comprehension |

### 5.4 Alley Station

Story purpose: keep visitors moving during disruption by reading schedules, listening to announcements and choosing appropriate actions.

| Episode | Story problem | Main language function | Dominant question family |
| --- | --- | --- | --- |
| 1. Tickets | Match destination, fare and ticket condition | counters and transaction language | information retrieval |
| 2. Announcements | Extract the change, reason and next action | key points and outline | announcement listening |
| 3. Safety | Interpret warnings and prohibited actions | obligation and prohibition | text grammar |
| 4. Festival transport | Coordinate the final visitor flow | summary, priority and handover | thematic comprehension |

### 5.5 Lantern Keeper Shrine

Story purpose: finish the festival through community work, longer texts and abstract judgments built on language from every earlier location.

| Episode | Story problem | Main language function | Dominant question family |
| --- | --- | --- | --- |
| 1. Approach | Learn the site rules without assuming cultural knowledge | notices and respectful behavior | short reading |
| 2. Roles | Assign work according to ability and timing | suitability and responsibility | task listening |
| 3. Community decision | Compare proposals and their consequences | argument and concession | integrated reading |
| 4. Festival conclusion | Summarize what changed across Lantern Alley | reflection and synthesis | final integrated challenge |

The final episode ends with an open map. Kon does not order the learner to a new destination after the course is complete.

## 6. Three-day question structure

Every episode uses the same predictable shell while varying the cognitive task.

### Day 1: Learn

1. Kanji or orthography: connect form, reading and meaning.
2. Vocabulary in context: choose the natural word or Japanese paraphrase.
3. Guided application: perform one meaningful action, arrange sentence chunks, or choose a natural reply.

Kon explains the situation before Question 1. Full Japanese is visible. Optional support may reveal reading or a short meaning after the learner asks; it is not displayed as a wall of text.

### Day 2: Practice

4. Delayed warm-up: retrieve one due item from an earlier episode.
5. Grammar: select a form or arrange a sentence.
6. Reading: answer from a short notice, message, schedule or passage.

The setting changes so the learner cannot answer from the remembered picture. Correct answers receive short contextual confirmation. Wrong answers explain the distinction and preserve the prompt.

### Day 3: Challenge

7. Listening task: choose what must happen next.
8. Listening key point or intention: identify the speaker's purpose.
9. Quick response: choose a natural Japanese reply.
10. Integrated task: combine text or audio with a schedule, notice or scene.

Challenge hides romaji, English meaning and hints. It may show Japanese text only where the official task type is reading rather than listening.

## 7. Question and answer contract

Every question record has one primary learning target. Supporting words can be logged as exposures but cannot determine correctness.

```js
{
  id: "inn-e01-d1-q03",
  stageKey: "home-inn",
  episode: 1,
  day: 1,
  skill: "vocabulary-action",
  targets: ["代える"],
  exposures: ["切れる", "回収箱", "電球"],
  sourceNote: "月見宿・第一話「最初のお客様」",
  story: "コンの日本語による状況説明",
  prompt: { jp: "切れた電球を回収箱に入れて、新しい電球に代えてください。", audio: true },
  answer: { type: "ordered-action", value: ["old-bulb:recycle", "new-bulb:fitting"] },
  feedback: {
    correct: "新しい電球に代わり、廊下が明るくなりました。",
    incorrect: "先に切れた電球を外して回収箱に入れる必要があります。"
  },
  repair: {
    prompt: "「新しい電球に代える」に一番近い意味はどれですか。",
    options: ["別の電球に交換する", "電球を温める", "電球の明るさを調整する"],
    correctIndex: 0
  }
}
```

The exact replacement verb remains subject to the native review noted above.

### Answer types

| Type | Prompt | Correct answer | Used for |
| --- | --- | --- | --- |
| `single-choice` | Japanese sentence or question | one visible Japanese option | vocabulary, grammar, listening |
| `image-choice` | Japanese audio or sentence | one image | concrete nouns and actions |
| `direct-action` | Japanese request | one decisive scene action | concrete verbs |
| `ordered-action` | Japanese request with required sequence | exact necessary steps only | replacement and procedural verbs |
| `sentence-order` | Japanese chunks | one grammatical order | sentence composition |
| `evidence-choice` | notice or passage | answer supported by visible evidence | reading |
| `information-entry` | schedule, form or record | a time, number or label chosen from the visible record | information retrieval |
| `quick-response` | spoken Japanese line | natural Japanese reply | listening response |

No answer type requires typing Japanese. The owner has repeatedly cut on-screen text, and a Japanese IME on a phone is a mechanical obstacle unrelated to comprehension. `information-entry` selects from values already visible in the schedule or record; free text is not an answer type.

Two or three static choices remain visible rather than hidden in a select (`rule/control-matches-cardinality`). Each screen has one primary answer action (`rule/one-primary-action`). Every control is keyboard-operable and named (`rule/accessible-name-required`, `rule/keyboard-complete-flow`).

### Copy rules

- Kon's story, questions, answers and feedback are Japanese.
- Only How to interact is English.
- Action labels in the Entrance tutorial remain English because they teach mechanics rather than answer lesson content.
- Feedback never uses only a check mark. Kon confirms what happened or explains the distinction (`rule/success-state-specific`, `rule/error-states-recovery`).
- A question never states the answer rule outside Japanese lesson content.
- A scene cannot make the answer obvious without understanding the prompt.
- Wrong options must be plausible misconceptions, not absurd distractors.
- Declining a genuine social offer is not treated as linguistically wrong unless the prompt explicitly requires accepting a duty.

## 8. Correction and review logic

### Stage correction: 間違い直し

- Starts after Day 3 Challenge when at least one question is unresolved.
- The time budget is per question type, not a flat five seconds. Five seconds is enough to recognize a single word but not to read three N2 options after audio. Default 8 seconds; 5 seconds for single-word recognition; 12 seconds where the repair prompt is a full sentence. The budget is data on the question, so it can be tuned without code changes.
- Uses simple quiz cards, not the full action scene.
- Only missed atomic targets appear. Long reading and integrated tasks generate a short repair question about the specific misconception.
- The timer starts only after the full prompt is visible and any required audio has ended, and pauses while the document is hidden.
- Correct answers leave the queue immediately.
- Wrong answers and timeouts move to the queue end.
- The loop continues until the queue is empty.
- Closing the game saves the exact queue and resumes it later.
- A timeout records unresolved fluency, not a different misconception.
- Completing the loop means "cleared today," not mastered.

### Delayed review

Correct material returns approximately 1, 3, 7 and 14 days after first success. One due item can replace Day 2 Question 4. A learner who returns late receives the oldest due item first. Mastery requires two delayed correct answers, including one at least seven days after first success.

### Global Mistake Review

- Opens from one map destination named `記憶の灯` after the first recorded mistake.
- Mixes unresolved mistakes from every location; there is no stage filter.
- Randomization avoids consecutive questions with the same target when alternatives exist.
- A small source note says where the language was seen, such as `月見宿・第二話「予約帳」`.
- Correct answers remove the current mistake record.
- Wrong answers and timeouts return to the end.
- Empty state: Kon says all recorded mistakes are cleared and offers one return-to-map action (`rule/empty-state-action`).
- Previously correct but due material appears in episode warm-ups, not in Mistake Review. This preserves the owner's requirement that Mistake Review remain mistake-only.

## 9. Reachable states

The stage shell must cover these states (`rule/cover-reachable-states`):

- New episode introduction.
- Speaking and partially revealed dialogue.
- Full dialogue ready to advance.
- Question waiting for an answer and not skippable.
- Correct feedback.
- Incorrect feedback with recovery.
- Timed correction ready, running, correct, wrong and timeout.
- Saved correction queue resumed.
- No mistakes, some mistakes and all mistakes cleared.
- Audio loading, missing audio fallback and playback failure.
- Learner declines a genuine social offer and leaves the location, then returns and is welcomed back.
- Catalog practice: partition not started, in progress, all items seen, and all items tested.
- Catalog practice card with a missing reading or malformed source record, which must be skipped and reported rather than shown.
- Episode complete, location complete and final course complete.
- Wide desktop, compact mobile, long Japanese text and enlarged system text.

The learner's answer and queue survive recoverable failures (`rule/preserve-user-input`).

## 10. Visual and interaction direction

- Reuse the Alley Entrance cinematic composition: illustrated location, large Kon integrated into the scene, separate dialogue panel and separate answer area.
- Keep stage/day/episode progress compact at the top.
- Show only the material needed for the current question.
- On desktop, context and answer can sit side by side when both remain readable.
- On mobile, dialogue stays visible while the answer area stacks below; no essential content requires horizontal scrolling.
- Timed correction removes the large scene and uses a focused quiz panel with one visible timer.
- Global Mistake Review uses the same panel and a small source note, not five stage columns.
- Background click keeps the existing finish-speech then advance behavior. Answer controls never also advance dialogue.

Visual execution belongs to a later `ui-design` pass. This document decides states and behavior only.

## 11. Curriculum data and validation

Every catalog item receives:

- canonical spelling and reading;
- type: verb, noun, adjective, adverb, expression, grammar or kanji;
- meanings and usage notes;
- source and source license;
- reviewed status;
- aliases or orthographic variants;
- active-test priority;
- stage and episode assignments;
- question IDs where it is primary;
- dialogue, passage and feedback IDs where it is exposed.

Build-time validation fails when:

- a primary target is not reviewed;
- a question has no correct answer or more than one correct answer;
- answer data references an object absent from its scene;
- Japanese dialogue has no audio entry after generation;
- a core active target has no delayed-review form;
- a cleaned verb has no exposure assignment by the Shrine finale;
- a question contains English outside How to interact;
- two questions reuse the same prompt and answer in different phases;
- a timed repair item is a long reading or integrated task.

**Review policy.** The owner is a native speaker and reviews the Japanese after a stage is authored, not before each clip. Authoring therefore proceeds without a review gate, and audio is generated for review as well as for play, since hearing a line catches unnatural phrasing that reading it does not.

The cost of reviewing late is that corrections regenerate the affected clips. That is cheap: `generate-audio.py` names files by a hash of the text, so only changed lines are re-rendered and stale ones are pruned.

`reviewed` stays false on every catalog item until the owner has actually passed it, so the flag keeps meaning something. Review records the decision rather than silently changing source data.

## 12. Progress and scoring

Progress stores stage, episode, day, question, correction queue and per-item history. Each item moves through:

1. `unseen`
2. `seen`
3. `tested`
4. `cleared-today`
5. `mastered`

Stage completion requires every episode complete and its immediate correction queue empty. A medal reports stage performance but never replaces the item states. Gold requires the location final Challenge plus no unresolved mistakes; mastery coverage is reported separately because it depends on delayed time.

Progress also stores whether the learner declined a location offer, so the welcome-back reply survives a reload. Existing `lanternAlley.v2` progress migrates into the first Inn episode without deleting the learner's medal, completed work or decline state (`rule/preserve-mental-model`).

## 13. Acceptance criteria

- Every curated N2 vocabulary item is a primary target at least once across Tier 1 and Tier 2, and the coverage report names any missing IDs.
- The catalog is curated before use: no item is testable while it lacks a reading or is marked malformed.
- Each location owns a catalog partition reachable from inside that location.
- Grammar and kanji coverage are reported as unmet until an approved source exists, and the game never claims them.
- All five stages and twenty episodes follow one validated content contract.
- Every stage has a coherent opening, four episode arcs and a location ending.
- Each episode contains exactly 3 Learn, 3 Practice and 4 Challenge questions.
- Every question has exactly one primary target; slot credit never decides correctness and never exceeds three per question.
- Per stage, Tier 1: 12 verb, 16 other vocabulary, 6 grammar and 6 kanji primary targets, totalling exactly the 40 authored questions in the stage.
- Tier 2 cards are generated from the curated catalog, never hand-authored, and carry no pre-rendered audio.
- Every official N2 test item family appears in the coverage report.
- Every valid reviewed verb in the cleaned catalog is a Tier 1 primary target or exposure before final completion.
- At least 30 reading and 60 listening tasks across the course.
- Stage correction repeats only mistakes until all are correct, using the per-type time budget.
- Global Mistake Review randomizes all-stage mistakes and shows a source note.
- Delayed review returns correct items at expanding intervals.
- Japanese is used everywhere except How to interact and Entrance mechanic labels. No answer type requires typing Japanese.
- Every answer receives contextual Japanese feedback from Kon.
- The full flow is keyboard-completable and responsive at 1280x720, 390x844 and 360x640.
- The service worker precaches only the Entrance and app skeleton; each stage caches its own audio and artwork on entry, and an offline reload of a visited stage works.
- The standalone artifact builds under 15 MB as an Entrance plus Inn Episode 1 demo, and the build fails loudly rather than emitting an oversized file.

Explicitly not claimed: that the catalog is the official N2 list, or that finishing the course produces N2 mastery.

## 14. Product-design traceability

- Preserve the open map and current location context: `rule/preserve-mental-model`.
- Use the smallest question surface that tests the target: `rule/smallest-intervention`.
- Keep two or three choices visible: `rule/control-matches-cardinality`.
- One answer action per question: `rule/one-primary-action`.
- Cover correction, timeout, resume, empty and audio-failure states: `rule/cover-reachable-states`.
- Keep answers and progress after recoverable failure: `rule/preserve-user-input`.
- Require named, keyboard-operable controls: `rule/accessible-name-required`, `rule/keyboard-complete-flow`.

Coverage gap: no product-design rule governs pedagogical spacing or curriculum completeness. Those decisions are based on the approved learning method and must be verified by curriculum tests and delayed-retention data.

## 15. Deferred episodes and open decisions

### Deferred episodes

Cut from the ten-per-stage draft to fit the delivery budget. These are the first candidates if the course is extended, and the budget in section 3.2 must be re-checked before any are added.

- Moonview Inn: Check-in, Meals, Housekeeping, Timetables, Staff handover, Storm night.
- Lantern Market: Inventory, Product choice, Customer requests, Lost property, Advertising, Receipts.
- Evening Moon Tea House: Welcome, Preparation, Reservations, Opinions, Misunderstanding, Invitations.
- Alley Station: Platforms, Timetables, Transfers, Lost item, Assistance, Weather disruption.
- Lantern Keeper Shrine: Decorations, History, Records, Volunteers, Ceremony, Final lantern.

Housekeeping is the most valuable deferral to reverse: it carries the transitive/intransitive contrasts that N2 tests heavily.

### Open decisions

These block authoring, not planning. Each needs an owner decision.

1. ~~Native Japanese review has no reviewer.~~ Resolved: the owner is a native speaker and reviews the Japanese once a stage is authored, not per question. See the review policy below.
2. ~~The Inn three-day story conflict.~~ Resolved: the invitation is open-ended and tied to the festival. See section 5.1.
3. **No reference N2 vocabulary list exists locally**, so the catalog's gaps cannot be measured, only sampled. A 29-item probe suggests they are substantial. Either approve a reference list to reconcile against, or accept that the game covers a named project catalog rather than N2 itself.
4. **Grammar and kanji have no source at all** [verified: only vocabulary exists under `research/`]. This now blocks the stated goal rather than just authoring: N2 coverage cannot include grammar or kanji without one. Either approve a source, or narrow the public claim to N2 vocabulary and treat the grammar and kanji slots as a later phase.
5. **Whether the artifact demo is worth maintaining at all.** It cannot hold the course, and keeping it in step with the PWA costs a rebuild on every content change.
