(function(root){
  "use strict";

  var mechanics = ["arrange", "replace", "warm", "coordinate", "undertake"];

  function create(mechanic){
    if(mechanic === "replace") return {mechanic:"replace", removed:null, installed:null, done:false};
    if(mechanic === "warm") return {mechanic:"warm", item:null, done:false};
    if(mechanic === "coordinate") return {mechanic:"coordinate", arrivalA:15, arrivalB:16};
    if(mechanic === "undertake") return {mechanic:"undertake", answered:null, done:false};
    return {mechanic:"arrange", assign:{}, done:false};
  }

  function clone(state){
    return JSON.parse(JSON.stringify(state));
  }

  function result(state, outcome, reason){
    return {state:state, outcome:outcome, reason:reason || ""};
  }

  function isComplete(state){
    if(!state) return false;
    if(state.mechanic === "arrange") return !!state.done;
    if(state.mechanic === "replace") return !!state.done;
    if(state.mechanic === "warm") return !!state.done;
    if(state.mechanic === "coordinate") return state.arrivalA >= 14 && state.arrivalB <= 19 && Math.abs(state.arrivalA - state.arrivalB) >= 2;
    if(state.mechanic === "undertake") return !!state.done;
    return false;
  }

  function getRoomLightState(state, target){
    if(!state || state.mechanic !== "replace" || target !== "bulb") return "normal";
    return state.installed === "bulb" ? "bright" : "dim";
  }

  function applyArrange(state, action){
    var next = clone(state);
    var spec = action.items || [];
    var attribute = action.attribute;
    if(action.type !== "place" || !action.group || !attribute) return result(next, "wrong", "Choose an object, then a place to put it.");
    var known = spec.filter(function(entry){ return entry[0] === action.item; })[0];
    if(!known) return result(next, "wrong", "Choose an object, then a place to put it.");
    next.assign[action.item] = action.group;

    var valueOfGroup = {};
    var mixed = false;
    spec.forEach(function(entry){
      var group = next.assign[entry[0]];
      if(!group) return;
      var value = entry[1][attribute];
      if(valueOfGroup[group] === undefined) valueOfGroup[group] = value;
      else if(valueOfGroup[group] !== value) mixed = true;
    });
    if(mixed){
      delete next.assign[action.item];
      return result(next, "wrong", "Those do not belong together for what was asked.");
    }

    var placedAll = spec.every(function(entry){ return next.assign[entry[0]]; });
    if(!placedAll) return result(next, "progress", "Placed.");

    var groupOfValue = {};
    var split = false;
    spec.forEach(function(entry){
      var value = entry[1][attribute];
      var group = next.assign[entry[0]];
      if(groupOfValue[value] === undefined) groupOfValue[value] = group;
      else if(groupOfValue[value] !== group) split = true;
    });
    if(split) return result(next, "wrong", "Some that belong together ended up apart.");

    next.done = true;
    return result(next, "success", "They are in order now.");
  }

  function applyReplace(state, action){
    var next = clone(state);
    var target = action.target;
    if(action.type === "removeOld"){
      if(target && action.item !== target) return result(next, "wrong", "That is not the thing the request named.");
      next.removed = action.item || target;
      return result(next, "progress", "The old one has been taken out.");
    }
    if(action.type === "placeClean"){
      if(target && action.item !== target) return result(next, "wrong", "That is not the thing the request named.");
      if(!next.removed) return result(next, "wrong", "Take the old one out before putting the new one in.");
      next.installed = action.item || target;
      next.done = true;
      return result(next, "success", "The old one has been replaced with the new one.");
    }
    return result(next, "wrong", "Take the old one out, then put the new one in its place.");
  }

  function applyWarm(state, action){
    var next = clone(state);
    var target = action.target;
    if(action.type !== "heat") return result(next, "wrong", "Move the item to an appliance.");
    if(target && action.item !== target) return result(next, "wrong", "That is not the thing the request named.");
    if(!action.targetAppliance || action.appliance !== action.targetAppliance) return result(next, "wrong", "Choose the appliance that fits the item.");
    next.item = action.item || target;
    next.done = true;
    return result(next, "success", "It is warming.");
  }

  function applyCoordinate(state, action){
    var next = clone(state);
    if(action.type !== "setTimes") return result(next, "wrong", "Move both arrival cards on the schedule.");
    next.arrivalA = Number(action.arrivalA);
    next.arrivalB = Number(action.arrivalB);
    var min = action.min === undefined ? 14 : Number(action.min);
    var max = action.max === undefined ? 19 : Number(action.max);
    var gap = action.gap === undefined ? 2 : Number(action.gap);
    if(next.arrivalA < min || next.arrivalB > max) return result(next, "wrong", "The proposed times do not fit the visible schedule constraints.");
    if(Math.abs(next.arrivalA - next.arrivalB) < gap) return result(next, "wrong", "The schedule still has a conflict. Recheck the time needed between events.");
    if(action.targetA !== undefined && next.arrivalA !== Number(action.targetA)) return result(next, "wrong", "That time does not satisfy every travel and preparation clue.");
    if(action.targetB !== undefined && next.arrivalB !== Number(action.targetB)) return result(next, "wrong", "That time does not satisfy every travel and preparation clue.");
    return result(next, "success", "The two arrivals are coordinated.");
  }

  function applyUndertake(state, action){
    // The whole answer is the reply. 引き受ける is about taking the job on,
    // so choosing the words that accept it is the act itself.
    var next = clone(state);
    if(action.type !== "respond") return result(next, "wrong", "Answer the innkeeper.");
    next.answered = action.key;
    if(action.key !== "accept") return result(next, "wrong", "That reply does not take the job on.");
    next.done = true;
    return result(next, "success", "You took the job on.");
  }

  function apply(state, action){
    if(!state || mechanics.indexOf(state.mechanic) < 0) state = create("arrange");
    if(state.mechanic === "arrange") return applyArrange(state, action || {});
    if(state.mechanic === "replace") return applyReplace(state, action || {});
    if(state.mechanic === "warm") return applyWarm(state, action || {});
    if(state.mechanic === "coordinate") return applyCoordinate(state, action || {});
    return applyUndertake(state, action || {});
  }

  function serialize(state){ return clone(state); }

  function restore(value){
    if(!value || mechanics.indexOf(value.mechanic) < 0) return create("arrange");
    var base = create(value.mechanic);
    Object.keys(base).forEach(function(key){
      if(key in value) base[key] = clone(value[key]);
    });
    return base;
  }

  root.MoonviewInnInteractions = {
    mechanics:mechanics,
    create:create,
    apply:apply,
    isComplete:isComplete,
    getRoomLightState:getRoomLightState,
    serialize:serialize,
    restore:restore
  };
})(typeof window !== "undefined" ? window : globalThis);
