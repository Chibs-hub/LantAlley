/* The daily 稽古: the one part of the game that pays every day.
 *
 * The story questions pay once each and then stop - 3,750 coins for the whole
 * course, which is less than a single room upgrade. Without a renewable income
 * the reward layer is a shop nobody can afford. This is that income, and it is
 * deliberately attached to the 9,097 generated practice cards rather than to
 * the 200 authored ones, because practice is the part a learner can do forever.
 *
 * Everything here is pure: dates in, numbers out. The rules are worth testing
 * on their own, and a streak that only breaks at midnight is miserable to test
 * through a browser.
 */
(function(root){
  "use strict";

  var SESSION_SIZE = 20;      // about three to five minutes
  var PER_CARD = 1;
  var GATE_ACCURACY = 0.8;    // below this, no bonus at all
  var GATE_BONUS = 10;
  var PERFECT_BONUS = 5;
  var DAILY_CAP = 40;         // stops a long grind out-earning a good session
  var STREAK_MILESTONE = 7;
  var MILESTONE_BONUS = 50;
  /* Held freezes are capped so that a long-running learner cannot bank enough
   * to make the streak meaningless - three covers an ordinary bad week without
   * letting a month away come back intact. */
  var FREEZE_CAP = 3;

  // Local midnight, not UTC: a learner's day is the one they are living in.
  function dayKey(now){
    var d = new Date(now);
    var month = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + "-" + (month.length < 2 ? "0" + month : month)
      + "-" + (day.length < 2 ? "0" + day : day);
  }

  function daysBetween(fromKey, toKey){
    if(!fromKey || !toKey) return null;
    var a = fromKey.split("-").map(Number);
    var b = toKey.split("-").map(Number);
    var from = Date.UTC(a[0], a[1] - 1, a[2]);
    var to = Date.UTC(b[0], b[1] - 1, b[2]);
    return Math.round((to - from) / 86400000);
  }

  /* Coins for a finished session. The gate is what stops a learner tapping
   * through twenty cards for the money: below 80% the bonus simply is not
   * there, though the per-card coins still are, so a bad day is never worth
   * nothing. */
  function sessionEarnings(correct, total){
    if(!total) return {cards:0, gate:0, perfect:0, total:0, accuracy:0};
    var accuracy = correct / total;
    var cards = correct * PER_CARD;
    var gate = accuracy >= GATE_ACCURACY ? GATE_BONUS : 0;
    var perfect = correct === total ? PERFECT_BONUS : 0;
    return {cards:cards, gate:gate, perfect:perfect, total:cards + gate + perfect, accuracy:accuracy};
  }

  /* The cap is applied to what is actually granted, so a learner who has
   * already earned today gets the remainder and no more. */
  function grant(wallet, amount, now){
    var key = dayKey(now);
    var earnedToday = (wallet && wallet.date === key) ? Number(wallet.coins) || 0 : 0;
    var room = Math.max(0, DAILY_CAP - earnedToday);
    var granted = Math.max(0, Math.min(amount, room));
    return {
      granted: granted,
      wallet: {date:key, coins: earnedToday + granted},
      cappedOut: granted < amount
    };
  }

  /* A streak counts days on which a session was finished.
   *
   * A freeze is spent on a gap rather than on each missed day: holding three
   * freezes and vanishing for a week should cost one, not three. It is
   * reported back so the learner can be told it fired - a protection that
   * works silently is indistinguishable from no protection at all. */
  function advanceStreak(state, now){
    var key = dayKey(now);
    var previous = state || {};
    var streak = Number(previous.streak) || 0;
    var freezes = Number(previous.freezes) || 0;
    var last = previous.lastActiveDate || null;

    if(last === key){
      return {streak:streak, freezes:freezes, lastActiveDate:key, counted:false,
        frozen:false, milestone:0, earnedFreeze:false};
    }

    var gap = daysBetween(last, key);

    /* `gap <= 1` below means "yesterday, or later" - it was also true for
     * "earlier than the last recorded day", because a negative number is
     * also <= 1. A learner who set their system clock back a day, played,
     * then set it forward again saw the same branch both times: gap -1 going
     * back, gap 1 coming forward, streak up by one on each move, with no
     * freeze spent and no limit on repeating it. Recording `lastActiveDate`
     * is what makes that free: once it is written, the only way to satisfy
     * `last === key` above and stop counting is to hold there, so counting
     * only forward days is what closes the loop rather than just refusing
     * this one negative case. A backward move is left exactly as it found
     * the state - not counted, nothing spent, nothing written - so it cannot
     * be used to set up a shorter last-active date for a later forward hop
     * either. */
    if(gap !== null && gap < 0){
      return {streak:streak, freezes:freezes, lastActiveDate:last, counted:false,
        frozen:false, milestone:0, earnedFreeze:false};
    }

    var frozen = false;
    if(gap === null){
      streak = 1;                       // first session ever
    }else if(gap <= 1){
      streak = streak + 1;              // yesterday, or the same day rolled over
    }else if(freezes >= gap - 1){
      /* One freeze covers one missed day.
       *
       * It used to cover any gap at all, so a single held freeze carried a
       * five-day streak across eight days away and reported six. A streak that
       * survives a week off teaches the learner the number means nothing, which
       * costs more than the streak was ever worth. */
      freezes -= (gap - 1);
      frozen = true;
      streak = streak + 1;
    }else{
      streak = 1;                       // broken, and starting again today
    }

    var milestone = (streak > 0 && streak % STREAK_MILESTONE === 0) ? MILESTONE_BONUS : 0;

    /* The milestone is also where a freeze is earned.
     *
     * Freezes were spent here and shown in the HUD, but nothing anywhere ever
     * granted one, so the branch above could never fire: `gap <= 1` returns
     * earlier, which means reaching it requires `freezes >= 1`, which a save
     * initialised to zero and never incremented could not satisfy. The whole
     * protection was unreachable and every missed day broke the streak. A week
     * earns the coins and the cushion together. */
    var earnedFreeze = false;
    if(milestone && freezes < FREEZE_CAP){
      freezes += 1;
      earnedFreeze = true;
    }
    return {streak:streak, freezes:freezes, lastActiveDate:key, counted:true,
      frozen:frozen, milestone:milestone, earnedFreeze:earnedFreeze};
  }

  root.LanternDailyPractice = Object.freeze({
    SESSION_SIZE: SESSION_SIZE,
    DAILY_CAP: DAILY_CAP,
    GATE_ACCURACY: GATE_ACCURACY,
    STREAK_MILESTONE: STREAK_MILESTONE,
    FREEZE_CAP: FREEZE_CAP,
    dayKey: dayKey,
    daysBetween: daysBetween,
    sessionEarnings: sessionEarnings,
    grant: grant,
    advanceStreak: advanceStreak
  });
})(typeof self !== "undefined" ? self : this);
