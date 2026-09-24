import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadCatalog() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./curriculum-catalog.js", import.meta.url), "utf8"), context);
  return context.LanternCurriculumCatalog;
}

test("the generated catalog exists and is loadable", () => {
  assert.equal(existsSync(new URL("./curriculum-catalog.js", import.meta.url)), true);
  const catalog = loadCatalog();
  assert.ok(catalog.items.length > 3000, `expected n2+n3, got ${catalog.items.length}`);
});

test("kana-only headwords are their own reading, not excluded", () => {
  const catalog = loadCatalog();
  // 294 of the 295 blank `reading` fields in n2.json are kana headwords.
  // Excluding them would silently drop a sixth of the vocabulary.
  const kana = catalog.items.filter((item) => item.derivedReading);
  assert.ok(kana.length > 200, `expected kana headwords to survive, got ${kana.length}`);
  for (const item of kana) assert.equal(item.reading, item.canonical);
});

test("only genuinely malformed records are excluded, each with a reason", () => {
  const catalog = loadCatalog();
  const report = catalog.validateCatalog();
  assert.ok(report.excluded.length < 10, `too many exclusions: ${report.excluded.length}`);
  for (const row of report.excluded) assert.ok(row.reason, `no reason given for ${row.word}`);
  assert.equal(report.errors.length, 0, report.errors.join("; "));
});

test("words the source omits come from the project supplement", () => {
  const catalog = loadCatalog();
  // 引き受ける is absent from every local OpenJLPT file. If it resolves to a
  // sourced record, the supplement has been merged wrongly.
  const undertake = catalog.getItem("v-hikiukeru");
  assert.equal(undertake.canonical, "引き受ける");
  assert.equal(undertake.source, "project");

  // The source has 暖める (air, rooms) but not 温める (food, drink). Covering it
  // faithfully would reintroduce a Japanese error this project already fixed.
  const warm = catalog.getItem("v-atatameru-food");
  assert.equal(warm.canonical, "温める");
  assert.equal(warm.source, "project");
  assert.ok(catalog.items.some((item) => item.canonical === "暖める"), "暖める must still exist");
});

test("catalog examples exclude unsafe corpus artifacts and keep corrected Japanese", () => {
  const catalog = loadCatalog();
  const examples = catalog.items.flatMap((item) => item.examples || []);
  const removed = [
    "精液は瓶詰めにする価値はあるよ。",
    "自慰は狂気に繋がる。",
    "神はゲイだ。",
    "さっさと死ね！",
    "おとといきやがれ！",
    "ふざけるな！",
    "排尿障害があります。",
    "私は患者です。",
  ];
  for (const text of removed) {
    assert.ok(!examples.some((example) => example.ja === text), "unsafe example remains: " + text);
  }

  assert.equal(catalog.getItem("v-shitagau").examples[0].ja, "子供は親に従う。");
  assert.equal(catalog.getItem("v-suru").examples[0].ja, "今日、東京はとても寒くなるでしょう。");
  assert.equal(catalog.getItem("w-shihei").examples[0].ja, "私は１０ドル札をなくした。");
  assert.equal(catalog.getItem("w-miman").examples[0].ja, "クッキーはまだ５歳になっていない。");
  assert.equal(catalog.getItem("w-jokyouju").examples[0].ja, "私は教授です。いや、もっと正確に言えば助教授です。");
});

test("high-priority examples model N2 words in safe, complete situations", () => {
  const catalog = loadCatalog();
  const expected = new Map([
    ["v-akireru", "そんな言い訳にはあきれる。"],
    ["w-junkan", "血液は体の中を循環している。"],
    ["w-ketsueki", "血液は体の中を循環している。"],
    ["w-houki", "玄関を掃除したあと、箒を物置にしまった。"],
    ["v-susumeru", "初めて来た人には、駅前の案内所を勧めている。"],
    ["w-souko", "お店の荷物は、裏の倉庫にしまってある。"],
    ["w-hanzai", "警察は犯罪を防ぐために、夜の見回りをしている。"],
  ]);

  for (const [id, text] of expected) {
    assert.equal(catalog.getItem(id).examples[0].ja, text, `unexpected example for ${id}`);
  }
  for (const id of ["w-shitai", "w-jisatsu", "w-omae"]) {
    assert.equal(catalog.getItem(id).examples.length, 0, `${id} needs a labelled context before it has an example`);
  }
});

test("catalog examples do not use generic placeholder-name dialogue", () => {
  const catalog = loadCatalog();
  const placeholderNames = /(?:トム|メアリー|スーザン|ジョン|ビルは)/;
  const generic = catalog.items
    .flatMap((item) => (item.examples || []).map((example) => `${item.id}: ${example.ja}`))
    .filter((text) => placeholderNames.test(text));
  assert.equal(generic.length, 0, `generic corpus dialogue remains: ${generic.join(" | ")}`);
});

test("every word the Inn teaches is in the catalog", () => {
  const catalog = loadCatalog();
  for (const word of ["揃える", "代える", "温める", "調整", "引き受ける"]) {
    assert.ok(
      catalog.items.some((item) => item.canonical === word),
      `${word} is taught by the Inn but missing from the catalog`,
    );
  }
});

test("unreviewed items are reported as warnings, never silently trusted", () => {
  const catalog = loadCatalog();
  const report = catalog.validateCatalog();
  // No native reviewer is named yet, so nothing may claim reviewed status.
  assert.ok(report.warnings.some((w) => /review/i.test(w)), "unreviewed items must warn");
  for (const item of catalog.items) assert.equal(typeof item.reviewed, "boolean");
});

test("coverage reports missing IDs, not just a percentage", () => {
  const catalog = loadCatalog();
  const someId = catalog.items[0].id;
  const coverage = catalog.getCoverage({ [someId]: "tested" });
  assert.equal(coverage.tested, 1);
  assert.ok(coverage.untestedIds.length > 3000);
  assert.ok(!coverage.untestedIds.includes(someId));
});

test("every item belongs to exactly one location partition", () => {
  const catalog = loadCatalog();
  const counts = {};
  for (const item of catalog.items) {
    assert.ok(item.partition, `${item.canonical} has no partition`);
    counts[item.partition] = (counts[item.partition] || 0) + 1;
  }
  assert.equal(Object.keys(counts).length, 5);
  for (const key of Object.keys(counts)) assert.ok(counts[key] > 300, `${key} only has ${counts[key]}`);
});

test("every reading is kana, because every reading is asked as a question", () => {
  const catalog = loadCatalog();
  /* Nineteen rows used to carry something else in the reading field, taken
   * from the source as-is: part-of-speech markers that had leaked out of a
   * neighbouring column (「うん」 = "（感）", 「だいいち」 = "（副）"), a gloss
   * where a reading belonged (「じゅうたん」 = "（カーペット）"), okurigana in
   * brackets, and one row that was mojibake outright (賛成 = "Uӣ[い").
   *
   * They were not cosmetic. The practice layer asks what a word is read as
   * and grades the answer against this field, so 賛成 was a question whose
   * correct answer was wrong and さんせい was marked a miss. The builder now
   * refuses a non-kana reading, and this is the check that it stays refused.
   */
  const kana = /^[ぁ-ゖァ-ヺー]+$/;
  // Listed rather than counted: a failure here should name the rows.
  // (Compared by length, because the catalogue is loaded in its own vm realm
  // and a strict deep-equal against a literal [] fails on the prototype.)
  const broken = catalog.items
    .filter((item) => !item.reading || !kana.test(item.reading))
    .map((item) => `${item.canonical}=${item.reading}`);
  assert.equal(broken.length, 0,
    "a reading that is not kana cannot be asked for or answered: " + broken.join(", "));
});

test("meanings carry no dictionary sense numbers", () => {
  // 見送る read "(1) to see off" on the learner's screen.
  const catalog = loadCatalog();
  const numbered = catalog.items.filter((item) => item.meanings.some((m) => /^\(\d+\)/.test(m)));
  assert.equal(numbered.length, 0, numbered.slice(0, 5).map((item) => item.canonical).join(", "));
});

test("the Inn's words gloss first with the sense the Inn uses", () => {
  const catalog = loadCatalog();
  const first = (id) => catalog.getItem(id).meanings[0];
  assert.equal(first("w-kakunin"), "confirmation");
  assert.equal(first("w-kizu"), "damage");
  assert.equal(first("w-kyakuma"), "guest room");
  assert.match(first("w-yukata"), /^yukata/);
  assert.match(first("v-osameru-2"), /^to pay/);
  assert.equal(catalog.getItem("w-miokuru").type, "word", "stripping numbers left the id's type alone");
});
