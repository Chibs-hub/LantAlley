# Illustrated Room Implementation Plan

> Execute this plan in the current checkout. Do not commit or publish without user approval.

**Goal:** Replace the abstract Moonview Inn object grid with the approved illustrated ryokan room while preserving every existing learning rule and interaction.

**Design source:** `PROJECT-HANDOFF.md`, section 9, and `.superpowers/brainstorm/responsive-stage-20260821/content/illustrated-room-mockup-v3.html`.

**Architecture:** Keep `moonview-inn-interactions.js` as the source of behavior. Add visual metadata to the shared `ROOM`, render room destinations as accessible hotspots over one empty background image, and render each movable object as an independent transparent sprite. Re-render from interaction state after each action so an object appears in exactly one location.

**Constraints:** Keep tap-then-place and drag controls, Japanese question text, English interaction help, two-step replacements, appliance-specific warming, responsive desktop/mobile layout, offline PWA support, and the self-contained artifact build.

---

### Task 1: Create production room artwork

- [x] Generate an empty illustrated ryokan room that preserves all destination fixtures but contains no movable objects.
- [x] Generate a transparent sprite sheet containing every cushion, old/new replacement item, and dish.
- [x] Inspect both assets for recognizability, alignment, and duplicate objects.

### Task 2: Define and test the visual contract

- [x] Add a failing test requiring a visual entry for every movable item and destination.
- [x] Add normalized hotspot coordinates and sprite cells to the shared `ROOM` data.
- [x] Verify no item or destination is missing or assigned twice.

### Task 3: Implement the illustrated interaction surface

- [x] Replace the abstract room markup with an image stage, destination hotspots, and a wooden supply shelf.
- [x] Render movable objects from the sprite sheet in their current state location.
- [x] Keep captions hidden until focus, hover, or selection while preserving accessible names.
- [x] Adapt hotspot and shelf sizing for desktop, short screens, and phones.

### Task 4: Package and document the change

- [x] Add the new assets to the offline cache and bump its version.
- [x] Regenerate `lantern-alley-artifact.html` and confirm it remains below 16 MB.
- [x] Update `PROJECT-HANDOFF.md` with the implementation, files, behavior, and current test count.

### Task 5: Verify the result

- [x] Run the complete Node test suite.
- [x] Test the local app at desktop and mobile widths.
- [x] Complete at least one arrange, replace, and warm interaction and confirm no duplicate sprite remains.
