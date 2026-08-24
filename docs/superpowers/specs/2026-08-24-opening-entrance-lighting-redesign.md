# Lantern Alley Opening, Entrance, and Room Lighting Redesign

Date: 2026-08-24
Status: Implemented and verified

## Goal

Make the first experience feel like entering the same illustrated world used by the map and Moonview Inn. The opening should establish the setting immediately, the Entrance should teach the game through one coherent scene, the learner's bow should look physically correct, and the bulb replacement should visibly change the room lighting.

## Visual direction

Use the approved Cinematic Alley direction. Reuse the project-owned `assets/map/lantern-alley-map-v1.jpg` as the visual foundation so the opening, Entrance, map, and later stages belong to one world. Use the existing transparent Kon pose assets inside the scene rather than a portrait card with a visible background.

The interface uses the current dark indigo, lantern amber, warm washi, and restrained wood palette. Japanese is the primary interface language. English appears only in the short `HOW TO INTERACT` mechanic helper.

## Opening screen

The opening is an immersive illustrated cover rather than a large text card.

- Show the alley artwork edge to edge inside the adaptive game frame.
- Place `言葉の路地` as the dominant title and `LANTERN ALLEY` as a small secondary title.
- Place Kon naturally in the foreground without a rectangular image background.
- Use one clear primary action: `路地へ入る` for a first visit or `路地へ戻る` for a returning learner.
- Remove the long English introduction. The visual and Entrance tutorial explain the premise.
- Show saved progress only when it exists, in one compact line that does not compete with the primary action.
- Keep `最初から` secondary and visible only when saved progress exists.

## Alley Entrance tutorial

The Entrance is a dedicated illustrated gate scene, not a generic lesson card.

- Show `路地の入口` and a three-step progress indicator at the top.
- Keep Kon and the learner visible together inside the scene.
- Place Kon's dialogue in a compact washi shelf along the bottom of the scene.
- Preserve the current click-anywhere conversation behavior: the first non-control click finishes speech and reveals the line, and the next click advances when advancement is allowed.
- Keep the tutorial story order: greeting, world explanation, action request, completion leading to destination choice.
- Display answer actions only during the request step. The three choices remain `お辞儀`, `手を振る`, and `拍手`, with a picture or motion preview carrying more visual weight than the text.
- Put `HOW TO INTERACT` above the action area, outside the dialogue and answer content.
- Do not preselect an answer and do not show a check mark before the learner acts.
- After the correct action, Kon responds in Japanese and the completion line leads to the open destination map.

## Correct bow motion

The learner's bow must read as a polite standing bow.

- Both feet remain planted and the legs remain stable.
- The head, torso, and arms move as one upper-body unit from a pivot at the hips.
- The back stays straight instead of curling or rotating around the neck.
- The hands remain naturally beside the thighs and move with the upper body.
- The upper body bends forward about 25 to 30 degrees, pauses briefly, then returns upright.
- Use an interruptible CSS transition or a short Web Animations sequence driven by the action. Do not animate layout properties.
- Total motion should remain near 1.2 seconds so the feedback is clear without delaying the lesson.
- In reduced-motion mode, show the bent pose briefly or use an instant state change without travel.

## Bulb replacement lighting

Only bulb-replacement encounters change room lighting. Towel and sheet replacement, arranging, warming, scheduling, and dialogue encounters keep the normal room appearance.

- Before the broken bulb is removed, place a translucent cool-dark overlay over the illustrated room.
- Keep the room dim after the broken bulb is removed.
- When the new bulb is installed, fade the dark overlay away and introduce a warm glow centered on the wall fixture.
- Settle into the normal bright room state in about 500 milliseconds.
- The effect is visual feedback after the decisive learner action. It must not add another required step.
- The overlay and glow must not intercept pointer input or cover draggable objects and controls.
- Reduced-motion mode changes the lighting state immediately, without a pulse.

## Adaptive layout

Desktop keeps the complete opening or Entrance scene visible inside the common viewport where practical. The Entrance scene uses a spatial layout: characters in the world, dialogue along the bottom, and actions grouped to one side.

At narrow widths, preserve the scene crop and character relationship, then place dialogue and actions in a compact stack below the visual. Keep all controls at least 44 by 44 CSS pixels and avoid horizontal scrolling. The opening keeps one primary action above the fold.

## Implementation boundaries

Expected production changes:

- `index.html`: replace the opening markup with the cinematic scene shell and add semantic Entrance scene regions if needed.
- `styles.css`: add adaptive opening, Entrance, bow, and room-light state styles, including reduced-motion paths.
- `app.js`: render opening progress text, drive Entrance visual states, apply the corrected bow sequence, and expose bulb off/on classes from the existing replacement state.
- `entrance-stage-logic.js`: retain the current tutorial order and Japanese lines; add only presentation-state helpers if they make behavior testable.
- `entrance-stage.test.mjs`, `moonview-inn-interactions.test.mjs`, `n2-home-inn-stage.test.mjs`, and `pwa.test.mjs`: add focused regression coverage.
- `sw.js`: bump the cache only if production assets or shell content change.
- `lantern-alley-artifact.html`: regenerate from source; never edit it directly.
- `PROJECT-HANDOFF.md`: record each implementation checkpoint and final verification.

No new stage, scoring rule, answer mechanic, or remote publication is included.

## Verification

Automated checks must prove:

- The opening contains the Japanese title, one primary entry action, and no long legacy English introduction.
- Returning progress remains available without dominating the opening.
- Entrance keeps its four-step story state while visibly presenting three tutorial beats and the final map transition.
- Answer controls appear only for the request and are not preselected.
- Bow styling uses a hip-origin upper-body motion, stable legs, bounded timing, and a reduced-motion rule.
- Bulb encounters resolve to dim before installation and bright after installation, while other interactions stay normally lit.
- The light effect does not add an extra answer step.
- The offline shell and standalone artifact contain all required code and project-owned artwork.

Rendered checks must cover desktop, 390-pixel phone, and 320-pixel compact phone layouts. Verify the complete opening hierarchy, Entrance dialogue and action reachability, correct bow silhouette, bulb off/on contrast, no horizontal overflow, and no console errors.
