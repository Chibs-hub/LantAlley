# Home and Garden Rewards Design

Date: 2026-08-28
Status: Approved for implementation planning

## Goal

Turn earned money into a visible, persistent reward without weakening the learning system. The player owns a starter house, decorates its interior, plants a garden, and sees plants grow through completed learning. Progress must represent demonstrated understanding rather than tapping, waiting, or replay farming.

## Product Structure

The map destination `わが家` opens on the exterior yard. The illustrated starter house is part of that scene. Tapping the house opens the interior. The player may return to the yard from the interior without returning to the alley map.

The starter house is fixed for the first release, but progress includes a `houseTier` field. Future shop entries may replace it with larger houses while preserving all owned furniture, plants, clothing, and currency.

## Visual Asset Model

Use layered raster artwork that matches the warm, lantern-lit storybook rendering used by the Entrance and Inn.

- The yard and starter house exterior use one wide illustrated background.
- Interior rooms use illustrated backgrounds.
- Furniture, decorations, trees, and flowers are separate transparent PNG or WebP assets.
- Placement uses authored scene slots. Slots are invisible until a compatible item is selected.
- Every plant has four visual assets: planted, sprout, growing, and mature.
- Assets must have complete silhouettes, transparent edges where applicable, consistent perspective, matching night lighting, no text, and no watermark.

Initial garden catalogue:

- Cherry tree
- Japanese maple
- Pine tree
- Hydrangea
- Camellia
- Iris
- Chrysanthemum
- Lantern-flower bed

The first implementation replaces the current code-drawn house and decor with production image assets. Existing SVG assets may remain only as a temporary fallback during migration and must not be shown in the finished view.

## Yard Interaction

The yard has eight authored planting areas distributed naturally through the scene. No grid is visible during ordinary viewing.

The bottom dock contains:

- Garden: planted items and their growth state
- Storage: owned items not currently placed
- Shop: seeds, saplings, furniture, wallpaper, clothing, and future house upgrades

Buying a seed or sapling moves it into storage. Selecting it reveals only compatible planting areas. Selecting a planted item offers Move and Store. Moving or storing never destroys ownership or growth progress.

If a destination is unavailable or occupied, the action fails safely and the item remains owned in its previous state.

## Growth and Learning Integrity

Plants grow through learning, not real-world waiting.

- planted -> sprout -> growing -> mature
- A completed lesson grants one growth point only after its correction round is cleared.
- First-time mastery of new material may grant a bonus growth point.
- Replaying already-mastered questions grants no growth.
- Flowers require about 2 to 4 completed lessons.
- Shrubs require about 5 to 7 completed lessons.
- Trees require about 8 to 12 completed lessons.
- A plant card shows the current stage and lessons remaining.
- When the player returns home, only plants whose stage advanced play a short growth animation.
- Mature plants remain permanent, movable decorations. There is no harvesting system in this release.

This follows the Golden Rule: progress is earned by clearing learning and corrections, never by passive time or repeated tapping.

## Interior Decorating

Tapping the exterior house opens the interior. Furniture and decorations are purchased, stored, placed, moved, and removed through the same ownership model as garden items.

Interior slot types include floor, wall, shelf, window, and wallpaper. A slot accepts only compatible items. Replacing wallpaper changes the room layer without consuming or deleting previously owned wallpaper.

Future clothing purchases may use the same shop and ownership model. Clothing selection and character rendering are explicitly deferred from this first implementation.

## First-Visit Tutorial

The first visit to `わが家` starts a one-time guided tutorial led by Kon. Kon speaks in simple Japanese; interaction instructions remain English.

1. Kon welcomes the player and explains that correct learning earns money.
2. The tutorial shows the relationship: buy -> place -> complete lessons -> grow or decorate.
3. The player opens the shop and claims one free starter flower seed.
4. The player plants it in the yard.
5. Kon explains that completed lessons make it grow.
6. The player enters the house.
7. The player claims one free floor cushion.
8. The player places and moves the cushion.
9. Kon explains that furniture, wallpaper, clothing, seeds, trees, and future larger houses use earned money.

The tutorial completion flag persists. A `How it works` control replays the explanation without awarding duplicate starter items.

## Progress Data

Persist the following under the existing progress record:

- `houseTier`
- tutorial completion and starter-claim flags
- owned item ids
- interior placement by slot
- active wallpaper
- garden plant instances
- each plant's type, slot, growth points, growth stage, and pending animation state
- wallet balance

Plant instances need unique ids so two copies of the same flower can have different positions and growth states.

Migration must preserve existing money, furniture ownership, and placement. Existing saves receive the starter house tier and may run the tutorial once, but must never receive duplicate items if an equivalent starter item is already owned.

## Testing and Verification

Pure tests must cover purchases, ownership, compatible placement, moving, storage, unique plant instances, growth thresholds, no replay growth, migration, tutorial rewards, and duplicate prevention.

Rendered walkthrough tests must verify:

- First entry opens the tutorial.
- The free seed can be planted.
- The free cushion can be placed and moved.
- Returning does not replay the tutorial.
- A completed corrected lesson advances growth.
- Replaying mastered content does not advance growth.
- Yard and interior remain usable on desktop and narrow mobile layouts.
- Missing or failed image assets do not make controls disappear.

Every shipped change must update the service-worker cache version, keep the handoff current, and pass `node --test` plus rendered visual verification.

## Deferred Work

- Purchasing and switching to larger house tiers
- Harvesting or farming loops
- Seasonal changes
- Multiple yards
- Clothing equip UI when complete pose assets are unavailable
- Social visits or online sharing
