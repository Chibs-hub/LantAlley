# Animated Cat and Tree Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate five-stage sakura and maple art and an autonomous animated long-haired calico into the home yard and room.

**Architecture:** Raster assets remain separate from scene backgrounds. `home-pet.js` provides a pure state machine and authored anchor graph; `app.js` renders its output and schedules animation without coupling it to rewards or decoration state.

**Tech Stack:** Browser JavaScript, CSS sprite animation, transparent WebP assets, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-29-animated-cat-and-trees-design.md`

## Global Constraints

- Lighting follows local time automatically.
- Pet behavior is cosmetic and never affects lessons, money, growth, or placement.
- Opposite-facing movement uses CSS mirroring.
- Reduced motion uses static poses and crossfades.
- The standalone artifact must remain below 16 MB.
- Do not commit or push without user approval.

---

### Task 1: Production tree assets

**Files:**
- Create: `assets/home/garden/sakura-{planted,sprout,sapling,young,mature}-v1.webp`
- Create: `assets/home/garden/maple-{planted,sprout,sapling,young,mature}-v1.webp`
- Modify: `app.js`
- Test: `home-decor.test.mjs`, `pwa.test.mjs`

**Interfaces:**
- Produces `PLANT_ART["cherry-tree"]` and `PLANT_ART["japanese-maple"]` five-stage image maps.

- [ ] Write tests asserting all ten files exist, are cached, and both plant mappings expose five stages.
- [ ] Run `node --test home-decor.test.mjs pwa.test.mjs` and confirm missing mappings fail.
- [ ] Generate and normalize consistent transparent artwork with one canvas and ground anchor.
- [ ] Add the two image maps and map logical `growing` state to sapling or young by growth progress.
- [ ] Re-run focused tests and confirm they pass.

### Task 2: Pure pet state machine

**Files:**
- Create: `home-pet.js`
- Create: `home-pet.test.mjs`
- Modify: `index.html`, `sw.js`

**Interfaces:**
- Produces `LanternHomePet.create(scene, seed)`, `step(state, elapsedMs, options)`, `anchors(scene)`, and `spriteFor(state)`.
- `step` returns a cloned state with `scene`, `anchorId`, `x`, `y`, `facing`, `behavior`, and `frame`.

- [ ] Write failing tests for valid anchors, deterministic choices, walk progression, door-only scene changes, pause, and reduced motion.
- [ ] Run `node --test home-pet.test.mjs` and confirm the missing module fails.
- [ ] Implement the smallest pure state machine satisfying those tests.
- [ ] Add the script to the shell and offline cache.
- [ ] Re-run the pet tests and confirm they pass.

### Task 3: Cat sprite assets

**Files:**
- Create: `assets/home/pet/calico-walk-v1.webp`
- Create: `assets/home/pet/calico-transitions-v1.webp`
- Create: `assets/home/pet/calico-idles-v1.webp`
- Create: `assets/home/pet/calico-interactions-v1.webp`
- Test: `pwa.test.mjs`, `home-pet.test.mjs`

**Interfaces:**
- Sprite metadata returned by `spriteFor` names one sheet, frame column, frame row, and frame count.

- [ ] Add failing assertions for every sprite sheet path and frame-grid metadata.
- [ ] Run focused tests and confirm missing files fail.
- [ ] Generate a consistent long-haired calico reference and derive four transparent sprite sheets.
- [ ] Normalize frame dimensions, ground line, and padding; encode as WebP.
- [ ] Re-run focused tests and confirm all assets and metadata pass.

### Task 4: Scene integration

**Files:**
- Modify: `app.js`, `styles.css`
- Test: `walkthrough.test.mjs`, `home-pet.test.mjs`

**Interfaces:**
- Consumes `LanternHomePet` state and sprite metadata.
- Produces `.home-pet` inside yard and interior scenes only.

- [ ] Write failing walkthrough assertions for yard rendering, room rendering, shop absence, pointer transparency, and reduced-motion class behavior.
- [ ] Run focused tests and confirm rendering assertions fail.
- [ ] Render the sprite, schedule animation, pause on hidden documents, and stop timers when leaving home.
- [ ] Add responsive positioning, sprite-frame CSS, mirroring, and reduced-motion rules.
- [ ] Re-run focused tests and confirm they pass.

### Task 5: Final delivery verification

**Files:**
- Modify: `PROJECT-HANDOFF.md`, `lantern-alley-artifact.html`

**Interfaces:**
- Produces cache-versioned source and rebuilt standalone artifact.

- [ ] Run `node --test` and require zero failures.
- [ ] Run syntax checks for every modified JavaScript file.
- [ ] Rebuild with `node build-artifact.mjs` and require output below 16 MB.
- [ ] Verify yard, room, doorway transition, shop absence, 390x844, 320x640, reduced motion, and console logs in the browser.
- [ ] Record exact evidence in `PROJECT-HANDOFF.md` and run `git diff --check`.
