# Pet Motion and Scene Capacity Design

## Status

Approved in conversation on 2026-09-25, with cat gait correction added to the approved scope.

## Brief

- User: a learner arranging a personal home and choosing which owned pets are out.
- Job: see every pet they put out, without pets covering one another, and see cats and dogs walk rather than slide.
- Current behavior: active pets are unlimited; initial positions and moving blockers consider only the same species; one owned pet can be activated repeatedly; later pets can stack beneath earlier pets. Cat and dog pose changes advance too quickly for their ground travel.
- Desired outcome: every active pet has a visible, physically supported, non-overlapping position; activation stops with a clear message when no safe position remains; cat and dog foot cycles match body travel.
- Success signal: mixed-species capacity tests find no overlapping assignments, full scenes reject another activation without losing ownership, and gait tests hold one effective foot-contact cycle to its calibrated body-length travel.
- Non-goals: feeding, pet needs, pet persistence between exact resting positions, new pet artwork, smaller pet scale, or changing lesson behavior.
- Object: an owned pet instance.
- Action, scope, consequence: `Put out` adds one owned inactive instance to the active scene set when both home scenes can place the resulting set safely. `Board` removes one active instance and remains reversible. Buying always creates ownership; activation is conditional on capacity.
- Permissions: every player who owns a pet can manage it.
- Open decisions: none.

## Product behavior

The existing inline pet manager remains the only control surface. It shows `active / owned` for each species. This reuses the current pattern rather than adding a dialog or setting (`rule/smallest-intervention`, `rule/inline-before-modal`).

Buying a pet always succeeds when the player can afford it. The new instance becomes active only if the capacity check succeeds for both yard and interior. If it cannot be active, it remains owned and stored, and the purchase message states both outcomes.

Pressing `Put out` performs the same two-scene capacity check before changing state. When full, it leaves the active list unchanged and shows:

`この場所はいっぱいです。これ以上ペットを出せません。`

No selected pet is silently hidden or stacked. Existing saves whose active list exceeds safe capacity are normalized deterministically: the earliest active instances remain out, later instances return to owned storage, and a one-time message states how many were returned. Ownership is never removed. These are explicit populated, full, and migrated-overflow states (`rule/cover-reachable-states`, `rule/preserve-mental-model`).

## Shared placement architecture

Add a pure `home-pet-layout.js` module between the species motion modules and `app.js`.

Inputs:

- scene name;
- ordered active pet instance IDs and species;
- candidate anchors returned by each species module, including contextual plant anchors;
- decor and plant blockers;
- each pet's rendered width at the candidate depth.

Output:

- one deterministic anchor assignment per active instance; or
- a capacity failure naming the first unassigned instance.

The allocator sorts pets by required footprint, largest first, while retaining instance ID as the stable tie-break. It filters candidates that intersect decor, plants, or an already assigned pet. Ground cats, ground birds, and Shiba share one occupancy map; elevated bird supports use their own elevation band. Candidate order is seed-stable so reopening a scene does not reshuffle pets arbitrarily.

Each species receives additional authored anchors on visible, physically supported surfaces. Anchors are not generated over arbitrary image coordinates. The room uses the back and front tatami lanes plus open thresholds; the yard uses the central path, veranda, fence, stones, and contextual plant shoulders. This increases capacity without shrinking pets or placing them off the floor.

Initial rendering uses the allocator's complete assignment instead of the current same-species `takenIds` pass. During motion, an active pet's current position and destination are reservations for every other pet, regardless of species. A route may begin only when its destination and path remain clear. If no route is clear, the pet rests at its assigned anchor; it does not disappear or overlap.

Capacity is the number of safe assignments available in the more constrained of the two home scenes. This guarantees that entering the room or yard cannot make an active pet vanish.

## Walking motion

Cat and dog walking remain distance-driven, because elapsed-time animation lets paws cycle while the body slows near a destination.

The stride calculation uses effective foot-contact poses rather than sprite-sheet frame count:

- Cat: frames 0/2 and 1/3 are two contact-pose families. One visible alternating cycle advances approximately 0.56 body lengths.
- Shiba amble: the two size-stable contact poses advance approximately 0.56 body lengths per cycle.
- Shiba trot: the two size-stable contact poses advance approximately 0.44 body lengths per cycle.

Each pose transition therefore occurs after half the relevant cycle distance. This restores the ground travel lost when the Shiba was reduced from four frames to two and corrects the cat's duplicated-pose cycle. Pace profiles still change travel speed, but not stride geometry.

Screen movement moves to compositor transforms. The position carrier uses `translate3d`; a nested visual layer owns depth scale, ground anchoring, facing, and breathing so these transforms cannot overwrite one another. Position and depth updates no longer animate `left`, `top`, or `width`. Hidden tabs continue to pause animation. Reduced-motion mode keeps a supported static pose and instant reassignment.

## State and failure handling

- No owned pets: manager is absent, as today.
- Owned but inactive: count shows `0 / owned`; `Put out` is available.
- Active with space: every instance receives a distinct visible assignment.
- Full: `Put out` performs no mutation and gives the clear full message.
- Purchase while full: ownership and payment complete; the message says the pet was bought and remains stored.
- Decor change invalidates an anchor: re-run allocation for the complete active set before painting. If the new layout cannot fit all active pets, later instances return to storage with a one-time count message rather than being covered.
- Reduced motion: assignments still change, but pets do not traverse the route.
- Legacy over-capacity save: preserve ownership, normalize only the active list, explain once.

These states cover every reachable result of purchase, activation, scene change, and decor change (`rule/cover-reachable-states`, `rule/error-states-recovery`).

## Files and boundaries

- `home-pet-layout.js`: deterministic cross-species assignment and capacity checks.
- `home-pet.js`: cat anchor catalogue and calibrated contact-cycle stride.
- `home-dog.js`: Shiba anchor catalogue and calibrated amble/trot strides.
- `home-bird.js`: support/elevation metadata needed by shared allocation.
- `app.js`: ownership actions, allocator integration, full-state messaging, and transform-based rendering.
- `styles.css`: separate position, depth/facing, and artwork transform layers.
- `index.html`, `sw.js`, `manifest.webmanifest`: module loading and release cache version.
- focused unit tests plus `pwa.test.mjs`: allocation, state, offline loading, and release coverage.

## Verification

Automated tests must prove:

1. Cat and Shiba effective gait cycles advance the calibrated body-length distance.
2. Pose changes remain tied to distance while arrival slows.
3. A mixed set of cats, birds, and Shiba receives distinct non-overlapping assignments in yard and interior.
4. The center-piece-plus-two-screens room still supports its tested pet capacity.
5. A full scene rejects one more activation without changing ownership or active state.
6. Buying while full adds ownership, charges once, and leaves the instance inactive.
7. One owned instance cannot create unlimited active instances.
8. Moving decor reassigns pets or explicitly returns overflow to storage.
9. Reduced motion produces supported static poses.
10. The service worker caches the new module and every versioned local URL matches the release.

Rendered verification at phone and desktop widths must confirm paw cadence against ground travel, no clipping at near-edge anchors, no pet overlap in the supported maximum mixed set, no layout-property animation, and no console errors. Motion is also inspected at 0.1x speed to expose foot slip and transform-origin errors.
