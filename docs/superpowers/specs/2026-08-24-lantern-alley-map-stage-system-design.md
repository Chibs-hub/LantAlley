# Lantern Alley Map and Stage System Design

Date: 2026-08-24
Status: Implemented and verified

## Decision

Lantern Alley will replace its abstract node graph with one illustrated neighborhood map. Every destination is a recognizable place in the same alley, and selecting a place reveals one compact story panel explaining why Kon and the learner would go there.

The map is the hub between stages. It supports free destination choice without suggesting that an unfinished stage is playable.

## Product brief

- User: a Japanese learner who has completed the Entrance tutorial and wants to choose where to continue.
- Job: understand the available destinations, remember progress, and enter a stage without deciphering an abstract graph or legend.
- Current behavior: the map is a beige diagram of circular emoji nodes connected by dashed lines. It visually suggests six locations even though only the Entrance and Moonview Inn exist.
- Desired outcome: the learner sees a believable lantern alley, recognizes each place from its building, selects a destination, reads Kon's short story reason, and enters one playable stage.
- Success signal: a first-time learner can identify the current playable destination and open it without reading a legend; a returning learner can identify completed, in-progress, available, and future destinations at desktop and phone widths.
- Non-goals: implementing four complete new lessons in the map redesign, changing Moonview Inn learning mechanics, introducing a currency, adding map panning, or forcing a fixed stage order.
- Object: a destination in Lantern Alley.
- Action, scope, consequence: selecting a destination changes only the compact detail panel; entering a playable destination navigates to its stage; progress is preserved and the map remains the return point.
- Permissions: all destinations can be inspected; only stages with complete content and tests can be entered.
- Open decisions: the vocabulary sets and full encounter designs for the four future stages require separate lesson designs before those places become playable.

## World and destination structure

The neighborhood contains six stable places:

1. 路地の入口: Kon introduces the world, Japanese listening, and action-based answers.
2. 月見宿: household preparation, object movement, requests, and responsibility.
3. 灯り市: choosing, comparing, counting, carrying, and exchanging goods.
4. 夕月茶屋: ordering, serving, temperature, sequence, and polite requests.
5. 路地駅: directions, schedules, destinations, and transfers.
6. 灯守神社: position, movement order, preparation, and polite social actions.

Each stage is one coherent visit with a reason for helping an inhabitant. Kon introduces the situation before the first request, responds to each answer, and closes the stage by returning the learner to the alley. Kon may mention several places that need help, but never chooses the next destination for the learner.

This preserves free choice and the learner's map context under `rule/preserve-mental-model`.

## Map interaction

The illustrated map dominates the screen. Buildings and landmarks are the spatial anchors; small labeled lantern pins provide reliable keyboard and touch targets.

Selecting a pin:

- keeps the learner on the map;
- visually lights the selected lantern;
- updates one detail panel with the destination name, progress state, Kon's reason for visiting, and a short description of the interaction style;
- presents one primary enter or continue action only when the stage is playable.

The destination control changes the selection. The enter control performs navigation. This follows `rule/navigation-vs-action` and `rule/one-primary-action`.

No modal, carousel, horizontal pan, or separate legend is added. Selection details stay inline under the map under `rule/inline-before-modal` and `rule/smallest-intervention`.

## Honest availability and progress states

Every destination has one of four reachable states:

- Completed: the lantern contains a check and the panel offers replay.
- In progress: the lantern is brightly lit and the panel offers continue.
- Available: the lantern is unlit and the panel offers enter.
- Preparing: the building remains part of the world and can be selected, but the panel says 準備中 and explains that Kon will return when the place is ready. No disabled or dead enter button appears.

At the first rollout, the Entrance is completed or replayable, Moonview Inn is playable, and the four future places are Preparing. A future place becomes Available only when its story, lesson data, interactions, audio, tests, and responsive visual scene are complete.

This covers every real map state without presenting fake functionality under `rule/cover-reachable-states`.

## Visual direction

- One elevated, soft 3D storybook view shows the complete neighborhood at indigo dusk.
- The gate sits in the foreground, the inn and tea house flank the lower lane, the market sits mid-left, the station sits upper-right, and the shrine anchors the upper center.
- Buildings remain recognizable without labels: ryokan, covered market stalls, tea house, station clock and platform, and shrine torii.
- Warm amber lanterns identify interactable locations against navy, cedar, washi, vermilion, and moss surroundings.
- Japanese labels remain short and outside the artwork so they stay crisp, accessible, and localizable.
- Progress uses lantern light plus explicit status text in the selected detail panel; color alone never carries meaning.

## Responsive behavior

### Desktop and tablet

- The full 3:2 neighborhood remains visible without panning.
- The compact selection panel sits directly below the map.
- Destination labels remain attached to their buildings and never cover another pin.

### Phone

- The same complete 3:2 map remains visible, preserving spatial memory.
- Pins and labels reduce in decoration but retain at least 44px interactive targets.
- The detail panel stacks Kon, story, interaction summary, and the primary action.
- The page uses natural vertical scrolling only; the map never introduces internal or horizontal scrolling.

Responsive and long Japanese strings are required states under `rule/cover-reachable-states`.

## Accessibility

- Each destination is a native button with an accessible name containing its Japanese name and progress state.
- `aria-pressed` identifies the selected destination.
- The detail panel uses `aria-live="polite"` so keyboard selection announces the changed place.
- The map is fully usable by keyboard with visible focus under `rule/keyboard-complete-flow` and `rule/no-custom-focus-bypass`.
- The primary navigation task does not depend on image recognition, pin color, hover, drag, or audio.

## Future stage contract

Every new stage must supply:

- a place name and recognizable visual setting;
- a clear story reason for Kon's introduction;
- one coherent problem that connects its encounters;
- a defined Japanese target set and near-miss set;
- answer actions that can only be chosen by understanding the Japanese request;
- correct and incorrect Japanese responses from Kon;
- Learn, Practice, Challenge, review, and mastery behavior compatible with the shared stage shell;
- complete audio coverage, behavior tests, and desktop and phone verification.

The central rule remains unchanged: the Japanese sentence is the only thing that tells the learner what to do.

## Implementation boundaries

- Add a project-owned map background under `assets/map/` without overwriting existing assets.
- Replace the graph paths and emoji circles in `index.html`, `styles.css`, and the map renderer in `app.js`.
- Keep map destinations in structured data with explicit availability and story-detail fields.
- Preserve existing progress keys for Entrance and Moonview Inn; add future keys only when their stages ship.
- Do not create placeholder lesson engines or dead navigation routes.
- Rebuild `lantern-alley-artifact.html`, increment the service-worker cache version, and update `PROJECT-HANDOFF.md`.

## Verification

- Add regression tests for the six destination definitions, four progress states, honest Preparing behavior, and one-primary-action rule.
- Run the complete Node test suite and syntax checks.
- Verify selection and navigation at 1366x768, 1024x768, 736px wide, 390x844, and 320px wide.
- Confirm every destination is keyboard reachable, selection updates the announced detail, and Preparing destinations expose no enter action.
- Confirm there is no horizontal overflow, label overlap, clipped pin, dead button, console error, or failed asset request.
- Rebuild and inspect the standalone artifact.
