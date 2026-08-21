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
});

console.log(JSON.stringify([...lines]));
