import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./review-engine.js", import.meta.url), "utf8"), context);
  return context.LanternReviewEngine;
}

const DAY = 86400000;
const T0 = Date.UTC(2026, 7, 25, 9, 0, 0);

test("correct repair leaves the queue while wrong moves to the end", () => {
  const review = load();
  let queue = review.createRepairQueue(["q1", "q2", "q3"]);
  queue = review.answerRepair(queue, "q1", "incorrect").queue;
  assert.deepEqual([...queue], ["q2", "q3", "q1"]);
  queue = review.answerRepair(queue, "q2", "correct").queue;
  assert.deepEqual([...queue], ["q3", "q1"]);
});

test("a timeout returns the item without claiming a misconception", () => {
  const review = load();
  const queue = review.createRepairQueue(["q1", "q2"]);
  const result = review.answerRepair(queue, "q1", "timeout");
  assert.deepEqual([...result.queue], ["q2", "q1"]);
  // A timeout means the learner was too slow, not that they misunderstood.
  assert.equal(result.errorTag, null);
  assert.equal(result.unresolvedFluency, true);
});

test("answering an item that is not at the head is ignored", () => {
  const review = load();
  const queue = review.createRepairQueue(["q1", "q2"]);
  const result = review.answerRepair(queue, "q2", "correct");
  assert.deepEqual([...result.queue], ["q1", "q2"]);
});

test("the queue is immutable so a saved queue cannot be corrupted", () => {
  const review = load();
  const queue = review.createRepairQueue(["q1", "q2"]);
  review.answerRepair(queue, "q1", "correct");
  assert.deepEqual([...queue], ["q1", "q2"]);
});

test("delayed review returns items at expanding intervals", () => {
  const review = load();
  let progress = review.recordOutcome({}, { id: "v-x", correct: true, now: T0 });
  assert.equal(review.getDueItems(progress, T0 + 0.5 * DAY).length, 0);
  assert.deepEqual([...review.getDueItems(progress, T0 + 1 * DAY)], ["v-x"]);

  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 1 * DAY });
  assert.equal(review.getDueItems(progress, T0 + 2 * DAY).length, 0);
  assert.deepEqual([...review.getDueItems(progress, T0 + 4 * DAY)], ["v-x"]);
});

test("a wrong answer sends the item back to the first interval", () => {
  const review = load();
  let progress = review.recordOutcome({}, { id: "v-x", correct: true, now: T0 });
  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 1 * DAY });
  progress = review.recordOutcome(progress, { id: "v-x", correct: false, now: T0 + 4 * DAY, errorTag: "near-miss" });
  assert.equal(progress["v-x"].step, 0);
  assert.equal(progress["v-x"].errorTag, "near-miss");
  assert.deepEqual([...review.getDueItems(progress, T0 + 5 * DAY)], ["v-x"]);
});

test("mastery needs two delayed successes, one at least seven days out", () => {
  const review = load();
  let progress = review.recordOutcome({}, { id: "v-x", correct: true, now: T0 });
  assert.equal(review.isMastered(progress["v-x"]), false);

  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 1 * DAY });
  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 4 * DAY });
  // Two delayed successes, but neither is seven days after the first success.
  assert.equal(review.isMastered(progress["v-x"]), false);

  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 11 * DAY });
  assert.equal(review.isMastered(progress["v-x"]), true);
});

test("same-day repetition does not count as delayed retrieval", () => {
  const review = load();
  let progress = review.recordOutcome({}, { id: "v-x", correct: true, now: T0 });
  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 60000 });
  progress = review.recordOutcome(progress, { id: "v-x", correct: true, now: T0 + 120000 });
  assert.equal(progress["v-x"].delayedSuccesses, 0);
  assert.equal(review.isMastered(progress["v-x"]), false);
});

test("a late learner gets the oldest due item first", () => {
  const review = load();
  let progress = review.recordOutcome({}, { id: "old", correct: true, now: T0 });
  progress = review.recordOutcome(progress, { id: "new", correct: true, now: T0 + 2 * DAY });
  assert.deepEqual([...review.getDueItems(progress, T0 + 30 * DAY)], ["old", "new"]);
});
