# Moonview Inn Journey and Rewards Design

## Goal

Turn Moonview Inn from a long, mixed stream of questions into a finite journey
that answers four things at every point: where the learner is, what comes
next, what reward is ahead, and when the Inn story ends.

## Product brief

- **User:** A Japanese learner who has reached Moonview Inn and does not know
  the course structure in advance.
- **Job:** Finish the Inn story without losing their place, while earning a
  home that visibly reflects the work they completed.
- **Current behavior:** The three training days, story episodes, and catalog
  practice use related chrome and rewards are granted on the first home visit.
  The learner can mistake a large catalog for required unfinished work.
- **Desired outcome:** A five-stop route makes the finite story, current stop,
  upcoming reward, and optional practice distinct.
- **Success signal:** At every Inn screen, a learner can say which stop they
  are on, what completes it, and what their next earned item will be.
- **Non-goals:** Do not rewrite the Japanese learning content, alter the other
  four locations, require real-time daily play, or make catalog practice a
  completion requirement.
- **Object:** The Moonview Inn journey.
- **Action, scope, consequence:** Completing training or an episode grants its
  reward exactly once. Replays retain learning value but cannot duplicate
  coins, decor, plants, or the cat.
- **Permissions:** All players can play the route. Debug unlock flags retain
  their existing testing behavior. Existing save data retains owned items and
  the already-visible cat.
- **Open decisions resolved here:** The story is linear; the cat unlocks after
  Episode 4 finishes, even if an optional mastery correction remains before
  the map treats the place as fully mastered.

## Journey model

The route has five ordered stops:

| Stop | Completion | Reward |
| --- | --- | --- |
| Inn Training | Finish all three training days | Floor cushion and 25 coins |
| Episode 1 | Finish the first Inn episode | Camellia seed |
| Episode 2 | Finish the second Inn episode | Hanging scroll |
| Episode 3 | Finish the third Inn episode | Floor lantern |
| Episode 4 | Finish the fourth Inn episode | Living cat and Inn-story finale |

Answer rewards remain unchanged. Completion cash stays deliberately small so
the shop continues to have meaningful prices. Episodes award one permanent
home item each rather than a second large pile of coins.

The pure `LanternInnJourney` module owns the ordered stops, reward metadata,
journey normalization, current-stop lookup, and one-time claiming. It has no
DOM, storage, or home dependency. `learning-progress.js` persists the journey
block alongside existing v3 progress. `app.js` translates a claimed reward
into existing decor, garden, money, and cat state.

This boundary is intentional: reward idempotence must not depend on whichever
screen happened to award it. [rule/cover-reachable-states]

## Visual wayfinding

The Inn stage header gains one compact journey strip:

```text
Training [lit] -- Episode 1 [lit] -- Episode 2 [current] -- 3 [locked] -- 4 [locked]
```

- A lit lantern means completed.
- A softly glowing lantern means current. Its label states the current task,
  such as `Day 2 of 3` or `Question 4 of 10`.
- A dim silhouette means locked. Its reward preview is visible but not
  interactive: cushion, camellia, scroll, lantern, then cat.
- The header still has one primary action on each screen. The strip explains
  progress; it never becomes a second navigation menu. [rule/one-primary-action]
- The map uses the same stop name in its resume action, so entering and
  resuming never changes the learner's mental model. [rule/preserve-mental-model]

Reward screens are inline scene transitions, not modals. They use the existing
painted reward art, a concise reward statement, the earned amount when there
is one, and one primary continuation button. A secondary `Visit home` action
appears only after a home reward. [rule/inline-before-modal]

No new raster artwork is needed. Existing cushion, camellia, scroll, floor
lantern, and cat assets form a coherent reward set.

## Completion motion

Motion is reserved for confirmed progress, not ambient decoration:

- Completing a stop lights its lantern over 420ms using transform and opacity.
- The earned item rises and settles once over 650ms.
- The final cat reveal uses a short pawprint sequence, then reveals the
  existing cat sprite over 900ms. It does not loop.
- `prefers-reduced-motion: reduce` replaces movement with an immediate visible
  state change and preserves all copy and controls.

These animations answer an action and make the changed state visible. They do
not run on page load. [rule/success-state-specific]

## Home and migration

Fresh players do not receive the cushion, camellia, or cat on their first home
visit. Before the first reward, home shows a small empty-state prompt that
names the Inn Training reward and offers a single route back to the Inn.
[rule/empty-state-action]

The existing home tutorial starts only after the player owns the cushion and
camellia. This preserves its original teaching actions while making those
items earned rather than free.

Existing saved games without an `innJourney` block are grandfathered for the
cat because it was previously always present. Existing owned cushion and
camellia items remain untouched. Old saves do not receive duplicate inventory
items. A fresh save begins with every journey reward locked.

## Daily practice

Kon's catalog practice is a secondary map action named `Daily practice`. It
shows only the bounded session scope, current due work, and current streak.
It must not display the total generated catalog size as an obligation. It does
not move the five-stop story route or affect the cat unlock.

## Reachable states

| State | Required behavior |
| --- | --- |
| Fresh player, no Inn reward | Home names the next reward and offers the Inn route. |
| Training in progress | Strip highlights the active day; no episode is selectable. |
| Training complete | Cushion reward appears once, then Episode 1 is the primary continuation. |
| Episode 1 to 3 complete | Matching item appears once; next episode is primary and home is secondary. |
| Episode 4 complete | Cat unlocks once and finale sends the learner home. |
| Replay | Completed stops remain lit; no reward is duplicated. |
| Existing save | Existing cat remains visible and inventory remains intact. |
| Reduced motion | Every state change remains understandable without movement. |
| Missing reward asset | Existing decor SVG fallback keeps the reward usable. |

Every icon-only cue has text or an accessible name, and reward continuation is
keyboard reachable with the existing focus system. [rule/accessible-name-required]
[rule/keyboard-complete-flow]

## Verification

Automated tests cover fresh and legacy journey state, idempotent claims,
persistence, reward placement in existing home data, cat gating, progression
order, replay behavior, and reduced-motion CSS. Browser verification covers
desktop and mobile training completion, each episode reward, final cat reveal,
home before and after rewards, map resume wording, and daily practice scope.
