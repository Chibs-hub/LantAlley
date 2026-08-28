# Home and Garden Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the code-drawn reward room with an illustrated house and yard where purchased plants grow through completed learning and owned decorations remain movable.

**Architecture:** Keep reward rules in pure modules and let `app.js` render them. `home-garden.js` owns plant instances and growth; `home-decor.js` continues to own purchases and interior placement; `home-room.js` becomes scene metadata instead of drawing the production room. Raster backgrounds and transparent assets are layered into authored slots.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, localStorage, Node test runner, built-in image generation, PNG/WebP assets, existing DOM walkthrough harness.

**Spec:** `docs/superpowers/specs/2026-08-28-home-garden-rewards-design.md`

## Global Constraints

- Reward demonstrated learning, never passive time, tapping, or replay farming.
- Kon's tutorial dialogue is simple Japanese; interaction instructions are English.
- The yard opens first; tapping the house enters the interior.
- Plants are permanent movable decorations with four stages: planted, sprout, growing, mature.
- Existing money, furniture ownership, and placements must survive migration.
- Use layered raster assets; do not ship the current SVG room as the finished presentation.
- Every edit updates `PROJECT-HANDOFF.md`.
- Every shipped shell edit bumps `CACHE_VERSION` and all `?v=` script/style query versions together.
- Do not commit or push unless the owner explicitly authorizes it.

## File Structure

- Create `home-garden.js`: pure plant catalogue, instances, placement, movement, storage, growth, and lesson-credit rules.
- Create `home-garden.test.mjs`: unit tests for all garden state transitions and anti-farming rules.
- Modify `home-room.js`: expose raster scene metadata and authored interior/yard slots.
- Modify `home-decor.js`: replace inline SVG payloads with image paths while preserving purchase and placement APIs.
- Modify `learning-progress.js`: migrate and clone `houseTier`, tutorial flags, starter claims, and garden state.
- Modify `app.js`: home tutorial, yard/interior navigation, layered renderers, purchases, placement, and lesson growth handoff.
- Modify `index.html`, `styles.css`: load the garden module and render adaptive home controls.
- Modify `sw.js`, `pwa.test.mjs`, `build-artifact.mjs`: cache and package every production asset.
- Modify `walkthrough.test.mjs`: rendered first-visit and growth verification.
- Create assets under `assets/home/exterior/`, `assets/home/interior/`, `assets/home/garden/`, and `assets/home/decor/`.

---

### Task 1: Production Visual Foundation

**Files:**
- Create: `assets/home/exterior/starter-house-yard-v1.webp`
- Create: `assets/home/interior/starter-room-v1.webp`
- Create: `assets/home/garden/camellia-{planted,sprout,growing,mature}-v1.png`
- Create: `assets/home/decor/floor-cushion-red-v1.png`
- Modify: `home-room.js`
- Test: `home-decor.test.mjs`

**Interfaces:**
- Produces: `LanternHomeRoom.scenes()` returning `{yard:{background,slots,houseHotspot}, interior:{background,slots}}`.
- Produces: project-local raster assets with stable relative paths.

- [ ] **Step 1: Add a failing scene-metadata test**

```js
const scenes = room.scenes();
assert.equal(scenes.yard.background, "assets/home/exterior/starter-house-yard-v1.webp");
assert.equal(scenes.yard.slots.length, 8);
assert.ok(scenes.yard.houseHotspot.width > 0);
assert.equal(scenes.interior.background, "assets/home/interior/starter-room-v1.webp");
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test home-decor.test.mjs`

Expected: FAIL because `LanternHomeRoom.scenes` does not exist.

- [ ] **Step 3: Generate the approved vertical-slice assets**

Use built-in image generation with the existing Entrance and Inn assets as style references. Generate one wide yard/exterior background, one wide interior background, four transparent camellia growth stages with a consistent base footprint, and one transparent red floor cushion. Copy final outputs into the paths above. Inspect every file for matching perspective, clean alpha, no text, no watermark, and no cropped silhouette.

- [ ] **Step 4: Replace production SVG scene metadata**

Implement `scenes()` in `home-room.js` with eight yard slots, existing-compatible interior slot kinds, and a bounded house hotspot. Keep `slots()` as a compatibility alias returning interior slots until Task 4 switches all callers.

- [ ] **Step 5: Verify metadata and files**

Run: `node --test home-decor.test.mjs`

Expected: PASS, and every declared asset path exists.

---

### Task 2: Pure Garden State Engine

**Files:**
- Create: `home-garden.js`
- Create: `home-garden.test.mjs`

**Interfaces:**
- Consumes: yard slot records from `LanternHomeRoom.scenes().yard.slots`.
- Produces: `emptyGarden()`, `catalogue()`, `claimStarter(garden)`, `buy(garden,money,typeId)`, `plant(garden,instanceId,slotId,slots)`, `move(garden,instanceId,slotId,slots)`, `store(garden,instanceId)`, `creditLesson(garden,creditId,bonus)`, `acknowledgeAnimations(garden)`, and `lessonsRemaining(instance)`.
- Plant instance: `{id,typeId,slotId,growthPoints,stage,pendingAnimation}`.

- [ ] **Step 1: Write failing tests for ownership and unique instances**

```js
const first = garden.buy(garden.emptyGarden(), 500, "camellia");
const second = garden.buy(first.garden, first.money, "camellia");
assert.notEqual(first.instanceId, second.instanceId);
assert.equal(second.garden.plants.length, 2);
```

- [ ] **Step 2: Write failing tests for placement and safe movement**

```js
const planted = garden.plant(state, instanceId, "yard-left", slots);
assert.equal(planted.garden.plants[0].slotId, "yard-left");
const moved = garden.move(planted.garden, instanceId, "yard-right", slots);
assert.equal(moved.garden.plants[0].slotId, "yard-right");
assert.equal(planted.garden.plants[0].slotId, "yard-left");
```

- [ ] **Step 3: Write failing tests for learning growth and replay blocking**

```js
const once = garden.creditLesson(planted.garden, "home-inn:episode-1", 0);
const replay = garden.creditLesson(once.garden, "home-inn:episode-1", 0);
assert.equal(once.garden.plants[0].growthPoints, 1);
assert.equal(replay.garden.plants[0].growthPoints, 1);
assert.equal(replay.granted, 0);
```

- [ ] **Step 4: Run tests and confirm all fail for missing module**

Run: `node --test home-garden.test.mjs`

- [ ] **Step 5: Implement the minimal immutable engine**

Define the eight approved plant types and growth thresholds: flowers 2-4, shrubs 5-7, trees 8-12. `creditLesson` records used credit ids and applies points only to planted, non-mature instances. A stage change sets `pendingAnimation:true`; `acknowledgeAnimations` returns a cloned garden with every pending flag cleared.

- [ ] **Step 6: Run focused tests**

Run: `node --test home-garden.test.mjs`

Expected: PASS.

---

### Task 3: Progress Migration and Persistence

**Files:**
- Modify: `learning-progress.js`
- Modify: `learning-progress.test.mjs`
- Modify: `app.js`

**Interfaces:**
- Consumes: `LanternHomeGarden.emptyGarden()`.
- Produces progress fields: `houseTier:"starter"`, `homeTutorialComplete:false`, `starterSeedClaimed:false`, `starterCushionClaimed:false`, `activeWallpaper:"wallpaper-plain"`, and `garden:{plants:[],creditedLessons:[],nextInstance:1}`.

- [ ] **Step 1: Add failing empty-progress and migration assertions**

```js
assert.equal(empty.houseTier, "starter");
assert.equal(empty.homeTutorialComplete, false);
assert.deepEqual(empty.garden.plants, []);
const migrated = progress.migrateProgress({version:3,money:90,home:{owned:["rug-plain"],placed:{}}});
assert.equal(migrated.money, 90);
assert.deepEqual(migrated.home.owned, ["rug-plain"]);
assert.equal(migrated.houseTier, "starter");
```

- [ ] **Step 2: Run the progress tests and confirm failure**

Run: `node --test learning-progress.test.mjs`

- [ ] **Step 3: Implement cloning and migration**

Add all approved fields to `emptyProgress()` and `migrateProgress()`. A legacy save receives an empty garden and starter house. Starter claims remain false unless the equivalent item is already owned; the app's claim action performs the final duplicate check.

- [ ] **Step 4: Wire `app.js` load and save**

Add pending values beside existing `pendingHome`, hydrate state after load, reset them in `applyProgress(null)`, and write them in `saveProgress()`.

- [ ] **Step 5: Run focused tests and syntax check**

Run: `node --test learning-progress.test.mjs home-garden.test.mjs`

Run: `node --check app.js`

Expected: PASS.

---

### Task 4: Yard-First Home and Interior Navigation

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: `LanternHomeRoom.scenes()`, `LanternHomeDecor`, and `LanternHomeGarden`.
- Produces: `renderHomeYard()`, `renderHomeInterior()`, `renderGardenDock()`, and event delegation for house, plant, slot, storage, and shop actions.

- [ ] **Step 1: Add a rendered failing test for yard-first entry**

```js
homeDestination.click();
assert.equal(game.$("screen-game").classList.contains("home-stage"), true);
assert.equal(game.$("scene").querySelectorAll(".home-yard-scene").length, 1);
assert.equal(game.$("scene").querySelectorAll("[data-enter-house]").length, 1);
```

- [ ] **Step 2: Add failing navigation and placement tests**

Click the house hotspot, assert `.home-interior-scene`; return to yard; select the starter plant; assert only `.garden-target` controls appear; place it and assert the image uses the planted-stage asset.

- [ ] **Step 3: Run walkthrough test and confirm failure**

Run: `node --test walkthrough.test.mjs`

- [ ] **Step 4: Implement layered scene renderers**

Render a responsive `<div>` with a background image, percentage-positioned transparent item images, an active wallpaper layer in the interior, invisible semantic slot buttons, and a house hotspot. Do not paint slot outlines until an item is selected. Keep all controls as real buttons with Japanese names and descriptive `aria-label` values.

- [ ] **Step 5: Implement dock tabs and safe actions**

Add Garden, Storage, and Shop. Buying creates a plant instance or owned decor; placement checks kind compatibility; occupied or invalid destinations retain the prior state and show a short message.

- [ ] **Step 6: Implement interior navigation**

The exterior house hotspot enters the interior. A visible `庭へ戻る` control returns to the yard. Existing purchased decor continues to render using image paths instead of SVG fragments.

- [ ] **Step 7: Run rendered and focused tests**

Run: `node --test walkthrough.test.mjs home-decor.test.mjs home-garden.test.mjs`

Expected: PASS.

---

### Task 5: First-Visit Kon Tutorial

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: tutorial flags from progress and starter claim functions.
- Produces: `startHomeTutorial(replay)`, `advanceHomeTutorial(action)`, and `claimHomeStarter(kind)`.

- [ ] **Step 1: Add a failing first-visit walkthrough**

Assert Kon introduces the home, the shop highlights a free camellia seed, planting advances the tutorial, entering the house exposes a free cushion, placing and moving it finishes the tutorial, and `homeTutorialComplete` persists.

- [ ] **Step 2: Add failing duplicate-prevention assertions**

Reload and replay `How it works`; assert one starter camellia instance, one starter cushion, and unchanged money.

- [ ] **Step 3: Run the walkthrough and confirm failure**

Run: `node --test walkthrough.test.mjs`

- [ ] **Step 4: Implement the tutorial state machine**

Use a small ordered state object in `app.js`. Kon's Japanese lines explain earning, buying, planting, growth, entering, buying decor, placing, and moving. English `How to interact` text names only the current mechanical action. Advance only after the required action occurs.

- [ ] **Step 5: Implement starter claims**

The free flower is a camellia instance and the free decor is `floor-cushion-red`. Claims check both flags and current ownership/instances before adding anything. Replay mode shows the same explanation without executing claim operations.

- [ ] **Step 6: Run rendered tests**

Run: `node --test walkthrough.test.mjs learning-progress.test.mjs home-garden.test.mjs`

Expected: PASS.

---

### Task 6: Lesson Completion Growth Hook

**Files:**
- Modify: `app.js`
- Modify: `home-garden.test.mjs`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Consumes: `creditLesson(garden, creditId, bonus)`.
- Produces one stable credit id per cleared authored episode and one optional bonus for newly mastered targets.

- [ ] **Step 1: Add a failing integration test**

Complete an episode including its correction round, return home, and assert the planted camellia gains one point and shows a growth transition if its threshold is crossed.

- [ ] **Step 2: Add a replay anti-farming test**

Replay the same completed episode and assert growth points do not change.

- [ ] **Step 3: Run tests and confirm failure**

Run: `node --test walkthrough.test.mjs home-garden.test.mjs`

- [ ] **Step 4: Credit growth at the completion boundary**

Call `creditLesson` only from the path that finishes an episode after the correction queue is empty. Use `"episode:" + episode.id` as the stable credit id. Grant one bonus point only when the completed episode introduced at least one target not previously present in `masteredByStage` before that episode began.

- [ ] **Step 5: Render the return-home growth moment**

When a plant has `pendingAnimation`, animate only that plant from its prior scale to the new stage image, show a compact Japanese message, then acknowledge the animation and save. Respect reduced-motion by switching instantly while keeping the message.

- [ ] **Step 6: Run focused tests**

Run: `node --test walkthrough.test.mjs home-garden.test.mjs`

Expected: PASS.

---

### Task 7: Complete Initial Asset Catalogue

**Files:**
- Create: four stage assets for each remaining approved plant under `assets/home/garden/`
- Create: raster assets for every current decor item under `assets/home/decor/`
- Create: `assets/home/interior/wallpaper-{plain,asanoha,sakura}-v1.webp`
- Modify: `home-garden.js`
- Modify: `home-decor.js`
- Modify: `pwa.test.mjs`

**Interfaces:**
- Consumes: catalogue schemas established in Tasks 1 and 2.
- Produces every image path referenced by `catalogue()` and `LanternHomeDecor.catalogue()`.

- [ ] **Step 1: Add failing asset-contract tests**

For every plant, assert all four stage paths exist. For every decor item and wallpaper, assert `image` exists and the file is present. Assert no production catalogue item exposes inline `svg`.

- [ ] **Step 2: Run focused tests and confirm missing files**

Run: `node --test home-garden.test.mjs home-decor.test.mjs pwa.test.mjs`

- [ ] **Step 3: Generate plant sets**

Generate cherry, maple, pine, hydrangea, iris, chrysanthemum, and lantern-flower assets as separate transparent files for planted, sprout, growing, and mature stages. Preserve each species' base footprint and camera angle across all four stages.

- [ ] **Step 4: Generate decor assets**

Generate transparent replacements for the current rug, potted plants, low table, brazier, scroll, wall lamp, fan, mask, teapot, books, beckoning cat, wind chime, and any starter cushion not already covered. Match the interior perspective and lighting.

Generate plain washi, subtle asanoha, and subtle sakura seamless wallpaper layers. Add wallpaper catalogue entries whose purchase and selection update `activeWallpaper` without deleting previously owned wallpaper.

- [ ] **Step 5: Inspect and optimize**

Verify transparency, silhouette, consistent scale, and no watermark. Convert final large lossless files to WebP only where alpha and visual quality remain correct; retain PNG when it produces cleaner transparent edges.

- [ ] **Step 6: Wire catalogues and run tests**

Run: `node --test home-garden.test.mjs home-decor.test.mjs pwa.test.mjs`

Expected: PASS with no missing production image.

---

### Task 8: Adaptive UI, Offline Delivery, and Final Verification

**Files:**
- Modify: `styles.css`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `pwa.test.mjs`
- Modify: `build-artifact.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes all completed home and garden modules and assets.
- Produces a cache-consistent, responsive, documented release.

- [ ] **Step 1: Add adaptive layout assertions**

Assert the yard scene uses an aspect-ratio container, dock controls remain reachable at 320px, Japanese text does not overlap the scene, and the selected item's placement controls remain visible without nested scrolling.

- [ ] **Step 2: Add offline asset assertions**

Ensure every script loaded by `index.html` and every home asset referenced by a catalogue is in the service-worker shell or otherwise fetched and cached by the tested delivery contract.

- [ ] **Step 3: Bump the cache contract once**

Advance `lantern-alley-v124` to the next unused version and update every `?v=124` URL plus the matching `pwa.test.mjs` assertion in one edit.

- [ ] **Step 4: Run the full automated suite**

Run: `node --test`

Run: `node --check app.js`

Run: `node --check home-garden.js`

Run: `git diff --check`

Expected: all tests pass, syntax checks pass, and no whitespace errors are introduced.

- [ ] **Step 5: Perform rendered visual verification**

Check the live app at desktop, 390px, and 320px widths. Verify the first tutorial, free seed, garden placement, interior entry, free cushion, purchase failure, move/store actions, growth animation, reduced-motion behavior, and return persistence. Confirm image proportions and slot positions visually.

- [ ] **Step 6: Update the handoff**

Record architecture, asset paths, growth-credit boundary, tutorial behavior, migration, cache version, exact test count, visual verification, and remaining deferred house tiers/clothing work in `PROJECT-HANDOFF.md`.

- [ ] **Step 7: Commit only with owner authorization**

If explicitly authorized, stage only the reviewed files and commit with a cause-focused message. Never push without separate approval.
