import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = ["./index.html", "./styles.css", "./app.js"]
  .map((name) => readFileSync(new URL(name, import.meta.url), "utf8"))
  .join(String.fromCharCode(10));

test("new learners choose either accessible player character before the entrance", () => {
  assert.match(html, /id="screen-character"/);
  assert.match(html, /data-character="man"/);
  assert.match(html, /data-character="woman"/);
  assert.match(html, /function showCharacterSelection/);
  assert.match(html, /state\.playerCharacter/);
  assert.match(html, /player-actions-kimono-woman-v2\.webp/);
});

test("character choice uses the gate scene instead of two oversized paper cards", () => {
  assert.match(html, /class="character-guide"/);
  assert.match(html, /姿を選んでください/);
  assert.match(html, /\.character-option\{[^}]*background:rgba/);
  assert.match(html, /\.character-preview\{[^}]*aspect-ratio:1\/2/);
});

test("opening is a cinematic Japanese entry into the illustrated alley", () => {
  assert.match(html, /id="screen-title" class="frame title-scene"/);
  assert.match(html, /<h1[^>]*>言葉の路地<\/h1>/);
  assert.match(html, />LANTERN ALLEY</);
  assert.match(html, /id="btn-start">路地へ入る<\/button>/);
  assert.match(html, /assets\/map\/lantern-alley-map-v1\.jpg/);
  assert.match(html, /class="title-kon"[\s\S]*?fox-neutral-no-mouth-transparent\.webp/);
  assert.match(html, /\.title-kon::after\{/);
  assert.match(html, /id="progress-note"[^>]*hidden/);
  assert.match(html, /路地へ戻る/);
  assert.match(html, /id="btn-restart"[^>]*hidden>最初から<\/button>/);
  assert.match(html, /btn-restart"\)\.addEventListener\("click", function\(\)\{[\s\S]*?enterLocation\("entrance"\);/);
  assert.doesNotMatch(html, /Dusk falls over a Tokyo backstreet/);
});

test("mistakes use feedback and retry without a three-life counter", () => {
  assert.doesNotMatch(html, /id="hud-hearts"/);
  assert.doesNotMatch(html, /Hearts remaining/);
  assert.doesNotMatch(html, /heartsEl/);
});

test("greeting rests on the transparent fox after speech", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  assert.equal(existsSync(logicUrl), true, "entrance pose logic must exist");
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  assert.equal(context.LanternAlleyLogic.getSpeechEndPose("hello"), "talkBase");
  assert.equal(context.LanternAlleyLogic.getSpeechEndPose("correct"), "celebrate");
  assert.equal(context.LanternAlleyLogic.getSpeechEndPose("wrong"), "tryAgain");
  assert.equal(context.LanternAlleyLogic.getSpeechEndPose("ask"), "listen");
});

test("every Kon-led stage keeps the transparent pose system", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  const logic = context.LanternAlleyLogic;

  assert.equal(logic.shouldUseTransparentFox("entrance", false), true);
  assert.equal(logic.shouldUseTransparentFox("home-inn", true), true);
  assert.equal(logic.shouldUseTransparentFox("ordinary-stop", false), false);
});

test("every Entrance Kon pose uses a transparent production cutout", () => {
  const transparentPoses = [
    "fox-neutral-idle-transparent-v2.webp",
    "fox-wave-closed-smile-transparent-v2.webp",
    "fox-wave-small-open-mouth-transparent-v2.webp",
    "fox-wave-konnichiwa-mouth-transparent-v2.webp",
    "fox-invite-bow-transparent-v2.webp",
    "fox-celebration-transparent-v2.webp",
    "fox-try-again-transparent-v2.webp",
    "fox-listening-transparent-v2.webp",
  ];

  for (const name of transparentPoses) {
    assert.equal(existsSync(new URL("./assets/fox/" + name, import.meta.url)), true, name + " must exist");
    assert.ok(html.includes("assets/fox/" + name), name + " must be used by the app");
  }
});

test("transparent fox shadow follows the character instead of its canvas", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  assert.equal(typeof context.LanternAlleyLogic.getTransparentFoxStyle, "function");
  const style = context.LanternAlleyLogic.getTransparentFoxStyle();
  assert.equal(style.boxShadow, "none");
  assert.match(style.filter, /^drop-shadow\(/);
});

test("talking mouth uses a gentle happy shape", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  assert.equal(typeof context.LanternAlleyLogic.getHappyMouthStyle, "function");
  const style = context.LanternAlleyLogic.getHappyMouthStyle();
  assert.equal(style.borderRadius, "50% 50% 64% 64% / 34% 34% 76% 76%");
  assert.match(style.background, /#c97872/);
  assert.equal(style.left, "50%");
  assert.equal(style.top, "53%");
});

test("entrance uses fixed pose assets instead of a mouth overlay", () => {
  assert.match(html, /ENTRANCE_FOX_POSES/);
  assert.match(html, /fox-neutral-no-mouth-transparent\.webp/);
  assert.match(html, /live-mouth/);
  assert.match(html, /talkBase/);
  assert.doesNotMatch(html, /kon-mouth-overlay/);
  assert.match(html, /entrance-dialogue/);
});

test("entrance has hello dialogue and action-specific reactions", () => {
  assert.match(html, /action-celebrate/);
  assert.match(html, /action-try-again/);
  assert.match(html, /setEntranceFoxPose\("talkBase"\)/);
});

test("entrance tutorial greets, explains the world, teaches an action, then opens destination choice", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  const tutorial = context.LanternAlleyLogic;
  let state = tutorial.createTutorial();

  assert.equal(tutorial.getTutorialStep(state).kind, "greeting");
  state = tutorial.advanceTutorial(state);
  assert.equal(tutorial.getTutorialStep(state).kind, "world");
  state = tutorial.advanceTutorial(state);
  assert.equal(tutorial.getTutorialStep(state).kind, "request");
  assert.equal(tutorial.getTutorialStep(state).jp, "まず、私にお辞儀してください。");
  state = tutorial.completeTutorial(state);
  assert.equal(tutorial.getTutorialStep(state).kind, "complete");
  assert.equal(tutorial.getTutorialStep(state).destination, "map");
});

test("entrance tutorial keeps Japanese in Kon's request and labels the action choices in English", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  const tutorial = context.LanternAlleyLogic;

  assert.deepEqual(Array.from(tutorial.getTutorialActions(), (item) => item.label), ["Bow", "Wave", "Clap"]);
  assert.equal(tutorial.getHowToInteract(), "Choose the action Kon asks for.");
  assert.match(html, /key:"bow", emoji:"🙇", label:"Bow"/);
  assert.match(html, /key:"wave", emoji:"👋", label:"Wave"/);
  assert.match(html, /key:"clap", emoji:"👏", label:"Clap"/);
});

test("entrance exposes three visible tutorial beats before the map", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  const tutorial = context.LanternAlleyLogic;

  let state = tutorial.createTutorial();
  assert.deepEqual(JSON.parse(JSON.stringify(tutorial.getTutorialProgress(state))), {current:1, total:3});
  state = tutorial.advanceTutorial(state);
  assert.deepEqual(JSON.parse(JSON.stringify(tutorial.getTutorialProgress(state))), {current:2, total:3});
  state = tutorial.advanceTutorial(state);
  assert.deepEqual(JSON.parse(JSON.stringify(tutorial.getTutorialProgress(state))), {current:3, total:3});
  state = tutorial.completeTutorial(state);
  assert.deepEqual(JSON.parse(JSON.stringify(tutorial.getTutorialProgress(state))), {current:3, total:3});
});

test("entrance uses one illustrated scene and reveals picture actions only for the request", () => {
  assert.match(html, /id="entrance-progress"/);
  assert.match(html, /screenGame\.classList\.toggle\("entrance-stage"/);
  assert.match(html, /entrance-actions-visible/);
  assert.match(html, /How to interact/);
  assert.match(html, /\.entrance-control-help strong\{[^}]*text-transform:uppercase/);
  assert.match(html, /assets\/map\/lantern-alley-map-v1\.jpg/);
});

test("entrance uses a wooden gate scene and consistent human action artwork", () => {
  assert.equal(existsSync(new URL("./assets/entrance/wooden-gate-v1.webp", import.meta.url)), true);
  assert.equal(existsSync(new URL("./assets/entrance/player-actions-kimono-man-v2.webp", import.meta.url)), true);
  assert.equal(existsSync(new URL("./assets/entrance/player-actions-kimono-woman-v2.webp", import.meta.url)), true);
  assert.match(html, /assets\/entrance\/wooden-gate-v1\.webp/);
  assert.match(html, /PLAYER_ACTION_SPRITE/);
  assert.match(html, /entrance-player-art/);
  assert.match(html, /entrance-action-art-/);
  assert.doesNotMatch(html, /var PLAYER_SVG/);
});

test("entrance separates large scene characters from the bottom dialogue dock", () => {
  assert.match(html, /id="dialogue-shell"/);
  assert.match(html, /dialogueShell\.insertBefore\(avatarSlot, \$\("dialogue-panel"\)\)/);
  assert.match(html, /scene\.appendChild\(\$\("avatar-slot"\)\)/);
  assert.match(html, /\.entrance-stage \.player-figure\{width:170px;height:340px/);
  assert.match(html, /\.entrance-stage #scene > \.avatar\.avatar-animated\{position:absolute;width:170px;height:220px/);
  assert.match(html, /\.entrance-stage \.learning-context\{[^}]*align-self:end/);
  assert.match(html, /\.entrance-stage \.game-layout:has\(#scene\.entrance-actions-visible\) \.learning-context\{margin-bottom:162px\}/);
  assert.match(html, /\.entrance-stage \.duo-stage\{left:35%;bottom:302px\}/);
  assert.match(html, /\.entrance-stage #scene > \.avatar\.avatar-animated\{width:112px;height:145px;left:65%;bottom:302px\}/);
  assert.match(html, /\.entrance-stage \.entrance-action-grid\{right:8px;bottom:8px;width:calc\(100% - 16px\);min-height:145px;padding:7px 6px 6px\}/);
});

test("entrance instructions occupy their own row above the action cards", () => {
  assert.match(html, /if\(how\) wrap\.appendChild\(how\);\s*loc\.options\.forEach/);
  assert.match(html, /\.entrance-control-help\{grid-column:1\/-1;position:static/);
  assert.match(html, /\.entrance-stage \.entrance-action-grid\{[^}]*grid-template-rows:auto minmax\(0,1fr\)/);
  assert.doesNotMatch(html, /\.entrance-control-help\{[^}]*bottom:/);
});

test("entrance reserves only a compact header row and keeps speech readable", () => {
  assert.match(html, /\.entrance-stage \.game-layout\{[^}]*grid-template-rows:auto minmax\(0,1fr\)/);
  assert.match(html, /\.entrance-stage \.dialogue\.entrance-dialogue \.speech\{[^}]*color:#2d2926/);
});

test("bow uses a dedicated side-view pose instead of distorting a front-facing figure", () => {
  assert.match(html, /\.action-bow \.entrance-player-art\{[^}]*background-position:33\.333% center/);
  assert.match(html, /\.action-bow \.entrance-player-art\{[^}]*animation:player-pose-pop 1\.2s/);
  assert.doesNotMatch(html, /player-upper-group/);
  assert.match(html, /setTimeout\(function\(\)\{[\s\S]*?resolveDuoAnswer[\s\S]*?\}, 1250\)/);
  assert.match(html, /prefers-reduced-motion:reduce[\s\S]*?\.entrance-player-art/);
});

test("first dialogue activation stops speech and reveals the line without advancing", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  const renders = [];
  let stopped = 0;
  let advanced = 0;
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render(visible, phase) { renders.push({ visible, phase }); },
    stopVoice() { stopped += 1; },
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("明日の案内をお願いします。", true);
  flow.setContinuation(() => { advanced += 1; });

  assert.deepEqual(renders.at(-1), { visible: "", phase: "speaking" });
  assert.equal(flow.activate(), "completed");
  assert.equal(stopped, 1);
  assert.equal(advanced, 0);
  assert.deepEqual(renders.at(-1), {
    visible: "明日の案内をお願いします。",
    phase: "ready",
  });
});

test("second dialogue activation advances exactly once", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  let advanced = 0;
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render() {},
    stopVoice() {},
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("次へ進みます。", true);
  flow.setContinuation(() => { advanced += 1; });
  flow.activate();
  assert.equal(flow.activate(), "advanced");
  assert.equal(flow.activate(), "ignored");
  assert.equal(advanced, 1);
});

test("dialogue cannot advance while the learner still owes an answer", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  let stopped = 0;
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render() {},
    stopVoice() { stopped += 1; },
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("座布団を揃えてください。", true);
  assert.equal(flow.activate(), "completed");
  assert.equal(flow.activate(), "ignored");
  assert.equal(stopped, 1);
});

test("a naturally completed line needs only one click to advance", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  let advanced = 0;
  const renders = [];
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render(visible, phase) { renders.push({ visible, phase }); },
    stopVoice() {},
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("お待たせしました。", true);
  flow.setContinuation(() => { advanced += 1; });
  flow.voiceFinished();

  assert.deepEqual(renders.at(-1), { visible: "お待たせしました。", phase: "ready" });
  assert.equal(flow.activate(), "advanced");
  assert.equal(advanced, 1);
});

test("dialogue keeps the full line available while only part is visible", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render() {},
    stopVoice() {},
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("全文をもう一度聞きます。", true);
  assert.equal(flow.getText(), "全文をもう一度聞きます。");
});

test("background clicks finish speech first and advance on the following click", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  let stopped = 0;
  let advanced = 0;
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render() {},
    stopVoice() { stopped += 1; },
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("どこを押しても会話が進みます。", true);
  flow.setContinuation(() => { advanced += 1; });

  assert.equal(flow.activateFromSurface(false), "completed");
  assert.equal(stopped, 1);
  assert.equal(advanced, 0);
  assert.equal(flow.activateFromSurface(false), "advanced");
  assert.equal(advanced, 1);
});

test("explicit controls never trigger the global dialogue action", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  let stopped = 0;
  let advanced = 0;
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render() {},
    stopVoice() { stopped += 1; },
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("ボタンは本来の働きを保ちます。", true);
  flow.setContinuation(() => { advanced += 1; });
  assert.equal(flow.activateFromSurface(true), "ignored");
  assert.equal(stopped, 0);

  flow.voiceFinished();
  assert.equal(flow.activateFromSurface(true), "ignored");
  assert.equal(advanced, 0);
});

test("audio replay preserves the pending dialogue continuation", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);

  let advanced = 0;
  const flow = context.LanternAlleyLogic.createDialogueFlow({
    render() {},
    stopVoice() {},
    schedule() { return 1; },
    cancelSchedule() {},
  });

  flow.start("もう一度聞いても、次へ進めます。", true);
  flow.setContinuation(() => { advanced += 1; });
  flow.replay(true);
  flow.voiceFinished();

  assert.equal(flow.activateFromSurface(false), "advanced");
  assert.equal(advanced, 1);
});

test("the finished Entrance keeps Kon's reply, the result and the continue button on screen", () => {
  // #screen-game.entrance-stage is overflow:hidden, so anything after #scene is
  // clipped rather than merely pushed below the fold. On a short phone that hid
  // the result and the only way forward, leaving the stage a dead end.
  assert.match(html, /screenGame\.classList\.add\("entrance-complete"\)/);
  assert.match(html, /screenGame\.classList\.remove\("entrance-complete"\)/);

  // The spent action dock gives up its slot.
  assert.match(html, /\.entrance-stage\.entrance-complete \.entrance-action-grid/);

  // Desktop: the button takes the dock slot inside the stage.
  assert.match(html, /@media\(min-width:761px\)\{\s*\.entrance-stage \.next-row\{position:absolute/);

  // Phone: fixed positioning is what escapes the clip; sticky cannot pin
  // inside a non-scrolling overflow:hidden box.
  assert.match(
    html,
    /\.entrance-stage\.entrance-complete \.feedback-row,\s*\.entrance-stage\.entrance-complete \.next-row\{position:fixed/,
  );

  // The lift that puts those rows above the dialogue must stay phone-only,
  // or on desktop it also lifts #scene over Kon's speech card.
  const mobileBlock = html.slice(html.indexOf("@media(max-width:760px)"));
  assert.ok(
    mobileBlock.includes(".entrance-stage.entrance-complete .answer-workspace{z-index:21}"),
    "the workspace lift must live inside the phone media block",
  );
});
