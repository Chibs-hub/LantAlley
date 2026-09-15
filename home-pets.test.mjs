import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./home-pets.js", import.meta.url), "utf8"), context);
  return context.LanternHomePets;
}

test("the pet shop has two finished pets with unique ids and prices", () => {
  const pets = load().catalogue();
  assert.deepEqual(Array.from(pets, (pet) => pet.id), ["cat", "bird"]);
  assert.equal(new Set(pets.map((pet) => pet.id)).size, pets.length);
  for (const pet of pets) {
    assert.ok(pet.price > 0, `${pet.id} has a positive price`);
    assert.equal(existsSync(new URL("./" + pet.preview, import.meta.url)), true, pet.preview);
  }
});

test("owned pet ids are normalized without mutating the save", () => {
  const pets = load();
  const source = ["bird", "owl", "bird", "cat"];
  const owned = pets.normalizeOwned(source);
  assert.deepEqual(Array.from(owned), ["bird", "cat"]);
  assert.deepEqual(source, ["bird", "owl", "bird", "cat"]);
});

test("buying a pet charges once and leaves the input untouched", () => {
  const pets = load();
  const before = ["cat"];
  const price = pets.get("bird").price;
  const first = pets.buy(before, price + 75, "bird");
  assert.equal(first.ok, true);
  assert.equal(first.money, 75);
  assert.deepEqual(Array.from(first.ownedPets), ["cat", "bird"]);
  assert.deepEqual(before, ["cat"]);

  const second = pets.buy(first.ownedPets, first.money, "bird");
  assert.equal(second.ok, false);
  assert.equal(second.reason, "owned");
  assert.equal(second.money, 75);
  assert.deepEqual(Array.from(second.ownedPets), ["cat", "bird"]);
});

test("invalid and unaffordable purchases cannot change money or ownership", () => {
  const pets = load();
  const price = pets.get("cat").price;
  const poor = pets.buy([], price - 1, "cat");
  assert.equal(poor.ok, false);
  assert.equal(poor.reason, "poor");
  assert.equal(poor.money, price - 1);
  assert.deepEqual(Array.from(poor.ownedPets), []);

  const missing = pets.buy(["cat"], 9999, "owl");
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, "missing");
  assert.equal(missing.money, 9999);
  assert.deepEqual(Array.from(missing.ownedPets), ["cat"]);
});

test("earned pets are granted for free and only once", () => {
  const pets = load();
  const first = pets.grant([], "cat");
  assert.equal(first.ok, true);
  assert.deepEqual(Array.from(first.ownedPets), ["cat"]);

  const again = pets.grant(first.ownedPets, "cat");
  assert.equal(again.ok, false);
  assert.equal(again.reason, "owned");
  assert.deepEqual(Array.from(again.ownedPets), ["cat"]);
});
