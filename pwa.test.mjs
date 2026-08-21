import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (name) => readFileSync(new URL("./" + name, import.meta.url), "utf8");

test("every file the service worker pre-caches actually exists", () => {
  const sw = read("sw.js");
  const listed = [...sw.matchAll(/"\.\/([^"]+)"/g)].map((m) => m[1]).filter(Boolean);
  assert.ok(listed.length > 10, "expected a populated shell list");

  // cache.addAll rejects if any single entry 404s, which silently disables
  // offline support - so a missing file here is a real outage, not a nitpick.
  for (const rel of listed) {
    assert.equal(
      existsSync(new URL("./" + rel, import.meta.url)),
      true,
      `sw.js pre-caches "${rel}" but it is missing from disk`,
    );
  }
});

test("the manifest is valid and its icons exist", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));

  assert.equal(manifest.name, "Lantern Alley");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.start_url, "start_url is required for installation");
  assert.equal(manifest.background_color, manifest.theme_color);

  for (const icon of manifest.icons) {
    assert.equal(
      existsSync(new URL("./" + icon.src, import.meta.url)),
      true,
      `manifest lists ${icon.src} but it is missing`,
    );
  }

  // Android crops icons; without a maskable one it pads the "any" icon badly.
  assert.ok(
    manifest.icons.some((icon) => icon.purpose === "maskable"),
    "at least one maskable icon is required",
  );
});

test("the page links the manifest, iOS tags, and registers the worker", () => {
  const html = read("index.html");

  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /name="viewport"[^>]*width=device-width/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.match(html, /apple-mobile-web-app-capable/);
  assert.match(html, /navigator\.serviceWorker\.register\("sw\.js"\)/);

  // file:// has no service worker; registration must be guarded, not thrown.
  assert.match(html, /location\.protocol\.indexOf\("http"\) === 0/);
});

test("the shell list covers the scripts index.html actually loads", () => {
  const html = read("index.html");
  const sw = read("sw.js");
  const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

  assert.ok(scripts.length >= 4);
  for (const src of scripts) {
    assert.ok(sw.includes('"./' + src + '"'), `sw.js does not pre-cache ${src}`);
  }
});
