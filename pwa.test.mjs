import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

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

test("every pre-rendered audio clip exists and is reachable offline", () => {
  const indexJs = read("audio-index.js");
  const map = JSON.parse(indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1));
  const lines = Object.keys(map);

  assert.ok(lines.length > 20, "expected a clip for every spoken line");

  for (const line of lines) {
    const rel = map[line];
    assert.match(rel, /^assets\/audio\/[0-9a-f]{12}\.mp3$/, `odd clip path for "${line}"`);
    assert.equal(existsSync(new URL("./" + rel, import.meta.url)), true, `missing clip: ${rel}`);
  }

  // The worker imports this same file to build its pre-cache list, so the
  // paths cannot drift apart. That only works if it assigns to `self`.
  assert.match(indexJs, /^self\.LanternAlleyAudio = /m);
  assert.match(read("sw.js"), /importScripts\("\.\/audio-index\.js"\)/);
});

test("spoken Japanese in the stage data has a clip", () => {
  const indexJs = read("audio-index.js");
  const map = JSON.parse(indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1));
  const stage = read("n2-home-inn-stage.js");

  // Every jp: request the player hears must be pre-rendered; a gap here means
  // that line silently falls back to whatever voice the device happens to have.
  const requests = [...stage.matchAll(/\bjp:"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(requests.length >= 5);
  for (const jp of requests) {
    assert.ok(map[jp], `no audio clip for request: ${jp}`);
  }
});

test("every spoken Entrance tutorial line uses a pre-rendered clip", () => {
  const indexJs = read("audio-index.js");
  const map = JSON.parse(indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1));
  const context = {};
  vm.createContext(context);
  vm.runInContext(read("entrance-stage-logic.js"), context);

  const entrance = context.LanternAlleyLogic;
  let state = entrance.createTutorial();
  const spoken = [entrance.getTutorialStep(state).jp];
  state = entrance.advanceTutorial(state);
  spoken.push(entrance.getTutorialStep(state).jp);
  state = entrance.advanceTutorial(state);
  spoken.push(entrance.getTutorialStep(state).jp);
  state = entrance.completeTutorial(state);
  spoken.push(entrance.getTutorialStep(state).jp);

  assert.equal(spoken.length, 4);
  for (const jp of spoken) {
    assert.ok(map[jp], `Entrance falls back to device speech for: ${jp}`);
  }
});

test("audio generation collects the Entrance tutorial lines", () => {
  const result = spawnSync(process.execPath, ["collect-spoken-lines.js"], {
    cwd: new URL(".", import.meta.url),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const collected = JSON.parse(result.stdout);

  const context = {};
  vm.createContext(context);
  vm.runInContext(read("entrance-stage-logic.js"), context);
  const entrance = context.LanternAlleyLogic;
  let state = entrance.createTutorial();
  const spoken = [entrance.getTutorialStep(state).jp];
  state = entrance.advanceTutorial(state);
  spoken.push(entrance.getTutorialStep(state).jp);
  state = entrance.advanceTutorial(state);
  spoken.push(entrance.getTutorialStep(state).jp);
  state = entrance.completeTutorial(state);
  spoken.push(entrance.getTutorialStep(state).jp);

  for (const jp of spoken) {
    assert.ok(collected.includes(jp), `audio generation omitted Entrance line: ${jp}`);
  }
});

test("Kon's spoken replies have clips, not just the requests", () => {
  const indexJs = read("audio-index.js");
  const map = JSON.parse(indexJs.slice(indexJs.indexOf("{"), indexJs.lastIndexOf("}") + 1));
  const context = {};
  vm.createContext(context);
  vm.runInContext(read("moonview-inn-interactions.js"), context);
  vm.runInContext(read("n2-home-inn-stage.js"), context);
  const stage = context.N2HomeInnStage;

  // Praise and correction are spoken too. Without clips they came out in the
  // device voice, so Kon sounded like a different character mid-encounter.
  for (const item of [...stage.encounters, ...stage.practice, ...stage.challenge]) {
    for (const correct of [true, false]) {
      const line = stage.getKonResponse(item, correct);
      assert.ok(map[line], `no clip for Kon's ${correct ? "praise" : "correction"}: ${line}`);
    }
  }
});

test("advancing waits for speech instead of a fixed delay", () => {
  const app = read("app.js");
  // A 1.1s timer cut Kon off mid-sentence; the clip must finish first.
  assert.match(app, /clip\.addEventListener\("ended", onDone\)/);
  assert.match(app, /window\.speechSynthesis\.speaking/);
  // and a stall must never strand the learner
  assert.match(app, /setTimeout\(onDone, 20000\)/);
});

test("playback prefers the clip and falls back to speech synthesis", () => {
  const app = read("app.js");
  assert.match(app, /function playClip/);
  assert.match(app, /if\(playClip\(text, mode\)\) return;/);
  assert.match(app, /speakWithSynthesis\(text, mode\)/);
  // iOS blocks autoplay before a gesture; that rejection must fall back, not fail silently.
  assert.match(app, /started\.catch/);
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

test("the game screen separates context from the answer workspace", () => {
  const html = read("index.html");
  const regions = ["stage-bar", "learning-context", "answer-workspace"];

  for (const name of regions) {
    assert.equal(
      (html.match(new RegExp(`class="${name}(?:"| )`, "g")) || []).length,
      1,
      `${name} must appear exactly once`,
    );
  }

  assert.ok(html.indexOf('class="stage-bar') < html.indexOf('class="learning-context'));
  assert.ok(html.indexOf('class="learning-context') < html.indexOf('class="answer-workspace'));
  for (const id of ["jp-line", "scene", "feedback-row", "btn-next"]) {
    assert.equal((html.match(new RegExp(`id="${id}"`, "g")) || []).length, 1);
  }
});

test("the stage shell adapts from split workspace to sticky mobile request", () => {
  const css = read("styles.css");
  assert.match(css, /\.stage\{[^}]*max-width:1100px/);
  assert.match(css, /\.game-layout\{[^}]*display:grid/);
  assert.match(css, /grid-template-columns:minmax\(300px,38fr\) minmax\(0,62fr\)/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(min-width:761px\) and \(max-height:800px\)/);
  assert.match(css, /\.learning-context\{display:contents\}/);
  assert.match(css, /\.learning-context \.dialogue\{[^}]*position:sticky/);
});

test("each interaction uses the adaptive answer workspace", () => {
  const css = read("styles.css");
  assert.match(css, /\.answer-workspace \.scene\{[^}]*background:transparent[^}]*border:0/);
  assert.match(css, /\.answer-workspace \.inn-replies/);
  assert.match(css, /\.answer-workspace \.schedule-controls/);
  assert.match(css, /\.answer-workspace \.duo-stage/);
});

test("the shared object room uses a compact destination and material grid", () => {
  const css = read("styles.css");
  assert.match(css, /\.answer-workspace \.inn-room,.answer-workspace \.inn-workspace\{min-height:0/);
  assert.match(css, /\.answer-workspace \.inn-scene-zones\{[^}]*minmax\(104px,1fr\)/);
  assert.match(css, /\.answer-workspace \.inn-tray\{[^}]*gap:8px/);
});

test("objects inside a zone flow above its caption instead of covering it", () => {
  const css = read("styles.css");
  // position:absolute put the object over the label, so "タオル掛け" rendered
  // as "タオル…" with an icon on top of it.
  assert.match(css, /\.inn-drop-zone > \.inn-placed-object\{[^}]*position:static/);
  assert.doesNotMatch(css, /\.inn-drop-zone > \.inn-placed-object\{[^}]*position:absolute/);
  // and the zone has to be tall enough to hold both
  assert.match(css, /\.inn-drop-zone:has\(\.inn-placed-object\)\{[^}]*min-height/);
});
