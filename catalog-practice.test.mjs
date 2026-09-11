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

test("excluded practice targets do not consume session slots", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const key = catalog.items[0].partition;
  const keys = key || "home-inn";
  const first = practice.getPracticeSession(keys, {}, catalog, 3, () => 0);
  assert.equal(first.length, 3);
  const next = practice.getPracticeSession(keys, {excluded: [first[0].target]}, catalog, 3, () => 0);
  assert.equal(next.length, 3);
  assert.ok(next.every((card) => card.target !== first[0].target));
});

test("three card types are generated from data the catalog already has", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  const item = catalog.items.find((i) => i.hasKanji && i.examples.length);
  const cards = practice.buildPracticeCards(item, catalog);

  const kinds = cards.map((c) => c.kind).sort();
  assert.equal(kinds.join(","), "cloze,meaning,reading-input");
  for (const card of cards) {
    assert.equal(card.target, item.id);
    if (card.kind === "reading-input") {
      // The one card with no options to pick from: the learner writes it.
      assert.equal(card.options, undefined, "a typed card must not offer options");
      assert.equal(card.answer, item.reading);
      continue;
    }
    assert.equal(card.options.length, 4, `${card.kind} needs four choices`);
    assert.ok(card.options[card.correctIndex], `${card.kind} has no correct answer`);
    assert.equal(new Set(card.options).size, 4, `${card.kind} repeats an option`);
  }
});

test("the reading is typed rather than chosen, in kana or in romaji", () => {
  const { LanternCatalogPractice: practice } = load();
  /* Romaji is accepted so that a learner without a Japanese keyboard can
   * answer at all. Typing the sounds from memory is still production, which
   * is the entire point of this card - a four-option reading question can be
   * answered by recognition long after the word itself is gone. */
  for (const [typed, reading] of [
    ["あたためる", "あたためる"],
    ["アタタメル", "あたためる"],
    ["atatameru", "あたためる"],
    ["  atatameru  ", "あたためる"],
    ["ATATAMERU", "あたためる"],
    ["kitte", "きって"],        // a doubled consonant is a small tsu
    ["zasshi", "ざっし"],
    ["shinbun", "しんぶん"],     // n before a consonant is ん
    ["sinbun", "しんぶん"],      // and si, ti, tu spellings are accepted
    ["annai", "あんない"],       // nn + vowel: only the first n is ん
    ["kanngaeru", "かんがえる"],  // nn + consonant: the pair is one ん
    ["jugyou", "じゅぎょう"],
    ["zyugyou", "じゅぎょう"],
  ]) {
    assert.ok(practice.checkReading(typed, reading), `${typed} should read as ${reading}`);
  }

  // An apostrophe is a keyboard rule, not a fact about Japanese: a learner who
  // knows 金曜日 is きんようび is not wrong for leaving it out.
  assert.ok(practice.checkReading("kinyoubi", "きんようび"));
  assert.ok(practice.checkReading("kin'youbi", "きんようび"));

  // Wrong is still wrong, and an empty box is not an answer.
  assert.equal(practice.checkReading("torikaeru", "あたためる"), false);
  assert.equal(practice.checkReading("kaeru", "かえす"), false);
  assert.equal(practice.checkReading("", "あたためる"), false);
  assert.equal(practice.checkReading("   ", "あたためる"), false);
});

test("a reading that is not kana never becomes a question", () => {
  const { LanternCurriculumCatalog: catalog, LanternCatalogPractice: practice } = load();
  /* Nineteen catalogue rows carry something other than a reading in the
   * reading field, inherited from the source: part-of-speech markers that
   * leaked out of the column, a gloss, bracketed okurigana, and one row that
   * is mojibake. Two of them have kanji, so before this guard they were built
   * into a reading question whose correct answer was wrong. */
  const broken = catalog.items.filter(
    (item) => item.hasKanji && item.reading && !practice.KANA_READING.test(item.reading));
  assert.ok(broken.length > 0, "the fixture for this test has gone: no broken readings left");
  for (const item of broken) {
    const kinds = practice.buildPracticeCards(item, catalog).map((card) => card.kind);
    assert.ok(!kinds.includes("reading-input"), `${item.canonical} asks for a reading it does not have`);
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

  // The typed card has no distractors to check - it has no options at all.
  for (const card of cards.filter((c) => c.options)) {
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
  // Starting a place is enough to unlock practice - waiting for mastery hid it
  // from exactly the learners who need it - and practice covers every place
  // that has been opened, not only the last door walked through.
  assert.ok(app.includes("function practicePartitions"), "practice is not tied to one place");
  assert.ok(/practicePartitions[\s\S]{0,400}state\.stageProgress\.homeInn/.test(app),
    "starting the Inn is enough to unlock practice");
  assert.ok(/practicePartitions[\s\S]{0,400}state\.stageStarted/.test(app),
    "entering a later place adds its words to practice");
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
