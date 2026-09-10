import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Sample real surfaces in the 1200x669 room painting. This catches a mask
// crossing a doorway/post, as well as a missing mask reverting to a rectangle.
function covers(x, y, evening = false) {
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  const rule = css.match(evening
    ? /\.light-night \.home-wallpaper\s*\{([^}]+)\}/
    : /\.home-wallpaper\s*\{([^}]+)\}/)?.[1] || "";
  const url = rule.match(/mask-image:\s*url\("([^"]+)"\)/);
  if (!url) return y < 669 * 0.7;
  const svg = url[1].startsWith("data:image/svg+xml,")
    ? decodeURIComponent(url[1].slice("data:image/svg+xml,".length))
    : readFileSync(new URL(url[1], import.meta.url), "utf8");
  const polygons = [...svg.matchAll(/<polygon points="([^"]+)"/g)];
  const inside = polygons.some(([, points]) => {
    const vertices = points.trim().split(/\s+/).map(p => p.split(",").map(Number));
    let hit = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const [ax, ay] = vertices[i], [bx, by] = vertices[j];
      if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) hit = !hit;
    }
    return hit;
  });
  const handle = [...svg.matchAll(/<ellipse cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)" ry="([\d.]+)"/g)]
    .some(([, cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1);
  return inside && !handle;
}

test("wallpaper stays off framing, shoji, openings, lamps, handles and tatami", () => {
  for (const [name, x, y] of [
    ["ceiling", 600, 35], ["beam", 600, 180], ["left post", 338, 310],
    ["right post", 860, 310], ["rear shoji", 550, 310],
    ["left doorway", 145, 310], ["right doorway", 955, 310],
    ["left window", 220, 310], ["right window", 1040, 310],
    ["lantern", 410, 140], ["door handle", 458, 350], ["tatami", 600, 530]
  ]) assert.equal(covers(x, y), false, name);
});

test("wallpaper still covers each solid sliding-door paper panel", () => {
  for (const x of [60, 305, 410, 790, 895, 1150]) {
    assert.equal(covers(x, 280), true, `paper panel at x=${x}`);
  }
});

test("evening wallpaper follows the lower panels without crossing handles or the sill", () => {
  assert.equal(covers(410, 465, true), true, "lower evening paper");
  assert.equal(covers(458, 357, true), false, "evening handle");
  assert.equal(covers(410, 195, true), false, "evening lintel");
  assert.equal(covers(410, 480, true), false, "evening sill");
  assert.equal(covers(550, 310, true), false, "rear shoji");
});
