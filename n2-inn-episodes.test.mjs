import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function load() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  return context;
}

test("Episode 1 satisfies the shared contract except the four-episode count", () => {
  const { LanternLearningContent: content, N2InnEpisodes: stage } = load();
  const errors = content.validateStage(stage).errors.filter((e) => !/four episodes/.test(e));
  assert.equal(errors.length, 0, errors.join("; "));
});

test("Episode 1 is 3, 3, 4", () => {
  const { N2InnEpisodes: stage } = load();
  assert.equal(stage.episodes[0].days.map((d) => d.questions.length).join(","), "3,3,4");
});

test("each Inn episode has a visible five-beat shift", () => {
  const { N2InnEpisodes: stage } = load();
  for (const episode of stage.episodes) {
    assert.equal(episode.progress.beats.length, 5, `${episode.id} needs five shift beats`);
    assert.ok(episode.progress.beats.every((beat) => /^[ぁ-んァ-ヶ一-龠ー]+$/u.test(beat)), `${episode.id} uses authored Japanese beats`);
    assert.equal(new Set(episode.progress.beats).size, 5, `${episode.id} repeats a shift beat`);
  }
});

test("every target resolves in the catalog", () => {
  const { LanternCurriculumCatalog: catalog, N2InnEpisodes: stage } = load();
  for (const day of stage.episodes[0].days) {
    for (const q of day.questions) {
      assert.ok(catalog.getItem(q.target), `${q.id} names an unknown target ${q.target}`);
    }
  }
});

test("the words the Inn already taught are all present", () => {
  const { LanternCurriculumCatalog: catalog, N2InnEpisodes: stage } = load();
  const taught = new Set();
  for (const day of stage.episodes[0].days) {
    for (const q of day.questions) taught.add(catalog.getItem(q.target).canonical);
  }
  for (const word of ["揃える", "取り替える", "温める", "引き受ける"]) {
    assert.ok(taught.has(word), `${word} is no longer taught in Episode 1`);
  }
});

test("no prompt is reused, so no answer can come from screen memory", () => {
  const { N2InnEpisodes: stage } = load();
  const prompts = stage.episodes[0].days.flatMap((d) => d.questions.map((q) => q.prompt.jp));
  assert.equal(new Set(prompts).size, prompts.length);
});

test("every question carries a repair form inside the time budget", () => {
  const { N2InnEpisodes: stage } = load();
  for (const day of stage.episodes[0].days) {
    for (const q of day.questions) {
      assert.ok(q.repair && q.repair.prompt, `${q.id} has no repair form`);
      assert.ok([5, 8, 12].includes(q.repair.seconds), `${q.id} repair timer is ${q.repair.seconds}s`);
    }
  }
});

test("the 温める item teaches the food sense against 暖める", () => {
  const { N2InnEpisodes: stage } = load();
  const q = stage.episodes[0].days[0].questions.find((item) => item.target === "v-atatameru-food");
  // The catalog source ships 暖める (air, rooms) but not 温める (food, drink).
  // The distinction is the lesson, so 暖める must be the near miss, not absent.
  assert.ok(q.answer.options.some((o) => o.includes("温め")));
  assert.ok(q.answer.options.some((o) => o.includes("暖め")));
  assert.match(q.answer.options[q.answer.correctIndex], /温め/);
});

test("answer content carries no English", () => {
  const { N2InnEpisodes: stage } = load();
  for (const day of stage.episodes[0].days) {
    for (const q of day.questions) {
      for (const option of q.answer.options || []) {
        assert.doesNotMatch(option, /[A-Za-z]{2,}/, `${q.id}: ${option}`);
      }
    }
  }
});

test("declining is never scored, because refusing is not a comprehension error", () => {
  const { N2InnEpisodes: stage } = load();
  for (const day of stage.episodes[0].days) {
    for (const q of day.questions) {
      const options = q.answer.options || [];
      const refusal = options.findIndex((o) => /引き受けられません|できません|断ります/.test(o));
      assert.ok(refusal < 0 || refusal !== q.answer.correctIndex, `${q.id} scores a refusal`);
      if (refusal >= 0) assert.fail(`${q.id} offers a refusal as a gradeable option`);
    }
  }
});

test("the episode can be walked end to end", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // Testing-only route so the new question types can be judged before the
  // controller is rewritten around them.
  assert.match(app, /function startEpisode/);
  assert.match(app, /function renderPreviewQuestion/);
  assert.match(app, /LanternQuestionRenderer\.describe\(question/);
  assert.match(app, /LanternQuestionRenderer\.renderInto/);
  // Episodes show the request in writing. The clock, not concealment, is what
  // makes them harder than the three days.
  assert.match(app, /function startQuestionClock/);
  assert.match(app, /afterSpeech\(function\(\)\{ startQuestionClock/);
  // Action questions need the room, which the harness does not build.
  assert.match(app, /この問題は部屋の操作で答えます/);
});

test("a correct preview answer advances on a tap, not only the button", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // The main game arms advancement through afterSpeech, so tapping finishes
  // Kon's line and the next tap moves on. The preview had only the button.
  assert.match(app, /function advancePreviewLater\(isCorrect\)\{[\s\S]*?afterSpeech\(/);
  // A wrong answer must not auto-advance: the explanation is the lesson.
  assert.match(app, /if\(isCorrect === false\)\{[\s\S]*?return;/);
  // Guarded so a stale continuation cannot skip a question.
  assert.match(app, /if\(!previewState \|\| previewState\.index !== at\) return;/);
});

test("the episode opens with a transition and ends with a timed correction loop", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

  // Transition: Kon introduces the episode before question 1.
  assert.match(app, /function renderPreviewIntro/);
  assert.match(app, /btn-episode-begin/);
  // The story name, not the internal English title.
  assert.match(app, /\^\(\.\*\?\)・\(\.\*\?\)「\(\.\*\)」\$/);
  // Visibility must never depend on an animation: a global reduced-motion rule
  // kills animations with !important, which left the card stuck invisible.
  assert.match(css, /\.episode-open\{[^}]*display:flex/);
  assert.doesNotMatch(css, /\.episode-open\{[^}]*opacity:0/);

  // 間違い直し: only missed items, a per-type clock, timeout is not a mistake.
  assert.match(app, /function startRepairLoop/);
  assert.match(app, /LanternReviewEngine\.createRepairQueue/);
  assert.match(app, /LanternQuestionRenderer\.startTimer/);
  assert.match(app, /時間切れです。もう一度出ます。/);
  // A stale timer must not settle a freshly rendered card.
  assert.match(app, /repair\.token = \(repair\.token \|\| 0\) \+ 1;/);
  assert.match(app, /if\(!repair \|\| \(token !== undefined && repair\.token !== token\)\) return;/);
});

test("every option can explain itself when chosen", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const questions = context.N2InnEpisodes.episodes[0].days.flatMap((d) => d.questions);

  // "Not that one" teaches nothing. A wrong choice must be answered with what
  // the word the learner reached for actually means.
  for (const q of questions) {
    const options = q.answer.options || [];
    assert.equal(q.optionNotes.length, options.length, `${q.id} notes do not match its options`);
    for (const note of q.optionNotes) assert.ok(note.trim().length > 8, `${q.id} has an empty note`);
  }

  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /var note = \(question\.optionNotes \|\| \[\]\)\[value\];/);
  assert.match(app, /note \? "「" \+ chosen \+ "」 = " \+ note/);
});

test("the correction round is announced and shows its countdown", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

  // A stricter clock should not appear unannounced.
  assert.match(app, /function renderRepairIntro/);
  assert.match(app, /btn-repair-begin/);
  assert.match(app, /短い問題は五秒です/);
  assert.match(app, /時間が切れても間違いにはなりません/);

  // The countdown states how much is left out of how much was given.
  assert.match(app, /"のこり " \+ left\.toFixed\(1\) \+ " 秒 \/ " \+ card\.seconds \+ " 秒"/);
  assert.match(app, /classList\.toggle\("is-urgent", left <= 2\)/);
  assert.match(css, /\.repair-timer-fill\.is-urgent/);
});

test("every episode question can be answered from what it shows", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const questions = context.N2InnEpisodes.episodes[0].days.flatMap((d) => d.questions);

  // A guest asking 「部屋はありますか」 cannot be answered unless the learner is
  // told whether a room is free. Questions whose answer depends on the state of
  // the inn must state that state, the way the 断る item already does.
  const stateDependent = questions.filter((q) => /ありますか|泊まれますか/.test(q.prompt.jp));
  assert.ok(stateDependent.length >= 2);
  for (const q of stateDependent) {
    assert.match(
      q.prompt.jp,
      /空いています|空いていません|しか/,
      `${q.id} asks about availability without saying what is available`,
    );
  }

  // And a reply must answer the question that was actually asked.
  const order = questions.find((q) => q.target === "w-chuumon");
  assert.match(order.prompt.jp, /お願いしたい|注文/, "the guest must be asking to order");
});

test("the how-to-interact label is printed once, not twice", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
  // .inn-stage .inn-instruction::before already prints it.
  assert.match(css, /\.inn-stage \.inn-instruction::before\{content:"HOW TO INTERACT"/);
  assert.doesNotMatch(app, /inn-instruction[^;]*<strong>How to interact<\/strong>/);
  assert.doesNotMatch(app, /\$\("inn-instruction"\)\.innerHTML = '<strong>/);
});

test("episode questions offer four choices and scale their clock to the work", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const questions = context.N2InnEpisodes.episodes[0].days.flatMap((d) => d.questions);

  for (const q of questions) {
    assert.equal(q.answer.options.length, 4, `${q.id} needs four choices`);
    assert.equal(q.optionNotes.length, 4, `${q.id} needs a note per choice`);
  }

  // A schedule has to be understood before it can be answered, so it cannot
  // share a budget with a one-word service reply.
  const reading = questions.filter((q) => q.skill === "reading");
  for (const q of reading) assert.ok(q.seconds >= 18, `${q.id} gives only ${q.seconds}s to read`);
  const quick = questions.filter((q) => q.seconds <= 5);
  for (const q of quick) assert.equal(q.skill, "listening-task", `${q.id} is too short for its work`);
});

test("a silent question hands its line to the dialogue controller", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // Writing straight to #jp-line left the previous reply mid-reveal, and the
  // controller painted it back over the new prompt - so a reading question
  // displayed the answer to the question before it.
  assert.match(app, /dialogueFlow\.start\(previewSpokenLine\(question\), false\)/);
  // A notice goes to the wide panel; Kon only says what to look at.
  assert.match(app, /function previewDocument/);
  assert.match(app, /class="reading-document"/);
});

test("reading items are long enough to be N2 retrieval, not a single line", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const reading = context.N2InnEpisodes.episodes[0].days
    .flatMap((d) => d.questions)
    .filter((q) => q.skill === "reading");

  // N2 情報検索 runs to roughly 700 characters and 内容理解（短文） to about 200.
  // These were 53 and 49, which is one line - the learner held no facts at all.
  for (const q of reading) {
    assert.ok(q.prompt.jp.length >= 150, `${q.id} is only ${q.prompt.jp.length} characters`);
    assert.ok(q.prompt.jp.includes("\n"), `${q.id} should be laid out as a notice`);
    // Two minutes: the exam averages roughly 80 seconds an item across all of
    // reading, and a learner should be reading rather than racing.
    assert.ok(q.seconds >= 120, `${q.id} gives only ${q.seconds}s to read ${q.prompt.jp.length} characters`);
  }

  // The distractors must each be wrong for a different reason, so the item
  // rewards reading rather than elimination.
  const notice = reading.find((q) => q.target === "w-souji");
  assert.equal(new Set(notice.optionNotes).size, 4);
});

test("a reading item has exactly one defensible answer", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const reading = context.N2InnEpisodes.episodes[0].days
    .flatMap((d) => d.questions)
    .filter((q) => q.skill === "reading");

  // The first version asked which rooms could be cleaned "now" while one room
  // was already done - and never said that an already-cleaned room is excluded.
  // A native reader could defend two answers, which is a broken item rather
  // than a hard one. N2 reading is long but clearly written: every condition
  // the answer turns on has to be on the page.
  for (const q of reading) {
    assert.match(q.prompt.jp, /※/, `${q.id} states no explicit conditions`);
    const rules = q.prompt.jp.split("\n").filter((line) => line.startsWith("※"));
    assert.ok(rules.length >= 2, `${q.id} has only ${rules.length} stated rule(s)`);
  }
});

test("finishing the three days leads into the episode", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // The days teach the words; the episode is the shift they were training for.
  // Mastery used to drop the learner on the map, so nothing led to the episode
  // except a test button.
  assert.match(app, /if\(state\.stageMastered\)\{[\s\S]*?startEpisode\(\);/);
  assert.match(app, /typeof N2InnEpisodes !== "undefined" && loc\.key === "home-inn"/);
});


/* Episode 2 「予約帳」 and the four official item types.
 *
 * These are the types the exam has and Episode 1 could not carry: 表記,
 * 語形成, 文の組み立て and 文章の文法. All four are written Japanese, which is
 * why they are in the morning paperwork rather than in an hour of listening.
 */
function episode2() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "learning-content.js", "n2-inn-episodes.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  return { context, episode: context.N2InnEpisodes.episodes[1] };
}

const questionsOf = (episode) => episode.days.flatMap((d) => d.questions);

test("Episode 2 exists, is 3-3-4, and every target resolves in the catalog", () => {
  const { context, episode } = episode2();
  // The stage is complete: four episodes, which is what the contract has always
  // said and what validateStage checks.
  assert.equal(context.N2InnEpisodes.episodes.length, 4);
  assert.equal(episode.days.map((d) => d.questions.length).join(","), "3,3,4");

  const questions = questionsOf(episode);
  const targets = questions.map((q) => q.target);
  assert.equal(new Set(targets).size, targets.length, "each question teaches its own word");
  for (const q of questions) {
    const item = context.LanternCurriculumCatalog.getItem(q.target);
    assert.ok(item, `${q.id} names an unknown target ${q.target}`);
    // Coverage is counted per location, so an Inn episode teaches Inn words.
    assert.equal(item.partition, "home-inn", `${q.id} teaches a word from ${item.partition}`);
  }
});

test("Episode 2 carries the four item types Episode 1 could not", () => {
  const { episode } = episode2();
  const skills = new Set(questionsOf(episode).map((q) => q.skill));
  for (const skill of ["orthography", "word-formation", "sentence-building", "text-grammar"]) {
    assert.ok(skills.has(skill), `Episode 2 is missing ${skill}`);
  }
  // sentence-order sat declared in the renderer with nothing calling it.
  const assembly = questionsOf(episode).filter((q) => q.answer.type === "sentence-order");
  assert.ok(assembly.length >= 2, "the declared sentence-order type is finally used");
});

test("a sentence-assembly item never shows its pieces already in order", () => {
  const { episode } = episode2();
  const assembly = questionsOf(episode).filter((q) => q.answer.type === "sentence-order");
  for (const q of assembly) {
    const shown = q.answer.options.join("");
    const sentence = q.feedback.correct;
    // Every piece belongs to the finished sentence...
    for (const piece of q.answer.options) {
      assert.ok(sentence.includes(piece), `${q.id}: ${piece} is not in the assembled sentence`);
    }
    // ...but the order they are shown in is not that sentence, or the star
    // position alone would answer the question without reading it.
    assert.ok(!sentence.includes(shown), `${q.id} shows its pieces in the answer order`);
    assert.ok(q.prompt.jp.includes("★"), `${q.id} has no star to fill`);
    // The slots live on the sentence line; the instruction above it names the
    // star as well, and counting that one made four pieces look like five.
    const sentenceLine = q.prompt.jp.split("\n").pop();
    const slots = (sentenceLine.match(/[＿★]/g) || []).length;
    assert.equal(slots, q.answer.options.length, `${q.id} has ${slots} slots for ${q.answer.options.length} pieces`);
  }
});

test("an orthography item writes the word in kana and answers only in kanji", () => {
  const { episode } = episode2();
  const spelling = questionsOf(episode).filter((q) => q.skill === "orthography");
  assert.ok(spelling.length >= 2, "there are orthography items to check");
  for (const q of spelling) {
    assert.match(q.prompt.jp, /（[ぁ-ん]+）/u, `${q.id} does not give the word in kana`);
    for (const option of q.answer.options) {
      // A kana in an option would give the spelling away.
      assert.doesNotMatch(option, /[ぁ-んァ-ン]/u, `${q.id}: ${option} is not written in kanji`);
    }
    assert.equal(new Set(q.answer.options).size, 4, `${q.id} repeats a spelling`);
  }
});

test("a word-formation item offers affixes, not whole words", () => {
  const { episode } = episode2();
  const formation = questionsOf(episode).filter((q) => q.skill === "word-formation");
  assert.ok(formation.length >= 2, "there are word-formation items to check");
  for (const q of formation) {
    for (const option of q.answer.options) {
      assert.ok(option.length <= 2, `${q.id}: ${option} is a word, not an affix`);
    }
  }
});

test("a text-grammar item shows a passage and writes down every condition", () => {
  const { episode } = episode2();
  const passages = questionsOf(episode).filter((q) => q.skill === "text-grammar");
  assert.ok(passages.length >= 2, "there are text-grammar items to check");
  for (const q of passages) {
    // A multi-line prompt is what puts it in the wide document panel.
    assert.ok(q.prompt.jp.includes("\n"), `${q.id} would render inside the speech bubble`);
    const rules = q.prompt.jp.split("\n").filter((line) => line.startsWith("※"));
    assert.ok(rules.length >= 2, `${q.id} states only ${rules.length} condition(s)`);
    assert.ok(q.prompt.jp.includes("（　　）"), `${q.id} has no gap to fill`);
  }
});

test("Episode 2 gives written work time to be read", () => {
  const { episode } = episode2();
  for (const q of questionsOf(episode)) {
    assert.equal(q.answer.options.length, 4, `${q.id} needs four choices`);
    assert.equal(q.optionNotes.length, 4, `${q.id} needs a note per choice`);
    if (q.skill === "listening-task") continue;
    // The exam gives roughly 80 seconds an item. Reading is not a reaction test.
    assert.ok(q.seconds >= 20, `${q.id} gives only ${q.seconds}s to read`);
  }
});

test("the written items are silent, because a spelling cannot be heard", () => {
  const { episode } = episode2();
  const written = questionsOf(episode)
    .filter((q) => ["orthography", "word-formation", "sentence-building", "text-grammar", "reading"].includes(q.skill));
  for (const q of written) {
    assert.ok(!q.prompt.audio, `${q.id} would read its own answer aloud`);
  }
});

test("the Inn moves on to the next episode instead of replaying the first", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  assert.match(app, /function currentEpisode/);
  assert.doesNotMatch(app, /N2InnEpisodes\.episodes\[0\]/, "an episode is still hard-coded");
  // Finishing one records it, so the next is the one offered.
  assert.match(app, /state\.episodesDone\[finished\.id\] = true/);
  assert.match(app, /episodesDone: Object\.keys\(state\.episodesDone \|\| \{\}\)/);
  // A saved shift belongs to one episode; resuming into another would restore
  // an index into questions it was never saved from.
  assert.match(app, /savedEpisode\.episodeId !== playing\.id/);
});

test("each written item type says what job it is asking for", () => {
  const context = {};
  context.self = context;
  vm.createContext(context);
  for (const file of ["curriculum-catalog.js", "n2-inn-episodes.js", "question-renderer.js"]) {
    vm.runInContext(readFileSync(new URL("./" + file, import.meta.url), "utf8"), context);
  }
  const questions = context.N2InnEpisodes.episodes[1].days.flatMap((d) => d.questions);
  const renderer = context.LanternQuestionRenderer;

  // All four written types answer through a plain list, so the answer type
  // alone cannot say what the job is: a spelling question told to "choose the
  // reply" is being told the wrong one.
  const seen = new Set();
  for (const q of questions) {
    const how = renderer.describe(q, {}).howToInteract;
    assert.ok(how, `${q.id} has no how-to line`);
    if (q.skill === "orthography") assert.match(how, /kanji/);
    if (q.skill === "word-formation") assert.match(how, /attaches/);
    if (q.skill === "sentence-building") assert.match(how, /star/);
    if (q.skill === "text-grammar") assert.match(how, /gap/);
    seen.add(how);
  }
  assert.ok(seen.size >= 4, "the written types share one how-to line");
});

test("a question that has been settled stops accepting taps and looks settled", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // Both ways a question can end have to disable its choices. Answering did;
  // running out of time did not, so the buttons sat there live-looking and
  // inert - which reads as a broken game rather than a clock that ran out.
  assert.match(app, /function settlePreviewChoices/);
  assert.match(app, /previewState\.answered = true;[\s\S]{0,400}settlePreviewChoices\(value\)/);
  assert.match(app, /timer\.expired[\s\S]{0,400}settlePreviewChoices\(-1\)/);
  // And the clock must not depend on a recording that may not exist.
  assert.match(app, /function hasClip/);
  assert.match(app, /hasClip\(question\.prompt\.jp\)/);
  assert.match(app, /function spokenDuration/);
});
