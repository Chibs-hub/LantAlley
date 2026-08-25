/* Correction queue and delayed review.
 *
 * Pure and immutable: no DOM, no timers, no Date.now(). Every function takes
 * `now` explicitly so the schedule can be tested with fixed timestamps instead
 * of by waiting fourteen days.
 *
 * Two separate mechanisms live here and are deliberately not merged:
 *   - The repair queue clears today's mistakes before the learner leaves.
 *   - Delayed review brings correct material back days later. Only that second
 *     one can produce mastery, because same-session repetition proves
 *     recognition rather than retrieval.
 */
(function(root){
  "use strict";

  var DAY = 86400000;
  var INTERVALS = [1, 3, 7, 14];
  var MASTERY_DELAYED_SUCCESSES = 2;
  var MASTERY_MIN_DAYS = 7;

  function createRepairQueue(ids){
    return (ids || []).slice();
  }

  // Only the head can be answered. Anything else is a stale click from a
  // re-render and must not reorder the queue.
  function answerRepair(queue, id, outcome, errorTag){
    var current = (queue || []).slice();
    if(current[0] !== id) return {queue:current, errorTag:null, unresolvedFluency:false, accepted:false};

    var rest = current.slice(1);
    if(outcome === "correct"){
      return {queue:rest, errorTag:null, unresolvedFluency:false, accepted:true};
    }
    // Wrong and timeout both send the item to the back, but a timeout records
    // slowness rather than a misconception, so it carries no error tag.
    return {
      queue: rest.concat([id]),
      errorTag: outcome === "timeout" ? null : (errorTag || "incorrect"),
      unresolvedFluency: outcome === "timeout",
      accepted: true
    };
  }

  function sameDay(a, b){
    return Math.floor(a / DAY) === Math.floor(b / DAY);
  }

  function recordOutcome(progress, outcome){
    var next = {};
    Object.keys(progress || {}).forEach(function(key){ next[key] = progress[key]; });

    var previous = next[outcome.id];
    var now = outcome.now;

    if(!outcome.correct){
      next[outcome.id] = {
        step: 0,
        firstSuccess: previous ? previous.firstSuccess : null,
        lastAnswered: now,
        delayedSuccesses: previous ? previous.delayedSuccesses : 0,
        lastDelayedSuccess: previous ? previous.lastDelayedSuccess : null,
        due: now,
        errorTag: outcome.errorTag || "incorrect"
      };
      return next;
    }

    var firstSuccess = previous && previous.firstSuccess ? previous.firstSuccess : now;
    var delayed = previous ? previous.delayedSuccesses : 0;
    var lastDelayed = previous ? previous.lastDelayedSuccess : null;

    // Repeating an item minutes after getting it right is recognition, not
    // retrieval, so it neither advances the schedule nor counts toward mastery.
    var isDelayed = !!previous && !sameDay(previous.lastAnswered, now);
    var step = previous ? previous.step : 0;
    if(isDelayed){
      delayed += 1;
      lastDelayed = now;
      step = Math.min(step + 1, INTERVALS.length - 1);
    }

    next[outcome.id] = {
      step: step,
      firstSuccess: firstSuccess,
      lastAnswered: now,
      delayedSuccesses: delayed,
      lastDelayedSuccess: lastDelayed,
      due: now + INTERVALS[step] * DAY,
      errorTag: null
    };
    return next;
  }

  // Oldest first, so a learner returning after a long gap meets the material
  // they have held longest rather than the most recently added.
  function getDueItems(progress, now){
    return Object.keys(progress || {})
      .filter(function(id){ return progress[id].due <= now; })
      .sort(function(a, b){ return progress[a].due - progress[b].due; });
  }

  function isMastered(itemProgress){
    if(!itemProgress || !itemProgress.firstSuccess) return false;
    if(itemProgress.errorTag) return false;
    if(itemProgress.delayedSuccesses < MASTERY_DELAYED_SUCCESSES) return false;
    if(!itemProgress.lastDelayedSuccess) return false;
    return (itemProgress.lastDelayedSuccess - itemProgress.firstSuccess) >= MASTERY_MIN_DAYS * DAY;
  }

  root.LanternReviewEngine = {
    INTERVALS: INTERVALS,
    createRepairQueue: createRepairQueue,
    answerRepair: answerRepair,
    recordOutcome: recordOutcome,
    getDueItems: getDueItems,
    isMastered: isMastered
  };
})(typeof self !== "undefined" ? self : this);
