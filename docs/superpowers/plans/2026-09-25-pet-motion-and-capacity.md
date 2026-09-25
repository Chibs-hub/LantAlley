# Pet Motion and Scene Capacity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make cats and Shiba walk with believable foot travel while every active pet has a distinct visible place, or gets an explicit full-scene message.

**Architecture:** Keep the three species motion modules. Add one pure layout module that assigns mixed species to supported anchors and checks capacity in both home scenes. The app uses that assignment on scene entry and reserves all pets during movement. Retain owned species counts and active instance IDs, normalizing invalid active counts without removing ownership.

**Tech Stack:** Vanilla JavaScript, CSS, HTML, Node `node:test`, service worker, no build step.

**Spec:** `docs/superpowers/specs/2026-09-25-pet-motion-and-capacity-design.md`

## Global Constraints

- The user may activate every owned pet for which both scenes have safe space.
- A full scene reports `この場所はいっぱいです。これ以上ペットを出せません。`
- Buying a pet while full still buys and stores it.
- Preserve existing save ownership, pet scale, reduced-motion support and responsive scenes.
- Do not claim a visual fix without rendered phone and desktop checks.
- Do not commit or push until explicitly authorized under the repository instructions.

## Review Focus

1. A save with more active IDs than owned copies: preserve every owned copy and board the extra active IDs; test in Task 3.
2. Mixed ground species competing for one center anchor: assign separate visible anchors; test in Task 2.
3. A bird on an elevated support over a ground pet: allow both where their rendered bodies do not overlap; test in Task 2.
4. A center table and both screens narrowing the room: report capacity correctly and retain a path for admitted pets; test in Tasks 2 and 3.
5. Switching between yard and room after a decor change: reassign or board overflow with a clear message; test in Task 3.

---

### Task 1: Calibrate cat and Shiba foot travel

**Files:** Modify `home-pet.js`, `home-dog.js`; test `home-pet.test.mjs`, `home-dog.test.mjs`.

**Interfaces:** Existing `step(state, elapsedMs, options)`, `spriteFor(state)`, `widthAt(y, scene)` remain stable.

- [ ] Add a cat test: after the first two visible contact-pose changes, `walked / widthAt(y, scene)` is within 0.50–0.64, and the next frame remains distance-driven at lower arrival speed.
- [ ] Add Shiba amble and trot tests: the same cycle ratios are 0.50–0.64 and 0.38–0.50 respectively; the active PNG body-area test still passes.
- [ ] Run `node --test home-pet.test.mjs home-dog.test.mjs`; confirm the new tests fail on the current 0.15/0.14/0.11 body-length increments.
- [ ] Set cat stride to `widthAt(y, scene) * 0.28`; set Shiba stride per pose to `widthAt(y, scene) * (gait === "trot" ? 0.22 : 0.28)`.
- [ ] Run the two focused suites, then simulate a complete trip with 16 ms steps and record frame transitions against travel distance.

### Task 2: Assign mixed pets to safe anchors

**Files:** Create `home-pet-layout.js`, `home-pet-layout.test.mjs`; modify anchor rows in `home-pet.js`, `home-dog.js`, `home-bird.js` only where the scene picture provides a support.

**Interfaces:** Export `LanternHomePetLayout.assign(scene, pets, APIs, blockers, options)` returning `{ok:true, anchors:{[iid]:anchor}}` or `{ok:false, anchors:{}, unassignedIid:string}`. `pets` is ordered `{iid,species,seed}[]`; `APIs` maps `cat`, `bird`, `shiba` to their motion modules; `options` maps species to `{extraAnchors:[]}`. Export `fitsBoth(pets, APIs, sceneInputs)` where `sceneInputs` has `yard` and `interior` entries, each containing `blockers` and `options`. It returns `{ok:boolean, assignments:{yard,interior}, unassignedIid?:string}` without mutation.

- [ ] Write tests using the real species modules: one mixed set with all assignments distinct and non-overlapping; a bird above a ground pet; a fully planted yard; a center-piece-and-screens room; an impossible oversized set returning the first unassigned ID; repeated calls returning the same assignment.
- [ ] Run `node --test home-pet-layout.test.mjs`; confirm the module is missing.
- [ ] Implement candidate filtering using each API's `anchors`, `pointIsClear`, `widthAt`, and `routeIsClear`. Compute each pet's screen footprint from its rendered width and support band; reserve rectangles, not anchor IDs. Use deterministic largest-footprint-first search with backtracking so a greedy early choice cannot hide a later pet. Keep output in input order.
- [ ] Add only scene-supported anchors needed by failing capacity cases. Check all new points against the source room and yard paintings and their 16:9 bounds.
- [ ] Run the layout tests and existing species tests.

### Task 3: Enforce ownership and capacity at all state transitions

**Files:** Modify `app.js`, `home-pets.js`, `home-pets.test.mjs`, `walkthrough.test.mjs` or `dom-harness.mjs` tests as needed.

**Interfaces:** `LanternHomePetLayout.fitsBoth` from Task 2 decides whether all proposed active instances fit yard and interior. No existing save key is deleted.

- [ ] Test active IDs cannot exceed corresponding owned copies, including a legacy save with duplicate or excess IDs. Test that buying at capacity charges once, keeps ownership, and leaves the new pet inactive. Test that `Put out` at capacity leaves state untouched and emits the full message. Test decor changes, scene switches, and cross-species collisions.
- [ ] Run the focused tests and confirm they fail on the current same-species `takenIds` logic and unconditional recruit/purchase activation.
- [ ] Centralize a pure `normalizeActivePets(ownedPets, activeIids)` in `home-pets.js` and a pure `tryActivate(...)` that checks both scene layouts. In `app.js`, use owned minus active count to gate `＋飼う`; show `active / owned`; call capacity checks before appending an active ID, while still charging for a valid purchase.
- [ ] Replace same-species initial spreading in `homePetMarkup` with the complete layout assignment. On scene/decor refresh, reseat all active pets from the new assignment. If no assignment fits, board latest active IDs until one does, preserve owned copies, and show one notice.
- [ ] During route choice, reserve all current and target positions across species; do not send a pet along a path blocked by another pet. Reset scene state only when the scene changes or an anchor disappears.
- [ ] Run focused tests and scripted mixed-pet lifecycle cases.

### Task 4: Render smooth motion, package and verify

**Files:** Modify `app.js`, `styles.css`, `index.html`, `sw.js`, `manifest.webmanifest`, `pwa.test.mjs`, `CHANGELOG.md`, `PROJECT-HANDOFF.md`.

**Interfaces:** Keep `.home-pet` and `data-pet-iid` available to existing controls and tests; nest an artwork element whose transform handles facing and breathing independently of position/depth.

- [ ] Add a rendered DOM test that records pet screen coordinates over at least one walk, proves real position change and no overlap, and checks reduced motion leaves a supported static pose.
- [ ] Run it against the current renderer; confirm it fails on `left`, `top`, `width` updates or pet overlap.
- [ ] Move position to `translate3d`, scale to a nested visual wrapper, and preserve the existing sprite background-position calculation. Remove per-frame writes to `left`, `top`, and `width`; retain depth and facing without transform conflicts.
- [ ] Add `home-pet-layout.js` to `index.html` and `sw.js`, bump all local URL/cache stamps from v448 to v449, and update handoff notes with the actual result.
- [ ] Run `node --test home-pet-layout.test.mjs home-pet.test.mjs home-dog.test.mjs home-bird.test.mjs home-pets.test.mjs pwa.test.mjs`, then `node --test`. Report every unrelated failure by name.
- [ ] Render a 390 px phone and desktop scene with a mixed pet set, a full scene, and the center-piece-and-screens layout. Inspect video or sampled frames at normal and 0.1x speed; check console errors, clipping, overlap, foot cadence and reduced motion.
- [ ] Run `git diff --check`, inspect the exact changed files, and leave the approved code ready for the repository's commit/push authorization gate.
