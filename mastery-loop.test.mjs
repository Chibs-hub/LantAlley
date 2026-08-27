/* Reaching 100% has to be possible, and has to mean something.
 *
 * The gauge gates the next place, so a learner who ends a place's four
 * episodes on 80% needs a way to finish. Before the finishing round the only
 * route was replaying whole shifts, most of whose questions asked about words
 * already known.
 *
 * These drive the round to completion against a real DOM rather than reading
 * the source, because the thing being claimed - "you can get to 100%" - is a
 * claim about play, not about code.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

import { FakeClock, FakeDocument, FakeEvent, FakeStorage, parseInto } from "./dom-harness.mjs";

const read = (name) => readFileSync(new URL("./" + name, import.meta.url), "utf8");
const tick = () => new Promise((resolve) => setImmediate(resolve));

function boot(seed) {
  const html = read("index.html");
  const body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
  const doc = new FakeDocument();
  parseInto(doc, doc.body, body.slice(body.indexOf(">") + 1));

  const clock = new FakeClock();
  const storage = new FakeStorage();
  if (seed) storage.setItem("lanternAlley.v3", JSON.stringify(seed));
  const errors = [];

  const context = {
    document: doc,
    localStorage: storage,
    console: { log() {}, warn() {}, error(...a) { errors.push(a.join(" ")); } },
    setTimeout: (fn, ms) => clock.setTimeout(fn, ms),
    clearTimeout: (id) => clock.clear(id),
    setInterval: (fn, ms) => clock.setInterval(fn, ms),
    clearInterval: (id) => clock.clear(id),
    requestAnimationFrame: (fn) => clock.setTimeout(() => fn(clock.now), 16),
    cancelAnimationFrame: (id) => clock.clear(id),
    Audio: class { play() { return Promise.reject(new Error("no audio")); } pause() {} addEventListener() {} },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    scrollTo() {},
    addEventListener() {},
    removeEventListener() {},
    navigator: { language: "ja" },
    location: { href: "http://localhost/", search: "" },
    fetch: () => Promise.reject(new Error("no network")),
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);

  for (const src of [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1])) {
    vm.runInContext(read(src), context, { filename: src });
  }
  doc.dispatchEvent(new FakeEvent("DOMContentLoaded", { bubbles: false }));
  clock.advance(50);

  const $ = (id) => doc.getElementById(id);
  return { doc, clock, storage, errors, context, $ };
}

// The game opens on the title card. A save that has already been through the
// Entrance goes straight to the map from there.
function openMap(game){
  game.$("btn-start").click();
  game.clock.advance(1500);
  return game.doc.querySelectorAll(".map-destination");
}

// Every Inn episode finished, but only a few of its forty words proven.
function seedFinishedButUnlearned(context, provenCount) {
  const stage = context.LanternEpisodeStages["home-inn"];
  const targets = stage.episodes
    .flatMap((e) => e.days.flatMap((d) => d.questions))
    .map((q) => q.target);
  return {
    version: 3,
    visited: ["entrance"],
    starred: [],
    stages: {},
    episode: null,
    episodesDone: stage.episodes.map((e) => e.id),
    stageStarted: ["home-inn"],
    items: {},
    mistakes: [],
    repairQueue: [],
    money: 0,
    paidAnswers: [],
    masteredByStage: { "home-inn": targets.slice(0, provenCount) },
    characterSelected: true,
    playerCharacter: "man",
  };
}

function stageTargets(context) {
  return context.LanternEpisodeStages["home-inn"].episodes
    .flatMap((e) => e.days.flatMap((d) => d.questions));
}

test("finishing every shift without learning every word does not reach 100%", () => {
  const probe = boot();
  const seed = seedFinishedButUnlearned(probe.context, 30);
  const game = boot(seed);

  const inn = openMap(game).find((b) => b.textContent.includes("月見宿"));
  assert.ok(inn, "the Inn is on the map");
  inn.click();
  game.clock.advance(2000);

  // 30 of 40 proven is 75%, so the place is not finished and the finishing
  // round is what opens rather than another replay of a shift.
  assert.match(game.$("narration").textContent, /仕上げの稽古/);
  assert.ok(game.$("btn-mastery-begin"), "the finishing round offers a way in");
  assert.match(game.$("jp-line").textContent, /まだ覚えていない言葉が10語/);
});

test("the finishing round asks only what is unproven, and reaches 100%", async () => {
  const probe = boot();
  const seed = seedFinishedButUnlearned(probe.context, 30);
  const game = boot(seed);
  const questions = stageTargets(game.context);
  const answerFor = new Map(questions.map((q) => [q.prompt.jp, q.answer.correctIndex]));
  const targetFor = new Map(questions.map((q) => [q.prompt.jp, q.target]));

  openMap(game).find((b) => b.textContent.includes("月見宿")).click();
  game.clock.advance(2000);
  game.$("btn-mastery-begin").click();
  game.clock.advance(2000);

  const asked = new Set();
  let guard = 0;
  while (guard < 400) {
    guard += 1;
    await tick();
    game.clock.advance(1500);
    await tick();

    if (game.$("next-row").style.display !== "none") {
      game.$("btn-next").click();
      game.clock.advance(1500);
      continue;
    }
    const controls = game.doc.querySelectorAll(".question-control").filter((c) => !c.disabled);
    if (!controls.length) {
      const sceneButton = game.$("scene").querySelectorAll("button").filter((b) => !b.disabled)[0];
      if (sceneButton) { sceneButton.click(); game.clock.advance(1500); continue; }
      break;
    }
    const prompt = game.doc.querySelectorAll(".reading-document")[0]
      ? [...answerFor.keys()].find((jp) => jp.includes(game.doc.querySelectorAll(".reading-document-heading")[0].textContent))
      : game.$("jp-line").textContent;
    const key = answerFor.has(prompt) ? prompt : [...answerFor.keys()].find((jp) => jp.startsWith(prompt.slice(0, 12)));
    if (key === undefined) break;
    asked.add(targetFor.get(key));
    controls[answerFor.get(key)].click();
    game.clock.advance(2000);
  }

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  const proven = saved.masteredByStage["home-inn"];
  assert.equal(new Set(proven).size, 40, "every one of the Inn's forty words is proven");

  // And it only ever asked the ten that were unproven.
  assert.ok(asked.size <= 10, "the round asked " + asked.size + " words, not the whole place");
  assert.deepEqual(game.errors, [], "nothing threw during the finishing round");
});

test("a place at 100% opens the next one; below 100% it stays shut", () => {
  const probe = boot();
  const economy = probe.context.LanternLearningEconomy;
  const order = ["entrance", "home-inn", "market", "tea-house", "station", "shrine"];

  assert.equal(economy.isUnlocked("market", order, { entrance: 100, "home-inn": 99 }), false);
  assert.equal(economy.isUnlocked("market", order, { entrance: 100, "home-inn": 100 }), true);
  // The gauge is the only gate: finishing the shifts is not enough on its own.
  assert.equal(economy.isUnlocked("tea-house", order, { market: 75 }), false);
});
