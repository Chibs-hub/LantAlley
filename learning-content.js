/* Shared episode and question contract.
 *
 * Every stage exports the same shape, and this module is the only thing that
 * decides whether that shape is valid. Content bugs are cheap to introduce and
 * expensive to notice by playing, so they are caught here instead.
 *
 * Pure: no DOM, no timers. Loaded after curriculum-catalog.js.
 */
(function(root){
  "use strict";

  var DAY_SHAPE = [3, 3, 4];
  var EPISODES_PER_STAGE = 4;
  var MAX_SLOTS = 3;
  var REPAIR_SECONDS = [5, 8, 12];

  // Answer types the renderer supports. free-text is deliberately absent: no
  // answer may require a Japanese IME, which is a mechanical obstacle rather
  // than a comprehension one.
  var ANSWER_TYPES = [
    "single-choice", "image-choice", "direct-action", "ordered-action",
    "sentence-order", "evidence-choice", "information-entry", "quick-response"
  ];

  // Latin letters in answer content mean the answer is readable without
  // understanding the Japanese. Only How to interact may be English.
  var LATIN = /[A-Za-z]{2,}/;

  function catalog(){
    return root.LanternCurriculumCatalog;
  }

  function optionsOf(answer){
    return (answer && answer.options) || [];
  }

  function checkQuestion(question, context, errors){
    var where = context + " " + (question.id || "(no id)");

    if(!question.target) errors.push(where + " has no primary target");
    else if(catalog() && !catalog().getItem(question.target)){
      errors.push(where + " names an unknown target: " + question.target);
    }

    if(!question.sourceNote) errors.push(where + " has no source note");
    if(!question.prompt || !question.prompt.jp) errors.push(where + " has no Japanese prompt");
    if(!question.feedback || !question.feedback.correct || !question.feedback.incorrect){
      errors.push(where + " needs both correct and incorrect feedback");
    }

    var slots = question.slots || [];
    if(slots.length > MAX_SLOTS){
      errors.push(where + " carries " + slots.length + " slots; at most three slot credits are allowed");
    }
    if(slots.indexOf(question.target) >= 0){
      errors.push(where + " lists its primary target as slot credit, which would let a slot decide correctness");
    }

    var answer = question.answer || {};
    if(ANSWER_TYPES.indexOf(answer.type) < 0){
      errors.push(where + " uses answer type " + answer.type + "; typing Japanese is never an answer type");
    }

    var options = optionsOf(answer);
    if(options.length){
      if(typeof answer.correctIndex !== "number" || !options[answer.correctIndex]){
        errors.push(where + " must have exactly one correct answer");
      }
      options.forEach(function(option){
        if(LATIN.test(String(option))) errors.push(where + " has English in answer content: " + option);
      });
    }

    var repair = question.repair;
    if(repair && REPAIR_SECONDS.indexOf(repair.seconds) < 0){
      errors.push(where + " repair timer is " + repair.seconds + "s; the budget is 5, 8 or 12");
    }
  }

  function validateStage(stage){
    var errors = [];
    var warnings = [];
    var episodes = (stage && stage.episodes) || [];

    if(episodes.length !== EPISODES_PER_STAGE){
      errors.push(stage.key + " has " + episodes.length + " episodes; a stage has four episodes");
    }

    var seenPrompts = {};
    episodes.forEach(function(episode, index){
      var label = (stage.key || "?") + " episode " + (index + 1);
      if(!episode.sourceNote) errors.push(label + " has no source note");

      var counts = (episode.days || []).map(function(day){ return (day.questions || []).length; });
      if(counts.join(",") !== DAY_SHAPE.join(",")){
        errors.push(label + " is " + (counts.join(", ") || "empty") + "; an episode is 3, 3, 4");
      }

      (episode.days || []).forEach(function(day){
        (day.questions || []).forEach(function(question){
          checkQuestion(question, label + " day " + day.day, errors);
          var jp = question.prompt && question.prompt.jp;
          if(jp){
            if(seenPrompts[jp] && seenPrompts[jp] !== day.day){
              errors.push(label + " reuses a prompt across phases: " + jp);
            }
            seenPrompts[jp] = day.day;
          }
        });
      });
    });

    return {errors:errors, warnings:warnings};
  }

  function getEpisode(stage, number){
    return (stage.episodes || [])[Number(number) - 1];
  }

  function getDayQuestions(episode, day){
    var match = (episode.days || []).filter(function(entry){ return entry.day === Number(day); })[0];
    return match ? match.questions : [];
  }

  // A repair asks about the one thing the learner got wrong, in the smallest
  // form that still proves understanding. Long reading and integrated tasks
  // cannot be repaired directly, so they carry their own short repair prompt.
  function makeRepairQuestion(question){
    var repair = question.repair || {};
    return {
      id: (question.id || "") + "-repair",
      target: question.target,
      prompt: repair.prompt || question.prompt.jp,
      options: repair.options || optionsOf(question.answer),
      correctIndex: repair.correctIndex === undefined ? 0 : repair.correctIndex,
      seconds: repair.seconds === undefined ? 8 : repair.seconds,
      sourceNote: question.sourceNote
    };
  }

  root.LanternLearningContent = {
    validateStage: validateStage,
    getEpisode: getEpisode,
    getDayQuestions: getDayQuestions,
    makeRepairQuestion: makeRepairQuestion,
    ANSWER_TYPES: ANSWER_TYPES
  };
})(typeof self !== "undefined" ? self : this);
