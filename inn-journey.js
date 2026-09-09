/* The finite Moonview Inn route.
 *
 * This module is deliberately ignorant of the DOM, storage, money, and home
 * inventory. It only defines what a stop is, which stop is current, and
 * whether a reward has already been claimed. Keeping those facts together
 * prevents a replay from accidentally handing out a second home item.
 */
(function(root){
  "use strict";

  var STEPS = [
    {id:"training", label:"Inn Training", detail:"Three days", icon:"lantern",
      reward:{kind:"decor", item:"floor-cushion-navy", coins:25,
        name:"Floor cushion", image:"assets/home/decor/floor-cushion-navy-v1.webp"}},
    {id:"inn-e01", label:"Episode 1", detail:"First shift", icon:"lantern",
      reward:{kind:"plant", plant:"camellia", name:"Camellia seed",
        image:"assets/home/garden/camellia-planted-gravel-v2.webp"}},
    {id:"inn-e02", label:"Episode 2", detail:"Reservation book", icon:"lantern",
      reward:{kind:"decor", item:"scroll", name:"Hanging scroll",
        image:"assets/home/decor/hanging-scroll-bamboo-v1.webp"}},
    {id:"inn-e03", label:"Episode 3", detail:"Evening lantern", icon:"lantern",
      reward:{kind:"decor", item:"floor-lantern", name:"Floor lantern",
        image:"assets/home/decor/floor-lantern-v1.webp"}},
    {id:"inn-e04", label:"Episode 4", detail:"Final shift", icon:"lantern",
      reward:{kind:"cat", name:"Your cat", image:"assets/home/pet/calico-sit-v1.png"}}
  ];

  function copy(value){
    return JSON.parse(JSON.stringify(value));
  }

  function stepById(id){
    return STEPS.filter(function(step){ return step.id === id; })[0] || null;
  }

  function fresh(){
    return {version:1, claimed:{}, catUnlocked:false};
  }

  function normalize(value, legacy){
    if(!value || typeof value !== "object"){
      var legacyJourney = fresh();
      legacyJourney.catUnlocked = !!legacy;
      return legacyJourney;
    }
    var next = fresh();
    Object.keys(value.claimed || {}).forEach(function(id){
      if(stepById(id) && value.claimed[id] === true) next.claimed[id] = true;
    });
    next.catUnlocked = value.catUnlocked === true || next.claimed["inn-e04"] === true;
    return next;
  }

  function done(episodesDone, id){
    if(Array.isArray(episodesDone)) return episodesDone.indexOf(id) >= 0;
    return !!((episodesDone || {})[id]);
  }

  function isComplete(episodesDone){
    return STEPS.slice(1).every(function(step){ return done(episodesDone, step.id); });
  }

  function current(stage, episodesDone){
    if(!(stage && stage.mastered)) return copy(STEPS[0]);
    for(var index = 1; index < STEPS.length; index += 1){
      if(!done(episodesDone, STEPS[index].id)) return copy(STEPS[index]);
    }
    return copy(STEPS[STEPS.length - 1]);
  }

  function claim(journey, id){
    var next = normalize(journey, false);
    var step = stepById(id);
    if(!step) return {granted:false, reward:null, journey:next};
    if(next.claimed[id]) return {granted:false, reward:copy(step.reward), journey:next};
    next.claimed[id] = true;
    if(step.reward.kind === "cat") next.catUnlocked = true;
    return {granted:true, reward:copy(step.reward), journey:next};
  }

  root.LanternInnJourney = Object.freeze({
    fresh:fresh,
    normalize:normalize,
    steps:function(){ return copy(STEPS); },
    step:stepById,
    current:current,
    claim:claim,
    isComplete:isComplete
  });
})(typeof self !== "undefined" ? self : this);
