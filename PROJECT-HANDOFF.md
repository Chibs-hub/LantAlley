# Lantern Alley Project Handoff

Last updated: 2026-09-04

A browser game that teaches JLPT N2 Japanese. Vanilla JS, CSS and HTML, no build step, no framework, offline-capable.

**If you are starting a session here, read sections 0, 11 and 12 - status, what to do next, and the working agreement. That is about ten minutes. Everything else is reference you can come back to.**

| | |
| --- | --- |
| **What state is it in?** | Section 0 |
| **What do I do next?** | Section 11 - grouped by who can actually do it |
| **What is deliberately unfinished?** | Section 10 |
| **How do I run and test it?** | Sections 2 and 7 |
| **How am I expected to work?** | Section 12 |
| **What is this file not allowed to become?** | Section 12, and see [CHANGELOG.md](CHANGELOG.md) |
| **Why is this code like this?** | [CHANGELOG.md](CHANGELOG.md) - 153 entries, newest first |

Sections 1, 3, 4, 5, 6, 8, 13, 14 and 15 are reference: what the game is, how it is designed, where the files are, how it ships, and what data it draws on.

## 0. Current status

**The current working candidate is v251 on `codex/inn-learning-redesign`.** The production baseline remains v218 until the owner authorizes that. The candidate includes the kimono characters, gravel-integrated plant art, guarded home-scene cleanup, a non-overlapping Entrance action dock, corrected first-home starter stock, the completed and fully verified Inn learning redesign, a fix for a learner-reported crash on returning to the Entrance or the Inn after a home visit, a fix for content-heavy Inn rooms scrolling before any answer was given, a fix for the home's cat resetting to the door on every yard/room switch, scene-painted exits for both the yard and the room, matching the existing house hotspot, a `?skip=1` testing flag past character selection and the Entrance, per-question/whole-stage skip controls inside the Inn stage itself, the same per-question skip extended to Episode 1, a UI audit pass over the opening, the Inn and the home, the story path feeding the delayed-review schedule, and a cold open that puts a guest in front of the learner before the Inn's three days. `sw.js` agrees with all 26 `index.html` stamps. Every spoken line in the game now has a pre-rendered audio clip (see item 2 in section 11A). `node --test` passes **432/432**.

**First real-learner feedback on the branch fixed four things** (see the 2026-09-04 change log entries): the cold open's cushion task no longer repeats verbatim as Day 1's first question when the learner solves it correctly (it still repeats, for real teaching, on a wrong guess); a correct Bow in the Entrance no longer plays the wave sprite as its own success animation; the `+¥N` reward chip no longer rises through the wallet's own digits; and the "調整" schedule question's floating time-card dot - which never aligned with either the hour labels above it or the sliders below it - is gone, leaving the two labeled sliders as the one control. A follow-up report ("still hard to know what to do") found the real problem was underneath the dot the whole time: the question's own English instructions said "move the time card" without naming which of two sliders responds, or why. They now name the control, the action and the confirm button directly. Asked separately to check this stage's furigana, two wrong readings turned up in `learning-gloss.js`'s reading aid - 来 read as らい inside 来ます, and 時 read as とき inside 14時/15時 - both now left unglossed in those contexts rather than glossed wrong; see the 2026-09-04 change log entry for a third bug this surfaced along the way.

**The 調整 (Day 1) question's premise did not survive scrutiny either, three times over.** Reported live: real inns do not let staff adjust a guest's checkout time - it went through a full rewrite from "staff picks the guest's checkout" to "staff schedules when cleaning starts, given the guest's own stated checkout," dropped an irrelevant train/travel-time calculation once that was flagged too, and added a stated one-hour gap between checkout and cleaning once an instant handoff was flagged a third time. The other two 調整 questions (Day 2 and Day 3's "two guest groups can't arrive at once, the lobby needs time between them") were checked against the same standard and left as they were - already ordinary small-inn scheduling, nothing invented. See the 2026-09-04 change log entry.

The redesign is on GitHub Pages now too - `https://chibs-hub.github.io/LantAlley/`, built from this branch, repo made public to enable it - so testers do not need a local server at all.

**`?skip=1`'s skip-question control now also works inside Episode 1.** The Inn's pre-episode stage answers through `answerStage()`; Episode 1 (the ten-question story shift the stage unlocks) answers through a second, separate function that had no skip hook. Its previously-anonymous answer callback is now named (`handlePreviewAnswer`) and kept on `previewState.answerHandler`, so `skipCurrentQuestion()` can call it directly. No whole-episode skip exists - an episode has no single "mastered" state to jump to the way a stage does, so `#btn-skip-stage` stays hidden throughout it. See the 2026-09-02 "skip-question control now also works inside Episode 1" change log entry.

**`?skip=1` also skips questions inside the Inn now.** Two buttons, `#btn-skip-question` and `#btn-skip-stage`, appear next to "Restart from Learn" only when `?skip=1` is set. Both go through `answerStage(true, ...)`, the same function a real correct answer calls, so a skip rewards and saves exactly as solving would. Needed a second fix beyond the obvious one: `enterLocation()`'s separate rendering for *resuming* an in-progress stage never ran `renderStagePrompt` (a standing comment already said so), so a save that reloaded mid-stage kept both buttons hidden even with the flag set - only a same-session leave-and-return happened to still work, which is why the first test pass didn't catch it. See the 2026-09-02 "skip controls" change log entry.

**`?skip=1` skips character selection and the Entrance for testing.** Add it to the URL (e.g. `http://localhost:8743/?skip=1`) to land on the map in one click, without replaying either gate on a fresh save - a query flag, not a visible button, following the `?unlockall=1`/`?trees=N`/`?review=1` convention, since an in-game skip control a real player could find would undercut the project's own rule against progressing without demonstrating understanding. See the 2026-09-02 "?skip=1 flag" change log entry.

**The room now has a painted way back to the yard too:** follow-up to the yard's own exit hotspot below - the same asymmetry existed one level in, with only the corner "← 庭" text link to leave the room. The interior's painting already shows one spot as "outside" (the open veranda, sliding door drawn open, garden visible through it), so `exitHotspot` was added there rather than at an invented landmark, reusing the existing `data-leave-house` attribute. See the 2026-09-02 "room now has a painted way back" change log entry.

**The yard now has a painted way out, matching the painted way in:** the yard already had `home-house-hotspot`, a labeled overlay button over the door, for going in; going out only had the corner text link, which the owner had not registered as navigation. Added a matching `exitHotspot` over the foot of the yard's centre path - the one strip of ground with no garden slot on it at any row - reusing the same `data-home-map` attribute the corner link already used, so no new click handler was needed. See the 2026-09-02 "painted way out" change log entry.

**The home's cat no longer resets to the door every time the yard and room are switched:** confirmed with the owner that this was the "cat always transported to the middle of the screen" report. `homePetMarkup()` used `enterScene()` (which always arrives at that scene's door, dead centre) both for the cat's very first sighting each visit and for every later switch between the yard and the room - the first is intentional, the second read as a teleport on every single switch. The first sighting still arrives via the door; a later switch now picks a fresh ordinary resting spot with `create()`, which excludes door anchors entirely. See the 2026-09-02 "no longer resets to the door" change log entry.

**A content-heavy Inn room no longer needs to scroll before the learner answers:** the previous fix that stopped feedback from growing the page past the viewport applied its height cap unconditionally, so `#scene` was squeezed into that same budget from the first frame - the arrange task's thirteen objects needed 580px and only had 507px, every visit. The cap now applies only once `#feedback-row` actually carries `.show`, via `:has()`; before an answer, `.game-layout` keeps only its ordinary `min-height` and grows to fit the room. See the 2026-09-02 "content-heavy rooms" change log entry.

**A learner-reported crash is fixed and verified live:** finishing the Entrance, visiting the home, leaving, then returning to the Entrance or the Inn broke the game immediately with an uncaught `TypeError`. The Entrance moves a singleton `#avatar-slot` node into `#scene`; nothing moved it back before entering the home, so `paintHome()` overwriting `#scene`'s innerHTML destroyed it outright, and every later `$("avatar-slot")` came back `null`. Fixed by moving the restore step to the top of `enterLocation()`, before any branch - home included - can touch `#scene`. See the 2026-09-02 "Fixed a crash..." change log entry for the full root cause and the harness bug (`dom-harness.mjs`'s `insertBefore`) it surfaced along the way.

`inn-learning-mock.html` is a non-production visual proposal for the next Inn learning pass. It uses the real lobby art and transparent Kon cutout to show the proposed compact dock, selective ruby readings, explicit new-word card, visible five-guest shift progression, and answer consequence without revealing the answer before selection. It does not change the playable app.

**Inn learning redesign is implemented and played clean start to finish.** The approved plan is `docs/superpowers/plans/2026-09-01-inn-learning-redesign.md`: 5 Learn, 3 Practice and 2 Challenge tasks; evidence-based mastery across those phases; selective reading help; and a five-beat shift tracker for each episode. Learn cards show only the target word, reading and concise meaning. Existing Inn scene art was sufficient, so no new raster art was added.

The three acceptance gaps the previous QA pass left open are resolved, each confirmed live rather than by re-reading source - see the 2026-09-02 change log entries for the detail:

1. `調整`'s new-word card said "regulation" (the catalog's general first sense) where the story means "adjustment/coordination". `N2HomeInnStage.getCardSense` now overrides the card only, leaving the catalog entry - and every other consumer of it - untouched.
2. The schedule slider's earlier "stuck at 10:00" report does not reproduce with a real pointer: a single click lands exactly on the intended hour, confirmed at both 1280px and 375px. Synthetic ArrowRight/ArrowLeft key dispatch did not step it in this browser-automation environment even though no code intercepts those keys - consistent with the plan's own suspicion that this was an automation artifact rather than a defect, so nothing was changed.
3. A correct answer grew the page past its own viewport - 795px to 873px measured at 768px tall, pushing the result and the continue button below the fold. `.game-layout` now gets `max-height` equal to its existing `min-height`, which is what lets its `minmax(0,1fr)` answer row actually divide the available space instead of growing to fit its content; `#scene` absorbs any remaining overflow with `overflow-y:auto` while the feedback bar and continue button stay full size and always in view. Confirmed at 768px and the plan's own 720px: the page no longer grows by even one pixel when feedback appears.

A full clean-save walkthrough then played all 5 Learn, all 3 Practice, and Challenge with one deliberate wrong answer on 調整 (scored 1/2, routed to a review naming only the missed word) followed by a correct review answer, completing the route and unlocking Episode 1. The five-beat shift tracker was seen live for the first time on the episode's own first question, with 受付 correctly lit as the current beat.

The latest browser check completed the Entrance and selected Moonview Inn from the map in a clean session. The Inn introduction rendered normally, with no blank completed-Entrance screen. The Entrance action instruction now has its own grid row and a measured 7px gap above the three cards.

The first home visit now starts with an empty yard but non-empty stock. The free camellia is immediately in garden inventory and stays unplanted until the learner chooses a slot. The free cushion is immediately in indoor inventory and likewise stays unplaced. The tutorial teaches placement directly instead of sending the learner to the shop to claim either item. Saves containing the retired automatic `starter-maple` remove that special id during normalization; purchased maples are preserved.

### The game is finished and playable end to end

Five locations, four episodes each, ten questions per episode - 20 episodes, 200 authored questions, 200 distinct words. `validateStage` passes for every stage with nothing filtered out. A learner can start at the title screen and reach the end of every place without meeting a dead screen, and the walkthrough suite proves it by playing rather than by reading source.

### The reward system is built

Coins earned at the inn and the market buy furniture, wallpaper and plants for a house and garden that persist across visits. Placement, growth, the shop, the tutorial, the resident cat and its routing around placed objects are all implemented and tested. `?unlockall=1` fills the cupboard so placement can be exercised without earning it - section 2.

### What is not finished

Three things, and **none of them are code**:

1. **The Japanese has never been reviewed by a native speaker.** 215 items. Only the owner can do this. `?review=1`.
2. **Most of the audio does not exist.** 506 of 620 spoken lines have no clip.
3. **Most of the art does not exist.** Four of eight plant species and six of twenty-one furniture items render as vector stand-ins; four of five places have no scene art; the cat has no true sitting pose.

The full list, with what each one is blocked on, is section 11.

### One open defect

The owner has reported the cat's head being cut off. **It has not been reproduced.** Sprite-edge and scene-edge clipping have been measured and ruled out, but v187 added depth stacking, so nearby foreground decor may intentionally cover part of the cat. The missing evidence is the current build version, pose and nearby placement - section 11, item 8.

### Two sessions work on this project in parallel

Both write here. If you are one of them, read the other's recent entries in [CHANGELOG.md](CHANGELOG.md) before starting, and check `git log` - a status block is true on the day it is written and quietly wrong a day later. This section has had to be emptied of accumulated dated entries twice.

### Golden Rule: Learning Integrity

- Reward accuracy and demonstrated understanding, not merely speed or repeated tapping.
- Every mechanic must serve the Japanese-learning objective. A learner must not be able to progress by guessing, memorizing answer positions, or mindlessly tapping.
- Speed may add pressure only after comprehension is established; it must never replace evidence of understanding.
- Before shipping a mechanic, ask: "Can a learner win without understanding the Japanese?" If yes, redesign it.
- False progress breaks trust: leveling up without usable knowledge makes the learner feel cheated and harms retention.

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

**Verification.** 395 automated tests pass, 0 fail. Bare `node --test` is the correct command. The service-worker cache is `lantern-alley-v212`.

**Mastery and earnings.** The stage HUD now shows a persistent understanding gauge and wallet. Mastery is the percentage of distinct authored targets answered correctly, never attempts or speed. Correct answers pay once per question (Learn ¥10, Practice ¥15, Challenge ¥25, correction ¥10), so replay cannot farm money. Places unlock in order only when the previous place reaches 100%: Entrance, Inn, Market, Teahouse, Station, Shrine. Existing completed episodes are converted into mastered targets on load. Locked map places remain visible and explain the 100% requirement. Money now buys something: see **the house and garden** below.

The correction round now keeps a missed target in rotation until it is answered correctly. After three misses it reveals the answer, then asks it again later; it no longer drops the target while still allowing the mastery gauge to claim completion.

Normal Inn word-choice questions no longer repeat the room inventory description above the answers. The Japanese request, English interaction instruction and answer choices are the complete question surface; room clues remain available only when the illustrated room interaction needs them.

**The house and garden.** `わが家` sits in the middle of the map and is never locked - coins may decide what goes inside it, but nothing about understanding decides whether a learner can go home. It opens on an illustrated yard; the house leads to an interior. Kon's first visit hands over a free camellia seed and a free cushion and makes the learner plant, place and move something once, advancing on the action rather than on a Next button; `使いかた` replays the explanation without handing anything out twice.

**Placement is free, not slotted.** The yard began as eight painted beds and the room as six named corners; both were replaced by a dense grid of invisible positions over neutral backgrounds - 24 in the yard, keeping the original eight ids so existing saves do not lose their plants. The house, fence, path, room architecture and tokonoma are fixed scenery. Everything else - including the starter maple - can be moved or put away.

One item to a position and one position to an item: moving something empties where it came from, and placing into an occupied spot swaps and says which item went back. Each position carries a `scale`, so a plant at the back of the yard is smaller than the same plant at the front, because the painting has perspective and a fixed size ignored it.

`庭を空にする` stores every plant without touching ownership or growth; `最初の配置に戻す` puts the starter trees back and never repurchases anything. Verified end to end: growth points survive the round trip and the wallet does not move.

**Plants grow from finished work only** - one point when a shift is cleared past its correction round, one more if that shift introduced a word the learner did not already hold. The credit is keyed by the episode's own id, so replaying it grows nothing. A plant in storage does not grow, and the shift it sat out is not paid retroactively.

**The light follows the learner's own clock** - morning, day, evening, night - and there is deliberately no picker. Yard and room now use synchronized paintings with genuinely different skies, outdoor views, ambient light, shadows and lamp states; the old sunset painting is retained only for evening. Lighting remains cosmetic and cannot reach growth, rewards or lessons.

Wallpaper is bought and hung; ownership and the active choice are stored separately, so changing your mind never costs the roll already paid for.

**A cosmetic cat lives here.** One long-haired calico moves between authored anchors in the yard and the room, follows the learner between the two, and does nothing else: `pointer-events:none`, absent from the shop, still under reduced motion, paused in a hidden tab. It cannot touch lessons, money, growth or placement, and that separation is the point of it.

**What the reward system still owes.** Sakura, maple, camellia and sunflower are painted; hydrangea, iris, chrysanthemum and lantern-flower-bed still use vector stand-ins. Fifteen of the twenty-one furniture items are illustrated; 火鉢, 扇, 面, 急須, 本 and 小さな鉢 are not. **The shop sells only what has been painted** - an unfinished drawing is honest while a learner watches something they own grow, and dishonest on a price tag. Anything already bought keeps rendering from its vector, so no existing save loses an object. Adding the art is what puts an item back on the shelf. Switching a species to painted art is one block in `PLANT_ART`; the remaining requirement is `docs/superpowers/plans/2026-08-28-home-garden-task-7-assets.md`.

**The one open decision.** Audio has not been generated for the four newer places. The course speaks 620 lines; 114 have clips. Inlining the remaining 506 would take the artifact to roughly 31 MB against a hard 16 MB limit, so on 2026-08-27 the owner chose to skip the audio run for now and to drop the Artifact as the delivery surface later, so that the finished game can ship with its voice. Nothing has been sent to Microsoft Edge TTS.

**What that costs today.** On the four newer places a listening item is read rather than heard. The clock is paced by the length of the line instead of by a recording, so nothing is unplayable, but the five-second items are tighter than they are at the Inn, where the clip plays first and the learner has already heard the request before the clock starts.

**Coming back.** A half-finished shift has always been restored down to the question and the correction round, and until 2026-08-28 nothing ever said so: the map opened on a fixed default and the learner had to remember where they were. The map now opens on the place they were last in and names the unfinished shift on a button that goes straight back into it. It also shows the streak and how many words the schedule wants back today, both of which were tracked and never shown. One freeze covers one missed day, not an unlimited gap.

**Still outstanding.** The Japanese has not been reviewed by the owner, who is a native speaker and reviews after authoring rather than during - and that now includes Kon's eight tutorial lines at the house and every string in the garden and shop. The two testing shortcuts that used to ship, **Skip to next day** and **Preview Episode**, were removed on 2026-08-29.

## 1. Project summary

Lantern Alley is a local, browser-based JLPT N2 learning game. The player walks a small map, listens to or reads Japanese, and answers by doing the job rather than by picking a vocabulary card.

Two layers carry the language:

- **Tier 1, the story episodes.** 200 authored questions across five places. Each has a Japanese prompt, four choices, an explanation for every choice including the wrong ones, and a short correction form that returns at the end of the shift if it was missed.
- **Tier 2, Kon's practice (コンの稽古).** Reading, meaning and cloze cards generated from the 3,579-item vocabulary catalog - 9,097 cards, no item unreachable. This is what makes covering the catalog affordable: the story teaches 200 words deeply, and practice reaches the rest.

An episode is one shift in three parts (3 Learn, 3 Practice, 4 Challenge) against a clock, followed by 間違い直し, a timed correction round over only the items that were missed.

The project covers its own named vocabulary catalog. It does not claim complete JLPT N2 coverage: the official exam publishes no fixed post-2010 vocabulary, grammar or kanji list, and no grammar or kanji catalog has been approved for this project.

## 2. How to run the game

No installation or package manager is required.

1. Serve the folder over HTTP rather than opening the file directly - a service worker will not run from `file://`, so offline install and caching are silently absent. Any static server does; this repo's `.claude/launch.json` runs `python -m http.server 8743`.
2. Open `http://localhost:8743/index.html`, select `路地へ入る`, then open `Moonview Inn` from the map.
3. Add `?review=1` to open the owner's Japanese review mode.
4. Add `?skip=1` to land on the map in one click, skipping character selection and the Entrance - useful when testing anything past them (the home, the Inn, the map itself) without replaying both on every reload of a fresh save. The same flag also reveals a "Skip question" and a "Skip stage" button inside the Inn, next to "Restart from Learn," for testing Learn/Practice/Challenge content without solving it.

**Testing on a phone, without hosting anything.** The dev server already listens on every interface, so a phone on the same Wi-Fi can reach it directly - no build, no upload, and it always shows the current working tree:

```
http://<this machine's LAN IP>:8743/index.html
```

Find the address with `Get-NetIPAddress -AddressFamily IPv4`; on 2026-08-29 it was `192.168.137.82`. Python already holds inbound firewall allows, so nothing needs opening.

Two things about that address specifically:

- **A service worker will not register over plain http on a LAN IP.** Browsers allow it only on `localhost` or HTTPS. The game plays normally, but install-to-home-screen and offline do not work there - test those on `localhost`, and on the real host once there is one.
- **A VPN can break it.** If the phone cannot connect, check whether a tunnel is up on this machine; LAN routing is the usual casualty.

**Seeing an old version after a change is the most common way to waste an hour here, and `Ctrl+F5` does not fix it.** There are two separate caches:

- The **service worker**, which serves the app shell cache-first. It also intercepts URLs it does not know: while testing, it quietly served `index.html` in place of `lantern-alley-artifact.html`, which looked exactly like a broken build. Bump `CACHE_VERSION` in `sw.js`, or unregister it in DevTools > Application.
- The **browser's own HTTP cache**, which holds each script. Every local script and stylesheet URL carries `?v=<CACHE_VERSION>`, so bumping that one number defeats both. Always bump it after editing anything the page loads - a test ties the two together so a forgotten bump fails the suite.

A `?bust=anything` on the page URL only reloads `index.html` itself; the scripts underneath still come from cache with their old `?v=`. Bump the version.

Japanese audio plays from pre-rendered neural-voice MP3s, so pronunciation is identical on every device. If a line has no clip the game falls back to browser speech synthesis.

### Testing placement and the rewards, without earning them

`http://localhost:8743/?unlockall=1&trees=10` adds ten full-grown trees to storage on top of everything else, alternating the two painted species, all unplanted. Use it when judging a yard: a tree only reads against the house at full size, and one of them is not enough to tell.

`http://localhost:8743/?unlockall=1` fills the cupboard: every furniture item, every wallpaper, one of every plant species at `planted` and again at `mature`, 99999 coins, tutorial marked done. Nothing is placed - the point is to test the placing. From the console it is `lanternUnlockAll()`, which returns a summary and can be called at any time.

It is behind an explicit flag for the same reason `?review=1` is. The project's own rule is that a learner never advances without earning it, so a grant like this must be impossible to reach by accident and must say so on screen when it fires - a silent one is indistinguishable from a scoring bug. A test asserts a plain boot is not unlocked.

Note the two ends of the growth: each species arrives twice so the `planted` and `mature` art can be placed side by side. Four species are painted (sakura, maple, camellia, sunflower) and four still render as vector, so expect 8 painted cards and 8 drawings among the 16 plant cards - that is correct, not a loading failure.

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

**The Moonview Inn's introductory route is the one named exception to this 3-3-4 shape**, and is a separate stage from its own four 3-3-4 episodes. `N2HomeInnStage` teaches the Inn's first five words - 揃える, 取り替える, 温める, 調整, 引き受ける - as **5 Learn, 3 Practice, 2 Challenge**: fifteen near-duplicate tasks read as repetition rather than as three days, so Practice and Challenge were each cut to the words that actually need retrieval practice rather than one card per word. A learner only unlocks Episode 1 once every one of the five words has training evidence - a recorded *correct* answer, in any phase including 間違い直し - **and** both Challenge prompts are answered correctly, so the shorter route is not a lower bar, only a less repetitive one. See `docs/superpowers/plans/2026-09-01-inn-learning-redesign.md` and the 2026-09-01/02 change log entries.

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
| `home-room.js` | Scene metadata for `わが家`: the yard and interior backgrounds and every position something can stand in - 24 in the yard, more inside. Every coordinate is a **percentage** of a 16/9 scene, and each carries a `scale` so things shrink with the painting's perspective. The first eight yard ids are the original bed ids, kept so saves made before free placement still resolve. `baseRoomSvg()` is the fallback for a scene whose image will not load. |
| `home-decor.js` | Furniture and wallpaper. Owns the two rules worth testing: an item is in one slot at a time, and placing into an occupied slot swaps rather than destroys. Wallpaper is separate - never placed, only one active - and its patterns are tiling SVG. |
| `home-pet.js` | The calico. Kept apart from everything else on purpose: it is the one thing in the game that moves on its own, so the rule that it cannot reach lessons, money, growth or placement is easier to hold if it has no access to them. |
| `home-garden.js` | The pure garden engine: plant instances, placement, movement, storage, and growth credited by `creditLesson(garden, creditId, bonus)`. Immutable throughout; every rule that stops replay farming lives here. |
| `learning-economy.js` | What a correct answer pays, and which places are unlocked. `award()` pays once per question id, so replay cannot farm money. |
| `daily-practice.js` | The practice session's earnings, the accuracy gate, and the streak. One freeze covers one missed day. |
| `review-mode.js` | The owner's in-app Japanese review, reached with `?review=1`. Builds an index of all 215 authored items, stores marks under its own storage key so reviewing never disturbs a save, and exports a plain-text report. |
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

## 8. Delivery: the app, not the Artifact

**The Artifact was retired on 2026-08-27.** The game needs more room than it can have there: 506 spoken lines still have no audio, and the reward layer is about to add a furniture catalogue. A 16 MB hard ceiling cannot hold either.

**What the product is now.** `index.html` and its sibling files, played from disk or served over http, installable as a PWA. There is no size ceiling.

`build-artifact.mjs` still works and still refuses to emit a file over 15 MB. It is an **optional demo build**, not the delivery path. Nothing needs to be rebuilt or republished to ship a change.

**Do not let its size ceiling drive decisions.** It briefly did: the build broke at 15.89 MB, and that was treated as a problem to solve rather than as a retired build refusing to hold a game that has outgrown it. The fix that came out of it - cutting oversized backgrounds - was worth doing for the app on its own terms, but the trigger was the wrong one. If it stops fitting again, that is the artifact reaching its limit, which is exactly why it was retired.

**Why it still exists at all:** it is currently the only way to open the game on a phone that is not on this Wi-Fi. Section 2 covers the LAN address, which is better for everyday testing. Once the app is hosted, this file and the tests that read it should be deleted.

**The order that was agreed:** keep testing locally until the game is ready, then host it. `_headers` is already written for that day - Cloudflare Pages and Netlify both read it, and it handles the stale-service-worker trap that would otherwise pin every returning learner to an old release.

### Verifying a change

The one on-disk build used to be the reliable way to see real behaviour, because the dev server served stale files. With the artifact retired, that trick is gone, so the caching is handled properly instead: **every local script and stylesheet URL carries `?v=<CACHE_VERSION>`**, stamped to match `sw.js`. A version bump now busts the service worker cache *and* the browser's own HTTP cache. A test ties the two together so they cannot drift.

When something still looks stale, this clears it completely:

```javascript
for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
location.reload();
```

This was not hypothetical: a freshly edited `lantern-map.js` was served from the browser cache while a brand-new file beside it loaded fine, and the map silently rendered without わが家 on it.

## 9. Change log and reasons

**Moved to [CHANGELOG.md](CHANGELOG.md)** on 2026-08-31 - initially 151 entries, with new entries added at the top. It was 81% of this file, so anyone reading top to bottom met two thousand lines of history before reaching section 11, which is the part that says what to do next.

Read it when something looks wrong before you change it: most of the odd-looking decisions here are load-bearing, and the entry usually says what broke last time. New entries go at the top of that file, as `###` headings.

## 10. Known limitations

Split by whether anyone intends to change them. Nothing here is a surprise; all of it is recorded on purpose.

### Deliberate, and staying that way for now

- **No audio on four of the five places.** 506 of the 620 spoken lines have no clip. Listening items there are read rather than heard, and on a device with no Japanese voice they are silent. A recorded decision, not an oversight.
- **The five-second items are tighter without audio.** At the Inn the clip plays before the clock starts, so the request has already been heard. Elsewhere the learner reads it cold. This is a direct consequence of the line above.
- **Four of eight plant species are painted** - sakura, maple, camellia, sunflower - and six of twenty-one furniture items still render as vector. Deliberate: the garden ships playable on stand-ins rather than waiting for art.
- **No grammar or kanji catalog is approved**, so the project may claim coverage only of its named vocabulary catalog. Candidate sources are in section 14; KANJIDIC2's licence is now verified.

### Defects recorded but not fixed

- **Tap targets in the Inn's illustrated room are small on a phone.** At 390px the stove zone is 51x18 and the broken bulb 23x23; four are under 24px at 320px. They cannot simply be enlarged - neighbouring zones are 29 to 45px apart centre to centre, so a comfortable hit area would overlap the next zone and steal its taps. **The fix is spacing them further apart in the artwork**, which is a scene decision, not a CSS one.
- **The Inn is entered through its old three-day stage**, while the four newer places drop straight into their first episode. The two entry paths differ by history rather than by design.
- **`chrysanthemum` is an id in two different catalogues**: a plant species in `home-garden.js` and the 菊の鉢 floor item in `home-decor.js`. Nothing breaks today, because plants live in `garden.plants` and furniture in `home.owned` and the two are never looked up together - both can be bought and held at once, which is what a learner would expect. It is recorded because **the next thing that resolves an id without knowing which catalogue it came from will find the wrong object, and that failure would be silent.**
- **`assets/home/pet/calico-walk-v2.png` is superseded by v3** and is neither referenced by `home-pet.js` nor precached by `sw.js`. Ten sheets are in production; eleven are on disk.
- **53.9 MB of the 58.5 MB of PNG/JPG under `assets/` is unreferenced** - leftover originals from before the JPG and WebP conversions. Harmless at runtime, but it is most of the working tree, and it is already in git history, so deleting it does not shrink a clone.
- **Catalog provenance is incomplete.** The exact OpenJLPT commit used for the local copies was not recorded. The licence chain itself is verified and recorded in `NOTICE.md`; only the version is missing.

### Resolved, kept so it is not re-litigated

- ~~The Artifact cannot carry the finished game.~~ Resolved 2026-08-27: the Artifact is retired and the app is the product - section 8. It was rebuilt on 2026-08-28 purely as a link for testing on a phone, which section 2 now answers better: the dev server is reachable from a phone on the same Wi-Fi at this machine's LAN address, with no build, always showing the working tree. The artifact remains only for a phone not on this network, and should be deleted once the app is hosted.

## 11. What needs to be done

Grouped by **who can actually do it**, because most of what is left is not code and a coding session cannot start it. Within each group, most valuable first.

### A. Only the owner can do these

1. **Native review of the Japanese.** 200 questions, five story arcs, all of Kon's dialogue, the eight tutorial lines at the house, every garden and shop string - authored in this project, never checked by a native speaker. Everything else is cheap to change; this is the one thing nobody else can do. `?review=1` walks all 215 items in place with the clock off and an おかしい checkbox. `generate-audio.py` hashes its input, so corrections later cost only the lines that changed.

   **Lines written by Claude and not yet reviewed.** `?review=1` walks the 215 question items; these are dialogue and chrome, so they sit outside it. The owner reviews the Japanese once stage creation is finished, so this list is kept current rather than acted on.

   | Line | Where |
   | --- | --- |
   | コン：「あっ、もうお客様がいらっしゃいました。さっそくですが、お願いします。」 | `n2-home-inn-stage.js`, `DAY_ANNOUNCEMENTS.coldopen` |
   | コン：「大丈夫ですよ。お客様は私が。三日ありますから、一緒に覚えていきましょう。」 | `n2-home-inn-stage.js`, `coldOpen.wrongReply` |
   | コン：「よくご存じですね。では、残りの言葉も見ていきましょう。」 | `n2-home-inn-stage.js`, `coldOpen.correctReply` |
   | はじめの仕事 / ためし | `n2-home-inn-stage.js`, `DAY_META.coldopen` |
   | けっこうです。 / ここからが練習です。 | `app.js`, `resolveColdOpen` |
   | 一日目をはじめる → | `app.js`, `resolveColdOpen` |
   | 明日、この五つの言葉をもう一度たしかめましょう。 | `app.js`, the stage's mastery message |
   | この路地の灯りは消えています。場所の言葉をすべて覚えると、灯りがひとつ戻ります。 | `app.js`, `renderMap`, `#map-goal-note` |
   | 学ぶからやり直す / 問題 N / M / ヒントを見る / あたらしい言葉 / あなた / 男性 / 女性 / 使う姿をえらぶ | `index.html` and `app.js` chrome |
   | お客様が来る前に / 洗面所で / お茶が冷めてしまった / 明日の予定を立てる / 夕食の配膳 / 月見宿・N2 | `n2-home-inn-stage.js`, encounter and stage labels |
   | コン：「お客様が部屋で休んでいる間に、明日の予定を決めておきましょう。お客様のチェックアウト時刻と、次のお客様の到着時刻を確認して、掃除を始める時間を調整してください。」 | `n2-home-inn-stage.js`, the 調整 encounter's `narration` (rewritten 2026-09-04, see below) |
   | お客様は12時にチェックアウトするそうです。チェックアウトの1時間後から掃除ができます。掃除には2時間必要です。次のお客様は15時に到着します。掃除を始める時間を調整してください。 | `n2-home-inn-stage.js`, the 調整 encounter's `jp` (rewritten 2026-09-04) |
   | ありがとうございます。掃除を13時に始めるよう調整できました。これで次のお客様の到着にも間に合います。 | `n2-home-inn-stage.js`, the 調整 encounter's `successReply` (rewritten 2026-09-04) |

   Two conventions the replacements should keep: operating instructions stay English (`question-renderer.test.mjs` pins this, and answer content stays Japanese), and any change to a spoken Entrance tutorial line needs a matching audio clip in `audio-index.js` or `pwa.test.mjs` fails.

2. ~~**Approve the audio run.**~~ **Done 2026-09-04.** Ran across two passes this session: the first (510 lines) cleared the whole prior backlog in one go; the second (3 lines) picked up the 調整 encounter's final rewording after it changed again post-generation. Every spoken line in the game now has a clip; `node --test` confirms it. Any future content edit still needs its own run - `generate-audio.py` sends Japanese text to Microsoft Edge TTS, an external service, so it stays approval-gated every time, not just until the backlog clears.

### B. Blocked on artwork

Nothing in this group is a code task. Listed so a coding session does not start one and stall.

**The whole art queue, shortest first.** Each line links to the item below that carries the detail.

| # | What is needed | Why |
| --- | --- | --- |
| 1 | A **vertically seamless** asanoha wallpaper tile | the current sheet seams on every vertical repeat - item 3a |
| 2 | A **wall mask** for the room, or a room painted for wallpaper | the wallpaper covers ceiling and doors - item 3b |
| 3 | The room repainted with a **real tokonoma and shelf** | those two positions name furniture the picture lacks - item 3c |
| 4 | **6 furniture items**: 火鉢, 扇, 面, 急須, 本, 小さな鉢 | item 5 |
| 5 | **4 species x 4-5 growth stages** (16-20 files): hydrangea, iris, chrysanthemum, lantern-flower-bed | item 5 |
| 6 | A **raster 桜 wallpaper** | vector only, so it is off the shelf - item 5 |
| 7 | A **cat sitting pose**, and an entry animation if transitions are wanted back | item 4 |
| 8 | **Scene art for four of the five places** | item 6 |
| 9 | The **Inn room redrawn with its hotspots further apart** | item 7 |
| 10 | **One Kon in one style** - the fox is a photoreal plush toy on the title and in the scenes, and a flat illustration in the character-select header | item 8 |
| 11 | **Day and morning variants of the shared night scenes** (alley map, Entrance gate, Inn lobby), if the world is to follow the clock as the home already does | item 9 |

**2026-08-31 candidate art exists but most is not wired.** The approved first batch is in `assets/home/art-candidates/2026-08-31/`: seamless asanoha and sakura wallpaper candidates, a room with a real tokonoma and shelf, its matching wall mask, six transparent furniture candidates, a production-grid sitting-cat candidate, and a wider Inn room. `review-board-v1.jpg` and the two placement/mask previews are for visual approval. The generated cat entry sheet is explicitly rejected because frames touch their cell boundaries. Two transparent room display pieces now exist in `assets/home/decor/`: `display-cabinet-kiri-v1.webp` for a broad top surface and `display-shelf-staggered-v1.webp` for three display levels. Their room previews are in the candidate folder. The shelves are not yet wired into the decor catalogue, and shelf-top child-object anchors still need implementation. Do not move any other candidate into production until its in-scene scale and blend are approved.

**2026-09-01 natural-style player characters are production.** The approved `player-characters-natural-style-mock-v2.png` direction now has two complete action sheets: `assets/entrance/player-actions-kimono-man-v2.webp` and `assets/entrance/player-actions-kimono-woman-v2.webp`. Each is a 1200x600 RGBA sheet with four exact 300x600 cells for idle, bow, wave and clap. The flatter gouache texture, restrained larger eyes, distinct faces, indigo kimono and charcoal haori for the man, and burgundy floral kimono for the woman replace both old Entrance sheets. Character selection, action rendering and v214 offline caching are wired. Desktop and 390x844 browser QA confirmed stable scale, natural bows, no clipping and no console errors.

**2026-09-01 gravel plant art is production.** All 18 painted stages for sakura, maple, camellia and sunflower now use `*-gravel-v2.webp` assets in `assets/home/garden/`. Planted, sprout and later growth stages preserve visible progression; every root or seed pocket meets pale gravel rather than a raised brown mound. `gravel-growth-all-stages-preview-v2.jpg` checks relative stage size, and `gravel-growth-yard-qa-v2.jpg` checks all 18 against the actual day yard. The old CSS soil-disc haze is removed. `PLANT_ART`, measured `PLANT_BASE` values and the offline cache are wired and covered by tests.

3. **Three faults in the room painting and its wallpaper.**

   **3a. The asanoha wallpaper does not tile vertically.** Measured on `assets/home/decor/wallpaper-asanoha-blue-v1.webp` (1024x571): the left and right edges match, at a mismatch of 21 against an interior baseline of 38, but the top and bottom edges do not - 37.8 against a baseline of 47. Since 2026-08-31 the sheet is repeated rather than stretched, so that mismatch is now **a visible seam at every vertical repeat**. It needs a tile that is seamless on both axes. Stacking the sheet with a vertical mirror of itself would also work and needs no redraw, if a seam is more objectionable than a mirror line.

   **3b. The wallpaper has no wall mask.** `.home-wallpaper` is a plain rectangle over the top 70% of the scene, so it covers the ceiling, the transom and the sliding doors exactly as readily as the walls. Confining it needs either a mask cut to this painting's wall areas, or a room painted with plain walls meant to take wallpaper. No CSS fixes this.

   **3c. The room has no tokonoma and no shelf.** The `shelf` and `tokonoma` positions name furniture the painting does not contain, which is why they were floating on a flat wall until 2026-08-31. Small objects now rest on the tatami near the back wall as an honest interim. A room painted with a real alcove and a shelf would let them go where they belong, and those two positions should move back up when it exists.

4. **The cat has no sitting pose.** `walk`, `sit`, `look` and the retired `enter` are all the same standing cat; only `loaf`, `curl-sleep` and `groom` are genuinely distinct. So a cat that "sits at the door" stands there.

   **Spec for whoever draws it.** Sheets are a grid of square cells, currently 192x192, four columns per row. The rules the existing set breaks:

   - **One pose, one scale, across all of its frames.** This is the rule `enter` broke and it is the expensive one - it cannot be corrected afterwards, because which frame shows the true size is not recoverable from the picture.
   - **One scale across every pose too**, so the cat does not change size when it changes what it is doing. Judge this by head and body, **not** by the bounding box: this cat has a large plumed tail that fills the box in the compact poses, and measuring the box alone will tell you the poses are consistent when they are not, or the reverse.
   - **A common baseline.** Every frame's feet on the same line, currently 93.2% down the cell, so the cat does not bob when the pose changes.
   - **Clearance on all four sides**, 13px or more at 192px, so nothing touches a cell edge.
   - **Wanted:** a true sitting pose (upright, tail curled round the feet), and a consistent entry/exit if scene transitions are wanted back.

5. **Finish the home and garden art.** Four of eight species are still drawn from data, and six of twenty-one furniture items still render as vector. The system runs without it; this is the difference between a garden and a diagram. Requirement: `docs/superpowers/plans/2026-08-28-home-garden-task-7-assets.md`.

   **Stage counts differ by species, and this trips people.** Camellia is painted in four steps matching the engine - `planted, sprout, growing, mature` - while sakura and maple are painted in five, with `sapling` and `young` in place of `growing`. `plantVisualStage` in `app.js` bridges the two. **Anything that renders a plant must go through it**, or the missing `growing` key falls back to a bare seedling - which is exactly what the storage card did until 2026-08-29.

6. **Give the four newer places their scene art.** They render on the shared workspace today. Nothing depends on this; it is the visible half of the work. The home is the worked example of how a place with real artwork is put together - the picture is the stage rather than a picture on it, and the interface floats over it.

7. **Re-space the Inn's room hotspots** so its tap targets can be enlarged - see section 10.

**One Kon, in one style** (art queue row 10). The fox appears as a photoreal plush-toy render on the title screen and in every stage, and as a flat illustration in the character-select header, over painted backgrounds. Three rendering styles for one character, most obvious at mobile size on the Entrance where the plush fox sits beside a flat-illustrated player against a painted night scene. **Needed:** one Kon rendered in a single style, in the poses already in use - `assets/fox/fox-neutral-no-mouth-transparent.webp` (title, character header, map detail) and the transparent expression set in `assets/fox/` used by the stages (`idle`, `listening`, `invite-bow`, `celebration`). Whichever style wins, all of them have to be redrawn in it; picking the painted style would match the backgrounds, picking the plush would match the current stage art. Not a code fix - the CSS can only scale what it is given.

**Day and morning variants of the shared scenes** (art queue row 11), if the world should follow the clock. The home already shifts through morning, day, evening and night with the learner's clock, deliberately and documented. Every other scene is fixed at night, so walking home from the alley at 1pm crosses twelve hours. **Needed, to resolve it in the direction that keeps the home's feature:** morning and day variants of `assets/map/lantern-alley-map-v1.jpg`, `assets/entrance/wooden-gate-v1.webp`, and the Inn's lobby and room art. The cheaper alternative needs no art at all - lock the home to evening in `effectiveHomeLighting()` - but that deletes a feature someone built on purpose, so it is the owner's call rather than a fix to apply.

### C. Code work

8. ~~Finish the Inn learning redesign QA before starting other code work.~~ **Done 2026-09-02.** All three acceptance checks resolved and verified live - `調整`'s card sense corrected via an Inn-specific override, the schedule slider confirmed working with a real pointer at 1280px and 375px (the "stuck at 10:00" report did not reproduce and is recorded as a probable automation artifact), and the feedback-driven page growth eliminated by giving `.game-layout` a real height so its answer row can actually divide the space it is given. A full clean-save walkthrough then played all 5 Learn, all 3 Practice, and Challenge with a deliberate miss and its correction, through to Episode 1 unlocking and its five-beat tracker rendering correctly. Section 4 now states the Inn's 5/3/2 exception beside the general 3-3-4 model. See the 2026-09-02 change log entries for the detail on each fix; cache is v223, `node --test` is 404/404.

9. **The reported cat clipping, which has never been reproduced.** Do not re-check the items below; they are measured and ruled out.

   - Every frame in all ten production behavior sheets keeps **at least 13px clear on all four sides** of its 192px cell.
   - The cat's box sits **inside the scene at every anchor**, clearing the goal line by 6px at the lowest.
   - V187 uses ground-depth stacking: foreground furniture or plants may intentionally outrank the cat and hide its lower body. This is occlusion, not sprite clipping, but a screenshot must include nearby placements so the two can be distinguished. The only clipping ancestors remain `.home-scene` and `.frame`, both far larger than the cat.
   - The element is **square** and `background-size` maps exactly one cell onto it, verified live in the browser.
   - Browser verification of the v169 cat sampled standing, idle and walking frames with complete ears, tail and paws, and its oversized scene scale was corrected from 9.5-12.8% to 6.8-9%.

   **What is still unknown is the current build, pose and nearby placement when it happens.** Capture all three: ask for a screenshot from the current build with surrounding decor visible, or add a temporary on-screen readout of `homePetState.behavior`. Without that evidence there is nothing specific left to test.

   **The trap that cost a whole session:** before v168 the browser painted pre-repack sprite bytes, so the art on disk and the art on screen were different files. A report predating v168 may describe art that no longer exists. **Confirm the reporter's build version before investigating.**

10. **Reconcile the Inn's two entry paths** so all five places are entered the same way - see section 10.

11. ~~Fix the crash on returning to the Entrance or the Inn after a home visit.~~ **Done 2026-09-02.** Owner-reported and reproduced live before being touched: Entrance to home to leave to Entrance (or to the Inn) threw an uncaught `TypeError` and left the game stuck. Root cause was the singleton `#avatar-slot` node - moved into `#scene` by the Entrance and never moved back before `renderHome()` could run, so `paintHome()` overwriting `#scene`'s innerHTML destroyed it. Fixed by restoring the node to `#dialogue-shell` at the top of `enterLocation()`, before any branch can touch `#scene`. Writing the regression test also surfaced and fixed an unrelated bug in the test harness itself (`dom-harness.mjs`'s `insertBefore` was not detaching a moved node from its old parent, unlike `appendChild`). See the 2026-09-02 "Fixed a crash..." change log entry; cache is v224, `node --test` is 405/405.

12. ~~Fix content-heavy Inn rooms scrolling before the learner has answered.~~ **Done 2026-09-02.** Owner-reported with a screenshot: the arrange task's object tray was sliced off by an internal scrollbar on an ordinary desktop viewport. The previous viewport-growth fix (item 3 of entry 8) capped `.game-layout`'s height unconditionally, squeezing `#scene` into that budget even before any answer - the arrange task needed 580px and had 507px. The cap now applies only once `#feedback-row` carries `.show`, via `:has()`, so a quiet room is free to grow to fit its content exactly as it could before either fix existed. See the 2026-09-02 "content-heavy rooms" change log entry; cache is v225, `node --test` is 405/405.

13. ~~Fix the home's cat resetting to the door on every yard/room switch.~~ **Done 2026-09-02.** Owner confirmed this was the "cat always transported to the middle of the screen" report, specifically the yard<->room switch case (re-entering the *same* scene already correctly preserved the cat's position - confirmed separately with a deterministic clock-driven harness, not live browser timing, which this environment cannot reliably simulate). `homePetMarkup()` used `enterScene()` - which always arrives at that scene's door, dead centre - for both the cat's first sighting each visit (intentional) and every later scene switch (not). The first sighting still arrives via the door; a later switch now uses `create()`, which excludes door anchors entirely. Verified live: four house/yard round-trips landed on five different resting spots, never the door. See the 2026-09-02 "no longer resets to the door" change log entry; cache is v226, `node --test` is 406/406.

14. ~~Give the yard a scene-painted way out, matching the way in.~~ **Done 2026-09-02.** Owner confirmed the missing-exit report (item 13's predecessor investigation) was a discoverability gap, not a bug, and asked for "a clickable spot in the scene like the entering to the house from the outside." Added `exitHotspot` to `home-room.js`'s yard scene, positioned over the foot of the yard's centre path - the one strip of ground with no garden slot on it at any row - rendered as a second `.home-house-hotspot` button reading "路地へ戻る", reusing the existing `data-home-map` attribute so no new click handler was needed. Verified live at 1280px and 375px: legible, symmetric with "家に入る", no overlap with garden beds. See the 2026-09-02 "painted way out" change log entry; cache is v227, `node --test` is 407/407.

15. ~~Give the room a scene-painted way back to the yard too.~~ **Done 2026-09-02.** Follow-up ask: "add clickable exit from inside of house to the yard" - the same asymmetry existed one level in, with only the corner "← 庭" text link. The interior's painting already shows the open veranda as "outside" (sliding door drawn open, garden visible through it), so `exitHotspot` was added there rather than at an invented landmark, reusing the existing `data-leave-house` attribute. Verified live at 1280px and 375px. See the 2026-09-02 "room now has a painted way back" change log entry; cache is v228, `node --test` is 408/408.

16. ~~Add a way to test past character selection and the Entrance without replaying them.~~ **Done 2026-09-02.** Owner asked for "the skip button so I can go through and test" after several rounds of testing features that sit past both gates. Added `?skip=1`, following the `?unlockall=1`/`?trees=N`/`?review=1` convention - a query flag rather than a visible in-game button, since a skip control a real player could find would undercut the project's own rule against progressing without demonstrating understanding. It only fills in what a fresh save would otherwise ask for; real progress past those gates is untouched. Verified live: a cleared save with `?skip=1` lands on the map after one click. See the 2026-09-02 "?skip=1 flag" change log entry; cache is v229, `node --test` is 409/409.

17. ~~Add a way to skip through the Inn's own questions for testing.~~ **Done 2026-09-02.** Follow-up: `?skip=1` got past the two gates but every Learn/Practice/Challenge question inside the Inn still had to be solved for real. Owner confirmed wanting both a per-question skip and a whole-stage skip. Added `#btn-skip-question` and `#btn-skip-stage`, hidden unless `?skip=1` is set, both going through `answerStage(true, ...)` - the same function a real correct answer calls - so a skip rewards and saves exactly as solving would. Needed a second fix found only by testing a genuine reload rather than a same-session leave-and-return: `enterLocation()`'s separate resume-a-stage rendering never ran `renderStagePrompt`, where the buttons' visibility was set, so a save reloading mid-stage kept them hidden. Fixed by setting the same toggle in both places. Verified live: skipping a question and skipping a whole stage (reaching "2/2, mastered" in one click) both worked, and the buttons still showed after a real `location.reload()` mid-stage. See the 2026-09-02 "skip controls" change log entry; cache is v230, `node --test` is 412/412.

18. ~~Extend the Inn's skip-question control to Episode 1.~~ **Done 2026-09-02.** Owner-reported: "episode 1 preview doesnt have skip function." Episode 1 answers through a second, separate function from the pre-episode stage's `answerStage()`, with its own previously-anonymous answer callback and no skip hook. Named the callback (`handlePreviewAnswer`), kept it on `previewState.answerHandler` with the correct value on `previewState.correctValue`, and had `skipCurrentQuestion()` check for `previewState` first. No whole-episode skip was added - an episode has no single "mastered" state the way a stage does, so `#btn-skip-stage` stays hidden throughout it. Verified live: skipping the episode's first question paid out and advanced to question 2 cleanly. See the 2026-09-02 "skip-question control now also works inside Episode 1" change log entry; cache is v231, `node --test` is 413/413.

19. ~~Audit the opening, the Inn and the home for style, UI and lesson presentation.~~ **Done 2026-09-03.** Walked the route at 1280x720 and 375x812 and measured rather than eyeballed. Seven fixes: the Entrance HUD crushed to 162px of 972px on desktop only (`.entrance-stage .stage-bar` never set `grid-column` under its own 12-column grid); `#inn-status` task feedback at 2.21:1 contrast; the NEW WORD card outranked by the HOW TO INTERACT box; the Entrance's three action poses at 34x62px where telling them apart is the question; Kon narrating in two differently-styled boxes; English chrome inside `lang="ja"`; and the home's duplicate exits. Three candidate findings were withdrawn after checking - the home scene's width cap is height management, the Inn's stacked fox is documented, and English operating instructions are a tested rule (`question-renderer.test.mjs`). Two need art and are in section B: one Kon in one style, and day variants of the shared night scenes. See the 2026-09-03 change log entry; cache is v236, `node --test` is 413/413.

20. ~~Check whether the learning method is actually effective.~~ **Done 2026-09-03, one fix applied.** `review-engine.js` implements spacing and retrieval correctly and refuses same-session credit, but had exactly one caller - the optional コンの稽古. Measured on a clean save: finishing the Inn's three days to mastery left `reviewProgress` empty, so the five words just taught were never scheduled and 「今日の復習」 had nothing to show. `scheduleReview()` now feeds the schedule from both story answer paths. Structural facts found while measuring, worth keeping in mind: each place is 40 questions with 40 distinct targets, so the story gives every word exactly one exposure and the schedule is the only thing that grants a second; `isUnlocked` gates the next place on 100% of the previous, and `stageMaterial` is exactly that place's own question targets, so the gate is reachable from the place's own content without external grinding. See the 2026-09-03 "story now feeds the review schedule" change log entry; cache is v237, `node --test` is 414/414.

21. ~~Design and build the best first-run experience for the Entrance and the Inn.~~ **Done 2026-09-03.** The Inn opened with three days of rehearsal for a shift the learner had never seen, nothing could be failed until the episode, and the game never said what the 灯り counter was for. A cold open now puts a guest in front of the learner the moment they take the job, asking for 揃える with every support withheld and nothing scored; Kon absorbs the outcome and Day 1 asks the same task again with support restored. The map explains its own lantern count until a real place is finished. The stage's closing line names tomorrow's review. Built as a `coldopen` phase reusing the existing render and answer path. See `docs/superpowers/specs/2026-09-03-first-run-experience-design.md`, the plan beside it, and the 2026-09-03 "first guest" change log entry; cache is v242, `node --test` is 423/423.


**The first-run redesign is on the branch and unproven.** `master` is deliberately left at the old opening (three days with no cold open) so the two can be compared. What would settle it is not another code pass: it needs real learners. The claim being tested is that failing 揃える unscaffolded, then being taught it, then doing the same task again makes the three days feel earned rather than imposed. The measurable versions of that are whether a first session is finished at all, and whether the learner comes back the next day now that the schedule genuinely holds five words for them. Neither can be measured from here.

### D. Settled - do not redo

- ~~Decide the delivery surface.~~ Settled 2026-08-27: the app is the product, the Artifact is retired. The audio run is no longer blocked by size.
- ~~Remove the two test controls.~~ Done 2026-08-29. They were the least visible things on the screen - navy ink on the dark stage bar, 1.04:1 - which is how they survived so long.

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
- **Bump `CACHE_VERSION` in `sw.js` on every shipped change.** It stamps `?v=` onto every script and stylesheet URL, which is the only thing that reliably defeats both caches. A test ties the two together, so forgetting fails the suite. `pwa.test.mjs` no longer pins the literal version - it used to, and every bump broke it.
- **Do not verify through the built artifact.** That advice was written when the Artifact was the delivery surface; it is retired, and the build is now a cut-down demo. Verify against the served app, and read section 2 first - the service worker will hand you a stale shell, or even `index.html` in place of a URL it does not recognise, which looks exactly like a broken build.
- **Prefer a test that renders over a test that matches source text.** `walkthrough.test.mjs` exists because a source-text suite passed while the game crashed.
- **Check that a catalog id exists before using it as a target.** Eleven invented ids reached a draft in one sitting.
- **Keep this file current.** On every change, update the affected sections *and* add an entry stating the reason, not just the edit.
- **New change-log entries go at the top of [CHANGELOG.md](CHANGELOG.md), as `###` headings.** Not in this file at all. The log lived in section 9 until 2026-08-31, when it reached 2238 lines - 81% of the handoff - and a reader met two thousand lines of history before reaching what still needed doing. Section 9 is now a pointer.

  Every wrong place has already been used, more than once: four entries collected above section 0, where a reader meets history before status; three were appended past section 15; nine accumulated inside section 0; and one arrived as a `## 2026-08-31` heading, which made it a section of the document named after a date, sitting past the build log and invisible to the `grep "^## "` that is how anyone orients in a long file.

  The test is simple: **a `##` heading makes a section, a `###` makes an entry.** If your change note creates a new `##`, it is in the wrong place - and if it lands in PROJECT-HANDOFF.md at all, it is in the wrong file.

- **Sections 0, 6, 10 and 11 describe the present tense and go stale silently**, so if a change makes one of them untrue, fixing it is part of the change. Section 0 in particular is not a log: it held a status four cache versions out of date within a day of being written, and has had to be emptied twice.
- Remember that editing the local file does not update the desktop shortcut. See section 8.
- Do not claim full N2 coverage. The project covers its own named vocabulary catalog.

## 13. Sharing checklist

1. Include the entire `IJLG` folder.
2. Keep the relative paths under `assets`, `research` and `docs` unchanged.
3. Ask the recipient to open `PROJECT-HANDOFF.md` first.
4. Ask them to run the automated test command before making changes.
5. Remind them that browser progress is separate from the folder.
### 2026-08-27 - Persistent player choice and illustrated Inn scene set

New games now open a two-card character chooser after `路地へ入る`. The existing man and the new blonde woman in a burgundy kimono each use a four-pose sheet; the choice is saved as `playerCharacter` in `lanternAlley.v3`, drives every learner pose, and is cleared by `最初から`. Existing saves migrate to the man so returning learners are not interrupted.

The seven approved Inn images are now production assets under `assets/inn/scenes/`: guest room, lobby, kitchen, dining hall, hallway, office and courtyard. Training and episode questions select the matching setting from their action and Japanese context; the wood-and-washi learning and answer panels remain readable over the illustrated background. Offline cache is `lantern-alley-v102`.

`lantern-alley-artifact.html` was rebuilt at 14.44 MB. Bare `node --test` passes 264 of 264 tests; `app.js` passes `node --check`.

Follow-up verification found that old saves were silently assigned the man, which skipped the chooser. Selection now carries a separate `characterSelected` confirmation flag: any save that never explicitly chose opens the chooser once, while a confirmed choice persists. A rendered DOM walkthrough clicks Woman, confirms the Entrance opens, confirms the saved record, and confirms the woman pose sheet is actually rendered. Cache is `lantern-alley-v102`; 264 of 264 tests pass.

### 2026-08-27 - Character and Inn questions now blend into their scenes

The oversized cream character cards were removed. Character choice now sits as a compact translucent bottom dock over the wooden gate, with Kon and a Japanese request; both figures stand directly against the scene. The woman's four-pose production sheet was normalized 12% larger so her rendered scale matches the man instead of appearing undersized.

Moonview Inn now follows the Entrance composition on training questions and episode screens: the generated 3:2 setting remains visible, the full-height brown columns are gone, and the narration, dialogue, controls and illustrated object room sit in compact bottom docks. The scene image is no longer buried behind opaque panels. Mobile collapses the two docks into a single readable column.

Artifact rebuilt at 14.88 MB, cache `lantern-alley-v103`, and 266 of 266 tests pass.

### 2026-08-27 - Inn episode opening dock alignment

The episode opening no longer places a narrow tall Kon box at the far left and an unrelated paper card in the middle of the room. At desktop widths, the dialogue and episode action now form one 7/5 bottom dock with a shared baseline, 226px height, matching translucent wood, compact internal padding and a wider speech measure. The episode paper is reduced to the dock's inner surface instead of floating over the scene. Phone layouts stack the same two dock sections without shrinking their text. Artifact is 14.88 MB, cache `lantern-alley-v104`, and 267 of 267 tests pass.

### 2026-08-27 - Three-life HUD removed

The three hearts and their decreasing display were removed from the shared HUD. Wrong answers still receive contextual feedback and retry normally; no visible life counter or life-loss state remains. Stars and course progress are unchanged. Artifact is 14.88 MB, cache `lantern-alley-v105`, and 268 of 268 tests pass.

## 14. Open language data we can draw on

Recorded by the owner on 2026-08-27. Several of these answer gaps this project has been carrying, so each one below is written next to the gap it would close rather than as a bare list. **None of it has been evaluated, downloaded or licence-checked yet** - treat every line as a lead, and confirm the licence and its attribution terms before any of it ships.

### Vocabulary and dictionary

- **JMdict / EDICT2** - the standard Japanese-English dictionary. Already used informally in this project to check word senses by hand; not shipped.
- **NINJAL frequency lists** - word frequency from Japan's National Institute for Japanese Language and Linguistics.

*The gap these close.* The catalog holds only the OpenJLPT N2 and N3 lists, whose provenance is incomplete - the exact upstream commit was never recorded (section 10). It also means the tap-to-read aid has no entry for ordinary words: 部屋 and 夕食 stay plain because they are below N3. A real dictionary would fix both, and frequency data would give a defensible order to teach in, which the round-robin partitioning currently has no basis for.

### Kanji

- **KANJIDIC2** - readings, meanings and JLPT levels for 13,000+ kanji.
- **KanjiVG** - vector stroke data, correct stroke order.
- **KanjiAPI.dev** - a REST API over Kanjidic2 and KanjiVG, clean JSON.

*The gap these close.* "No grammar or kanji catalog has been approved, so the project may claim coverage only of its named vocabulary catalog" has been in this document since the start. KANJIDIC2 is the missing kanji catalog. KanjiVG would make stroke order teachable, which nothing in the game does today. Note that KanjiAPI is a network service: the game is offline-first and the artifact has no network at all, so it is a build-time source, not a runtime one.

### Example sentences

- **Tatoeba** - large open multilingual sentence database.

*The gap this closes.* The catalog's example sentences come from the OpenJLPT copy of Tatoeba and three of them do not contain their own headword. Going to the source directly would let those be replaced rather than filtered out, and would give the generated cloze practice far more to work with.

### Pitch accent

- **Kanjium pitch accent database** - high/low patterns.
- **Hatsuon / Japanese-Pitch-Accent-Resources** - rendering libraries.

*The gap this closes.* Nothing in the game teaches pitch at all. This would be new ground rather than a repair.

### Grammar

- **Community Anki decks** - e.g. an "Ultimate JLPT Grammar Deck" converted to JSON or CSV.
- **Tae Kim's Grammar Guide** - free and open.

*The gap these close.* The other half of the missing-catalog problem. The authored 文の組み立て and 文章の文法 items were written by hand against no grammar list, so there is no way to say what grammar the course covers or what it leaves out. Community decks vary in quality and licence, so this is the entry on the list needing the most care.

### Audio and pronunciation

- **Yomitan audio packs** - native audio mapped to JMdict word IDs.
- **Kokoro Speech Dataset** - public domain, 43,000+ clips.
- **Open-source TTS** - Kokoro TTS, VITS and similar, for generating audio locally.

*The gap these close.* This is the live one. 506 of the course's 620 spoken lines have no clip, and the run has been deferred because Edge TTS is an external service and because the audio does not fit the Artifact's 16 MB ceiling (section 0). A local open TTS model removes the external-service question entirely - nothing leaves the machine, so the approval gate that currently blocks each run disappears. It does not solve the size problem: that is still a delivery-surface decision.

Word-level audio mapped to JMdict IDs is a different thing from what the game needs, which is whole spoken sentences. It would suit the vocabulary practice layer rather than the episodes.

### Before using any of it

1. Confirm the licence and what attribution it requires, and record it here. The project already carries one provenance failure and should not add another.
2. Prefer build-time ingestion over runtime calls. The game is offline-first, and the artifact cannot reach the network at all.
3. Record the exact version, commit or release used, in `research/`, next to the data.
4. Check the size cost before committing to anything that ships inside the artifact.

## 15. Home and garden build log (tasks 1-3)

Written by the session that built the first three tasks of the home-and-garden plan, and left below section 14 rather than in the change log. Kept as-is because it records asset decisions - which supplied images were used, which were rejected and why - that nothing else captures. The narrative summary of the same work, and of tasks 4 to 8, is in [CHANGELOG.md](CHANGELOG.md).

### 2026-08-28 Visual foundation

- Added `LanternHomeRoom.scenes()` with a raster yard, eight percentage-positioned garden slots, a house hotspot, and the existing interior slots. `slots()` remains the interior compatibility API and `baseRoomSvg()` remains temporarily.
- Production assets: generated `starter-house-yard-v1.webp` and four camellia growth stages; converted supplied `imgi_76_1787837606.png` to `starter-room-v1.webp`; extracted supplied `imgi_71_1787837436.png` as `floor-cushion-navy-v1.png`.
- Rejected `imgi_68_1787837260.png` as a production growth asset because it is a montage, not four clean movable stages. No supplied yard or complete camellia set matched the required roles.
- Reason: later home UI work needs layered raster scenes and stable authored coordinates instead of the inline SVG room.
- Verification evidence is recorded in `.superpowers/sdd/2026-08-28-home-garden-rewards/task-1-report.md`.
- Verified: `node --test home-decor.test.mjs` passes 13/13, `node --check home-room.js` passes, and every final raster decodes with the expected RGB/RGBA mode.
- Updated the obsolete map test that prohibited raster room art. The approved production model is now a raster background plus separately movable slot assets, not a flat photographed room.
- Review correction: regenerated the yard and all camellia stages in a softer painted storybook treatment with an elevated ground-plane perspective, then strengthened slot, hotspot, bounds, and clone-isolation tests.
- Full regression verification after review correction: `node --test` passes 319/319 and `node --check home-room.js` passes.
- Independent Task 1 review verdict: APPROVED. The next implementation unit is the immutable garden state engine.
- Task 2 immutable garden engine independently approved after regression fixes; full suite passes 333/333. Progress migration and persistence are next.

### 2026-08-28 - Pure garden state engine

- Added `LanternHomeGarden`, a pure immutable state engine for the eight approved plant types, starter claims, repeatable purchases with unique instance ids, yard placement, movement, storage, learning growth, animation acknowledgement, and maturity progress.
- Garden placement accepts only authored `garden` slots and refuses missing or occupied destinations without changing ownership, position, or growth.
- Lesson credit ids are recorded once. Replays grant zero points, stored and mature plants do not grow, and a first-time mastery bonus adds at most one extra point.
- The free starter is a camellia. An existing camellia blocks a duplicate starter while recording the claim for migrated state.
- Task 2 verification evidence and self-review are recorded in `.superpowers/sdd/2026-08-28-home-garden-rewards/task-2-report.md`.
- Review correction: growth stages now use ordered, exhaustive thresholds, so positive shrub and tree points cannot regress from `sprout` to `planted`. Two-point mastery bonuses derive the final stage and set `pendingAnimation` whenever they cross a stage boundary.
- Regression coverage walks every growth point and every two-point bonus boundary for camellia, hydrangea, and pine.

### 2026-08-28 - Home and garden progress persistence

- Progress now defaults and migrates `houseTier`, tutorial completion, both starter claim flags, active wallpaper, and the complete garden state.
- Migration preserves legacy money, home ownership, and interior placement, including v3-shaped records that predate the `stages` field.
- Home and garden nested records are deep cloned. Existing camellia and starter cushion ownership mark the matching claim as complete so later tutorial work cannot duplicate rewards.
- `app.js` now carries these values through pending load state, null reset, runtime hydration, and save output. Both v3 and migrated v2 load paths hydrate the reward fields.
- The persisted garden schema follows the completed Task 2 engine: `plants`, `usedCreditIds`, `starterClaimed`, and `nextInstanceId`. This replaces stale field names in the original Task 3 plan.
- Verification evidence is recorded in `.superpowers/sdd/2026-08-28-home-garden-rewards/task-3-report.md`.
- Verified: `node --check app.js` exits 0; focused tests pass 34/34; full `node --test` passes 336/336.

### 2026-08-28 - Free home decoration implementation

- Replaced the fixed eight-bed yard with a neutral open yard and 24 invisible placement points while preserving the old eight slot ids for saved games.
- Added removable starter pine and maple scenery, clear-yard and restore-starter-layout actions, expanded room placement points including the tokonoma, and automatic or manually selected time-of-day lighting. Lighting is cosmetic and never changes learning or growth.
- Desktop home scenes retain their 16:9 coordinate system but cap their size against short viewports so the scene controls remain visible on common laptop screens.
- Cache and asset references are version 143. The artifact rebuild inlined 24 scripts, one stylesheet, and 148 images at 14.11 MB. Full regression passes 343/343; the rebuilt-artifact walkthrough passes 46/46. Browser checks at 1280x720, 390x844, and 320x640 found no console warnings/errors or horizontal overflow; clear/restore changed visible yard plants 2 -> 0 -> 2.

### 2026-08-28 - Home chrome merged into the scenes

- Removed the separate home header and redundant location line. Back, stars, and money now sit in a compact translucent strip inside both yard and room artwork.
- Lighting, reset actions, and Yard/Shop or Storage/Wallpaper/Shop tabs now share one bottom scene overlay on desktop. On phones the same controls remain directly attached below the artwork for readability.
- The room's scene-integrated back control returns to the yard; the yard's returns to Lantern Alley, removing the covered duplicate room button. Cache and shell queries are version 145. Full regression passes 343/343; the rebuilt artifact is 14.11 MB. Browser checks at 1280x720 and 390x844 found no console warnings, errors, or horizontal overflow, and confirmed the mobile control panel begins exactly below the artwork.

### 2026-08-28 - Separate shop and explicit decoration mode

- Home lighting now always follows local time; manual lighting controls and state were removed.
- Yard and room use a clear `飾る` / `店` menu. The clean scene hides inventory until `飾る` is selected; room inventory and valid placement interaction then become available.
- `店` now opens a separate illustrated `灯り屋` stage with 草花, 家具, and 壁紙 categories, wallet display, owned/price states, purchases, and a return to the exact home scene it came from.
- Cache and shell queries are version 146. New interaction tests were observed failing first, then passed. Full regression passes 346/346 and the rebuilt artifact is 14.33 MB. Browser QA at 1280x720 and 390x844 confirmed the shop replaces the yard, the clean room hides inventory until `飾る`, automatic lighting has no manual controls, and no console errors or horizontal overflow occurred.

### 2026-08-28 - Home menu dock correction

- The home menu now uses the same dark translucent material as the scene's top bar, spans the scene width, and attaches to its bottom edge instead of floating as a narrow dialog.
- Yard reset actions moved from the permanent menu into a compact `•••` overflow control. The tutorial panel attaches directly below the scene composition; the frame remains content-sized so it does not create an empty internal floor on tall windows.
- Cache and shell queries are version 148. The overflow behavior test was observed failing first and then passed. Full regression passes 347/347 and the rebuilt artifact is 14.34 MB. Browser QA at the reported 1114x947 viewport measured the menu bottom and scene bottom within 0.4 px, the tutorial starting at the same edge, no horizontal overflow, and no console warnings or errors.

### 2026-08-30 - User working preference

- Keep reasoning effort at the maximum available level. Recover efficiency through concise output, batched tool calls, reused evidence, and avoiding repeated checks - never by reducing analysis quality, care, or verification.
- This preference follows a Codex desktop crash that consumed about 40% of the user's usage before the active reward-size audit produced its requested result.

### 2026-08-30 - Reward scale and placement audit completed

- Root cause: reward widths controlled the full image or SVG box, but several fallback drawings occupy only 20-67% of that box. This made the brazier, fan, mask, teapot, books, and sill plant visibly tiny even when their CSS widths looked reasonable.
- Added per-item width, vertical anchor, vertical scale, and vertical offset calibration. The rug is flattened into the floor plane, the wind chime hangs from the opening, and padded vector rewards now have useful visible size.
- Moved the window slot into the visible left opening and moved the tokonoma slot to the back-floor side alcove so small objects no longer float on wall panels.
- Mature sakura and maple now read as trees rather than bonsai. Hydrangea, iris, chrysanthemum, and the lantern-flower bed received species-appropriate scene widths. Their simple vector art remains temporary, but its scale is now coherent.
- Cache and local asset references are version 185. Full regression passes 380/380; JavaScript syntax and `git diff --check` pass. Browser verification at 1280x720 and 390x844 found no console warnings/errors or horizontal overflow. All five mobile floor targets remain 44x44 px, inside the scene, and separately reachable.
- No commit or push was performed.
