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
