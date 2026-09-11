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

test("shelf objects have real plank support and clearance, including the mirrored shelf", () => {
  // Measured from the 572x407 artwork, not the slot generator. The middle
  // boards alternate sides. Empty air inside the outer frame is not support.
  const boards = [[0.06, 0.94], [0.08, 0.65], [0.36, 0.95], [0.07, 0.94]];
  const clearance = [9, 4.6, 3.5, 2.7];
  const ratios = {"plant-small":587/639, teapot:224/143, books:224/200,
    "cat-figure":389/401, daruma:542/626, "sakura-bonsai":640/540, "pine-bonsai":640/566};
  for(const slot of slots.filter(s => s.kind === "shelf")){
    const row = Number(slot.id.match(/-(\d)[ab]$/)[1]) - 1;
    const mirrored = slot.surface === "shelf-left";
    let x = (slot.x - (mirrored ? 32.5 : 65.5) + 7.5) / 15;
    if(mirrored) x = 1 - x;
    assert.ok(x > boards[row][0] && x < boards[row][1], `${slot.id} is over empty air`);
    if(row === 3 && x > 0.65){
      // The perspective plinth begins at y=314 on its right half.
      const imageY = (slot.y - (73 - 15 * 1.778 / 1.405)) / (15 * 1.778 / 1.405) * 407;
      assert.ok(imageY >= 315 && imageY <= 335, `${slot.id} floats above the sloping plinth`);
    }
  }
  for(const slot of slots.filter(s => s.kind === "shelf")){
    const row = Number(slot.id.match(/-(\d)[ab]$/)[1]) - 1;
    const mirrored = slot.surface === "shelf-left";
    const centre = mirrored ? 32.5 : 65.5;
    let x = (slot.x - centre + 7.5) / 15;
    if(mirrored) x = 1 - x;
    const [left, right] = boards[row];
    assert.ok(x > left && x < right, `${slot.id} is over empty air`);
    for(const [id, ratio] of Object.entries(ratios)){
      const width = decor.widthForSlot(id, slot);
      assert.ok(x - width / 30 >= left && x + width / 30 <= right,
        `${id} extends beyond ${slot.id}'s plank`);
      assert.ok(width * 1.778 / ratio <= clearance[row], `${id} intersects the board above ${slot.id}`);
    }
  }
  for(const surface of ["shelf-left", "shelf-right"]){
    for(let row = 1; row <= 4; row++){
      const a = slots.find(s => s.id === `${surface}-${row}a`);
      const b = slots.find(s => s.id === `${surface}-${row}b`);
      for(const first of Object.keys(ratios)) for(const second of Object.keys(ratios)){
        assert.ok((decor.widthForSlot(first, a) + decor.widthForSlot(second, b)) / 2 < Math.abs(a.x-b.x),
          `${first} and ${second} overlap on ${surface} row ${row}`);
      }
    }
  }
});

test("home scenes use the production raster asset paths", () => {
  const scenes = room.scenes();
  assert.equal(scenes.yard.background, "assets/home/exterior/open-house-yard-v1.webp");
  assert.equal(scenes.yard.slots.length, 24);
  assert.ok(scenes.yard.houseHotspot.width > 0);
  assert.ok(scenes.yard.houseHotspot.height > 0);
  assert.equal(scenes.yard.houseHotspot.label, "家に入る");
  assert.ok(scenes.yard.exitHotspot.width > 0);
  assert.ok(scenes.yard.exitHotspot.height > 0);
  assert.equal(scenes.yard.exitHotspot.label, "路地へ戻る");
  assert.equal(scenes.interior.background, "assets/home/interior/starter-room-v1.webp");
  assert.ok(scenes.interior.exitHotspot.width > 0);
  assert.ok(scenes.interior.exitHotspot.height > 0);
  assert.equal(scenes.interior.exitHotspot.label, "庭へ戻る");

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

test("a story reward enters decor storage once without charging coins", () => {
  const first = decor.grant(empty(), "scroll");
  assert.equal(first.ok, true);
  assert.equal(first.reason, null);
  assert.deepEqual(first.home.owned, ["scroll"]);
  assert.equal(Object.keys(first.home.placed).length, 0);

  const replay = decor.grant(first.home, "scroll");
  assert.equal(replay.ok, false);
  assert.equal(replay.reason, "owned");
  assert.deepEqual(replay.home.owned, ["scroll"]);
});

test("an unknown story reward leaves home state untouched", () => {
  const home = {owned:["floor-cushion-navy"], placed:{"floor-left":"floor-cushion-navy"}};
  const result = decor.grant(home, "missing");
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unknown");
  assert.equal(result.home, home);
});

test("every catalogue item can actually go somewhere in the room", () => {
  const kinds = new Set(slots.map(s => s.kind));
  for(const item of decor.catalogue()){
    assert.ok(kinds.has(item.kind), `${item.id} is a "${item.kind}" and no slot takes one`);
    assert.ok(item.price > 0, `${item.id} is free`);
    assert.ok(decor.svgFor(item.id).length > 40, `${item.id} has no artwork`);
  }
});

test("same-kind room targets remain separately reachable on a narrow scene", () => {
  /* The narrowest scene the room is ever drawn at, which is not the narrowest
     phone. 320x180 here was the viewport itself, from before the camera could
     pan: the scene now sizes from `clamp(300px,50dvh,480px)` of height at
     16/9 and scrolls sideways inside whatever viewport it is given, so its
     floor is 533x300 and a 320px phone gets that too. Verified by loading one
     - a 320x568 viewport reported the interior scene 533x300.

     The distinction matters in the strict direction. Against the old numbers
     a pair 10% apart measures 32px and looks like a failure; against the real
     ones it is 53px and passes honestly. Keeping the smaller figure would not
     have been "safely conservative" - it would have forced slots further
     apart than the furniture they sit on is wide. */
  const scene = {width:533, height:300};
  for(let a = 0; a < slots.length; a += 1){
    for(let b = a + 1; b < slots.length; b += 1){
      if(slots[a].kind !== slots[b].kind) continue;
      /* Positions on the same piece of furniture are never separate targets.
         Eight places on a shelf are reached by pressing the shelf once - see
         `surface` in home-room.js - so the rule that matters is that the
         SHELVES are far apart, which the pairs below still check, not that
         two spots on the same plank are. Requiring 44px between them would
         demand a shelf about twice the size of the wall it stands against. */
      if(slots[a].surface && slots[a].surface === slots[b].surface) continue;
      const dx = (slots[a].x - slots[b].x) * scene.width / 100;
      const dy = (slots[a].y - slots[b].y) * scene.height / 100;
      assert.ok(Math.abs(dx) >= 44 || Math.abs(dy) >= 44,
        `${slots[a].id} overlaps ${slots[b].id} at mobile width (${Math.abs(dx).toFixed(1)}x${Math.abs(dy).toFixed(1)}px apart)`);
    }
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
    "chrysanthemum-pot":"chrysanthemum-pot-v1.webp",
    "sakura-bonsai":"sakura-bonsai-v1.webp",
    "pine-bonsai":"pine-bonsai-v1.webp",
    // The last six to arrive; before these, every one was a drawing.
    "brazier":"brazier-v1.webp",
    "fan":"fan-v1.webp",
    "mask":"mask-v1.webp",
    "teapot":"teapot-v1.webp",
    "books":"books-v1.webp",
    "sill-plant":"sill-plant-v1.webp",
    "display-shelf":"display-shelf-staggered-v1.webp"
  };
  for(const [id, filename] of Object.entries(expected)){
    assert.equal(decor.getItem(id)?.image, `assets/home/decor/${filename}`, `${id} image mapping`);
    assert.ok(fs.existsSync(new URL(`./assets/home/decor/${filename}`, import.meta.url)), `${filename} missing`);
  }
  assert.equal(decor.getWallpaper("wallpaper-asanoha")?.image,
    "assets/home/decor/wallpaper-asanoha-blue-v1.webp");
});

test("placed decor carries physical size and contact-point calibration", () => {
  const expected = {
    "floor-cushion-navy": {width:14, anchorY:82, scaleY:1, offsetY:0},
    "rug-plain": {width:20, anchorY:55, scaleY:0.58, offsetY:0},
    "low-table": {width:23, anchorY:100, scaleY:1, offsetY:0},
    "folding-screen": {width:43, anchorY:100, scaleY:1, offsetY:0},
    "scroll": {width:7, anchorY:50, scaleY:1, offsetY:0},
    /* These six briefly carried vector-fallback anchors - 63.5, 69.2, 65.4 -
       which described where a drawing stopped inside a box it did not fill.
       Their photographs are cropped tight, so the bottom of the picture is
       the bottom of the object again and they anchor at 100 like every other
       photograph. The widths came down at the same time and for the same
       reason: the old ones measured the padded box rather than the thing. */
    "brazier": {width:11.5, anchorY:100, scaleY:1, offsetY:0},
    "teapot": {width:4.6, anchorY:100, scaleY:1, offsetY:0},
    "books": {width:5.6, anchorY:100, scaleY:1, offsetY:0},
    "sill-plant": {width:7.6, anchorY:100, scaleY:1, offsetY:0},
    // Wall art is the exception and keeps its centre: it hangs, not stands.
    "fan": {width:11.5, anchorY:50, scaleY:1, offsetY:0},
    "mask": {width:3.8, anchorY:50, scaleY:1, offsetY:0},
    // A wind chime hangs from its hook, so its anchor is the top of the picture
    // and there is nothing to offset it from. The -40 was lifting it off a
    // windowsill it should never have been standing on.
    "wind-chime": {width:4, anchorY:0, scaleY:1, offsetY:0}
  };
  for(const [id, want] of Object.entries(expected)){
    const got = decor.presentationFor(id);
    for(const key of Object.keys(want)){
      assert.equal(got[key], want[key], `${id} ${key}`);
    }
  }
  for(const item of decor.catalogue()){
    const presentation = decor.presentationFor(item.id);
    // The upper bound is 45, not 25: a 170cm byobu measured against the room's
    // own tatami comes out at 43% of the scene, and it is genuinely that wide.
    assert.ok(presentation.width >= 3 && presentation.width <= 45, `${item.id} width`);
    assert.ok(presentation.anchorY >= 0 && presentation.anchorY <= 100, `${item.id} anchor`);
    assert.ok(presentation.scaleY > 0 && presentation.scaleY <= 1, `${item.id} vertical scale`);
    assert.ok(presentation.offsetY >= -45 && presentation.offsetY <= 10, `${item.id} vertical offset`);
  }
});

/* Every catalogue item now carries a photograph, so nothing is sized through
 * a partly-filled viewBox any more and the compensation this test used to
 * check no longer exists to be checked.
 *
 * What replaces it is the rule that made that compensation necessary: `width`
 * must describe the object, not the box it is drawn in. A tight-cropped
 * photograph makes those the same thing, and this fails if a drawing-only
 * item ever comes back without someone re-deriving its width.
 */
test("every catalogue item is sized from a picture of the object itself", () => {
  for(const item of decor.catalogue()){
    const full = decor.getItem(item.id);
    assert.ok(full.image,
      `${item.id} has no photograph: its width would describe a viewBox rather than the object, and its anchor would have to be re-measured from the artwork`);
    assert.ok(fs.existsSync(new URL("./" + full.image, import.meta.url)),
      `${item.id} points at ${full.image}, which is not on disk`);
  }

  // The vectors stay as fallbacks - a picture that fails to load must not
  // make an owned object vanish from a room someone paid to decorate.
  for(const item of decor.catalogue()){
    assert.ok(decor.svgFor(item.id).length > 40, `${item.id} lost its fallback drawing`);
  }
});

test("shelf rewards rest on the shelf's planks rather than on the wall behind it", () => {
  /* This began life checking that two shelf slots had come down off the wall
     onto the back floor. They are on a real piece of furniture now, so what
     is worth holding is that every one of them lands on the shelf: between
     its top plank and its base, and inside its width. */
  const shelfSlots = slots.filter(slot => slot.kind === "shelf");
  assert.equal(shelfSlots.length, 16, "eight places on each of the two shelves");

  for (const [surface, centre] of [["shelf-right", 65.5], ["shelf-left", 32.5]]) {
    const group = shelfSlots.filter(s => s.surface === surface);
    assert.equal(group.length, 8, `${surface} holds eight`);
    for (const slot of group) {
      // the shelf is 15% wide, standing with its foot at y=73 and 18.98 tall
      assert.ok(Math.abs(slot.x - centre) <= 7.5, `${slot.id} is within the shelf's width`);
      assert.ok(slot.y > 73 - 18.98 && slot.y < 73, `${slot.id} is between the top plank and the floor`);
    }
  }

  // The bought shelf's places exist only while it is standing there.
  for (const slot of shelfSlots.filter(s => s.surface === "shelf-left")) {
    assert.equal(slot.requires, "cabinet-left", `${slot.id} needs the shelf under it`);
  }
});

test("window rewards use the visible left opening instead of floating on a wall panel", () => {
  const sill = slots.find(slot => slot.id === "window-sill");
  assert.ok(sill.x <= 22, "window reward should align with the left opening");
  assert.ok(sill.y >= 60, "potted reward should meet the opening floor line");
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
  home = decor.place(home, "teapot", "shelf-right-1a", slots).home;
  assert.deepEqual(decor.inStorage(home), ["rug-plain", "fan"]);
});

test("putting something away returns it to storage", () => {
  let home = {owned: ["teapot"], placed: {}};
  home = decor.place(home, "teapot", "shelf-right-1a", slots).home;
  const gone = decor.remove(home, "shelf-right-1a");
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

/* Every object's placement is declared, and matches what the object is.
 *
 * This table is the definition the catalogue is checked against, rather than
 * a restatement of it. A wind chime spent this long filed as `sill` furniture
 * and therefore stood on the veranda boards like a plant pot - which is not a
 * thing a wind chime does. Writing down what each object IS makes that kind of
 * mistake visible instead of leaving it to be noticed in a screenshot.
 *
 * Adding an item means adding it here too, and saying which of the five
 * surfaces it belongs on.
 */
test("every object declares the surface it actually belongs on", () => {
  const belongs = {
    // rests on the tatami
    "floor-cushion-navy": "floor", "rug-plain": "floor",
    "low-table": "floor", "brazier": "floor", "kotatsu": "floor",
    "folding-screen": "floor", "floor-lantern": "floor", "chrysanthemum-pot": "floor",
    // hangs flat against a wall
    "scroll": "wall", "fan": "wall",
    /* hangs on a structural post rather than on flat plaster. 面 joined the
       lantern here: a mask is hung on a pillar in a room like this, and it
       was also the only way to stop three hanging pieces competing for two
       stretches of wall while a pillar stood empty. */
    "wall-lamp": "post", "mask": "post",
    // rests on a raised surface rather than the floor. A bonsai belongs here
    // and not on the tatami: it is grown to be displayed on a stand.
    "teapot": "shelf", "books": "shelf", "cat-figure": "shelf",
    "daruma": "shelf", "sakura-bonsai": "shelf", "pine-bonsai": "shelf",
    "plant-small": "shelf",
    // stands against a wall and is itself a surface: the only piece whose
    // presence creates places for other pieces, which is why it has a kind
    // of its own rather than being one more thing on the floor
    "display-shelf": "cabinet",
    // stands on the veranda boards
    "sill-plant": "sill",
    // hangs from a beam, resting on nothing
    "wind-chime": "eave",
  };

  const catalogue = decor.catalogue();
  for (const item of catalogue) {
    assert.ok(belongs[item.id], item.id + " has no declared surface in this table");
    assert.equal(item.kind, belongs[item.id],
      item.id + " is catalogued as " + item.kind + " but belongs on " + belongs[item.id]);
  }
  assert.equal(Object.keys(belongs).length, catalogue.length,
    "the table lists an item the catalogue does not have");

  // and every surface an object claims must exist somewhere in the room
  const roomSlots = room.scenes().interior.slots;
  for (const kind of new Set(Object.values(belongs))) {
    assert.ok(roomSlots.some((s) => s.kind === kind),
      "objects belong on '" + kind + "' but the room has no such position");
  }

  // a hanging object is anchored by its top, because that is where the hook is
  const chime = decor.presentationFor("wind-chime");
  assert.equal(chime.anchorY, 0, "a hanging object is anchored at its top");
  assert.equal(chime.offsetY, 0, "a hanging object needs no offset from a surface");
});

/* A plank is a place on a piece of furniture, not a place in the room.
 *
 * The left shelf is bought, so its two planks only exist while it is
 * standing there. Carrying it out with a teapot on it must not leave the
 * teapot in mid-air, and must not quietly lose it either - it goes back to
 * storage like anything else put away, and the room is told what came down
 * so it can say so.
 */
test("taking away a shelf brings down what was standing on it", () => {
  const roomSlots = slots;
  const plank = roomSlots.find(s => s.requires === "cabinet-left");
  assert.ok(plank, "the bought shelf's planks declare what they stand on");

  let home = {owned:["display-shelf", "teapot"], placed:{}};
  home = decor.place(home, "display-shelf", "cabinet-left", roomSlots).home;
  home = decor.place(home, "teapot", plank.id, roomSlots).home;
  assert.equal(home.placed[plank.id], "teapot", "the teapot is on the plank");

  const gone = decor.remove(home, "cabinet-left", roomSlots);
  assert.equal(gone.removed, "display-shelf");
  /* Copied into this realm before comparing. home-decor.js is run inside a
     vm context, so an array it creates carries that context's
     Array.prototype, and deepStrictEqual compares prototypes - two identical
     ['teapot'] arrays fail against each other with no visible difference in
     the output. The existing tests never hit this because the arrays they
     compare are grown from ones the test passed in. */
  assert.deepEqual([...gone.evicted], ["teapot"], "the teapot comes down with it");
  assert.equal(gone.home.placed[plank.id], undefined, "and is not left in mid-air");
  assert.ok(gone.home.owned.includes("teapot"), "and is still owned, not lost");

  // Putting an ordinary object away disturbs nothing else.
  let plain = {owned:["floor-cushion-navy"], placed:{}};
  plain = decor.place(plain, "floor-cushion-navy", "floor-left", roomSlots).home;
  const one = decor.remove(plain, "floor-left", roomSlots);
  assert.deepEqual([...one.evicted], [], "nothing stands on a cushion");
});

/* A drawn object stands on the bottom of its drawing, not of its box.
 *
 * The six pieces with no photograph fall back to an inline SVG in a fixed
 * -60 -52 120 104 viewBox, and none of them fill it: the art stops around
 * y=14..20 where the box ends at y=52. Anchoring those at 100 puts the empty
 * bottom of the box on the surface and leaves the object hovering above it -
 * which is exactly what a teapot floating over a shelf plank looked like.
 *
 * The numbers come from getBBox() in a browser, so this guards the rule
 * rather than recomputing it: anything standing on something must anchor
 * well above its box bottom, and anything with a photograph - cut tight -
 * must anchor at its base. Redraw a fallback path and this will not catch
 * the new value, but it will catch a reset to 100.
 */
test("objects rest on their artwork, not on the bottom of a padded box", () => {
  /* This began as a guard on the four vector fallbacks, which anchored at
     63.5-69.2 because their drawings stopped well short of the viewBox they
     sat in. Their photographs arrived cropped tight, so the rule is simpler
     now and stricter: a picture that stands on something ends at its base,
     and anchors at 100. The failure it guards against is a padded export -
     transparent pixels under the object put it back in mid-air, which is
     exactly how the teapot floated above its plank. */
  const standing = ["brazier", "teapot", "books", "sill-plant"];
  for (const id of standing) {
    const item = decor.getItem(id);
    assert.ok(item.image, `${id} should have a photograph`);
    assert.equal(decor.presentationFor(id).anchorY, 100,
      `${id} stands on a surface, so its picture must be cropped to its base and anchor at 100`);
  }

  // Wall art is the deliberate exception: it hangs from its middle.
  for (const id of ["fan", "mask"]) {
    assert.equal(decor.presentationFor(id).anchorY, 50, `${id} hangs from its centre`);
  }

  // A tight-cropped photograph really does end at its base.
  for (const id of ["cat-figure", "daruma", "pine-bonsai", "plant-small"]) {
    assert.ok(decor.getItem(id).image, `${id} should have a photograph`);
    assert.equal(decor.presentationFor(id).anchorY, 100,
      `${id} is cut tight, so its base is the bottom of the picture`);
  }
});


test("a pale wallpaper is laid on the panel, not multiplied into it", () => {
  /* The layer's default is multiply, which only ever darkens - that is why
   * 麻の葉 reads, being dark lines on a light panel. 桜 is pale pink on cream:
   * measured against the 麻の葉 sheet it has a tonal spread of 14 against 66,
   * and 2% of its pixels are dark enough to show against 31%. Multiplied it
   * was invisible on the wall while looking correct in its own swatch, and
   * the alternative was pushing the artwork to nearly three times its own
   * saturation, which is re-authoring the picture rather than showing it.
   */
  assert.equal(decor.wallpaperBlend("wallpaper-sakura"), "normal");
  assert.equal(decor.wallpaperBlend("wallpaper-asanoha"), "multiply",
    "a dark line pattern still tints the panel it sits on");
  assert.equal(decor.wallpaperBlend("wallpaper-plain"), "multiply", "and so does the default");
  assert.equal(decor.wallpaperBlend("no-such-paper"), "multiply");

  // The app has to put that choice on the element the blend is set on, and the
  // stylesheet has to have something for it to name.
  const app = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /home-wallpaper blend-' \+ blend/);
  const css = fs.readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  assert.match(css, /\.home-wallpaper\.blend-normal\{mix-blend-mode:normal/);

  // And 桜 is a photograph now rather than the generated blossoms it shipped
  // with, so it takes the raster path.
  // wallpapers is a getter, not the array itself.
  const sakura = decor.getWallpaper("wallpaper-sakura");
  assert.ok(sakura.image, "桜 has artwork");
  assert.match(decor.wallpaperSvg("wallpaper-sakura"), /is-raster/);
});
