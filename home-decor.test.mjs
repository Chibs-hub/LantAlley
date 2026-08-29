/* The decor rules, tested where they live rather than through the DOM.
 *
 * Two of these are the whole reason the module is pure. "One purchase is one
 * object" and "a swap returns the displaced item" are easy to write, easy to
 * break in a refactor, and invisible when broken until a learner loses
 * something they paid for.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL("./home-decor.js", import.meta.url), "utf8"), context);
vm.runInContext(fs.readFileSync(new URL("./home-room.js", import.meta.url), "utf8"), context);
const decor = context.LanternHomeDecor;
const room = context.LanternHomeRoom;
const slots = room.slots();

test("home scenes use the production raster asset paths", () => {
  const scenes = room.scenes();
  assert.equal(scenes.yard.background, "assets/home/exterior/open-house-yard-v1.webp");
  assert.equal(scenes.yard.slots.length, 24);
  assert.ok(scenes.yard.houseHotspot.width > 0);
  assert.ok(scenes.yard.houseHotspot.height > 0);
  assert.equal(scenes.yard.houseHotspot.label, "家に入る");
  assert.equal(scenes.interior.background, "assets/home/interior/starter-room-v1.webp");

  for(const slot of scenes.yard.slots){
    assert.equal(slot.kind, "garden");
    assert.ok(slot.id && slot.label);
    assert.ok(slot.x >= 0 && slot.x <= 100);
    assert.ok(slot.y >= 0 && slot.y <= 100);
  }
  assert.deepEqual(room.slots(), scenes.interior.slots);
  scenes.interior.slots[0].x = -1;
  assert.notEqual(room.slots()[0].x, -1, "scene slots must be cloned");

  for(const assetPath of [
    scenes.yard.background,
    scenes.interior.background,
    "assets/home/garden/camellia-planted-v1.webp",
    "assets/home/garden/camellia-sprout-v1.webp",
    "assets/home/garden/camellia-growing-v1.webp",
    "assets/home/garden/camellia-mature-v1.webp",
    "assets/home/decor/floor-cushion-navy-v1.webp"
  ]){
    assert.ok(fs.existsSync(new URL(`./${assetPath}`, import.meta.url)), `${assetPath} is missing`);
  }
});

const empty = () => ({owned: [], placed: {}});

test("every catalogue item can actually go somewhere in the room", () => {
  const kinds = new Set(slots.map(s => s.kind));
  for(const item of decor.catalogue()){
    assert.ok(kinds.has(item.kind), `${item.id} is a "${item.kind}" and no slot takes one`);
    assert.ok(item.price > 0, `${item.id} is free`);
    assert.ok(decor.svgFor(item.id).length > 40, `${item.id} has no artwork`);
  }
});

test("available reward artwork is connected to matching shop items", () => {
  const expected = {
    "rug-plain":"rug-plain-v1.webp",
    "plant-small":"bonsai-green-v1.webp",
    "low-table":"low-table-round-v1.webp",
    "wall-lamp":"paper-lantern-red-v1.webp",
    scroll:"hanging-scroll-bamboo-v1.webp",
    "cat-figure":"maneki-neko-v1.webp",
    "wind-chime":"wind-chime-blue-v1.webp",
    kotatsu:"kotatsu-blue-v1.webp",
    daruma:"daruma-red-v1.webp",
    "folding-screen":"folding-screen-cranes-v1.webp",
    "floor-lantern":"floor-lantern-v1.webp",
    chrysanthemum:"chrysanthemum-pot-v1.webp",
    "sakura-bonsai":"sakura-bonsai-v1.webp",
    "pine-bonsai":"pine-bonsai-v1.webp"
  };
  for(const [id, filename] of Object.entries(expected)){
    assert.equal(decor.getItem(id)?.image, `assets/home/decor/${filename}`, `${id} image mapping`);
    assert.ok(fs.existsSync(new URL(`./assets/home/decor/${filename}`, import.meta.url)), `${filename} missing`);
  }
  assert.equal(decor.getWallpaper("wallpaper-asanoha")?.image,
    "assets/home/decor/wallpaper-asanoha-blue-v1.webp");
});

test("prices span a range, so there is always something just out of reach", () => {
  const prices = decor.catalogue().map(i => i.price);
  assert.ok(Math.min(...prices) <= 60);
  assert.ok(Math.max(...prices) >= 300);
});

test("buying takes the money once and refuses when short", () => {
  const poor = decor.buy(empty(), 10, "low-table");
  assert.equal(poor.ok, false);
  assert.equal(poor.reason, "poor");

  const bought = decor.buy(empty(), 250, "low-table");
  assert.equal(bought.ok, true);
  assert.equal(bought.money, 50);
  assert.ok(decor.owns(bought.home, "low-table"));

  const again = decor.buy(bought.home, 250, "low-table");
  assert.equal(again.ok, false, "buying the same item twice should be refused");
  assert.equal(again.reason, "owned");
});

test("an item you do not own cannot be placed", () => {
  const put = decor.place(empty(), "low-table", "floor-left", slots);
  assert.equal(put.ok, false);
  assert.equal(put.reason, "unowned");
});

test("a scroll does not go on the floor", () => {
  const home = {owned: ["scroll"], placed: {}};
  assert.equal(decor.place(home, "scroll", "floor-left", slots).reason, "wrongkind");
  assert.equal(decor.place(home, "scroll", "wall-left", slots).ok, true);
});

test("one purchase is one object: moving it empties the corner it came from", () => {
  let home = {owned: ["rug-plain"], placed: {}};
  home = decor.place(home, "rug-plain", "floor-left", slots).home;
  assert.equal(home.placed["floor-left"], "rug-plain");

  home = decor.place(home, "rug-plain", "floor-right", slots).home;
  assert.equal(home.placed["floor-right"], "rug-plain");
  assert.equal(home.placed["floor-left"], undefined,
    "the same rug was left lying in both corners");
});

test("placing into an occupied corner swaps, and says what was displaced", () => {
  let home = {owned: ["rug-plain", "low-table"], placed: {}};
  home = decor.place(home, "rug-plain", "floor-left", slots).home;
  const put = decor.place(home, "low-table", "floor-left", slots);

  assert.equal(put.ok, true);
  assert.equal(put.displaced, "rug-plain", "the displaced item has to be named");
  assert.equal(put.home.placed["floor-left"], "low-table");
  assert.ok(decor.owns(put.home, "rug-plain"), "the rug must not be destroyed");
  assert.deepEqual(decor.inStorage(put.home), ["rug-plain"]);
});

test("storage is what you own minus what is standing in the room", () => {
  let home = {owned: ["rug-plain", "teapot", "fan"], placed: {}};
  assert.equal(decor.inStorage(home).length, 3);
  home = decor.place(home, "teapot", "shelf", slots).home;
  assert.deepEqual(decor.inStorage(home), ["rug-plain", "fan"]);
});

test("putting something away returns it to storage", () => {
  let home = {owned: ["teapot"], placed: {}};
  home = decor.place(home, "teapot", "shelf", slots).home;
  const gone = decor.remove(home, "shelf");
  assert.equal(gone.removed, "teapot");
  assert.equal(Object.keys(gone.home.placed).length, 0);
  assert.deepEqual(decor.inStorage(gone.home), ["teapot"]);
});

test("the next goal is the cheapest thing not yet affordable", () => {
  const goal = decor.nearestUnaffordable(empty(), 55);
  assert.equal(goal.id, "sill-plant", "60 is the next price above 55");
  assert.equal(goal.short, 5);

  // Something already owned is not a goal.
  const owned = decor.nearestUnaffordable({owned: ["sill-plant"], placed: {}}, 55);
  assert.notEqual(owned.id, "sill-plant");
});

test("with enough money for everything there is no goal left", () => {
  const rich = decor.catalogue().reduce((sum, i) => sum + i.price, 0);
  assert.equal(decor.nearestUnaffordable(empty(), rich), null);
});

test("buy and place never mutate the home they were handed", () => {
  const home = {owned: ["rug-plain"], placed: {"floor-left": "rug-plain"}};
  decor.buy(home, 500, "teapot");
  decor.place(home, "rug-plain", "floor-right", slots);
  decor.remove(home, "floor-left");
  assert.deepEqual(home, {owned: ["rug-plain"], placed: {"floor-left": "rug-plain"}});
});
