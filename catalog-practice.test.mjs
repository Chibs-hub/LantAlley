import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "catalog-practice.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  return context;
}

test("three card types are generated from data the catalog already has", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const item = catalog.items.find((i) => i.hasKanji && i.examples.length);
  const cards = practice.buildPracticeCards(item, catalog);

  const kinds = cards.map((c) => c.kind).sort();
  assert.equal(kinds.join(","), "cloze,meaning,reading");
  for (const card of cards) {
    assert.equal(card.options.length, 4, `${card.kind} needs four choices`);
    assert.ok(card.options[card.correctIndex], `${card.kind} has no correct answer`);
    assert.equal(new Set(card.options).size, 4, `${card.kind} repeats an option`);
    assert.equal(card.target, item.id);
  }
});

test("a card is never generated from data the item lacks", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();

  // A kana headword has no reading to ask for - the word is its own reading.
  const kana = catalog.items.find((i) => !i.hasKanji && i.examples.length);
  assert.equal(practice.buildPracticeCards(kana, catalog).some((c) => c.kind === "reading"), false);

  // No example sentence means no cloze.
  const noExample = catalog.items.find((i) => !i.examples.length);
  assert.equal(practice.buildPracticeCards(noExample, catalog).some((c) => c.kind === "cloze"), false);
});

test("a cloze hides the word it is testing", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  // A cloze needs a kanji headword: a kana one can match inside an inflection
  // and blank out a fragment rather than a word.
  const item = catalog.items.find((i) => i.hasKanji && i.canonical.length >= 2
    && i.examples.length && i.examples[0].ja.includes(i.canonical));
  const cloze = practice.buildPracticeCards(item, catalog).find((c) => c.kind === "cloze");

  // Every example in this source contains its headword, so blanking it is safe.
  assert.ok(cloze.prompt.includes("（　　）"), "the blank is missing");
  assert.equal(cloze.prompt.includes(item.canonical), false, "the cloze shows its own answer");
});

test("distractors come from the same partition and never repeat the answer", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const item = catalog.items.find((i) => i.hasKanji && i.examples.length);
  const cards = practice.buildPracticeCards(item, catalog);

  for (const card of cards) {
    const answer = card.options[card.correctIndex];
    const others = card.options.filter((_, i) => i !== card.correctIndex);
    assert.equal(others.includes(answer), false, `${card.kind} repeats its answer as a distractor`);
    for (const other of others) assert.ok(other && other.length, `${card.kind} has an empty distractor`);
  }
});

test("generation is deterministic under an injected random", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const item = catalog.items.find((i) => i.hasKanji && i.examples.length);
  const fixed = () => 0.42;
  const a = practice.buildPracticeCards(item, catalog, fixed);
  const b = practice.buildPracticeCards(item, catalog, fixed);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test("a session draws from the location's own partition and prefers unseen words", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const progress = { items: {} };
  const session = practice.getPracticeSession("home-inn", progress, catalog, 8);

  assert.equal(session.length, 8);
  for (const card of session) {
    assert.equal(catalog.getItem(card.target).partition, "home-inn", "drew from another location");
  }

  // Once seen, an item should give way to one that has not been.
  const seen = {};
  session.forEach((card) => { seen[card.target] = "tested"; });
  const next = practice.getPracticeSession("home-inn", { items: seen }, catalog, 8);
  const repeats = next.filter((card) => seen[card.target]).length;
  assert.ok(repeats < 8, "every card repeated an item already tested");
});

test("coverage moves as the learner works", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const before = catalog.getCoverage({});
  const session = practice.getPracticeSession("home-inn", { items: {} }, catalog, 5);

  const assignments = {};
  session.forEach((card) => { assignments[card.target] = "tested"; });
  const after = catalog.getCoverage(assignments);

  assert.equal(before.tested, 0);
  assert.ok(after.tested > 0, "answering taught nothing");
  assert.ok(after.untestedIds.length < before.untestedIds.length);
});

test("practice cards carry no audio requirement", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const item = catalog.items.find((i) => i.hasKanji && i.examples.length);
  // Tier 2 is what makes coverage affordable: 3,500 items cannot each carry a
  // rendered clip. Anything asking for audio here breaks the delivery budget.
  for (const card of practice.buildPracticeCards(item, catalog)) {
    assert.notEqual(card.audio, true);
  }
});

test("a cloze never blanks a fragment out of an inflected form", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  let seed = 7;
  const random = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  // 「あっ」 out of 「何かあった？」 leaves 「何か（　　）た？」, which asks nothing.
  // Sample widely rather than trusting one example.
  let checked = 0;
  // Sample across the whole catalog: the first few hundred entries sort as
  // kana words, which produce no cloze by design.
  for (const item of catalog.items.filter((_, i) => i % 7 === 0)) {
    const cloze = practice.buildPracticeCards(item, catalog, random).find((c) => c.kind === "cloze");
    if (!cloze) continue;
    checked += 1;
    assert.ok(item.hasKanji, `${item.canonical} produced a cloze without a kanji`);
    assert.ok(cloze.prompt.length > item.canonical.length, `${item.canonical} left almost nothing`);
  }
  assert.ok(checked > 20, `only ${checked} cloze cards in 400 items`);
});

// The generator being correct is worthless if nothing in the game opens it.
// These pin the wiring that made the session reachable.
test("the map exposes a practice entry that survives leaving the Inn", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

  assert.ok(html.includes('id="map-detail-practice"'), "practice button exists");
  // It must live in the map's progress row, not the detail shelf: clicking a
  // destination now enters it, so the shelf never stays on screen.
  const progressRow = html.slice(html.indexOf('id="map-progress'));
  assert.ok(progressRow.slice(0, 600).includes("map-detail-practice"),
    "practice button sits in the map progress row");
  assert.ok(app.includes('practiceBtn.hidden = !canPractise'), "visibility is driven by state");
  assert.ok(/canPractise[\s\S]{0,200}state\.stageProgress\.homeInn/.test(app),
    "starting the Inn is enough to unlock practice");
});

test("a finished session reports its score before returning to the map", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.ok(app.includes("function renderPracticeDone"), "there is a completion card");
  assert.ok(/practiceState\.finished[\s\S]{0,200}renderPracticeDone/.test(app),
    "the completion card is shown before the map");
});

test("answering marks the item and never downgrades a tested word", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.ok(app.includes('markItemState(card.target, right ? "tested" : "seen")'),
    "both outcomes mark the item");
  assert.ok(/state\.itemStates\[id\] === "tested" && value === "seen"/.test(app),
    "a tested item is not downgraded to seen");
});
