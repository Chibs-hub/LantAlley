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
| 暖める | warm something deliberately | Drag the named dish onto the stove. One action, nothing else. |
| 調整 | reconcile several conditions | Read the times from the Japanese only, set the schedule, confirm. |
| 引き受ける | undertake, accept responsibility | Choose the reply that takes the job on. The reply is the whole answer. |

Each harder item carries one close N2 near-miss, used for feedback when the player acts wrongly:

- 揃える versus 整う (something becomes arranged).
- 代える versus 代わる (something takes another's place).
- 暖める versus 暖まる (something becomes warm).
- 調整 versus 調節 (controlling a degree, such as temperature).
- 引き受ける versus 引き止める (stopping someone from leaving).

### The shared room

`揃える`, `代える` and `暖める` all render one identical room:

- 4 cushions varying in colour, size and facing, plus 2 unlabelled mats.
- A used towel and a burnt-out bulb, each beside a fresh one, plus a bin and a fitting.
- Cold tea and cold soup, plus a stove.

Ten draggable objects, five drop zones, every time. Dropping a cushion on a mat is 揃える; a worn item in the bin is 代える; a dish on the stove is 暖める. Performing the wrong one gives "That is a different action from the one the request asked for."

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
| `index.html` | Page markup only. Loads styles.css and the four scripts. |
| `styles.css` | All styling. |
| `app.js` | Application: map, controller, speech, progress, scene rendering, SVG icons, drag-and-drop. |
| `n2-home-inn-stage.js` | Moonview Inn content: the shared `ROOM` definition, per-encounter requirements, Japanese sentences, near-miss explanations, phase rules, mastery rules. |
| `moonview-inn-interactions.js` | Pure state engine for the five interactions. Node-testable, no DOM. |
| `entrance-stage-logic.js` | Alley Entrance fox pose and dialogue behavior. |
| `build-artifact.py` | Builds `lantern-alley-artifact.html`: inlines CSS, all four scripts and every local image. |
| `optimize-fox-poses.py` | Regenerates `assets/fox/*.webp` from the full-size masters. |
| `manifest.webmanifest` | PWA manifest: name, icons, standalone display. |
| `sw.js` | Service worker. Pre-caches the app shell for offline play. |
| `generate-audio.py` | Renders every spoken line to MP3 with a neural voice. Re-run after changing any Japanese. |
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

Current verified result: 66 tests passed, 0 failed.

Beyond the mechanics, the tests now guard the design rule itself:

- The arrange scene never states its own grouping rule, and the mats carry no answer label.
- The grouping attribute exists only in the Japanese sentence, and all three cushion axes genuinely vary.
- All object-moving encounters share one identical room, and all three verbs occur over it.
- Practice narration describes evidence without naming the required English action. This test has already caught a real leak, where a narration used the word "replacement".
- Encounter titles are story beats and never contain an action verb.
- The Learn phase narrations run in story order.

## 8. Publishing to the Artifact

The desktop shortcut points at a published Claude Artifact, not at the local file. The two are separate: editing the source files does **not** update the shortcut until the artifact is republished.

To republish:

1. Run `python build-artifact.py` to regenerate `lantern-alley-artifact.html`.
2. Publish that file to the existing artifact URL, passing the URL so it updates in place rather than creating a second artifact.

Current artifact: `https://claude.ai/code/artifact/951c7147-1dcf-4b9d-aced-2928ce94eb74`

An artifact cannot load sibling `.js` files or local images, which is why the build step inlines everything.

## 9. Change log and reasons

Newest first. Each entry records why the change was made, because the reasoning is harder to recover than the code.

### 2026-08-21 - Pre-rendered neural audio replaces device speech synthesis

All 36 spoken lines are now MP3s rendered with `ja-JP-NanamiNeural` via `edge-tts` (free, no API key). `generate-audio.py` regenerates them; clips are named by a hash of the sentence, so re-running only renders lines that actually changed.

Why this mattered more than it sounds:

- **The Challenge phase is audio-only.** If the device has no Japanese voice, that phase was not degraded, it was unplayable. iOS Safari frequently has none and additionally requires a user gesture before `speechSynthesis` will make a sound.
- **Pronunciation is the product.** Device voices vary from decent to robotic; a language app cannot teach a pronunciation that changes per phone.

`speak()` now tries the clip first and falls back to `speechSynthesis` when a line has no clip, or when autoplay is blocked. Nothing breaks if a clip is missing.

`audio-index.js` assigns to `self`, not `window`, so `sw.js` can `importScripts()` the same file to build its pre-cache list. The audio paths therefore have one source of truth rather than being copied into the worker by hand. All 36 clips are cached; audio works offline.

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
- **Japanese needs a native-speaker review before release.** Specific known doubts: `暖める` is used for tea and food, where `温める` is conventional; and the 揃える near-miss is `整う`, though the true transitive/intransitive pair is `揃う`.
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
