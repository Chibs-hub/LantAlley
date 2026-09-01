import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL("./home-garden.js", import.meta.url), "utf8"), context);
vm.runInContext(fs.readFileSync(new URL("./home-room.js", import.meta.url), "utf8"), context);
const garden = context.LanternHomeGarden;
const slots = context.LanternHomeRoom.scenes().yard.slots;

test("home backgrounds match all four automatic time periods", () => {
  const room = context.LanternHomeRoom;
  const expected = {
    yard: {
      morning:"assets/home/exterior/open-house-yard-morning-v1.webp",
      day:"assets/home/exterior/open-house-yard-day-v1.webp",
      evening:"assets/home/exterior/open-house-yard-v1.webp",
      night:"assets/home/exterior/open-house-yard-night-v1.webp"
    },
    interior: {
      morning:"assets/home/interior/starter-room-morning-v1.webp",
      day:"assets/home/interior/starter-room-day-v1.webp",
      evening:"assets/home/interior/starter-room-v1.webp",
      night:"assets/home/interior/starter-room-night-v1.webp"
    }
  };
  for(const area of Object.keys(expected)){
    for(const period of Object.keys(expected[area])){
      assert.equal(room.backgroundFor(area, period), expected[area][period]);
    }
  }
  assert.equal(room.backgroundFor("yard", "unknown"), expected.yard.evening);
});

function bought(typeId = "camellia", money = 1000){
  return garden.buy(garden.emptyGarden(), money, typeId);
}

test("catalogue excludes the unfinished pine placeholder and returns safe clones", () => {
  const first = garden.catalogue();
  assert.deepEqual(Array.from(first, item => item.id), [
    "cherry-tree", "japanese-maple", "hydrangea",
    "camellia", "iris", "chrysanthemum", "lantern-flower-bed", "sunflower"
  ]);
  assert.equal(first.length, 8);
  assert.ok(first.every(item => item.price > 0));
  first[0].price = 0;
  assert.notEqual(garden.catalogue()[0].price, 0);
});

test("buying creates unique instances and deducts each price", () => {
  const first = garden.buy(garden.emptyGarden(), 1000, "camellia");
  const second = garden.buy(first.garden, first.money, "camellia");
  assert.equal(first.ok, true);
  assert.notEqual(first.instanceId, second.instanceId);
  assert.equal(second.garden.plants.length, 2);
  assert.equal(second.money, 1000 - 120 - 120);
});

test("buy refuses unknown and unaffordable plants without changing state", () => {
  const state = garden.emptyGarden();
  assert.equal(garden.buy(state, 1000, "missing").reason, "unknown");
  const poor = garden.buy(state, 119, "camellia");
  assert.equal(poor.reason, "poor");
  assert.equal(poor.garden, state);
  assert.equal(poor.money, 119);
});

test("starter claim is free and cannot duplicate a starter camellia", () => {
  const first = garden.claimStarter(garden.emptyGarden());
  assert.equal(first.ok, true);
  assert.equal(first.garden.plants[0].typeId, "camellia");
  assert.equal(first.garden.starterClaimed, true);
  const replay = garden.claimStarter(first.garden);
  assert.equal(replay.ok, false);
  assert.equal(replay.reason, "claimed");
  assert.equal(replay.garden.plants.length, 1);

  const alreadyOwned = bought().garden;
  const migrated = garden.claimStarter(alreadyOwned);
  assert.equal(migrated.ok, false);
  assert.equal(migrated.reason, "owned");
  assert.equal(migrated.garden.starterClaimed, true);
  assert.equal(migrated.garden.plants.length, 1);
});

test("garden species use individual scene widths instead of one global size", () => {
  const widths = Object.fromEntries(garden.catalogue().map(item => [item.id, item.sceneWidth]));
  /* The numbers come from the yard's own doorway: it is 7.00% of the scene
   * wide at three different heights, a Japanese entrance is about 90cm, and
   * correcting to the front row by the slot scales gives 0.0946% per cm.
   * Each width below is that figure times what the plant actually is, so the
   * test states the plant's real size and lets the arithmetic check itself. */
  const PCT_PER_CM = 0.0946;
  const realSize = {
    "cherry-tree": 444, "japanese-maple": 381, hydrangea: 148, camellia: 190,
    iris: 85, chrysanthemum: 106, "lantern-flower-bed": 159, sunflower: 169,
  };
  for (const [id, cm] of Object.entries(realSize)) {
    const implied = widths[id] / PCT_PER_CM;
    assert.ok(Math.abs(implied - cm) < 12,
      `${id} is drawn at ${widths[id]}%, which is ${Math.round(implied)}cm, not ${cm}cm`);
  }

  // A mature cherry must out-top the house it stands beside. The eaves measure
  // 210cm against the same doorway, and a tree level with them is not mature.
  assert.ok(widths["cherry-tree"] / PCT_PER_CM > 210 * 1.7,
    "a full-grown cherry should stand well clear of the eaves");
  assert.ok(widths["cherry-tree"] > widths["japanese-maple"],
    "the cherry is the larger of the two trees");
  assert.ok(Math.min(...Object.values(widths)) >= 8, "no species is a speck");
});

test("normalization removes the retired automatic maple but keeps purchased maples", () => {
  const cleaned = garden.normalize({
    plants: [
      {id:"starter-maple", typeId:"japanese-maple", slotId:"garden-right-1", stage:"mature"},
      {id:"plant-2", typeId:"japanese-maple", slotId:null, stage:"planted"},
    ],
    usedCreditIds:[], starterClaimed:false, starterSceneryClaimed:true, nextInstanceId:3,
  });

  assert.deepEqual(Array.from(cleaned.plants, p => p.id), ["plant-2"]);
});

test("normalization removes pine placeholders from existing saves", () => {
  const legacy = {
    plants:[
      {id:"starter-pine", typeId:"pine-tree", slotId:"garden-left-1", stage:"mature"},
      {id:"plant-2", typeId:"camellia", slotId:null, stage:"planted"}
    ],
    usedCreditIds:[], starterClaimed:false, starterSceneryClaimed:true, nextInstanceId:3
  };
  const cleaned = garden.clearPlacement(legacy);
  assert.deepEqual(Array.from(cleaned.plants, p => p.typeId), ["camellia"]);
});

test("plant and move use valid empty garden slots without mutation", () => {
  const purchase = bought();
  const planted = garden.plant(purchase.garden, purchase.instanceId, slots[0].id, slots);
  const moved = garden.move(planted.garden, purchase.instanceId, slots[1].id, slots);
  assert.equal(planted.ok, true);
  assert.equal(planted.garden.plants[0].slotId, slots[0].id);
  assert.equal(moved.garden.plants[0].slotId, slots[1].id);
  assert.equal(planted.garden.plants[0].slotId, slots[0].id);
  assert.equal(purchase.garden.plants[0].slotId, null);
});

test("invalid and occupied placement fails safely", () => {
  const first = bought();
  const second = garden.buy(first.garden, first.money, "iris");
  const planted = garden.plant(second.garden, first.instanceId, slots[0].id, slots);
  assert.equal(garden.plant(planted.garden, second.instanceId, "missing", slots).reason, "noslot");
  const occupied = garden.plant(planted.garden, second.instanceId, slots[0].id, slots);
  assert.equal(occupied.reason, "occupied");
  assert.equal(occupied.garden, planted.garden);
  assert.equal(garden.plant(planted.garden, "missing", slots[1].id, slots).reason, "unknown");
  assert.equal(garden.move(second.garden, second.instanceId, slots[1].id, slots).reason, "stored");
});

test("store preserves ownership and growth while clearing placement", () => {
  const purchase = bought();
  const planted = garden.plant(purchase.garden, purchase.instanceId, slots[0].id, slots);
  const credited = garden.creditLesson(planted.garden, "home-inn:episode-1", 0);
  const stored = garden.store(credited.garden, purchase.instanceId);
  assert.equal(stored.ok, true);
  assert.equal(stored.garden.plants.length, 1);
  assert.equal(stored.garden.plants[0].slotId, null);
  assert.equal(stored.garden.plants[0].growthPoints, 1);
  assert.equal(credited.garden.plants[0].slotId, slots[0].id);
});

test("a demonstrated lesson grows only planted non-mature plants", () => {
  const first = bought("iris");
  const second = garden.buy(first.garden, first.money, "camellia");
  const planted = garden.plant(second.garden, first.instanceId, slots[0].id, slots);
  const once = garden.creditLesson(planted.garden, "home-inn:episode-1", 0);
  assert.equal(once.granted, 1);
  assert.equal(once.garden.plants[0].growthPoints, 1);
  assert.equal(once.garden.plants[0].stage, "sprout");
  assert.equal(once.garden.plants[0].pendingAnimation, true);
  assert.equal(once.garden.plants[1].growthPoints, 0, "stored plants must not grow");

  const replay = garden.creditLesson(once.garden, "home-inn:episode-1", 1);
  assert.equal(replay.granted, 0);
  assert.equal(replay.garden, once.garden);
  assert.equal(replay.garden.plants[0].growthPoints, 1);
});

test("first-time mastery bonus adds one point and maturity caps growth", () => {
  const purchase = bought("iris");
  let state = garden.plant(purchase.garden, purchase.instanceId, slots[0].id, slots).garden;
  const mastered = garden.creditLesson(state, "station:episode-1", 1);
  assert.equal(mastered.granted, 2);
  assert.equal(mastered.garden.plants[0].growthPoints, 2);
  assert.equal(mastered.garden.plants[0].stage, "mature");
  assert.equal(garden.lessonsRemaining(mastered.garden.plants[0]), 0);
  const later = garden.creditLesson(mastered.garden, "station:episode-2", 1);
  assert.equal(later.granted, 0);
  assert.equal(later.garden.plants[0].growthPoints, 2);
  assert.ok(later.garden.usedCreditIds.includes("station:episode-2"));
});

const stageCases = [
  {typeId:"camellia", want:["planted", "sprout", "growing", "growing", "mature"]},
  {typeId:"hydrangea", want:["planted", "sprout", "sprout", "sprout", "growing", "growing", "growing", "mature"]}
];

test("flower shrub and tree stages are monotonic at every growth point", () => {
  for(const sample of stageCases){
    const purchase = bought(sample.typeId);
    let state = garden.plant(purchase.garden, purchase.instanceId, slots[0].id, slots).garden;
    assert.equal(state.plants[0].stage, sample.want[0]);
    for(let points = 1; points < sample.want.length; points += 1){
      const beforeStage = sample.want[points - 1];
      const credited = garden.creditLesson(state, `${sample.typeId}:point-${points}`, 0);
      assert.equal(credited.garden.plants[0].growthPoints, points, `${sample.typeId} point ${points}`);
      assert.equal(credited.garden.plants[0].stage, sample.want[points], `${sample.typeId} point ${points}`);
      assert.equal(
        credited.garden.plants[0].pendingAnimation,
        sample.want[points] !== beforeStage,
        `${sample.typeId} animation at point ${points}`
      );
      state = garden.acknowledgeAnimations(credited.garden);
    }
  }
});

test("two-point bonuses derive the correct stage and animation at every boundary", () => {
  for(const sample of stageCases){
    for(let points = 0; points <= sample.want.length - 1; points += 1){
      const target = Math.min(sample.want.length - 1, points + 2);
      const state = {
        plants:[{
          id:"plant-1",
          typeId:sample.typeId,
          slotId:slots[0].id,
          growthPoints:points,
          stage:sample.want[points],
          pendingAnimation:false
        }],
        usedCreditIds:[],
        starterClaimed:false,
        nextInstanceId:2
      };
      const credited = garden.creditLesson(state, `${sample.typeId}:bonus-${points}`, 1);
      assert.equal(credited.garden.plants[0].growthPoints, target, `${sample.typeId} bonus from ${points}`);
      assert.equal(credited.garden.plants[0].stage, sample.want[target], `${sample.typeId} bonus stage from ${points}`);
      assert.equal(
        credited.garden.plants[0].pendingAnimation,
        sample.want[target] !== sample.want[points],
        `${sample.typeId} bonus animation from ${points}`
      );
    }
  }
});

test("lessonsRemaining reports points to maturity across approved ranges", () => {
  const items = garden.catalogue();
  const byKind = kind => items.filter(item => item.kind === kind).map(item => item.matureAt);
  assert.ok(byKind("flower").every(value => value >= 2 && value <= 4));
  assert.ok(byKind("shrub").every(value => value >= 5 && value <= 7));
  assert.ok(byKind("tree").every(value => value >= 8 && value <= 12));
  assert.equal(garden.lessonsRemaining({typeId:"camellia", growthPoints:1}), 3);
});

test("acknowledging animations clones state and clears every pending flag", () => {
  const purchase = bought();
  const planted = garden.plant(purchase.garden, purchase.instanceId, slots[0].id, slots);
  const grown = garden.creditLesson(planted.garden, "market:episode-1", 0).garden;
  const acknowledged = garden.acknowledgeAnimations(grown);
  assert.equal(acknowledged.plants[0].pendingAnimation, false);
  assert.equal(grown.plants[0].pendingAnimation, true);
  assert.notEqual(acknowledged, grown);
  assert.notEqual(acknowledged.plants[0], grown.plants[0]);
});

test("all successful operations preserve their input garden", () => {
  const original = garden.emptyGarden();
  const snapshot = JSON.stringify(original);
  const purchase = garden.buy(original, 1000, "camellia");
  garden.claimStarter(original);
  garden.plant(purchase.garden, purchase.instanceId, slots[0].id, slots);
  garden.store(purchase.garden, purchase.instanceId);
  garden.creditLesson(purchase.garden, "shrine:episode-1", 0);
  garden.acknowledgeAnimations(purchase.garden);
  assert.equal(JSON.stringify(original), snapshot);
});
