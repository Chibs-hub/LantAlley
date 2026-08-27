import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./learning-economy.js", import.meta.url), "utf8"), context);
  return context.LanternLearningEconomy;
}

test("mastery is the share of distinct stage material answered correctly", () => {
  const economy = load();
  assert.equal(economy.masteryPercent(["a", "c"], ["a", "b", "c", "d"]), 50);
  assert.equal(economy.masteryPercent(["a", "a"], ["a", "b"]), 50);
});

test("money rewards accuracy once and cannot be farmed by replay", () => {
  const economy = load();
  const first = economy.award({money: 0, paid: []}, "q1", "challenge");
  assert.equal(first.money, 25);
  const replay = economy.award(first, "q1", "challenge");
  assert.equal(replay.money, 25);
  assert.equal(replay.earned, 0);
});

test("the next location unlocks only after the previous one reaches mastery", () => {
  const economy = load();
  const order = ["entrance", "home-inn", "market"];
  assert.equal(economy.isUnlocked("home-inn", order, {entrance: 100}), true);
  assert.equal(economy.isUnlocked("market", order, {entrance: 100, "home-inn": 99}), false);
  assert.equal(economy.isUnlocked("market", order, {entrance: 100, "home-inn": 100}), true);
});

test("being paid is felt, and only where money is actually earned", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");

  // The sound is synthesised, not sampled. The artifact sits just under its
  // ceiling, so a coin clip would cost real delivery budget for two notes.
  assert.match(app, /function playCoinSound/);
  assert.match(app, /AudioContext \|\| window\.webkitAudioContext/);
  assert.doesNotMatch(app, /coin\.(mp3|wav|ogg)/, "a sampled coin would cost artifact budget");

  // Muting the fox mutes the till.
  assert.match(app, /function playCoinSound\(\)\{\s*if\(!state\.voiceOn\) return;/);

  // Both effects hang off the one place money is granted, so a replay - which
  // pays nothing - makes no sound and shows no chip.
  assert.match(app, /if\(result\.earned\)\{\s*playCoinSound\(\);\s*showPayout\(result\.earned\);/);

  // Visibility must not depend on an animation: a global reduced-motion rule
  // kills animations with !important.
  assert.match(app, /function showPayout/);
  assert.match(app, /chip\.parentNode\.removeChild\(chip\)/);
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  const chipRule = /\.payout-chip\{[^}]*\}/.exec(css);
  assert.ok(chipRule, "the chip has a rule");
  assert.doesNotMatch(chipRule[0], /opacity:0/, "the chip must be visible without its animation");
});

test("a question pays once, so the payday effect cannot be farmed", () => {
  const economy = load();
  const first = economy.award({ money: 0, paid: [] }, "inn-e01-q01", "learn");
  assert.equal(first.earned, 10);
  const again = economy.award({ money: first.money, paid: first.paid }, "inn-e01-q01", "learn");
  assert.equal(again.earned, 0, "answering the same question again pays nothing");
  assert.equal(again.money, first.money, "and the wallet does not move");
});
