(function(root){
  "use strict";

  /* Each coordinate is the bird's foot baseline on a visible support in the
   * 16:9 scene painting. This keeps idle poses attached to the architecture;
   * only the authored flight transition is ever allowed between surfaces. */
  var SCENES = {
    yard: [
      {id:"yard-roof-left", x:29, y:14, support:"roof", behaviors:["perch","sing","preen"]},
      {id:"yard-eave-right", x:74, y:26, support:"roof", behaviors:["perch","sing"]},
      {id:"yard-right-fence", x:90, y:43, support:"fence", behaviors:["perch","preen","sing"]},
      {id:"yard-veranda-rail", x:76, y:52, support:"rail", behaviors:["perch","preen","sleep"]},
      {id:"yard-path-stone", x:52, y:79, support:"stone", behaviors:["peck","perch"]},
      {id:"yard-left-fence", x:11, y:42, support:"fence", behaviors:["perch","sing","sleep"]}
    ],
    interior: [
      {id:"interior-back-beam", x:50, y:27, support:"beam", behaviors:["perch","sing","sleep"]},
      {id:"interior-right-sill", x:84, y:68, support:"sill", behaviors:["perch","preen","sing"]},
      {id:"interior-tatami", x:56, y:84, support:"tatami", behaviors:["peck","perch"]},
      {id:"interior-left-threshold", x:19, y:73, support:"sill", behaviors:["perch","preen"]},
      {id:"interior-left-rail", x:11, y:62, support:"rail", behaviors:["perch","sing","sleep"]},
      {id:"interior-back-sill", x:50, y:61, support:"sill", behaviors:["perch","preen","sleep"]}
    ]
  };

  var SPRITES = {
    fly: {path:"assets/home/pet/uguisu-fly-v1.png", columns:4, rows:1, frames:4, frameMs:140},
    perch: {path:"assets/home/pet/uguisu-perch-v1.png", columns:4, rows:1, frames:4, frameMs:620},
    preen: {path:"assets/home/pet/uguisu-preen-v1.png", columns:4, rows:1, frames:4, frameMs:520, loop:false},
    sing: {path:"assets/home/pet/uguisu-sing-v1.png", columns:4, rows:1, frames:4, frameMs:360, loop:false},
    sleep: {path:"assets/home/pet/uguisu-sleep-v1.png", columns:4, rows:1, frames:4, frameMs:720},
    peck: {path:"assets/home/pet/uguisu-peck-v1.png", columns:4, rows:1, frames:4, frameMs:320, loop:false}
  };

  /* The same bird occupies a different percentage in the wide yard and the
   * smaller room. The range is about one third to two fifths of the cat at the
   * same depth, matching a 15 cm songbird beside a 46 cm cat while preserving
   * enough detail to read on a phone. */
  var SCENE_SCALE = {
    yard: {farY:14, nearY:90, farWidth:1.35, nearWidth:2.20},
    interior: {farY:27, nearY:88, farWidth:2.50, nearWidth:5.20}
  };

  function copy(value){ return JSON.parse(JSON.stringify(value)); }
  function anchors(scene){ return (SCENES[scene] || []).map(copy); }
  function find(scene, id){
    return (SCENES[scene] || []).filter(function(anchor){ return anchor.id === id; })[0] || null;
  }

  function widthAt(y, scene){
    var scale = SCENE_SCALE[scene] || SCENE_SCALE.yard;
    var depth = (Number(y) - scale.farY) / (scale.nearY - scale.farY);
    depth = Math.max(0, Math.min(1, depth));
    return +(scale.farWidth + (scale.nearWidth - scale.farWidth) * depth).toFixed(2);
  }

  function create(scene, seed){
    var choices = SCENES[scene];
    if(!choices) return null;
    var normalized = Math.abs(Number(seed) || 1) >>> 0;
    var anchor = choices[normalized % choices.length];
    return {scene:scene, anchorId:anchor.id, targetId:null, x:anchor.x, y:anchor.y,
      facing:1, behavior:anchor.behaviors[normalized % anchor.behaviors.length],
      frame:0, clock:0, seed:normalized};
  }

  function nextAnchor(state){
    var rows = SCENES[state && state.scene] || [];
    if(rows.length < 2) return null;
    var index = rows.findIndex(function(anchor){ return anchor.id === state.anchorId; });
    if(index < 0) index = 0;
    return copy(rows[(index + 1) % rows.length]);
  }

  function sendTo(state, anchorId){
    var next = copy(state);
    var target = find(next.scene, anchorId);
    if(!target) return next;
    next.anchorId = null;
    next.targetId = target.id;
    next.flightFromX = next.x;
    next.flightFromY = next.y;
    next.flightProgress = 0;
    next.flightDistance = Math.max(0.1, Math.hypot(target.x - next.x, target.y - next.y));
    next.facing = target.x < next.x ? -1 : 1;
    next.behavior = "fly";
    next.frame = 0;
    next.clock = 0;
    return next;
  }

  function settleAt(state, anchorId){
    var next = copy(state);
    var target = find(next.scene, anchorId);
    if(!target) return next;
    next.anchorId = target.id;
    next.targetId = null;
    next.x = target.x;
    next.y = target.y;
    next.behavior = target.behaviors[next.seed % target.behaviors.length];
    next.frame = 0;
    next.clock = 0;
    delete next.flightFromX;
    delete next.flightFromY;
    delete next.flightProgress;
    delete next.flightDistance;
    return next;
  }

  function step(state, elapsedMs, options){
    if(!state) return null;
    var settings = options || {};
    if(settings.paused) return copy(state);
    if(settings.reducedMotion){
      if(state.targetId) return settleAt(state, state.targetId);
      var still = copy(state);
      still.behavior = "perch";
      still.frame = 0;
      still.clock = 0;
      return still;
    }

    var next = copy(state);
    var elapsed = Math.max(0, Number(elapsedMs) || 0);
    next.clock += elapsed;
    if(!next.targetId){
      var resting = SPRITES[next.behavior] || SPRITES.perch;
      var rawFrame = Math.floor(next.clock / resting.frameMs);
      next.frame = resting.loop === false
        ? Math.min(resting.frames - 1, rawFrame)
        : rawFrame % resting.frames;
      return next;
    }

    var target = find(next.scene, next.targetId);
    if(!target) return settleAt(next, next.anchorId);
    var distance = next.flightDistance || Math.max(0.1,
      Math.hypot(target.x - next.flightFromX, target.y - next.flightFromY));
    var progress = Math.min(1, (next.flightProgress || 0) + elapsed * 0.018 / distance);
    if(progress >= 1) return settleAt(next, target.id);

    var fromX = Number(next.flightFromX);
    var fromY = Number(next.flightFromY);
    var lift = Math.min(8, Math.max(2.4, distance * 0.12));
    next.flightProgress = progress;
    next.x = fromX + (target.x - fromX) * progress;
    next.y = fromY + (target.y - fromY) * progress - Math.sin(Math.PI * progress) * lift;
    next.behavior = "fly";
    next.frame = Math.floor(next.clock / SPRITES.fly.frameMs) % SPRITES.fly.frames;
    return next;
  }

  function enterScene(scene, seed){ return create(scene, seed); }

  function dwellMs(state){
    var behavior = state && state.behavior || "perch";
    var seed = Math.abs(Number(state && state.seed) || 1) >>> 0;
    if(behavior === "sleep") return 8500 + seed % 3501;
    if(behavior === "perch") return 5500 + seed % 3001;
    if(behavior === "preen") return 5200 + seed % 2501;
    if(behavior === "sing") return 4200 + seed % 2201;
    return 3500 + seed % 2001;
  }

  function spriteFor(state){
    var sprite = SPRITES[state && state.behavior] || SPRITES.perch;
    return {path:sprite.path, columns:sprite.columns, rows:sprite.rows,
      frame:Math.max(0, Number(state && state.frame) || 0) % sprite.frames};
  }

  root.LanternHomeBird = {
    anchors:anchors,
    nextAnchor:nextAnchor,
    widthAt:widthAt,
    behaviors:function(){ return Object.keys(SPRITES); },
    create:create,
    sendTo:sendTo,
    settleAt:settleAt,
    step:step,
    enterScene:enterScene,
    dwellMs:dwellMs,
    spriteFor:spriteFor
  };
})(typeof self !== "undefined" ? self : this);
