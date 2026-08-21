import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

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
    ["揃える", "代える", "暖める", "調整", "引き受ける"],
  );
  assert.ok(stage.encounters.every((item) => item.level === "N2"));
});

test("Moonview Inn establishes the learner as Kon's helper before the first task", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const intro = context.N2HomeInnStage.intro;

  assert.match(intro.context, /従業員が一人休んで/);
  assert.match(intro.jp, /仕事を手伝ってくれませんか/);
  assert.equal(intro.accept, "はい、手伝います。");
  assert.match(html, /function renderStageIntro\(loc\)/);
  assert.match(html, /renderStageIntro\(loc\)/);
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

test("encounter lookup clamps to the available stage", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  assert.equal(stage.getEncounter(-1).focusWord, "揃える");
  assert.equal(stage.getEncounter(99).focusWord, "引き受ける");
});

test("the open-world map loads Moonview Inn and advances its encounters", () => {
  assert.match(html, /<script src="n2-home-inn-stage\.js"><\/script>/);
  assert.match(html, /locations\.push\(N2HomeInnStage\)/);
  assert.match(html, /state\.encounterIndex/);
  assert.match(html, /continueStageEncounter/);
  assert.match(html, /Encounter <span id="encounter-progress">1<\/span> of <span id="encounter-total">5<\/span>/);
});

test("Moonview Inn has evidence-based practice and challenge phases", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  assert.equal(stage.practice.length, 10);
  assert.equal(stage.challenge.length, 10);

  for (const word of stage.encounters.map((item) => item.focusWord)) {
    assert.equal(stage.practice.filter((item) => item.focusWord === word).length, 2);
    assert.equal(stage.challenge.filter((item) => item.focusWord === word).length, 2);
  }
  assert.ok(stage.challenge.every((item) => item.romaji === "" && item.hint === ""));
});

test("practice never repeats a Learn request", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const learnRequests = new Set(stage.encounters.map((item) => item.jp));

  assert.equal(stage.practice.length, 10);
  assert.equal(stage.practice.every((item) => !learnRequests.has(item.jp)), true);
  assert.equal(new Set(stage.practice.map((item) => item.jp)).size, 10);
});

test("stage UI separates phase status from the story title and offers a Learn restart", () => {
  assert.match(html, /id="stage-phase-badge"/);
  assert.match(html, /id="btn-restart-learn"/);
  assert.match(html, /restartStageLearning/);
  assert.match(html, /\$\("stage-phase-row"\)\.style\.display = loc\.encounters \? "flex" : "none"/);
});

test("challenge mastery requires eight correct and coverage of every word", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const allWords = stage.encounters.map((item) => item.focusWord);
  assert.equal(stage.isChallengeMastered(8, allWords), true);
  assert.equal(stage.isChallengeMastered(7, allWords), false);
  assert.equal(stage.isChallengeMastered(10, allWords.slice(0, 4)), false);
});

test("the game exposes learn, practice, challenge, and focused retry flow", () => {
  assert.match(html, /stagePhase:"learn"/);
  assert.match(html, /advanceStagePhase/);
  assert.match(html, /challengeMisses/);
  assert.match(html, /Review missed words/);
  assert.doesNotMatch(html, /state\.stagePhase === "challenge" \? "音声を聞いて、正しい行動を選んでください。" : prompt\.narration/);
  assert.match(html, /getStorySetup\(prompt, state\.resumedStageEntry\)/);
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
  assert.match(stage.getWrittenPrompt(stage.practice.find((item) => item.focusWord === "暖める"), "practice"), /暖めて/);
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
  assert.match(stage.getStorySetup(stage.practice[7], true), /^コン：「お帰りなさい。/);
  assert.match(stage.getStorySetup(stage.practice[7], true), /スープ/);
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
    /向き/, /シーツ/, /ごはん/, /Cグループ.*12時.*Dグループ.*14時/, /朝食/,
    /大きさ/, /電球/, /スープ/, /Aグループ.*15時.*Bグループ.*17時/, /荷物/,
  ];
  stage.practice.forEach((item, index) => {
    assert.match(stage.getKonResponse(item, true), expectedPracticeResults[index], item.variant);
  });
});

test("the stage renderer speaks Kon's answer response before advancing", () => {
  assert.match(html, /function showKonStageResponse/);
  assert.match(html, /stage\.getKonResponse\(prompt, isCorrect\)/);
  assert.match(html, /speak\(response, isCorrect \? "correct" : "wrong"\)/);
});

test("non-dialogue harder items have exactly one explained N2 near-miss", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const verifiedNearMisses = ["整う", "代わる", "暖まる", "調節する"];

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

  for (const item of [...stage.encounters, ...stage.practice, ...stage.challenge].filter((entry) => entry.mechanic === "undertake")) {
    assert.equal(item.options.some((option) => option.nearMiss), false, item.variant);
    assert.deepEqual(
      Array.from(item.interaction.replies, (reply) => reply.label),
      ["はい、引き受けます。", "何時からですか。", "すみません、引き受けられません。"],
    );
    assert.equal(item.interaction.replies.every((reply) => !reply.icon), true);
  }

  assert.doesNotMatch(html, /reply\.key === "accept" \? "" : " danger"/);
});

test("the Learn offer includes a free overnight stay and leads into the next morning", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(stageUrl, "utf8"), context);
  const stage = context.N2HomeInnStage;
  const offer = stage.encounters.at(-1);

  assert.match(offer.narration, /今夜.*無料で泊まれます/);
  assert.match(offer.jp, /明日のお客様の案内を引き受けて/);
  assert.match(offer.completionFeedback, /ありがとうございます.*今夜.*休んで/);
  assert.equal(offer.completionNextLabel, "次の朝へ");
  assert.match(stage.practice[0].narration, /おはようございます.*昨夜はよく眠れましたか/);
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
  const item = stage.practice.find((entry) => entry.focusWord === "調整");
  assert.match(item.jp, /時間|予定/);
  assert.doesNotMatch(item.jp, /温度/);
  const nearMiss = item.options.find((option) => option.nearMiss);
  assert.equal(nearMiss.label, "調節する");
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
  assert.match(feedback, /揃える/);
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

test("the current map contains only the entrance and Moonview Inn", () => {
  for (const removedKey of ["crossroads", "stars", "fruit", "tea", "festival"]) {
    assert.doesNotMatch(html, new RegExp(`key:\"${removedKey}\"`));
  }
  assert.match(html, /key:"entrance"/);
  assert.match(html, /locations\.push\(N2HomeInnStage\)/);
});

test("the page loads the interaction engine and persists stage progress", () => {
  assert.match(html, /<script src="moonview-inn-interactions\.js"><\/script>/);
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
  const checkout = stage.encounters.find((item) => item.focusWord === "調整");
  assert.match(checkout.jp, /14時/);
  assert.match(checkout.jp, /2時間/);
  assert.equal(checkout.interaction.targetA, 13);
  const arrivals = stage.practice.find((item) => item.focusWord === "調整" && item.variant === "practice-b");
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
  // arrival preparation -> arrival -> next morning -> after the guest has gone
  const beats = ["もうすぐ", "到着しました", "朝になりました", "満足して帰りました"];
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
  assert.ok(moving.length >= 9);

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
  const bySize = stage.practice.find((item) => item.focusWord === "揃える" && item.variant === "practice-b");

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
  const arrangeItems = [...stage.encounters, ...stage.practice].filter((item) => item.focusWord === "揃える");

  for (const item of arrangeItems) {
    assert.match(item.jp, /二つのマットに、同じ.+の座布団を二枚ずつ揃えてください。/, item.variant);
  }
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

test("Moonview Inn displays medals and saves after stage movement", () => {
  assert.match(html, /bronze:"🥉",silver:"🥈",gold:"🥇"/);
  assert.match(html, /function saveStageProgress/);
  assert.match(html, /saveStageProgress\(\);/);
});
