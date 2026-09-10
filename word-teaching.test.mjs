import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./word-teaching.js", import.meta.url), "utf8"), context);
  return context.LanternWordTeaching;
}

const ITEM = { canonical: "揃える", reading: "そろえる", meanings: ["to put things in order"], level: "N2" };

test("a card splits its sentence so the word can be highlighted where it stands", () => {
  const teach = load();
  const card = teach.buildCard(
    { sentence: "お客様の分のスリッパを四つ揃えてください。", pattern: "〜を揃える" },
    ITEM, null);
  assert.equal(card.focus, "揃え", "the highlight covers the stem that actually appears");
  assert.equal(card.before + card.focus + card.after, card.sentence,
    "the three parts must rebuild the sentence exactly, or the renderer drops text");
  assert.equal(card.image, null, "art has a slot but nothing in it yet");
});

test("the sense prefers a stage override over the catalogue gloss", () => {
  const teach = load();
  const withOverride = teach.buildCard({ sentence: "これは揃える例文です。", pattern: "〜を揃える" }, ITEM, "adjustment");
  assert.equal(withOverride.sense, "adjustment");
  const without = teach.buildCard({ sentence: "これは揃える例文です。", pattern: "〜を揃える" }, ITEM, null);
  assert.equal(without.sense, "to put things in order");
});

test("a word with no teaching entry yields no card rather than a blank one", () => {
  const teach = load();
  assert.equal(teach.buildCard(null, ITEM, null), null);
});

test("validation catches the ways an authored entry goes wrong", () => {
  const teach = load();
  const words = [{ word: "揃える", item: ITEM }];

  assert.deepEqual(JSON.parse(JSON.stringify(teach.validateEntries(words, {}))), [
    "揃える has no teaching entry",
  ]);

  const short = teach.validateEntries(words, { "揃える": { sentence: "揃える。", pattern: "〜を揃える" } });
  assert.equal(short.length, 1);
  assert.match(short[0], /at least 12/, "a 9-character fragment is the catalogue's failing, not ours");

  const missing = teach.validateEntries(words, {
    "揃える": { sentence: "タオルを新しいものにしてください。", pattern: "〜を揃える" },
  });
  assert.equal(missing.length, 1);
  assert.match(missing[0], /does not contain/, "a sentence that never uses the word teaches nothing");

  const noPattern = teach.validateEntries(words, {
    "揃える": { sentence: "スリッパを四つ揃えてください。", pattern: "" },
  });
  assert.equal(noPattern.length, 1);
  assert.match(noPattern[0], /pattern/);

  assert.deepEqual(JSON.parse(JSON.stringify(teach.validateEntries(words, {
    "揃える": { sentence: "スリッパを四つ揃えてください。", pattern: "〜を揃える" },
  }))), []);
});
