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

test("the alley exposes six destinations and every one of them is playable", () => {
  const map = loadMap();

  assert.deepEqual(
    Array.from(map.destinations, (place) => place.key),
    ["entrance", "home-inn", "market", "tea-house", "station", "shrine"],
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
