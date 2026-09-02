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
function boot(seed, search) {
  const html = read("index.html");
  const body = html.slice(html.indexOf("<body"), html.lastIndexOf("</body>"));
  const doc = new FakeDocument();
  parseInto(doc, doc.body, body.slice(body.indexOf(">") + 1));

  const clock = new FakeClock();
  const storage = new FakeStorage();
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
    location: { href: "http://localhost/" + (search || ""), search: search || "" },
    fetch: () => Promise.reject(new Error("no network in tests")),
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);

  // The page stamps a cache version onto each URL; the file on disk has no
  // query, so strip it before reading.
  const scripts = [...html.matchAll(/src="([^"?]+\.js)(\?v=\d+)?"/g)].map((m) => m[1]);
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

/* Getting to the Inn, and then playing whatever is put in front of us.
 *
 * Shared by both walkthroughs: one checks that nothing is ever dead, the other
 * that the second episode is actually reachable by playing. Neither solves
 * anything cleverly - wrong answers are fine.
 */
async function enterTheInn(game) {
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
  await tick();
}

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

test("home lighting is automatic and has no manual controls", () => {
  const game = boot(plantedCamelliaSave());
  enterHome(game);
  assert.equal(game.doc.querySelectorAll("[data-lighting]").length, 0);
  assert.ok(game.doc.querySelectorAll(".home-scene")[0].className.includes("light-"));
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
  assert.equal(game.$("screen-map").style.display, "block", "clicking it returns to the map");
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
    home: { owned: [], placed: {} }, homeVisited: true,
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
  });
}

test("first home visit starts with an unplanted seed in garden stock", () => {
  const game = boot(freshHomeSave());
  enterHome(game);

  const plants = gardenOf(game).plants;
  assert.equal(plants.length, 1);
  assert.equal(plants[0].typeId, "camellia");
  assert.equal(plants[0].stage, "planted");
  assert.equal(plants[0].slotId, null, "the learner chooses where to plant it");

  game.doc.querySelectorAll("[data-home-decorate]")[0].click();
  const stock = game.doc.querySelectorAll("[data-pick-plant]")[0];
  assert.ok(stock, "the free camellia seed is already in garden stock");
  const image = stock.querySelector("img");
  assert.match(image.getAttribute("src"), /camellia-planted-gravel-v2\.webp$/,
    "stock must show the planted stage, not a mature bush");
});

test("first home visit starts with an unplaced cushion in indoor stock", () => {
  const game = boot(freshHomeSave());
  enterHome(game);
  let saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.deepEqual(saved.home.owned, ["floor-cushion-navy"]);
  assert.deepEqual(saved.home.placed, {});
  assert.equal(saved.starterCushionClaimed, true);

  game.doc.querySelectorAll("[data-home-decorate]")[0].click();
  game.doc.querySelectorAll("[data-pick-plant]")[0].click();
  game.doc.querySelectorAll(".home-target")[0].click();
  game.doc.querySelectorAll("[data-enter-house]")[0].click();
  game.doc.querySelectorAll("[data-home-decorate]")[0].click();
  assert.ok(game.doc.querySelectorAll('[data-pick="floor-cushion-navy"]')[0],
    "the cushion is waiting in indoor stock");
  saved = JSON.parse(game.storage.getItem("lanternAlley.v3"));
  assert.deepEqual(saved.home.placed, {}, "the learner chooses where to place it");
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
  assert.ok(paintedDecor.length < decor.catalogue().length,
    "some items are still unpainted, so this test is actually excluding something");
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
test("the ?skip=1 flag lands on the map without playing the Entrance", () => {
  const game = boot(null, "?skip=1");
  game.clock.advance(50);

  const saved = JSON.parse(game.storage.getItem("lanternAlley.v3") || "{}");
  assert.equal(saved.characterSelected, true, "a character is pre-selected");
  assert.ok(saved.visited.includes("entrance"), "the Entrance is pre-visited");

  game.$("btn-start").click();
  game.clock.advance(200);
  assert.equal(game.$("screen-map").style.display, "block",
    "start goes straight to the map, not the Entrance or character select");
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
