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

test("the correction round always ends, even for a card that keeps going wrong", () => {
  const engine = load();
  // A missed card goes to the back of the queue. With no cap that is a trap:
  // a learner who cannot get one item right never leaves the round.
  let queue = ["a", "b"];
  let attempts = 0;
  let guard = 0;
  let exhausted = false;
  while (queue.length && guard < 50) {
    guard += 1;
    const id = queue[0];
    if (id === "b") {
      const ok = engine.answerRepair(queue, id, "correct");
      queue = ok.queue;
      continue;
    }
    const result = engine.answerRepair(queue, id, "incorrect", null, attempts);
    attempts += 1;
    queue = result.queue;
    if (result.exhausted) exhausted = true;
  }
  assert.equal(queue.length, 0, "the queue emptied");
  assert.ok(exhausted, "the stubborn card was let go rather than asked forever");
  assert.ok(guard < 10, "it ended quickly, in " + guard + " turns");
});

test("a card answered right first time is never held back", () => {
  const engine = load();
  const result = engine.answerRepair(["a", "b"], "a", "correct", null, 0);
  assert.equal(result.queue.join(","), "b");
  assert.equal(result.exhausted, false);
});

/* The ceiling is session size times the longest interval, because an item that
 * comes back every N days occupies 1/N of a session slot for ever and nothing
 * retires. At [1,3,7,14] that is 20 x 14 = 280 words, against a catalogue of
 * 3,579 - so a learner stops meeting new words about a month in. This test
 * pins the ceiling so a change to INTERVALS or SESSION_SIZE cannot quietly
 * lower it again. */
function reachableWords(review, size, days, poolSize) {
  let progress = {};
  let now = T0;
  let introduced = 0;
  for (let d = 0; d < days; d++) {
    const due = review.getDueItems(progress, now).slice(0, size);
    const session = [...due];
    while (session.length < size && introduced < poolSize) {
      session.push("item-" + introduced++);
    }
    for (const id of session) {
      progress = review.recordOutcome(progress, { id, correct: true, now });
    }
    now += DAY;
  }
  return Object.keys(progress).length;
}

test("the schedule lets a daily learner reach far more than one session's worth of words", () => {
  const review = load();
  assert.deepEqual([...review.INTERVALS], [1, 3, 7, 14, 30, 90],
    "the ladder needs rungs past a fortnight or reviews eat the whole session");
  assert.ok(reachableWords(review, 20, 365, 3579) > 900,
    "a year of perfect daily practice should reach past 900 words, not stall near 280");
});

test("the correction list holds every word whose last answer was wrong", () => {
  const engine = load();
  const day = 86400000;
  const monday = Date.UTC(2026, 0, 5, 9);

  let progress = {};
  // Missed on Monday, and again a week later, with a correct one in between
  // on a different word.
  progress = engine.recordOutcome(progress, {id: "w-a", correct: false, now: monday});
  progress = engine.recordOutcome(progress, {id: "w-b", correct: true, now: monday});
  progress = engine.recordOutcome(progress, {id: "w-c", correct: false, now: monday + 7 * day});

  assert.deepEqual([...engine.getCorrectionList(progress)], ["w-a", "w-c"],
    "only the misses, oldest miss first");

  /* One correct answer is what clears it, which is the whole contract with the
   * list: it has to be emptiable. The word still comes back - recordOutcome
   * schedules it - but it is no longer something the learner owes. */
  progress = engine.recordOutcome(progress, {id: "w-a", correct: true, now: monday + 8 * day});
  assert.deepEqual([...engine.getCorrectionList(progress)], ["w-c"]);

  // And a word that was never missed never appears, however often it is asked.
  progress = engine.recordOutcome(progress, {id: "w-b", correct: true, now: monday + 9 * day});
  assert.equal(engine.getCorrectionList(progress).includes("w-b"), false);

  assert.deepEqual([...engine.getCorrectionList({})], []);
  assert.deepEqual([...engine.getCorrectionList(null)], []);
});
