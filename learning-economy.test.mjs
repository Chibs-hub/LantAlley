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

test("the first Inn stage moves the understanding gauge, not just the wallet", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "moonview-inn-interactions.js", "n2-home-inn-stage.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const stage = context.N2HomeInnStage;
  const catalog = context.LanternCurriculumCatalog;

  // The three days paid money on every correct answer but credited no words,
  // so the gauge sat at 0% through the whole first stage while the wallet
  // filled up. Each focus word now names the catalog target it teaches.
  const words = [...new Set(
    [...stage.encounters, ...stage.practice, ...stage.challenge].map((p) => p.focusWord),
  )];
  assert.ok(words.length >= 5, "the stage teaches its five words");

  for (const word of words) {
    const id = stage.getTargetId(word);
    assert.ok(id, `${word} names no catalog target, so answering it credits nothing`);
    const item = catalog.getItem(id);
    assert.ok(item, `${word} points at ${id}, which is not in the catalog`);
    assert.equal(item.partition, "home-inn", `${word} credits a word from ${item.partition}`);
  }

  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // Answering correctly in the three days has to mark the word, exactly as
  // answering correctly in an episode does.
  assert.match(app, /stage\.getTargetId && stage\.getTargetId\(prompt\.focusWord\)/);
  assert.match(app, /if\(masteredId\) markMastered\(prompt\.stageKey, masteredId\)/);
});

test("the gauge counts distinct words understood, never attempts", () => {
  const economy = load();
  const material = ["v-soroeru", "v-torikaeru", "v-atatameru-food", "w-chousei"];

  // Answering the same word right four times is one word understood.
  const repeated = ["v-soroeru", "v-soroeru", "v-soroeru", "v-soroeru"];
  assert.equal(economy.masteryPercent(repeated, material), 25);

  // Four different words is the whole stage.
  assert.equal(economy.masteryPercent(material, material), 100);
  assert.equal(economy.masteryPercent([], material), 0);
});
