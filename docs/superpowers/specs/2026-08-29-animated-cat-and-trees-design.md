# Animated Cat and Tree Growth Design

## Goal

Add beautiful, consistent sakura and maple growth art plus one autonomous long-haired calico cat that moves naturally between the house and yard without affecting lessons.

## Tree assets

Sakura and maple each use five transparent WebP stages: planted, sprout, sapling, young, and mature. Every stage shares one ground anchor, perspective, lighting direction, and canvas size. Existing saves continue mapping their four logical growth states to the nearest visual stage; the young stage is used during the upper half of `growing`.

## Cat assets

The cat is one cream, orange, and black long-haired calico. Production art is delivered as transparent sprite sheets with a consistent side-view scale and ground line:

- Eight-frame walk cycle.
- Sit and stand transitions.
- Loaf, curled sleep, side sleep, sniff, groom, stretch, look-up, and paw/play behaviors.
- Door-enter and door-exit transition frames.

Mirroring supplies opposite-facing movement. The cat is always a separate sprite; furniture, rocks, shade, windows, and cushions are authored scene anchors rather than baked composites.

## Runtime behavior

`home-pet.js` owns a deterministic state machine. It chooses only valid anchors in the current scene, follows authored paths, moves position at display refresh rate, and advances sprite frames at 10-12 FPS. It idles for varied intervals, selects behaviors compatible with the destination, and uses the door path when changing between yard and room.

The pet is cosmetic. It never blocks placement, changes rewards, spends money, requires feeding, or interrupts dialogue. The selected destination and animation are not persisted; returning home starts from a safe scene anchor. Reduced-motion mode uses static poses and crossfades. Hidden tabs pause animation.

## UI and accessibility

The cat renders below menus and above the scene background. It has `aria-hidden="true"` because it communicates no required information. Pointer events are disabled. Mobile uses the same anchors and percentages. The cat is absent from the shop stage.

## Verification

Tests cover asset existence, stage mapping, valid anchor selection, door-only scene transitions, reduced motion, hidden-tab pause, non-interference with placement, and rendered desktop/mobile bounds. The standalone artifact must remain below 16 MB.
