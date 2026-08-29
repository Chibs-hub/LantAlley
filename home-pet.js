(function(root){
  "use strict";

  var SCENES = {
    yard: [
      {id:"yard-door", x:50, y:45, kind:"door", behaviors:["look"]},
      {id:"yard-shade", x:17, y:72, kind:"shade", behaviors:["loaf","curl-sleep","side-sleep"]},
      {id:"yard-rock", x:38, y:75, kind:"rock", behaviors:["sniff","sit","look"]},
      {id:"yard-path", x:55, y:78, kind:"path", behaviors:["sit","groom"]},
      {id:"yard-veranda", x:72, y:54, kind:"veranda", behaviors:["loaf","groom","look"]},
      {id:"yard-play", x:64, y:72, kind:"garden", behaviors:["play","sniff","stretch"]}
    ],
    interior: [
      {id:"interior-door", x:50, y:65, kind:"door", behaviors:["look"]},
      {id:"interior-cushion", x:38, y:80, kind:"furniture", behaviors:["curl-sleep","side-sleep","loaf"]},
      {id:"interior-window", x:20, y:72, kind:"window", behaviors:["look","groom"]},
      {id:"interior-center", x:55, y:82, kind:"tatami", behaviors:["sit","play","stretch"]},
      {id:"interior-alcove", x:74, y:72, kind:"alcove", behaviors:["sniff","sit"]}
    ]
  };

  var SPRITES = {
    walk: {path:"assets/home/pet/calico-walk-v1.webp", columns:8, rows:1, frames:8},
    sit: {path:"assets/home/pet/calico-transitions-v1.webp", columns:4, rows:3, frames:4, offset:0},
    stand: {path:"assets/home/pet/calico-transitions-v1.webp", columns:4, rows:3, frames:4, offset:4},
    enter: {path:"assets/home/pet/calico-transitions-v1.webp", columns:4, rows:3, frames:4, offset:8},
    loaf: {path:"assets/home/pet/calico-idles-v1.webp", columns:4, rows:3, frames:4, offset:0},
    "curl-sleep": {path:"assets/home/pet/calico-idles-v1.webp", columns:4, rows:3, frames:4, offset:4},
    "side-sleep": {path:"assets/home/pet/calico-idles-v1.webp", columns:4, rows:3, frames:4, offset:4},
    groom: {path:"assets/home/pet/calico-idles-v1.webp", columns:4, rows:3, frames:4, offset:8},
    sniff: {path:"assets/home/pet/calico-interactions-v1.webp", columns:4, rows:3, frames:4, offset:0},
    stretch: {path:"assets/home/pet/calico-interactions-v1.webp", columns:4, rows:3, frames:4, offset:4},
    look: {path:"assets/home/pet/calico-interactions-v1.webp", columns:4, rows:3, frames:4, offset:8},
    play: {path:"assets/home/pet/calico-interactions-v1.webp", columns:4, rows:3, frames:4, offset:8}
  };

  function copy(value){ return JSON.parse(JSON.stringify(value)); }
  function sceneAnchors(scene){ return (SCENES[scene] || []).map(copy); }
  function find(scene, id){ return (SCENES[scene] || []).filter(function(row){ return row.id === id; })[0] || null; }

  function create(scene, seed){
    if(!SCENES[scene]) return null;
    var choices = SCENES[scene].filter(function(anchor){ return anchor.kind !== "door"; });
    var normalized = Math.abs(Number(seed) || 1) >>> 0;
    var anchor = choices[normalized % choices.length];
    return {scene:scene, anchorId:anchor.id, targetId:null, x:anchor.x, y:anchor.y,
      facing:1, behavior:anchor.behaviors[0], frame:0, clock:0, seed:normalized};
  }

  function sendTo(state, anchorId){
    var next = copy(state);
    var target = find(next.scene, anchorId);
    if(!target) return next;
    next.targetId = target.id;
    next.anchorId = null;
    next.facing = target.x < next.x ? -1 : 1;
    next.behavior = "walk";
    next.frame = 0;
    return next;
  }

  function step(state, elapsedMs, options){
    if(!state) return null;
    var settings = options || {};
    if(settings.paused) return copy(state);
    var next = copy(state);
    if(settings.reducedMotion){
      next.behavior = "loaf";
      next.frame = 0;
      return next;
    }
    var elapsed = Math.max(0, Number(elapsedMs) || 0);
    next.clock += elapsed;
    if(!next.targetId){
      var sprite = SPRITES[next.behavior] || SPRITES.loaf;
      next.frame = Math.floor(next.clock / 220) % Math.max(1, sprite.frames);
      return next;
    }
    var target = find(next.scene, next.targetId);
    if(!target){ next.targetId = null; return next; }
    var dx = target.x - next.x;
    var dy = target.y - next.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    var travel = elapsed * 0.012;
    if(distance <= travel || distance === 0){
      next.x = target.x;
      next.y = target.y;
      next.anchorId = target.id;
      next.targetId = null;
      next.behavior = target.behaviors[next.seed % target.behaviors.length];
      next.frame = 0;
      return next;
    }
    next.x += dx / distance * travel;
    next.y += dy / distance * travel;
    next.behavior = "walk";
    next.frame = Math.floor(next.clock / 90) % 8;
    return next;
  }

  function crossDoor(state){
    if(!state || state.targetId) return copy(state);
    var anchor = find(state.scene, state.anchorId);
    if(!anchor || anchor.kind !== "door") return copy(state);
    var scene = state.scene === "yard" ? "interior" : "yard";
    var door = SCENES[scene].filter(function(row){ return row.kind === "door"; })[0];
    var next = copy(state);
    next.scene = scene;
    next.anchorId = door.id;
    next.x = door.x;
    next.y = door.y;
    next.behavior = "enter";
    next.frame = 0;
    return next;
  }

  function spriteFor(state){
    var row = SPRITES[state && state.behavior] || SPRITES.loaf;
    var frames = Math.max(1, row.frames || 1);
    return {path:row.path, columns:row.columns, rows:row.rows,
      frame:(row.offset || 0) + (Math.max(0, Number(state && state.frame) || 0) % frames)};
  }

  root.LanternHomePet = {
    anchors:sceneAnchors,
    behaviors:function(){ return Object.keys(SPRITES); },
    create:create,
    sendTo:sendTo,
    step:step,
    crossDoor:crossDoor,
    spriteFor:spriteFor
  };
})(typeof self !== "undefined" ? self : this);
