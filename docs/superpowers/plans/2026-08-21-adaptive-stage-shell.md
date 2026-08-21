# Adaptive Stage Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the narrow vertical game screen with one adaptive stage shell that keeps the Japanese request and answer workspace together across desktop, tablet, and phone layouts.

**Architecture:** Add three semantic layout regions around the existing game controls without changing their IDs or event wiring. CSS Grid provides a 38/62 context-workspace split on wide screens; the regions stack on narrow screens and the dialogue becomes sticky while the learner acts. Existing interaction classes provide task-specific adaptation without duplicating views or changing stage engines.

**Tech Stack:** HTML, CSS Grid, responsive media queries, vanilla JavaScript, Node test runner, generated standalone HTML artifact.

**Spec:** `docs/superpowers/specs/2026-08-21-adaptive-stage-shell-design.md`

## Global Constraints

- Maximum game width is 1100px.
- Keep all Japanese, story context, stage state, scoring, and answer mechanics unchanged.
- Keep text readable and answer touch targets at least 48px.
- Current object, schedule, reply, and Entrance encounters target one viewport at 768px height on desktop and tablet.
- On narrow screens, use one natural page scroll and keep the complete Japanese request sticky while the learner acts.
- Do not add a layout setting or separate desktop/mobile render path.
- Preserve existing uncommitted changes.
- Do not commit unless the user explicitly asks.

---

### Task 1: Semantic stage shell

**Files:**
- Modify: `index.html:79-126`
- Modify: `pwa.test.mjs`

**Interfaces:**
- Consumes: Existing element IDs used by `app.js`, including `screen-game`, `scene-label`, `jp-line`, `scene`, `feedback-row`, and `btn-next`.
- Produces: `.game-layout`, `.stage-bar`, `.stage-meta`, `.learning-context`, and `.answer-workspace` regions used by Task 2 CSS.

- [ ] **Step 1: Write the failing shell-structure test**

Add a test that reads `index.html`, asserts each region appears once, and asserts source order is stage bar, learning context, answer workspace. Also assert all existing interactive IDs still occur once.

```js
test("the game screen separates context from the answer workspace", () => {
  const html = read("index.html");
  const regions = ["stage-bar", "learning-context", "answer-workspace"];
  for (const name of regions) {
    assert.equal((html.match(new RegExp(`class=\"${name}`, "g")) || []).length, 1);
  }
  assert.ok(html.indexOf('class="stage-bar') < html.indexOf('class="learning-context'));
  assert.ok(html.indexOf('class="learning-context') < html.indexOf('class="answer-workspace'));
  for (const id of ["jp-line", "scene", "feedback-row", "btn-next"]) {
    assert.equal((html.match(new RegExp(`id=\"${id}\"`, "g")) || []).length, 1);
  }
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```powershell
node --test --test-name-pattern "separates context" pwa.test.mjs
```

Expected: FAIL because `stage-bar` is absent.

- [ ] **Step 3: Wrap existing markup without changing IDs**

Use this structure inside `#screen-game`:

```html
<div class="game-layout">
  <div class="stage-bar">
    <div class="hud">...</div>
    <div class="stage-meta">scene label, phase, encounter status</div>
  </div>
  <div class="learning-context">narration, romaji toggle, dialogue</div>
  <div class="answer-workspace">scene, hint, feedback, next action</div>
</div>
```

Do not change the child IDs or button semantics.

- [ ] **Step 4: Run the targeted test**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Review checkpoint**

Inspect the markup diff for balanced tags and confirm `app.js` selectors still resolve. Do not commit.

---

### Task 2: Wide and narrow adaptive layout

**Files:**
- Modify: `styles.css:19-85`
- Modify: `styles.css:239-480`
- Modify: `pwa.test.mjs`

**Interfaces:**
- Consumes: Semantic regions from Task 1.
- Produces: Wide 38/62 grid, compact density, narrow stacked order, and sticky request behavior.

- [ ] **Step 1: Write the failing responsive-contract test**

Add a test requiring the wide shell, 1100px maximum, narrow breakpoint, and sticky dialogue contract.

```js
test("the stage shell adapts from split workspace to sticky mobile request", () => {
  const css = read("styles.css");
  assert.match(css, /\.stage\{[^}]*max-width:1100px/);
  assert.match(css, /\.game-layout\{[^}]*display:grid/);
  assert.match(css, /grid-template-columns:minmax\(300px,38fr\) minmax\(0,62fr\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.learning-context \.dialogue\{[^}]*position:sticky/);
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```powershell
node --test --test-name-pattern "adapts from split" pwa.test.mjs
```

Expected: FAIL because `.game-layout` has no grid rule.

- [ ] **Step 3: Implement the wide shell**

Update the outer width rules and add:

```css
.stage{width:100%;max-width:1100px;position:relative;z-index:1}
#screen-title,#screen-map{width:100%;max-width:680px;margin-inline:auto}
.game-layout{
  display:grid;
  grid-template-columns:minmax(300px,38fr) minmax(0,62fr);
  grid-template-areas:"bar bar" "context answer";
  gap:14px 18px;
  align-items:start;
}
.stage-bar{grid-area:bar}
.learning-context{grid-area:context;min-width:0}
.answer-workspace{grid-area:answer;min-width:0}
```

Compact the stage bar into a two-row region and remove the dialogue's bottom margin inside the learning context.

- [ ] **Step 4: Implement narrow and short-screen behavior**

At `max-width:760px`, stack the regions, reduce frame padding, and make `.learning-context .dialogue` sticky at `top:8px`. At `max-height:720px` and `min-width:761px`, reduce gaps, frame padding, room minimum height, avatar size, and decorative spacing without reducing Japanese text below 1.05rem or controls below 48px.

- [ ] **Step 5: Run the targeted test**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 6: Review checkpoint**

Confirm the title and map remain 680px wide, the game can reach 1100px, and no rule hides Japanese, romaji, feedback, or answer controls. Do not commit.

---

### Task 3: Interaction-specific workspace density

**Files:**
- Modify: `styles.css:470-660`
- Modify: `pwa.test.mjs`

**Interfaces:**
- Consumes: Existing `.inn-room`, `.inn-scene-zones`, `.inn-tray`, `.schedule-controls`, `.inn-replies`, and `.duo-stage` classes.
- Produces: Compact workspace variants selected automatically by existing interaction markup.

- [ ] **Step 1: Write the failing workspace test**

Add a contract test for removing the redundant answer-scene container, compact object layout, and full-width reply layout.

```js
test("each interaction uses the adaptive answer workspace", () => {
  const css = read("styles.css");
  assert.match(css, /\.answer-workspace \.scene\{[^}]*background:transparent[^}]*border:0/);
  assert.match(css, /\.answer-workspace \.inn-replies/);
  assert.match(css, /\.answer-workspace \.schedule-controls/);
  assert.match(css, /\.answer-workspace \.duo-stage/);
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```powershell
node --test --test-name-pattern "adaptive answer workspace" pwa.test.mjs
```

Expected: FAIL because the answer-workspace variants are absent.

- [ ] **Step 3: Implement interaction-specific CSS**

- Remove the outer dashed scene treatment inside `.answer-workspace` while retaining the room or interaction's own visual boundary.
- Keep destination zones and the tray in one compact room layout.
- Let schedule controls use all available width and wrap to one column when needed.
- Let reply options use full width without a decorative room minimum height.
- Make Entrance actions use available width beside Kon on wide screens and stack naturally on narrow screens.

- [ ] **Step 4: Run the targeted test**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Run all automated tests**

```powershell
node --test *.test.mjs
```

Expected: all tests pass with no failures.

- [ ] **Step 6: Review checkpoint**

Check 48px minimum controls, visible focus, no horizontal overflow, and no duplicated action surfaces. Do not commit.

---

### Task 4: Package and verify the adaptive shell

**Files:**
- Modify: `visual-smoke-test.mjs`
- Modify: `sw.js`
- Regenerate: `lantern-alley-artifact.html`
- Modify: `PROJECT-HANDOFF.md`

**Interfaces:**
- Consumes: Completed adaptive shell and all current interaction engines.
- Produces: Offline-ready local build, self-contained artifact, viewport measurements, and current handoff documentation.

- [ ] **Step 1: Add viewport assertions to the visual smoke test**

Measure `document.documentElement.scrollWidth`, `innerWidth`, the Japanese request rectangle, and answer workspace rectangle. Assert no horizontal overflow and assert both regions intersect the viewport at desktop/tablet sizes. Add narrow-screen checks that the dialogue computed position is `sticky` and its full text remains present.

- [ ] **Step 2: Increment the service-worker cache version**

Change the current `CACHE_VERSION` from `lantern-alley-v5` to `lantern-alley-v6` so installed PWAs receive the new shell.

- [ ] **Step 3: Rebuild the standalone artifact**

Run:

```powershell
python build-artifact.py
```

If Python is unavailable, use the verified Node-equivalent artifact build path already used in this workspace. Confirm the output remains below 16MB and contains no external script or stylesheet tags.

- [ ] **Step 4: Update the handoff**

Document the adaptive shell, breakpoints, sticky mobile request, current test count, cache version, and artifact rebuild under a newest-first 2026-08-21 change-log entry.

- [ ] **Step 5: Run final verification**

```powershell
git diff --check
node --check app.js
node --test *.test.mjs
```

Inspect wide, compact, and narrow captures. Confirm the current object, schedule, reply, and Entrance encounters remain usable.

- [ ] **Step 6: Final review checkpoint**

Inspect `git status --short` and separate pre-existing changes from adaptive-shell changes. Do not commit or publish the Claude Artifact without explicit user approval.
