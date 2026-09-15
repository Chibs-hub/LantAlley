import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(new URL("./home-pet-spots.js", import.meta.url), "utf8"), context);
  return context.LanternHomePetSpots;
}

const tree = {
  id: "plant-tree-1", typeId: "cherry-tree", kind: "tree", stage: "mature",
  slotId: "garden-left-1", x: 25, y: 58, width: 31, base: 92.2, tilt: 0, mirror: 1,
};

test("mature trees give birds a canopy perch and a grounded base rest", () => {
  const spots = load().fromPlants([tree], "bird");
  assert.deepEqual(Array.from(spots, (spot) => spot.id), [
    "plant-tree-1-base-bird", "plant-tree-1-canopy-bird",
  ]);
  const base = spots.find((spot) => spot.id.endsWith("-base-bird"));
  const canopy = spots.find((spot) => spot.id.endsWith("-canopy-bird"));
  assert.equal(base.support, "ground");
  assert.equal(canopy.support, "tree");
  assert.ok(canopy.y < base.y, "the canopy perch must sit above the trunk base");
  assert.ok(canopy.z > tree.y + 20, "the bird must render in front of the tree canopy");
  for (const spot of spots) {
    assert.ok(spot.x >= 0 && spot.x <= 100, `${spot.id} x is in the scene`);
    assert.ok(spot.y >= 0 && spot.y <= 100, `${spot.id} y is in the scene`);
    assert.ok(spot.behaviors.length > 0);
  }
});

test("young trees expose a perch but seed and sprout stages stay grounded", () => {
  const spots = load().fromPlants([
    {...tree, id: "sapling", stage: "sapling"},
    {...tree, id: "sprout", stage: "sprout", x: 75},
  ], "bird");
  assert.ok(spots.some((spot) => spot.id === "sapling-canopy-bird"));
  assert.equal(spots.some((spot) => spot.id === "sprout-canopy-bird"), false);
  assert.ok(spots.some((spot) => spot.id === "sprout-base-bird"));
});

test("cats receive plant base rests while canopy spots remain bird-only", () => {
  const spots = load().fromPlants([
    tree,
    {id: "flower-1", typeId: "camellia", kind: "flower", stage: "mature", slotId: "garden-right-3",
      x: 75, y: 72, width: 15, base: 97.3, tilt: 0, mirror: 1},
  ], "cat");
  assert.deepEqual(Array.from(spots, (spot) => spot.id), [
    "plant-tree-1-base-cat", "flower-1-base-cat",
  ]);
  assert.ok(spots.every((spot) => spot.support === "ground"));
});

test("cats and birds use separate shoulders at a shared plant", () => {
  const module = load();
  const cat = module.fromPlants([tree], "cat").find((spot) => spot.id.endsWith("-base-cat"));
  const bird = module.fromPlants([tree], "bird").find((spot) => spot.id.endsWith("-base-bird"));
  assert.notEqual(cat.x, bird.x);
  assert.equal(cat.y, bird.y);
});

test("empty or unplanted items do not create pet spots", () => {
  const spots = load().fromPlants([
    null,
    {...tree, id: "stored", slotId: null},
    {...tree, id: "missing-size", width: 0},
  ], "bird");
  assert.deepEqual(Array.from(spots), []);
});
