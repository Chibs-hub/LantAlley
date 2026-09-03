# First-Run Experience: the Entrance and the Inn's First Session

Date: 2026-09-03
Status: Design, not yet implemented

## Goal

Make a new learner's first fifteen minutes earn their attention. The teaching in the Inn is already good; what is missing is a reason to want it, a stated purpose for the whole game, and a reason to come back tomorrow. This design adds those three things and changes nothing about the pedagogy that already works.

## What is already right, and stays

These are load-bearing and must survive the change:

- The three days and their support withdrawal. Day 1 gives romaji, meaning, hints and a new-word card; Day 2 keeps the request in Japanese with tappable glosses; Day 3 is audio-only. `question-renderer.test.mjs` pins the rule that answer content stays Japanese while operating instructions stay English.
- The five mechanics on Day 1. `mechanicNames` is `["arrange", "replace", "warm", "coordinate", "undertake"]` - object arrangement, a swap, a heater, a schedule slider, and a dialogue reply. Day 1 is already varied and needs no interleaving.
- The transitive/intransitive pairing. The task asks 「揃えてください」 and Kon reports 「座布団が同じ色に揃いました」. Distractors are the true intransitive partners.
- Evidence-based mastery. `hasTrainingEvidence` requires every one of the five focus words to have a recorded correct answer, and `isChallengeMastered` additionally requires a full Challenge score.
- The delayed-review schedule, now fed from the story by `scheduleReview`.

## The three problems

**The learner rehearses for a show they have not seen.** The Inn opens with Kon asking for help, then ten questions of preparation. The thing the game is about - a timed shift with guests arriving and twelve question types - begins only after all of it. Nobody wants to rehearse before knowing what the performance is.

**Nothing is at stake until it is too late to matter.** Learn and Practice cannot be failed; a wrong answer retries. The first real tension arrives in the episode, after the learner has already decided whether the game is interesting.

**The game never says what it is for.** The map reads 灯り 0 / 6 from the first moment it is seen. Lighting the alley's six lanterns is the entire arc, and no line of dialogue anywhere mentions it. The Entrance teaches the mechanic and stops.

## Change 1: a cold open before the three days

A guest arrives the moment the learner accepts the job. Kon asks for one real thing, unscaffolded, and the learner almost certainly cannot do it yet.

- The task is the stage's own first encounter, 「二つのマットに、同じ色の座布団を二枚ずつ揃えてください。」, using the room it already has.
- All support is withheld: no new-word card, no romaji, no meaning line, no hint button. This is the one moment in the stage where the learner faces Japanese with nothing.
- It is not scored, not paid, and does not enter the review schedule. It is a demonstration of the gap, not evidence of anything.
- One attempt only. There is no retry and no correct-answer requirement; the scene moves on either way. There is no timer - Learn has never had one, and adding pressure to the unscaffolded moment would make it punishing rather than motivating.

**Day 1 then asks the same task again, deliberately.** The learner fails 揃える with no support, is taught it, and the very first thing they do afterwards is the identical task with the new-word card and hints in place. That repeat is the point: it closes the loop inside two minutes and lets the learner feel the difference the teaching made. It is the strongest argument the game can make for its own method, and it costs no new content.

Kon's response branches on the outcome, because a learner who already knows 揃える must not be told to go and practise it:

- Wrong: 「大丈夫ですよ。お客様は私が。三日ありますから、一緒に覚えていきましょう。」 Kon absorbs the failure and offers the three days as the answer to a problem the learner has just felt.
- Correct: 「よくご存じですね。では、残りの言葉も見ていきましょう。」 The three days are framed as the other four words rather than as remedial work.

After either branch the stage proceeds to Day 1 exactly as it does today.

## Change 2: state the goal at the gate

The Entrance gains one line, placed after the bow succeeds and before the map opens. Kon names the arc:

> 「この路地の灯りは、今は消えています。言葉をひとつずつ覚えるたびに、灯りがひとつずつ戻ります。」

The map's 灯り 0 / 6 then means something the first time it is seen. No new screen, no new asset: one line added to the Entrance's existing completion step.

## Change 3: end the session pointing at tomorrow

The stage currently ends on 「三日目の挑戦を達成しました。」 and stops. With the review schedule now fed from the story, the five words are genuinely due tomorrow, and the closing line should say so:

> 「明日、この五つの言葉をもう一度たしかめましょう。」

This converts a finished stage into a reason to return, and it is honest - the schedule really does hold those five words with a one-day interval.

## What this does not change

- No change to the ten questions, their order, their content, or their mechanics. The cold open borrows the first of them rather than adding an eleventh.
- No change to the day model, the support withdrawal, or the star ratings.
- No change to mastery, unlocking, the economy, or the review intervals.
- No new art. The cold open reuses the Inn lobby and the arrange room; the two new lines are dialogue.

## Structure

The cold open is a distinct step between the intro and Day 1, not a fourth day. It reuses `renderInnInteraction` for the room and needs its own small resolve path so that scoring, payment, review scheduling and retry are all suppressed - reusing `answerStage` would drag all four in.

Suggested shape:

- `N2HomeInnStage.coldOpen` holds the branch replies and names the encounter it borrows, so the strings live with the rest of the stage content rather than in `app.js`.
- `renderColdOpen(loc)` renders the borrowed encounter with support suppressed.
- `resolveColdOpen(correct, loc)` shows the matching Kon reply and calls `startStagePhase(loc, "learn")`.
- The intro's accept button routes to `renderColdOpen` instead of straight to `startStagePhase`.

A learner resuming mid-stage must not see the cold open again. `state.stageProgress.homeInn` already exists and is written on the first answer; the cold open runs only when it is absent, which is the same condition `enterLocation` already uses to choose between `renderStageIntro` and a resumed render.

## Testing

- The cold open renders the first encounter with no new-word card, no romaji, no meaning and no hint button.
- A wrong answer in the cold open pays nothing, records nothing in `reviewProgress`, adds nothing to `masteredByStage`, and still reaches Day 1.
- A correct answer in the cold open takes the other branch and also reaches Day 1, still without scoring.
- Day 1's first question is the same encounter the cold open borrowed, and it arrives with its full support restored.
- Resuming a stage that is already in progress does not replay the cold open.
- The Entrance's completion step contains the lantern line.
- The stage's mastery message names tomorrow's review.
- The existing walkthrough suite still finishes the Inn and reaches Episode 1, with the cold open in the path.

## Risks

**The cold open reads as a trick if it is too long.** It must be one task and one reply, then straight into Day 1. If it grows a second question it becomes an unwinnable quiz.

**A confident learner may resent it.** The correct branch exists for this and must not be an afterthought; it should read as Kon being impressed, not as the game ignoring the result.

**The failure must be absorbed, not scored.** Any star, coin, percentage or red mark attached to the cold open turns a motivating stumble into a punishment on the first screen of the stage.
