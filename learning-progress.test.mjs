import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./learning-progress.js", import.meta.url), "utf8"), context);
  return context.LanternProgress;
}

test("no stored progress produces an empty v3 record", () => {
  const p = load().migrateProgress(null);
  assert.equal(p.version, 3);
  assert.equal(p.playerCharacter, null);
  assert.deepEqual(Object.keys(p.stages), []);
  assert.deepEqual([...p.mistakes], []);
});

test("the selected player character survives a v3 reload", () => {
  const saved = load().migrateProgress({
    version: 3, playerCharacter: "woman", characterSelected: true, visited: [], starred: [], stages: {},
  });
  assert.equal(saved.playerCharacter, "woman");
});

test("older saves without an explicit choice open the character chooser once", () => {
  const migrated = load().migrateProgress({
    visited: ["entrance"], starred: [], stageProgress: {},
  });
  assert.equal(migrated.playerCharacter, null);
});

test("v2 Inn completion survives migration", () => {
  const migrated = load().migrateProgress({
    visited: ["entrance", "home-inn"],
    starred: ["entrance"],
    stageProgress: { homeInn: { phase: "challenge", index: 2, medal: "silver", mastered: false } },
  });
  assert.equal(migrated.version, 3);
  assert.equal(migrated.stages["home-inn"].medal, "silver");
  assert.equal(migrated.stages["home-inn"].day, 3);
  assert.deepEqual([...migrated.visited], ["entrance", "home-inn"]);
});

test("each v2 phase maps to its story day", () => {
  const progress = load();
  const day = (phase) => progress.migrateProgress({ stageProgress: { homeInn: { phase } } }).stages["home-inn"].day;
  assert.equal(day("learn"), 1);
  assert.equal(day("practice"), 2);
  assert.equal(day("challenge"), 3);
  // Focused review happens at the end of day 3, not on a fourth day.
  assert.equal(day("review"), 3);
});

test("a declined stage survives migration and reload", () => {
  // Declining is a real branch, not a mistake. Losing the flag would drop the
  // welcome-back reply and greet a returning learner as if nothing happened.
  const migrated = load().migrateProgress({ stageProgress: { homeInn: { phase: "learn", declined: true } } });
  assert.equal(migrated.stages["home-inn"].declined, true);
});

test("a v3 record passes through migration unchanged", () => {
  const progress = load();
  const once = progress.migrateProgress({ stageProgress: { homeInn: { phase: "practice", medal: "bronze" } } });
  const twice = progress.migrateProgress(once);
  assert.deepEqual(JSON.parse(JSON.stringify(twice)), JSON.parse(JSON.stringify(once)));
});

test("migration never invents a medal the learner did not earn", () => {
  const migrated = load().migrateProgress({ stageProgress: { homeInn: { phase: "learn" } } });
  assert.equal(migrated.stages["home-inn"].medal, "none");
});

test("item states and the repair queue round-trip", () => {
  const progress = load();
  let p = progress.migrateProgress(null);
  p = progress.setItemState(p, "v-hikiukeru", "tested");
  p = progress.addMistake(p, { id: "inn-e01-d1-q01", target: "v-hikiukeru", sourceNote: "月見宿・第一話" });
  assert.equal(p.items["v-hikiukeru"], "tested");
  assert.equal(p.mistakes.length, 1);

  p = progress.clearMistake(p, "inn-e01-d1-q01");
  assert.equal(p.mistakes.length, 0);
});

test("a mistake is recorded once, not once per attempt", () => {
  const progress = load();
  let p = progress.migrateProgress(null);
  const miss = { id: "q1", target: "v-x", sourceNote: "n" };
  p = progress.addMistake(p, miss);
  p = progress.addMistake(p, miss);
  assert.equal(p.mistakes.length, 1);
});

test("progress updates never mutate the record they were given", () => {
  const progress = load();
  const base = progress.migrateProgress(null);
  progress.setItemState(base, "v-x", "seen");
  progress.addMistake(base, { id: "q", target: "v-x", sourceNote: "n" });
  assert.equal(Object.keys(base.items).length, 0);
  assert.equal(base.mistakes.length, 0);
});

test("the app stores v3 and reads v2 only to migrate it", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");

  // v2 had nowhere to put an episode, so a reload mid-shift threw the hour
  // away: previewState was memory-only and repairQueue was never persisted.
  assert.match(app, /var STORAGE_KEY_V3 = "lanternAlley\.v3";/);
  assert.match(app, /localStorage\.setItem\(STORAGE_KEY_V3/);
  assert.match(app, /LanternProgress\.migrateProgress\(JSON\.parse\(raw\)\)/);

  // Written once on boot rather than re-migrated on every load, and the v2
  // record is left alone so a rollback still finds the learner's progress.
  assert.match(app, /if\(migratedFromV2\) saveProgress\(\);/);
  assert.doesNotMatch(app, /localStorage\.removeItem\(STORAGE_KEY\)/);

  // The shift and its correction queue are saved and resumable.
  assert.match(app, /function rememberEpisode/);
  assert.match(app, /function resumeEpisode/);
  assert.match(app, /savedEpisode\.locationKey === loc\.key && resumeEpisode\(\)/);
  assert.match(app, /inRepair: !!previewState\.repair/);
});

test("the legacy view carries every fact the day flow needs", () => {
  const progress = load();
  // app.js translates v3 back into the shape the day controller reads, rather
  // than rewriting the controller. Nothing may be dropped in the round trip.
  const migrated = progress.migrateProgress({
    visited: ["entrance", "home-inn"],
    starred: ["entrance"],
    stageProgress: { homeInn: { phase: "challenge", index: 2, medal: "silver",
      challengeScore: 3, correctWords: ["揃える"], misses: ["温める"], declined: true } },
  });
  const inn = migrated.stages["home-inn"];
  assert.equal(inn.medal, "silver");
  assert.equal(inn.question, 2);
  assert.equal(inn.day, 3);
  assert.equal(inn.challengeScore, 3);
  assert.deepEqual([...inn.correctWords], ["揃える"]);
  assert.deepEqual([...inn.misses], ["温める"]);
  assert.equal(inn.declined, true);
});
