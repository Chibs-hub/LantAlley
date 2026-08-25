"use strict";

const fs = require("fs");
const vm = require("vm");

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync("entrance-stage-logic.js", "utf8"), context);
vm.runInContext(fs.readFileSync("moonview-inn-interactions.js", "utf8"), context);
vm.runInContext(fs.readFileSync("n2-home-inn-stage.js", "utf8"), context);

const entrance = context.LanternAlleyLogic;
const stage = context.N2HomeInnStage;
const lines = new Set();
const add = (text) => {
  if (typeof text === "string" && /[\u3041-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(text)) {
    lines.add(text.trim());
  }
};

let tutorial = entrance.createTutorial();
add(entrance.getTutorialStep(tutorial).jp);
tutorial = entrance.advanceTutorial(tutorial);
add(entrance.getTutorialStep(tutorial).jp);
tutorial = entrance.advanceTutorial(tutorial);
add(entrance.getTutorialStep(tutorial).jp);
tutorial = entrance.completeTutorial(tutorial);
add(entrance.getTutorialStep(tutorial).jp);

[...stage.encounters, ...stage.practice, ...stage.challenge].forEach((item) => {
  add(item.jp);
  add(item.narration);
});
if (stage.intro) {
  add(stage.intro.jp);
  add(stage.intro.context);
  add(stage.intro.accept);
}
[...stage.encounters, ...stage.practice, ...stage.challenge].forEach((item) => {
  (item.interaction && item.interaction.replies || []).forEach((reply) => add(reply.label));
  // Kon speaks this when the learner turns the work down, so it needs a clip
  // like any other reply. The return greeting is displayed, not spoken.
  add(item.declineReply);
});

// Kon speaks after every answer too. These were falling back to the device
// voice, so praise and correction sounded like a different character from the
// request that preceded them.
[...stage.encounters, ...stage.practice, ...stage.challenge].forEach((item) => {
  add(stage.getKonResponse(item, true));
  add(stage.getKonResponse(item, false));
  Object.keys(item.replyResponses || {}).forEach((key) => {
    add(stage.getKonResponse(item, false, key));
  });
  (item.options || []).forEach((option) => {
    add(stage.getKonResponse(item, false, option.key));
  });
});

// Episode 1 in the new contract. Its prompts and Kon's replies are spoken, so
// they need clips exactly like the legacy stage's lines.
vm.runInContext(fs.readFileSync("curriculum-catalog.js", "utf8"), context);
vm.runInContext(fs.readFileSync("learning-content.js", "utf8"), context);
vm.runInContext(fs.readFileSync("n2-inn-episodes.js", "utf8"), context);
const inn = context.N2InnEpisodes;
inn.episodes.forEach((episode) => {
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

console.log(JSON.stringify([...lines]));
