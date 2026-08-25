import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./question-renderer.js", import.meta.url), "utf8"), context);
  return context.LanternQuestionRenderer;
}

const question = (over = {}) => ({
  id: "q1",
  target: "v-hikiukeru",
  prompt: { jp: "今夜の夕食の配膳を引き受けていただけませんか。", audio: true },
  answer: { type: "single-choice", options: ["はい、引き受けます。", "すみません、引き受けられません。"], correctIndex: 0 },
  feedback: { correct: "ありがとうございます。", incorrect: "まだ返事になっていません。" },
  ...over,
});

test("every answer type produces a description", () => {
  const renderer = load();
  for (const type of renderer.SUPPORTED_TYPES) {
    const spec = renderer.describe(question({ answer: { type, options: ["はい", "いいえ"], correctIndex: 0 } }));
    assert.equal(spec.type, type);
    assert.ok(spec.controls.length > 0, `${type} produced no controls`);
  }
});

test("exactly one control is the primary answer action", () => {
  const renderer = load();
  for (const type of renderer.SUPPORTED_TYPES) {
    const spec = renderer.describe(question({ answer: { type, options: ["はい", "いいえ"], correctIndex: 0 } }));
    const primaries = spec.controls.filter((control) => control.primary);
    assert.equal(primaries.length, 1, `${type} has ${primaries.length} primary actions`);
  }
});

test("every control has an accessible name and is keyboard reachable", () => {
  const renderer = load();
  const spec = renderer.describe(question());
  for (const control of spec.controls) {
    assert.ok(control.ariaLabel && control.ariaLabel.trim(), "control has no accessible name");
    assert.notEqual(control.tabIndex, -1);
  }
});

test("choices stay visible instead of hiding in a select", () => {
  const spec = load().describe(question());
  assert.equal(spec.presentation, "visible-choices");
  assert.equal(spec.controls.filter((c) => c.role === "option").length, 2);
});

test("answer content stays Japanese; only How to interact is English", () => {
  const spec = load().describe(question());
  for (const control of spec.controls) {
    assert.doesNotMatch(control.label, /[A-Za-z]{2,}/, `English leaked into an answer: ${control.label}`);
  }
  assert.match(spec.howToInteract, /[A-Za-z]/);
});

test("challenge hides romaji, meaning and hints", () => {
  const spec = load().describe(question({ romaji: "kon'ya no", meaning: "Would you serve dinner?", hint: "undertake" }), { phase: "challenge" });
  assert.equal(spec.romaji, "");
  assert.equal(spec.meaning, "");
  assert.equal(spec.hint, "");
});

test("there is no timer outside correction", () => {
  const renderer = load();
  assert.equal(renderer.describe(question()).timer, null);
  assert.equal(renderer.describe(question(), { phase: "learn" }).timer, null);
});

test("a repair timer waits for audio before it starts", () => {
  const renderer = load();
  let timer = renderer.createTimer({ seconds: 8, audio: true });
  assert.equal(timer.running, false);
  timer = renderer.tickTimer(timer, 1000);
  assert.equal(timer.remaining, 8000, "the clock must not run while audio is still playing");

  timer = renderer.startTimer(timer, 1000);
  timer = renderer.tickTimer(timer, 4000);
  assert.equal(timer.remaining, 5000);
});

test("a hidden document pauses the timer instead of failing the learner", () => {
  const renderer = load();
  let timer = renderer.startTimer(renderer.createTimer({ seconds: 8 }), 0);
  timer = renderer.tickTimer(timer, 2000);
  timer = renderer.pauseTimer(timer, 2000);
  timer = renderer.tickTimer(timer, 60000);
  assert.equal(timer.remaining, 6000);
  timer = renderer.resumeTimer(timer, 60000);
  timer = renderer.tickTimer(timer, 61000);
  assert.equal(timer.remaining, 5000);
});

test("a timeout fires exactly once", () => {
  const renderer = load();
  let timer = renderer.startTimer(renderer.createTimer({ seconds: 5 }), 0);
  timer = renderer.tickTimer(timer, 5000);
  assert.equal(timer.expired, true);
  assert.equal(timer.emitted, true);
  const again = renderer.tickTimer(timer, 9000);
  assert.equal(again.emitted, true);
  assert.equal(again.emitCount, 1);
});
