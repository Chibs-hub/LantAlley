import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./curriculum-catalog.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("./learning-content.js", import.meta.url), "utf8"), context);
  return context.LanternLearningContent;
}

const KANJI_NUM = "一二三四五六七八九十".split("");
let seq = 0;

// Each question needs its own prompt: reusing one across phases is exactly what
// validateStage rejects, so a fixture that repeats it cannot be "valid".
function question(over = {}) {
  const jp = `第${KANJI_NUM[seq++ % 10]}問：今夜の夕食の配膳を引き受けていただけませんか。`;
  return {
    id: "inn-e01-d1-q01",
    prompt: { jp, audio: true },
    skill: "vocabulary-action",
    target: "v-hikiukeru",
    slots: [],
    sourceNote: "月見宿・第一話「最初のお客様」",
    answer: { type: "single-choice", options: ["はい、引き受けます。", "すみません、引き受けられません。"], correctIndex: 0 },
    feedback: { correct: "ありがとうございます。", incorrect: "まだ返事になっていません。" },
    repair: { prompt: "「引き受ける」に近い意味はどれですか。", options: ["責任を持って受ける", "断る"], correctIndex: 0, seconds: 8 },
    ...over,
  };
}

function episode(over = {}) {
  const days = [
    { day: 1, mode: "learn", questions: [question(), question({ id: "q2" }), question({ id: "q3" })] },
    { day: 2, mode: "practice", questions: [question({ id: "q4" }), question({ id: "q5" }), question({ id: "q6" })] },
    { day: 3, mode: "challenge", questions: [question({ id: "q7" }), question({ id: "q8" }), question({ id: "q9" }), question({ id: "q10" })] },
  ];
  return { id: "inn-e01", title: "First guests", sourceNote: "月見宿・第一話", intro: { jp: "コン：「…」", audio: true }, days, ...over };
}

const stage = () => ({ key: "home-inn", episodes: [episode(), episode({ id: "e2" }), episode({ id: "e3" }), episode({ id: "e4" })] });

test("a valid stage passes", () => {
  const result = load().validateStage(stage());
  assert.equal(result.errors.length, 0, result.errors.join("; "));
});

test("an episode must be 3-3-4", () => {
  const bad = stage();
  bad.episodes[0].days[2].questions.pop();
  assert.match(load().validateStage(bad).errors.join(" "), /3, 3, 4/);
});

test("a stage must have four episodes", () => {
  const bad = stage();
  bad.episodes.pop();
  assert.match(load().validateStage(bad).errors.join(" "), /four episodes/);
});

test("every primary target must exist in the catalog", () => {
  const bad = stage();
  bad.episodes[0].days[0].questions[0].target = "v-does-not-exist";
  assert.match(load().validateStage(bad).errors.join(" "), /unknown target/);
});

test("a question needs exactly one correct answer", () => {
  const bad = stage();
  bad.episodes[0].days[0].questions[0].answer.correctIndex = 5;
  assert.match(load().validateStage(bad).errors.join(" "), /one correct answer/);
});

test("English answer content is rejected", () => {
  const bad = stage();
  bad.episodes[0].days[0].questions[0].answer.options = ["Replace it", "Warm it"];
  assert.match(load().validateStage(bad).errors.join(" "), /English/i);
});

test("slot credit is capped and cannot decide correctness", () => {
  const bad = stage();
  bad.episodes[0].days[0].questions[0].slots = ["a", "b", "c", "d"];
  assert.match(load().validateStage(bad).errors.join(" "), /three slot/);
});

test("no answer type may require typing Japanese", () => {
  const bad = stage();
  bad.episodes[0].days[0].questions[0].answer = { type: "free-text" };
  assert.match(load().validateStage(bad).errors.join(" "), /typing/i);
});

test("the same prompt cannot be reused across phases", () => {
  const bad = stage();
  bad.episodes[0].days[1].questions[0].prompt.jp = bad.episodes[0].days[0].questions[0].prompt.jp;
  assert.match(load().validateStage(bad).errors.join(" "), /reuses/);
});

test("repair timers use the per-type budget, never a flat five seconds", () => {
  const content = load();
  const bad = stage();
  bad.episodes[0].days[0].questions[0].repair.seconds = 30;
  assert.match(content.validateStage(bad).errors.join(" "), /5, 8 or 12/);

  const repair = content.makeRepairQuestion(question());
  assert.equal(repair.seconds, 8);
  assert.equal(repair.options.length, 2);
});

test("day questions and episodes are retrievable", () => {
  const content = load();
  const s = stage();
  assert.equal(content.getEpisode(s, 1).id, "inn-e01");
  assert.equal(content.getDayQuestions(content.getEpisode(s, 1), 3).length, 4);
});
