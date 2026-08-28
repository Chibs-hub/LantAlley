# Free Home Decoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace predetermined home slots with reversible free-form decoration on neutral illustrated scenes.

**Architecture:** Preserve the existing immutable garden and decor modules, but expand placement metadata into a dense authored grid and persist rotation per instance. Scene backgrounds contain only fixed architecture. Rendering remains layered raster art.

**Tech Stack:** Vanilla JavaScript, CSS, localStorage, Node test runner, PNG/WebP assets.

**Spec:** `docs/superpowers/specs/2026-08-28-free-home-decoration-design.md`

## Global Constraints

- Reward accuracy and demonstrated learning only.
- Starter scenery is removable, restorable and never repurchased.
- No destructive clearing; clearing moves objects to storage.
- Keep current saves compatible.
- Update `PROJECT-HANDOFF.md`, cache version and offline asset contract with shipped changes.
- Do not push without approval.

---

### Task 1: Neutral scene foundations

**Files:** Modify `home-room.js`, scene assets and `home-decor.test.mjs`.

- [ ] Generate neutral yard and interior backgrounds with no baked-in movable decor.
- [ ] Replace eight beds and six restrictive slots with dense typed placement regions.
- [ ] Test bounds, kinds, tokonoma restrictions and asset availability.

### Task 2: Reversible placement state

**Files:** Modify `home-decor.js`, `home-garden.js`, `learning-progress.js` and tests.

- [ ] Add position and rotation to movable instances without mutating old saves.
- [ ] Add rotate, clear-to-storage and restore-starter-layout operations.
- [ ] Test collision rejection, migration, ownership and starter restoration.

### Task 3: Decorating controls

**Files:** Modify `app.js`, `styles.css`, `walkthrough.test.mjs`.

- [ ] Render targets only for the selected item.
- [ ] Add Move, Rotate, Store, Clear and Restore controls with accessible names.
- [ ] Verify yard, interior and tokonoma flows at desktop, 390px and 320px.

### Task 4: Delivery and final mock

**Files:** Modify `sw.js`, `pwa.test.mjs`, `build-artifact.mjs`, `PROJECT-HANDOFF.md`.

- [ ] Cache/package every new background and movable asset and bump all cache versions together.
- [ ] Run `node --test`, syntax checks and `git diff --check`.
- [ ] Generate a completed example mock that is explicitly one possible arrangement.

