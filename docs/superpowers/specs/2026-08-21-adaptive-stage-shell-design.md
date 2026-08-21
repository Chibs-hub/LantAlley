# Adaptive Stage Shell Design

Date: 2026-08-21
Status: Awaiting user review

## Decision

Lantern Alley will use one adaptive stage shell that changes its arrangement according to available width, available height, and interaction type. The Japanese request and the answer surface remain visible together throughout the answer action.

This replaces the current narrow vertical stack. It does not replace any learning interaction, stage state, story, or scoring behavior.

## Product brief

- User: a Japanese learner using the web app or installed PWA on desktop, tablet, or phone.
- Job: understand the Japanese request and complete the requested action without scrolling back and forth to remember it.
- Current behavior: status, narration, dialogue, instructions, scene, hints, and feedback are stacked inside a 680px column. The scene begins below the dialogue and often falls outside the viewport.
- Desired outcome: the current request and all materials needed to answer it are organized as one workspace and fit in a common desktop or tablet viewport. On a phone, the request remains visible while the action area scrolls naturally below it.
- Success signal: at 1366x768, 1024x768, and 768x1024, a normal Learn encounter shows the request, destinations, objects, and primary action without page scrolling. At 390x844, answering may require one vertical page scroll, but never scrolling back to recover the request.
- Non-goals: changing lesson content, simplifying Japanese, removing context, changing answer mechanics, adding a settings toggle, or building separate desktop and mobile applications.
- Object: the active learning encounter.
- Action, scope, consequence: layout changes only; it affects every current and future stage encounter and is reversible through CSS and markup changes.
- Permissions: all learners receive the same adaptive behavior; no gated path exists.
- Open decisions: none. The terminal selection of Adaptive Stage Shell is authoritative.

## Information architecture

The game screen is divided into three regions:

1. Stage bar: back navigation, phase, progress, hearts, stars, and restart.
2. Learning context: story setup, Kon, Japanese request, audio, and optional romaji.
3. Answer workspace: How to interact, observable scene clue, destinations, answer objects or controls, status, hint, and feedback.

The stage bar is compact and spans the available width. Learning context and answer workspace are peers, not nested card stacks. Grouping relies on alignment and spacing before borders. This follows `rule/structure-before-containers`.

The Japanese request stays in learning context and is never replaced by answer feedback. This preserves the learner's mental model and follows `rule/preserve-mental-model`.

## Responsive behavior

### Wide: 900px and above

- Maximum game width is 1100px.
- The stage bar spans both columns.
- Learning context occupies about 38 percent of the width.
- Answer workspace occupies about 62 percent.
- Kon, the request, romaji, and audio remain in the left column.
- Destinations and answer objects remain together in the right column.
- The current object, schedule, reply, and Entrance encounters target one viewport at 768px height without page scrolling.

### Compact: 600px to 899px

- The two-region layout remains when both columns preserve readable Japanese and 48px touch targets.
- Columns move toward a 42/58 proportion.
- Decorative padding, large empty room height, and oversized scene furniture reduce first.
- If width or height becomes insufficient, the shell switches to the narrow arrangement instead of shrinking controls.

### Narrow: below 600px

- Regions stack in this order: compact stage bar, story setup, sticky Japanese request, answer workspace, feedback.
- The request panel uses `position: sticky` beneath the compact stage bar while the learner acts.
- Kon's portrait becomes smaller, but the full Japanese request remains readable.
- Romaji stays available through the existing toggle and may wrap below the Japanese.
- How to interact remains collapsed until opened.
- The page uses one natural vertical scroll. No nested answer-pane scroll is introduced.
- The user never needs to scroll upward to recover the request.

### Short screens

When viewport height is 800px or below, the shell reduces vertical gaps and decorative room height while preserving text size, touch targets, request content, and answer controls. It does not hide learning material merely to satisfy a no-scroll target.

Responsive and long-content states are explicitly covered under `rule/cover-reachable-states`.

## Interaction-specific adaptation

The shell is stable, but the answer workspace adapts to the task.

### Object movement

- Destinations form the upper grid.
- Available objects form a compact lower tray.
- Both remain in the same visible workspace on wide and compact screens.
- Phone layout uses tap-to-place as the primary convenient path while drag remains supported.

### Schedule adjustment

- The timeline spans the answer workspace width.
- Time controls appear below it in one or two columns according to available space.
- Confirm and alternate action buttons wrap without leaving the workspace.

### Dialogue replies

- Reply choices use the full answer-workspace width.
- The decorative room background is omitted because it contributes no answer information.

### Entrance tutorial

- Wide screens place Kon and the player action surface side by side.
- Narrow screens keep Kon's request sticky above the action choices.

This is the smallest shared intervention that supports future stages and follows `rule/smallest-intervention`.

## Accessibility and input

- Every existing button keeps its accessible name.
- Primary flows remain keyboard-completable with visible focus under `rule/keyboard-complete-flow`.
- Touch targets remain at least 48px during responsive compression.
- Reading order in the DOM remains stage bar, learning context, then answer workspace, matching the narrow visual order.
- Sticky content never covers focused controls or feedback.
- Reduced-motion behavior remains unchanged.

## Implementation boundaries

- Add semantic wrappers for stage bar, learning context, and answer workspace in `index.html`.
- Update `app.js` only where screen display mode or interaction-specific shell classes must be selected.
- Implement layout, breakpoints, short-height density, and sticky behavior in `styles.css`.
- Keep all stage data and interaction engines unchanged.
- Rebuild `lantern-alley-artifact.html` and increment the service-worker cache version.
- Update `PROJECT-HANDOFF.md`.

## Verification

- Add a regression test for the shared shell structure and interaction-specific layout classes.
- Run the complete Node test suite.
- Render and inspect at 1366x768, 1024x768, 768x1024, 430x932, and 390x844.
- Verify object movement, schedule adjustment, dialogue replies, and the Entrance tutorial.
- Confirm no horizontal overflow, clipped controls, hidden feedback, or content beneath sticky regions.
- Confirm desktop/tablet normal encounters need no page scroll and mobile never requires scrolling back to reread the request.
