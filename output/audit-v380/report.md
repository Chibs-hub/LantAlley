# Lantern Alley v380 audit

Checked on 2026-09-16, branch codex/inn-learning-redesign, commit 33838ec.
[verified: Git pull and local Git status]

9 findings, 0 fixes applied. One release blocker, seven fixes to prioritize, one lower-priority issue.
The pet purchase bug should be fixed before release. This is a review, not a complete accessibility certification.

Scope: opening, character selection, Entrance, Inn training and its four shifts, teaching, answer feedback, home, garden storage, shop, and related learning logic. Missing voices and unfinished locations after the Inn are excluded.

## 1. Purchased pets remain hidden until the final Inn reward

Priority: release-blocker. [verified: app.js:6074 and pet-normal.json]

Normal-mode fixture: buy bird for 1000 from a 1500 wallet. Saved wallet=500, ownedPets contains bird, activePets contains its instance, but renderedPets=0 and manage=0 while catUnlocked=false.

Suggested fix: Render and manage purchased pets from ownership and active instances. Keep the free Inn cat reward separate.

[Source](C:/Users/user/projects/IJLG/app.js:6074) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/pet-normal.json)

## 2. Inn teaching uses the wrong sense for a guest-guiding task

Priority: fix-this-sprint. [verified: n2-home-inn-stage.js:1159 and focused.json]

The first shift asks the learner to guide guests to their room. The target reveal describes annai as 'information'. Only chousei has a contextual sense override; teaching cards and answer reveals otherwise take meanings[0].

Suggested fix: Author context-specific meanings for the Inn vocabulary; use 'guidance / showing someone to a place' for this task. Reuse the same meaning on cards and feedback.

[Source](C:/Users/user/projects/IJLG/n2-home-inn-stage.js:1159) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/focused.json)

## 3. Unaffordable shop items give no visible failure message

Priority: fix-this-sprint. [verified: app.js:7107 and shop-insufficient-funds.png]

With 500 yen, tap the 1000-yen cat. The shop text is identical before and after. homeSay only updates .home-goal, which the shop does not render.

Suggested fix: Provide a persistent shop status region and display the shortage beside the purchase controls.

[Source](C:/Users/user/projects/IJLG/app.js:7107) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/shop-insufficient-funds.png)

## 4. Wrong episode answers stay emphasized while the correct answer fades

Priority: fix-this-sprint. [verified: app.js:3601 and episode-wrong-mobile.png]

After a wrong answer, all episode options receive is-settled; only the selected wrong answer receives is-picked. The correct answer has no marker and is rendered at opacity .55.

Suggested fix: Mark both the selected wrong answer and the correct answer, keep their text readable, and retain the existing explanation.

[Source](C:/Users/user/projects/IJLG/app.js:3601) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/episode-wrong-mobile.png)

## 5. Phone progress labels are too small to read comfortably

Priority: fix-this-sprint. [verified: styles.css:1253 and inn-normal-mobile.png]

At 320px and 390px, computed Inn journey labels are 8px; the status sentence is 9.6px. The five-column strip compresses the text rather than simplifying the display.

Suggested fix: Use a readable current-step label and count on phones; retain the full five-stop display where there is room.

[Source](C:/Users/user/projects/IJLG/styles.css:1253) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/inn-normal-mobile.png)

## 6. Several frequently used controls still have undersized hit areas

Priority: fix-this-sprint. [verified: styles.css:479 and touch.json]

Back-to-map and Hint controls are 32px high. The romaji switch is 34x19px and its pseudo-element enlarges it only to 34x34px. The existing coarse-pointer fixes cover other controls, not these.

Suggested fix: Raise these hit areas to at least 44x44px while keeping the small visual treatment if desired.

[Source](C:/Users/user/projects/IJLG/styles.css:479) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/touch.json)

## 7. Teaching checks reveal answer position through word length

Priority: fix-this-sprint. [verified: app.js:4688 and teach-wrong.png]

The correct index is card.word.length % options.length. With four options, a two-character word always has the third answer, a three-character word the fourth, and a four-character word the first.

Suggested fix: Use a deterministic shuffle based on a stable question seed rather than a directly visible property of the word.

[Source](C:/Users/user/projects/IJLG/app.js:4688) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/teach-wrong.png)

## 8. Shop category changes lose keyboard focus

Priority: fix-this-sprint. [verified: app.js:7183 and focused.json]

Focus the Plants category and activate it with Enter. paintHome replaces the controls and document.activeElement becomes BODY.

Suggested fix: After repainting, restore focus to the selected category; preserve a predictable next Tab position.

[Source](C:/Users/user/projects/IJLG/app.js:7183) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/focused.json)

## 9. The affordability message ignores the pet shelf

Priority: backlog. [verified: app.js:6541 and focused.json]

In a fixture owning the non-pet decor, with 500 yen, the home says everything in the shop is affordable while the unowned cat costs 1000. homeWants enumerates decor, wallpaper and plants, but not pets.

Suggested fix: Include unowned pets and only purchasable stock in the affordability calculation.

[Source](C:/Users/user/projects/IJLG/app.js:6541) | [Evidence](C:/Users/user/projects/IJLG/output/audit-v380/focused.json)

## Teaching and visual improvements

The teach-first sequence already exists: word, reading, meaning, usage pattern, example, immediate meaning check, then work.
[verified: app.js:4548 and the five-card browser walkthrough]

The main clarity opportunity is to explain the example itself. The cards currently provide an English word gloss but no example translation or sentence reading aid. A learner unfamiliar with supporting vocabulary must decode that vocabulary to understand the new word.
[verified: app.js:4580]

Suggested design, not an implemented fix: add a revealable plain-English example explanation and selective reading support. For concrete actions, reuse Inn assets to show a small before-and-after sequence, such as replacing an old towel or warming tea. Keep these on teaching screens; do not reveal scored answers through illustrations. Abstract words benefit more from an explicit situation than a decorative picture. These are design judgments, not measured learning-outcome claims.

## Checked and not flagged

- Sakura is present in storage in both young and mature forms. The first storage card is inside the tray at 320px and 390px. [verified: home-tray-320.png]
- The final sweep rendered all 55 Inn questions at 320px, 390px and 1280px: 165 captures/measurements, zero viewport mismatches, zero page-wide horizontal overflow, and no recorded JavaScript errors. [verified: sweep.json and sweep command output]
- Audio controls already have a 44px coarse-pointer rule. Small desktop measurements were rejected as evidence of a phone defect. [verified: styles.css:3154]
- Correct teaching answers do not inflate delayed-recall credit; same-session repetition is distinguished from delayed recall. [verified: app.js:4605 and review-engine.js:108]
- The pet-selector test failure uses the previous shop location of recruit controls. It is not proof that the current home panel is broken for every learner. [verified: walkthrough.test.mjs:1558 and app.js:6999]

## Verification and limits

The local checkout was fast-forwarded by 26 commits to v380. Production files were not edited after the pull; no commit or push was made. Audit scripts and evidence are under the ignored output/audit-v380 folder.
[verified: git status]

The existing full test suite did not pass. Audio-related failures are excluded from this report as requested. The pet-selector failure was investigated separately. A focused rerun reproduced its obsolete expectation. No passing-suite claim is made.

Screenshots use Chromium/Edge emulation, not a physical phone or Safari. Review mode was used to reach every question, with an all-taught fixture to bypass teaching gates; the review toolbar and fixture progress are not production UI findings. Normal-mode fixtures independently verified the purchase and shop behavior. No exhaustive performance, offline, or screen-reader certification was attempted.

## Skill references used

Mode: UI audit. Files read under C:/Users/user/.agents/skills/ui-design:
SKILL.md; references/feature-playbooks.md; references/ship-readiness.md; references/output-adapters.md;
rules/interaction-target-size.md; rules/layout-long-content-safety.md; rules/focus-broken-focus-trap.md;
rules/focus-not-restored.md; rules/focus-on-dynamic-content.md; rules/mobile-viewport-scaling.md;
rules/mobile-hover-only-affordance.md; rules/interaction-keyboard-operable.md;
rules/interaction-focus-visible.md; rules/type-readable-scale.md; rules/states-no-error-state.md;
rules/states-no-empty-state.md; rules/nav-live-region-feedback.md;
rules/motion-respect-reduced-motion.md; rules/states-layout-shift.md.

No design-guidelines or direction-mode files were used. The UI skill guided the rendered checks and rejection of false positives. App-specific learning and economy findings are identified separately in report.json.
