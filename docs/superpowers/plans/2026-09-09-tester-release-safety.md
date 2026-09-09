# Tester Release Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public tester build safe to reset, honest about storage, easy to report on, and measurable through anonymous PostHog events.

**Architecture:** A new telemetry adapter owns all optional PostHog behavior and fails closed when no project key exists. `app.js` remains the owner of live game state, but calls a small `track` boundary at meaningful progression points. The UI adds compact dialogs and banners that use existing button and modal patterns.

**Tech Stack:** Vanilla HTML, CSS and JavaScript IIFEs; Node `--test`; PostHog browser snippet loaded only after configuration.

**Spec:** `docs/superpowers/specs/2026-09-09-tester-release-safety-design.md`

## Global Constraints

- Stay on `codex/inn-learning-redesign`; never merge or push to `master`.
- Use ASCII only in newly authored source text and UTF-8 without BOM.
- Do not collect answers, Japanese strings, session replay, autocapture, or personal data.
- PostHog must remain disabled with an empty project key and must never block play.
- Every new behavior starts with a failing test and is checked at desktop and the three specified phone viewports.
- Bump every local `?v=` stamp and `CACHE_VERSION` together only after all code changes are complete.
- Do not commit or push without a new explicit user request.

---

### Task 1: Add the isolated telemetry adapter

**Files:**
- Create: `telemetry-config.js`
- Create: `telemetry.js`
- Create: `telemetry.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `pwa.test.mjs`

**Interfaces:**
- Produces `window.LanternTelemetry` with `track(name, properties)`,
  `setEnabled(boolean)`, `isEnabled()`, and `setContext(function)`.
- Consumes `window.LanternTelemetryConfig` with exact default values
  `{projectKey:"", apiHost:"https://us.i.posthog.com"}`.

- [ ] **Step 1: Write failing adapter tests**

```js
test("telemetry is a no-op until a public project key is configured", () => {
  const telemetry = loadTelemetry({projectKey:""});
  telemetry.track("app_opened", {screen:"title"});
  assert.deepEqual(telemetry.sent(), []);
});

test("telemetry sends only allow-listed events and properties", () => {
  const telemetry = loadTelemetry({projectKey:"phc_test"});
  telemetry.setEnabled(true);
  telemetry.track("feedback_submitted", {category:"bug", details:"button stuck", answer:"秘密"});
  assert.deepEqual(telemetry.sent()[0], {
    name:"feedback_submitted", properties:{category:"bug", details:"button stuck"}
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail because the modules do not exist**

Run: `node --test telemetry.test.mjs`

Expected: FAIL with a missing module or missing `LanternTelemetry` API.

- [ ] **Step 3: Implement disabled configuration and adapter**

```js
// telemetry-config.js
(function(root){
  root.LanternTelemetryConfig = {projectKey:"", apiHost:"https://us.i.posthog.com"};
})(typeof window !== "undefined" ? window : self);

// telemetry.js
(function(root){
  var ALLOWED = {app_opened:1, new_player_selected:1, entrance_started:1,
    entrance_completed:1, inn_training_started:1, inn_training_completed:1,
    episode_started:1, episode_completed:1, reward_claimed:1, home_visited:1,
    feedback_submitted:1, progress_reset:1, storage_failed:1, app_error:1};
  // Load PostHog only after projectKey is present. Disable autocapture and
  // session recording. Ignore every unlisted event and property.
})(typeof window !== "undefined" ? window : self);
```

Use one bounded in-memory queue while the optional PostHog script loads. On a
script or network error, clear the queue and become a no-op. Persist only the
on/off preference and the random anonymous identifier locally.

- [ ] **Step 4: Add local modules in dependency order and the service-worker shell**

Load `telemetry-config.js`, then `telemetry.js`, before `app.js`. Include both
in `sw.js`'s `SHELL`. Update the PWA shell test expectation.

- [ ] **Step 5: Run adapter and PWA tests**

Run: `node --test telemetry.test.mjs pwa.test.mjs`

Expected: PASS with the config no-op, allow-list, disabled failure mode, and
service-worker shell all covered.

### Task 2: Add reset confirmation and storage-health warning

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Produces `openResetConfirmation()`, `confirmReset()`, and
  `setStorageFailure(message)` inside `app.js`.
- Consumes the existing `applyProgress(null)` reset path and `saveProgress()`.

- [ ] **Step 1: Write failing rendered-flow tests**

```js
test("restart does not erase saved progress until the player confirms", () => {
  const game = boot(completedEntranceSave());
  game.$("btn-restart").click();
  assert.equal(game.$("reset-confirm").hidden, false);
  assert.ok(game.storage.getItem("lanternAlley.v3"));
  game.$("reset-cancel").click();
  assert.ok(game.storage.getItem("lanternAlley.v3"));
});

test("a storage write failure stays visible without stopping play", () => {
  const game = bootWithThrowingStorage();
  game.$("btn-start").click();
  assert.equal(game.$("storage-warning").hidden, false);
  assert.match(game.$("storage-warning").textContent, /not being saved/i);
});
```

- [ ] **Step 2: Run the tests and confirm the modal and warning are missing**

Run: `node --test --test-name-pattern="restart does not|storage write failure" walkthrough.test.mjs`

Expected: FAIL because `reset-confirm` and `storage-warning` do not exist.

- [ ] **Step 3: Add semantic modal and warning markup**

Add `#storage-warning` with `role="status"`, plus `#reset-confirm` with
`role="dialog"`, `aria-modal="true"`, Cancel `#reset-cancel`, and destructive
`#reset-confirm-action`. Keep strings in the existing Japanese UI style.

- [ ] **Step 4: Change reset and storage behavior minimally**

Replace the direct title restart listener with `openResetConfirmation`. Move
the existing reset body unchanged into `confirmReset`. Have `saveProgress`
return `true` or `false`; its catch calls `setStorageFailure`. Have
`loadProgress` call the same warning path after boot when reads fail. Clear the
warning only after a later successful `saveProgress`.

- [ ] **Step 5: Run focused flow tests**

Run: `node --test --test-name-pattern="restart does not|storage write failure" walkthrough.test.mjs`

Expected: PASS. Verify Cancel, confirmation, and play-after-storage-failure.

### Task 3: Add one-tap feedback and privacy setting

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `app.js`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Consumes `LanternTelemetry.track` and `LanternTelemetry.setEnabled`.
- Produces `openFeedback()`, `submitFeedback(category)`, and
  `feedbackContext()` in `app.js`.

- [ ] **Step 1: Write failing rendered-flow tests**

```js
test("feedback sends one chosen category with current game context", () => {
  const game = bootTelemetryGame("?skip=1");
  game.$("btn-feedback").click();
  game.$("feedback-confusing").click();
  assert.equal(game.telemetry.events[0].name, "feedback_submitted");
  assert.equal(game.telemetry.events[0].properties.category, "confusing");
  assert.equal(game.telemetry.events[0].properties.location, "home-inn");
});

test("turning anonymous testing data off stops further capture", () => {
  const game = bootTelemetryGame();
  game.$("analytics-toggle").click();
  game.$("btn-start").click();
  assert.deepEqual(game.telemetry.events, []);
});
```

- [ ] **Step 2: Run the tests and confirm feedback controls do not exist**

Run: `node --test --test-name-pattern="feedback sends|anonymous testing data" walkthrough.test.mjs`

Expected: FAIL because the feedback and analytics controls are absent.

- [ ] **Step 3: Add compact feedback UI**

Use one globally available `#btn-feedback` that opens `#feedback-panel`. Add
four 44px-minimum buttons named `feedback-bug`, `feedback-confusing`,
`feedback-too-hard`, and `feedback-liked`. Include optional details behind a
clearly labelled field and a separate Send action only when text is entered.
Add `#analytics-toggle` to the about panel with the plain-language anonymous
data explanation from the spec.

- [ ] **Step 4: Send allow-listed feedback and progression events**

Add event calls exactly at character selection, Entrance enter/complete, Inn
training enter/complete, episode start/complete, reward claim, and first home
visit. `feedbackContext()` may include only build, screen, location, section,
question ID, and device class. Do not inspect answer options or Japanese
prompt text.

- [ ] **Step 5: Run focused feedback tests**

Run: `node --test --test-name-pattern="feedback sends|anonymous testing data" walkthrough.test.mjs telemetry.test.mjs`

Expected: PASS with a one-tap category report, opt-out, and no answer leakage.

### Task 4: Add safe application-error reporting

**Files:**
- Modify: `app.js`
- Modify: `telemetry.test.mjs`
- Modify: `walkthrough.test.mjs`

**Interfaces:**
- Consumes the adapter and `feedbackContext()`.
- Produces `reportAppError(message, source)`.

- [ ] **Step 1: Write failing error-report test**

```js
test("an application error reports only its message, source and game context", () => {
  const telemetry = loadTelemetry({projectKey:"phc_test"});
  telemetry.reportError(new Error("scene missing"), "app.js", {screen:"inn"});
  assert.deepEqual(telemetry.sent()[0].properties, {
    message:"scene missing", source:"app.js", screen:"inn"
  });
});
```

- [ ] **Step 2: Run the test and confirm the error path is absent**

Run: `node --test --test-name-pattern="application error reports" telemetry.test.mjs`

Expected: FAIL because `reportError` does not exist.

- [ ] **Step 3: Implement bounded global error hooks**

Register `error` and `unhandledrejection` listeners only after the adapter is
available. Reduce every report to string message, source file basename, and
allow-listed game context. Do not transmit stacks, URLs with query strings, or
event objects. Errors never display a vendor message to a player.

- [ ] **Step 4: Run focused error tests**

Run: `node --test --test-name-pattern="application error reports" telemetry.test.mjs`

Expected: PASS.

### Task 5: Complete phone QA and release records

**Files:**
- Modify: `styles.css`
- Modify: `walkthrough.test.mjs`
- Modify: `CHANGELOG.md`
- Modify: `PROJECT-HANDOFF.md`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- Consumes all preceding control IDs and telemetry no-op behavior.

- [ ] **Step 1: Write failing CSS contract tests**

```js
test("tester controls remain touch-sized and cannot sit beneath the update bar", () => {
  const css = read("styles.css");
  assert.match(css, /\.feedback-choice\{[^}]*min-height:44px/);
  assert.match(css, /\.storage-warning\{[^}]*position:fixed/);
});
```

- [ ] **Step 2: Run the test and confirm it fails before styling exists**

Run: `node --test --test-name-pattern="tester controls remain" walkthrough.test.mjs`

Expected: FAIL because the tester-control styles do not exist.

- [ ] **Step 3: Add responsive CSS and manually check 320x568, 375x667 and 390x844**

Keep feedback and reset controls 44px or larger, preserve `env(safe-area-inset-*)`,
and position warning/dialog layers above the game but below browser chrome.
Manually test Inn object taps, two-step placement, choices, audio replay,
feedback, reset and rewards at all three viewports. Fix any clipped or
hard-to-tap target found.

- [ ] **Step 4: Bump cache once and verify the offline shell**

Replace every current `?v=` stamp in `index.html` with the next shared value,
then update `CACHE_VERSION` in `sw.js` to the same numeric build. Run:

`node --test pwa.test.mjs`

Expected: PASS with every local script stamped and precached.

- [ ] **Step 5: Update release records and run the full suite**

Document telemetry disabled-by-default configuration, data contract, reset and
storage behavior, test evidence, and the cache version. Run:

`node --test`

Expected: PASS with zero failures. Leave the branch uncommitted until the user
explicitly asks.
