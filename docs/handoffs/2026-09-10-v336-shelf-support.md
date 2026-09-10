# v336 shelf support and lighting repair

## Scope

Repair the floating books/ornaments and pasted-on lighting reported in the
home screenshot. No new images, inventory reset, commit, or push.

## Implemented

- Preserve all 16 slot IDs and the single-target-per-shelf interaction.
- Align each row with its actual staggered board, including mirrored slots.
- Lower the bottom contact below the sloping plinth edge.
- Carry width/height clearances through cloneSlots. Fit each shelf object's
  raster aspect ratio inside those limits without stretching it. Existing
  saved placements use the corrected coordinates on their next render.
- Route app.js rendering through LanternHomeDecor.widthForSlot.
- Give built-in and owned furniture the same time-of-day lighting and
  opacity; remove the former 32 percent daylight brightness boost.
- Add surface-contact shadows to shelf objects and purchased cabinets.
- Cache and index are v336. Concurrent work also updates manifest icon stamps
  and scrolls placement targets into view; preserve those unrelated changes.

## Verification

- Regression first failed on shelf-right-2b over empty air, then passed.
- A second failing check caught the sloped base under shelf-right-4b.
- Geometry test covers all seven shelf objects on both shelves: support,
  clearance, and every pair of neighbors. All 25 home-decor tests pass.
- Pixel sampling confirms all 16 contact points land on opaque shelf art.
- Isolated Edge browser: real game rendered at 1280x850 and 390x844, including
  mobile pan to the right shelf. Screenshots visually inspected.
- Four lighting modes have identical computed filters for fixture and owned
  shelves. Shelf contact shadows are present. No page errors.
- Used game controls to put away the books and place them on the left shelf.
- Final full suite: 528/528 passed after the last calibration change.
- Independent read-only review found no blockers in the scoped repair.

Local reproducible browser check: output/verify-shelf.cjs (ignored scratch;
uses the bundled Playwright and isolated storage, not the user's saves).
Screenshots: output/shelf-desktop.png and output/shelf-mobile.png.

## Remaining

- Not deployed. Ask before committing or pushing. Keep master untouched.
- Real-device touch testing is distinct from the browser viewport checks.

The v326 status in the main handoff is historical. v334 replaced the last
six placeholder assets; v335 added eight slots per shelf, but used board-wide
row scans that did not detect unsupported horizontal positions. This repair
tests actual staggered board extents rather than the shelf's outer rectangle.
