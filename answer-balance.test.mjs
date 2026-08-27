/* Where the correct answer sits.
 *
 * Authored by hand, the right choice landed first far too often: 73% of main
 * answers and 100% of repair forms. "Always tap the top one" scored 73% without
 * reading a word of Japanese, which makes the whole thing untestable rather
 * than merely easy.
 *
 * research/balance-answers.mjs moves each answer to a position derived from its
 * question id. These tests are what stop it drifting back the next time a batch
 * of questions is written by hand.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const EPISODE_FILES = ["n2-inn-episodes.js", "n2-market-episodes.js", "n2-teahouse-episodes.js", "n2-station-episodes.js", "n2-shrine-episodes.js"];

function loadStages() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", ...EPISODE_FILES]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  return context.LanternEpisodeStages;
}

function allQuestions(stages) {
  return Object.values(stages).flatMap((stage) =>
    stage.episodes.flatMap((episode) => episode.days.flatMap((day) => day.questions)));
}

test("no answer position is a shortcut past the Japanese", () => {
  const questions = allQuestions(loadStages());
  assert.ok(questions.length >= 60, "there are enough questions to judge: " + questions.length);

  const counts = [0, 0, 0, 0];
  for (const q of questions) counts[q.answer.correctIndex] += 1;

  // With four choices, chance is 25%. A generous ceiling still kills the
  // "always tap the first one" strategy stone dead.
  const ceiling = Math.ceil(questions.length * 0.4);
  counts.forEach((n, i) => {
    assert.ok(n <= ceiling,
      `position ${i} holds ${n} of ${questions.length} answers, over the ${ceiling} ceiling`);
  });
  // And every position is actually used.
  counts.forEach((n, i) => assert.ok(n > 0, `position ${i} is never the answer`));
});

test("the correction round is not answerable by position either", () => {
  const questions = allQuestions(loadStages()).filter((q) => q.repair);
  assert.ok(questions.length >= 60, "every question carries a repair form");

  const counts = [0, 0];
  for (const q of questions) counts[q.repair.correctIndex] += 1;
  const ceiling = Math.ceil(questions.length * 0.65);
  counts.forEach((n, i) => {
    assert.ok(n <= ceiling && n > 0,
      `repair position ${i} holds ${n} of ${questions.length}`);
  });
});

test("balancing moved indices, not strings: every option still means what it did", () => {
  const stages = loadStages();
  for (const q of allQuestions(stages)) {
    // The note at index i explains the option at index i. If a rebalance ever
    // moves one without the other, a wrong answer is explained as some other
    // wrong answer - which is worse than saying nothing.
    assert.equal(q.optionNotes.length, q.answer.options.length,
      `${q.id}: ${q.optionNotes.length} notes for ${q.answer.options.length} options`);
    assert.equal(new Set(q.answer.options).size, q.answer.options.length,
      `${q.id} repeats an option`);
    assert.ok(q.answer.options[q.answer.correctIndex],
      `${q.id} points at an option that is not there`);
  }
});

test("the Inn's three days do not put the answer first every time", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "moonview-inn-interactions.js", "n2-home-inn-stage.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const stage = context.N2HomeInnStage;

  // This file was missed when the episodes were balanced, because its
  // correctness is decided by option key rather than by index - nothing about
  // it looked positional. All fifteen items listed the answer first, so the
  // whole first stage could be cleared by always tapping the top option.
  const positions = [];
  for (const phase of ["practice", "challenge"]) {
    for (const item of stage.getPhaseItems(phase)) {
      const options = item.options || [];
      if (options.length < 2) continue;
      const at = options.findIndex((o) => o.key === item.correct);
      if (at >= 0) positions.push(at);
    }
  }
  assert.ok(positions.length >= 8, "there are enough option sets to judge: " + positions.length);

  const first = positions.filter((p) => p === 0).length;
  assert.ok(first <= Math.ceil(positions.length * 0.5),
    `${first} of ${positions.length} answers sit first`);
  assert.ok(new Set(positions).size >= 2, "the answer appears in more than one position");
});

test("the same question always presents in the same order", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "moonview-inn-interactions.js", "n2-home-inn-stage.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const stage = context.N2HomeInnStage;

  // A shuffle that re-ran on every render would move an answer under a
  // learner's finger between reading it and tapping it.
  const once = stage.getPhaseItems("practice").map((i) => i.options.map((o) => o.key).join(","));
  const twice = stage.getPhaseItems("practice").map((i) => i.options.map((o) => o.key).join(","));
  assert.deepEqual(twice, once, "the order is stable across renders");
});
