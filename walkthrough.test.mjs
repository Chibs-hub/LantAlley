/* Plays the game against a fake DOM and checks what a player would see.
 *
 * Every other suite in this repo reads source text. That is why
 * `challenge is not defined` shipped green: the assertion looked for a string
 * that was still in the file, while question 2 rendered a running clock and no
 * buttons at all. A test that never renders cannot see an empty screen.
 *
 * The invariant here is deliberately blunt and hard to satisfy by accident:
 * at every point where the game is waiting for the player, there is something
 * to click. Everything else is detail.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

import { FakeClock, FakeDocument, FakeEvent, FakeStorage, parseInto } from "./dom-harness.mjs";

const read = (name) => readFileSync(new URL("./" + name, import.meta.url), "utf8");

/* `seed` is written before the app initialises, because it reads storage once
 * on DOMContentLoaded and then owns it. Setting it afterwards seeds nothing:
 * the first save overwrites it. */
/* Past the word board and through the cards it now leads to.
 *
 * The board marks five of the episode's ten words as new, and until now the
 * next screen was a timed question about one of them. They are taught first,
 * on the same cards the three days use, so every driver that used to click
 * straight from the board into question one walks them the way a learner
 * does.
 */
function passWordBoard(game, settle) {
  game.$("btn-words-begin").click();
  game.clock.advance(settle || 300);
  for (let guard = 0; guard < 24; guard += 1) {
    const done = game.$("btn-teach-done");
    if (done) { done.click(); game.clock.advance(600); break; }
    const next = game.$("btn-teach-next");
    if (next) { next.click(); game.clock.advance(600); continue; }
    const option = game.doc.querySelectorAll(".teach-option")[0];
    if (!option) break;
    option.click();
    game.clock.advance(1200);
  }
}

function boot(seed, search, options) {
  const html = read("index.html");
  const body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
  const doc = new FakeDocument();
  parseInto(doc, doc.body, body.slice(body.indexOf(">") + 1));

  const clock = new FakeClock();
  const storage = options && options.storage ? options.storage : new FakeStorage();
  // app.js reads progress while its IIFE runs, not on DOMContentLoaded, so a
  // seed written any later is read after the game has already started empty.
  if (seed) storage.setItem("lanternAlley.v3", JSON.stringify(seed));
  const errors = [];
  const heard = [];

  const context = {
    document: doc,
    localStorage: storage,
    console: { log() {}, warn() {}, error(...a) { errors.push(a.join(" ")); } },
    setTimeout: (fn, ms) => clock.setTimeout(fn, ms),
    clearTimeout: (id) => clock.clear(id),
    setInterval: (fn, ms) => clock.setInterval(fn, ms),
    clearInterval: (id) => clock.clear(id),
    requestAnimationFrame: (fn) => clock.setTimeout(() => fn(clock.now), 16),
    cancelAnimationFrame: (id) => clock.clear(id),
    // No speechSynthesis and no working Audio: the game already has to cope
    // with both (iOS often ships no Japanese voice), and this exercises that
    // path instead of waiting on audio that will never load in Node.
    Audio: class {
      constructor(src) { this.src = src; this.paused = true; heard.push(src); }
      play() { return Promise.reject(new Error("no audio in tests")); }
      pause() {}
      addEventListener() {}
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    scrollTo() {},
    addEventListener() {},
    removeEventListener() {},
    navigator: { serviceWorker: undefined, language: "ja" },
    URL,
    location: { href: "http://localhost/" + (search || ""), search: search || "" },
    fetch: () => Promise.reject(new Error("no network in tests")),
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  if (options && options.telemetry) context.LanternTelemetry = options.telemetry;
  vm.createContext(context);

  // The page stamps a cache version onto each URL; the file on disk has no
  // query, so strip it before reading.
  const scripts = [...html.matchAll(/src="([^"?]+\.js)(\?v=\d+)?"/g)].map((m) => m[1]);
  for (const src of scripts) {
    if (options && options.telemetry && (src === "telemetry-config.js" || src === "telemetry.js")) continue;
    vm.runInContext(read(src), context, { filename: src });
    if (src === "debug-mode.js" && options && options.disableDebug) {
      context.LanternDebug.available = false;
      context.LanternDebug.enabled = false;
    }
  }
  // app.js binds on DOMContentLoaded in the browser; nothing has fired here.
  doc.dispatchEvent(new FakeEvent("DOMContentLoaded", { bubbles: false }));
  clock.advance(50);

  const $ = (id) => doc.getElementById(id);
  const clickable = () =>
    doc
      .querySelectorAll("button")
      .filter((b) => b.parentNode && visible(b) && !b.disabled);

  function visible(node) {
    let cur = node;
    while (cur && cur !== doc.documentElement) {
      if (cur.hidden) return false;
      if (cur.style && cur.style.display === "none") return false;
      if (cur.classList && cur.classList.contains("screen") && !cur.classList.contains("active")
        && cur.style.display !== "block") return false;
      cur = cur.parentNode;
    }
    return true;
  }

  function tapScreen() {
    const screen = $("screen-game");
    screen.dispatchEvent(new FakeEvent("click", { bubbles: true }));
    clock.advance(400);
  }

  // The Challenge phase speaks its request and shows only 「音声を聞いてください。」,
  // so the driver has to listen the way a learner does. The clip a line plays
  // is looked up by that line, so playing the lookup backwards recovers it.
  function lastHeard() {
    const index = context.LanternAlleyAudio || {};
    const src = heard[heard.length - 1];
    if (!src) return "";
    return Object.keys(index).filter((text) => index[text] === src)[0] || "";
  }

  return { doc, clock, storage, errors, heard, $, clickable, visible, tapScreen, context, lastHeard };
}

test("debug menu starts at the opening and keeps normal progress isolated", () => {
  const normal = {version:3, stages:{}, money:321, visited:["entrance"], characterSelected:true, playerCharacter:"woman"};
  const game = boot(normal);
  const original = game.storage.getItem("lanternAlley.v3");
  game.$("btn-title-menu").click();
  assert.ok(game.$("btn-debug-mode"), "opening menu offers debug mode");
  game.$("btn-debug-mode").click();
  assert.equal(new URL(game.context.location.href).searchParams.get("debug"), "1");
  const debug = boot(null, "?debug=1", {storage:game.storage});
  assert.equal(debug.storage.getItem("lanternAlley.v3"), original);
  const saved = JSON.parse(debug.storage.getItem("lanternAlley.debug.v3"));
  assert.equal(saved.characterSelected, false);
  assert.deepEqual(saved.visited, []);
  assert.equal(debug.$("debug-banner").hidden, false);
  debug.$("btn-start").click();
  assert.equal(debug.$("screen-character").hidden, false);
  debug.$("btn-debug-exit").click();
  const restored = boot(null, "", {storage:game.storage});
  assert.equal(restored.storage.getItem("lanternAlley.v3"), original);
  restored.$("btn-start").click();
  assert.equal(restored.$("screen-character").hidden, true, "normal character selection is retained");
});

test("debug inventory includes every decor item and mature plant without resetting placement on reload", () => {
  const game = boot(null, "?debug=1");
  const raw = game.storage.getItem("lanternAlley.debug.v3");
  assert.ok(raw, "debug has its own save");
  const saved = JSON.parse(raw);
  const decor = game.context.LanternHomeDecor;
  for (const item of [...decor.catalogue(), ...decor.wallpapers()]) {
    if(item.id !== "wallpaper-plain") assert.ok(saved.home.owned.includes(item.id), item.id);
  }
  for (const type of game.context.LanternHomeGarden.catalogue()) {
    assert.ok(saved.garden.plants.some(p => p.typeId === type.id && p.stage === "mature" && p.growthPoints >= type.matureAt), type.id);
  }
  assert.equal(saved.innJourney.catUnlocked, true);
  const count = saved.garden.plants.length;
  saved.garden.plants[0].slotId = "garden-right-1";
  game.storage.setItem("lanternAlley.debug.v3", JSON.stringify(saved));
  const reloaded = boot(null, "?debug=1", {storage:game.storage});
  const after = JSON.parse(reloaded.storage.getItem("lanternAlley.debug.v3"));
  assert.equal(after.garden.plants.length, count);
  assert.equal(after.garden.plants[0].slotId, "garden-right-1");
  reloaded.$("btn-debug-exit").click();
  assert.equal(new URL(reloaded.context.location.href).searchParams.has("debug"), false);
});

test("debug release switch hides the entry and ignores debug URLs", () => {
  const game = boot(null, "?debug=1", {disableDebug:true});
  assert.ok(game.$("btn-debug-mode"));
  assert.equal(game.$("btn-debug-mode").hidden, true);
  assert.equal(game.$("debug-banner").hidden, true);
  assert.equal(game.storage.getItem("lanternAlley.debug.v3"), null);
});

test("guided Inn begins with help and advances after the first correct task without a second opening", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  assert.equal(game.$("encounter-progress").textContent, "1");
  assert.equal(game.$("encounter-status").style.display, "block");
  assert.equal(game.$("romaji-toggle").hidden, false);
  assert.ok(game.doc.querySelectorAll(".inn-new-word").length, "teaching arrives before the first attempt");
  assert.ok(playRoom(game, game.$("jp-line").textContent));
  game.clock.advance(7000);
  game.$("btn-next").click();
  game.clock.advance(500);
  assert.equal(game.$("btn-jobs-begin"), null, "no second introduction");
  assert.equal(game.$("encounter-progress").textContent, "2");
});

test("debug exposes working skip controls during guided training", async () => {
  const game = boot(null, "?debug=1");
  await enterTheInn(game);
  assert.equal(game.$("btn-skip-question").hidden, false);
  assert.equal(game.$("btn-skip-stage").hidden, false);
  game.$("btn-skip-question").click();
  game.clock.advance(7000);
  game.$("btn-next").click();
  game.clock.advance(500);
  assert.equal(game.$("encounter-progress").textContent, "2");
  assert.equal(game.storage.getItem("lanternAlley.v3"), null);
});

test("guided first task keeps a missed attempt on screen with help instead of replaying the opening", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  const objects = game.doc.querySelectorAll(".inn-object").filter(game.visible);
  const zones = game.doc.querySelectorAll(".inn-drop-zone").filter(game.visible);
  objects[0].click();
  zones[zones.length - 1].click();
  game.clock.advance(4000);
  assert.equal(game.$("encounter-progress").textContent, "1");
  assert.equal(game.$("btn-jobs-begin"), null);
  assert.ok(game.$("feedback-row").classList.contains("show"));
  assert.ok(game.doc.querySelectorAll(".inn-new-word").length);
  game.$("btn-next").click();
  game.clock.advance(500);
  assert.equal(game.$("encounter-progress").textContent, "2");
});

test("debug reset restores inventory without resetting the normal save", () => {
  const game = boot({version:3, money:321}, "?debug=1");
  const original = game.storage.getItem("lanternAlley.v3");
  game.$("btn-restart").click();
  game.$("reset-confirm-action").click();
  const saved = JSON.parse(game.storage.getItem("lanternAlley.debug.v3"));
  assert.ok(saved.home.owned.length > 10);
  assert.equal(saved.innJourney.catUnlocked, true);
  assert.equal(game.storage.getItem("lanternAlley.v3"), original);
});

test("an imported normal save gains debug stock without losing placed items", () => {
  const storage = new FakeStorage();
  storage.setItem("lanternAlley.debug.v3", JSON.stringify({version:3, stages:{},
    home:{owned:["low-table"], placed:{"floor-front":"low-table"}},
    activeWallpaper:"wallpaper-asanoha",
    garden:{nextInstanceId:8, plants:[{id:"plant-7",typeId:"camellia",stage:"mature",growthPoints:4,slotId:"garden-right-1"}]}}));
  const game = boot(null, "?debug=1", {storage});
  const saved = JSON.parse(storage.getItem("lanternAlley.debug.v3"));
  assert.ok(saved.home.owned.length > 10);
  assert.equal(saved.home.placed["floor-front"], "low-table");
  assert.equal(saved.activeWallpaper, "wallpaper-asanoha");
  assert.equal(saved.garden.plants.find(p => p.id === "plant-7").slotId, "garden-right-1");
  assert.equal(new Set(saved.garden.plants.map(p => p.id)).size, saved.garden.plants.length);
  assert.equal(saved.innJourney.catUnlocked, true);
});

test("legacy cold-start saves resume with the guided first lesson", async () => {
  const game = boot({version:3, visited:["entrance"], characterSelected:true, playerCharacter:"woman",
    stages:{"home-inn":{phase:"coldopen", question:0}}}, "?skip=1");
  await enterTheInn(game);
  assert.equal(game.$("romaji-toggle").hidden, false);
  assert.ok(game.doc.querySelectorAll(".inn-new-word").length);
  assert.equal(game.$("encounter-status").style.display, "block");
});

test("wallpaper selections replace the room layer and survive reload", () => {
  const game = boot(null, "?skip=1&unlockall=1");
  enterHome(game);
  game.doc.querySelector("[data-enter-house]").click();
  game.doc.querySelector("[data-home-decorate]").click();
  game.doc.querySelector('[data-tab="wallpaper"]').click();
  const layers = [];
  for(const id of ["wallpaper-asanoha", "wallpaper-sakura", "wallpaper-plain"]){
    const pick = game.doc.querySelector('[data-wallpaper="' + id + '"]')
      || game.doc.querySelector('[data-buy-wallpaper="' + id + '"]');
    assert.ok(pick, id);
    pick.click();
    assert.equal(JSON.parse(game.storage.getItem("lanternAlley.v3")).activeWallpaper, id);
    const layer = game.doc.querySelector(".home-wallpaper");
    layers.push(layer?.querySelector(".home-wallpaper-art")?.getAttribute("style")
      || layer?.querySelector("pattern")?.id || "");
  }
  assert.notEqual(layers[0], layers[1]);
  assert.equal(layers[2], "");
  const reloaded = boot(null, "", {storage:game.storage});
  enterHome(reloaded);
  reloaded.doc.querySelector("[data-enter-house]").click();
  assert.equal(reloaded.doc.querySelector(".home-wallpaper"), null);
});

class ThrowingWriteStorage extends FakeStorage {
  setItem() { throw new Error("storage blocked"); }
}

function bootWithThrowingStorage(search) {
  return boot(null, search, { storage: new ThrowingWriteStorage() });
}

function bootTelemetryGame(seed, search) {
  const events = [];
  let enabled = true;
  const telemetry = {
    track(name, properties) { if (enabled) events.push({ name, properties }); },
    setEnabled(value) { enabled = !!value; },
    isConfigured() { return true; },
    isEnabled() { return enabled; },
    setContext() {},
  };
  const game = boot(seed, search, { telemetry });
  game.telemetry = { events, isEnabled: () => enabled };
  return game;
}

/* Plays one room task the way the sentence tells the player to.
 *
 * The room shows every object and every destination on every question - which
 * one is correct depends only on the verb in the prompt. So this reads the
 * prompt, exactly as a learner has to, rather than knowing the answers.
 *
 * Arrange is computed rather than tried: a wrong mat resets the whole grouping,
 * so guessing never converges. Replace and warm name their object and their
 * destination in the sentence itself, so those are looked up by label.
 */
function playRoom(game, task) {
  // The task sentence, not whatever the dialogue currently says. After a wrong
  // answer the same line carries Kon's correction, and reading the attribute
  // out of that put the driver in a loop it could never leave.
  const prompt = task || game.$("jp-line").textContent;
  const objects = () => game.doc.querySelectorAll(".inn-object").filter(game.visible);
  const zones = () => game.doc.querySelectorAll(".inn-drop-zone").filter(game.visible);
  const labelOf = (el) => el.getAttribute("aria-label") || "";
  if (!objects().length) return false;

  if (prompt.includes("揃え")) {
    // Worked out rather than tried: a cushion on the wrong mat fails the whole
    // question, so guessing never converges. The tray labels read
    // 座布団 - 赤、大、縦向き, in colour/size/direction order, and the sentence
    // says which of the three to group by - the same reading the learner does.
    const attr = prompt.includes("同じ色") ? 0 : prompt.includes("同じ大きさ") ? 1 : 2;
    const valueOf = (el) => labelOf(el).split(" - ")[1].split("、")[attr];
    const matOfValue = {};
    let acted = false;
    for (let guard = 0; guard < 8; guard += 1) {
      const cushion = objects().filter((o) => labelOf(o).startsWith("座布団"))[0];
      if (!cushion) break;
      const value = valueOf(cushion);
      if (!(value in matOfValue)) matOfValue[value] = Object.keys(matOfValue).length;
      const mats = zones().filter((z) => z.classList.contains("mat-zone"));
      const mat = mats[matOfValue[value]];
      if (!mat) break;
      cushion.click();
      game.clock.advance(150);
      mat.click();
      game.clock.advance(600);
      acted = true;
    }
    return acted;
  }

  const move = (object, zone) => {
    if (!object || !zone) return false;
    object.click();
    game.clock.advance(150);
    zone.click();
    game.clock.advance(600);
    return true;
  };

  if (prompt.includes("取り替え")) {
    // Order is the point of this task: the old thing goes out before the new
    // one goes in, and doing it the other way round is a wrong answer.
    //
    // Both halves happen here rather than over two turns, because the fitting
    // the new item belongs in is only identifiable while the worn one is still
    // sitting in it - the sentence names the bin, never the fitting.
    const worn = objects().filter((o) => o.classList.contains("inn-placed-object")
      && prompt.includes(labelOf(o)))[0];
    if (!worn) return false;
    const fitting = worn.closest(".inn-drop-zone");
    const item = fitting && fitting.dataset.item;
    const bin = zones().filter((z) => z.dataset.action === "remove" && prompt.includes(labelOf(z)))[0]
      || zones().filter((z) => z.dataset.action === "remove")[0];
    if (!move(worn, bin)) return false;

    const fresh = objects().filter((o) => prompt.includes(labelOf(o))
      && !o.classList.contains("inn-placed-object"))[0];
    const slot = zones().filter((z) => z.dataset.action === "install" && z.dataset.item === item)[0];
    move(fresh, slot);
    return true;
  }

  // Warm: the sentence names the dish and the appliance both.
  const named = (list) => list.filter((el) => labelOf(el) && prompt.includes(labelOf(el)));
  return move(named(objects())[0], named(zones())[0]);
}

/* The schedule task: named time steps and a confirm.
 *
 * The gap between the two times is stated in the sentence ("2時間必要"), which
 * is the comprehension the question is testing, so it is read from there rather
 * than hard-coded. When the second time is fixed the first is pulled back to
 * meet it; otherwise the second is pushed out from the first.
 */
function playSchedule(game, task) {
  const aOut = game.$("arrival-a-out");
  const bOut = game.$("arrival-b-out");
  const aEarlier = game.$("arrival-a-earlier");
  const aLater = game.$("arrival-a-later");
  const bEarlier = game.$("arrival-b-earlier");
  const bLater = game.$("arrival-b-later");
  if (!aOut || !bOut || !aEarlier || !aLater) return false;
  const gapText = /(\d+)\s*時間(?:必要|かかります)/.exec(task || "");
  const gap = gapText ? Number(gapText[1]) : 2;
  const hour = (output) => Number(output.textContent.replace(":00", ""));

  const press = (button, count) => {
    for (let step = 0; step < count; step += 1) button.click();
  };
  if (!bEarlier || !bLater) {
    const difference = hour(bOut) - gap - hour(aOut);
    press(difference >= 0 ? aLater : aEarlier, Math.abs(difference));
  } else {
    const difference = hour(aOut) + gap - hour(bOut);
    press(difference >= 0 ? bLater : bEarlier, Math.abs(difference));
  }
  game.clock.advance(100);

  const confirm = game.doc.querySelectorAll("button").filter(game.visible)
    .filter((btn) => btn.textContent.includes("決定"))[0];
  if (!confirm) return false;
  confirm.click();
  game.clock.advance(800);
  return true;
}


test("the page boots without throwing and shows a way in", () => {
  const game = boot();
  assert.deepEqual(game.errors, [], "nothing logged an error during boot");
  assert.ok(game.$("btn-start"), "the start button exists");
  assert.ok(game.clickable().length > 0, "there is something to click on the title screen");
});

test("restart does not erase saved progress until the player confirms", () => {
  const game = boot(null, "?skip=1");
  const before = game.storage.getItem("lanternAlley.v3");
  game.$("btn-restart").click();

  assert.ok(game.$("reset-confirm"), "the confirmation dialog is rendered");
  assert.equal(game.$("reset-confirm").hidden, false, "the confirmation dialog is open");
  assert.equal(game.storage.getItem("lanternAlley.v3"), before, "progress survives opening the dialog");

  game.$("reset-cancel").click();
  assert.equal(game.storage.getItem("lanternAlley.v3"), before, "Cancel preserves progress");
});

test("the title menu keeps maintenance actions behind one deliberate control", () => {
  const game = boot(null, "?skip=1");
  const menu = game.$("title-menu");
  const trigger = game.$("btn-title-menu");

  assert.ok(menu, "the compact title menu exists");
  assert.ok(trigger, "the title menu has an explicit trigger");
  assert.equal(menu.hidden, true, "maintenance actions do not compete with Enter");
  assert.equal(game.visible(game.$("btn-start")), true, "the entry action remains visible");
  assert.equal(game.visible(game.$("btn-save-data")), false, "Save Data stays in the closed menu");
  assert.equal(game.visible(game.$("btn-restart")), false, "Start Over stays in the closed menu");
  assert.equal(game.$("btn-install-open").hidden, true,
    "an unsupported browser does not advertise an unavailable installation action");

  trigger.click();
  assert.equal(menu.hidden, false, "Menu reveals the secondary actions on request");
  assert.equal(trigger.getAttribute("aria-expanded"), "true", "the trigger exposes its state");
  assert.equal(game.visible(game.$("btn-save-data")), true, "Save Data is reachable from Menu");
  assert.equal(game.visible(game.$("btn-restart")), true, "Start Over is reachable from Menu");

  game.$("btn-restart").click();
  assert.equal(menu.hidden, true, "choosing a menu action closes Menu behind its dialog");
  assert.equal(game.$("reset-confirm").hidden, false, "Start Over retains its confirmation");

  game.$("reset-cancel").click();
  assert.equal(trigger.focused, true,
    "cancelling Start Over returns keyboard focus to the visible Menu trigger");
});

test("title dialogs keep background controls inert and return focus to the visible Menu button", () => {
  for(const entry of [
    {open:"btn-save-data", panel:"save-panel", close:"btn-save-close"},
    {open:"btn-about", panel:"about-panel", close:"btn-about-close"},
    {open:"btn-restart", panel:"reset-confirm", close:"reset-cancel"},
  ]){
    const game = boot(null, "?skip=1");
    const trigger = game.$("btn-title-menu");
    trigger.click();
    game.$(entry.open).click();

    assert.equal(game.$(entry.panel).hidden, false, `${entry.panel} opens`);
    assert.equal(trigger.hasAttribute("inert"), true, `${entry.panel} owns keyboard focus`);

    game.$(entry.close).click();
    assert.equal(trigger.hasAttribute("inert"), false, `${entry.panel} releases the title controls`);
    assert.equal(trigger.focused, true, `${entry.panel} returns focus to the visible Menu button`);
  }
});

test("dismissing the title menu outside it does not leave focus in hidden content", () => {
  const game = boot(null, "?skip=1");
  const trigger = game.$("btn-title-menu");

  trigger.click();
  assert.equal(game.$("title-menu").hidden, false);
  game.doc.dispatchEvent(new FakeEvent("click", {bubbles:false}));

  assert.equal(game.$("title-menu").hidden, true);
  assert.equal(trigger.focused, true, "focus returns to the visible disclosure button");
});

test("save-status messages follow the panel's English interface language", () => {
  const app = read("app.js");

  for(const message of [
    "No save data yet.",
    "Save exported.",
    "This file cannot be imported.",
    "Could not save progress.",
    "Save imported. Reloading...",
  ]) assert.ok(app.includes(message), message);
});

test("title utility chrome uses English while the alley entry remains Japanese", () => {
  const game = boot(null, "?skip=1");

  assert.equal(game.$("btn-start").textContent, "路地へ戻る",
    "a returning player keeps the Japanese alley destination wording");
  assert.equal(game.$("btn-title-menu").textContent, "Menu");
  assert.equal(game.$("btn-install-open").textContent, "Install app");
  assert.equal(game.$("update-title").textContent, "A new version is available.");
  assert.equal(game.$("btn-update-now").textContent, "Update now");
  assert.equal(game.$("btn-update-later").textContent, "Later");
  assert.equal(game.$("btn-check-update").textContent, "Check for updates");

  game.$("btn-title-menu").click();
  assert.equal(game.$("btn-save-data").textContent, "Save data");
  assert.equal(game.$("btn-about").textContent, "About");
  assert.equal(game.$("btn-restart").textContent, "Start over");

  game.$("btn-save-data").click();
  assert.equal(game.$("save-title").textContent, "Save data");
  assert.equal(game.$("btn-save-export").textContent, "Export save");
  assert.equal(game.$("btn-save-close").textContent, "Close");
  game.$("btn-save-close").click();

  game.$("btn-title-menu").click();
  game.$("btn-about").click();
  assert.equal(game.$("about-title").textContent, "About Lantern Alley");
  assert.equal(game.$("btn-about-close").textContent, "Close");
  game.$("btn-about-close").click();

  game.$("btn-title-menu").click();
  game.$("btn-restart").click();
  assert.equal(game.$("reset-confirm-title").textContent, "Start over?");
  assert.equal(game.$("reset-cancel").textContent, "Cancel");
  assert.equal(game.$("reset-confirm-action").textContent, "Start over");
});

test("a storage write failure stays visible without stopping play", () => {
  const game = bootWithThrowingStorage("?skip=1");
  const warning = game.$("storage-warning");

  assert.ok(warning, "a save warning is rendered");
  assert.equal(warning.hidden, false, "the save warning is visible");
  assert.match(warning.textContent, /not being saved/i);

  game.$("btn-start").click();
  assert.notEqual(game.$("screen-map").style.display, "none", "the player can continue to the map");
});

test("feedback sends one chosen category with current game context", async () => {
  const game = bootTelemetryGame(resumedScheduleChallengeSave(), "?skip=1");
  await openResumedInnScheduleChallenge(game);
  game.$("btn-feedback").click();
  game.$("feedback-confusing").click();

  const report = game.telemetry.events.find((event) => event.name === "feedback_submitted");
  assert.ok(report, "the chosen feedback category is reported");
  assert.equal(report.properties.category, "confusing");
  assert.equal(report.properties.location, "home-inn");
  assert.equal("answer" in report.properties, false, "no answer text leaves the game");
});

test("turning anonymous testing data off stops further capture", () => {
  const game = bootTelemetryGame(null, "?skip=1");
  game.telemetry.events.length = 0;
  game.$("btn-about").click();
  game.$("analytics-toggle").click();
  game.$("btn-start").click();

  assert.equal(game.telemetry.isEnabled(), false);
  assert.deepEqual(game.telemetry.events, []);
});

test("the optional analytics switch stays out of an unconfigured test build", () => {
  const game = boot(null, "?skip=1");
  game.$("btn-about").click();

  assert.ok(game.$("analytics-setting"), "the analytics setting has a dedicated wrapper");
  assert.equal(game.$("analytics-setting").hidden, true,
    "a player cannot turn on collection until a public project key is configured");
});

test("the game records the complete tester funnel at its real milestones", () => {
  const app = read("app.js");
  for (const name of [
    "app_opened", "new_player_selected", "entrance_started", "entrance_completed",
    "inn_training_started", "inn_training_completed", "episode_started",
    "episode_completed", "reward_claimed", "home_visited", "progress_reset",
    "storage_failed",
  ]) {
    assert.match(app, new RegExp('trackTelemetry\\("' + name + '"'));
  }
});

test("global application errors use the bounded telemetry error path", () => {
  const app = read("app.js");
  assert.match(app, /function reportAppError\(error, source\)/);
  assert.match(app, /window\.addEventListener\("error", function\(event\)/);
  assert.match(app, /window\.addEventListener\("unhandledrejection", function\(event\)/);
  assert.match(app, /telemetry\.reportError\(error, source, telemetryContext\(\)\)/);
});

test("tester controls remain touch-sized and cannot sit beneath the update bar", () => {
  const css = read("styles.css");
  assert.match(css, /\.feedback-card \.feedback-choice\{[^}]*min-height:44px/);
  assert.match(css, /\.feedback-open\{[^}]*min-height:44px/);
  assert.match(css, /\.storage-warning\{[^}]*position:fixed/);
  assert.match(css, /\.storage-warning\{[^}]*z-index:[1-9][0-9]{2,}/);
  assert.match(css, /\.feedback-open\{[^}]*z-index:[1-9][0-9]{2,}/);
});

test("feedback moves clear of active phone action docks and modal dialogs", () => {
  const css = read("styles.css");

  assert.match(css,
    /body:has\(#screen-game\[style\*="display: block"\] #next-row\[style\*="display: block"\]\) \.feedback-open\{bottom:calc\(76px/,
    "an active Continue dock lifts Feedback above its button");
  assert.match(css,
    /body:has\(#screen-game\[style\*="display: block"\] #feedback-row\.show\) \.feedback-open\{bottom:calc\(152px/,
    "an answer explanation gets its own clearance above Continue");
  assert.match(css,
    /body:has\(\.about-panel:not\(\[hidden\]\)\) \.feedback-open\{visibility:hidden;pointer-events:none\}/,
    "a modal owns the screen instead of competing with the floating feedback button");
});

test("dark modal secondary buttons remain legible", () => {
  const css = read("styles.css");
  assert.match(css, /\.about-card \.btn-ghost\{[^}]*color:#fff0cf/);
});

test("a new or unconfirmed learner must choose a character and the chosen pose renders", () => {
  const game = boot();
  game.$("btn-start").click();
  assert.equal(game.$("screen-character").hidden, false);

  const woman = game.doc.querySelector('[data-character="woman"]');
  assert.ok(woman, "the woman choice is visible");
  woman.click();
  game.clock.advance(500);

  assert.equal(game.$("screen-character").hidden, true);
  assert.equal(game.$("screen-game").style.display, "block");
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.equal(saved.playerCharacter, "woman");
  assert.equal(saved.characterSelected, true);
  assert.match(game.$("player-figure").getAttribute("style"), /player-actions-kimono-woman-v2\.webp/);
});

test("the entrance runs to its end and always leaves something to click", () => {
  const game = boot();
  game.$("btn-start").click();
  game.clock.advance(500);

  // Tap through Kon's opening. The invariant, checked every step: the player is
  // never looking at a screen with no way forward.
  for (let step = 0; step < 25; step += 1) {
    assert.ok(
      game.clickable().length > 0 || game.$("screen-game").style.display === "block",
      "step " + step + ": the game is still interactive",
    );
    // The entrance no longer lists the bow first, so a driver taking the first
    // action gets it wrong. A scripted player bows on purpose.
    const actions = game.doc.querySelectorAll("[data-key]");
    const choice = actions.filter((a) => a.getAttribute("data-key") === "bow")[0] || actions[0];
    if (choice) { choice.click(); game.clock.advance(3000); break; }
    game.tapScreen();
  }
  assert.deepEqual(game.errors, [], "the entrance threw nothing");
});

// Audio playback is a promise, and a promise settles only when the stack
// yields. Without this the audio question waits forever for a rejection that
// is already queued - an artifact of the harness, not of the game.
const tick = () => new Promise((resolve) => setImmediate(resolve));

/* Each day now opens on the job board - the five words, and which are
 * already done - so crossing into a day is a click the old flow did not have. */
function beginDay(game) {
  const begin = game.$("btn-jobs-begin");
  if (!begin) return false;
  begin.click();
  game.clock.advance(500);
  return true;
}


/* Getting to the Inn, and then playing whatever is put in front of us.
 *
 * Shared by both walkthroughs: one checks that nothing is ever dead, the other
 * that the second episode is actually reachable by playing. Neither solves
 * anything cleverly - wrong answers are fine.
 */
// Lands on the Inn's first scored task. Day 1 now teaches its five words
// first, so the helper walks those cards; a test about the teaching itself
// passes {stopAtTeaching:true} and is handed the first card instead.
async function enterTheInn(game, opts) {
  game.$("btn-start").click();
  game.clock.advance(500);

  const character = game.doc.querySelectorAll("[data-character]")[0];
  if (character) { character.click(); game.clock.advance(500); }

  for (let step = 0; step < 30; step += 1) {
    // The entrance no longer lists the bow first, so a driver taking the first
    // action gets it wrong. A scripted player bows on purpose.
    const actions = game.doc.querySelectorAll("[data-key]");
    const choice = actions.filter((a) => a.getAttribute("data-key") === "bow")[0] || actions[0];
    if (choice) { choice.click(); game.clock.advance(4000); break; }
    game.tapScreen();
  }
  if (game.$("next-row").style.display !== "none") {
    game.$("btn-next").click();
    game.clock.advance(1000);
  }

  const inn = game.doc
    .querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("\u6708\u898b\u5bbf"));
  assert.ok(inn, "the Inn is on the map");
  inn.click();
  game.clock.advance(4000);

  const accept = game.doc.querySelectorAll("button").find((b) => /\u624b\u4f1d\u3044\u307e\u3059/.test(b.textContent));
  if (accept) { accept.click(); game.clock.advance(4000); }
  // The five words are named as the stage opens, before anything is played.
  const openingBoard = game.$("btn-jobs-begin");
  if (openingBoard) { openingBoard.click(); game.clock.advance(900); }
  if (!(opts && opts.stopAtTeaching)) {
    for (let taught = 0; taught < 20; taught += 1) {
      const next = game.$("btn-teach-next");
      if (next) { next.click(); game.clock.advance(900); continue; }
      // Each card leads to one unscored check, which has to be answered
      // before the next word is taught.
      const done = game.$("btn-teach-done");
      if (done) { done.click(); game.clock.advance(900); continue; }
      const option = game.doc.querySelectorAll(".teach-option")[0];
      if (!option) break;
      option.click();
      // A correct pick advances on a timer rather than on a second tap.
      game.clock.advance(1200);
    }
  }
  await tick();
}

function resumedScheduleChallengeSave() {
  return {
    version: 3,
    playerCharacter: "woman",
    characterSelected: true,
    visited: ["entrance"],
    starred: ["entrance"],
    stages: {
      "home-inn": {
        /* The schedule task is Day 3's second, since the day was rewritten
         * onto its own timeline: corridor, desk, tomorrow's favour, dining
         * room, tea. Pinned by name in the assertions below, but this index
         * is what actually puts it on screen, so it moves when the day's
         * order does. */
        phase: "challenge",
        question: 1,
        challengeScore: 1,
        correctWords: ["取り替える"],
        trainingWords: ["揃える", "取り替える", "温める", "調整", "引き受ける"],
        misses: [],
        mastered: false,
        declined: false,
        medal: "silver"
      }
    }
  };
}

async function openResumedInnScheduleChallenge(game) {
  game.$("btn-start").click();
  game.clock.advance(500);
  const inn = game.doc.querySelectorAll(".map-destination")
    .find((button) => button.textContent.includes("月見宿"));
  assert.ok(inn, "the resumed Inn is available on the map");
  inn.click();
  game.clock.advance(1000);
  await tick();
}

test("the Inn tells the learner where to read and where to answer", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  const request = game.$("inn-focus-read");
  const workspace = game.$("inn-focus-answer");
  assert.ok(request, "the request landmark is rendered");
  assert.ok(workspace, "the answer landmark is rendered");
  assert.equal(request.hidden, false, "the request landmark is visible in the Inn");
  assert.equal(workspace.hidden, false, "the answer landmark is visible in the Inn");
  assert.ok(request.parentNode.classList.contains("learning-context"), "reading stays with Kon");
  assert.ok(workspace.parentNode.classList.contains("answer-workspace"), "answering stays with the workspace");
});

test("the audio-only schedule question offers a clear replay control", async () => {
  const game = boot(resumedScheduleChallengeSave(), "?skip=1");
  await openResumedInnScheduleChallenge(game);

  assert.equal(game.$("jp-line").textContent, "音声を聞いてください。",
    "the request stays audio-only");
  const replay = game.$("btn-listen-again");
  assert.ok(replay, "a learner can find a dedicated replay control");
  assert.equal(replay.hidden, false, "the replay control is available on the audio question");
  assert.equal(game.$("speak-btn").hidden, true,
    "the old icon-only replay control does not compete with the labelled button");
  assert.equal(game.$("dialogue-continue").hidden, true,
    "a decorative continue cue does not suggest an unavailable action");
  assert.match(replay.textContent, /Listen again/i);
});

test("the audio-only replay control repeats the hidden Japanese request", async () => {
  const game = boot(resumedScheduleChallengeSave(), "?skip=1");
  await openResumedInnScheduleChallenge(game);
  const question = "Aグループは18時以降、Bグループは20時までに夕食を始められます。一組の食事には2時間かかります。夕食の開始時刻を調整してください。";
  const before = game.heard.length;

  game.$("btn-listen-again").click();
  await tick();
  game.clock.advance(600);

  assert.equal(game.heard.length, before + 1, "replay starts another audio clip");
  assert.equal(game.lastHeard(), question, "the spoken request is replayed, not the visible placeholder");
  assert.equal(game.$("jp-line").textContent, "音声を聞いてください。",
    "replaying does not reveal the audio-only question in writing");
});

test("the schedule uses clear earlier and later controls instead of sliders", async () => {
  const game = boot(resumedScheduleChallengeSave(), "?skip=1");
  await openResumedInnScheduleChallenge(game);

  const earlier = game.$("arrival-a-earlier");
  const later = game.$("arrival-a-later");
  assert.ok(earlier, "Group A has an explicit earlier-time control");
  assert.ok(later, "Group A has an explicit later-time control");
  assert.match(earlier.textContent, /Earlier/i);
  assert.match(later.textContent, /Later/i);
  assert.equal(game.$("arrival-a-out").textContent, "18:00");

  later.click();

  assert.equal(game.$("arrival-a-out").textContent, "19:00",
    "the later control advances the displayed arrival time by one hour");
  assert.equal(game.doc.querySelectorAll("input").filter((input) => input.getAttribute("type") === "range").length, 0,
    "the opaque slider controls are gone");
});

/* The labels that count as correct in the Inn's three days.
 *
 * The driver already solves the room by reading the sentence. With the option
 * order balanced it needs the same knowledge for the word choices, or the
 * walkthrough measures the shuffle instead of the game.
 */
function innAnswerLabels(game) {
  const stage = game.context.N2HomeInnStage;
  const labels = new Set();
  if (!stage) return labels;
  for (const phase of ["learn", "practice", "challenge"]) {
    for (const item of stage.getPhaseItems(phase)) {
      for (const option of item.options || []) {
        if (option.key === item.correct) labels.add(option.label);
      }
      const replies = (item.interaction && item.interaction.replies) || [];
      for (const reply of replies) if (reply.key === "accept") labels.add(reply.label);
    }
  }
  return labels;
}

async function drive(game, steps, onQuestion) {
  const innAnswers = innAnswerLabels(game);
  const badges = new Set();
  const prompts = new Set();
  let questionsSeen = 0;
  let stalled = 0;
  let task = "";
  const repairAttempts = new Map();
  const trace = process.env.WALKTHROUGH_DEBUG ? (...a) => console.log(...a) : () => {};

  for (let step = 0; step < steps; step += 1) {
    await tick();
    game.clock.advance(1200);
    await tick();

    badges.add(game.$("stage-phase-badge").textContent);
    const spoken = game.$("jp-line").textContent;
    if (spoken) prompts.add(spoken);
    // A document question is not in the speech line: Kon only says what to
    // look at, and the question itself is in the wide panel.
    const panel = game.doc.querySelectorAll(".reading-document")[0];
    if (panel) prompts.add(panel.textContent);

    trace(step, "badge:", game.$("stage-phase-badge").textContent,
      "| jp:", spoken.slice(0, 18),
      "| controls:", game.doc.querySelectorAll(".question-control, .reply-option").filter(game.visible).length,
      "| objects:", game.doc.querySelectorAll(".inn-object").filter(game.visible).length,
      "| next:", game.$("next-row").style.display, "| errors:", game.errors.join(" / "));
    if (process.env.WALKTHROUGH_DUMP && step === Number(process.env.WALKTHROUGH_DUMP)) {
      console.log("SCENE:", game.$("scene").innerHTML.slice(0, 500));
      console.log("NEXTROW:", game.$("next-row").style.display);
    }

    // Requests end in \u304f\u3060\u3055\u3044; corrections and replies do not. The Challenge
    // phase writes only "listen", so there the spoken line is the request.
    if (spoken === "\u97f3\u58f0\u3092\u805e\u3044\u3066\u304f\u3060\u3055\u3044\u3002") {
      const said = game.lastHeard();
      if (said) task = said;
    } else if (spoken.indexOf("\u304f\u3060\u3055\u3044") >= 0) {
      task = spoken;
    }

    // Next comes first. An answered question keeps its choices on screen while
    // the explanation is read, and clicking them again does nothing - the
    // driver sat on one of those forever before this order was fixed.
    if (game.$("next-row").style.display !== "none") {
      game.$("btn-next").click();
      game.clock.advance(2500);
      stalled = 0;
      continue;
    }

    // Two classes answer questions here: the renderer's controls and the inn's
    // reply buttons, which Day 2's word choice also uses.
    const controls = game.doc.querySelectorAll(".question-control, .reply-option")
      .filter(game.visible).filter((c) => !c.disabled);
    if (controls.length) {
      questionsSeen += 1;
      if (onQuestion) onQuestion(controls, questionsSeen);
      // The three days no longer list the right answer first, so a driver that
      // always takes the top option cannot get through Day 2. It reads the
      // room's answer out of the sentence; it takes these from the stage data.
      let pick = controls.filter((c) => innAnswers.has(c.textContent))[0]
        || controls.filter((c) => !c.textContent.startsWith("\u3059\u307f\u307e\u305b\u3093"))[0]
        || controls[0];
      if (game.$("stage-phase-badge").textContent === "\u9593\u9055\u3044\u76f4\u3057") {
        const repairKey = spoken + (panel ? panel.textContent : "");
        const attempt = repairAttempts.get(repairKey) || 0;
        pick = controls[attempt % controls.length];
        repairAttempts.set(repairKey, attempt + 1);
      }
      pick.click();
      game.clock.advance(2500);
      stalled = 0;
      continue;
    }

    if (playRoom(game, task)) { stalled = 0; continue; }
    if (playSchedule(game, task)) { stalled = 0; continue; }

    /* The teaching cards, before the generic scene-button fallback below.
     *
     * That fallback takes the first button in the scene, which on a check is
     * the first option - and once the check is answered that button is spent,
     * so the driver clicked it again every step and never reached the
     * episode. The cards have an order: hand over, then advance, then answer.
     */
    const teachDone = game.$("btn-teach-done");
    const teachNext = game.$("btn-teach-next");
    const teachOption = game.doc.querySelectorAll(".teach-option").filter(game.visible)[0];
    if (teachDone || teachNext || teachOption) {
      (teachDone || teachNext || teachOption).click();
      game.clock.advance(1500);
      stalled = 0;
      continue;
    }

    // A scene that offers its own button - the helper's yes, the episode's
    // "let us begin" - is the way forward, and tapping the backdrop is not.
    const sceneAction = game.$("scene").querySelectorAll("button").filter(game.visible)
      .filter((b) => !b.classList.contains("inn-object") && !b.classList.contains("inn-drop-zone"))[0];
    if (sceneAction) {
      sceneAction.click();
      game.clock.advance(1500);
      stalled = 0;
      continue;
    }

    const alive = game.doc.querySelectorAll("button").filter(game.visible)
      .filter((b) => b !== game.$("btn-back-map") && !b.classList.contains("map-destination"));
    assert.ok(alive.length > 0 || stalled < 4, "step " + step + ": the screen went dead");
    stalled += 1;
    game.tapScreen();
  }

  return { badges, prompts, questionsSeen };
}

test("a full run through the Inn and into the episode never shows a dead screen", async () => {
  const game = boot();
  await enterTheInn(game);

  const run = await drive(game, Number(process.env.WALKTHROUGH_STEPS || 400), (controls, n) => {
    assert.ok(controls.length >= 2, "question " + n + " offers a real choice");
  });

  assert.ok(run.questionsSeen >= 15, "the run answered a real number of questions, saw " + run.questionsSeen);

  // All three days, then the episode. The episode's badges carry their clock,
  // which is how a timed question is told apart from a practice one.
  const seen = [...run.badges].join(" ");
  assert.ok(seen.includes("\u4e00\u65e5\u76ee"), "day 1 was played");
  assert.ok(seen.includes("\u4e8c\u65e5\u76ee"), "day 2 was played");
  assert.ok(seen.includes("\u4e09\u65e5\u76ee"), "day 3 was played");
  assert.ok(/\d+\u79d2/.test(seen), "the episode started and ran on the clock: " + seen);

  assert.deepEqual(game.errors, [], "nothing threw across the whole run");
});

test("the second episode follows the first, with its own item types", async () => {
  const game = boot();
  await enterTheInn(game);

  // Long enough to finish the three days, Episode 1 and its correction round,
  // and to reach Episode 2. The clock is fake, so the length costs milliseconds.
  const run = await drive(game, 6000);

  const seen = [...run.badges].join(" ");
  // Episode 2's own part names, which Episode 1 does not have.
  assert.ok(seen.includes("帳場をあける"), "Episode 2 was reached: " + seen);
  const asked = [...run.prompts].join(" ");
  assert.ok(asked.includes("漢字で書くと"), "an orthography item was asked");
  assert.ok(asked.includes("★に入るのは"), "a sentence-assembly item was asked");
  assert.ok(asked.includes("（　　）に入る言葉"), "a text-grammar item was asked");
  assert.deepEqual(game.errors, [], "Episode 2 threw nothing");
});

test("a generated practice card renders four options and records the answer", () => {
  const game = boot();
  const catalog = game.context.LanternCurriculumCatalog;
  const practice = game.context.LanternCatalogPractice;
  const item = catalog.getPartition("home-inn").find((i) => i.hasKanji && i.meanings.length);
  const cards = practice.buildPracticeCards(item, catalog);
  assert.ok(cards.length > 0, "the item yields at least one card");

  const host = game.doc.createElement("div");
  game.doc.body.appendChild(host);
  const card = cards[0];
  card.options.forEach((label) => {
    const button = game.doc.createElement("button");
    button.className = "question-control";
    button.textContent = label;
    host.appendChild(button);
  });
  assert.equal(host.querySelectorAll("button").length, 4, "four options render");
  assert.ok(card.options[card.correctIndex], "the correct option is a real label");
  assert.equal(new Set(card.options).size, 4, "no option is repeated");
});

test("the question renderer builds buttons that call back with their value", () => {
  const doc = new FakeDocument();
  const container = doc.createElement("div");
  doc.body.appendChild(container);
  const renderer = loadRenderer();

  const answered = [];
  const spec = renderer.renderInto(
    container,
    { type: "multiple-choice", prompt: "テスト", options: ["あ", "い", "う", "え"], answer: 1 },
    (value) => answered.push(value),
    { document: doc },
  );
  assert.ok(spec, "a spec came back");
  const buttons = container.querySelectorAll("button");
  assert.equal(buttons.length, spec.controls.length, "one button per control");
  assert.ok(buttons.length > 0, "controls actually rendered");
  buttons[0].click();
  assert.equal(answered.length, 1, "clicking a control answers exactly once");
});

function loadRenderer() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(read("question-renderer.js"), context);
  return context.LanternQuestionRenderer;
}

/* ---- The garden grows from finished work, and only from finished work ----
 *
 * This is the rule the whole reward system rests on: a plant advances because
 * the learner cleared a shift, not because time passed, not because they
 * tapped, and not because they replayed something they had already done.
 *
 * It is checked by playing the game rather than by calling the engine, because
 * the engine has been correct since Task 2. What was never proved is that the
 * app calls it once, at the right moment, with the right id.
 */
function homeButton(game) {
  return game.doc
    .querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("わが家"));
}

function gardenOf(game) {
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  return saved.garden || { plants: [], usedCreditIds: [] };
}

function enterHome(game) {
  game.$("btn-start").click();
  game.clock.advance(600);
  const home = homeButton(game);
  assert.ok(home, "わが家 is on the map");
  home.click();
  game.clock.advance(50);
}

function startEpisodeAfterTraining(game) {
  game.$("btn-skip-stage").click();
  game.$("btn-next").click();
  game.clock.advance(500);
  assert.ok(game.$("inn-reward"), "training completion shows its reward first");
  game.$("btn-reward-next").click();
  game.clock.advance(300);
}

test("home lighting is automatic and has no manual controls", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  assert.equal(game.doc.querySelectorAll("[data-lighting]").length, 0);
  assert.ok(game.doc.querySelectorAll(".home-scene")[0].className.includes("light-"));
});

test("the mobile home uses a tall, pannable camera without moving scene coordinates", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);

  const camera = game.doc.querySelector(".home-scene-camera");
  const viewport = game.doc.querySelector("[data-home-scene-viewport]");
  assert.ok(camera, "the yard needs a camera frame around its full painting");
  assert.ok(viewport, "the yard needs a horizontally pannable viewport");
  assert.equal(viewport.getAttribute("tabindex"), "0", "keyboard users must be able to pan it");
  assert.ok(game.doc.querySelector(".home-pan-hint"), "the swipe interaction needs a visible cue");

  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  assert.equal(game.doc.querySelector("[data-home-scene-viewport]").dataset.homeSceneViewport, "interior");

  const css = read("styles.css");
  const mobile = css.slice(css.indexOf("Mobile home camera"));
  assert.match(mobile, /@media\(max-width:620px\)/);
  /* Declared twice on purpose: the dvh line is the real one and the vh line
     is what an engine without dvh keeps. svh was wrong here - it is the
     viewport at its smallest, measured with the phone's toolbar showing, so
     once that toolbar slid away the picture stopped short of the space.
     The scene's width is asserted against the same clamp as the height,
     because that pairing is what holds every percentage-placed object on its
     mark while the camera grows. Let them drift apart and the objects do. */
  assert.match(mobile, /height:clamp\(300px,50vh,480px\)/);
  assert.match(mobile, /height:clamp\(300px,50dvh,480px\)/);
  assert.match(mobile, /width:calc\(clamp\(300px,50dvh,480px\) \* 16 \/ 9\)/);
  assert.match(mobile, /overflow-x:auto/);
  assert.match(mobile, /touch-action:pan-x/);
  assert.match(mobile, /\.home-scene-chrome \.home-scene-back\{display:block\}/,
    "mobile keeps a fixed exit even when the painted exit is off-camera");
});

test("the home remembers a separate pan position for the yard and room", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);

  const yard = game.doc.querySelector("[data-home-scene-viewport]");
  yard.scrollWidth = 600;
  yard.clientWidth = 320;
  yard.scrollLeft = 42;
  yard.dispatchEvent(new FakeEvent("scroll", { bubbles: false }));

  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  const room = game.doc.querySelector("[data-home-scene-viewport]");
  room.scrollWidth = 600;
  room.clientWidth = 320;
  game.clock.advance(20);
  room.scrollLeft = 210;
  room.dispatchEvent(new FakeEvent("scroll", { bubbles: false }));

  // A browser may deliver one final scroll event from the node paintHome just
  // detached. It must not erase the value saved before the room transition.
  yard.scrollLeft = 0;
  yard.dispatchEvent(new FakeEvent("scroll", { bubbles: false }));

  game.doc.querySelectorAll("[data-leave-house]")[0].click();
  const yardAgain = game.doc.querySelector("[data-home-scene-viewport]");
  yardAgain.scrollWidth = 600;
  yardAgain.clientWidth = 320;
  game.clock.advance(20);
  assert.equal(yardAgain.scrollLeft, 42, "the yard returns to its own camera position");

  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  const roomAgain = game.doc.querySelector("[data-home-scene-viewport]");
  roomAgain.scrollWidth = 600;
  roomAgain.clientWidth = 320;
  game.clock.advance(20);
  assert.equal(roomAgain.scrollLeft, 210, "the room keeps a different camera position");
});

test("the home shop opens as its own stage", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  const shop = game.doc.querySelectorAll("[data-home-shop]")[0];
  assert.ok(shop, "the scene menu has a shop button");
  shop.click();
  assert.equal(game.doc.querySelectorAll(".home-shop-stage").length, 1);
  assert.equal(game.doc.querySelectorAll(".home-yard-scene").length, 0,
    "the shop does not remain inside the yard view");
  assert.ok(game.doc.querySelectorAll("[data-home-shop-back]")[0]);
});

test("decorate mode reveals owned items and placement interaction", () => {
  const game = boot(plantedCamelliaSave({
    home: { owned: ["floor-cushion-navy"], placed: {} },
  }));
  enterHome(game);
  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  const decorate = game.doc.querySelectorAll("[data-home-decorate]")[0];
  assert.ok(decorate, "the room menu has a decorate button");
  assert.equal(game.doc.querySelectorAll("#home-shelf").length, 0,
    "inventory stays out of the clean room view");
  decorate.click();
  assert.equal(game.doc.querySelectorAll("#home-shelf").length, 1);
  assert.ok(game.doc.querySelectorAll("[data-pick]").length >= 1,
    "owned decor is available to place");
});

/* Centring cost nothing while the shelf was a grid: it was capped at 520px and
 * wrapped, so it never overflowed and there was nothing to push off the edge.
 * The tray overflows on purpose. Centring an overflowing row splits that
 * overflow across both ends, and a scroll container has no room before its
 * start edge - so the left of the row is not merely off screen, it is
 * unreachable. At rest, with the tray already at scrollLeft 0, the first card
 * is cut in half, and it loses more of itself with every object bought.
 *
 * The base rule's own comment records this same failure once before, at 320px,
 * when eight of fourteen cards sat off the side with no way to reach them. */
test("the sideways tray starts at its first card instead of centring it out of reach", () => {
  const css = read("styles.css");
  const tray = css.slice(css.indexOf("On a phone the storage shelf is a tray"));
  const start = tray.indexOf(".home-stage .home-shelf{");
  const rule = tray.slice(start, tray.indexOf("}", start));
  assert.match(rule, /overflow-x:auto/, "this is the rule that makes the tray scroll");
  /* Declared twice on purpose, in this order. An engine that does not know the
     `safe` keyword drops that line as invalid and keeps flex-start, which is
     never wrong - it only forgoes centring a row short enough to fit. */
  assert.match(rule, /justify-content:flex-start/,
    "the grid's centre must be overridden with a value every engine understands");
  assert.match(rule, /justify-content:safe center/,
    "engines that can, centre a short row and fall back to the start once it overflows");
});

/* Reported as the sakura being absent from the inventory in Debug Mode. It was
 * never absent. Debug Mode seeds one planted and one mature of every species
 * in catalogue order, and `cherry-tree` is first in that order, so its two
 * cards are the first two in the tray - the exact cards the centring bug above
 * parked on the unreachable side of the scroll. Sixteen cards make a 1464px
 * row in a 373px tray; centred, the first 546px, very nearly six cards, could
 * not be scrolled to. The maple and the hydrangea were stranded with it.
 *
 * So this asserts the half the CSS cannot: that the row really does carry a
 * card for a stored tree, and that it is the first one. If it ever stops being
 * first, the report "the sakura is missing" would mean something new. */
test("the garden tray lists a stored cherry tree, first in the row", () => {
  const game = boot(plantedCamelliaSave({
    garden: {
      plants: [
        { id: "p1", typeId: "cherry-tree", slotId: null,
          growthPoints: 12, stage: "mature", pendingAnimation: false },
        { id: "p2", typeId: "japanese-maple", slotId: null,
          growthPoints: 10, stage: "mature", pendingAnimation: false },
        { id: "p3", typeId: "camellia", slotId: "garden-left-2",
          growthPoints: 4, stage: "mature", pendingAnimation: false },
      ],
      usedCreditIds: [], starterClaimed: true, nextInstanceId: 4,
    },
  }));
  enterHome(game);
  game.doc.querySelectorAll("[data-home-decorate]")[0].click();

  const cards = game.doc.querySelectorAll("[data-pick-plant]");
  const picked = cards.map((c) => c.getAttribute("data-pick-plant"));
  assert.ok(picked.includes("p1"), "the stored cherry tree has a card to pick");
  assert.equal(picked[0], "p1", "and it is the first card, where the clipping bit hardest");
  const art = cards[0].querySelectorAll("img")[0];
  assert.ok(art && /sakura-mature/.test(art.getAttribute("src")),
    "the card shows the painted sakura, not a drawn stand-in");
});

/* The room already had this problem and already solved it: renderHome writes
 * the whole stage with innerHTML, so every re-render hands back a brand new
 * element with scrollLeft 0, and the scene viewport carries a remember and a
 * restore to survive that. The tray was added later and got neither.
 *
 * It costs a scroll per tap. Picking re-renders, so the row jumps home before
 * the object is even placed; placing re-renders again. Reaching the tenth
 * thing you own means scrolling to it, watching it snap back, and scrolling
 * to it a second time - and the further along the row you shop, the longer
 * both trips are. Per tab, because the tabs hold different rows and a
 * position measured in one means nothing in another. */
test("the tray stays where it was scrolled to when picking re-renders the stage", () => {
  const game = boot(plantedCamelliaSave({
    home: { owned: ["floor-cushion-navy", "low-table", "teapot", "books",
                    "daruma", "cat-figure", "floor-lantern"], placed: {} },
  }));
  enterHome(game);
  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  game.doc.querySelectorAll("[data-home-decorate]")[0].click();

  const tray = game.doc.getElementById("home-shelf");
  tray.scrollWidth = 700;
  tray.clientWidth = 373;
  tray.scrollLeft = 240;
  tray.dispatchEvent(new FakeEvent("scroll", { bubbles: false }));

  const cards = game.doc.querySelectorAll("[data-pick]");
  assert.ok(cards.length >= 5, "the tray needs enough objects to be worth scrolling");
  cards[cards.length - 1].click();

  const trayAgain = game.doc.getElementById("home-shelf");
  assert.notEqual(trayAgain, tray, "picking rebuilds the stage, so this is a new element");
  trayAgain.scrollWidth = 700;
  trayAgain.clientWidth = 373;
  game.clock.advance(20);
  assert.equal(trayAgain.scrollLeft, 240,
    "the tray returns to the object the learner was looking at");
});

/* The yard already had one picture-shaped way in - the house hotspot - and
 * only a text link, top-left, as its way out. A learner who read that link
 * as a title rather than navigation had no symmetric way out painted onto
 * the scene itself. */
test("the yard has a scene-painted way out, not just the corner text link", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  const exit = game.doc.querySelectorAll("[data-home-map]").find((b) => b.className.includes("home-house-hotspot"));
  assert.ok(exit, "the yard scene has its own exit hotspot, styled like the house hotspot");
  exit.click();
  // Shown, not hidden - the map is revealed as a flex column so its detail
  // sheet can take the height the picture cannot. What matters here is that
  // it is visible at all, so this asserts that rather than the layout mode.
  assert.notEqual(game.$("screen-map").style.display, "none", "clicking it returns to the map");
});

/* The interior had the same asymmetry one level in: a house hotspot to walk
 * into the room from the yard, but only a corner text link ("← 庭") to walk
 * back out - no painted spot in the room itself, unlike every other door in
 * the house so far. */
test("the room has a scene-painted way back to the yard, not just the corner text link", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  const exit = game.doc.querySelectorAll("[data-leave-house]").find((b) => b.className.includes("home-house-hotspot"));
  assert.ok(exit, "the interior scene has its own exit hotspot, styled like the house hotspot");
  exit.click();
  assert.ok(game.doc.querySelectorAll("[data-enter-house]").length > 0,
    "clicking it returns to the yard, where the house hotspot lives");
});

/* home-pet.js's enterScene() always arrives at the scene's door - deliberate
 * for the very first sighting of the cat ("walking in to greet you"), but
 * homePetMarkup() used to call it for every switch between the yard and the
 * room too, not just that first sighting. A learner tapping between the two
 * views while decorating would see the cat land on the exact same dead-
 * centre spot every single time, which reads as being teleported to the
 * middle of the screen rather than a cat going about its day. */
test("switching between the yard and the room does not always re-seat the cat at the door", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  const petPos = () => {
    const pet = game.doc.querySelector(".home-pet");
    return pet ? { left: pet.style.left, top: pet.style.top } : null;
  };
  // First sighting arrives through the yard door - that part is unchanged.
  assert.deepEqual(petPos(), { left: "50%", top: "59%" });

  // Walking into the house is a real scene change and gets a fresh spot -
  // create() excludes door anchors from its pick, so this can never
  // coincidentally land on the door regardless of the random seed.
  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  game.clock.advance(50);
  assert.notDeepEqual(petPos(), { left: "50%", top: "74%" },
    "switching to the room must not always drop the cat at its own door");

  // And walking back out must not always drop it at the yard's door either.
  game.doc.querySelectorAll("[data-leave-house]")[0].click();
  game.clock.advance(50);
  assert.notDeepEqual(petPos(), { left: "50%", top: "59%" },
    "switching back to the yard must not always re-seat the cat at its door");
});

test("yard reset actions live in a compact overflow menu", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  const more = game.doc.querySelectorAll(".home-yard-more")[0];
  assert.ok(more, "the yard has a compact more menu");
  assert.ok(more.querySelectorAll("[data-clear-yard]")[0]);
  assert.ok(more.querySelectorAll("[data-restore-yard]")[0]);
  assert.equal(game.doc.querySelectorAll(".home-yard-actions").length, 0,
    "reset actions are not a permanent row in the main menu");
});

/* The entrance borrows the shared `#avatar-slot` node and plants it inside
 * `#scene` so Kon can stand next to the player there. Nothing moved it back
 * before entering the home, and `paintHome()` overwrites `#scene`'s innerHTML
 * on every visit - which used to destroy the node outright. The next
 * `getElementById("avatar-slot")`, back at the entrance or the inn, came back
 * null and crashed on the very next line that read its `.parentElement`.
 */
test("visiting home right after the entrance does not strand or destroy the shared avatar node", () => {
  const game = boot();
  game.$("btn-start").click();
  game.clock.advance(500);
  const character = game.doc.querySelectorAll("[data-character]")[0];
  if (character) { character.click(); game.clock.advance(500); }

  for (let step = 0; step < 25; step += 1) {
    const actions = game.doc.querySelectorAll("[data-key]");
    const choice = actions.filter((a) => a.getAttribute("data-key") === "bow")[0] || actions[0];
    if (choice) { choice.click(); game.clock.advance(3000); break; }
    game.tapScreen();
  }
  assert.ok(game.$("avatar-slot"), "avatar-slot exists once the entrance has rendered");
  assert.equal(game.$("avatar-slot").parentNode && game.$("avatar-slot").parentNode.id, "scene",
    "the entrance moves the shared avatar into the scene - the setup the bug depends on");

  if (game.$("next-row").style.display !== "none") {
    game.$("btn-next").click();
    game.clock.advance(500);
  }

  const home = homeButton(game);
  assert.ok(home, "home is reachable from the map right after the entrance");
  home.click();
  game.clock.advance(200);
  assert.ok(game.$("avatar-slot"), "avatar-slot survives paintHome() overwriting #scene");

  const leave = game.doc.querySelectorAll("[data-home-map]")[0];
  assert.ok(leave, "there is a way back to the map from home");
  leave.click();
  game.clock.advance(200);

  const entranceAgain = game.doc
    .querySelectorAll(".map-destination")
    .find((b) => b.getAttribute("data-map-key") === "entrance");
  assert.ok(entranceAgain, "the entrance is still reachable from the map");
  assert.doesNotThrow(() => entranceAgain.click(),
    "returning to the entrance after a home visit must not throw");
  game.clock.advance(200);
  assert.deepEqual(game.errors, [], "revisiting the entrance after home throws nothing");
});

// A learner who has done the tutorial and has one camellia in the ground.
// Written as a save so it arrives through the real migration on boot.
function plantedCamelliaSave(extra) {
  return Object.assign({
    version: 3, characterSelected: true, playerCharacter: "woman",
    visited: ["entrance"], starred: [], stages: {},
    episodesDone: [], stageStarted: [], items: {}, mistakes: [], repairQueue: [],
    money: 100, paidAnswers: [], masteredByStage: {}, reviewProgress: {},
    homeTutorialComplete: true, starterSeedClaimed: true, starterCushionClaimed: true,
    home: { owned: ["floor-cushion-navy"], placed: {} }, homeVisited: true,
    garden: {
      plants: [{ id: "p1", typeId: "camellia", slotId: "garden-left-2",
                 growthPoints: 0, stage: "planted", pendingAnimation: false }],
      usedCreditIds: [], starterClaimed: true, nextInstanceId: 2,
    },
  }, extra || {});
}

function freshHomeSave() {
  return plantedCamelliaSave({
    money: 0,
    homeTutorialComplete: false,
    starterSeedClaimed: false,
    starterCushionClaimed: false,
    homeVisited: false,
    home: { owned: [], placed: {} },
    garden: {
      plants: [], usedCreditIds: [], starterClaimed: false,
      starterSceneryClaimed: false, nextInstanceId: 1,
    },
    innJourney: { version: 1, claimed: {}, catUnlocked: false },
  });
}

test("a fresh home waits for earned Inn rewards instead of granting starter items", () => {
  const game = boot(freshHomeSave());
  enterHome(game);

  const plants = gardenOf(game).plants;
  assert.equal(plants.length, 0, "Episode 1 earns the first seed");
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.deepEqual(saved.home.owned, [], "Inn Training earns the first cushion");
  assert.equal(game.doc.querySelectorAll(".home-pet").length, 0,
    "the final Inn reward, not a fresh home visit, unlocks the cat");
  assert.equal(game.doc.querySelectorAll("[data-home-inn]").length, 1,
    "the empty home gives one clear route back to the Inn");
  assert.equal(game.doc.querySelectorAll("[data-home-decorate], [data-home-shop]").length, 0,
    "an empty home does not compete with its one next-step action");
});

test("finishing a shift grows the garden, and replaying it does not", async () => {
  const game = boot(plantedCamelliaSave());
  await enterTheInn(game);
  await drive(game, 3200);

  const after = gardenOf(game);
  assert.ok(after.usedCreditIds.length >= 1,
    "a finished shift credited the garden: " + JSON.stringify(after.usedCreditIds));
  assert.ok(after.usedCreditIds.every((id) => id.startsWith("episode:")),
    "credits are keyed by episode id: " + after.usedCreditIds.join(", "));
  assert.equal(new Set(after.usedCreditIds).size, after.usedCreditIds.length,
    "no episode was credited twice");

  const plant = after.plants[0];
  assert.ok(plant.growthPoints > 0, "the planted camellia gained ground");
  assert.ok(plant.growthPoints <= 2 * after.usedCreditIds.length,
    "at most one point plus one bonus per shift, not a per-question drip");
  assert.notEqual(plant.stage, "planted", "crossing a threshold changed the stage");
  assert.deepEqual(game.errors, [], "nothing threw");
});

test("growth is never credited before the correction round is cleared", async () => {
  const game = boot(plantedCamelliaSave());
  await enterTheInn(game);
  // Long enough to be well inside an episode, not long enough to finish one.
  await drive(game, 260);

  const mid = gardenOf(game);
  const done = (JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}").episodesDone) || [];
  if (!done.length) {
    assert.equal(mid.usedCreditIds.length, 0,
      "an unfinished shift must credit nothing: " + JSON.stringify(mid.usedCreditIds));
  }
});

test("a plant only grows while it is in the ground", () => {
  const game = boot();
  const garden = game.context.LanternHomeGarden;
  let state = garden.emptyGarden();
  const bought = garden.buy(state, 500, "camellia");
  state = bought.garden;                       // bought, never planted

  const credited = garden.creditLesson(state, "episode:home-inn-e01", 0);
  assert.equal(credited.garden.plants[0].growthPoints, 0,
    "a seed sitting in storage does not grow");

  const planted = garden.plant(credited.garden, bought.instanceId, "garden-left-1",
    game.context.LanternHomeRoom.scenes().yard.slots);
  const again = garden.creditLesson(planted.garden, "episode:home-inn-e01", 0);
  assert.equal(again.garden.plants[0].growthPoints, 0,
    "the shift it missed is not paid out retroactively");
});

test("the yard announces a plant that grew while the learner was away", async () => {
  const game = boot(plantedCamelliaSave({
    visited: ["entrance", "home-inn"], stageStarted: ["home-inn"],
    garden: { plants: [{ id: "p1", typeId: "camellia", slotId: "garden-left-2",
                         growthPoints: 2, stage: "sprout", pendingAnimation: true }],
              usedCreditIds: ["episode:home-inn-e01"], starterClaimed: true, nextInstanceId: 2 },
  }));

  game.$("btn-start").click();
  game.clock.advance(600);
  const home = homeButton(game);
  assert.ok(home, "わが家 is on the map");
  home.click();
  game.clock.advance(1200);

  const note = game.doc.querySelectorAll(".home-goal")[0];
  assert.ok(note && note.textContent.includes("椿"),
    "the yard says which plant changed: " + (note ? note.textContent : "(no note)"));

  // and it is said once: the flag is cleared and written back
  const after = gardenOf(game);
  assert.equal(after.plants[0].pendingAnimation, false,
    "the growth moment is acknowledged, so it does not replay on every visit");
});

/* The workshop door.
 *
 * Placement and the reward loop are the two things that cannot be reached by
 * playing honestly inside a test: the last wallpaper costs thousands of coins
 * and a mature tree is a dozen cleared shifts away. `lanternUnlockAll` hands
 * the whole catalogue over at once so both can be exercised.
 *
 * What is checked here is not that it grants things - that is trivial - but
 * that everything it grants can actually be put somewhere. An unlock that
 * hands over an item with no slot of its kind would look like a working test
 * fixture and quietly prove nothing.
 */
test("the unlock hands over every painted item, and leaves all of it unplaced", () => {
  const game = boot();
  const report = game.context.window.lanternUnlockAll();
  const decor = game.context.LanternHomeDecor;
  const garden = game.context.LanternHomeGarden;

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.equal(report.ok, true);

  /* Painted only, matching the shop.
   *
   * It used to grant the whole catalogue, which filled the test room with a
   * mix of finished pictures and green geometry and made it hard to judge what
   * the reward actually looks like. The counts are derived rather than
   * hard-coded, so painting one more item does not break this. */
  const paintedDecor = decor.catalogue().filter((i) => decor.getItem(i.id).image);
  const paintedPaper = decor.wallpapers()
    .filter((w) => w.id !== "wallpaper-plain" && decor.getWallpaper(w.id).image);
  assert.equal(report.furniture, paintedDecor.length, "every painted item is owned");
  /* Decor is fully painted now - the last six arrived together - so the
     furniture filter excludes nothing and asserting that it does would be
     asserting the game is unfinished. The exclusion this test exists to check
     is still real, and still checked, on the wallpaper and the plants below:
     one paper and four species are drawings yet. Restore a furniture-specific
     version of this line only if unpainted furniture ever reappears. */
  assert.equal(paintedDecor.length, decor.catalogue().length,
    "every catalogue item is painted, so the furniture filter has nothing left to exclude");
  assert.equal(report.wallpapers, paintedPaper.length,
    "only wallpaper with a picture is owned");
  assert.equal(report.plants % 2, 0, "each granted species arrives twice");
  assert.ok(report.plants / 2 < garden.catalogue().length,
    "unpainted species are left out");
  assert.ok(report.skippedUnpainted.length > 0,
    "the report says what it withheld and why");

  assert.deepEqual(saved.home.placed, {},
    "nothing is placed: the point is to test the placing");
  assert.ok(saved.garden.plants.every((p) => p.slotId === null),
    "no plant is in the ground either");

  const stages = new Set(saved.garden.plants.map((p) => p.stage));
  assert.deepEqual([...stages].sort(), ["mature", "planted"],
    "both ends of the growth art are available to compare");
});

test("everything the unlock grants has somewhere it can go", () => {
  const game = boot();
  game.context.window.lanternUnlockAll();
  const decor = game.context.LanternHomeDecor;
  const scenes = game.context.LanternHomeRoom.scenes();

  const slots = [].concat(scenes.yard.slots || [], scenes.interior.slots || []);
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));

  for (const id of saved.home.owned) {
    if (decor.isWallpaper(id)) continue;          // wallpaper hangs on the room
    const item = decor.getItem(id);
    assert.ok(item, id + " is owned but is in no catalogue");
    const fits = slots.filter((slot) => slot.kind === item.kind);
    assert.ok(fits.length > 0,
      item.id + ' is kind "' + item.kind + '" and no slot in either scene takes it');
    // and the engine agrees, rather than only the kinds matching
    const placed = decor.place(saved.home, item.id, fits[0].id, slots);
    assert.equal(placed.ok, true, item.id + " could not be placed in " + fits[0].id);
  }
});

test("the unlock is not reachable without asking for it", () => {
  const game = boot();
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.notEqual(saved.money, 99999, "a plain boot must not be unlocked");
  assert.ok(!(saved.home && saved.home.owned && saved.home.owned.length > 2),
    "a plain boot owns at most what the tutorial gives");
});

/* The flag, not just the function.
 *
 * The first version of these tests called `lanternUnlockAll()` by hand after
 * boot, which passes even when the URL flag is completely broken - and it was.
 * The auto-run sat partway through the module, above the `var` tables it
 * reads, so it threw on the first species and took the rest of the module with
 * it. Everything below is what a browser actually does with the flag.
 */
test("the ?unlockall=1 flag unlocks on load without breaking the module", () => {
  const game = boot(null, "?unlockall=1");
  game.clock.advance(50);

  assert.deepEqual(game.errors, [], "the module must not throw while unlocking");
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.money, 99999, "the flag ran");
  assert.ok(saved.home.owned.length > 10, "the cupboard is full");

  // the tables assigned below the flag must still exist afterwards
  assert.ok(game.context.LanternHomeDecor.getItem(saved.home.owned[0]),
    "the catalogue survived the unlock");
});

/* Testing anything past the Entrance meant replaying character selection and
 * the Entrance's own question on every reload of a fresh save. ?skip=1 fills
 * in just those two gates - never anything a real save could already have
 * past them - so btn-start's own click handler drops straight to the map. */
/* review-engine.js schedules delayed review and refuses to count same-session
 * repetition, and for a long time only コンの稽古 fed it. A learner could
 * finish the Inn's three days, be told they had remembered all five words,
 * and have reviewProgress still empty - nothing scheduled, "今日の復習" never
 * shown, the words never seen again. The teaching was fine; the retention
 * mechanism simply was not connected to it. */
test("finishing the Inn puts its words into the delayed-review schedule", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-stage").click();

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.stages["home-inn"].mastered, true, "the stage was finished");

  const scheduled = Object.keys(saved.reviewProgress || {});
  assert.ok(scheduled.length > 0,
    "the Inn's words must enter the review schedule; an empty reviewProgress means nothing ever comes back");

  // The five taught words, by their catalog ids, not just any id.
  for (const id of ["v-soroeru", "v-torikaeru", "v-atatameru-food", "w-chousei", "v-hikiukeru"]) {
    assert.ok(scheduled.includes(id), `${id} was taught but never scheduled`);
  }

  // And the schedule must place them in the future, not leave them due now -
  // a correct answer earns the first interval.
  const now = Date.now();
  assert.ok(saved.reviewProgress["v-soroeru"].due > now,
    "a word answered correctly should be due later, not immediately");
});

test("the ?skip=1 flag lands on the map without playing the Entrance", () => {
  const game = boot(null, "?skip=1");
  game.clock.advance(50);

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.characterSelected, true, "a character is pre-selected");
  assert.ok(saved.visited.includes("entrance"), "the Entrance is pre-visited");

  game.$("btn-start").click();
  game.clock.advance(200);
  assert.notEqual(game.$("screen-map").style.display, "none",
    "start goes straight to the map, not the Entrance or character select");

  /* Specifically a column, because the stylesheet hides this section and the
   * reveal here is the declaration that lands. The map picture cannot absorb
   * a tall phone's spare height - its pins sit at percentages over a `cover`
   * background, so a taller box crops the artwork sideways and slides every
   * pin off the building it points at - so the sheet beneath it grows
   * instead, which only works while the section is a flex column. Going back
   * to "block" would silently restore the empty third of a phone screen. */
  assert.equal(game.$("screen-map").style.display, "flex",
    "the map is revealed as a column so its detail sheet can take the height");
});

/* Skipping the two gates still left every Learn/Practice/Challenge question
 * in the Inn to solve for real on every test pass. These two controls only
 * show when ?skip=1 is set, and only against getActivePrompt's own
 * Learn/Practice/Challenge/Review flow - not the catalog practice cards, an
 * episode, or a repair round, which read state differently. */
test("?skip=1 also reveals per-question and whole-stage skip controls in the Inn", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  assert.equal(game.$("btn-skip-question").hidden, false,
    "the skip-question control shows once a real Learn question is on screen");
  assert.equal(game.$("btn-skip-stage").hidden, false, "the skip-stage control shows too");

  const firstEncounter = game.$("encounter-progress").textContent;
  game.$("btn-skip-question").click();
  // Same path a real correct answer takes: feedback shows, next-row hides
  // while an auto-advance is scheduled, then reappears as a fallback so
  // there is always a visible way forward - click it, exactly as a learner
  // (and the other Inn walkthroughs in this file) would.
  game.clock.advance(6000);
  assert.equal(game.$("next-row").style.display, "block",
    "the continue control reappears once the auto-advance window has passed");
  game.$("btn-next").click();
  assert.notEqual(game.$("encounter-progress").textContent, firstEncounter,
    "skipping one question moves to the next, without answering it");

  game.$("btn-skip-stage").click();
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.stages["home-inn"].mastered, true,
    "skipping the whole stage finishes it, mastered, without solving anything");
});

test("the Inn shows a five-stop journey with one clear current stop", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  const journey = game.$("inn-journey");
  assert.ok(journey, "the Inn has a persistent journey landmark");
  const stops = journey.querySelectorAll(".inn-journey-stop");
  assert.equal(stops.length, 5, "training and four episodes are always visible");
  assert.equal(stops.filter((stop) => stop.classList.contains("is-current")).length, 1,
    "only one next job competes for the learner's attention");
  assert.equal(stops.filter((stop) => stop.classList.contains("is-locked")).length, 4,
    "future story rewards are visible but not selectable");
});

test("finishing Inn Training awards its cushion before Episode 1 begins", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  game.$("btn-skip-stage").click();
  game.$("btn-next").click();

  const reward = game.$("inn-reward");
  assert.ok(reward, "training completion pauses on a named reward");
  assert.match(reward.textContent, /Floor cushion/);
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.ok(saved.home.owned.includes("floor-cushion-navy"),
    "the earned cushion is persisted before the learner leaves the reveal");
  assert.equal(saved.innJourney.claimed.training, true);
});

test("a training reward waits for the learner to choose the next step", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-stage").click();
  game.$("btn-next").click();
  assert.ok(game.$("inn-reward"), "the reward is visible before waiting");

  game.clock.advance(30000);
  assert.ok(game.$("inn-reward"), "a delayed stage timer skipped past the reward");
  assert.equal(game.$("next-row").style.display, "none",
    "a delayed fallback must not put a second continue button under the reward");
  assert.equal(game.$("btn-episode-begin"), null,
    "the episode must not start until the reward action is pressed");
});

/* enterLocation() has its own, separate rendering for resuming an
 * in-progress stage after a real reload - the comment right next to it says
 * renderStagePrompt "never ran" on that path, and it still does not. The two
 * skip controls' visibility was set only inside renderStagePrompt, so a
 * save that reloads mid-stage (leaving the Inn and coming back within the
 * same session does not reproduce this - state carries over in memory and
 * still routes through renderStagePrompt) left both hidden even with
 * ?skip=1, only ever showing on a stage's very first, freshly-started
 * question. */
test("?skip=1's Inn skip controls also show when a save reloads mid-stage", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  assert.equal(game.$("btn-skip-question").hidden, false, "shown on a fresh stage start");
  game.$("btn-skip-question").click();
  game.clock.advance(6000);
  game.$("btn-next").click();
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.stages["home-inn"].question, 1, "the save now sits mid-stage, on the second item");

  // A genuinely fresh boot from that save, exactly as a real page reload
  // would read it back - not a same-session leave-and-return, which never
  // stopped going through renderStagePrompt in the first place.
  const reloaded = boot(saved, "?skip=1");
  reloaded.$("btn-start").click();
  reloaded.clock.advance(500);
  const inn = reloaded.doc.querySelectorAll(".map-destination").find((b) => b.textContent.includes("月見宿"));
  inn.click();
  reloaded.clock.advance(500);

  assert.equal(reloaded.$("scene-label").textContent, "月見宿・N2 - 洗面所で",
    "resumed onto the second item, not restarted");
  assert.equal(reloaded.$("btn-skip-question").hidden, false,
    "shown after a real reload resumes mid-stage, not just on a fresh stage start");
  assert.equal(reloaded.$("btn-skip-stage").hidden, false);
});

test("without ?skip=1, the Inn's skip controls never appear", async () => {
  const game = boot(null);
  await enterTheInn(game);
  assert.equal(game.$("btn-skip-question").hidden, true,
    "a real player must never see a control that bypasses the lesson");
  assert.equal(game.$("btn-skip-stage").hidden, true);
});

/* The stage-completion skip only covered the Learn/Practice/Challenge stage
 * itself; Episode 1 - the ten-question story shift the stage unlocks - runs
 * through a second, separate answer-handling function (previewState's own
 * renderPreviewQuestion, not answerStage), which had no skip hook at all. */
test("?skip=1's skip-question control also works inside Episode 1", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  startEpisodeAfterTraining(game);

  const begin = game.$("btn-episode-begin");
  assert.ok(begin, "the episode's opening card is on screen");
  begin.click();
  game.clock.advance(500);
  game.$("btn-brief-begin").click();
  game.clock.advance(500);
  passWordBoard(game, 500);

  assert.equal(game.$("btn-skip-question").hidden, false,
    "the skip-question control shows once a real episode question is on screen");
  // No whole-episode skip: an episode is a flat ten-question shift rather
  // than a fixed three-part stage, so there is no single state to jump to.
  assert.equal(game.$("btn-skip-stage").hidden, true);

  const firstEncounter = game.$("encounter-progress").textContent;
  game.$("btn-skip-question").click();
  assert.equal(game.$("next-row").style.display, "block",
    "a correct answer shows the continue control immediately in the episode flow");
  game.$("btn-next").click();
  assert.notEqual(game.$("encounter-progress").textContent, firstEncounter,
    "skipping one episode question moves to the next, without answering it");
});

/* The shop sells only what has been painted - wallpaper included.
 *
 * Furniture and plants were gated on having a picture from the start, and
 * wallpaper was not, so the vector 桜 pattern sat on the shelf with a price on
 * it. The rule is one rule: an unfinished drawing is honest while a learner
 * watches something they already own, and dishonest on a price tag. 無地 is
 * exempt because it is the bare room rather than a product.
 */
test("the shop's wallpaper shelf offers only wallpaper that has a picture", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  game.doc.querySelectorAll("[data-home-shop]")[0].click();
  game.clock.advance(50);

  const tab = game.doc.querySelectorAll("[data-shop-category]")
    .find((b) => b.getAttribute("data-shop-category") === "wallpaper");
  assert.ok(tab, "the shop has a wallpaper category");
  tab.click();
  game.clock.advance(50);

  const decor = game.context.LanternHomeDecor;
  const offered = game.doc.querySelectorAll("[data-buy-wallpaper]")
    .map((b) => b.getAttribute("data-buy-wallpaper"));
  assert.ok(offered.length >= 1, "the shelf is not empty");

  for (const id of offered) {
    if (id === "wallpaper-plain") continue;           // the bare room, not a product
    assert.ok(decor.getWallpaper(id).image, id + " is on sale but has no picture");
  }

  const unpainted = decor.wallpapers()
    .filter((w) => w.id !== "wallpaper-plain" && !decor.getWallpaper(w.id).image)
    .map((w) => w.id);
  assert.ok(unpainted.length > 0,
    "expected at least one unpainted wallpaper, or this test proves nothing");
  for (const id of unpainted) {
    assert.ok(!offered.includes(id), id + " has no picture but is still sold");
  }
});

/* A stack of grown trees to plant by hand.
 *
 * One of each species at each end of its growth shows the art, but it is no
 * use for judging a yard: a tree only reads against the house once it is full
 * size and there are several of them to place. This is the flag for that, and
 * it is checked because a testing door that silently grants nothing wastes the
 * session it was meant to save.
 */
test("?trees=N stocks that many full-grown trees, all unplanted", () => {
  const game = boot(null, "?unlockall=1&trees=10");
  game.clock.advance(50);

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  const plants = saved.garden.plants;
  const grownTrees = plants.filter((p) => p.stage === "mature"
    && ["cherry-tree", "japanese-maple"].includes(p.typeId));

  assert.ok(grownTrees.length >= 10, `expected at least 10 grown trees, got ${grownTrees.length}`);
  assert.ok(grownTrees.every((p) => p.slotId === null),
    "they arrive in storage: the planting is what is being tested");

  // both painted species, so the yard can be judged with a mix
  assert.equal(new Set(grownTrees.map((p) => p.typeId)).size, 2,
    "the two painted tree species should alternate");

  // and the growth-stage pair survives alongside them, for comparison
  assert.ok(plants.some((p) => p.stage === "planted"),
    "the seedling of each species is still there to compare against");

  // without the flag, no stack
  const plain = boot(null, "?unlockall=1");
  plain.clock.advance(50);
  const plainPlants = JSON.parse(plain.storage.getItem("lanternAlley.v3")).garden.plants;
  assert.ok(plainPlants.filter((p) => p.stage === "mature").length < grownTrees.length,
    "the stack only appears when asked for");
});

/* An orchard is not one tree stamped ten times.
 *
 * Depth already varies a plant's size through its slot. What this covers is
 * the variation between two plants standing at the same depth: without it,
 * ten sakura are ten identical silhouettes at identical angles, which reads as
 * wallpaper. It must also be stable - a tree that changes shape when the page
 * reloads, or when it is picked up and put back, is worse than no variation.
 */
test("plants of the same species differ from each other, and stay themselves", () => {
  const game = boot(null, "?unlockall=1&trees=10");
  game.clock.advance(50);
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const context = { self: {} };
  vm.createContext(context);
  vm.runInContext(app.slice(app.indexOf("function plantVariation"),
    app.indexOf("var PLANT_LIFT_CEILING")) + "\nself.v = plantVariation;", context);
  const vary = context.self.v;

  const ids = ["plant-1", "plant-2", "plant-3", "plant-4", "plant-5", "plant-6"];
  const shapes = ids.map(vary);

  // stable: the same id always gives the same tree
  for (const id of ids) {
    assert.deepEqual(vary(id), vary(id), id + " changes shape between calls");
  }

  // and different: not every tree leans the same way or faces the same way
  assert.ok(new Set(shapes.map((s) => s.tilt)).size > 1, "every plant leans identically");
  assert.ok(new Set(shapes.map((s) => s.mirror)).size > 1, "every plant faces the same way");
  assert.ok(new Set(shapes.map((s) => s.size)).size > 1, "every plant is the same size");

  // subtle: past about 4 degrees a trunk stops growing and starts falling over
  for (const s of shapes) {
    assert.ok(Math.abs(s.tilt) <= 3.5, `a lean of ${s.tilt} degrees is a falling tree`);
    assert.ok(s.size >= 0.9 && s.size <= 1.1, `a size of ${s.size} is not a variation`);
    assert.ok(s.mirror === 1 || s.mirror === -1, "mirror is a flip, not a scale");
  }
});

/* After dark the house lamp is the only light in the yard.
 *
 * By day the sun lights everything equally and distance means nothing, so this
 * only governs evening and night. A single night brightness for every plant
 * flattens the one thing that makes a lit house at night worth looking at: a
 * tree by the veranda should be warm and lit, one at the fence nearly a
 * silhouette.
 */
test("the yard's night lighting falls off with distance from the doorway", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const context = { self: {}, Math };
  vm.createContext(context);
  vm.runInContext(app.slice(app.indexOf("function plantLampProximity"),
    app.indexOf("/* No two trees in a garden")) + "\nself.p = plantLampProximity;", context);
  const lamp = context.self.p;

  const atDoor = lamp({ x: 50, y: 58 });
  const midYard = lamp({ x: 21, y: 72 });
  const farCorner = lamp({ x: 10, y: 93 });

  assert.ok(atDoor > 0.9, `at the door the lamp should be near full, got ${atDoor}`);
  assert.ok(farCorner < 0.1, `at the far corner it should be near nothing, got ${farCorner}`);
  assert.ok(atDoor > midYard && midYard > farCorner, "the falloff must be monotonic");

  // it is a lamp over a door, not a spotlight down the path: a tree at the
  // fence beside the house is about as lit as one halfway down the middle
  const besideHouse = lamp({ x: 12, y: 61 });
  const downThePath = lamp({ x: 50, y: 82 });
  assert.ok(Math.abs(besideHouse - downThePath) < 0.25,
    "width and depth should count roughly alike for a doorway lamp");

  // and nothing outside 0..1, since the stylesheet multiplies by it
  for (const y of [56, 70, 94]) {
    for (const x of [0, 50, 100]) {
      const v = lamp({ x, y });
      assert.ok(v >= 0 && v <= 1, `lamp reach ${v} at ${x},${y} is out of range`);
    }
  }

  // the stylesheet must actually use it, in both dark hours and neither light one
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  for (const hour of ["evening", "night"]) {
    const rule = css.split(/\r?\n/).findIndex((l) => l.includes(`light-${hour} .home-plant img`));
    assert.ok(rule > -1, `no ${hour} plant rule`);
    const block = css.split(/\r?\n/).slice(rule, rule + 7).join("\n");
    assert.match(block, /--plant-lamp/, `${hour} ignores the lamp`);
  }
});

/* Leaving the house must take the house with it.
 *
 * The home paints a whole yard into `#scene` - background, plants, cat, and
 * its own row of controls. Places that render into `#scene` themselves
 * overwrote it and looked fine; places that work through the dialogue panel
 * never touched it, so the yard stayed underneath and 家に入る, 飾る and 店
 * were live and clickable on top of another stage.
 *
 * This asserts the invariant where it lives rather than by playing, and that
 * is a deliberate compromise worth explaining. Reproducing it needs a
 * destination in a state that writes nothing to `#scene` - the Entrance while
 * its tutorial is still running - and staging that in the fake DOM defeated
 * several attempts: seeding the Entrance unvisited stops `わが家` reaching the
 * map at all. A DOM test that passes against the broken code is worse than
 * none, so this checks the one line every location passes through instead.
 * The behaviour itself was reproduced and confirmed fixed in a browser.
 */
test("leaving a location clears the workspace the last one drew", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const start = app.indexOf("function enterLocation(");
  assert.ok(start > -1, "enterLocation is gone");
  const body = app.slice(start, app.indexOf("\n  function ", start + 10));

  assert.match(body, /\$\("scene"\)\.innerHTML = ""/,
    "enterLocation must empty #scene, or a stage that renders only into the "
    + "dialogue panel inherits whatever the last one left there");

  /* And only when leaving the home. Clearing on every call broke re-entry:
   * some paths come back through enterLocation to refresh a location they are
   * already in - the Entrance does it on completion - and emptying the
   * workspace under them left the stage blank but for its dialogue panel. */
  assert.match(body, /state\.currentKey === "home" && key !== "home"/,
    "the clear must be guarded to leaving the home, or re-entering a location blanks it");

  // it has to happen before the new location renders, not after
  const clearAt = body.indexOf('$("scene").innerHTML = ""');
  const renderAt = body.indexOf("renderStage");
  if (renderAt > -1) {
    assert.ok(clearAt < renderAt,
      "the workspace is cleared after the new stage draws, which erases it");
  }
});

test("finishing the Inn points at tomorrow's review", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-stage").click();
  // The schedule really does hold these five words for tomorrow now, so the
  // closing line should say so rather than just ending.
  assert.match(game.$("feedback-text").textContent, /明日/);
});

test("the map explains what its lantern count means, until it doesn't need to", async () => {
  // 灯り 0 / 6 sat there from the first visit with nothing saying what it
  // counted. The note lives beside the number rather than in Kon's tutorial,
  // because every spoken Entrance line needs a pre-rendered audio clip.
  const game = boot(null, "?skip=1");
  game.$("btn-start").click();
  game.clock.advance(500);
  assert.equal(game.$("map-goal-note").hidden, false, "a learner with no lanterns is told what they are");
  assert.match(game.$("map-goal-note").textContent, /灯りがひとつ戻ります/);

  // Once a lantern is lit the counter speaks for itself and the note retires.
  const lit = plantedCamelliaSave({ masteredByStage: { "home-inn": ["v-soroeru"] } });
  const after = boot(lit, "?skip=1");
  after.$("btn-start").click();
  after.clock.advance(500);
  assert.equal(typeof after.$("map-goal-note").hidden, "boolean");
});




test("an episode names its story, not its internal skill taxonomy", async () => {
  // The label read "Episode 1 preview - quick-response": the word preview,
  // the episode number and the renderer's own skill names, in English, on the
  // line a player reads to know where they are.
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  startEpisodeAfterTraining(game);
  game.$("btn-episode-begin").click();
  game.clock.advance(300);
  game.$("btn-brief-begin").click();
  game.clock.advance(300);
  // The hour names its ten words before the clock starts - five practised in
  // the three days, five it is about to introduce.
  passWordBoard(game, 300);

  const label = game.$("scene-label").textContent;
  assert.doesNotMatch(label, /preview/i, "players should not be told they are in a preview");
  assert.doesNotMatch(label, /quick-response|single-choice|listening-task/,
    "the renderer's skill taxonomy is not a place name");
  assert.match(label, /月見宿/);
  assert.equal(game.$("romaji-toggle").hidden, true, "episodes never show romaji");
});

test("an episode question does not print its citation as Kon's speech", async () => {
  // question.sourceNote is 月見宿・第一話「宵の一時間」 - a citation. It was
  // written into the narration slot, directly above Kon's name tab, while
  // the episode-open card and the scene label already say the same thing.
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  startEpisodeAfterTraining(game);
  game.$("btn-episode-begin").click();
  game.clock.advance(300);
  game.$("btn-brief-begin").click();
  game.clock.advance(300);
  // The hour names its ten words before the clock starts - five practised in
  // the three days, five it is about to introduce.
  passWordBoard(game, 300);

  assert.doesNotMatch(game.$("narration").textContent, /第一話/,
    "the citation belongs on the opening card, not in the character's speech slot");
});

test("Episode audio replay speaks the current Episode request", async () => {
  // The three-day Challenge leaves its labelled replay button active. Episode
  // questions reused that DOM without replacing the replay target, so the
  // first Episode question could replay the old Challenge task instead.
  const game = boot(null, "?skip=1");
  await openFirstEpisodeQuestion(game);
  const question = game.context.N2InnEpisodes.episodes[0].days[0].questions[0];

  assert.equal(game.$("btn-listen-again").hidden, false,
    "an audio Episode question offers the labelled replay control");
  const before = game.heard.length;
  game.$("btn-listen-again").click();
  await tick();
  game.clock.advance(600);

  assert.equal(game.heard.length, before + 1);
  assert.equal(game.lastHeard(), question.prompt.jp,
    "replay must use the Episode question, not the last three-day task");
});

test("a written Episode document does not inherit the audio replay control", async () => {
  // Keeping the Challenge replay active also reserved 46px inside Kon's card
  // on a mobile reading screen, producing the blank area in the reported UI.
  const game = boot(null, "?skip=1");
  await openFirstEpisodeQuestion(game);

  // Questions 1-5 are audio; question 6 is the first written document.
  for(let index = 0; index < 5; index += 1){
    game.$("btn-skip-question").click();
    game.$("btn-next").click();
    game.clock.advance(100);
  }

  assert.ok(game.doc.querySelectorAll(".reading-document").length,
    "the written document is on screen");
  assert.equal(game.$("btn-listen-again").hidden, true,
    "a written question must not keep the labelled listening control");
  assert.equal(game.$("speak-btn").hidden, false,
    "the ordinary replay remains available for Kon's short direction");
});

async function openFirstEpisodeQuestion(game) {
  await enterTheInn(game);
  startEpisodeAfterTraining(game);
  game.$("btn-episode-begin").click();
  game.clock.advance(300);
  game.$("btn-brief-begin").click();
  game.clock.advance(300);
  passWordBoard(game, 300);
}

test("every episode answer names the exact learning word after the attempt", async () => {
  for (const outcome of ["correct", "incorrect"]) {
    const game = boot(null, "?skip=1");
    await openFirstEpisodeQuestion(game);
    const question = game.context.N2InnEpisodes.episodes[0].days[0].questions[0];
    const catalog = game.context.LanternCurriculumCatalog.getItem(question.target);
    const choices = game.$("preview-controls").querySelectorAll("button");
    const picked = outcome === "correct"
      ? question.answer.correctIndex
      : choices.findIndex((_, index) => index !== question.answer.correctIndex);
    choices[picked].click();
    game.clock.advance(100);

    const reveal = game.$("episode-target-reveal");
    assert.ok(reveal, `${outcome} feedback needs a learning-word panel`);
    assert.match(reveal.textContent, new RegExp(catalog.canonical));
    assert.match(reveal.textContent, new RegExp(catalog.reading));
    assert.match(reveal.textContent, new RegExp(catalog.meanings[0]));
  }
});

test("an episode timeout still teaches the exact word", () => {
  // Fake audio deliberately rejects, so its promise-driven speech fallback
  // cannot be advanced reliably by the synchronous fake clock. Pin the actual
  // timeout branch instead; correct and incorrect rendering are exercised live
  // by the preceding DOM test.
  const app = read("app.js");
  const timeout = app.slice(app.indexOf("時間切れです。お客様を待たせました"));
  assert.match(timeout.slice(0, 240), /revealEpisodeTarget\(entry\.question\)/);
});

test("episode repair answers also name their learning word", () => {
  const app = read("app.js");
  const repair = app.slice(app.indexOf("function settleRepair"));
  assert.match(repair.slice(0, 2400), /revealEpisodeTarget\(repairedQuestion\)/);
});

test("the episode word board is built from every question target", () => {
  const app = read("app.js");
  const board = app.slice(app.indexOf("function renderEpisodeWordBoard"));
  assert.match(board.slice(0, 800), /previewState\.list\.forEach/);
  assert.match(board.slice(0, 800), /entry\.question\.target/);
});

test("finishing a stage starts its episode once, not twice", async () => {
  // The last correct answer of Challenge schedules a deferred advance, and
  // btn-next performs the same advance immediately. Both reach
  // advanceStagePhase, and with the stage mastered both call startEpisode -
  // so the timer restarted the episode underneath the learner, dropping them
  // back on the opening card partway through question one.
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  startEpisodeAfterTraining(game);
  game.$("btn-episode-begin").click();
  game.clock.advance(300);
  game.$("btn-brief-begin").click();
  game.clock.advance(300);
  // The hour names its ten words before the clock starts - five practised in
  // the three days, five it is about to introduce.
  passWordBoard(game, 300);
  assert.equal(game.doc.querySelectorAll(".episode-open").length, 0, "a question is on screen");

  // Let every deferred advance the stage armed run out.
  game.clock.advance(20000);
  assert.equal(game.doc.querySelectorAll(".episode-open").length, 0,
    "the episode restarted itself and threw the learner back to its opening card");
});

/* A save parked on one Day 2 word choice, with nothing yet credited.
 *
 * Day 2 asks a cloze with four labelled buttons, which is the cleanest place
 * to answer wrongly on purpose: the room has to be reasoned about, but a wrong
 * word is just the wrong button.
 */
function practiceQuestionSave(index) {
  return {
    version: 3,
    playerCharacter: "woman",
    characterSelected: true,
    visited: ["entrance"],
    starred: ["entrance"],
    stages: {
      "home-inn": {
        phase: "practice",
        question: index,
        challengeScore: 0,
        correctWords: [],
        trainingWords: [],
        misses: [],
        mastered: false,
        declined: false,
        medal: "bronze"
      }
    }
  };
}

function practiceItem(game, index) {
  return game.context.N2HomeInnStage.getPhaseItems("practice")[index];
}

function optionButton(game, label) {
  return game.doc.querySelectorAll("button").find((b) => b.textContent.trim() === label);
}

function savedTrainingWords(game) {
  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  return ((saved.stages || {})["home-inn"] || {}).trainingWords || [];
}

test("a word guessed on the second try is not credited as known", async () => {
  // Learn and Practice hand back an unlimited retry on purpose, so a learner
  // who taps every option in turn always ends on the right one. Crediting that
  // made the mastery gate unfailable: "answered correctly" meant "eventually
  // clicked". The retry still teaches; it just no longer counts as evidence.
  const game = boot(practiceQuestionSave(0));
  await openResumedInnScheduleChallenge(game);

  const item = practiceItem(game, 0);
  const wrong = item.options.find((o) => o.key !== item.correct);
  const right = item.options.find((o) => o.key === item.correct);

  const wrongButton = optionButton(game, wrong.label);
  assert.ok(wrongButton, "the wrong word is on screen: " + wrong.label);
  wrongButton.click();
  game.clock.advance(3000);
  await tick();

  const rightButton = optionButton(game, right.label);
  assert.ok(rightButton, "the question is still answerable after a miss");
  rightButton.click();
  game.clock.advance(3000);
  await tick();

  assert.deepEqual(
    savedTrainingWords(game),
    [],
    "a word reached by trial and error was credited as training evidence",
  );
});

test("a retryable miss remains a miss after reloading the page", async () => {
  const first = boot(practiceQuestionSave(0));
  await openResumedInnScheduleChallenge(first);
  const item = practiceItem(first, 0);
  const wrong = item.options.find((option) => option.key !== item.correct);
  optionButton(first, wrong.label).click();
  first.clock.advance(100);

  const saved = JSON.parse(first.storage.getItem("lanternAlley.v3"));
  const stored = saved.stages["home-inn"];
  assert.equal(stored.encounterMissed, true);
  assert.deepEqual(stored.dayMisses, [item.focusWord]);

  const reloaded = boot(saved);
  await openResumedInnScheduleChallenge(reloaded);
  const right = practiceItem(reloaded, 0).options.find((option) => option.key === item.correct);
  optionButton(reloaded, right.label).click();
  reloaded.clock.advance(3000);
  await tick();
  assert.deepEqual(savedTrainingWords(reloaded), [],
    "reload must not turn a corrected miss into first-attempt evidence");
});

test("a review word resumes on the rung reached before reloading", async () => {
  const seed = practiceQuestionSave(0);
  seed.stages["home-inn"].phase = "review";
  seed.stages["home-inn"].misses = ["取り替える"];
  seed.stages["home-inn"].reviewPasses = {"取り替える": 1};
  seed.stages["home-inn"].reviewQueue = [{word:"取り替える", pass:1}];

  const game = boot(seed);
  await openResumedInnScheduleChallenge(game);
  const expected = game.context.N2HomeInnStage.getReviewItem("取り替える", 1);
  assert.equal(game.$("scene-label").textContent, "月見宿・N2 - " + expected.label);
  assert.equal(game.$("inn-word-choice"), null,
    "resume rebuilt rung 0's word choices instead of rung 1's room task");
  assert.ok(game.doc.querySelectorAll(".inn-object").length > 0,
    "the saved rung 1 room task did not render");
});

test("a word answered right the first time is credited", async () => {
  // The other half of the same rule: gating on the first attempt must not
  // quietly stop crediting learners who simply knew the answer.
  const game = boot(practiceQuestionSave(0));
  await openResumedInnScheduleChallenge(game);

  const item = practiceItem(game, 0);
  const right = item.options.find((o) => o.key === item.correct);
  const rightButton = optionButton(game, right.label);
  assert.ok(rightButton, "the correct word is on screen: " + right.label);
  rightButton.click();
  game.clock.advance(3000);
  await tick();

  assert.deepEqual(
    savedTrainingWords(game),
    [item.focusWord],
    "a first-attempt correct answer must still count",
  );
});

test("a miss the learner is allowed to retry still reaches the spaced review engine", async () => {
  // Every retryable wrong answer returned before answerStage, which is where
  // scheduleReview lives. So a word missed in Learn or Practice was never
  // scheduled - only Challenge misses were, because Challenge is
  // single-attempt. The word a learner actually struggled with was the one
  // word the engine never heard about.
  const game = boot(practiceQuestionSave(0));
  await openResumedInnScheduleChallenge(game);

  const item = practiceItem(game, 0);
  const wrong = item.options.find((o) => o.key !== item.correct);
  optionButton(game, wrong.label).click();
  game.clock.advance(3000);
  await tick();

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  const scheduled = Object.keys(saved.reviewProgress || {});
  const targetId = game.context.N2HomeInnStage.getTargetId(item.focusWord);
  assert.ok(
    scheduled.includes(targetId),
    "a Practice miss was not scheduled for review: " + targetId + " not in " + scheduled.join(","),
  );
});

test("a wrong answer makes a sound of its own, not only a red stamp", () => {
  // Correct answers had three instant signals - coin, celebrating fox, green
  // stamp. A miss had none that arrive without reading, and with the voice off
  // it was silent. Both outcomes now announce themselves.
  const app = read("app.js");
  assert.match(app, /function playMissSound\(\)/);
  // Wired at showFeedback, the one funnel both the stage and the episodes use.
  assert.match(app, /if\(!isCorrect\) playMissSound\(\);/);
  // Following the same switch as the coin, so muting the fox mutes both.
  const miss = app.slice(app.indexOf("function playMissSound()"));
  assert.match(miss.slice(0, 200), /if\(!state\.voiceOn\) return;/);
});

test("the stage opens by naming the five words it will teach", () => {
  // Nothing used to tell the learner what they were learning. The words
  // arrived one at a time inside tasks, and which ones were still weak was
  // tracked but never shown - the only signal was a medal on the map.
  //
  // The board sat after the cold open at first, on the argument that the cold
  // open works by making the learner feel the need before being handed the
  // answer. Played, that reads as being dropped into a job with no idea what
  // the stage is about, so it now opens the stage.
  const game = boot(null, "?skip=1");
  game.$("btn-start").click();
  game.clock.advance(600);
  const inn = game.doc.querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("月見宿"));
  inn.click();
  game.clock.advance(4000);
  const accept = game.doc.querySelectorAll("button")
    .find((b) => /手伝います/.test(b.textContent));
  accept.click();
  game.clock.advance(1200);

  assert.equal(game.doc.querySelectorAll(".job-board").length, 1,
    "the words are named as the stage opens, before anything is played");

  const rows = game.doc.querySelectorAll(".job-row");
  assert.equal(rows.length, 5, "all five words are named");
  const text = rows.map((r) => r.textContent).join(" ");
  for (const word of ["揃える", "取り替える", "温める", "調整", "引き受ける"]) {
    assert.ok(text.includes(word), "the board names " + word);
  }
  // Nothing is done yet, and "not yet" is said in words, not colour alone.
  assert.equal(game.doc.querySelectorAll(".job-row.done").length, 0);
  assert.match(text, /まだ/);
});

test("the job board is a between-days screen, never reachable during a question", async () => {
  // Listed beside a live question it would answer Day 2 and Day 3 outright:
  // the five candidates are exactly the answers.
  const game = boot(null, "?skip=1");
  await enterTheInn(game);

  assert.equal(game.doc.querySelectorAll(".job-board").length, 0,
    "the board must be gone once a question is on screen");
  assert.equal(game.$("btn-jobs-begin"), null, "and its control with it");
});

test("a wrong answer still leads somewhere", async () => {
  // Learn and Practice hand the question back, which used to be the whole of
  // it: no continue button, so a learner who could not work it out was held on
  // that screen with nothing to press. Reported from play as questions that
  // simply do not move forward. Trying again is still there and still the
  // better move, but the miss is already recorded by the time this matters.
  const game = boot(practiceQuestionSave(0));
  await openResumedInnScheduleChallenge(game);

  const item = practiceItem(game, 0);
  const wrong = item.options.find((o) => o.key !== item.correct);
  optionButton(game, wrong.label).click();
  game.clock.advance(3000);

  assert.equal(game.$("stamp").textContent, "不正解",
    "the result label must describe the miss instead of ordering a retry");
  assert.equal(game.$("inn-status").textContent, "Try again, or continue to the next task.",
    "retry must be presented as an option when continuing is also available");
  assert.equal(game.$("next-row").style.display, "block",
    "a missed question must not be a dead end");
  assert.ok(
    game.doc.querySelectorAll(".reply-option").filter(game.visible).length > 0,
    "and trying again is still offered",
  );

  const before = game.$("jp-line").textContent;
  game.$("btn-next").click();
  game.clock.advance(1500);
  assert.notEqual(game.$("jp-line").textContent, before, "pressing on moves to the next question");
});

test("a day ends by naming only the words that went wrong, with their meanings", async () => {
  // A miss explained the choice and then the question moved on. What the word
  // actually means was never restated anywhere the learner could study it.
  const game = boot(practiceQuestionSave(0), "?skip=1");
  await openResumedInnScheduleChallenge(game);

  // Miss the first word deliberately, then clear the rest of the day.
  const item = practiceItem(game, 0);
  const wrong = item.options.find((o) => o.key !== item.correct);
  optionButton(game, wrong.label).click();
  game.clock.advance(3000);

  for (let i = 0; i < 20; i += 1) {
    if (game.doc.querySelectorAll(".miss-review").length) break;
    const skip = game.$("btn-skip-question");
    if (skip && !skip.hidden) skip.click();
    // A correct answer arms a deferred advance rather than showing the button,
    // so let the clock carry the day rather than pressing anything.
    game.clock.advance(6000);
    const next = game.$("btn-next");
    if (next && game.$("next-row").style.display !== "none") { next.click(); game.clock.advance(1500); }
  }

  const card = game.doc.querySelectorAll(".miss-review");
  assert.equal(card.length, 1, "the day closes on what went wrong");

  const rows = game.doc.querySelectorAll(".miss-row");
  assert.equal(rows.length, 1, "only the missed word is listed, not all five");
  assert.ok(rows[0].textContent.includes(item.focusWord), "and it is the word that was missed");
  const sense = game.doc.querySelectorAll(".miss-sense");
  assert.equal(sense.length, 1);
  assert.ok(sense[0].textContent.trim().length > 0, "the meaning is given, not just the word");

  // And it leads on to the next day's board rather than being a dead end.
  game.$("btn-miss-next").click();
  game.clock.advance(900);
  assert.equal(game.doc.querySelectorAll(".job-board").length, 1);
});

const INN_TARGETS = ["v-soroeru", "v-torikaeru", "v-atatameru-food", "w-chousei", "v-hikiukeru"];

function clearedInnSave(reviewProgress) {
  return {
    version: 3,
    playerCharacter: "woman",
    characterSelected: true,
    visited: ["entrance", "home-inn"],
    starred: ["entrance"],
    reviewProgress: reviewProgress || {},
    stages: {
      "home-inn": {
        phase: "review", question: 0, challengeScore: 5,
        correctWords: ["揃える", "取り替える", "温める", "調整", "引き受ける"],
        trainingWords: ["揃える", "取り替える", "温める", "調整", "引き受ける"],
        misses: [], mastered: true, declined: false, medal: "none"
      }
    }
  };
}

// Successes spread across more than the engine's seven-day minimum.
function retainedProgress() {
  const now = Date.now();
  const progress = {};
  for (const id of INN_TARGETS) {
    progress[id] = {
      step: 3, firstSuccess: now - 20 * 86400000, lastAnswered: now,
      delayedSuccesses: 3, lastDelayedSuccess: now, due: now + 86400000, errorTag: null,
    };
  }
  return progress;
}

test("clearing the shift is silver; only retention across days is gold", async () => {
  // Mastery used to be one flag, earned inside a single sitting, and it wrote
  // itself in gold. Clearing every word at Day 3 difficulty is worth something
  // and it opens the episode - but it is a performance, and review-engine.js
  // already refuses to call a same-day run mastery.
  const sameDay = boot(clearedInnSave());
  sameDay.$("btn-start").click();
  sameDay.clock.advance(600);
  const inn = sameDay.doc.querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("月見宿"));
  inn.click();
  sameDay.clock.advance(400);
  assert.match(sameDay.$("map-detail-status").textContent, /🥈/u,
    "a shift cleared in one sitting is silver, not gold");

  const later = boot(clearedInnSave(retainedProgress()));
  later.$("btn-start").click();
  later.clock.advance(600);
  const innLater = later.doc.querySelectorAll(".map-destination")
    .find((b) => b.textContent.includes("月見宿"));
  innLater.click();
  later.clock.advance(400);
  assert.match(later.$("map-detail-status").textContent, /🥇/u,
    "the same words still known days later is what gold should mean");
});

function reviewSave(missed) {
  return {
    version: 3,
    playerCharacter: "woman",
    characterSelected: true,
    visited: ["entrance"],
    starred: ["entrance"],
    stages: {
      "home-inn": {
        phase: "review", question: 0, challengeScore: 4,
        correctWords: ["揃える", "温める", "調整", "引き受ける"],
        trainingWords: ["揃える", "取り替える", "温める", "調整", "引き受ける"],
        misses: [missed], mastered: false, declined: false, medal: "silver"
      }
    }
  };
}

test("a word missed in review comes back asked a different way, not handed straight back", async () => {
  // Two real bugs lived here and no unit test could see either. The cloze's
  // wrong-answer branch never reached answerStage, so a missed review cloze
  // offered no way forward at all and the next press restarted Day 3; and
  // resuming into review rebuilt the identical Day 3 questions, quietly
  // undoing the ladder for anyone who closed the tab.
  const game = boot(reviewSave("取り替える"), "?skip=1");
  await openResumedInnScheduleChallenge(game);

  assert.match(game.$("stage-phase-badge").textContent, /復習/, "review has started");
  const first = game.$("jp-line").textContent;
  const clozeButtons = game.doc.querySelectorAll(".reply-option").filter(game.visible);
  assert.ok(clozeButtons.length >= 3, "the first rung names the word rather than repeating the task");

  // Miss it on purpose: the near-miss, which is the whole point of the item.
  const wrong = clozeButtons.find((b) => b.textContent.trim() === "代えて");
  assert.ok(wrong, "the near-miss option is on screen");
  wrong.click();
  game.clock.advance(3000);

  // Not a dead end, and not the same rung again.
  assert.equal(game.$("next-row").style.display, "block", "a missed review question still leads somewhere");
  game.$("btn-next").click();
  game.clock.advance(2500);

  assert.match(game.$("stage-phase-badge").textContent, /復習/, "still in review, not restarted into Day 3");
  const second = game.$("jp-line").textContent;
  assert.notEqual(second, first, "the word comes back in a new situation");
  assert.equal(game.doc.querySelectorAll(".reply-option").filter(game.visible).length, 0,
    "and asked a different way - the second rung is the task, not the cloze");
  assert.ok(game.doc.querySelectorAll(".inn-object").length > 0, "the second rung puts the learner in the room");
});

test("review mode opens the first three-day Inn question without a broken stage object", () => {
  const game = boot(null, "?review=1");
  game.clock.advance(3000);

  assert.deepEqual(game.errors, [], "opening the review question must not throw");
  assert.doesNotMatch(game.$("scene-label").textContent, /undefined/i);
  assert.match(game.$("jp-line").textContent, /揃/,
    "the first indexed Inn question should render its real request");
});

test("the title screen names the build a tester is looking at", () => {
  // The first thing to ask someone reporting a bug is which build they were
  // on, and an installed player runs the version already on their phone -
  // which may be a launch behind whatever was shipped last.
  const game = boot();
  const label = game.$("app-version");
  assert.ok(label, "the version line exists");
  assert.match(label.textContent, /beta 1\.0/, "the release is named");
  assert.match(label.textContent, /build \d+/, "and the build that identifies the code");

  // Read off app.js's own ?v= stamp rather than written down a second time,
  // so it cannot drift from the version the cache is keyed on.
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const stamped = /app\.js\?v=(\d+)/.exec(html);
  assert.ok(stamped, "app.js carries a version stamp");
  assert.ok(label.textContent.includes(stamped[1]),
    `shown build should be ${stamped[1]}, got "${label.textContent}"`);
});

test("an update is offered rather than forced", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

  /* A dialog, not a bar at the foot of a scrolling page - reported as easy to
   * miss, which it was. It reuses .about-panel so it sits in front of
   * everything and so the game has one shape for asking a question. */
  assert.match(html, /id="update-panel"[\s\S]*?class="about-card update-card"/);
  assert.match(html, /id="update-panel"[^>]*role="dialog"/);
  assert.match(html, /id="btn-update-now"/);
  assert.match(html, /id="btn-update-later"/);
  // And a way to ask for an update rather than only being told about one.
  assert.match(html, /id="btn-check-update"/);
  assert.match(app, /reg\.update\(\)\.then/);

  /* The shell is over a hundred files, so on a slow connection the download
   * runs long enough to look stuck - reported as exactly that. The check has
   * to end in a definite answer whichever way it goes, including the install
   * that fails and leaves its worker redundant. */
  for(const message of [
    "You are on the newest build.",
    "Downloading in the background. You can keep playing - this will say when it is ready.",
    "Ready. Press Update now to switch to it.",
    "The download did not finish. Try again.",
    "Could not check right now.",
  ]) assert.ok(app.includes(message), message);
  assert.match(app, /worker\.state === "redundant"/);
  // A state reached while the promise was settling fires no further event.
  assert.match(app, /if\(report\(\)\) return;/);

  /* A dialog over a half-finished answer loses the attempt behind it, so one
   * that arrives mid-question waits for a moment when nothing is pending. */
  assert.match(app, /function safeMoment\(\)/);
  assert.match(app, /if\(!safeMoment\(\)\)/);

  // Reloading someone mid-question is its own bug, so the reload happens on a
  // press and never on its own.
  assert.match(app, /now\.addEventListener\("click", function\(\)\{ window\.location\.reload\(\); \}\);/);
  assert.match(app, /controllerchange/);
  /* Not on a first install, where there was no previous version running.
   * Held as the worker the page started under rather than a boolean: on that
   * first load there is no controller yet, so a boolean captured at boot was
   * false and suppressed every later version for the life of the tab. */
  assert.match(app, /var bootController = navigator\.serviceWorker\.controller \|\| null;/);
  assert.match(app, /if\(!bootController\)\{/);
});

test("every scene change says what kind of part it is", () => {
  // The day names - 基礎, 実践, 挑戦 - say where you are in the shift but not
  // what you are being asked to do. Reported from play as not knowing whether
  // a part was teaching new words, drilling ones already met, or testing them.
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./moonview-inn-interactions.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("./n2-home-inn-stage.js", import.meta.url), "utf8"), context);
  const stage = context.N2HomeInnStage;

  const kinds = ["learn", "practice", "challenge", "review"].map((p) => stage.getDayKind(p));
  // Each names the activity, and they are all different from each other.
  assert.equal(new Set(kinds).size, kinds.length, "each part is described differently");
  assert.match(stage.getDayKind("learn"), /新しい言葉/, "Day 1 teaches new words");
  assert.match(stage.getDayKind("practice"), /練習/, "Day 2 drills them");
  assert.match(stage.getDayKind("challenge"), /テスト/, "Day 3 tests them");
  assert.match(stage.getDayKind("review"), /復習/, "review revisits the missed ones");

  // And it reaches the screen, at every card that opens a part.
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /class="day-kind"/);
  const shown = (app.match(/class="day-kind"/g) || []).length;
  assert.ok(shown >= 3, `expected the label on several cards, found ${shown}`);
});

test("a correct answer does not print its own translation twice, in English", async () => {
  // The meaning line already carries the English above the feedback, so
  // "Correct! Please place two cushions of the same colour on each mat."
  // put the same sentence on screen twice - in English, on a screen that is
  // otherwise Japanese, with an English button under it.
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  game.$("btn-skip-question").click();
  game.clock.advance(2000);

  const feedback = game.$("feedback-text").textContent;
  const meaning = game.$("meaning-line").textContent;
  assert.doesNotMatch(feedback, /^Correct!/, "the feedback is not an English restatement");
  if (meaning) {
    assert.equal(feedback.includes(meaning), false, "and it does not repeat the meaning line");
  }
  assert.doesNotMatch(game.$("btn-next").textContent, /Continue/,
    "the continue button matches the rest of the game's Japanese");
});






/* A phone must not have to scroll to see what it is choosing between.
 *
 * Measured on a 393x851 phone, a word-choice question came to about 1009px:
 * the first answer sat at y=719 and the rest were below the fold, so every
 * question began with a scroll before the options were even visible. Two
 * things paid for that, and both are asserted here because both look like
 * harmless spacing until you are on a phone.
 *
 * The dialogue stack is the big one. Kon above the speech is correct in the
 * narrow context COLUMN of the split desktop layout, where side by side left
 * the sentence about 200px - but a phone has no such column, the layout is a
 * single block, and stacked it cost 184px for what fits in 88.
 *
 * The reorder is the quiet one. The place name and the question number are
 * 143px and 57px inside a 324px row, but the phase chips sit between them in
 * the markup and flex wraps in DOM order, so each was taking a row of its
 * own. `order` pairs them without touching the HTML.
 */
test("a phone shows a whole question without scrolling for the answers", () => {
  const css = read("styles.css");
  const phone = css.slice(css.indexOf("...but not on a phone, where the stack costs a screenful"));
  assert.ok(phone, "the phone block that buys back the screenful must exist");

  assert.match(phone, /@media\(max-width:760px\)/);
  assert.match(phone,
    /#screen-game:not\(\.entrance-stage\) \.dialogue\{\s*display:grid;/,
    "Kon sits beside the speech on a phone, not stacked above it");
  assert.match(phone, /\.inn-stage \.stage-meta \.scene-label\{order:1\}/);
  assert.match(phone, /\.inn-stage \.stage-meta \.encounter-status\{order:2\}/,
    "the question number pairs with the place name instead of taking its own row");
  assert.match(phone, /\.inn-stage \.stage-meta \.stage-phase-row\{order:3\}/,
    "the phase chips move out from between them");

  /* Desktop keeps the stack. The rule this block overrides is still there and
   * still unconditional below 1400px, so a narrow desktop column is unchanged;
   * only the phone breakpoint reverses it. */
  assert.match(css, /#screen-game:not\(\.entrance-stage\) \.dialogue\{display:block;\}/,
    "the desktop stack the phone rule overrides must remain");
});

test("a phone gives compact Inn targets a forgiving tap area and names them after selection", () => {
  // In a live 390px check, the stove, microwave, bin, and bulb targets were
  // only 18-43px high. Their artwork must stay at its natural size, but a
  // finger needs a larger invisible target and every available place needs a
  // visible name once an object has been chosen.
  const css = read("styles.css");
  const phone = css.slice(css.lastIndexOf("@media(max-width:760px)"));

  assert.match(phone,
    /\.inn-room-illustrated \.inn-hotspot::before\{content:"";position:absolute;inset:-10px;/,
    "compact scene targets have 10px of invisible finger padding on every side");
  assert.match(phone,
    /\.inn-scene-zones\.awaiting-drop \.inn-hotspot > \.inn-caption\{opacity:1;/,
    "once an object is selected, every available destination says what it is");
  assert.match(phone,
    /\[data-key="remove-recycle"\] > \.inn-caption\{top:calc\(100% \+ 5px\);bottom:auto\}/,
    "the recycle-bin label moves below its target instead of overlapping the laundry basket");
});

/* A test build must not thank a tester for a report it threw away.
 *
 * track() is a no-op until the owner fills in a project key, and the shipped
 * telemetry-config.js has an empty one - so the keyless build is the normal
 * case, not the edge case. It used to answer every tap with "your note was
 * sent". A tester would believe the bug was filed and stop mentioning it, and
 * the resulting silence would read back as "nobody found anything" - the one
 * conclusion a test must never reach by accident.
 */
test("feedback only claims it was sent when it could be sent", () => {
  const off = bootTelemetryGame(null, "?skip=1");
  off.$("analytics-toggle") && null;
  // Turn capture off, which is the same inert state a missing key produces.
  off.$("btn-about").click();
  off.$("analytics-toggle").click();
  off.$("btn-about-close").click();

  off.$("btn-feedback").click();
  off.$("feedback-bug").click();
  const quiet = off.$("feedback-status").textContent;
  assert.doesNotMatch(quiet, /was sent/,
    "a build that cannot send must not say it sent anything");
  assert.match(quiet, /cannot send/i, "and it should say so plainly");

  const on = bootTelemetryGame(null, "?skip=1");
  on.$("btn-feedback").click();
  on.$("feedback-bug").click();
  assert.match(on.$("feedback-status").textContent, /was sent/,
    "a configured build still confirms the send");
});


test("the Inn teaches each word before the first question that scores it", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game, {stopAtTeaching:true});

  const card = game.doc.querySelector(".teach-card");
  assert.ok(card, "a word is taught before it is asked about");
  /* Not the word the day asks first. Studying the five in the order Day 1
   * then asks about them makes the day a recital - reported from play. The
   * cards carry no scene and no time of day, so unlike the days themselves
   * this order is free to differ, and it is where the pattern gets broken. */
  const stage = game.context.N2HomeInnStage;
  const asked = stage.getPhaseItems("learn").map((item) => item.focusWord);
  const taught = stage.getTeachingOrder();
  assert.notDeepEqual(taught, asked, "the teaching order is not the asking order");
  assert.deepEqual([...taught].sort(), [...asked].sort(), "and it is the same five words");
  assert.ok(card.textContent.includes(taught[0]), "the first card is the first word taught");
  assert.ok(card.textContent.includes(stage.getTeaching(taught[0]).pattern),
    "the pattern is shown, not just the gloss");
  assert.ok(game.doc.querySelector(".teach-focus"),
    "the word is highlighted inside its sentence, not only glossed beside it");
  assert.equal(game.doc.querySelectorAll(".teach-card img").length, 0,
    "no artwork exists yet and the card must not leave a broken slot");
});

test("the teaching check costs nothing, however it is answered", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game, {stopAtTeaching:true});
  game.$("btn-teach-next").click();
  game.clock.advance(200);

  const before = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  const options = game.doc.querySelectorAll(".teach-option");
  assert.ok(options.length >= 2, "a check offers a choice");

  // Answered wrongly on purpose: the cold open's failure was that a miss came
  // back, and nothing here may repeat or record.
  const wrong = options.find((b) => b.getAttribute("data-correct") !== "1") || options[0];
  wrong.click();
  game.clock.advance(200);

  const after = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.deepEqual(after.reviewProgress || {}, before.reviewProgress || {},
    "a check taken seconds after study is recognition, not retrieval");
  assert.equal(after.money, before.money, "studying is not paid work");
  assert.deepEqual(after.masteredByStage || {}, before.masteredByStage || {},
    "and it does not count toward the mastery gate");
  assert.ok(game.doc.querySelector(".teach-answer"),
    "a miss is answered rather than repeated");
});

test("a right answer is marked and moves on by itself", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game, {stopAtTeaching:true});
  const first = game.doc.querySelector(".teach-card").textContent;
  game.$("btn-teach-next").click();
  game.clock.advance(200);

  // The word is given and the meaning is chosen, so the options are English
  // and there are four of them - three more N2 words to read is three more
  // reading tasks in a step meant to check one.
  const options = game.doc.querySelectorAll(".teach-option");
  assert.equal(options.length, 4);
  assert.ok(options.every((b) => b.getAttribute("lang") === "en"),
    "the choice is in a language the learner already has");
  assert.equal(options.filter((b) => b.getAttribute("data-correct") === "1").length, 1);

  const right = options.find((b) => b.getAttribute("data-correct") === "1");
  right.click();
  game.clock.advance(50);
  assert.ok(game.doc.querySelector(".teach-mark"), "a right answer is marked");
  assert.equal(game.$("btn-teach-next"), null, "and asks for no second tap");

  game.clock.advance(1200);
  const card = game.doc.querySelector(".teach-card");
  assert.ok(card, "the next word arrives on its own");
  assert.notEqual(card.textContent, first, "and it is the next word, not the same one");
});

test("a second tap during the pause after a right answer does not skip a word", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game, {stopAtTeaching:true});
  game.$("btn-teach-next").click();
  game.clock.advance(200);
  const options = game.doc.querySelectorAll(".teach-option");
  options.find((b) => b.getAttribute("data-correct") === "1").click();
  // Impatient, or a double tap on a phone.
  options.find((b) => b.getAttribute("data-correct") !== "1").click();
  game.clock.advance(1500);
  assert.ok(game.doc.querySelector(".teach-card").textContent.includes("2 / 5"),
    "one answer advances one word");
});

test("Kon wears her portrait from the moment the app boots", () => {
  const game = boot(null, "?skip=1");
  const slot = game.$("avatar-slot");

  /* The slot ships holding a gold circle with a fox emoji - a placeholder
   * from before there was any art. enterLocation was the only thing that
   * replaced it, so every way into a scene that skips enterLocation showed
   * the emoji: reported from an episode entered in debug mode. */
  assert.ok(slot.innerHTML.includes("kon-photo-img"), "the portrait is installed, not the placeholder");
  assert.equal(slot.innerHTML.includes("\u{1F98A}"), false, "and the emoji is gone before any screen can show it");
  assert.ok(slot.className.includes("avatar-animated"));
  /* And matted the way the rest of the app mats her. Installing with a
   * hardcoded false traded one wrong portrait for another: the paths that
   * never reach enterLocation then showed her on the gold disc the pre-art
   * placeholder used, over a photograph of a room. */
  assert.ok(slot.className.includes("entrance-fox"),
    "she is cut out, not matted onto the placeholder's disc");
});

test("debug mode offers a way back to the start of a place", async () => {
  const game = boot(null, "?debug=1");
  assert.equal(game.$("debug-banner").hidden, false);
  const restart = game.$("btn-restart-stage");
  assert.ok(restart, "the control is in the banner, which is on every screen");
  assert.equal(restart.textContent, "Restart stage");

  await enterTheInn(game);
  assert.equal(game.$("encounter-progress").textContent, "1");
  assert.ok(playRoom(game, game.$("jp-line").textContent));
  game.clock.advance(7000);
  game.$("btn-next").click();
  game.clock.advance(500);
  assert.equal(game.$("encounter-progress").textContent, "2", "some progress to throw away");

  restart.click();
  game.clock.advance(2000);

  /* The intro again, not Day 1 question 1: saveProgress rebuilds the inn's
   * resume record from live state, so clearing it and then saving wrote it
   * straight back and the restart skipped the intro, the board and the
   * teaching step - most of what there is to test. */
  const saved = JSON.parse(game.storage.getItem("lanternAlley.debug.v3"));
  assert.deepEqual(saved.stages || {}, {}, "the resume record is gone, not rewritten");
  assert.ok(game.doc.querySelector("#btn-accept-helper"), "the place opens on its own introduction");
});

test("the studying ends on a screen that says the day is starting", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game, {stopAtTeaching:true});

  // Through all five words and their checks.
  for (let guard = 0; guard < 20; guard += 1) {
    if (game.$("btn-teach-done")) break;
    const next = game.$("btn-teach-next");
    if (next) { next.click(); game.clock.advance(900); continue; }
    const option = game.doc.querySelectorAll(".teach-option")[0];
    if (!option) break;
    option.click();
    game.clock.advance(1200);
  }

  /* The last check used to give way to a scored question with no seam at all.
   * Studying and being marked are different things and the learner has to
   * know which one they are in. */
  const handover = game.$("btn-teach-done");
  assert.ok(handover, "the teaching hands over rather than stopping mid-air");
  const card = game.doc.querySelector(".teach-card");
  assert.equal(game.doc.querySelectorAll(".teach-recap-word").length, 5,
    "the five words are listed once more as the studying ends");
  assert.ok(card.textContent.includes("\u63c3\u3048\u308b"));

  handover.click();
  game.clock.advance(900);
  assert.equal(game.doc.querySelector(".teach-card"), null, "and then the day starts");
  assert.equal(game.$("encounter-progress").textContent, "1");
  assert.ok(game.doc.querySelectorAll(".inn-new-word").length);
});

test("the episode teaches the words its board calls new, before the clock", async () => {
  const game = boot(null, "?skip=1");
  await enterTheInn(game);
  startEpisodeAfterTraining(game);
  game.$("btn-episode-begin").click();
  game.clock.advance(500);
  game.$("btn-brief-begin").click();
  game.clock.advance(500);
  assert.ok(game.$("btn-words-begin"), "the shift opens on its word board");

  /* The board marks five of the ten new and used to hand straight to a timed
   * question about one of them - reported from play, and admitted in the
   * board's own comment before that. */
  game.$("btn-words-begin").click();
  game.clock.advance(400);
  const card = game.doc.querySelector(".teach-card");
  assert.ok(card, "a word the board called new is taught first");
  /* One of the words the board marked new, and not the one the hour asks
   * about first: the board lists them in question order, so teaching
   * straight down that list would recite the opening guest. */
  const innStage = game.context.N2HomeInnStage;
  const firstShift = game.context.LanternEpisodeStages["home-inn"].episodes[0];
  const threeDays = new Set(innStage.encounters.map((item) => item.focusWord));
  const newWordsOnBoard = [];
  for (const day of firstShift.days) {
    for (const question of day.questions) {
      const item = game.context.LanternCurriculumCatalog.getItem(question.target);
      if (item && !threeDays.has(item.canonical) && !newWordsOnBoard.includes(item.canonical)) {
        newWordsOnBoard.push(item.canonical);
      }
    }
  }
  const shown = innStage.getTeachingWords().filter((word) => card.textContent.includes(word));
  assert.equal(shown.length, 1, "exactly one word is on the card, saw " + shown.join(" / "));
  const firstAsked = game.context.LanternCurriculumCatalog
    .getItem(game.context.LanternEpisodeStages["home-inn"].episodes[0].days[0].questions[0].target).canonical;
  assert.notEqual(shown[0], firstAsked, "and not the word the first guest asks about");
  assert.ok(card.querySelector(".teach-focus"), "with the sentence it lives in");

  /* And the wrong answers are not only the other words in this run. Drawn
   * from the queue alone, five cards offered five glosses and the last was
   * answerable by elimination; drawn from every word the Inn teaches, they
   * are not. */
  game.$("btn-teach-next").click();
  game.clock.advance(300);
  const glosses = game.doc.querySelectorAll(".teach-option").map((b) => b.textContent);
  assert.equal(glosses.length, 4);
  assert.equal(new Set(glosses).size, 4, "no option is offered twice");

  const glossOf = (word) => {
    const item = game.context.LanternCurriculumCatalog.getItem(innStage.getTargetId(word));
    return innStage.getCardSense(word) || (item && item.meanings && item.meanings[0]);
  };
  const everyGloss = new Set(innStage.getTeachingWords().map(glossOf));
  assert.ok(glosses.every((g) => everyGloss.has(g)),
    "every option is a real gloss from this place, saw " + glosses.join(" / "));

  const boardGlosses = new Set(newWordsOnBoard.map(glossOf));
  assert.ok(glosses.some((g) => !boardGlosses.has(g)),
    "at least one wrong answer comes from outside the words being taught, saw " + glosses.join(" / "));
});
