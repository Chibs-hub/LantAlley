# v324 Pre-Beta Polish Design

## Goal

Prepare the v323 candidate for a small external beta without changing lesson
content or connecting any analytics or feedback service.

## Scope

This pass follows `v323 Pre-Beta Polish Handoff.txt` supplied by the owner.
The required changes are a coherent PWA identity, a quieter title screen,
consistent learner-facing interface language, durable tester instructions,
mobile-safe feedback placement, local fonts where practical, and clearer Inn
room affordances on small phones.

## Deliberately excluded

- Do not add a PostHog key, backend endpoint, or feedback delivery service.
- Do not change Japanese lesson material or perform the deferred native review.
- Do not redraw the Inn room or make broad changes to existing scene art.
- Do not merge or push to `master`.

## Design decisions

### PWA identity

Create one square, navy-and-amber paper-lantern master image with no text. It
will be used to make the normal, maskable, Apple touch, and favicon variants.
The master itself is full bleed and keeps the lantern inside the maskable safe
zone, so the maskable export must not shrink the complete image a second time.
Give each manifest icon URL the current build query so an installed Chromium
app recognizes an icon change while the manifest URL itself stays stable. Create a
separate 1200 x 630 social preview from the current lantern-alley map art and
the same lantern mark, with deterministic title treatment rather than AI-made
text.

### Title screen

Keep `路地へ入る` as the single primary title-screen action. Move Save Data,
About, Start Over, and the build number into one compact `Menu` control. Keep
Install App separately available only where the browser says installation is
relevant. The existing reset confirmation stays on the destructive action.
Each title dialog makes the background controls inert and returns focus to the
visible Menu trigger when it closes.

### Language rule

Use English for learner-facing controls and directions; retain Japanese for
world names, game title, vocabulary, lesson content, and Japanese system UI
that belongs to the world. This pass may alter interface labels only. It will
not rewrite question language or dialogue.

### Fonts

Self-host the current Shippori Mincho and Zen Maru Gothic families only if
their official SIL Open Font License files and variable WOFF2 payload sizes
are reasonable. Prefer one variable file per family over many subset files.
Keep existing system fallbacks. Cache local font assets in `sw.js`.

### Small-phone Inn actions

Use the existing room illustration and object placement. When a learner has
selected an object, show compact labels for destinations, preserve at least a
10px invisible tap margin, prevent labels from colliding, and keep an active
outline/pulse. Do not scale or reposition the painting itself.

### Verification

Use rendering tests where available. Check desktop and 320x568, 375x667, and
390x844 browser layouts. When PWA assets change, verify the manifest, shell
cache, and a fresh cache-busting page URL. No claim of feedback delivery is
made without a configured destination.
