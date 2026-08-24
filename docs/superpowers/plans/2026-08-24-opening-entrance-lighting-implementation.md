# Opening, Entrance, and Lighting Implementation Plan

Status: Implemented and verified on 2026-08-24

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy opening and Entrance presentation with the approved cinematic alley UI, correct the learner bow, and add decisive bulb off/on feedback.

**Architecture:** Reuse the existing alley and transparent Kon assets. Keep lesson state in the existing pure logic modules, expose room-light presentation through a small pure helper, and let `app.js` translate those states into semantic classes consumed by CSS. Preserve all answer and dialogue behavior while replacing only presentation and motion.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node test runner, service worker, generated standalone HTML.

**Spec:** `docs/superpowers/specs/2026-08-24-opening-entrance-lighting-redesign.md`

## Global Constraints

- Japanese is the primary interface language; only `HOW TO INTERACT` remains English.
- Do not change stage order, scoring, answer correctness, or click-to-finish dialogue behavior.
- Do not add a second step after the decisive bulb installation action.
- Reuse project-owned artwork and existing transparent Kon poses.
- Support desktop, 390-pixel phone, 320-pixel phone, and `prefers-reduced-motion`.
- Update `PROJECT-HANDOFF.md` at every production checkpoint.
- Do not commit, push, publish, or deploy without explicit approval.

---

### Task 1: Cinematic opening

**Files:**
- Modify: `entrance-stage.test.mjs`
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: existing progress fields `state.visited`, `visitedCount()`, and `starCount()`.
- Produces: `#screen-title.title-scene`, `#title-progress`, Japanese entry labels, and adaptive title styling.

- [ ] **Step 1: Add failing opening-contract tests**

Add assertions that require `title-scene`, `言葉の路地`, `LANTERN ALLEY`, `路地へ入る`, a project-owned map background, a compact progress region, and removal of the long legacy English lede.

- [ ] **Step 2: Run the focused red test**

Run:

```powershell
node --test entrance-stage.test.mjs
```

Expected: failure on missing cinematic opening markup and Japanese action copy.

- [ ] **Step 3: Implement the opening shell and progress copy**

Replace the old brand-mark/lede block with semantic scene layers:

```html
<section id="screen-title" class="frame title-scene">
  <div class="title-scene-shade" aria-hidden="true"></div>
  <div class="title-copy">
    <p class="title-kicker">Japanese story adventure</p>
    <h1 class="jp">言葉の路地</h1>
    <p class="title-english">LANTERN ALLEY</p>
  </div>
  <img class="title-kon" src="assets/fox/fox-neutral-idle.webp" alt="コン">
  <div class="title-entry-panel">
    <div id="progress-note" class="progress-note" hidden></div>
    <button class="btn btn-primary" id="btn-start">路地へ入る</button>
    <button class="btn btn-ghost" id="btn-restart" hidden>最初から</button>
  </div>
</section>
```

Update `app.js` so returning copy is compact Japanese, the primary action becomes `路地へ戻る`, and restart/reset restores `路地へ入る`.

- [ ] **Step 4: Add adaptive scene styling**

Use `assets/map/lantern-alley-map-v1.jpg` as a full-bleed background with a dark legibility gradient. Keep Kon, title, and one primary action above the fold; stack them without horizontal overflow below 620 pixels.

- [ ] **Step 5: Run focused tests and update the handoff**

Run `node --test entrance-stage.test.mjs`. Record the red/green result and exact opening behavior in `PROJECT-HANDOFF.md`.

---

### Task 2: Dedicated Entrance scene and correct bow

**Files:**
- Modify: `entrance-stage.test.mjs`
- Modify: `entrance-stage-logic.js`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: `LanternAlleyLogic.getTutorialStep(state)` and existing `answerDuoAction(key, loc)`.
- Produces: `LanternAlleyLogic.getTutorialProgress(state) -> {current:number,total:3}`, `.entrance-stage`, `.entrance-actions-visible`, and the corrected `.action-bow` motion.

- [ ] **Step 1: Add failing Entrance-state and motion tests**

Require `getTutorialProgress()` to map greeting/world/request to 1/2/3 and complete to 3/3. Require a dedicated Entrance scene class, `HOW TO INTERACT` outside the dialogue, action visibility tied to the request, stable leg markup outside `.player-upper-group`, a hip-origin transform, a 25 to 30 degree bow, timing near 1.2 seconds, and reduced-motion handling.

- [ ] **Step 2: Run the focused red test**

Run `node --test entrance-stage.test.mjs` and confirm failure occurs only on the new Entrance presentation contract.

- [ ] **Step 3: Implement testable tutorial presentation state**

Add:

```javascript
function getTutorialProgress(state){
  var index = Math.max(0, Math.min(3, Number(state && state.index || 0)));
  return {current:Math.min(3, index + 1), total:3};
}
```

Export it from `LanternAlleyLogic`. In `app.js`, toggle Entrance-specific classes when `state.currentKey === "entrance"`, render the progress label, and keep actions hidden until the request step.

- [ ] **Step 4: Correct the learner motion**

Keep the existing legs outside `.player-upper-group`. Set the upper group origin at the hips and replace the 0.9-second 38-degree rotation with a roughly 1.2-second, 28-degree bend, brief hold, and return. Keep the legs still and add an instant/reduced path under `prefers-reduced-motion`.

- [ ] **Step 5: Build the adaptive Entrance composition**

Use the alley image as the scene, position Kon and the learner together, keep the dialogue shelf along the lower scene edge on desktop, and stack dialogue then actions below the visual on phones. Preserve 44-pixel controls and current global dialogue click routing.

- [ ] **Step 6: Run focused tests and update the handoff**

Run `node --test entrance-stage.test.mjs`. Record the corrected state, motion, and responsive contract in `PROJECT-HANDOFF.md`.

---

### Task 3: Bulb off/on visual feedback

**Files:**
- Modify: `moonview-inn-interactions.js`
- Modify: `moonview-inn-interactions.test.mjs`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: replacement state `{mechanic, removed, installed, done}` and encounter target.
- Produces: `MoonviewInnInteractions.getRoomLightState(state, target) -> "dim" | "bright" | "normal"` and `.room-light-dim` / `.room-light-bright` viewport classes.

- [ ] **Step 1: Add failing light-state tests**

Test these exact cases:

```javascript
assert.equal(logic.getRoomLightState(logic.create("replace"), "bulb"), "dim");
assert.equal(logic.getRoomLightState({mechanic:"replace",removed:"bulb",installed:null,done:false}, "bulb"), "dim");
assert.equal(logic.getRoomLightState({mechanic:"replace",removed:"bulb",installed:"bulb",done:true}, "bulb"), "bright");
assert.equal(logic.getRoomLightState(logic.create("replace"), "towel"), "normal");
assert.equal(logic.getRoomLightState(logic.create("warm"), "tea"), "normal");
```

Also require CSS overlays to ignore pointer events and a reduced-motion rule to remove the pulse.

- [ ] **Step 2: Run the focused red test**

Run `node --test moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs` and confirm the helper is missing.

- [ ] **Step 3: Implement the pure light-state helper**

```javascript
function getRoomLightState(state, target){
  if(!state || state.mechanic !== "replace" || target !== "bulb") return "normal";
  return state.installed === "bulb" ? "bright" : "dim";
}
```

Export it without changing `applyReplace()` or completion behavior.

- [ ] **Step 4: Render lighting classes and effects**

In `renderInnInteraction()`, resolve the light state after `innInteractionState` is available and add the matching class to `.inn-room-viewport`. Use non-interactive pseudo-elements: a cool dark overlay for dim, and a warm fixture-centered radial glow plus a 500-millisecond brightening transition after installation. Keep movable objects and hotspots above the overlays.

- [ ] **Step 5: Run focused tests and update the handoff**

Run `node --test moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs`. Record that bulb installation remains one decisive action and that other scenes remain normal.

---

### Task 4: Offline delivery and full verification

**Files:**
- Modify: `pwa.test.mjs`
- Modify: `sw.js`
- Regenerate: `lantern-alley-artifact.html`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: completed source UI and `build-artifact.mjs`.
- Produces: updated offline cache and exact standalone artifact.

- [ ] **Step 1: Extend delivery regression tests**

Require the standalone artifact to contain the cinematic title class, Japanese entry copy, Entrance progress state, corrected bow contract, and bulb light classes. Require the service worker shell version to change from `lantern-alley-v30`.

- [ ] **Step 2: Run the delivery red test**

Run `node --test pwa.test.mjs` and confirm the old service worker/artifact fail the new contract.

- [ ] **Step 3: Update the offline cache and rebuild**

Change the cache name to `lantern-alley-v31`, then run:

```powershell
node build-artifact.mjs
```

Expected: six scripts, one stylesheet, and all project images inlined.

- [ ] **Step 4: Run the complete automated suite and syntax checks**

```powershell
node --check entrance-stage-logic.js
node --check moonview-inn-interactions.js
node --check app.js
node --check build-artifact.mjs
node --test entrance-stage.test.mjs lantern-map.test.mjs moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs pwa.test.mjs
git diff --check
```

Expected: zero test failures, zero syntax failures, and no whitespace errors beyond existing line-ending notices.

- [ ] **Step 5: Perform rendered QA**

Check desktop, 390 by 844, and 320 by 720. Verify opening hierarchy, one primary action, Entrance progress/dialogue/action reachability, feet-stable hip bow, bulb dim/bright contrast, no horizontal overflow, and no console errors. Rapidly repeat the bow to confirm it restarts cleanly and verify reduced-motion with the browser rendering setting.

- [ ] **Step 6: Finalize the handoff**

Record exact test totals, artifact size, cache version, rendered viewport results, and that the remote Claude Artifact URL was not republished. Do not commit or push.
