# Tester Release Safety and Insight Design

## Goal

Make a small external test safe for players and useful for the owner without
adding a survey, account wall, or invasive recording.

## Decision

Use PostHog Cloud as the optional analytics provider. The application owns a
small telemetry adapter; no gameplay module calls a vendor API directly. The
adapter has no effect until the owner sets a public PostHog project key in one
local configuration file. The project key is intended for browser use and is
not a secret.

The test build sends only anonymous, allow-listed product events. It does not
send answer text, Japanese responses, free-form narration, player-entered
names, session recordings, or automatic click capture. A visible setting lets
the player stop anonymous measurement. The owner must publish a suitable
privacy notice before inviting a broad public audience.

## Player-facing flows

### Restart

`最初から` opens a modal instead of clearing progress immediately. The modal
explains that this browser's progress and home items will be removed. It has
one safe default action, Cancel, and one destructive action, Start again.
Only the destructive action calls the existing reset logic. Escape, backdrop
clicks, and Cancel close the dialog without changing progress. Focus returns to
the restart button.

### Storage warning

The application records whether its most recent local-storage read or write
succeeded. A failed read or write displays a persistent warning above the
current screen: progress is not being saved and the player should keep the tab
open or export if the existing data can still be read. A successful later save
removes the warning. The warning is a status message, not a blocking dialog.

### Feedback

One small `Feedback` button is available from the title screen and while
playing. It opens a modal with four large choices:

- Bug
- Confusing
- Too hard
- I liked this

Choosing a type sends the report immediately, shows a thank-you status, and
closes the modal. An optional details field is available but never required.
Only an explicit Send includes the optional text. Every report automatically
adds the build, current screen, current location, current section, and a
question identifier when one exists.

### Analytics notice and setting

When a project key is configured, the title screen includes a compact text
link, `Anonymous test data`, that opens a short explanation and an on/off
toggle. Analytics begins enabled for the dedicated tester build, uses a random
per-browser anonymous identifier, and stops immediately when the player turns
it off. It remains disabled when no project key is configured. Resetting game
progress does not reset the anonymous identifier, so return-rate measurement
remains accurate.

## Analytics contract

The adapter adds these common properties to every event:

```js
{
  build: "320",
  screen: "title | map | entrance | inn | episode | home",
  location: "entrance | home-inn | home | ... | null",
  section: "training | inn-e01 | inn-e02 | inn-e03 | inn-e04 | null",
  question_id: "stable authored id or null",
  device_class: "phone | tablet | desktop"
}
```

The game emits exactly these event names:

```text
app_opened
new_player_selected
entrance_started
entrance_completed
inn_training_started
inn_training_completed
episode_started
episode_completed
reward_claimed
home_visited
feedback_submitted
progress_reset
storage_failed
app_error
```

`episode_started` and `episode_completed` include `episode_id`. `reward_claimed`
includes `reward_id`. `feedback_submitted` includes only the chosen category
and optional text explicitly sent by the player.

The owner can create three PostHog insights:

1. Funnel: `app_opened` -> `entrance_completed` -> `inn_training_completed`
   -> `episode_completed` -> `reward_claimed` -> `home_visited`.
2. Retention: users who trigger `app_opened` again one, three, and seven days
   after their first `app_opened`.
3. Drop-off: `inn_training_started` to `inn_training_completed`, then each
   `episode_started` to matching `episode_completed`, split by `device_class`
   and build.

## Failure behavior

Telemetry must never stop a lesson, reset progress, or surface a vendor error.
The adapter catches loading and network failures, retains no unbounded queue,
and becomes a no-op when PostHog is unavailable. Browser errors are captured
only after the telemetry adapter is ready and are reduced to message, source
file name, and current game context; stack traces and player content are not
sent.

## Small-phone verification

The release check uses 320x568, 375x667, and 390x844 viewports. It exercises
the Inn's object taps, two-step placement controls, answer choices, replay,
feedback button, reset modal, and reward actions. Each interactive control
must have a 44x44 CSS-pixel effective hit target, remain visible without
horizontal page overflow, and not be covered by the update bar or a feedback
surface.

## Files and boundaries

| File | Responsibility |
| --- | --- |
| `telemetry-config.js` | Public owner configuration and safe disabled default. |
| `telemetry.js` | Anonymous event allow-list, PostHog loading, consent and no-op failure behavior. |
| `telemetry.test.mjs` | Adapter behavior without a network or PostHog account. |
| `app.js` | Event call sites, reset confirmation, storage state and feedback context. |
| `index.html` | Modals, controls and script order. |
| `styles.css` | Accessible dialogs, warning and small-phone hit areas. |
| `walkthrough.test.mjs` | Real rendered-flow regression tests. |
| `pwa.test.mjs`, `sw.js` | Offline shell accounting for the new local modules. |

## Non-goals

- No user accounts or personal profiles.
- No analytics dashboard embedded in the game.
- No session replay, heatmaps, autocapture, advertising identifiers, or
  individual answer text.
- No server-side proxy or database.
- No automatic screenshot attachment to feedback.
