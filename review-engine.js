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
  /* Rungs past a fortnight exist because nothing retires.
   *
   * An item that returns every N days occupies 1/N of a session slot for ever,
   * so the words a daily learner can hold is bounded by session size times the
   * longest interval. At [1,3,7,14] with a 20-card session that is 280, against
   * a catalogue of 3,579 - and reviews fill the session about a month in, after
   * which no new word is ever introduced. Adding 30 and 90 raises the same
   * arithmetic to 1,800.
   *
   * Not retirement: a mastered word still comes back, just rarely. Mastery here
   * is two delayed successes over seven days, which is not the same as knowing
   * something for ever, and a schedule that never asks again cannot notice
   * decay. */
  var INTERVALS = [1, 3, 7, 14, 30, 90];
  var MASTERY_DELAYED_SUCCESSES = 2;
  var MASTERY_MIN_DAYS = 7;

  function createRepairQueue(ids){
    return (ids || []).slice();
  }

  // Only the head can be answered. Anything else is a stale click from a
  // re-render and must not reorder the queue.
  // After this many goes at one card, the correction round stops asking. A card
  // sent to the back of the queue every time it is missed has no way out: a
  // learner who cannot get that one item right is held in the round for ever,
  // which is a trap rather than a lesson. Three tries, then the answer is given
  // and the item is left for a later review.
  var MAX_REPAIR_ATTEMPTS = 3;

  function answerRepair(queue, id, outcome, errorTag, attempts){
    var current = (queue || []).slice();
    if(current[0] !== id) return {queue:current, errorTag:null, unresolvedFluency:false, accepted:false, exhausted:false};

    var rest = current.slice(1);
    if(outcome === "correct"){
      return {queue:rest, errorTag:null, unresolvedFluency:false, accepted:true, exhausted:false};
    }

    var tried = Number(attempts) || 0;
    if(tried + 1 >= MAX_REPAIR_ATTEMPTS){
      return {
        queue: rest,
        errorTag: outcome === "timeout" ? null : (errorTag || "incorrect"),
        unresolvedFluency: outcome === "timeout",
        accepted: true,
        exhausted: true
      };
    }

    // Wrong and timeout both send the item to the back, but a timeout records
    // slowness rather than a misconception, so it carries no error tag.
    return {
      queue: rest.concat([id]),
      errorTag: outcome === "timeout" ? null : (errorTag || "incorrect"),
      unresolvedFluency: outcome === "timeout",
      accepted: true,
      exhausted: false
    };
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
    var isDelayed = !!previous && now >= previous.due
      && now - previous.lastAnswered >= DAY && !outcome.immediate;
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
      due: previous && !previous.errorTag && now < previous.due
        ? previous.due : now + INTERVALS[step] * DAY,
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

  /* The words that are still wrong: every item whose last answer was a miss.
   *
   * A third list, and deliberately not either of the other two. The repair
   * queue clears one session's mistakes before the learner leaves it, and the
   * due list is everything the schedule wants back today whether it was ever
   * missed or not. This is what a learner would call their mistakes: it
   * accumulates across every place, it does not empty on its own, and one
   * correct answer is what takes a word off it - `recordOutcome` clears
   * `errorTag` on success, which is the only thing this reads.
   *
   * Oldest first, by when the miss happened, so a word carried for a week
   * comes before one missed a minute ago.
   */
  function getCorrectionList(progress){
    return Object.keys(progress || {})
      .filter(function(id){ return !!(progress[id] && progress[id].errorTag); })
      .sort(function(a, b){
        return (progress[a].lastAnswered || 0) - (progress[b].lastAnswered || 0);
      });
  }

  /* The words a place still owes, for the check at the end of it.
   *
   * The correction list is every miss a learner is carrying, from everywhere,
   * and it is a list they visit when they choose to. This is the same data
   * asked a different question: of the words this place taught, which ones
   * are still wrong? It is a gate rather than a list - the place is not
   * finished until it comes back empty - so it is scoped to one place and
   * read at one moment, and both of those are the caller's to decide.
   *
   * Oldest miss first, like the list, so the word carried longest is met
   * first rather than whichever was missed most recently.
   */
  function getStageCheckQueue(progress, belongsToStage){
    if(typeof belongsToStage !== "function") return [];
    return getCorrectionList(progress).filter(belongsToStage);
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
    MAX_REPAIR_ATTEMPTS: MAX_REPAIR_ATTEMPTS,
    createRepairQueue: createRepairQueue,
    answerRepair: answerRepair,
    recordOutcome: recordOutcome,
    getDueItems: getDueItems,
    getCorrectionList: getCorrectionList,
    getStageCheckQueue: getStageCheckQueue,
    isMastered: isMastered
  };
})(typeof self !== "undefined" ? self : this);
