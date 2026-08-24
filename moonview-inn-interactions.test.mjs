import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadEngine() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  return context.MoonviewInnInteractions;
}

const CUSHIONS = [
  ["c1", { color: "red", size: "large", dir: "up" }],
  ["c2", { color: "red", size: "small", dir: "side" }],
  ["c3", { color: "blue", size: "small", dir: "up" }],
  ["c4", { color: "blue", size: "large", dir: "side" }],
];

function place(engine, state, item, group, attribute) {
  return engine.apply(state, { type: "place", item, group, items: CUSHIONS, attribute });
}

test("arrange groups by the attribute the sentence names, not by a fixed pairing", () => {
  const engine = loadEngine();
  let state = engine.create("arrange");
  for (const [item, group] of [["c1", "g1"], ["c2", "g1"], ["c3", "g2"]]) {
    ({ state } = place(engine, state, item, group, "color"));
  }
  assert.equal(engine.isComplete(state), false);
  const result = place(engine, state, "c4", "g2", "color");
  assert.equal(result.outcome, "success");
  assert.equal(engine.isComplete(result.state), true);
});

test("the same cushions regroup differently when the sentence names size", () => {
  const engine = loadEngine();
  let state = engine.create("arrange");
  // by size the correct partition is {c1,c4} / {c2,c3} - different from the colour partition
  for (const [item, group] of [["c1", "g1"], ["c4", "g1"], ["c2", "g2"]]) {
    ({ state } = place(engine, state, item, group, "size"));
  }
  const result = place(engine, state, "c3", "g2", "size");
  assert.equal(result.outcome, "success");

  // the colour-correct grouping is rejected when size was asked for
  let other = engine.create("arrange");
  ({ state: other } = place(engine, other, "c1", "g1", "size"));
  assert.equal(place(engine, other, "c2", "g1", "size").outcome, "wrong");
});

test("arrange rejects a mixed mat without losing prior progress", () => {
  const engine = loadEngine();
  let state = engine.create("arrange");
  ({ state } = place(engine, state, "c1", "g1", "color"));
  const result = place(engine, state, "c3", "g1", "color");
  assert.equal(result.outcome, "wrong");
  assert.equal(result.state.assign.c1, "g1");
  assert.equal(result.state.assign.c3, undefined);
});

test("replace acts only on the object the sentence named", () => {
  const engine = loadEngine();
  const initial = engine.create("replace");
  // the sentence asked for the towel, so the bulb must be refused
  assert.equal(engine.apply(initial, { type: "removeOld", item: "bulb", target: "towel" }).outcome, "wrong");
  const removed = engine.apply(initial, { type: "removeOld", item: "towel", target: "towel" });
  assert.equal(removed.outcome, "progress");
  assert.equal(engine.apply(removed.state, { type: "placeClean", item: "sheet", target: "towel" }).outcome, "wrong");
});

test("only bulb replacement changes the illustrated room lighting", () => {
  const engine = loadEngine();
  assert.equal(engine.getRoomLightState(engine.create("replace"), "bulb"), "dim");
  assert.equal(
    engine.getRoomLightState({ mechanic: "replace", removed: "bulb", installed: null, done: false }, "bulb"),
    "dim",
  );
  assert.equal(
    engine.getRoomLightState({ mechanic: "replace", removed: "bulb", installed: "bulb", done: true }, "bulb"),
    "bright",
  );
  assert.equal(engine.getRoomLightState(engine.create("replace"), "towel"), "normal");
  assert.equal(engine.getRoomLightState(engine.create("warm"), "tea"), "normal");
});

test("warm heats only the named item with its required appliance, in a single action", () => {
  const engine = loadEngine();
  const initial = engine.create("warm");
  assert.equal(engine.apply(initial, { type: "heat", item: "rice", target: "tea", appliance: "stove", targetAppliance: "stove" }).outcome, "wrong");
  assert.equal(engine.apply(initial, { type: "heat", item: "tea", target: "tea", appliance: "microwave", targetAppliance: "stove" }).outcome, "wrong");
  const heated = engine.apply(initial, { type: "heat", item: "tea", target: "tea", appliance: "stove", targetAppliance: "stove" });
  assert.equal(heated.outcome, "success");
  assert.equal(engine.isComplete(heated.state), true);
});

test("warm uses the microwave for rice and the stove for soup", () => {
  const engine = loadEngine();
  const rice = engine.apply(engine.create("warm"), { type: "heat", item: "rice", target: "rice", appliance: "microwave", targetAppliance: "microwave" });
  const soup = engine.apply(engine.create("warm"), { type: "heat", item: "soup", target: "soup", appliance: "stove", targetAppliance: "stove" });
  assert.equal(rice.outcome, "success");
  assert.equal(soup.outcome, "success");
  assert.equal(engine.apply(engine.create("warm"), { type: "heat", item: "rice", target: "rice", appliance: "stove", targetAppliance: "microwave" }).outcome, "wrong");
});

test("undertake is answered by the reply alone", () => {
  const engine = loadEngine();
  const initial = engine.create("undertake");
  // only words that take the job on count as 引き受ける
  assert.equal(engine.apply(initial, { type: "respond", key: "refuse" }).outcome, "wrong");
  assert.equal(engine.apply(initial, { type: "respond", key: "ask" }).outcome, "wrong");
  const accepted = engine.apply(initial, { type: "respond", key: "accept" });
  assert.equal(accepted.outcome, "success");
  assert.equal(engine.isComplete(accepted.state), true);
});

test("replace requires removing the old one before placing the new one", () => {
  const engine = loadEngine();
  const initial = engine.create("replace");
  assert.equal(engine.apply(initial, { type: "placeClean", item: "towel", target: "towel" }).outcome, "wrong");
  const removed = engine.apply(initial, { type: "removeOld", item: "towel", target: "towel" });
  const completed = engine.apply(removed.state, { type: "placeClean", item: "towel", target: "towel" });
  assert.equal(completed.outcome, "success");
});

test("warm needs no second step once the item reaches the correct appliance", () => {
  const engine = loadEngine();
  // placing the named dish is the whole answer - there is no hold-and-release stage
  const done = engine.apply(engine.create("warm"), { type: "heat", item: "tea", target: "tea", appliance: "stove", targetAppliance: "stove" });
  assert.equal(done.outcome, "success");
  assert.equal(engine.apply(engine.create("warm"), { type: "release", temperature: 60 }).outcome, "wrong");
});

test("coordinate requires separated arrivals inside business hours", () => {
  const engine = loadEngine();
  assert.equal(engine.apply(engine.create("coordinate"), { type: "setTimes", arrivalA: 15, arrivalB: 15 }).outcome, "wrong");
  assert.equal(engine.apply(engine.create("coordinate"), { type: "setTimes", arrivalA: 13, arrivalB: 17 }).outcome, "wrong");
  assert.equal(engine.apply(engine.create("coordinate"), { type: "setTimes", arrivalA: 15, arrivalB: 17 }).outcome, "success");
});

test("coordinate can validate a story-derived schedule instead of exposing a target band", () => {
  const engine = loadEngine();
  const initial = engine.create("coordinate");
  assert.equal(engine.apply(initial, { type: "setTimes", arrivalA: 12, arrivalB: 15, min: 9, max: 15, gap: 2, targetA: 13, targetB: 15 }).outcome, "wrong");
  assert.equal(engine.apply(initial, { type: "setTimes", arrivalA: 13, arrivalB: 15, min: 9, max: 15, gap: 2, targetA: 13, targetB: 15 }).outcome, "success");
});

test("undertake needs no follow-up object step", () => {
  const engine = loadEngine();
  // anything other than a reply is not a way to answer this one
  assert.equal(engine.apply(engine.create("undertake"), { type: "deliver", item: "bags" }).outcome, "wrong");
});

test("restore rejects malformed data and preserves valid state", () => {
  const engine = loadEngine();
  assert.equal(engine.restore({ mechanic: "warm", item: "tea" }).item, "tea");
  assert.equal(engine.restore({ mechanic: "unknown" }).mechanic, "arrange");
  assert.equal(engine.restore(null).mechanic, "arrange");
});
