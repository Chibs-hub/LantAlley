import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(new URL("./home-pet.js", import.meta.url), "utf8"), context);
  return context.LanternHomePet;
}

test("yard and interior expose bounded contextual anchors", () => {
  const pet = load();
  for (const scene of ["yard", "interior"]) {
    const anchors = pet.anchors(scene);
    assert.ok(anchors.length >= 5);
    assert.ok(anchors.some((anchor) => anchor.kind === "door"));
    for (const anchor of anchors) {
      assert.ok(anchor.x >= 0 && anchor.x <= 100);
      assert.ok(anchor.y >= 0 && anchor.y <= 100);
      assert.ok(anchor.behaviors.length >= 1);
    }
  }
});

test("the same seed creates the same safe initial pet", () => {
  const pet = load();
  assert.deepEqual(pet.create("yard", 42), pet.create("yard", 42));
  assert.equal(pet.create("shop", 42), null);
});

test("walking advances smoothly without mutating the previous state", () => {
  const pet = load();
  const start = pet.create("yard", 7);
  const walking = pet.sendTo(start, "yard-rock");
  const next = pet.step(walking, 100, {});
  assert.notDeepEqual(next, walking);
  assert.equal(walking.x, start.x);
  assert.ok(next.x !== walking.x || next.y !== walking.y);
  assert.equal(next.behavior, "walk");
  assert.ok(next.frame >= 0 && next.frame < 8);
});

test("scene changes can occur only through the authored door", () => {
  const pet = load();
  const start = pet.create("yard", 9);
  const refused = pet.sendTo(start, "interior-center");
  assert.equal(refused.scene, "yard");
  const atDoor = pet.sendTo(start, "yard-door");
  const arrived = pet.step(atDoor, 20000, {});
  const crossing = pet.crossDoor(arrived);
  assert.equal(crossing.scene, "interior");
  assert.equal(crossing.anchorId, "interior-door");
});

test("scene entry uses the door and rest periods are game-scaled", () => {
  const pet = load();
  const entering = pet.enterScene("interior", 12);
  assert.equal(entering.anchorId, "interior-door");
  assert.equal(entering.behavior, "enter");
  assert.ok(pet.dwellMs({...entering, behavior:"curl-sleep"}) >= 18000);
  assert.ok(pet.dwellMs({...entering, behavior:"groom"}) >= 8000);
  assert.ok(pet.dwellMs({...entering, behavior:"look"}) >= 5000);
});

test("pause and reduced motion prevent continuous movement", () => {
  const pet = load();
  const moving = pet.sendTo(pet.create("yard", 3), "yard-rock");
  assert.deepEqual(pet.step(moving, 500, {paused:true}), moving);
  const reduced = pet.step(moving, 500, {reducedMotion:true});
  assert.equal(reduced.x, moving.x);
  assert.equal(reduced.y, moving.y);
  assert.equal(reduced.frame, 0);
  assert.notEqual(reduced.behavior, "walk");
});

test("sprite metadata names a sheet and a bounded frame grid", () => {
  const pet = load();
  for (const behavior of pet.behaviors()) {
    const sprite = pet.spriteFor({behavior, frame:99});
    assert.match(sprite.path, /^assets\/home\/pet\/calico-.+-v1\.webp$/);
    assert.ok(sprite.columns >= 1 && sprite.rows >= 1);
    assert.ok(sprite.frame >= 0 && sprite.frame < sprite.columns * sprite.rows);
    assert.ok(fs.existsSync(new URL(sprite.path, import.meta.url)), sprite.path);
  }
});
