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
