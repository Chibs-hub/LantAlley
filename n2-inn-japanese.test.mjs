import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const stageSource = readFileSync(new URL("./n2-home-inn-stage.js", import.meta.url), "utf8");
const episodeSource = readFileSync(new URL("./n2-inn-episodes.js", import.meta.url), "utf8");

function loadInn() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(stageSource, context);
  vm.runInContext(episodeSource, context);
  return context;
}

function question(context, episodeId, questionId) {
  const episode = context.N2InnEpisodes.episodes.find((item) => item.id === episodeId);
  assert.ok(episode, `missing episode ${episodeId}`);
  const item = episode.days.flatMap((day) => day.questions).find((q) => q.id === questionId);
  assert.ok(item, `missing question ${questionId}`);
  return item;
}

test("known broken Japanese does not return", () => {
  const source = stageSource + "\n" + episodeSource;
  for (const bad of [
    "样子",
    "傅し",
    "現関",
    "今朝はほとんど声が出ません",
    "お伝えするところは同じです",
    "八時から二時間戻してください",
    "物や人をある仕方で取り持つこと",
    "人を夜まで置く",
    "三つの夜",
    "宿は今日から冬の間、閉めます",
    "方が三組あります",
    "手は二つしかありません",
    "合わせられました",
    "三番から六番のお部屋のお布団を引き受けて",
    "仕事を責任を持って受ける"
  ]) {
    assert.equal(source.includes(bad), false, `legacy Japanese returned: ${bad}`);
  }
});

test("満員 is taught as people filling a venue, not rooms being occupied", () => {
  const context = loadInn();
  const teaching = context.N2HomeInnStage.getTeaching("満員");
  assert.match(teaching.sentence, /夕食会場.*満員/);
  assert.match(teaching.sentence, /お客様を入れられません/);
  assert.doesNotMatch(teaching.sentence, /泊め/);

  const q = question(context, "inn-e02", "inn-e02-q09");
  assert.match(q.prompt.jp, /夕食会場/);
  assert.equal(q.answer.options[q.answer.correctIndex], "満員です。");
  assert.doesNotMatch(q.prompt.jp, /泊め|客室|部屋/);
});

test("the refusal item states capacity clearly and uses a natural service reply", () => {
  const context = loadInn();
  const q = question(context, "inn-e01", "inn-e01-q10");
  assert.match(q.prompt.jp, /十人/);
  assert.match(q.prompt.jp, /二人部屋が二つ/);
  assert.equal(
    q.answer.options[q.answer.correctIndex],
    "申し訳ありませんが、十名様分のお部屋はご用意できません。"
  );
});

test("the ledger wording distinguishes finished work from an ongoing shipment", () => {
  const context = loadInn();
  const q = question(context, "inn-e02", "inn-e02-q05");
  assert.match(q.prompt.jp, /通知の手紙/);
  assert.match(q.prompt.jp, /郵送の手続きは終わっています/);
  assert.match(q.prompt.jp, /作業の完了/);
  assert.equal(q.answer.options[q.answer.correctIndex], "済み");
});

test("closing-season and festival timeline stay internally consistent", () => {
  const context = loadInn();
  const episode3 = context.N2InnEpisodes.episodes.find((item) => item.id === "inn-e03");
  const episode4 = context.N2InnEpisodes.episodes.find((item) => item.id === "inn-e04");
  const q = question(context, "inn-e04", "inn-e04-q08");
  assert.match(episode3.intro.jp, /お祭りが終わりました/);
  assert.match(episode4.intro.jp, /お祭りは昨日で終わりました/);
  assert.match(episode4.intro.jp, /冬の終わりまで閉めます/);
  assert.match(q.prompt.jp, /今日から冬の終わりまで閉めます/);
  assert.match(q.prompt.jp, /冬の間は、どなたもお泊めできません/);
});

test("teaching sentences and patterns stay aligned", () => {
  const context = loadInn();

  const shorui = context.N2HomeInnStage.getTeaching("書類");
  assert.equal(shorui.pattern, "書類を片づける");
  assert.match(shorui.sentence, /書類を片づけてください/);

  const seisho = context.N2HomeInnStage.getTeaching("清書");
  assert.equal(seisho.sentence, "下書きができたら、きれいに清書してください。");

  const kizu = context.N2HomeInnStage.getTeaching("傷");
  assert.match(kizu.sentence, /傷がついていました/);
  assert.equal(kizu.pattern, "傷がつく");

  const kyakuma = context.N2HomeInnStage.getTeaching("客間");
  assert.match(kyakuma.sentence, /客間を一部屋ずつ見て回ります/);
});

test("corrected teaching sentences remain natural and story-consistent", () => {
  const context = loadInn();
  assert.equal(
    context.N2HomeInnStage.getTeaching("浴衣").sentence,
    "三番のお客様は、浴衣を二枚まだお返しになっていません。"
  );
  assert.equal(
    context.N2HomeInnStage.getTeaching("務める").sentence,
    "三日間の練習のあとも、宿の受付係を務めました。"
  );

  const damage = question(context, "inn-e03", "inn-e03-q06");
  assert.match(damage.prompt.jp, /小さな傷でも、必ずお客様にお伝えします/);

  const complete = question(context, "inn-e04", "inn-e04-q07");
  assert.match(complete.prompt.jp, /見回りを（　　）した部屋の数/);
});

test("episode prompts do not leak target words where the task is to choose them", () => {
  const context = loadInn();
  const keep = question(context, "inn-e03", "inn-e03-q10");
  assert.doesNotMatch(keep.prompt.jp, /預か/);
  assert.match(keep.prompt.jp, /保管/);

  const key = question(context, "inn-e04", "inn-e04-q02");
  assert.doesNotMatch(key.prompt.jp, /鍵/);
});

test("natural service wording remains in the corrected Inn questions", () => {
  const context = loadInn();

  const specify = question(context, "inn-e02", "inn-e02-q08");
  assert.match(specify.prompt.jp, /三組が到着時刻を（　　）していらっしゃいます/);

  const overlap = question(context, "inn-e03", "inn-e03-q04");
  assert.match(overlap.prompt.jp, /一度に三組には対応できません/);
  assert.match(overlap.feedback.correct, /落ち着いて対応できました/);

  const circumstances = question(context, "inn-e03", "inn-e03-q08");
  assert.equal(
    circumstances.answer.options[circumstances.answer.correctIndex],
    "ご事情は承りました。朝食は早めにお出しできます。"
  );
});
