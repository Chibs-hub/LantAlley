# Moonview Inn learning redesign

**Goal:** Make the introductory Inn route less repetitive while preserving evidence that every taught word was learned, and make the four Inn episodes easier to read as a single shift.

**Approved visual reference:** `inn-learning-mock.html`

## Scope

1. Keep the five Learn interactions, reduce Practice to three retrieval items, and reduce Challenge to two audio-only items.
2. Track successful Learn, Practice, Challenge, and repair answers as training evidence. Unlock only when all five taught words have evidence and the two Challenge prompts are completed correctly.
3. Show ruby only for non-target support words in Learn. Practice uses tappable support-word glosses; Challenge hides support until the answer is settled.
4. Add a compact five-beat shift tracker to each ten-question episode using existing Inn art.
5. Rename the misleading global romanization label. Do not create raster art unless the existing seven Inn scenes prove insufficient.

## Tests first

- `learning-gloss.test.mjs`: ruby mode adds readings only to non-excluded support words.
- `n2-home-inn-stage.test.mjs`: phase counts are 5/3/2, all five words have learn evidence, and completion requires five recorded words plus two Challenge answers.
- `n2-inn-episodes.test.mjs`: every episode supplies five authored shift beats.

## Implementation and verification

1. Add the tests and confirm they fail against v218.
2. Implement the data, state evidence, ruby rendering, compact new-word card, and episode tracker.
3. Update version stamps and offline cache to v219, changelog, and handoff.
4. Run the focused tests, full `node --test`, build the standalone demo, and browser-check desktop and 390px mobile.

No commit or push is authorized by this plan.
