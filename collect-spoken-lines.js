"use strict";

/* Collects every spoken Japanese line so generate-audio.py can pre-render it.
 *
 * Output is grouped rather than flat, because the service worker no longer
 * caches all of it at install. A brand new player can reach the Entrance and
 * the Inn's three days - about 2.2 MB of audio - but the full set is 26.6 MB,
 * and the other 24.4 MB is episode audio for stages behind progression gates.
 * Downloading it before the first question is answered is the single largest
 * avoidable cost in the app.
 *
 * The "shell" group is what a first-run player can reach. Every other group is
 * one episode stage, fetched when that stage unlocks.
 *
 * A line belongs to exactly one group: the first that claims it. Shell is
 * built first, so anything it shares with an episode stays in the shell and
 * the episode lists never re-list it. That keeps the groups disjoint, which is
 * what lets sw.js treat them as separate cache units.
 *
 * Usage:
 *   node collect-spoken-lines.js            flat array of every line
 *   node collect-spoken-lines.js --groups   { group: [lines] }
 */

const fs = require("fs");
const vm = require("vm");

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync("entrance-stage-logic.js", "utf8"), context);
vm.runInContext(fs.readFileSync("moonview-inn-interactions.js", "utf8"), context);
vm.runInContext(fs.readFileSync("n2-home-inn-stage.js", "utf8"), context);

const entrance = context.LanternAlleyLogic;
const stage = context.N2HomeInnStage;

const groups = {};
const seen = new Set();
let current = null;

const group = (name) => {
  if (!groups[name]) groups[name] = [];
  current = groups[name];
};

const add = (text) => {
  if (typeof text !== "string") return;
  if (!/[ぁ-ゟ゠-ヿ一-鿿]/.test(text)) return;
  const line = text.trim();
  if (seen.has(line)) return;
  seen.add(line);
  current.push(line);
};

// ---- shell: everything reachable before any stage is cleared ----
group("shell");

let tutorial = entrance.createTutorial();
add(entrance.getTutorialStep(tutorial).jp);
tutorial = entrance.advanceTutorial(tutorial);
add(entrance.getTutorialStep(tutorial).jp);
tutorial = entrance.advanceTutorial(tutorial);
add(entrance.getTutorialStep(tutorial).jp);
tutorial = entrance.completeTutorial(tutorial);
add(entrance.getTutorialStep(tutorial).jp);

const innItems = [...stage.encounters, ...stage.practice, ...stage.challenge];

innItems.forEach((item) => {
  add(item.jp);
  add(item.narration);
});
if (stage.intro) {
  add(stage.intro.jp);
  add(stage.intro.context);
  add(stage.intro.accept);
}
innItems.forEach((item) => {
  (item.interaction && item.interaction.replies || []).forEach((reply) => add(reply.label));
  // Kon speaks this when the learner turns the work down, so it needs a clip
  // like any other reply. The return greeting is displayed, not spoken.
  add(item.declineReply);
});

// Kon speaks after every answer too. These were falling back to the device
// voice, so praise and correction sounded like a different character from the
// request that preceded them.
innItems.forEach((item) => {
  add(stage.getKonResponse(item, true));
  add(stage.getKonResponse(item, false));
  Object.keys(item.replyResponses || {}).forEach((key) => {
    add(stage.getKonResponse(item, false, key));
  });
  (item.options || []).forEach((option) => {
    add(stage.getKonResponse(item, false, option.key));
  });
});

// Spoken when an episode's correction round starts. It is the same line for
// every episode, so it lives in the shell rather than being claimed by
// whichever stage happens to be collected first.
add("コン：「お疲れさまでした。最後に、間違えた仕事だけをもう一度確認します。今度は時間が短いので、すぐに答えてください。」");

// ---- one group per episode stage ----
//
// Every registered place, not just the Inn. A line without a clip falls back
// to the device voice, which on iOS often has no Japanese at all.
vm.runInContext(fs.readFileSync("curriculum-catalog.js", "utf8"), context);
vm.runInContext(fs.readFileSync("learning-content.js", "utf8"), context);
for (const file of [
  "n2-inn-episodes.js",
  "n2-market-episodes.js",
  "n2-teahouse-episodes.js",
  "n2-station-episodes.js",
  "n2-shrine-episodes.js",
]) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context);
}

Object.keys(context.LanternEpisodeStages).forEach((stageKey) => {
  group("episodes:" + stageKey);
  context.LanternEpisodeStages[stageKey].episodes.forEach((episode) => {
    if (episode.intro) add(episode.intro.jp);
    if (episode.briefing) add(episode.briefing.jp);
    episode.days.forEach((day) => {
      day.questions.forEach((question) => {
        if (question.prompt && question.prompt.audio) add(question.prompt.jp);
        add(question.feedback.correct);
        add(question.feedback.incorrect);
      });
    });
  });
});

// The flat form stays the default so anything reading this as a plain list of
// every spoken line keeps working.
if (process.argv.includes("--groups")) {
  console.log(JSON.stringify(groups));
} else {
  console.log(JSON.stringify([...seen]));
}
