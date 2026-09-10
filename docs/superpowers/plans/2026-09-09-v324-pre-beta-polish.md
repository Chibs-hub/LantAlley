# v324 Pre-Beta Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the v323 candidate visually coherent and safe to distribute for an external beta while leaving analytics and lesson-language review deferred.

**Architecture:** The existing vanilla HTML, CSS, and JavaScript application stays intact. New raster artwork is isolated under `assets/branding/` and `assets/social/`; title menu behavior remains in `app.js`; PWA metadata and cache entries change together. Full local font hosting was evaluated and deferred because six full Japanese font files total 36.3 MB; tests stay in the project's Node test suite, with browser checks for visible behavior.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PWA service worker, Node `--test`, Pillow asset tooling.

**Spec:** `docs/superpowers/specs/2026-09-09-v324-pre-beta-polish-design.md`

## Global Constraints

- Do not add a telemetry key, feedback backend, or PostHog connection.
- Do not edit Japanese lesson material or dialogue.
- Keep `路地へ入る` the primary title-screen action.
- Keep the existing destructive reset confirmation.
- Use the existing visual palette: navy, warm amber, wood, and washi.
- Bump every versioned local asset URL and `CACHE_VERSION` together.
- Do not commit or push without fresh user authorization.
- Verify visible work in a served browser at desktop, 320x568, 375x667, and 390x844.

---

### Task 1: Create and wire the PWA identity assets

**Files:**
- Create: `assets/branding/lantern-mark-v1.png`
- Create: `assets/social/lantern-alley-share-v1.jpg`
- Modify: `make-icons.py`, `manifest.webmanifest`, `index.html`, `sw.js`, `pwa.test.mjs`

**Interfaces:**
- Produces normal and maskable `icons/icon-192*.png`, `icons/icon-512*.png`, and `icons/apple-touch-icon.png`.
- Produces `/assets/social/lantern-alley-share-v1.jpg` at exactly 1200 x 630.
- Adds public Open Graph and Twitter metadata pointing at the public GitHub Pages asset URL.

- [x] Generate a no-text square lantern mark with navy background and amber paper-lantern glow.
- [x] Inspect the generated source for small-size readability and make maskable variants through `make-icons.py`.
- [x] Compose the 1200 x 630 share preview from existing map art, the lantern mark, and deterministic branding text.
- [x] Add a failing PWA test for all icon variants, share metadata, preview dimensions, and shell-cache entries.
- [x] Wire manifest, document metadata, and `sw.js`; run the focused PWA test until it passes.
- [x] Review correction: keep the full-bleed master at readable scale in maskable exports and version every manifest icon URL so installed Chromium apps detect the new icon.

### Task 2: Simplify the title-screen hierarchy and compact menu

**Files:**
- Modify: `index.html`, `app.js`, `styles.css`, `walkthrough.test.mjs`

**Interfaces:**
- Adds `#btn-title-menu` and `#title-menu`.
- Preserves `#btn-start`, `#btn-restart`, `#btn-save-data`, `#btn-about`, and `#btn-install-open` as stable action targets.

- [x] Add rendering tests that title maintenance actions are hidden until the compact menu opens, Install stays separate, and reset still opens its confirmation dialog.
- [x] Make the minimal markup and focus-managed menu behavior.
- [x] Style the compact menu at desktop and narrow phone widths without reducing primary-action emphasis.
- [x] Run targeted walkthrough tests, including background inertness and focus return from every title dialog.
- [ ] Browser-check closed/open menu states.

### Task 3: Apply the interface-language rule without changing lesson content

**Files:**
- Modify: `index.html`, `app.js`, `styles.css`, `walkthrough.test.mjs`

**Interfaces:**
- Learner-facing non-world controls use a consistent English label set.
- Japanese world names and lesson content retain their existing strings.

- [x] Inventory visible title, navigation, status, feedback, install, and helper controls.
- [x] Add a rendering or source-contract test for the selected label set.
- [x] Change only chrome labels that break the stated convention.
- [x] Review correction: translate the dynamic Save data status and error messages as part of the same English interface.
- [ ] Browser-check labels at title, map, Inn, and home screens.

### Task 4: Keep beta instructions current and honest

**Files:**
- Modify: `PROJECT-HANDOFF.md`, `CHANGELOG.md`, any current tester-facing documentation found by `rg`

**Interfaces:**
- Testers report the build shown inside the app rather than a hard-coded build example.

- [x] Search the repository for obsolete beta build references in tester instructions.
- [x] Replace only stale tester-facing references with the displayed-build instruction.
- [x] Update present-tense handoff status to v324 with the completed automated evidence and open browser gate.

### Task 5: Resolve feedback and bottom-action competition on phones

**Files:**
- Modify: `styles.css`, `walkthrough.test.mjs`

**Interfaces:**
- `#btn-feedback` stays accessible but does not cover sticky Continue, update, or confirmation controls.

- [x] Add a CSS-contract test for feedback placement beside active bottom action areas.
- [x] Adjust CSS using a contextual body state or active-screen selector; do not add backend behavior.
- [ ] Browser-check 320x568, 375x667, and 390x844 with feedback, an unanswered question, a Next action, and update bar state; confirm it covers neither controls nor lesson content.

### Task 6: Self-host current fonts when the payload is practical

**Files:**
- Create: `assets/fonts/*`
- Create: `assets/fonts/OFL-ShipporiMincho.txt`, `assets/fonts/OFL-ZenMaruGothic.txt`
- Modify: `index.html`, `styles.css`, `sw.js`, `pwa.test.mjs`, `NOTICE.md`

**Interfaces:**
- `@font-face` references local WOFF2 assets for the two existing family names.
- No Google Fonts network URL remains in production HTML.

- [x] Verify official OFL licensing and measure candidate variable font assets.
- [ ] If the total payload is reasonable, add the fonts and licenses, declare `@font-face`, cache them, and record attribution.
- [ ] Add a failing test proving local font declarations and shell-cache coverage.
- [x] Assets are unreasonable for full Japanese coverage (36.3 MB); document the measured reason and leave the existing remote source intact.

### Task 7: Improve small-phone Inn target discoverability

**Files:**
- Modify: `styles.css`, `walkthrough.test.mjs`, `PROJECT-HANDOFF.md`

**Interfaces:**
- An awaiting Inn room shows readable destination labels, 10px forgiving hit padding, no label collisions, and no horizontal overflow at 390px.

- [x] Re-run the existing render/CSS regression test for captions, touch padding, and the recycle-label placement.
- [x] Preserve the existing least-invasive label and hit-area rules, which already meet this source-level requirement.
- [ ] Play an actual Inn room at 390x844 and confirm visual labels, actual click hit area, and no collision.

### Task 8: Release verification and documentation

**Files:**
- Modify: `index.html`, `sw.js`, `CHANGELOG.md`, `PROJECT-HANDOFF.md`

- [x] Bump cache/build version after every final local shell change.
- [x] Run `node --test` (523/523), `node --check app.js`, a read-only temporary-copy `node research/balance-answers.mjs` audit, and `git diff --check`.
- [ ] Browser-check title menu, icon metadata, share preview URL, feedback coexistence, and Inn targets at desktop and three mobile sizes.
- [ ] Check console errors and failed network requests.
- [x] Update the changelog and handoff with automated evidence and deferred work.
- [ ] Add the served-browser evidence and close the visual gate.
