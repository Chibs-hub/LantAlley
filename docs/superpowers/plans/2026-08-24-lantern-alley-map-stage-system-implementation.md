# Lantern Alley Map and Stage System Implementation Plan

Status: Complete

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract map graph with an illustrated, accessible destination map that enters the two implemented stages and honestly presents four future places as 準備中.

**Architecture:** Add a small testable map-data module that defines six stable destinations and resolves their progress state without adding unfinished lessons to the playable `locations` array. Keep rendering in `app.js`, semantic map regions in `index.html`, and responsive presentation in `styles.css`. Store the approved illustration as a project-owned asset so the normal page, service worker, and standalone builder use the same image.

**Tech Stack:** Plain HTML, CSS, browser JavaScript, Node built-in test runner, existing service worker, existing standalone artifact builder.

**Spec:** `docs/superpowers/specs/2026-08-24-lantern-alley-map-stage-system-design.md`

## Global Constraints

- The Japanese sentence remains the only thing that tells the learner what action answers a lesson request.
- Only `entrance` and `home-inn` are playable in this rollout.
- `market`, `tea-house`, `station`, and `shrine` remain selectable map destinations with state `preparing` and no enter action.
- Selecting a destination changes only the map detail; a separate primary button enters or continues a playable stage.
- The complete 3:2 map stays visible without panning or horizontal scrolling.
- Japanese labels remain live HTML, not baked into the artwork.
- Preserve existing `localStorage` progress keys and the current stage engines.
- Update `PROJECT-HANDOFF.md` with every implementation edit.
- Do not commit or push without explicit user approval.

---

### Task 1: Testable destination and progress model

**Files:**
- Create: `lantern-map.js`
- Create: `lantern-map.test.mjs`
- Modify: `index.html`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Produces: `LanternAlleyMap.destinations`, an ordered frozen array of six destination records.
- Produces: `LanternAlleyMap.getDestination(key)` returning a destination or `null`.
- Produces: `LanternAlleyMap.resolveState(key, progress)` returning `completed`, `in-progress`, `available`, or `preparing`.
- Produces: `LanternAlleyMap.getAction(key, progress)` returning `{ label, locationKey }` for playable destinations or `null` for Preparing destinations.

- [ ] **Step 1: Write the failing data-model tests**

Create `lantern-map.test.mjs` that loads `lantern-map.js` in a VM and asserts:

```js
assert.deepEqual(
  Array.from(map.destinations, (place) => place.key),
  ["entrance", "home-inn", "market", "tea-house", "station", "shrine"],
);
assert.equal(map.getAction("market", {}), null);
assert.equal(map.resolveState("entrance", { visited: { entrance: true } }), "completed");
assert.equal(map.resolveState("home-inn", { stageProgress: { homeInn: { phase: "practice" } } }), "in-progress");
assert.equal(map.resolveState("home-inn", { visited: { "home-inn": true } }), "completed");
assert.equal(map.resolveState("home-inn", {}), "available");
```

Also assert every record has a Japanese `name`, `story`, `focus`, percentage `position`, and one of the known playable or preparing states.

- [ ] **Step 2: Run the focused test and confirm the red state**

Run: `node --test lantern-map.test.mjs`

Expected: FAIL because `lantern-map.js` does not exist.

- [ ] **Step 3: Implement the minimal map module**

Create a browser-and-VM-compatible IIFE assigning `LanternAlleyMap` to the global object. Define the six approved places. Keep `playableLocationKey` only on Entrance and Moonview Inn; future places use `availability: "preparing"`.

- [ ] **Step 4: Load the module before `app.js`**

Add `<script src="lantern-map.js"></script>` to `index.html` before `app.js` so the renderer can consume the stable interface.

- [ ] **Step 5: Update the handoff and run the focused test**

Record the destination-model boundary in `PROJECT-HANDOFF.md`, then run `node --test lantern-map.test.mjs`.

Expected: PASS.

### Task 2: Semantic map selection and honest actions

**Files:**
- Modify: `lantern-map.test.mjs`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `n2-home-inn-stage.test.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: `LanternAlleyMap.destinations`, `resolveState`, and `getAction` from Task 1.
- Produces: `renderMap()`, `selectMapDestination(key)`, and `renderMapDetail()` behavior in `app.js`.
- Produces: `#map-destinations`, `#map-detail`, `#map-detail-action`, and associated live detail fields in `index.html`.

- [ ] **Step 1: Add failing structural and behavior-contract tests**

Assert the page contains one map image region, one destination layer, and one `aria-live="polite"` detail region. Assert `app.js` renders from `LanternAlleyMap.destinations`, sets `aria-pressed`, and hides the primary action when `getAction()` returns `null`.

Replace the obsolete test wording “current map contains only the entrance and Moonview Inn” with a test that confirms the playable `locations` array still contains only those two lesson engines while the map model contains all six visual destinations.

- [ ] **Step 2: Run focused tests and confirm the red state**

Run: `node --test lantern-map.test.mjs n2-home-inn-stage.test.mjs`

Expected: FAIL on missing semantic map regions and map-model renderer calls.

- [ ] **Step 3: Replace abstract graph markup**

Remove dashed SVG paths, map statistics, legend, toast, and reset action from the map screen. Add a compact header, illustrated map region, empty destination-button layer, and one detail region containing Kon, status, destination name, story, focus, and one primary action button.

- [ ] **Step 4: Replace direct-entry node rendering**

Track `selectedMapKey`, defaulting to `home-inn`. Render each destination as a native button at its percentage position. A destination click updates selection and detail only. The detail action calls `enterLocation(action.locationKey)` only when `LanternAlleyMap.getAction()` returns a real action.

- [ ] **Step 5: Preserve truthful progress**

Map Entrance completion from `state.visited.entrance`; map Moonview Inn completion and progress from `state.visited["home-inn"]` and `state.stageProgress.homeInn`; map all four future places to Preparing. Update accessible names with the resolved Japanese status.

- [ ] **Step 6: Update the handoff and run focused tests**

Record the separation between selection and entry plus Preparing behavior. Run `node --test lantern-map.test.mjs n2-home-inn-stage.test.mjs`.

Expected: PASS.

### Task 3: Project-owned artwork and adaptive visual system

**Files:**
- Create: `assets/map/lantern-alley-map-v1.jpg`
- Modify: `styles.css`
- Modify: `lantern-map.test.mjs`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: approved 3:2 elevated neighborhood artwork.
- Produces: `.map-scene`, `.map-destination`, and `.map-detail` responsive styles.

- [ ] **Step 1: Add failing visual-contract tests**

Assert the CSS references `assets/map/lantern-alley-map-v1.jpg`, uses a 3:2 map aspect ratio, includes an `aria-pressed="true"` selected style, preserves at least 44px destination controls on compact widths, and contains no legacy `.map-svg` or `.node-circle` rules.

- [ ] **Step 2: Run the focused test and confirm the red state**

Run: `node --test lantern-map.test.mjs`

Expected: FAIL on the missing artwork and new responsive selectors.

- [ ] **Step 3: Copy the approved map non-destructively**

Copy the selected generated illustration to `assets/map/lantern-alley-map-v1.jpg`. Keep the generated source intact.

- [ ] **Step 4: Implement desktop styling**

Make the illustrated map dominate the frame. Use warm lantern pins with readable Japanese labels, selected light treatment, completed check treatment, and a single wood-and-washi detail shelf below the map.

- [ ] **Step 5: Implement compact styling**

Keep the complete image visible at 736px, 390px, and 320px. Reduce decorative pin geometry while retaining 44px hit targets. Stack Kon, story, and the primary action naturally without internal or horizontal scrolling.

- [ ] **Step 6: Update the handoff and run the focused test**

Record the asset path and responsive behavior. Run `node --test lantern-map.test.mjs`.

Expected: PASS.

### Task 4: Offline, artifact, and end-to-end verification

**Files:**
- Modify: `pwa.test.mjs`
- Modify: `sw.js`
- Regenerate: `lantern-alley-artifact.html`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: `lantern-map.js` and `assets/map/lantern-alley-map-v1.jpg`.
- Produces: offline availability and a self-contained artifact with embedded map artwork.

- [ ] **Step 1: Add failing offline and artifact tests**

Assert `sw.js` pre-caches the map module and artwork. Assert the standalone artifact contains the six Japanese place names, map data module, semantic map detail, and the exact base64 map image, with no external `assets/map/` URL left behind.

- [ ] **Step 2: Run the PWA test and confirm the red state**

Run: `node --test pwa.test.mjs`

Expected: FAIL until the service worker and artifact are updated.

- [ ] **Step 3: Update offline shell and rebuild**

Bump `CACHE_VERSION` from `lantern-alley-v29` to `lantern-alley-v30`, add `lantern-map.js` and the map artwork to `SHELL`, then run `node build-artifact.mjs`.

- [ ] **Step 4: Run automated verification**

Run:

```powershell
node --check lantern-map.js
node --check app.js
node --test lantern-map.test.mjs moonview-inn-interactions.test.mjs n2-home-inn-stage.test.mjs entrance-stage.test.mjs pwa.test.mjs
```

Expected: all tests pass and both syntax checks exit zero.

- [ ] **Step 5: Verify rendered behavior**

At 1366x768, 1024x768, 736px wide, 390x844, and 320px wide verify:

- all six places are visible and selectable;
- selected status and story update;
- Entrance and Moonview actions navigate;
- future places show 準備中 and no enter action;
- keyboard focus is visible and follows source order;
- no horizontal overflow, clipped labels, console errors, or failed requests.

- [ ] **Step 6: Final handoff update**

Record test counts, syntax checks, viewport results, artifact byte size, exact cache version, and the fact that future stages remain unimplemented.

No commit or push is performed without user approval.
