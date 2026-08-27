/* The whole course, checked as one thing.
 *
 * Every other suite checks one stage. This one checks that the five stages add
 * up to the course the design describes: five places, four episodes each, ten
 * questions per episode, and two hundred distinct words taught.
 *
 * The four-episode rule has been in learning-content.js since the beginning and
 * was filtered out of the Inn's tests for months because the Inn had one
 * episode. Nothing is filtered here.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const STAGE_FILES = [
  "n2-inn-episodes.js",
  "n2-market-episodes.js",
  "n2-teahouse-episodes.js",
  "n2-station-episodes.js",
  "n2-shrine-episodes.js",
];

const PLACES = ["home-inn", "market", "tea-house", "station", "shrine"];

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "question-renderer.js", ...STAGE_FILES]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  return context;
}

const questionsOf = (stage) =>
  stage.episodes.flatMap((e) => e.days.flatMap((d) => d.questions));

test("all five places are registered and playable", () => {
  const { LanternEpisodeStages: stages } = load();
  assert.deepEqual(Object.keys(stages).sort(), [...PLACES].sort());
  for (const key of PLACES) {
    assert.equal(stages[key].key, key, key + " does not know its own name");
  }
});

test("every stage satisfies the contract with nothing filtered out", () => {
  const { LanternEpisodeStages: stages, LanternLearningContent: content } = load();
  for (const key of PLACES) {
    // The array comes from inside the vm, so compare its contents rather than
    // the array itself: deepEqual across realms fails on identical arrays.
    const errors = content.validateStage(stages[key]).errors;
    assert.equal(errors.length, 0, key + ": " + Array.from(errors).join("; "));
  }
});

test("the course is 5 places, 20 episodes, 200 questions, 200 distinct words", () => {
  const { LanternEpisodeStages: stages } = load();
  const all = PLACES.flatMap((key) => questionsOf(stages[key]));
  const episodes = PLACES.reduce((n, key) => n + stages[key].episodes.length, 0);

  assert.equal(episodes, 20, "episodes");
  assert.equal(all.length, 200, "questions");
  assert.equal(new Set(all.map((q) => q.target)).size, 200, "each question teaches its own word");
  assert.equal(new Set(all.map((q) => q.id)).size, 200, "question ids are unique across the course");
});

test("a word is taught by the place whose partition holds it", () => {
  const { LanternEpisodeStages: stages, LanternCurriculumCatalog: catalog } = load();
  // Coverage is counted per place, so the forty words a place teaches have to
  // be the forty its practice pool will keep drilling.
  for (const key of PLACES) {
    for (const q of questionsOf(stages[key])) {
      const item = catalog.getItem(q.target);
      assert.ok(item, `${q.id} names an unknown target ${q.target}`);
      assert.equal(item.partition, key, `${q.id} teaches ${item.canonical}, which lives in ${item.partition}`);
    }
  }
});

test("no prompt is reused anywhere in the course", () => {
  const { LanternEpisodeStages: stages } = load();
  const prompts = PLACES.flatMap((key) => questionsOf(stages[key]).map((q) => q.prompt.jp));
  const seen = new Map();
  for (const p of prompts) seen.set(p, (seen.get(p) || 0) + 1);
  const repeated = [...seen.entries()].filter(([, n]) => n > 1).map(([p]) => p.slice(0, 30));
  assert.deepEqual(repeated, [], "a repeated prompt can be answered from memory");
});

test("every place covers the full spread of official item types", () => {
  const { LanternEpisodeStages: stages } = load();
  // The written four cannot be heard, so each place puts them in one episode;
  // the rest of the place is listening and reading. A place missing any of
  // them is not preparing anyone for the paper.
  for (const key of PLACES) {
    const skills = new Set(questionsOf(stages[key]).map((q) => q.skill));
    for (const skill of ["orthography", "word-formation", "sentence-building", "text-grammar", "reading"]) {
      assert.ok(skills.has(skill), `${key} never asks a ${skill} question`);
    }
  }
});

test("reading and passage items give enough time and state their conditions", () => {
  const { LanternEpisodeStages: stages } = load();
  for (const key of PLACES) {
    for (const q of questionsOf(stages[key])) {
      if (!["reading", "text-grammar"].includes(q.skill)) continue;
      assert.ok(q.seconds >= 60, `${q.id} gives only ${q.seconds}s to read a passage`);
      const rules = q.prompt.jp.split("\n").filter((l) => l.startsWith("※"));
      assert.ok(rules.length >= 2, `${q.id} states only ${rules.length} condition(s)`);
      assert.ok(!q.prompt.audio, `${q.id} would read its own answer aloud`);
    }
  }
});

test("every question can explain each of its four choices", () => {
  const { LanternEpisodeStages: stages } = load();
  for (const key of PLACES) {
    for (const q of questionsOf(stages[key])) {
      assert.equal(q.answer.options.length, 4, `${q.id} needs four choices`);
      assert.equal(q.optionNotes.length, 4, `${q.id} needs a note per choice`);
      for (const note of q.optionNotes) {
        assert.ok(note.trim().length > 8, `${q.id} has an empty note`);
      }
      assert.ok(q.repair && q.repair.prompt, `${q.id} has no repair form`);
      assert.ok([5, 8, 12].includes(q.repair.seconds), `${q.id} repair clock is ${q.repair.seconds}s`);
    }
  }
});

test("answer content is Japanese only, so nothing is answerable from English", () => {
  const { LanternEpisodeStages: stages } = load();
  for (const key of PLACES) {
    for (const q of questionsOf(stages[key])) {
      for (const option of q.answer.options) {
        assert.doesNotMatch(option, /[A-Za-z]{2,}/, `${q.id}: ${option}`);
      }
      for (const option of q.repair.options) {
        assert.doesNotMatch(option, /[A-Za-z]{2,}/, `${q.id} repair: ${option}`);
      }
    }
  }
});

test("Kon's briefing never promises more time than the questions give", () => {
  const { LanternEpisodeStages: stages } = load();
  // The briefing said 読む問題は二分 while the passage items ran on ninety
  // seconds. A rule the game states and then breaks is worse than no rule.
  for (const key of PLACES) {
    for (const episode of stages[key].episodes) {
      const points = ((episode.briefing && episode.briefing.points) || []).join(" ");
      if (!points.includes("二分")) continue;
      for (const q of episode.days.flatMap((d) => d.questions)) {
        if (!["reading", "text-grammar"].includes(q.skill)) continue;
        assert.ok(q.seconds >= 120,
          `${episode.id} promises 二分 but ${q.id} gives ${q.seconds}s`);
      }
    }
  }
});

test("an episode explains the star only when it actually asks for one", () => {
  const { LanternEpisodeStages: stages } = load();
  for (const key of PLACES) {
    for (const episode of stages[key].episodes) {
      const points = ((episode.briefing && episode.briefing.points) || []).join(" ");
      const questions = episode.days.flatMap((d) => d.questions);
      const hasStar = questions.some((q) => q.answer.type === "sentence-order");
      assert.equal(points.includes("★"), hasStar,
        `${episode.id}: briefing and questions disagree about the star`);
    }
  }
});

test("counters are Japanese: the つ series stops at 九つ", () => {
  const { LanternEpisodeStages: stages } = load();
  // 二十四つ was written in two places. The native counter ends at 九つ, then
  // goes to 十; past that it is 個, 枚, 名 and so on.
  const bad = /[十百千][一二三四五六七八〇]?つ/;
  for (const key of PLACES) {
    for (const q of questionsOf(stages[key])) {
      const text = [q.prompt.jp, q.feedback.correct, q.feedback.incorrect, ...q.answer.options].join(" ");
      const hit = bad.exec(text);
      assert.equal(hit, null, `${q.id} counts with ${hit && hit[0]}`);
    }
  }
});

test("what Kon asks for is what the correct answer does", () => {
  const { LanternEpisodeStages: stages } = load();
  // A spoken instruction names an action; the right answer has to be that
  // action rather than a neighbouring one. Checked here for the pairs that
  // are easiest to confuse, which is where the near-miss distractors live.
  const opposites = [
    ["点けて", "消します"],
    ["敷いて", "しまいます"],
    ["乾かして", "水につけます"],
    ["支払って", "受け取ります"],
  ];
  for (const key of PLACES) {
    for (const q of questionsOf(stages[key])) {
      for (const [asked, wrong] of opposites) {
        if (!q.prompt.jp.includes(asked)) continue;
        const correct = q.answer.options[q.answer.correctIndex];
        assert.ok(!correct.includes(wrong),
          `${q.id} asks to ${asked} but the correct answer is ${correct}`);
      }
    }
  }
});
