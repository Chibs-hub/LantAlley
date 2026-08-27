/* The rules of the daily 稽古.
 *
 * Worth testing in isolation because they are date arithmetic, and a streak
 * that only breaks at local midnight cannot be exercised through a browser in
 * any reasonable amount of time.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./daily-practice.js", import.meta.url), "utf8"), context);
  return context.LanternDailyPractice;
}

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h).getTime();

test("a day is the learner's local day, not UTC", () => {
  const p = load();
  // Late evening and early morning of the same local date are one day, which
  // is what a learner means by "today" even at 23:50.
  assert.equal(p.dayKey(at(2026, 8, 27, 23)), "2026-08-27");
  assert.equal(p.dayKey(at(2026, 8, 27, 0)), "2026-08-27");
  assert.equal(p.dayKey(at(2026, 8, 28, 0)), "2026-08-28");
});

test("the accuracy gate withholds the bonus without withholding the wage", () => {
  const p = load();

  // Tapping through pays for what was actually right, and nothing more.
  const sloppy = p.sessionEarnings(10, 20);
  assert.equal(sloppy.cards, 10);
  assert.equal(sloppy.gate, 0, "no bonus below 80%");
  assert.equal(sloppy.total, 10);

  // Exactly on the gate earns it.
  const gated = p.sessionEarnings(16, 20);
  assert.equal(gated.gate, 10);
  assert.equal(gated.total, 26);

  // A perfect session earns both bonuses.
  const perfect = p.sessionEarnings(20, 20);
  assert.equal(perfect.perfect, 5);
  assert.equal(perfect.total, 35);

  // A bad day is never worth nothing - that would punish learning.
  assert.ok(p.sessionEarnings(1, 20).total > 0);
});

test("the daily cap limits the day, not the session", () => {
  const p = load();
  const now = at(2026, 8, 27);

  const first = p.grant(null, 35, now);
  assert.equal(first.granted, 35);
  assert.equal(first.cappedOut, false);

  // A second session the same day gets only what is left of the cap.
  const second = p.grant(first.wallet, 35, now);
  assert.equal(second.granted, p.DAILY_CAP - 35);
  assert.equal(second.cappedOut, true);

  // And a third gets nothing.
  assert.equal(p.grant(second.wallet, 35, now).granted, 0);

  // Tomorrow the cap resets.
  assert.equal(p.grant(second.wallet, 35, at(2026, 8, 28)).granted, 35);
});

test("a streak counts days finished, and only once per day", () => {
  const p = load();
  const first = p.advanceStreak(null, at(2026, 8, 27));
  assert.equal(first.streak, 1);
  assert.equal(first.counted, true);

  // A second session the same day does not count twice.
  const again = p.advanceStreak(first, at(2026, 8, 27, 20));
  assert.equal(again.streak, 1);
  assert.equal(again.counted, false);

  const next = p.advanceStreak(first, at(2026, 8, 28));
  assert.equal(next.streak, 2);
});

test("a missed day breaks the streak, unless a freeze covers it", () => {
  const p = load();
  const monday = p.advanceStreak(null, at(2026, 8, 24));
  assert.equal(monday.streak, 1);

  // Skipping Tuesday with no freeze starts again from one.
  const broken = p.advanceStreak(monday, at(2026, 8, 26));
  assert.equal(broken.streak, 1);
  assert.equal(broken.frozen, false);

  // With a freeze held, the streak survives and the freeze is spent.
  const withFreeze = p.advanceStreak({ ...monday, freezes: 2 }, at(2026, 8, 26));
  assert.equal(withFreeze.streak, 2);
  assert.equal(withFreeze.frozen, true, "the learner has to be told it fired");
  assert.equal(withFreeze.freezes, 1);
});

test("one freeze covers a whole gap, not one day of it", () => {
  const p = load();
  const start = { streak: 5, freezes: 1, lastActiveDate: "2026-08-20" };
  // A week away. Holding one freeze should not be silently drained by seven.
  const back = p.advanceStreak(start, at(2026, 8, 27));
  assert.equal(back.freezes, 0, "exactly one freeze is spent");
  assert.equal(back.streak, 6);
  assert.equal(back.frozen, true);
});

test("every seventh day pays a milestone", () => {
  const p = load();
  let state = null;
  const bonuses = [];
  for (let day = 1; day <= 14; day += 1) {
    state = p.advanceStreak(state, at(2026, 9, day));
    if (state.milestone) bonuses.push({ day, streak: state.streak, bonus: state.milestone });
  }
  assert.equal(bonuses.length, 2, "two milestones in fourteen unbroken days");
  assert.deepEqual(bonuses.map((b) => b.streak), [7, 14]);
});
