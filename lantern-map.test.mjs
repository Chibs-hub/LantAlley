import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const read = (name) => readFileSync(new URL("./" + name, import.meta.url), "utf8");

function loadMap() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read("lantern-map.js"), context);
  return context.LanternAlleyMap;
}

test("the alley exposes its destinations and every lesson is playable", () => {
  const map = loadMap();

  // わが家 sits between the places rather than at the end of them: it is the
  // one destination that is not a lesson.
  assert.deepEqual(
    Array.from(map.destinations, (place) => place.key),
    ["entrance", "home-inn", "home", "market", "tea-house", "station", "shrine"],
  );

  // The four later places were held at "preparing" while they had no content.
  // They have episodes now, so holding them shut would only hide the game.
  for (const key of ["market", "tea-house", "station", "shrine"]) {
    assert.equal(map.resolveState(key, {}), "available", key + " is still shut");
    const action = map.getAction(key, {});
    assert.ok(action, key + " has no way in");
    assert.equal(action.locationKey, key);
  }

  // Entering one, before any of its shifts are finished, reads as in progress:
  // these places have no three-day stage to leave a trace in.
  assert.equal(map.resolveState("market", { stageStarted: { market: true } }), "in-progress");
  assert.equal(map.resolveState("market", { visited: { market: true } }), "completed");
});

test("implemented destinations resolve completed, in-progress, and available progress", () => {
  const map = loadMap();

  assert.equal(map.resolveState("entrance", { visited: { entrance: true } }), "completed");
  assert.equal(map.resolveState("entrance", {}), "available");
  assert.equal(
    map.resolveState("home-inn", { stageProgress: { homeInn: { phase: "practice" } } }),
    "in-progress",
  );
  assert.equal(map.resolveState("home-inn", { visited: { "home-inn": true } }), "completed");
  assert.equal(map.resolveState("home-inn", {}), "available");

  assert.deepEqual(
    { ...map.getAction("entrance", {}) },
    { label: "入口へ行く", locationKey: "entrance" },
  );
  assert.deepEqual(
    { ...map.getAction("home-inn", { stageProgress: { homeInn: { phase: "practice" } } }) },
    { label: "続きを始める", locationKey: "home-inn" },
  );
});

test("every destination supplies map copy and a bounded percentage position", () => {
  const map = loadMap();

  for (const place of map.destinations) {
    assert.match(place.name, /[\u3000-\u9fff\uf900-\ufaff]/u);
    assert.ok(place.story.length >= 20, place.key + " needs a story reason");
    assert.ok(place.focus.length >= 15, place.key + " needs an interaction summary");
    assert.ok(place.position.x >= 5 && place.position.x <= 95, place.key + " x is outside the map");
    assert.ok(place.position.y >= 5 && place.position.y <= 95, place.key + " y is outside the map");
  }

  assert.equal(map.getDestination("missing"), null);
});

test("the page provides one semantic map selection and inline detail surface", () => {
  const html = read("index.html");

  assert.match(html, /id="map-scene"/);
  assert.match(html, /id="map-destinations"/);
  assert.match(html, /id="map-detail"[^>]*aria-live="polite"/);
  assert.match(html, /id="map-detail-status"/);
  assert.match(html, /id="map-detail-name"/);
  assert.match(html, /id="map-detail-story"/);
  assert.match(html, /id="map-detail-focus"/);
  assert.match(html, /id="map-detail-action"/);
});

test("map selection is separate from navigation and preparing places expose no action", () => {
  const app = read("app.js");

  assert.match(app, /LanternAlleyMap\.destinations\.forEach/);
  assert.match(app, /selectMapDestination/);
  assert.match(app, /setAttribute\("aria-pressed"/);
  assert.match(app, /LanternAlleyMap\.getAction/);
  assert.match(app, /mapDetailAction\.style\.display = action \? "inline-flex" : "none"/);
  assert.match(app, /enterLocation\(action\.locationKey\)/);
});

test("the illustrated map keeps visible adaptive destinations without legacy graph furniture", () => {
  const css = read("styles.css");
  const artwork = new URL("./assets/map/lantern-alley-map-v1.jpg", import.meta.url);

  assert.equal(existsSync(artwork), true, "the approved map artwork must be project-owned");
  assert.match(css, /assets\/map\/lantern-alley-map-v1\.jpg/);
  assert.match(css, /\.map-scene[\s\S]*aspect-ratio:3\/2/);
  assert.match(css, /\.map-destination\[aria-pressed="true"\]/);
  assert.match(css, /\.map-destination[\s\S]*min-width:44px[\s\S]*min-height:44px/);
  assert.doesNotMatch(css, /\.map-svg|\.node-circle/);
});

test("opening the map resets the page so its header is not clipped on a phone", () => {
  const app = read("app.js");
  const showMap = app.slice(app.indexOf("function showMap()"), app.indexOf("function renderMap()"));

  assert.match(showMap, /window\.scrollTo\(\{top:0,left:0,behavior:"auto"\}\)/);
});

test("わが家 is a place on the map, never a lesson", () => {
  const map = loadMap();
  const home = map.getDestination("home");
  assert.ok(home, "the home is on the map");
  assert.equal(home.kind, "home", "it is marked as not a lesson");
  assert.equal(home.playableLocationKey, "home");

  // Roughly central, so it sits among the places rather than after them.
  assert.ok(home.position.x > 35 && home.position.x < 65, "x is central: " + home.position.x);
  assert.ok(home.position.y > 30 && home.position.y < 60, "y is central: " + home.position.y);

  // It has its own state, so it never reads as unvisited or half-finished.
  assert.equal(map.resolveState("home", {}), "home");
  assert.equal(map.resolveState("home", { visited: { home: true } }), "home");
  assert.equal(map.stateLabels.home, "わが家");

  // And its own way in, whatever the learner has or has not mastered.
  const action = map.getAction("home", {});
  assert.ok(action, "there is always a way home");
  assert.equal(action.locationKey, "home");
  assert.equal(action.label, "部屋へ帰る");
});

test("going home is never gated on understanding", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // Coins may unlock what goes inside the room. Nothing about the mastery
  // gauge decides whether a learner may go home - gating the reward on the
  // thing it rewards would be circular.
  assert.match(app, /if\(place && place\.kind === "home"\) return true;/);
  // And it is not one of the ordered stages, so it cannot block the next place
  // or be blocked by the last one.
  const order = /var STAGE_ORDER = \[([^\]]+)\]/.exec(app);
  assert.ok(order, "the stage order exists");
  assert.doesNotMatch(order[1], /"home"/, "the home is not a stage in the progression");
});

test("the home uses layered raster scenes with movable slots", () => {
  const room = readFileSync(new URL("./home-room.js", import.meta.url), "utf8");
  assert.match(room, /open-house-yard-v1\.webp/);
  assert.match(room, /starter-room-v1\.webp/);
  assert.match(room, /function scenes/);
  assert.match(room, /function slots/);
});
