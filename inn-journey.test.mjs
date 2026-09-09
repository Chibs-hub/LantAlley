import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load(){
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./inn-journey.js", import.meta.url), "utf8"), context);
  return context.LanternInnJourney;
}

test("a fresh Inn journey locks every reward and the cat", () => {
  const journey = load().fresh();
  assert.equal(journey.catUnlocked, false);
  assert.deepEqual(Object.keys(journey.claimed), []);
});

test("legacy Inn journeys keep the cat without inventing earned rewards", () => {
  const journey = load().normalize(null, true);
  assert.equal(journey.catUnlocked, true);
  assert.deepEqual(Object.keys(journey.claimed), []);
});

test("claiming an Inn reward is idempotent", () => {
  const api = load();
  const first = api.claim(api.fresh(), "inn-e02");
  const replay = api.claim(first.journey, "inn-e02");

  assert.equal(first.granted, true);
  assert.equal(first.reward.item, "scroll");
  assert.equal(replay.granted, false);
  assert.deepEqual(Object.keys(replay.journey.claimed), ["inn-e02"]);
});

test("the current Inn stop advances from training through the unfinished episode", () => {
  const api = load();
  assert.equal(api.current({mastered:false}, {}).id, "training");
  assert.equal(api.current({mastered:true}, {}).id, "inn-e01");
  assert.equal(api.current({mastered:true}, {"inn-e01":true}).id, "inn-e02");
});

test("the final episode is the only reward that unlocks the cat", () => {
  const api = load();
  const early = api.claim(api.fresh(), "inn-e03");
  const final = api.claim(early.journey, "inn-e04");

  assert.equal(early.journey.catUnlocked, false);
  assert.equal(final.journey.catUnlocked, true);
  assert.equal(api.isComplete({"inn-e01":true, "inn-e02":true, "inn-e03":true, "inn-e04":true}), true);
});

test("the journey and reward effects keep a reduced-motion fallback", () => {
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(css, /\.inn-journey-stops/);
  assert.match(css, /\.inn-reward/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[^{]*\{[^}]*\.inn-reward/);
});

test("a reward takes over the Inn layout instead of sharing the old question columns", () => {
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(css, /\.inn-stage \.game-layout:has\(\.inn-reward\)\{grid-template-columns:1fr/);
  assert.match(css, /\.game-layout:has\(\.inn-reward\) \.learning-context\{display:none/);
  assert.match(css, /\.game-layout:has\(\.inn-reward\) \.answer-workspace \.scene\{height:100%;display:flex;align-items:center;justify-content:center/);
});
