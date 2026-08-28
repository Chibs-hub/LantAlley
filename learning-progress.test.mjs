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

test("empty progress includes independent home and garden reward defaults", () => {
  const progress = load();
  const first = progress.emptyProgress();
  const second = progress.emptyProgress();
  assert.equal(first.houseTier, "starter");
  assert.equal(first.homeTutorialComplete, false);
  assert.equal(first.starterSeedClaimed, false);
  assert.equal(first.starterCushionClaimed, false);
  assert.equal(first.activeWallpaper, "wallpaper-plain");
  assert.deepEqual(JSON.parse(JSON.stringify(first.garden)), {
    plants: [], usedCreditIds: [], starterClaimed: false, nextInstanceId: 1,
  });

  first.garden.plants.push({ id: "plant-1" });
  assert.deepEqual([...second.garden.plants], []);
});

test("legacy reward progress preserves money and home while adding starter state", () => {
  const migrated = load().migrateProgress({
    version: 3,
    money: 90,
    home: { owned: ["rug-plain"], placed: { "floor-left": "rug-plain" } },
  });
  assert.equal(migrated.money, 90);
  assert.deepEqual([...migrated.home.owned], ["rug-plain"]);
  assert.equal(migrated.home.placed["floor-left"], "rug-plain");
  assert.equal(migrated.houseTier, "starter");
  assert.deepEqual([...migrated.garden.plants], []);
});

test("reward migration deep clones state and recognizes existing starter items", () => {
  const stored = {
    version: 3,
    stages: {},
    home: { owned: ["floor-cushion-red"], placed: {} },
    garden: {
      plants: [{
        id: "plant-4", typeId: "camellia", slotId: "garden-left",
        growthPoints: 2, stage: "growing", pendingAnimation: true,
      }],
      usedCreditIds: ["inn-e01"], starterClaimed: false, nextInstanceId: 5,
    },
  };
  const migrated = load().migrateProgress(stored);
  assert.equal(migrated.starterSeedClaimed, true);
  assert.equal(migrated.starterCushionClaimed, true);
  assert.equal(migrated.garden.starterClaimed, true);
  assert.equal(migrated.garden.plants[0].growthPoints, 2);

  stored.home.owned.push("fan");
  stored.garden.plants[0].growthPoints = 99;
  stored.garden.usedCreditIds.push("later");
  assert.deepEqual([...migrated.home.owned], ["floor-cushion-red"]);
  assert.equal(migrated.garden.plants[0].growthPoints, 2);
  assert.deepEqual([...migrated.garden.usedCreditIds], ["inn-e01"]);
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

test("a saved record keeps its episode progress across a reload", () => {
  const progress = load();
  // saveProgress writes these three, and migrateProgress was dropping all of
  // them: finished shifts, places walked into, and a half-finished shift. The
  // effect was that reloading rewound the course to episode one and made the
  // resume feature dead code.
  const stored = {
    version: progress.VERSION,
    visited: ["entrance", "home-inn"],
    starred: [],
    stages: {},
    items: {},
    mistakes: [],
    repairQueue: [],
    money: 120,
    paidAnswers: ["inn-e01-q01"],
    masteredByStage: { "home-inn": ["v-soroeru", "v-torikaeru"] },
    episodesDone: ["inn-e01", "inn-e02", "inn-e03"],
    stageStarted: ["home-inn", "market"],
    episode: { locationKey: "home-inn", episodeId: "inn-e04", index: 6, missed: ["inn-e04-q02"] },
  };

  const out = progress.migrateProgress(stored);
  assert.deepEqual(Array.from(out.episodesDone), ["inn-e01", "inn-e02", "inn-e03"]);
  assert.deepEqual(Array.from(out.stageStarted), ["home-inn", "market"]);
  assert.ok(out.episode, "the half-finished shift survives");
  assert.equal(out.episode.episodeId, "inn-e04");
  assert.equal(out.episode.index, 6);
  assert.deepEqual(Array.from(out.episode.missed), ["inn-e04-q02"]);

  // And the record it produces is itself round-trippable.
  const again = progress.migrateProgress(out);
  assert.deepEqual(Array.from(again.episodesDone), Array.from(out.episodesDone));
  assert.equal(again.episode.episodeId, "inn-e04");
});

test("an empty record starts with no episode progress rather than undefined", () => {
  const progress = load();
  const fresh = progress.migrateProgress(null);
  assert.deepEqual(Array.from(fresh.episodesDone), []);
  assert.deepEqual(Array.from(fresh.stageStarted), []);
  assert.equal(fresh.episode, null);
});

test("the daily practice layer survives a reload too", () => {
  const progress = load();
  // Written into saveProgress and into migrateProgress in the same change,
  // which is the discipline this file learned the hard way.
  const stored = {
    version: progress.VERSION,
    visited: [], starred: [], stages: {}, items: {}, mistakes: [], repairQueue: [],
    money: 300, paidAnswers: [], masteredByStage: {},
    episodesDone: [], stageStarted: [], episode: null,
    reviewProgress: { "w-souji": { step: 2, due: 1756000000000, delayedSuccesses: 1 } },
    dailyPractice: { date: "2026-08-27", coins: 26 },
    streak: 9,
    freezes: 2,
    lastActiveDate: "2026-08-27",
  };

  const out = progress.migrateProgress(stored);
  assert.equal(out.reviewProgress["w-souji"].step, 2, "the spacing schedule survives");
  assert.equal(out.reviewProgress["w-souji"].due, 1756000000000);
  assert.equal(out.dailyPractice.coins, 26, "today's earnings survive, so the cap holds");
  assert.equal(out.streak, 9);
  assert.equal(out.freezes, 2);
  assert.equal(out.lastActiveDate, "2026-08-27");

  const again = progress.migrateProgress(out);
  assert.equal(again.streak, 9, "and it round-trips");
  assert.equal(again.reviewProgress["w-souji"].step, 2);
});

test("a fresh record starts with an empty schedule, not undefined", () => {
  const progress = load();
  const fresh = progress.migrateProgress(null);
  assert.deepEqual(Object.keys(fresh.reviewProgress), []);
  assert.equal(fresh.dailyPractice, null);
  assert.equal(fresh.streak, 0);
  assert.equal(fresh.freezes, 0);
  assert.equal(fresh.lastActiveDate, null);
});
