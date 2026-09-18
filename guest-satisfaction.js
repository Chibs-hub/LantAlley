(function(root){
  "use strict";

  var FACES = [
    {min:0,  emoji:"😤", label:"不満", cls:"angry"},
    {min:25, emoji:"😐", label:"ふつう", cls:"neutral"},
    {min:50, emoji:"🙂", label:"まあまあ", cls:"ok"},
    {min:75, emoji:"😊", label:"満足", cls:"happy"},
    {min:90, emoji:"😍", label:"大満足", cls:"thrilled"}
  ];

  var REWARDS = [
    {min:0,  coins:0,   label:"お客様はがっかりしました。"},
    {min:25, coins:50,  label:"まだまだ練習が必要です。"},
    {min:50, coins:100, label:"まずまずの仕事でした。"},
    {min:75, coins:200, label:"お客様に喜ばれました！"},
    {min:90, coins:350, label:"お客様に大変喜ばれました！"}
  ];

  function face(score){
    var f = FACES[0];
    for(var i = 1; i < FACES.length; i++){
      if(score >= FACES[i].min) f = FACES[i];
    }
    return f;
  }

  function reward(score){
    var r = REWARDS[0];
    for(var i = 1; i < REWARDS.length; i++){
      if(score >= REWARDS[i].min) r = REWARDS[i];
    }
    return r;
  }

  function create(totalQuestions){
    return {score:50, total:totalQuestions, answered:0, streak:0, best:0};
  }

  function record(sat, correct, fast){
    sat.answered += 1;
    if(correct){
      sat.streak += 1;
      if(sat.streak > sat.best) sat.best = sat.streak;
      var gain = 8;
      if(fast) gain += 4;
      if(sat.streak >= 3) gain += 3;
      sat.score = Math.min(100, sat.score + gain);
    } else {
      sat.streak = 0;
      sat.score = Math.max(0, sat.score - 12);
    }
    return sat;
  }

  function timeout(sat){
    sat.answered += 1;
    sat.streak = 0;
    sat.score = Math.max(0, sat.score - 8);
    return sat;
  }

  function barHTML(sat){
    var f = face(sat.score);
    return '<div class="guest-sat" data-level="' + f.cls + '">'
      + '<span class="guest-sat-face" aria-label="' + f.label + '">' + f.emoji + '</span>'
      + '<div class="guest-sat-track">'
      + '<div class="guest-sat-fill" style="width:' + sat.score + '%"></div>'
      + '</div>'
      + '<span class="guest-sat-label">' + f.label + '</span>'
      + '</div>';
  }

  function updateBar(container, sat){
    var bar = container.querySelector(".guest-sat");
    if(!bar) return;
    var f = face(sat.score);
    bar.setAttribute("data-level", f.cls);
    var faceEl = bar.querySelector(".guest-sat-face");
    if(faceEl){ faceEl.textContent = f.emoji; faceEl.setAttribute("aria-label", f.label); }
    var fill = bar.querySelector(".guest-sat-fill");
    if(fill) fill.style.width = sat.score + "%";
    var label = bar.querySelector(".guest-sat-label");
    if(label) label.textContent = f.label;
    bar.classList.remove("guest-sat-bump", "guest-sat-drop");
    void bar.offsetWidth;
    bar.classList.add(sat.streak > 0 ? "guest-sat-bump" : "guest-sat-drop");
  }

  function summaryHTML(sat){
    var f = face(sat.score);
    var r = reward(sat.score);
    var stars = sat.score >= 90 ? "★★★" : sat.score >= 75 ? "★★☆" : sat.score >= 50 ? "★☆☆" : "☆☆☆";
    return '<div class="guest-sat-summary">'
      + '<div class="guest-sat-summary-face">' + f.emoji + '</div>'
      + '<div class="guest-sat-summary-stars">' + stars + '</div>'
      + '<p class="guest-sat-summary-label">' + f.label + '</p>'
      + '<p class="guest-sat-summary-msg">' + r.label + '</p>'
      + (r.coins ? '<p class="guest-sat-summary-coins">チップ: +¥' + r.coins + '</p>' : '')
      + (sat.best >= 3 ? '<p class="guest-sat-summary-streak">' + sat.best + '問連続正解！</p>' : '')
      + '</div>';
  }

  root.GuestSatisfaction = {
    create: create,
    record: record,
    timeout: timeout,
    face: face,
    reward: reward,
    barHTML: barHTML,
    updateBar: updateBar,
    summaryHTML: summaryHTML
  };
})(typeof window !== "undefined" ? window : globalThis);
