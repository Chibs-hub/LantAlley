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
