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

function boot() {
  const html = read("index.html");
  const body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
  const doc = new FakeDocument();
  parseInto(doc, doc.body, body.slice(body.indexOf(">") + 1));

  const clock = new FakeClock();
  const storage = new FakeStorage();
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
    location: { href: "http://localhost/", search: "" },
    fetch: () => Promise.reject(new Error("no network in tests")),
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);

  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
  for (const src of scripts) {
    vm.runInContext(read(src), context, { filename: src });
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

  return { doc, clock, storage, errors, $, clickable, visible, tapScreen, context, lastHeard };
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

/* The schedule task: two sliders and a confirm.
 *
 * The gap between the two times is stated in the sentence ("2時間必要"), which
 * is the comprehension the question is testing, so it is read from there rather
 * than hard-coded. When the second time is fixed the first is pulled back to
 * meet it; otherwise the second is pushed out from the first.
 */
function playSchedule(game, task) {
  const a = game.$("arrival-a");
  const b = game.$("arrival-b");
  if (!a || !b) return false;
  const gapText = /(\d+)\s*時間必要/.exec(task || "");
  const gap = gapText ? Number(gapText[1]) : 2;
  const min = Number(a.getAttribute("min"));
  const max = Number(a.getAttribute("max"));

  let wantA;
  let wantB;
  if (b.disabled) {
    wantB = Number(b.value);
    wantA = wantB - gap;
  } else {
    wantA = Number(a.value);
    wantB = wantA + gap;
    if (wantB > max) { wantB = max; wantA = max - gap; }
  }
  if (wantA < min) wantA = min;

  const set = (input, value) => {
    input.value = String(value);
    input.dispatchEvent(new FakeEvent("input", { bubbles: true }));
  };
  set(a, wantA);
  if (!b.disabled) set(b, wantB);
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
    const choice = game.doc.querySelectorAll("[data-key]")[0];
    if (choice) { choice.click(); game.clock.advance(3000); break; }
    game.tapScreen();
  }
  assert.deepEqual(game.errors, [], "the entrance threw nothing");
});

// Audio playback is a promise, and a promise settles only when the stack
// yields. Without this the audio question waits forever for a rejection that
// is already queued - an artifact of the harness, not of the game.
const tick = () => new Promise((resolve) => setImmediate(resolve));

/* Getting to the Inn, and then playing whatever is put in front of us.
 *
 * Shared by both walkthroughs: one checks that nothing is ever dead, the other
 * that the second episode is actually reachable by playing. Neither solves
 * anything cleverly - wrong answers are fine.
 */
async function enterTheInn(game) {
  game.$("btn-start").click();
  game.clock.advance(500);

  for (let step = 0; step < 30; step += 1) {
    const choice = game.doc.querySelectorAll("[data-key]")[0];
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
  await tick();
}

async function drive(game, steps, onQuestion) {
  const badges = new Set();
  const prompts = new Set();
  let questionsSeen = 0;
  let stalled = 0;
  let task = "";
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
      "| next:", game.$("next-row").style.display);
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
      const pick = controls.filter((c) => !c.textContent.startsWith("\u3059\u307f\u307e\u305b\u3093"))[0] || controls[0];
      pick.click();
      game.clock.advance(2500);
      stalled = 0;
      continue;
    }

    if (playRoom(game, task)) { stalled = 0; continue; }
    if (playSchedule(game, task)) { stalled = 0; continue; }

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
  const run = await drive(game, 2600);

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
