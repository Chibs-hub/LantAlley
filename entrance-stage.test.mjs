import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("./lantern-alley.html", import.meta.url), "utf8");

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
  assert.match(html, /fox-neutral-no-mouth-transparent\.png/);
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

test("entrance tutorial action labels are Japanese and exposes one English mechanic instruction", () => {
  const logicUrl = new URL("./entrance-stage-logic.js", import.meta.url);
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(logicUrl, "utf8"), context);
  const tutorial = context.LanternAlleyLogic;

  assert.deepEqual(Array.from(tutorial.getTutorialActions(), (item) => item.label), ["お辞儀", "手を振る", "拍手"]);
  assert.equal(tutorial.getHowToInteract(), "Choose the action Kon asks for.");
});
