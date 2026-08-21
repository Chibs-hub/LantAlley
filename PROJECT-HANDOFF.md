# Lantern Alley Project Handoff

Last updated: 2026-08-21

## 1. Project summary

Lantern Alley is a local, browser-based Japanese language learning game. The player explores a small map, listens to Japanese dialogue, and answers by acting inside a scene rather than by picking a vocabulary card.

The current build is a focused prototype. It contains:

- Alley Entrance: introductory fox dialogue and bow interaction.
- Moonview Inn: the first N2-focused learning stage.
- Five N2 action words, each answered by a physical or social action.
- Learn, Practice, Challenge, focused review, medals, and saved progress.

The project is not a complete JLPT N2 course. Only the first N2 stage is implemented.

## 2. How to run the game

No installation or package manager is required.

1. Open `index.html` in Microsoft Edge, Google Chrome, or another modern browser.
2. Select `Enter the Alley`.
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

Moonview Inn teaches these five N2 words:

| Word | Meaning used in the game | How the player answers |
| --- | --- | --- |
| 揃える | make uniform along some attribute | Group the cushions by the attribute the sentence names (色 / 大きさ). |
| 代える | replace one thing with another | Put the named worn item in the bin, then its fresh counterpart in the fitting. Order matters. |
| 温める | warm something deliberately | Move the named dish to the appliance the request names (コンロ / 電子レンジ). One action. |
| 調整 | reconcile several conditions | Read the times from the Japanese only, set the schedule, confirm. |
| 引き受ける | undertake, accept responsibility | Choose the reply that takes the job on. The reply is the whole answer. |

Each harder item carries one close N2 near-miss, used for feedback when the player acts wrongly:

- 揃える versus 揃う (the items come to match by themselves).
- 代える versus 代わる (something takes another's place).
- 温める versus 温まる (something becomes warm).
- 調整 versus 調節 (controlling a degree, such as temperature).
- 引き受ける versus 引き止める (stopping someone from leaving).

### The shared room

`揃える`, `代える` and `温める` all render one identical room:

- 4 cushions varying in colour, size and facing, plus 2 unlabelled mats.
- A used towel and a burnt-out bulb, each beside a fresh one, plus a bin and a fitting.
- Cold tea, soup and rice, plus a stove and a microwave.

Ten draggable objects, five drop zones, every time. Dropping a cushion on a mat is 揃える; a worn item in the bin is 代える; a dish on the named appliance is 温める. Performing the wrong one gives "That is a different action from the one the request asked for."

The three attributes of the cushions are deliberately crossed, so grouping by colour, by size and by facing all produce different answers. Facing is never asked for; it exists so the correct grouping cannot be guessed.

### Learning phases

- Learn: 5 guided encounters, one per target word, full Japanese sentence shown.
- Practice: 10 interleaved encounters, two situations per word. The target verb is blanked (`＿＿`) but the disambiguating noun stays visible.
- Challenge: 10 audio-focused encounters. Romaji, English meaning and hints are hidden.
- Mastery: at least 8 of 10 correct, with all five target words answered correctly at least once.
- Focused review: missed words return before the player retries the Challenge.
- Correct answers advance automatically after about 1.1 seconds.

## 5. Progress and scoring

Progress is stored in browser `localStorage` under the key `lanternAlley.v2`, holding visited and starred locations, the Moonview Inn phase and encounter position, challenge score, correct target words, misses, mastery and medal.

Medals: Bronze at Practice, Silver at Challenge or focused review, Gold at Challenge mastery.

Important: browser progress is not part of the project folder. Copying or zipping the folder transfers the game code, not a player's saved progress.

## 6. Main files

| File or folder | Purpose |
| --- | --- |
| `index.html` | Page markup only. Loads styles.css and the five scripts. |
| `styles.css` | All styling. |
| `app.js` | Application: map, controller, speech, progress, scene rendering, SVG icons, drag-and-drop. |
| `n2-home-inn-stage.js` | Moonview Inn content: the shared `ROOM` definition, per-encounter requirements, Japanese sentences, near-miss explanations, phase rules, mastery rules. |
| `moonview-inn-interactions.js` | Pure state engine for the five interactions. Node-testable, no DOM. |
| `entrance-stage-logic.js` | Alley Entrance fox pose and dialogue behavior. |
| `build-artifact.py` | Builds `lantern-alley-artifact.html`: inlines CSS, all five scripts and every local image or audio clip. |
| `optimize-fox-poses.py` | Regenerates `assets/fox/*.webp` from the full-size masters. |
| `manifest.webmanifest` | PWA manifest: name, icons, standalone display. |
| `sw.js` | Service worker. Pre-caches the app shell for offline play. |
| `generate-audio.py` | Renders every spoken line to MP3 with a neural voice. Re-run after changing any Japanese. |
| `collect-spoken-lines.js` | Collects spoken Japanese from the Entrance and Moonview Inn for audio generation. |
| `audio-index.js` | Generated. Maps each line to its clip; imported by both the page and `sw.js`. |
| `assets/audio/` | Generated MP3 clips, named by hash of the sentence. |
| `icons/`, `make-icons.py` | PWA icon set and the script that regenerates it. |
| `assets/fox/`, `assets/kon/` | Web-sized WebP images the app actually loads. |
| `lantern-alley-artifact.html` | Generated. Do not edit by hand; it is overwritten by the build script. |
| `assets/fox-poses/` | Full-size PNG masters. Not loaded by the app. |
| `research/` | N5-N2 vocabulary source files and the extraction script. |
| `*.test.mjs` | Automated behavior and regression tests. |
| `docs/superpowers/` | Design and implementation planning documents. Note these predate the redesign in section 9 and describe the older tag-matching mechanics. |

## 7. Testing and verification

Run all automated tests from PowerShell in the project folder:

```powershell
node --test moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs entrance-stage.test.mjs pwa.test.mjs
```

Current verified result: 78 tests passed, 0 failed.

Beyond the mechanics, the tests now guard the design rule itself:

- The arrange scene never states its own grouping rule, and the mats carry no answer label.
- The grouping attribute exists only in the Japanese sentence, and all three cushion axes genuinely vary.
- All object-moving encounters share one identical room, and all three verbs occur over it.
- Practice narration describes evidence without naming the required English action. This test has already caught a real leak, where a narration used the word "replacement".
- Encounter titles are story beats and never contain an action verb.
- The Learn phase narrations run in story order.
- Every spoken Entrance tutorial line has a pre-rendered audio clip, so it cannot silently fall back to a device voice.
- The game screen keeps learning context and answer controls in separate adaptive regions, with a split desktop workspace and sticky mobile request.

## 8. Publishing to the Artifact

The desktop shortcut points at a published Claude Artifact, not at the local file. The two are separate: editing the source files does **not** update the shortcut until the artifact is republished.

To republish:

1. Run `python build-artifact.py` to regenerate `lantern-alley-artifact.html`.
2. Publish that file to the existing artifact URL, passing the URL so it updates in place rather than creating a second artifact.

Current artifact: `https://claude.ai/code/artifact/951c7147-1dcf-4b9d-aced-2928ce94eb74`

An artifact cannot load sibling `.js` files or local images, which is why the build step inlines everything.

## 9. Change log and reasons

Newest first. Each entry records why the change was made, because the reasoning is harder to recover than the code.

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

- Only Alley Entrance and Moonview Inn are active.
- The game does not cover all N2 vocabulary.
- **Japanese still needs a native-speaker review before release.** The two known errors are fixed (see section 9). One open question remains: `代える` is used for swapping a towel or bulb, where `取り替える` is more idiomatic.
- 引き受ける is the one word not answered through the shared room; it is a spoken reply. Extending the shared-scene principle to it and to 調整 is listed in section 11.
- Cushion grouping uses red versus blue as one axis. Size and facing also distinguish every cushion and `aria-label` spells out 赤/青, but a colour-blind-safe palette would be better.
- The icons are simple hand-drawn SVG line art, intended as placeholders until real illustrations are produced.
- Browser speech synthesis varies by machine and may be unavailable without a Japanese voice installed.
- Player progress cannot be exported or imported.
- The project is not initialized as a Git repository.
- `docs/superpowers/` describes the superseded design.

## 11. Recommended next work

1. Native-speaker review of all Japanese, prioritising the doubts listed in section 10.
2. Replace the placeholder SVG icons with real illustrations.
3. Extend the shared-room principle to 調整 and 引き受ける, so all five verbs compete over one scene.
4. Initialize Git before multiple people edit the project.
5. Add a player progress export and import feature.
7. Select the next small group of manually reviewed N2 words from the research CSV.
8. Add end-to-end browser tests covering every mechanic and mobile screen sizes.

## 12. Handoff rules for the next developer or AI session

- **Keep this file current.** On every change, update the affected sections and add a change-log entry in section 9 stating the reason, not just the edit.
- Never let the scene, a label, or the object set reveal the answer. See section 3.
- Do not show a highlighted answer zone or exact target value before the player acts.
- Explain control operation separately from the language problem.
- Practice must not display the target word or name the required English action.
- Challenge must remain audio-focused.
- Every harder item should carry exactly one relevant close N2 near-miss with specific feedback.
- Add or update tests before changing interaction behavior. Prefer tests that guard the design rule, not just the mechanics.
- Do not claim full N2 coverage based on the automated candidate CSV.
- Remember that editing the local file does not update the desktop shortcut. See section 8.
- Do not commit, push, publish, or deploy without the project owner's approval.

## 13. Sharing checklist

1. Include the entire `IJLG` folder.
2. Keep the relative paths under `assets`, `research` and `docs` unchanged.
3. Ask the recipient to open `PROJECT-HANDOFF.md` first.
4. Ask them to run the automated test command before making changes.
5. Remind them that browser progress is separate from the folder.
