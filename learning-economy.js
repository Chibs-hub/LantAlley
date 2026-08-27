(function(root){
  "use strict";

  var REWARD = {learn:10, practice:15, challenge:25, review:10};

  function unique(list){
    var seen = {};
    return (list || []).filter(function(value){
      if(!value || seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function masteryPercent(mastered, material){
    var total = unique(material);
    if(!total.length) return 0;
    var known = {};
    unique(mastered).forEach(function(id){ known[id] = true; });
    var count = total.filter(function(id){ return known[id]; }).length;
    return Math.round(count / total.length * 100);
  }

  function award(wallet, answerId, mode){
    var paid = unique(wallet && wallet.paid);
    var money = Number(wallet && wallet.money) || 0;
    if(!answerId || paid.indexOf(answerId) >= 0) return {money:money, paid:paid, earned:0};
    var earned = REWARD[mode] || REWARD.learn;
    paid.push(answerId);
    return {money:money + earned, paid:paid, earned:earned};
  }

  function isUnlocked(key, order, mastery){
    var at = (order || []).indexOf(key);
    if(at <= 0) return at === 0;
    return Number((mastery || {})[order[at - 1]]) >= 100;
  }

  root.LanternLearningEconomy = Object.freeze({
    rewards:Object.freeze(REWARD),
    masteryPercent:masteryPercent,
    award:award,
    isUnlocked:isUnlocked
  });
})(typeof self !== "undefined" ? self : this);
