import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { inflateSync } from "node:zlib";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./home-dog.js", import.meta.url), "utf8"), context);
  return context.LanternHomeDog;
}

test("Shiba contact poses follow body travel for both gaits", () => {
  const dog = load();
  for (const [seed, minimum, maximum] of [[1, 0.50, 0.64], [2, 0.38, 0.50]]) {
    const start = {...dog.create("yard", seed), x:21, y:72, anchorId:"yard-dog-shade"};
    let walking = dog.sendTo(start, "yard-dog-path");
    let changes = 0;
    let previous = walking.frame % 2;
    while (changes < 2 && walking.targetId) {
      walking = dog.step(walking, 16, {});
      if (walking.frame !== previous) { changes += 1; previous = walking.frame; }
    }
    assert.equal(changes, 2);
    const ratio = walking.walked / dog.widthAt(walking.y, walking.scene);
    assert.ok(ratio >= minimum && ratio <= maximum, `${seed} traveled ${ratio} body lengths`);
  }
});

function alphaAreas(path, columns) {
  const bytes = readFileSync(new URL(path, import.meta.url));
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const packed = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[source++];
    for (let x = 0; x < stride; x += 1) {
      const raw = packed[source++];
      const left = x >= 4 ? rgba[y * stride + x - 4] : 0;
      const up = y ? rgba[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? rgba[(y - 1) * stride + x - 4] : 0;
      let value = raw;
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) {
        const estimate = left + up - upperLeft;
        const distances = [Math.abs(estimate - left), Math.abs(estimate - up), Math.abs(estimate - upperLeft)];
        value += distances[0] <= distances[1] && distances[0] <= distances[2]
          ? left : distances[1] <= distances[2] ? up : upperLeft;
      }
      rgba[y * stride + x] = value & 255;
    }
  }
  const frameWidth = width / columns;
  return Array.from({length: columns}, (_, frame) => {
    let area = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = frame * frameWidth; x < (frame + 1) * frameWidth; x += 1) {
        if (rgba[y * stride + x * 4 + 3] > 32) area += 1;
      }
    }
    return area;
  });
}

test("Shiba anchors are all grounded and dog actions are realistic", () => {
  const dog = load();
  for (const scene of ["yard", "interior"]) {
    for (const anchor of dog.anchors(scene)) {
      assert.equal(anchor.support, "ground");
      assert.ok(anchor.behaviors.every((behavior) =>
        ["walk", "stand", "sit", "sniff", "scratch"].includes(behavior)));
    }
  }
  assert.ok(dog.anchors("yard").some((anchor) => anchor.behaviors.includes("sniff")));
  assert.ok(dog.anchors("interior").some((anchor) => anchor.behaviors.includes("sit")));
});

test("Shiba walking stays on the floor and lands exactly on its target", () => {
  const dog = load();
  const start = dog.create("yard", 2);
  const target = dog.nextAnchor(start);
  const walking = dog.sendTo(start, target.id);
  const moving = dog.step(walking, 300, {});
  assert.equal(moving.behavior, "walk");
  assert.ok(moving.y >= Math.min(start.y, target.y) - 0.01);
  const landed = dog.step(moving, 20000, {});
  assert.equal(landed.anchorId, target.id);
  assert.equal(landed.x, target.x);
  assert.equal(landed.y, target.y);
  assert.notEqual(landed.behavior, "walk");
});

test("a Shiba can leave the center when a kotatsu and both screens are placed", () => {
  const dog = load();
  const blockers = [
    {x:50, y:77.984, rx:10.416, ry:5.04},
    {x:20, y:81.5, rx:15.4628, ry:7.482},
    {x:80, y:81.5, rx:15.4628, ry:7.482}
  ];
  const center = dog.anchors("interior").find((anchor) => anchor.id === "interior-dog-center");
  const state = {...dog.create("interior", 1), anchorId:center.id, x:center.x, y:center.y};
  const destination = dog.nextAnchor(state, blockers);
  assert.ok(destination, "the furnished room must retain a clear walking route");
  assert.equal(dog.pointIsClear(destination, blockers), true);
  assert.equal(dog.routeIsClear(state, destination, blockers), true);
});

test("reduced motion settles a Shiba without leaving it mid-stride", () => {
  const dog = load();
  const start = dog.create("interior", 3);
  const target = dog.nextAnchor(start);
  const settled = dog.step(dog.sendTo(start, target.id), 16, {reducedMotion:true});
  assert.equal(settled.anchorId, target.id);
  assert.equal(settled.behavior, "stand");
  assert.equal(settled.frame, 0);
});

test("Shiba sprite sheets are four-frame transparent PNGs", () => {
  const dog = load();
  assert.deepEqual([...dog.behaviors()].sort(), ["scratch", "sit", "sniff", "stand", "walk"]);
  for (const behavior of dog.behaviors()) {
    const sprite = dog.spriteFor({behavior, frame:99});
    assert.match(sprite.path, /^assets\/home\/pet\/shiba-.+-v\d+\.png$/);
    assert.equal(sprite.columns, 4);
    assert.equal(sprite.rows, 1);
    assert.ok(sprite.frame >= 0 && sprite.frame < 4);
    const bytes = readFileSync(new URL(sprite.path, import.meta.url));
    assert.equal(bytes.toString("ascii", 1, 4), "PNG");
    assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20) * 4);
    assert.equal(bytes[25], 6);
  }
});

test("Shiba is smaller than a cat indoors and remains readable outdoors", () => {
  const dog = load();
  assert.ok(dog.widthAt(84, "interior") >= 8 && dog.widthAt(84, "interior") <= 12);
  assert.ok(dog.widthAt(84, "yard") >= 4 && dog.widthAt(84, "yard") <= 7);
  assert.ok(dog.widthAt(84, "interior") > dog.widthAt(84, "yard"));
});

test("nearby Shiba IDs receive different motion profiles", () => {
  const dog = load();
  const profiles = [100, 101, 102, 103].map((seed) => dog.motionProfile(seed));
  assert.ok(new Set(profiles.map((profile) => profile.phase)).size >= 3,
    "four dogs must not begin on the same animation frame");
  assert.ok(new Set(profiles.map((profile) => profile.pace)).size >= 2,
    "multiple dogs need visibly different walking pace");
  assert.deepEqual(new Set(profiles.map((profile) => profile.routeDirection)), new Set([-1, 1]),
    "some dogs should travel the authored route in the opposite direction");
  assert.deepEqual(new Set(profiles.map((profile) => profile.gait)), new Set(["amble", "trot"]),
    "multiple dogs need both relaxed and brisk gait artwork");
});

test("two Shiba do not stay synchronized under the same clock", () => {
  const dog = load();
  const base = dog.create("yard", 100);
  const first = dog.sendTo(base, dog.nextAnchor(base).id);
  const secondBase = {...dog.create("yard", 101), anchorId:base.anchorId, x:base.x, y:base.y};
  const second = dog.sendTo(secondBase, dog.nextAnchor(secondBase).id);
  const movedA = dog.step(first, 600, {});
  const movedB = dog.step(second, 600, {});
  assert.notDeepEqual(
    [movedA.x, movedA.y, dog.spriteFor(movedA).path, dog.spriteFor(movedA).frame],
    [movedB.x, movedB.y, dog.spriteFor(movedB).path, dog.spriteFor(movedB).frame]
  );
});

test("the brisk gait has separate production artwork", () => {
  const dog = load();
  const amble = dog.spriteFor({behavior:"walk", frame:1, profile:{gait:"amble"}});
  const trot = dog.spriteFor({behavior:"walk", frame:1, profile:{gait:"trot"}});
  assert.equal(amble.path, "assets/home/pet/shiba-walk-v2.png");
  assert.equal(trot.path, "assets/home/pet/shiba-trot-v1.png");
  assert.notEqual(amble.path, trot.path);
  for (const sprite of [amble, trot]) {
    const bytes = readFileSync(new URL(sprite.path, import.meta.url));
    assert.equal(bytes.toString("ascii", 1, 4), "PNG");
    assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20) * sprite.columns);
    assert.equal(bytes[25], 6);
  }
});

test("walking poses keep the Shiba's visible body size stable", () => {
  const dog = load();
  for (const gait of ["amble", "trot"]) {
    const sprites = [0, 1, 2, 3].map((frame) =>
      dog.spriteFor({behavior:"walk", frame, profile:{gait}}));
    const areas = alphaAreas(sprites[0].path, sprites[0].columns);
    const usedAreas = sprites.map((sprite) => areas[sprite.frame]);
    assert.ok(Math.max(...usedAreas) / Math.min(...usedAreas) < 1.05,
      `${gait} gait changes visible body area by more than 5%: ${usedAreas.join(", ")}`);
  }
});

test("the live home gives each dog the other dogs' active poses", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /occupiedBehaviors:/);
  assert.match(app, /homePetSiblingBlocker\(pet, species, sib, iidSpecies\(k\)\)/);
});
