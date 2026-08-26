/* Question rendering, split into a pure description and a thin DOM adapter.
 *
 * `describe()` decides what a question looks like as data: which controls
 * exist, which one is the primary answer action, what is spoken, what is
 * hidden in Challenge. It runs in Node, so the accessibility and
 * language-leak rules are tested rather than eyeballed in a browser.
 *
 * `renderInto()` is the only part that touches the DOM, and it takes the
 * document so it can be pointed at any container.
 */
(function(root){
  "use strict";

  var SUPPORTED_TYPES = [
    "single-choice", "image-choice", "direct-action", "ordered-action",
    "sentence-order", "evidence-choice", "information-entry", "quick-response"
  ];

  // English belongs only here. Every other string the learner reads while
  // answering is Japanese, or the answer becomes readable without the language.
  var HOW_TO = {
    "single-choice": "Choose the reply Kon is asking for.",
    "quick-response": "Choose the reply Kon is asking for.",
    "image-choice": "Choose the picture the request describes.",
    "direct-action": "Move the object the request names.",
    "ordered-action": "Do the steps in the order the request gives them.",
    "sentence-order": "Put the pieces in a natural order.",
    "evidence-choice": "Answer from what the notice actually says.",
    "information-entry": "Pick the value from the schedule."
  };

  // Episode 2's written item types all answer through a plain list of choices,
  // so the type alone cannot say what the learner is being asked to do. A
  // spelling question told to "choose the reply" is telling them the wrong job.
  var HOW_TO_SKILL = {
    "orthography": "Choose the kanji this word is written with.",
    "word-formation": "Choose the piece that attaches to the word.",
    "sentence-building": "Choose the piece that belongs at the star.",
    "text-grammar": "Choose the word that fits the gap."
  };

  function optionsOf(question){
    return (question.answer && question.answer.options) || [];
  }

  function describe(question, options){
    options = options || {};
    var phase = options.phase || "learn";
    var answer = question.answer || {};
    var hideSupport = phase === "challenge";
    var controls = [];

    optionsOf(question).forEach(function(label, index){
      controls.push({
        id: question.id + "-option-" + index,
        role: "option",
        label: String(label),
        ariaLabel: String(label),
        value: index,
        tabIndex: 0,
        // The choice itself is the answer, so it is the primary action; a
        // separate confirm button would add a step that teaches nothing.
        primary: index === 0
      });
    });

    if(!controls.length){
      controls.push({
        id: question.id + "-confirm",
        role: "confirm",
        label: "決定",
        ariaLabel: "決定",
        value: "confirm",
        tabIndex: 0,
        primary: true
      });
    }

    return {
      id: question.id,
      type: SUPPORTED_TYPES.indexOf(answer.type) >= 0 ? answer.type : "single-choice",
      presentation: "visible-choices",
      prompt: (question.prompt && question.prompt.jp) || "",
      audio: !!(question.prompt && question.prompt.audio),
      romaji: hideSupport ? "" : (question.romaji || ""),
      meaning: hideSupport ? "" : (question.meaning || ""),
      hint: hideSupport ? "" : (question.hint || ""),
      howToInteract: HOW_TO_SKILL[question.skill] || HOW_TO[answer.type] || HOW_TO["single-choice"],
      controls: controls,
      // A timer exists only during correction. Anywhere else it would turn
      // comprehension into a reaction test.
      timer: options.phase === "repair" ? {seconds: options.seconds || 8} : null
    };
  }

  function createTimer(config){
    config = config || {};
    var seconds = config.seconds || 8;
    return {
      total: seconds * 1000,
      remaining: seconds * 1000,
      running: false,
      startedAt: null,
      // The clock must not run while the prompt is still being spoken, or the
      // learner is timed on listening rather than on knowing.
      waitingForAudio: !!config.audio,
      expired: false,
      emitted: false,
      emitCount: 0
    };
  }

  function copyTimer(timer, over){
    var next = {};
    Object.keys(timer).forEach(function(key){ next[key] = timer[key]; });
    Object.keys(over || {}).forEach(function(key){ next[key] = over[key]; });
    return next;
  }

  function startTimer(timer, now){
    return copyTimer(timer, {running:true, waitingForAudio:false, startedAt:now});
  }

  function pauseTimer(timer, now){
    if(!timer.running) return copyTimer(timer, {});
    var elapsed = now - timer.startedAt;
    return copyTimer(timer, {running:false, startedAt:null, remaining:Math.max(0, timer.remaining - elapsed)});
  }

  function resumeTimer(timer, now){
    if(timer.running || timer.expired) return copyTimer(timer, {});
    return copyTimer(timer, {running:true, startedAt:now});
  }

  function tickTimer(timer, now){
    if(!timer.running) return copyTimer(timer, {});
    var remaining = Math.max(0, timer.remaining - (now - timer.startedAt));
    // Advance the anchor with the clock. Leaving startedAt behind would make
    // every later tick re-subtract the time already taken off remaining.
    if(remaining > 0) return copyTimer(timer, {remaining:remaining, startedAt:now});
    if(timer.emitted) return copyTimer(timer, {remaining:0, running:false, expired:true});
    return copyTimer(timer, {remaining:0, running:false, expired:true, emitted:true, emitCount:timer.emitCount + 1});
  }

  // The only DOM in this module. Pointer and keyboard both reach onAnswer
  // through the same path, so they cannot drift apart.
  function renderInto(container, question, onAnswer, options){
    options = options || {};
    var doc = options.document || (typeof document !== "undefined" ? document : null);
    if(!doc || !container) return null;
    var spec = describe(question, options);

    container.innerHTML = "";
    spec.controls.forEach(function(control){
      var button = doc.createElement("button");
      button.type = "button";
      button.className = "question-control" + (control.primary ? " is-primary" : "");
      button.id = control.id;
      button.textContent = control.label;
      button.setAttribute("aria-label", control.ariaLabel);
      button.addEventListener("click", function(event){
        event.stopPropagation();
        onAnswer(control.value, control);
      });
      container.appendChild(button);
    });
    return spec;
  }

  root.LanternQuestionRenderer = {
    SUPPORTED_TYPES: SUPPORTED_TYPES,
    describe: describe,
    createTimer: createTimer,
    startTimer: startTimer,
    pauseTimer: pauseTimer,
    resumeTimer: resumeTimer,
    tickTimer: tickTimer,
    renderInto: renderInto
  };
})(typeof self !== "undefined" ? self : this);
