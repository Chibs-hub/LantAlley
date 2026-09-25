import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {self:null};
  context.self = context;
  vm.createContext(context);
  for (const file of ["home-pet.js", "home-bird.js", "home-dog.js", "home-pet-layout.js"]) {
    vm.runInContext(readFileSync(new URL(file, import.meta.url), "utf8"), context);
  }
  return {layout:context.LanternHomePetLayout, APIs:{cat:context.LanternHomePet,
    bird:context.LanternHomeBird, shiba:context.LanternHomeDog}};
}

test("mixed pets get distinct non-overlapping supported places in both scenes", () => {
  const {layout, APIs} = load();
  const pets = ["cat", "bird", "shiba", "cat", "bird"].map((species, index) =>
    ({iid:`${species}-${index}`, species, seed:index + 1}));
  const result = layout.fitsBoth(pets, APIs, {yard:{blockers:[], options:{}},
    interior:{blockers:[], options:{}}});
  assert.equal(result.ok, true);
  for (const scene of ["yard", "interior"]) {
    const anchors = Object.values(result.assignments[scene].anchors);
    assert.equal(anchors.length, pets.length);
    assert.equal(new Set(anchors.map((a) => `${a.x},${a.y}`)).size, pets.length);
  }
});

test("an impossible collection reports capacity deterministically", () => {
  const {layout, APIs} = load();
  const pets = Array.from({length:30}, (_, index) =>
    ({iid:`shiba-${index}`, species:"shiba", seed:index}));
  const first = layout.assign("interior", pets, APIs, [], {});
  assert.equal(first.ok, false);
  assert.ok(pets.some((pet) => pet.iid === first.unassignedIid));
  assert.equal(layout.assign("interior", pets, APIs, [], {}).unassignedIid, first.unassignedIid);
});

test("two of every species fit without stacking", () => {
  const {layout, APIs} = load();
  const pets = ["cat", "shiba", "bird", "cat", "shiba", "bird"].map((species, index) =>
    ({iid:`${species}-${index}`, species, seed:index}));
  const result = layout.fitsBoth(pets, APIs, {yard:{blockers:[],options:{}},
    interior:{blockers:[],options:{}}});
  assert.equal(result.ok, true);
});

test("pet motion uses scene-relative compositor movement without changing layout size", () => {
  const {layout} = load();
  const atCenter = layout.transform(50, 80, 10);
  assert.match(atCenter, /translate3d\(50cqw,45cqw,0\)/);
  assert.match(atCenter, /scale\(1\.333/);
  assert.doesNotMatch(atCenter, /left:|top:|width:/);
});
