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

test("the preview harness can walk the whole episode", () => {
  const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
  // Testing-only route so the new question types can be judged before the
  // controller is rewritten around them.
  assert.match(app, /function startEpisodePreview/);
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
  assert.match(app, /function advancePreviewLater\(\)\{[\s\S]*?afterSpeech\(/);
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
  assert.match(app, /dialogueFlow\.start\(question\.prompt\.jp, false\)/);
});
