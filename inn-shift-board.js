/* The shift board: an episode played as one evening instead of a list.
 *
 * The episode's questions are the same questions. What changes is who asks
 * them and when: each one belongs to a guest (or to Kon at the desk), guests
 * arrive over the evening, and each guest waits with a patience that runs
 * down. The learner decides whom to help first. The pressure is the guests
 * waiting, not a per-question countdown.
 *
 * This file is the rules only - no DOM - so they can be tested directly.
 * app.js draws the board and asks the questions.
 *
 * Time: one shift minute is SEC_PER_MIN real seconds, and tick() is called
 * once a real second. A guest's patience is counted in seconds of full-speed
 * waiting. It runs at full speed while the learner stands at the board, at
 * half speed for everyone else while they are helping someone, and at a third
 * for the guest being helped - that guest is watching them work.
 */
(function(root){
  "use strict";

  var SEC_PER_MIN = 2;
  var SHIFT_MINUTES = 120;
  var START_HOUR = 18;

  // Difficulty is chosen once, before the shift: how fast guests lose
  // patience. Harder levels pay more at the end, so choosing one is worth it.
  var LEVELS = {
    hard:{key:"hard", jp:"むずかしい", en:"Hard", pace:1.35, pay:1.5, note:"お客様はあまり待ってくれません。"},
    normal:{key:"normal", jp:"ふつう", en:"Normal", pace:1, pay:1, note:"お客様は少し待ってくれます。"},
    easy:{key:"easy", jp:"やさしい", en:"Easy", pace:0.65, pay:0.8, note:"お客様はゆっくり待ってくれます。"}
  };
  var LEVEL_ORDER = ["hard", "normal", "easy"];

  var URGENT = 0.3;
  var CRITICAL = 0.12;
  // Once any guest has waited too long, Kon serves everyone tea and they wait
  // more patiently from then on. A learner who is keeping up never sees it.
  var TEA_CALM = 0.3;

  function level(key){ return LEVELS[key] || LEVELS.normal; }

  // Arrivals move by up to two minutes each play, so a replay cannot be
  // memorised. The first guest always arrives at 18:00.
  function wobble(rng){ return Math.floor(rng() * 5) - 2; }

  function create(config, levelKey, rng){
    rng = rng || Math.random;
    var jobs = config.jobs.map(function(spec){
      var job = {
        id:spec.id, who:spec.who, lane:spec.lane || "guest", phone:!!spec.phone,
        patience:spec.patience || 0, left:spec.patience || 0,
        at:spec.at, after:spec.after || null, gap:spec.gap || 0,
        done:false, firstTry:null, doneMin:null, warned:""
      };
      if(typeof job.at === "number" && job.at > 0) job.at = Math.max(1, job.at + wobble(rng));
      if(job.after && job.gap) job.gap = Math.max(1, job.gap + wobble(rng));
      return job;
    });
    return {sec:0, level:level(levelKey).key, jobs:jobs, tea:false};
  }

  function minute(shift){ return Math.floor(shift.sec / SEC_PER_MIN); }

  function allDone(shift){ return shift.jobs.every(function(job){ return job.done; }); }

  // The clock waits at 19:55 until the last job is done: the evening does not
  // end with a guest still standing at the desk.
  function shownMinute(shift){
    var m = minute(shift);
    return allDone(shift) ? Math.min(m, SHIFT_MINUTES) : Math.min(m, SHIFT_MINUTES - 5);
  }

  function clockLabel(shift){
    var m = shownMinute(shift);
    var h = START_HOUR + Math.floor(m / 60), mm = m % 60;
    return h + ":" + (mm < 10 ? "0" : "") + mm;
  }

  function byId(shift, id){
    for(var i = 0; i < shift.jobs.length; i++) if(shift.jobs[i].id === id) return shift.jobs[i];
    return null;
  }

  // A request appears only after the one it follows (dinner after arriving).
  function available(shift, job){
    if(job.done) return false;
    if(job.after){
      var before = byId(shift, job.after);
      return !!before && before.done && before.doneMin !== null && minute(shift) >= before.doneMin + job.gap;
    }
    return minute(shift) >= (job.at || 0);
  }

  function waiting(shift){ return shift.jobs.filter(function(job){ return available(shift, job); }); }

  function anyLate(shift){
    return shift.jobs.some(function(job){ return job.lane === "guest" && available(shift, job) && job.left <= 0; });
  }

  /* Patience lost per real second, for this guest, right now.
   * `view` is "board" or "task"; `current` is the id of the job being worked. */
  function drainRate(shift, job, view, current){
    if(job.lane !== "guest") return 0;
    var r = view !== "task" ? 1 : current === job.id ? 1 / 3 : 0.5;
    return r * (shift.tea ? TEA_CALM : 1) * level(shift.level).pace;
  }

  function ratio(job){ return job.patience ? Math.max(0, job.left) / job.patience : 1; }

  function urgency(job){
    if(job.lane !== "guest" || job.done) return "";
    var r = ratio(job);
    return r < CRITICAL ? "critical" : r < URGENT ? "urgent" : "";
  }

  // Real seconds left at the current speed, so a countdown never lies.
  function secsLeft(shift, job, view, current){
    var rate = drainRate(shift, job, view, current);
    return rate ? Math.ceil(Math.max(0, job.left) / rate) : null;
  }

  /* One real second. Returns what the screen should announce: guests who just
   * crossed into urgent or critical, and whether Kon has just served tea.
   * Nothing moves while the shift is paused - the caller simply stops calling. */
  function tick(shift, view, current){
    shift.sec += 1;
    var events = {warnings:[], tea:false};
    if(!shift.tea && anyLate(shift)){ shift.tea = true; events.tea = true; }
    shift.jobs.forEach(function(job){
      if(job.lane !== "guest" || !available(shift, job)) return;
      job.left = Math.max(0, job.left - drainRate(shift, job, view, current));
      // Each step is announced once, and never for the guest being helped:
      // they are in front of the learner already.
      var u = urgency(job), helping = view === "task" && current === job.id;
      if(u === "urgent" && !job.warned){
        job.warned = "urgent";
        if(!helping) events.warnings.push({id:job.id, level:"urgent"});
      }else if(u === "critical" && job.warned !== "critical"){
        job.warned = "critical";
        if(!helping) events.warnings.push({id:job.id, level:"critical"});
      }
    });
    return events;
  }

  /* A job is finished, right or wrong - a wrong answer is still served (the
   * right reply is shown) and the word comes back in the correction round.
   * `fast` is what GuestSatisfaction calls a quick answer. */
  function complete(shift, id, correct){
    var job = byId(shift, id);
    if(!job || job.done) return null;
    if(job.firstTry === null) job.firstTry = !!correct;
    job.done = true;
    job.doneMin = minute(shift);
    return {fast: job.lane !== "guest" || ratio(job) > 0.5, late: job.lane === "guest" && job.left <= 0};
  }

  /* The shift's result. 100 points, minus 20 for each guest kept waiting too
   * long and 10 for each job not right the first time. 松 at 85 (nobody kept
   * too long, at most one miss), 竹 at 60, 梅 below. The same on every level:
   * harder levels pay more instead. */
  function result(shift){
    var late = shift.jobs.filter(function(job){ return job.lane === "guest" && job.left <= 0; }).length;
    var missed = shift.jobs.filter(function(job){ return job.firstTry === false; }).length;
    var score = Math.max(0, 100 - 20 * late - 10 * missed);
    var rank = score >= 85 ? {mark:"松", label:"とても良い"} : score >= 60 ? {mark:"竹", label:"良い"} : {mark:"梅", label:"もう少し"};
    return {late:late, missed:missed, score:score, rank:rank, level:level(shift.level)};
  }

  // Saved with the episode, so a reload resumes the same evening.
  function snapshot(shift){ return JSON.parse(JSON.stringify(shift)); }

  function restore(config, saved){
    if(!saved || !saved.jobs || saved.jobs.length !== config.jobs.length) return null;
    var ids = config.jobs.map(function(spec){ return spec.id; }).join(",");
    if(saved.jobs.map(function(job){ return job.id; }).join(",") !== ids) return null;
    var shift = snapshot(saved);
    shift.level = level(shift.level).key;
    return shift;
  }

  var api = {
    SEC_PER_MIN:SEC_PER_MIN, SHIFT_MINUTES:SHIFT_MINUTES, LEVELS:LEVELS, LEVEL_ORDER:LEVEL_ORDER,
    level:level, create:create, minute:minute, shownMinute:shownMinute, clockLabel:clockLabel,
    byId:byId, available:available, waiting:waiting, drainRate:drainRate, ratio:ratio,
    urgency:urgency, secsLeft:secsLeft, tick:tick, complete:complete, allDone:allDone,
    result:result, snapshot:snapshot, restore:restore
  };
  root.LanternShiftBoard = api;
  if(typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof self !== "undefined" ? self : this);
