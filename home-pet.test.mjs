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

test("cat scale follows scene depth without overpowering the architecture", () => {
  const pet = load();
  /* The cat is measured in each scene, because the two are not the same size.
   *
   * The room's ruler is its tatami: seams every 88cm put the front row at
   * 22.4% of the scene, so 0.2541% per cm. The yard's is its doorway: 7.00%
   * wide for about 90cm, corrected to the front row at 0.0946% per cm. The
   * sprite fills 86% of its square cell, so a 46cm cat wants a 53cm element.
   *
   * One band used to serve both and was wrong in each - a 95cm cat outdoors
   * and a 35cm one indoors. */
  const PCT_PER_CM = {interior: 0.2541, yard: 0.0946};
  const ELEMENT_CM = 53;

  for (const scene of ["interior", "yard"]) {
    const anchors = pet.anchors(scene);
    const nearest = Math.max(...anchors.map((a) => a.y));
    const implied = pet.widthAt(nearest, scene) / PCT_PER_CM[scene];
    assert.ok(Math.abs(implied - ELEMENT_CM) < 14,
      `in the ${scene} the nearest cat is ${Math.round(implied)}cm, not about ${ELEMENT_CM}cm`);

    const far = pet.widthAt(Math.min(...anchors.map((a) => a.y)), scene);
    assert.ok(pet.widthAt(nearest, scene) > far,
      `the foreground cat must be larger than the background one in the ${scene}`);
  }

  // The same depth in the two scenes must not give the same width: the room is
  // a small space and the yard a large one, and that is the whole point.
  assert.notEqual(pet.widthAt(80, "interior"), pet.widthAt(80, "yard"),
    "the cat is being sized without regard to which scene it is standing in");
  assert.ok(pet.widthAt(88, "interior") > pet.widthAt(88, "yard") * 2,
    "a cat indoors fills far more of the picture than the same cat outdoors");
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

test("a walking pose always produces visible travel near its destination", () => {
  const pet = load();
  const target = pet.anchors("yard").find((anchor) => anchor.id === "yard-rock");
  const state = pet.sendTo({...pet.create("yard", 7), x:target.x + 2, y:target.y}, target.id);
  const next = pet.step(state, 80, {});
  const moved = Math.hypot(next.x - state.x, next.y - state.y);
  assert.ok(moved >= 0.24, `walking frame moved only ${moved.toFixed(3)}% of the scene`);
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
  // Not "enter": that row is drawn at four different scales and was dropped.
  assert.equal(entering.behavior, "sit");
  assert.ok(!pet.behaviors().includes("enter"),
    "the enter row shrank the cat by half mid-animation and must stay retired");
  assert.ok(pet.dwellMs({...entering, behavior:"curl-sleep"}) >= 8000);
  assert.ok(pet.dwellMs({...entering, behavior:"groom"}) >= 5000);
  assert.ok(pet.dwellMs({...entering, behavior:"look"}) >= 4000);
  for (const behavior of ["curl-sleep", "side-sleep", "loaf", "sit", "groom", "look"]) {
    for (const seed of [1, 9999, 4294967295]) {
      assert.ok(pet.dwellMs({behavior, seed}) <= 15000,
        `${behavior} can leave the cat apparently stuck for too long`);
    }
  }
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

test("reduced motion can change resting places without a walking animation", () => {
  const pet = load();
  const start = pet.create("yard", 3);
  const destination = pet.nextAnchor(start);
  const moved = pet.settleAt(start, destination.id);
  assert.equal(moved.anchorId, destination.id);
  assert.equal(moved.targetId, null);
  assert.equal(moved.x, destination.x);
  assert.equal(moved.y, destination.y);
  assert.notEqual(moved.behavior, "walk");
});

test("sprite metadata names a sheet and a bounded frame grid", () => {
  const pet = load();
  for (const behavior of pet.behaviors()) {
    const sprite = pet.spriteFor({behavior, frame:99});
    assert.match(sprite.path, /^assets\/home\/pet\/calico-.+-v\d+\.(?:webp|png)$/);
    assert.ok(sprite.columns >= 1 && sprite.rows >= 1);
    assert.ok(sprite.frame >= 0 && sprite.frame < sprite.columns * sprite.rows);
    assert.ok(fs.existsSync(new URL(sprite.path, import.meta.url)), sprite.path);
  }
});

test("walking uses the corrected alternating-leg four-key production sheet", () => {
  const pet = load();
  const walk = pet.spriteFor({behavior:"walk", frame:3});
  assert.equal(walk.path, "assets/home/pet/calico-walk-v3.png");
  assert.equal(walk.columns, 4);
  assert.equal(walk.rows, 1);
  assert.equal(walk.frame, 3);
});

test("four-key walk advances a pose within a quarter second at cruising speed", () => {
  const pet = load();
  const start = pet.create("yard", 4);
  const walking = pet.sendTo(start, "yard-rock");
  const advanced = pet.step(walking, 250, {});
  assert.ok(advanced.frame >= 1, `walk held frame zero for ${advanced.frame}`);
});

test("the cat follows a purposeful route through distinct resting places", () => {
  const pet = load();
  for (const scene of ["yard", "interior"]) {
    const anchors = pet.anchors(scene);
    let state = pet.create(scene, 17);
    const visited = new Set([state.anchorId]);
    for (let index = 0; index < anchors.length; index += 1) {
      const next = pet.nextAnchor(state);
      assert.ok(next, `${scene} needs a next resting place`);
      assert.notEqual(next.id, state.anchorId, "the cat must not choose its current spot");
      visited.add(next.id);
      state.anchorId = next.id;
    }
    assert.ok(visited.size >= 4, `${scene} route repeats too few meaningful places`);
  }
});

test("occupied furniture and trees are excluded from the cat route", () => {
  const pet = load();
  const state = {...pet.create("interior", 1), anchorId:"interior-window", x:22, y:78};
  const table = {x:55, y:83, rx:5, ry:4};
  const destination = pet.nextAnchor(state, [table]);
  assert.ok(destination, "another clear resting place should remain");
  assert.notEqual(destination.id, "interior-center");
  assert.equal(pet.routeIsClear(state, destination, [table]), true);

  const yard = {...pet.create("yard", 1), anchorId:"yard-rock", x:38, y:75};
  const tree = {x:47, y:77.5, rx:4, ry:3};
  const yardDestination = pet.nextAnchor(yard, [tree]);
  assert.ok(yardDestination);
  assert.equal(pet.routeIsClear(yard, yardDestination, [tree]), true);
});

test("a cat displaced by newly placed decor chooses a clear anchor", () => {
  const pet = load();
  const state = {...pet.create("interior", 1), anchorId:"interior-center", x:55, y:83};
  const blockers = [{x:55, y:83, rx:12, ry:7}];
  const safe = pet.safeAnchor(state, blockers);
  assert.ok(safe);
  assert.notEqual(safe.id, "interior-center");
  assert.equal(pet.pointIsClear(safe, blockers), true);
});

test("dense decoration fails safely instead of routing through an object", () => {
  const pet = load();
  const state = pet.create("yard", 2);
  const blockers = pet.anchors("yard").map((anchor) => ({x:anchor.x, y:anchor.y, rx:8, ry:6}));
  assert.equal(pet.nextAnchor(state, blockers), null);
  assert.equal(pet.safeAnchor(state, blockers), null);
});

test("the live home supplies placed furniture and plants to pet routing", () => {
  const app = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /function homePetBlockers\(scene\)/);
  assert.match(app, /LanternHomePet\.nextAnchor\(homePetState,\s*homePetBlockers\(homePetState\.scene\)\)/);
  assert.match(app, /LanternHomePet\.safeAnchor\(homePetState, blockers\)/);
  assert.match(app, /z-index:' \+ homeDepthZ/);
});

test("resting poses breathe subtly and respect reduced motion", () => {
  const app = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const css = fs.readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(app, /data-pet-behavior/);
  assert.match(css, /@keyframes pet-breathe/);
  assert.match(css, /prefers-reduced-motion:reduce[^}]*\.home-pet > span/s);
  assert.match(app, /reduced\s*\?\s*LanternHomePet\.settleAt/);
  assert.doesNotMatch(app, /if\(!reduced && homePetIdleMs > dwell\)/);
});

test("one-shot poses finish and hold instead of looping", () => {
  const pet = load();
  let state = {...pet.create("yard", 5), behavior:"sit", frame:0, clock:0};
  state = pet.step(state, 5000, {});
  assert.equal(state.frame, 3);
  assert.equal(pet.spriteFor(state).path, "assets/home/pet/calico-sit-v1.png");
  assert.ok(!pet.behaviors().includes("stand"), "unused stand transition must not ship");
});

test("distinct natural actions use distinct complete artwork", () => {
  const pet = load();
  const paths = ["side-sleep", "stretch", "look", "play"].map((behavior) =>
    pet.spriteFor({behavior, frame:0}).path);
  assert.equal(new Set(paths).size, paths.length);
  assert.match(paths[0], /calico-side-sleep-v1\.png$/);
  assert.match(paths[1], /calico-stretch-v1\.png$/);
  assert.match(paths[2], /calico-look-v1\.png$/);
  assert.match(paths[3], /calico-play-v1\.png$/);
});

test("yard and room actually offer the natural interaction poses", () => {
  const pet = load();
  const used = new Set([...pet.anchors("yard"), ...pet.anchors("interior")]
    .flatMap((anchor) => anchor.behaviors));
  for (const behavior of ["sniff", "stretch", "look", "play", "side-sleep"]) {
    assert.ok(used.has(behavior), `${behavior} is artwork with no place in the home`);
  }
});

test("legacy motions are normalized into separate production sheets", () => {
  const pet = load();
  assert.equal(pet.spriteFor({behavior:"loaf", frame:0}).path, "assets/home/pet/calico-loaf-v2.png");
  assert.equal(pet.spriteFor({behavior:"curl-sleep", frame:0}).path, "assets/home/pet/calico-curl-sleep-v2.png");
  assert.equal(pet.spriteFor({behavior:"sniff", frame:0}).path, "assets/home/pet/calico-sniff-v2.png");
  assert.equal(pet.spriteFor({behavior:"groom", frame:0}).path, "assets/home/pet/calico-groom-v2.png");
});

test("grooming uses a calm 2.4 second cycle", () => {
  const pet = load();
  const start = {...pet.create("yard", 5), behavior:"groom", frame:0, clock:0};
  assert.equal(pet.step(start, 599, {}).frame, 0);
  assert.equal(pet.step(start, 600, {}).frame, 1);
});
