import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function messages() {
  const context = {};
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("./title-message.js", import.meta.url), "utf8"), context);
  return context.LanternTitleMessage;
}

test("title dialogue tells the learner the next meaningful action", () => {
  const select = messages().select;
  assert.equal(select({ visitedCount: 0 }).text, "いっしょに路地を歩きましょう。言葉が待っていますよ。");
  assert.equal(select({ visitedCount: 1, unfinishedPlaceName: "月見宿" }).text, "「月見宿」の続きから始めましょう。");
  assert.equal(select({ visitedCount: 1, nextPlaceName: "市場" }).text, "次は「市場」へ行きましょう。");
  assert.equal(select({ visitedCount: 4, shouldReview: true }).text, "集めた言葉を、もう一度見てみましょう。");
  assert.equal(select({ visitedCount: 6, allStagesComplete: true }).text, "よくできましたね。復習して、言葉を定着させましょう。");
});

test("urgent title dialogue wins over a general progress state", () => {
  const select = messages().select;
  const message = select({
    visitedCount: 4,
    unfinishedPlaceName: "月見宿",
    nextPlaceName: "市場",
    shouldReview: true,
    allStagesComplete: true,
  });
  assert.equal(message.kind, "resume");
  assert.equal(message.text, "「月見宿」の続きから始めましょう。");
});
