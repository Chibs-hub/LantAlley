# Moonview Inn Direct Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Moonview Inn word cards with five direct, accessible object interactions across Learn, Practice, focused review, and Challenge.

**Architecture:** Keep vocabulary and phase data in `n2-home-inn-stage.js`, add a pure UMD interaction engine in `moonview-inn-interactions.js`, and let `lantern-alley.html` render and wire the browser UI. The pure engine determines completion, failure, resets, and serialization; the page handles DOM input, speech, reactions, and progression.

**Tech Stack:** Plain HTML/CSS/JavaScript, browser speech synthesis, localStorage, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-20-moonview-inn-direct-interactions-design.md`

## Global Constraints

- Keep only Alley Entrance and Moonview Inn as current map locations.
- Preserve the existing Alley Entrance animation and dialogue behavior.
- Use no new dependencies and no generated images for this prototype.
- Support mouse, touch, keyboard, and reduced motion.
- Do not commit or push changes without explicit user authorization.

---

### Task 1: Pure Interaction Engine

**Files:**
- Create: `moonview-inn-interactions.js`
- Create: `moonview-inn-interactions.test.mjs`

**Interfaces:**
- Produces: `MoonviewInnInteractions.create(mechanic)`, `apply(state, action)`, `isComplete(state)`, `serialize(state)`, and `restore(value)`.
- State shapes: arrange `{placed:{futon1:false,futon2:false,pillow1:false,pillow2:false}}`; replace `{oldRemoved:false,newPlaced:false}`; warm `{temperature:20,released:false}`; coordinate `{arrivalA:15,arrivalB:16}`; undertake `{accepted:false,luggageDelivered:false}`.

- [ ] **Step 1: Write failing state-transition tests**

Test successful and failed boundaries using literal actions: all four correct placements; old towel removed before new placement; warm success from 55 through 65 and overheat above 65; non-overlapping arrivals inside 14 through 19; acceptance before luggage delivery. Test malformed restore returning the mechanic default.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test moonview-inn-interactions.test.mjs`

Expected: FAIL because `moonview-inn-interactions.js` does not exist.

- [ ] **Step 3: Implement the UMD engine**

Expose `root.MoonviewInnInteractions`. Keep state immutable by returning copied objects from `apply`. Return `{state, outcome:"progress"|"success"|"wrong", reason}` so the page can render feedback without duplicating rules.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test moonview-inn-interactions.test.mjs`

Expected: all engine tests pass.

### Task 2: Mechanic Definitions and Phase Mapping

**Files:**
- Modify: `n2-home-inn-stage.js`
- Modify: `n2-home-inn-stage.test.mjs`

**Interfaces:**
- Consumes: engine mechanic names `arrange`, `replace`, `warm`, `coordinate`, `undertake`.
- Produces: every Learn, Practice, Challenge, and review item has `mechanic`, `variant`, `focusWord`, `correct`, `options`, and near-miss feedback.

- [ ] **Step 1: Write failing mapping tests**

Assert the five Learn items map in order to the five mechanic names. Assert every Practice and Challenge item has a recognized mechanic, two variants exist per focus word, and the existing near-miss constraints remain true.

- [ ] **Step 2: Run the stage test and verify RED**

Run: `node --test n2-home-inn-stage.test.mjs`

Expected: FAIL because items lack `mechanic` and `variant`.

- [ ] **Step 3: Add mechanic metadata**

Assign Learn variants `guided`; Practice variants `practice-a` and `practice-b`; Challenge variants `challenge-a` and `challenge-b`. Keep the existing shuffled Challenge order and corrected schedule contexts for 調整.

- [ ] **Step 4: Run stage and engine tests**

Run: `node --test n2-home-inn-stage.test.mjs moonview-inn-interactions.test.mjs`

Expected: all focused tests pass.

### Task 3: Map Cleanup and Persistent Phase State

**Files:**
- Modify: `lantern-alley.html`
- Modify: `n2-home-inn-stage.test.mjs`

**Interfaces:**
- Consumes: `N2HomeInnStage` and `MoonviewInnInteractions` browser globals.
- Produces: map containing only `entrance` and `home-inn`; saved `stageProgress.homeInn` with `phase`, `index`, `medal`, `challengeScore`, `correctWords`, and `misses`.

- [ ] **Step 1: Write failing integration assertions**

Assert the old location keys `crossroads`, `stars`, `fruit`, `tea`, and `festival` are absent from the location data. Assert the interaction script loads before the page script and storage writes `stageProgress`.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test n2-home-inn-stage.test.mjs entrance-stage.test.mjs`

Expected: FAIL while old map locations remain and stage progress is not serialized.

- [ ] **Step 3: Remove undeveloped locations and extend persistence**

Keep entrance and append Moonview Inn. Preserve backward compatibility by treating an existing `starred["home-inn"]` as gold. Save after every correct encounter and phase transition. Resume saved phase and item index when entering Moonview Inn.

- [ ] **Step 4: Run integration tests**

Run: `node --test n2-home-inn-stage.test.mjs entrance-stage.test.mjs`

Expected: map, persistence, and entrance tests pass.

### Task 4: Interactive Tatami Room Renderer

**Files:**
- Modify: `lantern-alley.html`
- Modify: `n2-home-inn-stage.test.mjs`

**Interfaces:**
- Consumes: engine outcomes and stage mechanic metadata.
- Produces: `renderInnInteraction(prompt)`, `performInnAction(action)`, `resetInnInteraction()`, and interaction-specific HTML controls.

- [ ] **Step 1: Write failing renderer contract tests**

Assert the page loads `moonview-inn-interactions.js`, routes stage prompts to `renderInnInteraction`, and includes accessible controls for `data-inn-action`, keyboard movement, a temperature meter, a schedule timeline, laundry basket, bedding targets, luggage, and guest-room target.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test n2-home-inn-stage.test.mjs`

Expected: FAIL because the direct-interaction renderer is absent.

- [ ] **Step 3: Implement the stable room and five mechanics**

Use a `.inn-room` shell with tatami grid, shoji wall, tokonoma, fox reaction area, and `.inn-workspace`. Render illustrated CSS objects. Pointer clicks select and place objects; drag/drop enhances pointer use; Enter or Space selects; arrow keys choose targets or adjust controls; Enter confirms. Every actionable element has a 44px minimum target and descriptive `aria-label`.

- [ ] **Step 4: Connect outcomes to learning progression**

On `success`, show the character reaction and call the existing 1100ms automatic advancement. On `wrong`, show the engine reason plus the N2 near-miss explanation and reset only the active mechanic. Challenge records the first terminal outcome. Learn and Practice do not remove lives.

- [ ] **Step 5: Add phase medals and resume display**

Show bronze after Learn, silver after Practice, and gold after Challenge mastery. Reflect the highest medal on the Moonview Inn map node and resume note.

- [ ] **Step 6: Run all tests and parse the page script**

Run: `node -e "const fs=require('fs');const h=fs.readFileSync('lantern-alley.html','utf8');[...h.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)].map(m=>m[1]).filter(Boolean).forEach(s=>new Function(s));console.log('parsed')"`

Run: `node --test *.test.mjs`

Expected: script parses and every test passes.

### Task 5: Manual Interaction Verification

**Files:**
- Verify: `lantern-alley.html`

**Interfaces:**
- Consumes: completed game.
- Produces: evidence for desktop layout, keyboard flow, touch-sized controls, reduced motion, phase transitions, and saved resume.

- [ ] **Step 1: Open the local page and complete Learn with pointer input**

Verify every visible action matches its Japanese instruction and successful interactions advance once.

- [ ] **Step 2: Complete representative mechanics with keyboard input**

Verify visible focus, Enter or Space selection, arrow adjustment, confirmation, and no keyboard trap.

- [ ] **Step 3: Verify wrong actions and Challenge behavior**

Trigger each near-miss, confirm specific feedback, confirm only the mechanic resets, fail one Challenge attempt, complete focused review, then retry to gold mastery.

- [ ] **Step 4: Reload during Practice and verify resume**

Confirm phase and encounter resume without losing the awarded bronze medal.

- [ ] **Step 5: Verify reduced motion and responsive layout**

Confirm state changes remain understandable without animation and controls remain usable at narrow desktop/mobile widths.
