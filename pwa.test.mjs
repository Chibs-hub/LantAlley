import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
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

  // Check the prompts a player can actually reach rather than every jp: literal
  // in the file. Day 2 now asks a cloze, so the old day-2 request strings stay
  // in the source as unused data, and requiring clips for them would render
  // audio nobody ever hears.
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(read("moonview-inn-interactions.js"), context);
  vm.runInContext(read("n2-home-inn-stage.js"), context);
  const inn = context.N2HomeInnStage;
  const requests = ["learn", "practice", "challenge"]
    .flatMap((phase) => inn.getPhaseItems(phase))
    .map((item) => item.jp);

  assert.ok(requests.length >= 5);
  for (const jp of requests) {
    assert.ok(map[jp], `no audio clip for reachable request: ${jp}`);
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

test("speech completion arms dialogue advancement instead of advancing automatically", () => {
  const app = read("app.js");
  assert.match(app, /audio\.addEventListener\("ended", function\(\)/);
  assert.match(app, /dialogueFlow\.voiceFinished\(\)/);
  assert.match(app, /dialogueFlow\.setContinuation\(once\)/);
  assert.doesNotMatch(app, /setTimeout\(onDone, 20000\)/);

  // Waiting only on the voice stranded the player: a correct answer hid the
  // Continue button, and if the clip never reported finishing - blocked
  // autoplay, a muted tab, a missing file - nothing advanced. Both the
  // fallback advance and the restored button must stay.
  assert.match(app, /setTimeout\(once, \(fallbackDelay \|\| 2600\) \+ 6000\)/);
  assert.match(app, /\$\("next-row"\)\.style\.display = "block";\s*\}, delay \+ 2500\)/);
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

test("the illustrated room artwork is available offline", () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(read("n2-home-inn-stage.js"), context);
  const visual = context.N2HomeInnStage.encounters[0].interaction.room.visual;
  const sw = read("sw.js");

  for (const asset of [visual.background, visual.spriteSheet, ...Object.values(visual.assets || {})]) {
    assert.ok(sw.includes('"./' + asset + '"'), "sw.js does not pre-cache " + asset);
  }
});

test("the illustrated alley map and destination model are available offline", () => {
  const sw = read("sw.js");

  assert.ok(sw.includes('"./lantern-map.js"'), "sw.js does not pre-cache the map model");
  assert.ok(
    sw.includes('"./assets/map/lantern-alley-map-v1.jpg"'),
    "sw.js does not pre-cache the map artwork",
  );
});

test("the illustrated Entrance scene and learner poses are available offline", () => {
  const sw = read("sw.js");

  for (const asset of [
    "assets/entrance/wooden-gate-v1.webp",
    "assets/entrance/player-actions-v1.webp",
  ]) {
    assert.ok(sw.includes('"./' + asset + '"'), "sw.js does not pre-cache " + asset);
  }
});

test("the self-contained artifact embeds the selectable alley map", () => {
  const artifact = read("lantern-alley-artifact.html");
  const mapAsset = "assets/map/lantern-alley-map-v1.jpg";
  const encoded = readFileSync(new URL("./" + mapAsset, import.meta.url)).toString("base64");

  for (const name of ["路地の入口", "月見宿", "灯り市", "夕月茶屋", "路地駅", "灯守神社"]) {
    assert.ok(artifact.includes(name), "artifact omits map destination " + name);
  }
  assert.match(artifact, /id="map-detail"[^>]*aria-live="polite"/);
  assert.match(artifact, /LanternAlleyMap\.destinations/);
  assert.ok(artifact.includes(encoded), "artifact does not embed the exact map artwork");
  assert.doesNotMatch(artifact, /assets\/map\/lantern-alley-map-v1\.jpg/);
});

test("the offline delivery contains the cinematic opening, Entrance, and room lighting", () => {
  const sw = read("sw.js");
  const artifact = read("lantern-alley-artifact.html");

  assert.match(sw, /lantern-alley-v88/);
  for (const pose of [
    "fox-neutral-idle-transparent-v2.webp",
    "fox-wave-closed-smile-transparent-v2.webp",
    "fox-wave-small-open-mouth-transparent-v2.webp",
    "fox-wave-konnichiwa-mouth-transparent-v2.webp",
    "fox-invite-bow-transparent-v2.webp",
    "fox-celebration-transparent-v2.webp",
    "fox-try-again-transparent-v2.webp",
    "fox-listening-transparent-v2.webp"
  ]) {
    assert.ok(sw.includes("./assets/fox/" + pose), "offline shell omits " + pose);
  }
  assert.match(artifact, /id="screen-title" class="frame title-scene"/);
  assert.match(artifact, /id="btn-start">路地へ入る<\/button>/);
  assert.match(artifact, /id="entrance-progress"/);
  assert.match(artifact, /getTutorialProgress/);
  assert.match(artifact, /action-bow \.entrance-player-art\{background-position:33\.333% center;animation:player-pose-pop 1\.2s/);
  assert.doesNotMatch(artifact, /var PLAYER_SVG/);
  assert.match(artifact, /getRoomLightState/);
  assert.match(artifact, /room-light-dim/);
  assert.match(artifact, /room-light-bright/);
});

test("the standalone artifact keeps the completed Entrance controls visible on a phone", () => {
  const artifact = read("lantern-alley-artifact.html");

  assert.match(
    artifact,
    /\.entrance-stage\.entrance-complete \.next-row\{position:fixed;left:0;right:0;z-index:20/,
    "the built artifact can clip the Alley button below the phone viewport",
  );
  assert.match(
    artifact,
    /\.entrance-stage\.entrance-complete \.learning-context\{position:fixed;left:8px;right:8px;bottom:calc\(124px/,
    "Kon's final line can cover the completed Entrance controls",
  );
});

test("the self-contained artifact includes the illustrated room", () => {
  const artifact = read("lantern-alley-artifact.html");
  const context = {};
  vm.createContext(context);
  vm.runInContext(read("n2-home-inn-stage.js"), context);
  const visual = context.N2HomeInnStage.encounters[0].interaction.room.visual;
  assert.match(artifact, /inn-room-illustrated/);
  assert.match(artifact, /data:image\/webp;base64,/);
  assert.match(artifact, /window\.addEventListener\("pointermove", move\)/);
  assert.match(artifact, /\.answer-workspace \.inn-room-illustrated \.inn-hotspot:has\(\.inn-caption\)/);
  for (const asset of [visual.background, visual.spriteSheet]) {
    const encoded = readFileSync(new URL("./" + asset, import.meta.url)).toString("base64");
    assert.ok(artifact.includes(encoded), "artifact does not embed " + asset);
  }
  assert.doesNotMatch(artifact, /assets\/inn\/room-(?:empty|objects)-v[12]\.png/);
  assert.ok(statSync(new URL("./lantern-alley-artifact.html", import.meta.url)).size < 16 * 1024 * 1024);
});

test("the self-contained artifact includes click-to-finish dialogue", () => {
  const artifact = read("lantern-alley-artifact.html");
  assert.match(artifact, /id="dialogue-panel"/);
  assert.match(artifact, /id="dialogue-continue"/);
  assert.match(artifact, /createDialogueFlow/);
  assert.match(artifact, /dialogueFlow\.setContinuation\(once\)/);
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

test("the shared object room uses an adaptive illustrated interaction surface", () => {
  const css = read("styles.css");
  const app = read("app.js");
  assert.match(app, /function roomSpriteMarkup/);
  assert.match(app, /class="inn-room-art"/);
  assert.match(app, /room\.visual\.hotspots/);
  assert.match(app, /<details class="inn-clue"/);
  assert.match(css, /\.inn-room-viewport\{[^}]*aspect-ratio:3\/2/);
  assert.match(css, /\.inn-room-art\{[^}]*object-fit:cover/);
  assert.match(css, /\.inn-room-illustrated \.inn-scene-zones\{[^}]*position:absolute[^}]*inset:0/);
  assert.match(css, /\.inn-hotspot\{[^}]*position:absolute/);
  assert.match(css, /\.inn-room-illustrated \.inn-tray\{[^}]*display:grid/);
  assert.match(css, /\.inn-room-illustrated \.inn-caption\{[^}]*opacity:0/);
  assert.match(css, /\.inn-room-illustrated [^{]*:focus-visible [^{]*\.inn-caption/);
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(app, /class="inn-room-composite"[^]*class="inn-room-viewport"[^]*class="inn-supply-shelf"/);
  assert.match(css, /\.inn-room-composite\{[^}]*overflow:hidden[^}]*border-radius:/);
  assert.match(css, /\.inn-room-composite > \.inn-room-viewport\{[^}]*border:0[^}]*border-radius:0/);
  assert.match(css, /\.inn-room-composite > \.inn-supply-shelf\{[^}]*border-radius:0/);
  assert.match(css, /\.inn-room-illustrated \.inn-tray\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});

test("the adaptive shelf keeps large photographic objects visible without desktop scrolling", () => {
  const css = read("styles.css");
  const shelf = css.match(/\.inn-room-illustrated \.inn-tray\{([^}]*)\}/);
  assert.ok(shelf, "the illustrated room needs a shelf grid");
  assert.match(shelf[1], /grid-template-columns:repeat\(10,minmax\(44px,1fr\)\)/);
  assert.match(shelf[1], /gap:4px/);
  assert.match(css, /@media\(max-width:620px\)[\s\S]*?\.inn-room-illustrated \.inn-tray\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css, /\.inn-room-illustrated \.inn-object \.inn-sprite\{[^}]*transform:scale\(1\.2\)/);
});

test("illustrated room captions stay out of the picture until requested", () => {
  const css = read("styles.css");
  // position:absolute put the object over the label, so "タオル掛け" rendered
  // as "タオル…" with an icon on top of it.
  assert.match(css, /\.inn-room-illustrated \.inn-object\.selected \.inn-caption/);
  assert.match(css, /\.inn-room-illustrated \.inn-object:focus-visible \.inn-caption/);
  // and the zone has to be tall enough to hold both
  assert.match(css, /\.inn-room-illustrated \.inn-caption\{[^}]*opacity:0/);
  assert.match(css, /\.inn-room-illustrated \.inn-hotspot > \.inn-caption\{[^}]*bottom:calc\(100% \+ 5px\)/);
});

test("placed room sprites keep a visible box inside legacy answer styles", () => {
  const css = read("styles.css");
  assert.match(css, /\.answer-workspace \.inn-room-illustrated \.inn-drop-zone > \.inn-placed-object\{[^}]*width:min\(78%,74px\)/);
  assert.match(css, /\.answer-workspace \.inn-room-illustrated \.inn-drop-zone:has\(\.inn-placed-object\)\{[^}]*min-height:44px/);
});

test("a dragged room object remains visible above every answer surface", () => {
  const css = read("styles.css");
  assert.match(css, /\.inn-object\.dragging\{[^}]*position:fixed[^}]*z-index:[1-9][0-9]{2,}/);
  assert.match(css, /\.inn-room-illustrated \.inn-object\.dragging\{[^}]*position:fixed/);
  assert.doesNotMatch(css, /\.inn-object\.dragging\{[^}]*pointer-events:none/);
  assert.doesNotMatch(css, /\.inn-room-illustrated \.inn-object\.dragging\{[^}]*pointer-events:none/);
});

test("active drag tracking survives pointer capture failure", () => {
  const app = read("app.js");
  assert.match(app, /window\.addEventListener\("pointermove", move\)/);
  assert.match(app, /window\.addEventListener\("pointerup", finish\)/);
  assert.match(app, /window\.removeEventListener\("pointermove", move\)/);
  assert.match(app, /window\.removeEventListener\("pointerup", finish\)/);
});

test("both illustrated mats remain recognizable before an object is selected", () => {
  const css = read("styles.css");
  assert.match(css, /\.inn-room-illustrated \.mat-zone\{[^}]*border:[^}]*background:/);
  assert.match(css, /\.inn-room-illustrated \.mat-zone:after\{[^}]*border:/);
});

test("compact illustrated hotspots keep their mapped bounds instead of overlapping", () => {
  const css = read("styles.css");
  assert.match(css, /\.answer-workspace \.inn-room-illustrated \.inn-hotspot:has\(\.inn-caption\)\{[^}]*min-width:0[^}]*min-height:0/);
});
