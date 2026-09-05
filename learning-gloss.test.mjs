/* The reading aid, and the line it must not cross.
 *
 * Tapping a word to see its reading is help. Tapping the answer to see the
 * answer is not, so the question's own target and every answer option stay
 * unglossed - that is the part these tests are really guarding.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-gloss.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  return context;
}

test("a kanji word becomes tappable and carries its reading and meaning", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);
  const html = gloss.annotate("客間を掃除してください。", index, {});

  assert.match(html, /<button[^>]*class="gloss"[^>]*>客間<\/button>/);
  assert.match(html, /data-reading="きゃくま"/);
  assert.match(html, /data-meaning="[^"]+"/);
  // The kana around it is left alone.
  assert.match(html, /してください。/);
});

test("Learn mode uses ruby only for support words, never the target", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);
  const html = gloss.annotate("客間を掃除してください。", index, { "掃除": true }, "ruby");

  assert.match(html, /<ruby class="gloss-ruby">客間<rt>きゃくま<\/rt><\/ruby>/);
  assert.doesNotMatch(html, /<ruby[^>]*>掃除<rt>/, "the word being taught must stay unreadable");
  assert.doesNotMatch(html, /<button/, "ruby support is informative, not a second interaction");
});

test("the longest word wins, so 会 is not glossed inside 会計", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);
  const html = gloss.annotate("会計をお願いします。", index, {});
  assert.match(html, />会計</, "the whole word is one button");
  assert.doesNotMatch(html, />会</, "not split into its first character");
});

test("kana headwords are never glossed, because a kana word is its own reading", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);
  const html = gloss.annotate("あいかわらず忙しいです。", index, {});
  assert.doesNotMatch(html, />あいかわらず</, "a kana headword needs no reading shown");
});

test("the word a question is teaching is never glossed", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog, N2InnEpisodes: inn } = load();
  const index = gloss.buildIndex(catalog);

  // 満員 is the target of the Inn's room-availability reading item. A learner
  // who can tap it open can answer that question without knowing the word.
  const question = inn.episodes
    .flatMap((e) => e.days.flatMap((d) => d.questions))
    .find((q) => q.target === "w-manin");
  assert.ok(question, "the 満員 question exists");

  const exclusions = gloss.exclusionsFor(question, catalog);
  assert.equal(exclusions["満員"], true, "the target is excluded");

  const html = gloss.annotate("満員ですので、客間へはご案内できません。", index, exclusions);
  assert.doesNotMatch(html, />満員</, "the target must not be tappable");
  // And the aid still works on everything else in the same line.
  assert.match(html, />客間</, "other words in the line are still glossed");
});

test("nothing that appears in an answer option is glossed", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog, N2InnEpisodes: inn } = load();
  const index = gloss.buildIndex(catalog);
  const questions = inn.episodes.flatMap((e) => e.days.flatMap((d) => d.questions));

  for (const question of questions) {
    const exclusions = gloss.exclusionsFor(question, catalog);
    for (const option of question.answer.options) {
      assert.equal(exclusions[option], true, `${question.id}: "${option}" is readable off the options`);
    }
  }
});

test("the markup is escaped, so a prompt cannot inject anything", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);
  const html = gloss.annotate('<script>x</script> & "quoted"', index, {});
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&amp;/);
});

test("a line with nothing to gloss comes back as plain escaped text", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);
  const html = gloss.annotate("ええと、そうですね。", index, {});
  assert.doesNotMatch(html, /<button/);
  assert.equal(html, "ええと、そうですね。");
});

test("a single kanji is only a word when it stands alone", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);

  // 様 is a catalog entry, but お客様 is one word to a reader. Glossing the
  // 様 out of it teaches the wrong unit and makes the line look shattered.
  const guest = gloss.annotate("お客様がお見えです。", index, {});
  assert.doesNotMatch(guest, />様</, "様 must not be picked out of お客様");

  // Standing on its own, between kana, it is a word again.
  const ash = gloss.annotate("灰は冷めてから集めます。", index, {});
  assert.match(ash, />灰</, "a lone kanji word is still glossed");
});

test("a multi-character catalog word is only a word when it stands alone too", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);

  // 日本 is a catalog entry (にっぽん), but 日本語 is one word to a reader -
  // the same お客様 problem, just two characters wide instead of one. This
  // was live in this Inn's own intro line before the flanking check (which
  // used to apply only to single characters) was widened to every length.
  const language = gloss.annotate("日本語の練習をしながら、宿の仕事を手伝ってくれませんか？", index, {});
  assert.doesNotMatch(language, />日本</, "日本 must not be picked out of 日本語");
  assert.match(language, />練習</, "other words in the same line still gloss");

  // Standing on its own, it is a word again.
  const country = gloss.annotate("日本から来ました。", index, {});
  assert.match(country, />日本</, "日本 on its own is still glossed");
});

test("a lone 来 is left unglossed, because it is a verb stem here, not the らい prefix", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);

  // 来 alone in the catalog is the 来週/来年 prefix, read らい. A lone 来
  // flanked by kana in running text is almost always 来る conjugated -
  // 来ます reads き, never らい - and the module has no conjugation engine
  // to pick the right one. Reported live as a wrong furigana reading.
  const html = gloss.annotate("次のお客様は15時に来ます。", index, {}, "ruby");
  assert.doesNotMatch(html, /来<rt>らい<\/rt>/, "来 must not be glossed with the wrong reading");
  assert.doesNotMatch(html, />来</, "nor tappable with it, in the non-ruby mode");
});

test("時 after a digit is left unglossed, because it is the o'clock counter, not the noun とき", () => {
  const { LanternGloss: gloss, LanternCurriculumCatalog: catalog } = load();
  const index = gloss.buildIndex(catalog);

  // 時 alone in the catalog is the noun "moment" (あの時), read とき. Right
  // after a digit it is the o'clock counter instead (14時, 15時), read じ -
  // a different word, not a variant reading of the same one.
  const clock = gloss.annotate("次のお客様は15時に来ます。", index, {}, "ruby");
  assert.doesNotMatch(clock, /時<rt>とき<\/rt>/, "15時's 時 must not be glossed as とき");

  // Standing on its own, with no digit before it, it is the noun again.
  const moment = gloss.annotate("あの時、彼はまだ子供でした。", index, {}, "ruby");
  assert.match(moment, /時<rt>とき<\/rt>/, "時 as its own word is still glossed");
});

test("the exclusions are set before anything is rendered", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const fn = app.slice(app.indexOf("function renderPreviewQuestion"));
  const body = fn.slice(0, fn.indexOf("\n  function ", 10));

  const setAt = body.indexOf("setGlossQuestion(question)");
  const panelAt = body.indexOf("var docMarkup");
  const sceneAt = body.indexOf("scene.innerHTML");
  assert.ok(setAt >= 0, "the question is handed to the reading aid");
  assert.ok(panelAt >= 0 && sceneAt >= 0, "the panel is built in this function");
  // Set afterwards, the panel glossed the word the question was teaching using
  // the previous question's exclusions - the answer, tappable in its own text.
  assert.ok(setAt < panelAt, "exclusions must be set before the reading panel is built");
  assert.ok(setAt < sceneAt, "and before the scene is written");
});
