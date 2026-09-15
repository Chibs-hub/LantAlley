import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const url = new URL("./home-bird.js", import.meta.url);
  assert.ok(fs.existsSync(url), "home-bird.js must provide the bird companion");
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(url, "utf8"), context);
  return context.LanternHomeBird;
}

test("every resting anchor is registered to a visible scene surface", () => {
  const bird = load();
  const allowed = new Set(["beam", "fence", "roof", "rail", "sill", "stone", "tatami"]);
  for (const scene of ["yard", "interior"]) {
    const anchors = bird.anchors(scene);
    assert.ok(anchors.length >= 5, `${scene} needs enough real places to visit`);
    for (const anchor of anchors) {
      assert.ok(allowed.has(anchor.support), `${anchor.id} cannot leave the bird in open air`);
      assert.ok(anchor.x >= 0 && anchor.x <= 100);
      assert.ok(anchor.y >= 0 && anchor.y <= 100);
      assert.ok(anchor.behaviors.length >= 1);
    }
  }
});

test("ground pecking is offered only where the feet meet a ground surface", () => {
  const bird = load();
  const pecking = [...bird.anchors("yard"), ...bird.anchors("interior")]
    .filter((anchor) => anchor.behaviors.includes("peck"));
  assert.ok(pecking.length >= 2);
  for (const anchor of pecking) {
    assert.ok(["stone", "tatami"].includes(anchor.support), `${anchor.id} would peck in mid-air`);
  }
});

test("the same seed creates the same supported initial bird", () => {
  const bird = load();
  assert.deepEqual(bird.create("yard", 42), bird.create("yard", 42));
  assert.equal(bird.create("shop", 42), null);
  const initial = bird.create("interior", 9);
  const anchor = bird.anchors("interior").find((row) => row.id === initial.anchorId);
  assert.ok(anchor && anchor.support);
});

test("bird motion accepts contextual plant anchors and lands on them", () => {
  const bird = load();
  const extra = [{id:"plant-tree-1-canopy-bird", x:25, y:34, z:84,
    support:"tree", behaviors:["perch"]}];
  const start = bird.create("yard", 2, {extraAnchors:extra});
  const flying = bird.sendTo(start, extra[0].id, {extraAnchors:extra});
  const landed = bird.step(flying, 20000, {extraAnchors:extra});
  assert.equal(landed.anchorId, extra[0].id);
  assert.equal(landed.x, extra[0].x);
  assert.equal(landed.y, extra[0].y);
});

test("bird routing skips an occupied perch", () => {
  const bird = load();
  const extra = [{id:"plant-tree-1-canopy-bird", x:25, y:34, z:84,
    support:"tree", behaviors:["perch"]}];
  const start = bird.settleAt(bird.create("yard", 2, {extraAnchors:extra}), "yard-roof-left", {extraAnchors:extra});
  const next = bird.nextAnchor(start, [{x:74, y:26, rx:8, ry:5}], {extraAnchors:extra});
  assert.notEqual(next.id, "yard-eave-right");
});

test("bird scale remains realistic beside the existing cat in both scenes", () => {
  const bird = load();
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(new URL("./home-pet.js", import.meta.url), "utf8"), context);
  const cat = context.LanternHomePet;
  for (const [scene, y] of [["yard", 84], ["interior", 82]]) {
    const ratio = bird.widthAt(y, scene) / cat.widthAt(y, scene);
    assert.ok(ratio >= 0.28 && ratio <= 0.48,
      `${scene} bird-to-cat scale ratio ${ratio.toFixed(2)} is implausible`);
  }
  assert.ok(bird.widthAt(84, "interior") > bird.widthAt(84, "yard") * 2,
    "the smaller indoor room needs its own perspective scale");
});

test("travel follows a lifted flight path and lands exactly on its support", () => {
  const bird = load();
  const start = bird.create("yard", 2);
  const destination = bird.nextAnchor(start);
  const flying = bird.sendTo(start, destination.id);
  const airborne = bird.step(flying, 400, {});
  assert.equal(airborne.behavior, "fly");
  assert.ok(airborne.x !== start.x || airborne.y !== start.y);
  const straightY = start.y + (destination.y - start.y) * airborne.flightProgress;
  assert.ok(airborne.y < straightY, "the flight needs visible lift instead of sliding in a line");

  const landed = bird.step(airborne, 20000, {});
  assert.equal(landed.targetId, null);
  assert.equal(landed.anchorId, destination.id);
  assert.equal(landed.x, destination.x);
  assert.equal(landed.y, destination.y);
  assert.notEqual(landed.behavior, "fly");
});

test("reduced motion lands a flying bird instead of freezing it in the air", () => {
  const bird = load();
  const start = bird.create("interior", 5);
  const destination = bird.nextAnchor(start);
  const landed = bird.step(bird.sendTo(start, destination.id), 16, {reducedMotion:true});
  assert.equal(landed.targetId, null);
  assert.equal(landed.anchorId, destination.id);
  assert.equal(landed.x, destination.x);
  assert.equal(landed.y, destination.y);
  assert.notEqual(landed.behavior, "fly");
  assert.equal(landed.frame, 0);
});

test("all six natural actions use complete four-frame RGBA sprite sheets", () => {
  const bird = load();
  const behaviors = bird.behaviors();
  assert.deepEqual([...behaviors].sort(), ["fly", "peck", "perch", "preen", "sing", "sleep"]);
  for (const behavior of behaviors) {
    const sprite = bird.spriteFor({behavior, frame:99});
    assert.match(sprite.path, /^assets\/home\/pet\/uguisu-.+-v1\.png$/);
    assert.equal(sprite.columns, 4);
    assert.equal(sprite.rows, 1);
    assert.ok(sprite.frame >= 0 && sprite.frame < 4);
    const bytes = fs.readFileSync(new URL(sprite.path, import.meta.url));
    assert.equal(bytes.toString("ascii", 1, 4), "PNG");
    assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20) * 4,
      `${sprite.path} must be one four-cell row`);
    assert.equal(bytes[25], 6, `${sprite.path} must retain RGBA transparency`);
  }
});

test("every authored resting action is available on a supported anchor", () => {
  const bird = load();
  const used = new Set([...bird.anchors("yard"), ...bird.anchors("interior")]
    .flatMap((anchor) => anchor.behaviors));
  for (const behavior of ["peck", "perch", "preen", "sing", "sleep"]) {
    assert.ok(used.has(behavior), `${behavior} artwork needs a place in the home`);
  }
});

test("rest periods stay calm without making the bird appear stuck", () => {
  const bird = load();
  for (const behavior of ["peck", "perch", "preen", "sing", "sleep"]) {
    for (const seed of [1, 9999, 4294967295]) {
      const dwell = bird.dwellMs({behavior, seed});
      assert.ok(dwell >= 3500 && dwell <= 12000, `${behavior} dwell ${dwell}ms is out of range`);
    }
  }
});
