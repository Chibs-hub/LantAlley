import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function pets() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./home-pets.js", import.meta.url), "utf8"), context);
  return context.LanternHomePets;
}

test("pet stock is unlimited and each purchase creates another owned pet", () => {
  const shop = pets();
  const first = shop.buy([], 2500, "cat");
  const second = shop.buy(first.ownedPets, first.money, "cat");
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(second.ownedPets, ["cat", "cat"]);
  assert.equal(second.money, 100);
});

test("the Shiba Inu is a normal unlimited shop pet", () => {
  const shop = pets();
  const shiba = shop.get("shiba");
  assert.equal(shiba.name, "Shiba Inu");
  assert.equal(shop.buy([], shiba.price, "shiba").ownedPets[0], "shiba");
  const second = shop.buy(["shiba"], shiba.price, "shiba");
  assert.equal(second.ok, true);
  assert.deepEqual(second.ownedPets, ["shiba", "shiba"]);
});

test("legacy active duplicates never exceed owned copies", () => {
  const shop = pets();
  assert.deepEqual(Array.from(shop.normalizeActivePets(["cat", "cat", "bird"],
    ["cat-1", "cat-1", "cat-2", "bird-3", "shiba-4"])),
    ["cat-1", "cat-2", "bird-3"]);
});

test("activation at capacity leaves active pets unchanged", () => {
  const shop = pets();
  const original = ["cat-1"];
  const result = shop.tryActivate(["cat", "bird"], original, "bird-2", () => false);
  assert.equal(result.ok, false);
  assert.deepEqual(Array.from(result.activePets), original);
  assert.notEqual(result.activePets, original);
});
