import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { inflateSync } from "node:zlib";

const stageUrl = new URL("./n2-home-inn-stage.js", import.meta.url);
const html = ["./index.html", "./styles.css", "./app.js"]
  .map((name) => readFileSync(new URL(name, import.meta.url), "utf8"))
  .join(String.fromCharCode(10));

test("Moonview Inn provides five ordered N2 encounters", () => {
  assert.equal(existsSync(stageUrl), true, "N2 home and inn stage data must exist");
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);

  const stage = context.N2HomeInnStage;
  assert.equal(stage.key, "home-inn");
  assert.equal(stage.encounters.length, 5);
  assert.deepEqual(
    Array.from(stage.encounters, (item) => item.focusWord),
    ["揃える", "取り替える", "温める", "調整", "引き受ける"],
  );
  assert.ok(stage.encounters.every((item) => item.level === "N2"));
});

test("Moonview Inn establishes the learner as Kon's helper before the first task", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const intro = context.N2HomeInnStage.intro;

  assert.match(intro.context, /お祭りの間.*私一人では仕事が間に合いません/);
  assert.match(intro.jp, /お祭りの間.*宿の仕事を手伝ってくれませんか/);
  assert.equal(intro.accept, "はい、喜んで手伝います。");
  assert.match(html, /function renderStageIntro\(loc\)/);
  assert.match(html, /renderStageIntro\(loc\)/);
});

test("Moonview Inn uses the same cinematic shell as the Alley Entrance", () => {
  assert.match(html, /screenGame\.classList\.toggle\("inn-stage", loc\.key === "home-inn"\)/);
  assert.match(html, /#screen-game\.inn-stage\{[^}]*background-image:[^}]*--inn-scene-image/);
  assert.match(html, /\.inn-stage \.stage-bar\{[^}]*border:2px solid[^}]*background:rgba/);
  assert.match(html, /\.inn-stage \.learning-context\{[^}]*background:transparent/);
  assert.match(html, /\.inn-stage \.answer-workspace\{[^}]*min-width:0/);
  assert.match(html, /@media\(max-width:760px\)[^{]*\{[\s\S]*?\.inn-stage \.game-layout\{[^}]*grid-template-columns:1fr/);
});

test("Inn questions keep the scene visible behind compact Entrance-style docks", () => {
  assert.match(html, /\.inn-stage \.learning-context\{(?=[^}]*background:transparent)(?=[^}]*border:0)/);
  assert.match(html, /\.inn-stage \.answer-workspace\{(?=[^}]*background:transparent)(?=[^}]*border:0)/);
  assert.match(html, /\.inn-stage \.game-layout\{[^}]*min-height/);
});

test("feedback and the continue button cannot push the page past the viewport", () => {
  // A correct answer used to grow #feedback-row and #next-row inside
  // .answer-workspace with nothing above them capping a maximum height, so
  // the whole page grew to fit and the result landed below the fold.
  //
  // An unconditional fix (max-height always equal to min-height) closed that
  // gap but opened another: a content-heavy room - the arrange task's
  // thirteen objects - was squeezed into the same cramped budget and forced
  // to scroll internally from the very first frame, before any answer. The
  // cap now only applies once #feedback-row actually carries .show, via
  // :has() - a quiet room keeps only .game-layout's ordinary min-height and
  // is free to grow to fit its content, exactly as it could before either
  // fix existed.
  const maxHeightRule = html.match(
    /\.inn-stage \.game-layout:has\(\.answer-workspace #feedback-row\.show\)\{\s*max-height:([^;]+);\s*\}/,
  );
  const minHeight = html.match(/\.inn-stage \.game-layout\{display:grid;min-height:([^;]+);/);
  assert.ok(maxHeightRule, ".game-layout has no feedback-gated max-height rule");
  assert.ok(minHeight, ".game-layout has no min-height to compare against");
  assert.equal(maxHeightRule[1].trim(), minHeight[1].trim(),
    "the feedback-gated max-height must match .game-layout's own min-height, or it is not just re-applying the room's normal size");

  // And that rule must sit inside a width-gated block, not apply everywhere -
  // an unconditional fixed height would break the mobile stacked layout.
  const mediaOpenIndex = html.lastIndexOf("@media(min-width:761px){", maxHeightRule.index);
  const mediaCloseIndex = html.indexOf("\n  }", maxHeightRule.index);
  assert.ok(mediaOpenIndex > -1 && mediaOpenIndex < maxHeightRule.index
    && mediaCloseIndex > maxHeightRule.index,
    "the feedback-gated max-height rule is not gated to wider layouts");

  assert.match(html, /\.inn-stage \.answer-workspace\{display:flex;flex-direction:column/);
  assert.match(html, /\.inn-stage \.answer-workspace \.scene\{flex:1 1 auto;min-height:0;overflow-y:auto\}/);
  assert.match(html, /\.inn-stage \.answer-workspace #feedback-row,\s*\n\s*\.inn-stage \.answer-workspace #next-row\{flex:0 0 auto\}/);
});

test("the Learn word card shows only the target word support", () => {
  assert.match(html, /function innWordCard\(prompt\)/);
  assert.match(html, /LanternCurriculumCatalog\.getItem/);
  assert.doesNotMatch(html, /inn-new-word-reading[^\n]*prompt\.romaji/);
  assert.doesNotMatch(html, /inn-new-word-meaning[^\n]*prompt\.meaning/);
});

test("the 調整 word card uses the Inn's sense, not the catalog's general one", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // The catalog's own first sense is "regulation" - checked directly so this
  // test still means something if the catalog is ever reordered.
  const catalogUrl = new URL("./curriculum-catalog.js", import.meta.url);
  const catalogContext = {};
  vm.createContext(catalogContext);
  vm.runInContext(readFileSync(catalogUrl, "utf8"), catalogContext);
  const catalogItem = catalogContext.LanternCurriculumCatalog.getItem(stage.getTargetId("調整"));
  assert.equal(catalogItem.meanings[0], "regulation",
    "the catalog's general sense changed - the override below may no longer be needed, or may need updating");

  const cardSense = stage.getCardSense("調整");
  assert.ok(cardSense, "調整 has no card-sense override");
  assert.doesNotMatch(cardSense, /regulation/i,
    "the Inn's checkout and arrival-time tasks are about reconciling conditions, not regulation");

  // Every other focus word falls through to the catalog's own sense.
  for (const word of ["揃える", "取り替える", "温める", "引き受ける"]) {
    assert.equal(stage.getCardSense(word), null, `${word} should not need an override`);
  }
});

test("episode openings form one aligned bottom dock instead of floating boxes", () => {
  assert.match(html, /\.inn-stage \.game-layout:has\(\.episode-open\)/);
  assert.match(html, /\.inn-stage \.answer-workspace:has\(\.episode-open\)/);
  assert.match(html, /\.inn-stage \.episode-open-card\{[^}]*background:rgba/);
});

test("Moonview Inn mixes visible, object, and social actions", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const types = context.N2HomeInnStage.encounters.map((item) => item.actionType);
  assert.ok(types.includes("visible movement"));
  assert.ok(types.includes("object interaction"));
  assert.ok(types.includes("social dialogue"));
});

test("bulb installation drives a non-blocking dim-to-warm room effect", () => {
  assert.match(html, /MoonviewInnInteractions\.getRoomLightState\(innInteractionState, interaction\.target\)/);
  assert.match(html, /room-light-" \+ roomLightState/);
  assert.match(html, /\.room-light-dim::before\{[^}]*opacity:/);
  assert.match(html, /\.room-light-bright::after\{[^}]*animation:room-light-warm/);
  assert.match(html, /\.inn-room-viewport::before,\.inn-room-viewport::after\{[^}]*pointer-events:none/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)[^{]*\{[\s\S]*?\.room-light-bright::after\{animation:none/);
});

test("encounter lookup clamps to the available stage", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  assert.equal(stage.getEncounter(-1).focusWord, "揃える");
  assert.equal(stage.getEncounter(99).focusWord, "引き受ける");
});

test("the open-world map loads Moonview Inn and advances its encounters", () => {
  assert.match(html, /<script src="n2-home-inn-stage\.js(\?v=\d+)?"><\/script>/);
  assert.match(html, /locations\.push\(N2HomeInnStage\)/);
  assert.match(html, /state\.encounterIndex/);
  assert.match(html, /continueStageEncounter/);
  // The counter is Japanese chrome now; what this pins is that both spans
  // are still there for the progress numbers to be written into.
  assert.ok(html.includes('問題 <span id="encounter-progress">1</span> / <span id="encounter-total">5</span>'));
});

test("Moonview Inn has evidence-based practice and challenge phases", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  assert.equal(stage.practice.length, 3);
  assert.equal(stage.challenge.length, 2);

  const learned = new Set(stage.encounters.map((item) => item.focusWord));
  for (const word of stage.encounters.map((item) => item.focusWord)) {
    assert.equal(learned.has(word), true, `${word} has a Learn interaction`);
  }
  assert.equal(new Set(stage.practice.map((item) => item.focusWord)).size, 3);
  assert.equal(new Set(stage.challenge.map((item) => item.focusWord)).size, 2);
  assert.ok(stage.challenge.every((item) => item.romaji === "" && item.hint === ""));
  assert.equal(
    stage.challenge.every((item) => !stage.practice.some((practice) => practice.jp === item.jp)),
    true,
    "challenge situations must be new rather than repeated practice requests",
  );
});

test("practice never repeats a Learn request", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const learnRequests = new Set(stage.encounters.map((item) => item.jp));

  assert.equal(stage.practice.length, 3);
  assert.equal(stage.practice.every((item) => !learnRequests.has(item.jp)), true);
  assert.equal(new Set(stage.practice.map((item) => item.jp)).size, 3);
});

test("stage UI separates phase status from the story title and offers a Learn restart", () => {
  assert.match(html, /id="stage-phase-badge"/);
  assert.match(html, /id="btn-restart-learn"/);
  assert.match(html, /restartStageLearning/);
  assert.match(html, /\$\("stage-phase-row"\)\.style\.display = loc\.encounters \? "flex" : "none"/);
});

test("challenge mastery requires two audio answers and evidence for all five taught words", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const allWords = stage.encounters.map((item) => item.focusWord);
  assert.equal(stage.isChallengeMastered(2, allWords), true);
  assert.equal(stage.isChallengeMastered(1, allWords), false);
  assert.equal(stage.isChallengeMastered(2, allWords.slice(0, 4)), false);
});

test("focused review completes after only the missed verbs are recalled", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const missed = [stage.challenge[0], stage.challenge[1]];

  assert.equal(stage.isFocusedReviewComplete(missed, [missed[0].focusWord]), false);
  assert.equal(stage.isFocusedReviewComplete(missed, missed.map((item) => item.focusWord)), true);
});

test("the game exposes learn, practice, challenge, and focused retry flow", () => {
  assert.match(html, /stagePhase:"learn"/);
  assert.match(html, /advanceStagePhase/);
  assert.match(html, /challengeMisses/);
  assert.match(html, /間違えた言葉を復習する/);
  assert.doesNotMatch(html, /state\.stagePhase === "challenge" \? "音声を聞いて、正しい行動を選んでください。" : prompt\.narration/);
  assert.match(html, /getStorySetup\(prompt, state\.resumedStageEntry, state\.resumedAfterDecline\)/);
});

test("practice shows the complete Japanese request while challenge stays audio-only", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const practiceItem = stage.practice[0];
  const practiceText = stage.getWrittenPrompt(practiceItem, "practice");
  assert.equal(practiceText, practiceItem.jp);
  assert.doesNotMatch(practiceText, /＿＿/);
  // Day 2 is a cloze, so the request must NOT contain the verb any more. What
  // it must still contain is the appliance, since that is the detail the
  // learner has to hear rather than guess.
  const warmPractice = stage.getWrittenPrompt(stage.practice.find((item) => item.focusWord === "温める"), "practice");
  assert.doesNotMatch(warmPractice, /温めて/);
  assert.match(warmPractice, /電子レンジ|コンロ/);
  assert.equal(stage.getWrittenPrompt(stage.challenge[0], "challenge"), "音声を聞いてください。")
});

test("Kon explains the story reason before every Learn and Practice request", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  for (const item of [...stage.encounters, ...stage.practice]) {
    assert.match(item.narration, /^コン：「/, item.variant);
    assert.match(item.narration, /。」$/, item.variant);
  }
});

test("Kon gives Japanese story context in every phase and a Japanese return recap", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  for (const item of [...stage.encounters, ...stage.practice, ...stage.challenge]) {
    assert.match(item.narration, /^コン：「/, item.variant);
    assert.doesNotMatch(item.narration, /\b(Kon|guest|inn|tomorrow|group|breakfast|room)\b/i, item.variant);
  }
  const resumedWarm = stage.practice.find((item) => item.focusWord === "温める");
  assert.match(stage.getStorySetup(resumedWarm, true), /^コン：「お帰りなさい。/);
  assert.match(stage.getStorySetup(resumedWarm, true), /ごはん/);
});

test("practice narration describes evidence without naming the required action", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  for (const item of context.N2HomeInnStage.practice) {
    assert.doesNotMatch(item.narration, /arrange|replace|warm|coordinate|take responsibility|put matching|must be replaced/i, item.variant);
  }
});

test("only correct answers schedule automatic advancement", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  assert.equal(stage.getAutoAdvanceDelay(true), 2600);
  assert.equal(stage.getAutoAdvanceDelay(false), null);
});

test("Kon gives a contextual Japanese response after every stage answer", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const allItems = [...stage.encounters, ...stage.practice, ...stage.challenge];

  for (const item of allItems) {
    assert.match(stage.getKonResponse(item, true), /[ぁ-んァ-ヶ一-龠]/, `${item.variant} success`);
    assert.match(stage.getKonResponse(item, false), /[ぁ-んァ-ヶ一-龠]/, `${item.variant} retry`);
  }

  const expectedPracticeResults = [
    /向き/, /ごはん/, /朝食/,
  ];
  stage.practice.forEach((item, index) => {
    assert.match(stage.getKonResponse(item, true), expectedPracticeResults[index], item.variant);
  });
});

test("the stage renderer speaks Kon's answer response before advancing", () => {
  assert.match(html, /function showKonStageResponse/);
  assert.match(html, /stage\.getKonResponse\(prompt, isCorrect, selectedKey\)/);
  assert.match(html, /speak\(response, isCorrect \? "correct" : "wrong"\)/);
});

test("non-dialogue harder items have exactly one explained N2 near-miss", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  // 代わる was the near miss while the swap taught 代える. The swap now teaches
  // 取り替える, so the mistake worth drilling is 代える itself: the learner who
  // reaches for the person-substitution verb to swap an object.
  // Day 2 states its options in the form its blank requires, so the same near
  // miss appears as 揃う on Day 3 and 揃って on Day 2.
  const verifiedNearMisses = [
    "揃う", "揃って", "代える", "代えて", "温まる", "温まって", "調節する", "調節して",
  ];

  for (const item of [...stage.practice, ...stage.challenge].filter((entry) => entry.mechanic !== "undertake")) {
    const nearMisses = item.options.filter((option) => option.nearMiss);
    assert.equal(nearMisses.length, 1, `${item.focusWord} needs one near-miss`);
    assert.ok(verifiedNearMisses.includes(nearMisses[0].label));
    assert.ok(nearMisses[0].explanation.length >= 20);
  }
});

test("dialogue replies are neutral, plausible, and do not reveal acceptance", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // Day 2 asks this item as a vocabulary cloze, where 引き止めて is a fair near
  // miss. Only the days that actually make the offer must stay neutral, since
  // marking a reply as a near miss would prejudge a social choice.
  const offerItems = [...stage.encounters, ...stage.challenge].filter((entry) => entry.mechanic === "undertake");
  for (const item of offerItems) {
    assert.equal(item.options.some((option) => option.nearMiss), false, item.variant);
    assert.deepEqual(
      Array.from(item.interaction.replies, (reply) => reply.label),
      ["はい、引き受けます。", "すみません、引き受けられません。"],
    );
    assert.equal(item.interaction.replies.every((reply) => !reply.icon), true);
  }

  assert.doesNotMatch(html, /reply\.key === "accept" \? "" : " danger"/);
});

test("Kon makes one three-day agreement before Day 1", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const duty = stage.encounters.at(-1);

  // The invitation must stay open-ended. Each episode is its own three-day
  // arc, so promising exactly 三日間 would be false from Episode 2 onward.
  assert.doesNotMatch(stage.intro.jp, /三日間/);
  assert.match(stage.intro.jp, /お祭りの間.*手伝って/);
  assert.match(stage.intro.accept, /手伝います/);
  assert.doesNotMatch(duty.jp, /明日/);
  assert.match(duty.jp, /夕食の配膳を引き受けて/);
  assert.equal(duty.completionNextLabel, "二日目へ");
});

test("declining a duty ends the stage and is welcomed back, not marked wrong", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const offer = stage.encounters.find((item) => item.focusWord === "引き受ける");

  // Refusing a favour is a legitimate, correctly-understood Japanese reply.
  // Scoring it wrong taught that 引き受けられません is a comprehension error.
  assert.ok(offer.declineReply, "declining needs its own reply");
  assert.ok(offer.returnReply, "returning needs a welcome");
  assert.match(html, /function declineStageWork/);
  assert.match(html, /state\.stageDeclined = true/);
  assert.match(html, /declined:state\.stageDeclined/);

  // Returning replaces the ordinary resume greeting with the welcome back.
  const back = stage.getStorySetup(offer, false, true);
  assert.ok(back.startsWith(offer.returnReply), "return must lead with the welcome");
  assert.ok(back.includes(offer.narration));
  const ordinary = stage.getStorySetup(offer, false, false);
  assert.equal(ordinary, offer.narration);
});

test("each phase announces its story day and difficulty", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  assert.deepEqual(JSON.parse(JSON.stringify(stage.getDayMeta("learn"))), {
    day: 1, label: "一日目", mode: "基礎", difficulty: "やさしい", stars: "★☆☆",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(stage.getDayMeta("practice"))), {
    day: 2, label: "二日目", mode: "実践", difficulty: "ふつう", stars: "★★☆",
  });
  assert.deepEqual(JSON.parse(JSON.stringify(stage.getDayMeta("challenge"))), {
    day: 3, label: "三日目", mode: "挑戦", difficulty: "むずかしい", stars: "★★★",
  });
  assert.equal(stage.getDayMeta("review").day, 3);
  assert.match(html, /loc\.getDayMeta\(state\.stagePhase\)/);
});

test("heating requests use the appliance appropriate for each item", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const heating = [...stage.encounters, ...stage.practice, ...stage.challenge]
    .filter((item) => item.mechanic === "warm");
  const expectedAppliance = { tea: "stove", soup: "stove", rice: "microwave" };

  assert.ok(heating.length > 0);
  for (const item of heating) {
    const room = item.interaction.room;
    const dish = room.dishes.find((entry) => entry.key === item.interaction.target);
    assert.ok(dish, item.variant);
    assert.equal(dish.appliance, expectedAppliance[item.interaction.target], item.variant);
    assert.deepEqual(Array.from(room.heatingAppliances, (entry) => entry.key), ["stove", "microwave"]);
    assert.doesNotMatch(item.interaction.clue, /お茶.*コンロ|スープ.*コンロ|ごはん.*電子レンジ/, item.variant);
  }
});

test("schedule coordination distinguishes chousei from chousetsu", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const item = stage.challenge.find((entry) => entry.focusWord === "調整");
  assert.match(item.jp, /時間|予定/);
  assert.doesNotMatch(item.jp, /温度/);
  const nearMiss = item.options.find((option) => option.nearMiss);
  assert.match(nearMiss.label, /調節/);
});

test("choosing a near-miss returns its specific distinction", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const item = stage.practice[0];
  const nearMiss = item.options.find((option) => option.nearMiss);
  const feedback = stage.getWrongAnswerFeedback(item, nearMiss.key);
  assert.match(feedback, /intransitive/);
  // Names 揃う, the word chosen, and not 揃える, the word wanted: the learner
  // gets another attempt, so the target must stay unspoken.
  assert.match(feedback, /揃う/);
  assert.doesNotMatch(feedback, /揃える/);
});

test("every learning item maps to a direct interaction and phase variant", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const mechanics = ["arrange", "replace", "warm", "coordinate", "undertake"];
  assert.deepEqual(Array.from(stage.encounters, (item) => item.mechanic), mechanics);
  assert.ok(stage.encounters.every((item) => item.variant === "guided"));
  for (const item of stage.practice) {
    assert.ok(mechanics.includes(item.mechanic));
    assert.match(item.variant, /^practice-[ab]$/);
  }
  for (const item of stage.challenge) {
    assert.ok(mechanics.includes(item.mechanic));
    assert.match(item.variant, /^challenge-[ab]$/);
  }
});

test("only the Entrance and Moonview Inn are playable while the map model can show future places", () => {
  for (const removedKey of ["crossroads", "stars", "fruit", "tea", "festival"]) {
    assert.doesNotMatch(html, new RegExp(`key:\"${removedKey}\"`));
  }
  assert.match(html, /key:"entrance"/);
  assert.match(html, /locations\.push\(N2HomeInnStage\)/);
  assert.match(html, /<script src="lantern-map\.js(\?v=\d+)?"><\/script>/);
});

test("the page loads the interaction engine and persists stage progress", () => {
  assert.match(html, /<script src="moonview-inn-interactions\.js(\?v=\d+)?"><\/script>/);
  assert.match(html, /stageProgress/);
  assert.match(html, /homeInn/);
  assert.match(html, /saveStageProgress/);
});

test("Moonview Inn renders five direct room interactions instead of answer cards", () => {
  assert.match(html, /function renderInnInteraction/);
  assert.match(html, /function performInnAction/);
  assert.match(html, /inn-drop-zone/);
  assert.match(html, /laundry-basket/);
  assert.match(html, /tea-visual/);
  assert.match(html, /schedule-timeline/);
  assert.match(html, /reply-option/);
  assert.match(html, /mat-zone/);
  assert.match(html, /pointerdown/);
});

test("room controls explain operation without exposing the answer", () => {
  assert.doesNotMatch(html, /release in gold/i);
  assert.doesNotMatch(html, /temperature-meter/);
  assert.doesNotMatch(html, /Place .*Futon/);
  assert.match(html, /How to interact/);
  assert.match(html, /updateTeaVisual/);
});

test("every question provides matching scene context and non-answer control help", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  for (const item of [...stage.encounters, ...stage.practice, ...stage.challenge]) {
    assert.ok(item.interaction, `${item.focusWord} is missing scene data`);
    // control help explains operation only; it may be very short when the
    // operation is simply "choose your reply"
    assert.ok(item.interaction.controlHelp.length > 5, item.focusWord);
    assert.ok(item.interaction.clue.length > 20, item.focusWord);
    assert.ok(item.interaction.scene);
  }
  const cleaning = stage.encounters.find((item) => item.focusWord === "調整");
  assert.match(cleaning.jp, /12時/);
  assert.match(cleaning.jp, /2時間/);
  assert.equal(cleaning.interaction.targetA, 13);
  const arrivals = stage.challenge.find((item) => item.focusWord === "調整" && item.variant === "challenge-b");
  assert.match(arrivals.jp, /15時/);
  assert.match(arrivals.jp, /17時/);
  assert.equal(arrivals.interaction.targetB, 17);
});

test("the arrange scene never states its own grouping rule", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  for (const item of stage.getPhaseItems("learn").concat(stage.practice, stage.challenge)) {
    if (item.mechanic !== "arrange") continue;
    const text = item.interaction.clue + " " + item.interaction.controlHelp;
    // the scene may describe what varies, but must not say which attribute to group by
    assert.doesNotMatch(text, /group (them )?by|same tag|pairs with|matching (tag|size|colour|color)/i, item.variant);
    // the mats carry no answer label
    assert.ok(item.interaction.room.groups.every((g) => !/colour|color|size|large|small|red|blue/i.test(g[1])), item.variant);
  }
  assert.match(html, /timeline\.style\.gridTemplateColumns/);
});

test("the request names the appliance it requires", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // The engine rejects the wrong appliance, so making the learner guess which
  // one tests kitchen sense rather than Japanese. If it is required, say it.
  const applianceWord = { stove: "コンロ", microwave: "電子レンジ" };

  for (const item of [...stage.encounters, ...stage.practice, ...stage.challenge]) {
    if (item.mechanic !== "warm") continue;
    const dish = item.interaction.room.dishes.find((d) => d.key === item.interaction.target);
    assert.ok(dish, `no dish for target ${item.interaction.target}`);
    assert.match(
      item.jp,
      new RegExp(applianceWord[dish.appliance]),
      `${item.jp} requires the ${dish.appliance} but never names it`,
    );
  }
});

test("warming food and drink uses 温める, never 暖める", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // 暖める is for air, rooms and bodies; food and drink take 温める.
  // Getting this wrong teaches a collocation error, so guard the whole file.
  assert.doesNotMatch(readFileSync(stageUrl, "utf8"), /暖/, "暖 must not appear anywhere in the stage data");

  const warm = stage.encounters.find((item) => item.mechanic === "warm");
  assert.equal(warm.focusWord, "温める");
  assert.match(warm.jp, /温めて/);
});

test("each near-miss is the true intransitive partner of its target", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // 揃える pairs with 揃う, not 整う (which pairs with 整える). Presenting the
  // wrong partner teaches a false relationship in the exact spot meant to
  // drill that distinction.
  //
  // 取り替える is the exception: its near miss is a sense confusion rather than
  // a transitivity pair. 代える means substituting a person or role, so it is
  // the mistake a learner actually makes when swapping an object.
  const pairs = { "揃える": "揃う", "取り替える": "代える", "温める": "温まる" };

  for (const item of [...stage.practice, ...stage.challenge]) {
    const partner = pairs[item.focusWord];
    if (!partner) continue;
    const nearMiss = item.options.find((option) => option.nearMiss);
    // Accept the te-form Day 2 needs: 揃う appears as 揃って inside a blank.
    assert.ok(
      nearMiss.label === partner || nearMiss.label.startsWith(partner.slice(0, -1)),
      `${item.focusWord} should pair with ${partner}, got ${nearMiss.label}`,
    );
    // The explanation names the word the learner chose, never the target: a
    // wrong answer can be retried, so revealing it would end the question.
    assert.match(nearMiss.explanation, new RegExp(partner.replace(/[うるく]$/, "")));
    assert.equal(nearMiss.explanation.includes(item.focusWord), false, item.focusWord);
  }
});

test("encounter titles are story beats, not the answer in English", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  // the title shows in the scene header, so it must not give the verb away
  for (const item of stage.encounters) {
    assert.doesNotMatch(
      item.label,
      /arrange|replace|warm|coordinate|accept|undertake/i,
      `title "${item.label}" names the action`,
    );
  }
});

test("the story runs in order across the learn phase", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const learn = context.N2HomeInnStage.getPhaseItems("learn");
  const story = learn.map((item) => item.narration).join(" ");
  // Day 1 must stay inside day 1: arrival preparation -> arrival -> planning
  // tomorrow -> dinner service. It previously announced 朝になりました before
  // returning to the evening of the same day, so the day ran backwards.
  const beats = ["もうすぐ", "到着しました", "明日の予定", "夕食を配る人"];
  let cursor = -1;
  for (const beat of beats) {
    const at = story.indexOf(beat, cursor + 1);
    assert.ok(at > cursor, `story beat "${beat}" is out of order`);
    cursor = at;
  }
});

test("the object-moving scenes are identical, so only the verb selects the action", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  const moving = stage.getPhaseItems("learn").concat(stage.practice, stage.challenge)
    .filter((item) => ["arrange", "replace", "warm"].includes(item.mechanic));
  assert.ok(moving.length >= 6);

  // every one of them shows the same room: same props, same clue, same help text
  const first = moving[0].interaction;
  for (const item of moving) {
    assert.equal(item.interaction.clue, first.clue, item.variant);
    assert.equal(item.interaction.controlHelp, first.controlHelp, item.variant);
    assert.deepEqual(item.interaction.room, first.room, item.variant);
  }

  // all three verbs really do occur over that one shared room
  assert.deepEqual(
    [...new Set(moving.map((item) => item.interaction.verb))].sort(),
    ["arrange", "replace", "warm"],
  );
});

test("the arrange attribute is carried only by the Japanese sentence", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const byColour = stage.encounters.find((item) => item.focusWord === "揃える");
  const bySize = stage.challenge.find((item) => item.focusWord === "揃える" && item.variant === "challenge-b");

  assert.equal(byColour.interaction.attribute, "color");
  assert.match(byColour.jp, /色/);
  assert.equal(bySize.interaction.attribute, "size");
  assert.match(bySize.jp, /大きさ/);

  // identical objects in both, so only the sentence can disambiguate
  assert.deepEqual(byColour.interaction.room.cushions, bySize.interaction.room.cushions);

  // every cushion differs from every other on more than one axis
  const items = byColour.interaction.room.cushions;
  const axes = ["color", "size", "dir"];
  for (const axis of axes) {
    const values = new Set(items.map(([, attrs]) => attrs[axis]));
    assert.equal(values.size, 2, `${axis} must vary so it cannot be ignored`);
  }
});

test("arrange requests describe making two matching pairs on the mats", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  // Day 2 asks the same situation as a cloze, so only the acting days carry the
  // full imperative.
  const arrangeItems = [...stage.encounters, ...stage.challenge].filter((item) => item.focusWord === "揃える");

  for (const item of arrangeItems) {
    assert.match(item.jp, /二つのマットに、同じ.+の座布団を二枚ずつ揃えてください。/, item.variant);
  }
});

test("photographic zabuton sprites visibly distinguish size and direction", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const sprites = context.N2HomeInnStage.encounters[0].interaction.room.visual.sprites;

  assert.deepEqual(
    [sprites.c1.rotate, sprites.c2.rotate, sprites.c3.rotate, sprites.c4.rotate],
    [90, 90, 0, 0],
  );
  assert.deepEqual(
    [sprites.c1.zoom, sprites.c2.zoom, sprites.c3.zoom, sprites.c4.zoom],
    [1.08, 0.82, 0.82, 1.08],
  );
  assert.match(html, /--sprite-rotate:[^;]+;--sprite-zoom:/);
});

test("replacement objects start in a real location and use the correct removal destination", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const room = context.N2HomeInnStage.encounters[1].interaction.room;
  const byKey = Object.fromEntries(Array.from(room.swaps, (swap) => [swap.key, swap]));

  assert.deepEqual(
    [byKey.towel.sourceLabel, byKey.towel.removalLabel, byKey.towel.installLabel],
    ["タオル掛け", "洗濯かご", "タオル掛け"],
  );
  assert.deepEqual(
    [byKey.sheet.sourceLabel, byKey.sheet.removalLabel, byKey.sheet.installLabel],
    ["ベッド", "洗濯かご", "ベッド"],
  );
  assert.deepEqual(
    [byKey.bulb.sourceLabel, byKey.bulb.removalLabel, byKey.bulb.installLabel],
    ["照明", "回収箱", "照明"],
  );
});

test("the illustrated room maps every movable object and destination exactly once", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const room = context.N2HomeInnStage.encounters[0].interaction.room;
  const visual = room.visual;

  assert.ok(visual, "the shared room needs illustrated visual metadata");
  assert.equal(visual.background, "assets/inn/room-empty-v4.webp");
  assert.equal(existsSync(new URL("./" + visual.background, import.meta.url)), true);
  assert.equal(existsSync(new URL("./" + visual.spriteSheet, import.meta.url)), true);

  const movable = [
    ...room.cushions.map(([key]) => key),
    ...room.swaps.flatMap((swap) => [swap.oldIcon, swap.newIcon]),
    ...room.dishes.map((dish) => dish.icon),
  ];
  assert.equal(new Set(movable).size, movable.length, "movable visual keys must be unique");
  assert.deepEqual(
    [...Object.keys(visual.sprites), ...Object.keys(visual.assets || {})].sort(),
    movable.sort(),
  );

  const destinations = [
    ...room.groups.map(([key]) => key),
    ...new Set(room.swaps.map((swap) => "remove-" + swap.removalKey)),
    ...room.swaps.map((swap) => "install-" + swap.key),
    ...room.heatingAppliances.map((appliance) => appliance.key),
  ];
  assert.equal(new Set(destinations).size, destinations.length, "destination keys must be unique");
  assert.deepEqual(Object.keys(visual.hotspots).sort(), destinations.sort());

  for (const [key, cell] of Object.entries(visual.sprites)) {
    assert.ok(Number.isInteger(cell.col) && cell.col >= 0 && cell.col < 4, `${key} has an invalid sprite column`);
    assert.ok(Number.isInteger(cell.row) && cell.row >= 0 && cell.row < 4, `${key} has an invalid sprite row`);
  }
  for (const [key, spot] of Object.entries(visual.hotspots)) {
    for (const edge of ["x", "y", "w", "h"]) {
      assert.ok(spot[edge] >= 0 && spot[edge] <= 100, `${key}.${edge} must be a percentage`);
    }
    assert.ok(spot.x + spot.w <= 100 && spot.y + spot.h <= 100, `${key} exceeds the room bounds`);
  }

  assert.ok(
    visual.hotspots["install-bulb"].y >= 9,
    "the bulb target must sit below the clipped top edge",
  );
});

test("the used sheet sits loose and crooked over the futon", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const visual = context.N2HomeInnStage.encounters[0].interaction.room.visual;

  assert.equal(visual.assets.sheetStained, "assets/inn/sheet-stained-messy-v1.webp");
  assert.equal(existsSync(new URL("./" + visual.assets.sheetStained, import.meta.url)), true);
  assert.match(html, /<img class="inn-photo-sprite inn-photo-sprite-/);
  assert.match(html, /--object-image:url/);
  assert.match(
    html,
    /\.inn-room-illustrated \.inn-photo-sprite-sheetStained\{[^}]*transform:translate\(-12%,2%\) rotate\(-14deg\) scale\(1\.18\)/,
  );
  assert.match(
    html,
    /\.inn-room-illustrated \[data-key="install-sheet"\] \.inn-placed-object\{[^}]*width:100%[^}]*max-width:145px[^}]*overflow:visible[^}]*background:transparent/,
  );
  assert.match(html, /\.inn-room-illustrated \.inn-photo-sprite-sheetStained\{[^}]*mask-image:var\(--object-image\)[^}]*mask-mode:luminance/);
});

test("the illustrated room keeps appliance targets safely away from mats and the futon", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const hotspots = context.N2HomeInnStage.encounters[0].interaction.room.visual.hotspots;
  const protectedTargets = [hotspots.g1, hotspots.g2, hotspots["install-sheet"]];
  const gap = 3;

  function overlapsWithGap(a, b) {
    return !(
      a.x + a.w + gap <= b.x ||
      b.x + b.w + gap <= a.x ||
      a.y + a.h + gap <= b.y ||
      b.y + b.h + gap <= a.y
    );
  }

  for (const appliance of [hotspots.stove, hotspots.microwave]) {
    for (const target of protectedTargets) {
      assert.equal(overlapsWithGap(appliance, target), false, "appliance drop targets need a visible safety gap");
    }
  }
  assert.equal(overlapsWithGap(hotspots.stove, hotspots.microwave), false, "stove and microwave targets must not overlap");
});

// Reads the PNG master rather than the WebP the app loads: this test decodes
// pixels by hand and the WebP is generated from this exact file.
test("every occupied sprite cell has a transparent gutter", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const visual = context.N2HomeInnStage.encounters[0].interaction.room.visual;
  // The app loads the WebP; this test decodes PNG by hand, so read the master
  // the WebP is generated from.
  const png = readFileSync(new URL("./" + visual.spriteSheet.replace(/\.webp$/, ".png"), import.meta.url));
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const bitDepth = png[24];
  const colorType = png[25];

  assert.equal(bitDepth, 8, "sprite sheet must use 8-bit channels");
  assert.equal(colorType, 6, "sprite sheet must be RGBA");
  assert.equal(width % 4, 0, "sprite columns must be exact pixel cells");
  assert.equal(height % 4, 0, "sprite rows must be exact pixel cells");

  const idat = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") idat.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const filtered = inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  }
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (stride + 1)];
    for (let x = 0; x < stride; x += 1) {
      const source = filtered[y * (stride + 1) + 1 + x];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const value = filter === 0 ? source
        : filter === 1 ? source + left
        : filter === 2 ? source + above
        : filter === 3 ? source + Math.floor((left + above) / 2)
        : source + paeth(left, above, upperLeft);
      pixels[y * stride + x] = value & 255;
    }
  }

  const cellWidth = width / 4;
  const cellHeight = height / 4;
  const gutter = 6;
  for (const [key, cell] of Object.entries(visual.sprites)) {
    for (let y = cell.row * cellHeight; y < (cell.row + 1) * cellHeight; y += 1) {
      for (let x = cell.col * cellWidth; x < (cell.col + 1) * cellWidth; x += 1) {
        const edge = x < cell.col * cellWidth + gutter || x >= (cell.col + 1) * cellWidth - gutter
          || y < cell.row * cellHeight + gutter || y >= (cell.row + 1) * cellHeight - gutter;
        if (edge) assert.equal(pixels[y * stride + x * 4 + 3], 0, `${key} bleeds into a neighboring sprite cell`);
      }
    }
  }
});

test("Moonview Inn displays medals and saves after stage movement", () => {
  assert.match(html, /bronze:"🥉",silver:"🥈",gold:"🥇"/);
  assert.match(html, /function saveStageProgress/);
  assert.match(html, /saveStageProgress\(\);/);
});

test("no learn-phase beat jumps to the next morning", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const learn = context.N2HomeInnStage.getPhaseItems("learn");
  for (const item of learn) {
    assert.doesNotMatch(
      item.narration,
      /朝になりました|次の朝/,
      `day 1 beat announces a new morning: ${item.focusWord}`,
    );
  }
});

test("the challenge day runs in story order", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  // Each narration is tied to its own task, so the question order cannot be
  // shuffled independently of the story. A previous order of 2, 0, 4, 1, 3 made
  // day 3 jump from after dark, to the next morning, to before closing.
  const order = Array.from(stage.getPhaseItems("challenge"), (item) => item.focusWord);
  assert.deepEqual(order, ["揃える", "調整"]);

  const story = stage.getPhaseItems("challenge").map((item) => item.narration).join(" ");
  const beats = ["次の朝です", "帳場を閉める前"];
  let cursor = -1;
  for (const beat of beats) {
    const at = story.indexOf(beat, cursor + 1);
    assert.ok(at > cursor, `challenge beat "${beat}" is out of order`);
    cursor = at;
  }
});

test("each day withdraws one layer of support", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // The three days must differ in difficulty, not only in situation. Day 1 and
  // Day 2 previously showed the same romaji, English meaning and hint, so the
  // only change was which cushion attribute was named.
  const layer = (phase) => {
    const item = stage.getPhaseItems(phase)[0];
    return { romaji: !!item.romaji, meaning: !!item.meaning, hint: !!item.hint };
  };

  assert.equal(JSON.stringify(layer("learn")), JSON.stringify({ romaji: true, meaning: true, hint: true }));
  // Day 2 keeps the request in Japanese. Support words are tappable in the
  // renderer; a full English sentence would solve the cloze without reading.
  assert.equal(JSON.stringify(layer("practice")), JSON.stringify({ romaji: false, meaning: false, hint: false }));
  assert.equal(JSON.stringify(layer("challenge")), JSON.stringify({ romaji: false, meaning: false, hint: false }));

  // Challenge is audio-first: the written prompt must not give the sentence away.
  assert.equal(stage.getWrittenPrompt(stage.getPhaseItems("challenge")[0], "challenge"), "音声を聞いてください。");
});

test("day 2 asks the words a different way, not the same drag again", () => {
  // Repeating Day 1's object drag with one attribute changed tested the same
  // skill twice. Practice now names the action in Japanese instead.
  assert.match(html, /function isWordChoiceDay/);
  assert.match(html, /function renderWordChoice/);
  assert.match(html, /state\.stagePhase === "practice"/);
  // Every Day 2 item is a cloze, including the dialogue one. Excluding it left
  // a cloze prompt sitting above yes/no replies.
  assert.doesNotMatch(html, /prompt\.mechanic !== "undertake"/);
  // The choices must be Japanese, or the answer is readable without the language.
  assert.match(html, /!\/\[A-Za-z\]\{2,\}\/\.test\(option\.label\)/);
  assert.match(html, /Choose the word that matches the request\./);
});

test("the overlapping shoji decoration is gone from every scene", () => {
  // It was absolutely positioned and covered the schedule board's cards and
  // then the dialogue scene's reply buttons.
  assert.doesNotMatch(html, /<div class="shoji"/);
});

test("resuming a stage shows the day you are actually on", () => {
  // renderStagePrompt runs only on advance and on phase start, so entering a
  // saved stage left the badge at its markup default of "Learn" and the
  // counter at 1 of 5. Day 2 then looked exactly like Day 1.
  assert.match(html, /var resumedMeta = loc\.getDayMeta/);
  assert.match(html, /stage-phase-badge"\)\.textContent = resumedMeta\.label/);
  assert.match(html, /encounter-progress"\)\.textContent = resumedItems \? String\(state\.encounterIndex \+ 1\)/);
});

test("day 2 questions never contain their own answer", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // Day 2 reused the Day 1 request, which commanded an action and then asked
  // for a word - and 「揃えてください」 already showed the answer. A cloze
  // sentence keeps the Japanese as the only instruction without giving it away.
  for (const item of stage.getPhaseItems("practice")) {
    assert.match(item.jp, /（　　）/, `${item.focusWord} day 2 prompt is not a cloze`);
    const answer = item.options.find((option) => option.key === item.correct).label;
    const stem = answer.replace(/[てで]$/, "");
    assert.equal(
      item.jp.includes(stem),
      false,
      `${item.focusWord} day 2 prompt contains its own answer: ${stem}`,
    );
    assert.ok(item.options.length >= 2);
  }
});

test("the Inn request is not squeezed into a stub column", () => {
  // Kon-led stages share .entrance-dialogue for the transparent fox, so a
  // selector excluding that class also excluded the Inn. Side by side in the
  // narrow context column the fox took ~38% and left the sentence 200px, which
  // wrapped a normal N2 request to about four characters per line.
  // The shell computes as grid, so flex-direction did nothing; it has to be
  // collapsed to a single column instead.
  assert.match(html, /#screen-game:not\(\.entrance-stage\) \.dialogue\{display:block/);
  assert.match(html, /#screen-game:not\(\.entrance-stage\) \.dialogue \.speech\{width:100%/);
});

test("every day 2 item answers its own question", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // The dialogue item showed a cloze prompt above yes/no replies, so the
  // question and the answers were about different things. A cloze must be
  // answered by something that fits the blank.
  for (const item of stage.getPhaseItems("practice")) {
    assert.match(item.jp, /（　　）/, item.focusWord);
    for (const option of item.options) {
      assert.doesNotMatch(
        option.label,
        /^はい、|^すみません、|。$/,
        `${item.focusWord} day 2 offers a sentence reply to a cloze: ${option.label}`,
      );
    }
  }
});

test("entering Challenge does not reveal the request in writing", () => {
  // Two paths set the prompt: advancing uses getWrittenPrompt, but entering a
  // stage printed prompt.jp directly, so arriving at day 3 showed the sentence
  // the learner is supposed to hear.
  const writes = [...html.matchAll(/\$\("jp-line"\)\.textContent = ([^;]+);/g)].map((m) => m[1].trim());
  const bare = writes.filter((expr) => expr === "prompt.jp");
  assert.equal(bare.length, 0, `a render path prints the request directly: ${bare.join(", ")}`);
});

test("challenge speaks the request but never types it out", () => {
  // speak() drives both the clip and the on-screen reveal, so the reveal was
  // printing the very sentence day 3 asks the learner to listen for, undoing
  // getWrittenPrompt a few milliseconds after it ran.
  assert.match(html, /function speak\(text, mode, isReplay, displayText\)/);
  assert.match(html, /dialogueFlow\.start\(displayText === undefined \? text : displayText/);
  assert.match(html, /var writtenPrompt = writeStagePrompt\(loc, prompt\);/);
  assert.match(html, /speak\(prompt\.jp, undefined, false, writtenPrompt\)/);
  assert.match(html, /function writeStagePrompt[\s\S]*?stage\.getWrittenPrompt/);
});

test("the Inn frames match the Entrance rather than a second wood", () => {
  assert.match(html, /--wood-edge:#8c562d;/);
  assert.match(html, /--wood-shadow:rgba\(55,30,18,\.76\);/);
  assert.match(html, /--wood-radius:12px;/);
  // The room must remain visible through its own drop zones.
  assert.match(html, /\.inn-room-viewport \.inn-drop-zone\{[\s\S]*?background:rgba\(255,250,240,\.2\)/);
});

test("day 2 offers four Japanese choices without translating the whole request", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  for (const item of stage.getPhaseItems("practice")) {
    assert.equal(item.options.length, 4, `${item.focusWord} needs four choices`);
    assert.equal(new Set(item.options.map((o) => o.key)).size, 4, `${item.focusWord} has duplicate keys`);
    assert.equal(item.options.filter((o) => o.key === item.correct).length, 1);
    assert.equal(item.options.filter((o) => o.nearMiss).length, 1);
    // The choices and the request stay Japanese.
    for (const option of item.options) {
      assert.doesNotMatch(option.label, /[A-Za-z]/, `${item.focusWord}: ${option.label}`);
    }
    assert.equal(item.meaning, "", `${item.focusWord} must not translate the cloze`);
    assert.equal(item.romaji, "", `${item.focusWord} must not show romaji on day 2`);
  }
});

test("day 2 never restores a full English translation after retry", () => {
  assert.match(html, /function showPracticeTranslation\(visible\)/);
  assert.match(html, /function answerStage\(isCorrect, prompt, selectedKey\)\{\s*showPracticeTranslation\(false\);/);
  assert.doesNotMatch(html, /classList\.toggle\("show", state\.stagePhase === "practice"\)/);
});

test("the Kon name tab does not land on the narration", () => {
  // The tab hangs 29px above the speech card. In the Entrance that space is
  // empty scene; in the Inn the narration sits directly above it.
  assert.match(html, /#screen-game:not\(\.entrance-stage\) \.dialogue\{margin-top:38px;\}/);
});

test("wrong-answer feedback never hands over the target word", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  // It used to say "Compare it with 「取り替える」 and try again", which ends the
  // question instead of teaching it - a wrong answer here can be retried.
  for (const phase of ["learn", "practice", "challenge"]) {
    for (const item of stage.getPhaseItems(phase)) {
      for (const option of item.options) {
        if (option.key === item.correct) continue;
        const feedback = stage.getWrongAnswerFeedback(item, option.key);
        assert.equal(
          feedback.includes(item.focusWord),
          false,
          `${phase}/${item.focusWord} feedback reveals the answer: ${feedback}`,
        );
        assert.ok(feedback.length > 20, `${phase}/${item.focusWord} feedback is too thin`);
      }
    }
  }
});

test("the cold open has its own replies and its own day badge", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;

  assert.ok(stage.coldOpen, "the stage has no cold-open content");
  // Kon absorbs a miss rather than scoring it, and offers the three days.
  assert.match(stage.coldOpen.wrongReply, /三日/);
  assert.doesNotMatch(stage.coldOpen.wrongReply, /間違/);
  // A learner who already knows the word is not sent to remedial practice.
  assert.match(stage.coldOpen.correctReply, /ご存じ/);

  // The badge must not claim this is Day 1 - Day 1 comes after it.
  const meta = stage.getDayMeta("coldopen");
  assert.notEqual(meta.label, "一日目");
  assert.equal(meta.stars, "");
});

test("the cold open announces a guest, not Day 1", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const line = stage.getDayAnnouncement("coldopen");
  assert.match(line, /お客様/);
  assert.doesNotMatch(line, /一日目/, "the three days start after the cold open, because of it");
});
