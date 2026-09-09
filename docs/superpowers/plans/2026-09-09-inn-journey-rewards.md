# Moonview Inn Journey and Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Moonview Inn a five-stop, visually legible progression route that grants earned home rewards and unlocks the cat after Episode 4.

**Architecture:** A new pure `inn-journey.js` module owns ordered stops, reward metadata, migration normalization, current-step lookup, and idempotent claims. `learning-progress.js` stores its result, while `app.js` renders the route, applies each claimed reward to the existing home systems, and transitions through inline reward scenes. CSS provides wayfinding and reduced-motion-safe completion effects.

**Tech Stack:** Vanilla JavaScript IIFEs, HTML, CSS, Node `--test`, existing PWA cache versioning.

**Spec:** `docs/superpowers/specs/2026-09-09-inn-journey-rewards-design.md`

## Global Constraints

- Work only on `codex/inn-learning-redesign`; never merge into `master`.
- Do not add generated raster art; use existing home reward and cat assets.
- Keep v3 saves readable and never remove existing owned home objects or cats.
- Keep all new source and documentation ASCII.
- Update `sw.js` and every local `?v=` stamp in `index.html` to the same cache version.
- Every production behavior starts with a test that fails for the missing behavior.
- Do not commit or push without explicit user approval.

---

### Task 1: Create the pure journey state module

**Files:**
- Create: `inn-journey.js`
- Create: `inn-journey.test.mjs`
- Modify: `index.html`
- Modify: `pwa.test.mjs`

**Interfaces:**
- Produces: `window.LanternInnJourney` with `fresh()`, `normalize(value, legacy)`, `steps()`, `current(stage, episodesDone)`, `claim(journey, rewardId)`, and `isComplete(episodesDone)`.
- Consumes: only plain stage and episode completion data; no DOM or storage APIs.

- [ ] **Step 1: Write failing journey behavior tests**

```js
test("a fresh Inn journey locks all rewards and the cat", () => {
  const journey = load().fresh();
  assert.equal(journey.catUnlocked, false);
  assert.deepEqual(Object.keys(journey.claimed), []);
});

test("claiming an Inn reward is idempotent", () => {
  const api = load();
  const first = api.claim(api.fresh(), "inn-e02");
  const replay = api.claim(first.journey, "inn-e02");
  assert.equal(first.granted, true);
  assert.equal(replay.granted, false);
});

test("the next unfinished episode is the current story stop", () => {
  const step = load().current({mastered:true}, {"inn-e01":true});
  assert.equal(step.id, "inn-e02");
});
```

- [ ] **Step 2: Run the new test file and verify it fails because the module is absent**

Run: `node --test inn-journey.test.mjs`

Expected: FAIL because `inn-journey.js` does not exist.

- [ ] **Step 3: Implement the smallest pure module**

```js
var REWARDS = Object.freeze({
  training:{id:"training", item:"floor-cushion-navy", coins:25},
  "inn-e01":{id:"inn-e01", plant:"camellia"},
  "inn-e02":{id:"inn-e02", item:"scroll"},
  "inn-e03":{id:"inn-e03", item:"floor-lantern"},
  "inn-e04":{id:"inn-e04", cat:true}
});
```

`claim()` must clone its argument, mark the reward once, and set
`catUnlocked` only for `inn-e04`. `normalize()` must return a fresh structure
for no saved value and preserve the cat for a legacy saved record.

- [ ] **Step 4: Run the new test file and verify it passes**

Run: `node --test inn-journey.test.mjs`

Expected: PASS.

- [ ] **Step 5: Load the module before `learning-progress.js` and update PWA coverage**

Add the cache-stamped script tag before `learning-progress.js`. Update the
PWA script-list expectation so the shell asset check covers the new module.

### Task 2: Persist journey state and preserve old players

**Files:**
- Modify: `learning-progress.js`
- Modify: `learning-progress.test.mjs`
- Modify: `app.js`

**Interfaces:**
- Consumes: `LanternInnJourney.fresh()` and `LanternInnJourney.normalize()`.
- Produces: `progress.innJourney`, always serializable and always present after migration.

- [ ] **Step 1: Write failing progress tests**

```js
test("a fresh save starts with a locked Inn journey", () => {
  const out = load().emptyProgress();
  assert.equal(out.innJourney.catUnlocked, false);
});

test("a pre-journey save keeps the already visible cat", () => {
  const out = load().migrateProgress({version:3, stages:{}, home:{owned:[], placed:{}}});
  assert.equal(out.innJourney.catUnlocked, true);
});

test("journey claims survive a v3 reload", () => {
  const out = load().migrateProgress({version:3, stages:{}, innJourney:{claimed:{"inn-e02":true}, catUnlocked:false}});
  assert.equal(out.innJourney.claimed["inn-e02"], true);
});
```

- [ ] **Step 2: Run the progress test file and verify the tests fail**

Run: `node --test learning-progress.test.mjs`

Expected: FAIL because `innJourney` is not yet present.

- [ ] **Step 3: Add migration and app storage wiring**

Add `innJourney` to `emptyProgress()`, normalize it in `migrateProgress()`,
and treat a v3 save with no journey block as legacy. In `app.js`, add it to
the state, pending-load data, `saveProgress()`, and `applyProgress()`.

- [ ] **Step 4: Run the progress test file and verify it passes**

Run: `node --test learning-progress.test.mjs`

Expected: PASS.

### Task 3: Add idempotent home reward helpers

**Files:**
- Modify: `home-decor.js`
- Modify: `home-decor.test.mjs`
- Modify: `home-garden.js`
- Modify: `home-garden.test.mjs`

**Interfaces:**
- Produces: `LanternHomeDecor.grant(home, itemId)` and `LanternHomeGarden.grantPlant(garden, typeId)`.
- Both return `{ok, reason, home|garden}` without mutating their input.

- [ ] **Step 1: Write failing reward-helper tests**

```js
test("a reward item enters storage once without charging coins", () => {
  const result = decor.grant({owned:[], placed:{}}, "scroll");
  assert.equal(result.ok, true);
  assert.deepEqual(result.home.owned, ["scroll"]);
});

test("a repeated reward item does not duplicate inventory", () => {
  const result = decor.grant({owned:["scroll"], placed:{}}, "scroll");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "owned");
});

test("a reward camellia is granted once without calling the starter path", () => {
  const result = garden.grantPlant(garden.emptyGarden(), "camellia");
  assert.equal(result.ok, true);
  assert.equal(result.garden.plants[0].typeId, "camellia");
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test home-decor.test.mjs home-garden.test.mjs`

Expected: FAIL because `grant` and `grantPlant` do not exist.

- [ ] **Step 3: Implement minimal immutable grant helpers**

`grant()` must reject unknown and already-owned decor. `grantPlant()` must
reject unknown plant types and an already-owned plant type, preserving every
existing plant and its growth.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test home-decor.test.mjs home-garden.test.mjs`

Expected: PASS.

### Task 4: Award stops and render inline reward transitions

**Files:**
- Modify: `app.js`
- Modify: `walkthrough.test.mjs`
- Modify: `n2-home-inn-stage.test.mjs`

**Interfaces:**
- Consumes: `LanternInnJourney.claim()`, decor and garden grant helpers.
- Produces: `claimInnReward(rewardId)` and `renderInnReward(rewardId, nextAction)`.

- [ ] **Step 1: Write failing walkthrough behavior tests**

```js
test("finishing Inn Training awards its cushion once before Episode 1", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-stage").click();
  game.$("btn-next").click();
  assert.match(game.$("scene").textContent, /cushion|reward/i);
  assert.ok(JSON.parse(game.storage.getItem("lanternAlley.v3")).home.owned.includes("floor-cushion-navy"));
});

test("a finished final Inn episode unlocks the cat without requiring replay", () => {
  // Start from a save with Episodes 1 through 3 complete and finish Episode 4.
  // Assert the persisted innJourney.catUnlocked flag is true.
});
```

- [ ] **Step 2: Run the focused walkthrough tests and verify they fail**

Run: `node --test walkthrough.test.mjs`

Expected: FAIL because training starts Episode 1 directly and episodes return to the map.

- [ ] **Step 3: Implement reward application and transitions**

Add a single reward application function in `app.js`. It must:

1. claim the stop through `LanternInnJourney`;
2. grant the decor, plant, or coins only on a new claim;
3. save progress before rendering the reward scene;
4. make training continue to Episode 1;
5. make Episodes 1 through 3 continue to the next episode;
6. make Episode 4 continue home after the cat reveal.

Route `advanceStagePhase()` through training completion before `startEpisode()`.
Route `endEpisodePreview()` through the finished episode reward before it
returns to the map. Replays must skip directly to the normal continuation.

- [ ] **Step 4: Run focused walkthrough tests and verify they pass**

Run: `node --test walkthrough.test.mjs n2-home-inn-stage.test.mjs`

Expected: PASS.

### Task 5: Build the visual journey strip and motion-safe reward reveal

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `n2-home-inn-stage.test.mjs`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Produces: a `#inn-journey` live header region and `renderInnJourney()`.
- Uses existing asset paths from `LanternInnJourney` reward metadata.

- [ ] **Step 1: Write failing UI contract tests**

```js
test("Inn screens expose a five-stop journey with one current stop", () => {
  const game = boot(null, "?skip=1");
  // Enter the Inn and assert five .inn-journey-stop nodes and one .is-current.
});

test("completion motion has a reduced-motion fallback", () => {
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*inn-reward/);
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `node --test walkthrough.test.mjs n2-home-inn-stage.test.mjs`

Expected: FAIL because no journey container or motion rules exist.

- [ ] **Step 3: Implement visual cues**

Add one header container, not a new modal or navigation surface. Render five
semantic list items with visible labels, accessible progress text, lit/current/
locked states, and non-interactive reward previews. Use existing image paths
for the reward reveal. Animate only opacity and transform on the completion
event. Add a reduced-motion rule that disables keyframes and preserves the
final visual state.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test walkthrough.test.mjs n2-home-inn-stage.test.mjs`

Expected: PASS.

### Task 6: Gate home rewards and separate Daily Practice

**Files:**
- Modify: `app.js`
- Modify: `styles.css`
- Modify: `walkthrough.test.mjs`
- Modify: `catalog-practice.test.mjs`

**Interfaces:**
- Consumes: `state.innJourney.catUnlocked`.
- Produces: a fresh-home empty state, cat gating, and bounded Daily Practice wording.

- [ ] **Step 1: Write failing behavior tests**

```js
test("a fresh home explains the next Inn reward instead of granting starter items", () => {
  const game = boot(null, "?skip=1");
  // Open home, assert no cushion or camellia is added, and assert an Inn action exists.
});

test("the cat is absent before Episode 4 and present after its reward", () => {
  // Render home with each saved journey state and assert home-pet presence.
});

test("Daily Practice advertises its bounded session rather than catalog total", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /Daily practice/);
  assert.doesNotMatch(app, /9097/);
});
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `node --test walkthrough.test.mjs catalog-practice.test.mjs`

Expected: FAIL because home still grants starter items and always renders the cat.

- [ ] **Step 3: Implement fresh-home and practice changes**

Remove automatic starter grants from first home entry. Start the existing home
tutorial only once both earned starter rewards exist. Before then, render a
single-action home prompt for the next Inn reward. Gate `homePetMarkup()` on
the journey cat flag. Rename the map practice action and keep its displayed
scope to the existing bounded session and due count.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `node --test walkthrough.test.mjs catalog-practice.test.mjs`

Expected: PASS.

### Task 7: Version, regression suite, and browser verification

**Files:**
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `CHANGELOG.md`
- Modify: `PROJECT-HANDOFF.md`

- [ ] **Step 1: Bump all cache stamps together**

Set `CACHE_VERSION` and every local script or stylesheet query stamp to `313`.

- [ ] **Step 2: Run the complete automated suite**

Run: `node --test`

Expected: all tests pass with zero failures.

- [ ] **Step 3: Verify in the browser at desktop and mobile widths**

Check this exact sequence:

1. Fresh player opens home before training and sees the next-reward action.
2. Training completes, cushion reveal appears once, and Episode 1 continues.
3. Episodes 1 through 3 reveal the correct item and continue in order.
4. Episode 4 reveals the cat and opens home with the cat present.
5. Replay shows no duplicate reward or money.
6. Daily Practice remains separate and bounded.
7. Reduced motion has no moving reveal but preserves completion clarity.
8. Browser console contains no new errors and no reward asset request fails.

- [ ] **Step 4: Update project records without committing**

Record implementation, migration policy, browser evidence, cache version, and
test count in `CHANGELOG.md` and `PROJECT-HANDOFF.md`. Leave changes uncommitted
until the user explicitly asks.
