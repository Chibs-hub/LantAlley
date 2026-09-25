(function(root){
  "use strict";

  /* The Shiba stays on authored floor surfaces. Unlike the cat it never uses
   * a perch, canopy, loaf, or aerial transition: its movement is a short,
   * grounded trot between places where a small dog could actually stand. */
  var SCENES = {
    yard: [
      {id:"yard-dog-shade", x:21, y:72, support:"ground", behaviors:["stand","sniff"]},
      {id:"yard-dog-rock", x:40, y:77, support:"ground", behaviors:["sniff","sit"]},
      {id:"yard-dog-path", x:56, y:83, support:"ground", behaviors:["stand","scratch"]},
      {id:"yard-dog-veranda", x:76, y:67, support:"ground", behaviors:["sit","stand"]},
      {id:"yard-dog-lane", x:50, y:88, support:"ground", behaviors:["sniff","stand"]}
    ],
    interior: [
      {id:"interior-dog-cushion", x:35, y:82, support:"ground", behaviors:["sit","stand"]},
      {id:"interior-dog-window", x:24, y:79, support:"ground", behaviors:["stand","sniff"]},
      {id:"interior-dog-center", x:54, y:86, support:"ground", behaviors:["sit","scratch"]},
      {id:"interior-dog-alcove", x:72, y:80, support:"ground", behaviors:["stand","sniff"]},
      {id:"interior-dog-lane", x:50, y:74, support:"ground", behaviors:["stand","sit"]}
    ]
  };

  var SPRITES = {
    walk:{path:"assets/home/pet/shiba-walk-v1.png", columns:4, rows:1, frames:4, frameMs:180},
    stand:{path:"assets/home/pet/shiba-stand-v1.png", columns:4, rows:1, frames:4, frameMs:620},
    sit:{path:"assets/home/pet/shiba-sit-v1.png", columns:4, rows:1, frames:4, frameMs:700},
    sniff:{path:"assets/home/pet/shiba-sniff-v1.png", columns:4, rows:1, frames:4, frameMs:420, loop:false},
    scratch:{path:"assets/home/pet/shiba-scratch-v1.png", columns:4, rows:1, frames:4, frameMs:260, loop:false}
  };

  var SCENE_SCALE = {
    yard:{farY:58, nearY:94, farWidth:4.5, nearWidth:6.5},
    interior:{farY:70, nearY:88, farWidth:8.0, nearWidth:12.0}
  };

  function copy(value){ return JSON.parse(JSON.stringify(value)); }
  function rows(scene, options){
    var result = (SCENES[scene] || []).slice();
    var extras = options && Array.isArray(options.extraAnchors) ? options.extraAnchors : [];
    extras.forEach(function(anchor){
      if(!anchor || !anchor.id || result.some(function(row){ return row.id === anchor.id; })) return;
      if(anchor.support === "ground") result.push(anchor);
    });
    return result;
  }
  function anchors(scene, options){ return rows(scene, options).map(copy); }
  function find(scene, id, options){
    return rows(scene, options).filter(function(anchor){ return anchor.id === id; })[0] || null;
  }
  function pointIsClear(point, blockers){
    return !(blockers || []).some(function(blocker){
      var rx = Math.max(.1, Number(blocker.rx) || 0);
      var ry = Math.max(.1, Number(blocker.ry) || 0);
      var dx = (Number(point.x) - Number(blocker.x)) / rx;
      var dy = (Number(point.y) - Number(blocker.y)) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }
  function routeIsClear(from, to, blockers){
    return (blockers || []).every(function(blocker){
      var rx = Math.max(.1, Number(blocker.rx) || 0);
      var ry = Math.max(.1, Number(blocker.ry) || 0);
      var ax = (from.x - blocker.x) / rx, ay = (from.y - blocker.y) / ry;
      var bx = (to.x - blocker.x) / rx, by = (to.y - blocker.y) / ry;
      var dx = bx - ax, dy = by - ay, length2 = dx * dx + dy * dy;
      var t = length2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length2)) : 0;
      var px = ax + dx * t, py = ay + dy * t;
      return px * px + py * py > 1;
    });
  }
  function nextAnchor(state, blockers, options){
    var list = rows(state && state.scene, options);
    var index = list.findIndex(function(anchor){ return anchor.id === state.anchorId; });
    for(var offset = 1; offset < list.length; offset += 1){
      var candidate = list[(index + offset + list.length) % list.length];
      if(pointIsClear(candidate, blockers) && routeIsClear(state, candidate, blockers)) return copy(candidate);
    }
    return null;
  }
  function safeAnchor(state, blockers, options){
    var list = rows(state.scene, options).filter(function(anchor){ return pointIsClear(anchor, blockers); });
    list.sort(function(a,b){ return Math.hypot(a.x-state.x,a.y-state.y) - Math.hypot(b.x-state.x,b.y-state.y); });
    return list.length ? copy(list[0]) : null;
  }
  function widthAt(y, scene){
    var scale = SCENE_SCALE[scene] || SCENE_SCALE.yard;
    var depth = Math.max(0, Math.min(1, (Number(y)-scale.farY)/(scale.nearY-scale.farY)));
    return +(scale.farWidth + (scale.nearWidth-scale.farWidth)*depth).toFixed(2);
  }
  function create(scene, seed, options){
    if(!SCENES[scene]) return null;
    var list = rows(scene, options), normalized = Math.abs(Number(seed) || 1) >>> 0;
    var anchor = list[normalized % list.length];
    return {scene:scene, anchorId:anchor.id, targetId:null, x:anchor.x, y:anchor.y,
      facing:1, behavior:anchor.behaviors[normalized % anchor.behaviors.length], frame:0, clock:0, seed:normalized};
  }
  function sendTo(state, anchorId, options){
    var next = copy(state), target = find(next.scene, anchorId, options);
    if(!target) return next;
    next.targetId = target.id; next.anchorId = null; next.facing = target.x < next.x ? -1 : 1;
    next.behavior = "walk"; next.frame = 0; next.walked = 0;
    return next;
  }
  function settleAt(state, anchorId, options){
    var next = copy(state), target = find(next.scene, anchorId, options);
    if(!target) return next;
    next.anchorId = target.id; next.targetId = null; next.x = target.x; next.y = target.y;
    next.behavior = target.behaviors[next.seed % target.behaviors.length]; next.frame = 0; next.clock = 0;
    return next;
  }
  function step(state, elapsedMs, options){
    if(!state) return null;
    var settings = options || {};
    if(settings.paused) return copy(state);
    if(settings.reducedMotion){
      var still = settleAt(state, state.targetId || state.anchorId, settings);
      if(still) still.behavior = "stand";
      return still;
    }
    var next = copy(state), elapsed = Math.max(0, Number(elapsedMs) || 0);
    next.clock += elapsed;
    if(!next.targetId){
      var resting = SPRITES[next.behavior] || SPRITES.stand;
      var raw = Math.floor(next.clock / resting.frameMs);
      next.frame = resting.loop === false ? Math.min(resting.frames-1, raw) : raw % resting.frames;
      return next;
    }
    var target = find(next.scene, next.targetId, settings);
    if(!target) return next;
    var dx = target.x-next.x, dy = target.y-next.y, distance = Math.hypot(dx,dy);
    var travel = elapsed * (0.0028 + Math.min(1, distance/12)*0.0012);
    if(distance <= travel || !distance) return settleAt(next, target.id, settings);
    next.x += dx/distance*travel; next.y += dy/distance*travel; next.behavior = "walk";
    next.walked = (next.walked || 0) + travel;
    next.frame = Math.floor(next.walked / Math.max(0.5, widthAt(next.y,next.scene)*0.13)) % SPRITES.walk.frames;
    return next;
  }
  function spriteFor(state){
    var sprite = SPRITES[state && state.behavior] || SPRITES.stand;
    return {path:sprite.path, columns:sprite.columns, rows:sprite.rows,
      frame:Math.max(0, Number(state && state.frame) || 0) % sprite.frames};
  }
  function dwellMs(state){
    var behavior = state && state.behavior || "stand", seed = Math.abs(Number(state && state.seed) || 1) >>> 0;
    if(behavior === "scratch") return 3500 + seed % 1801;
    if(behavior === "sniff") return 4000 + seed % 2201;
    if(behavior === "sit") return 7000 + seed % 3501;
    return 6000 + seed % 3501;
  }
  root.LanternHomeDog = {anchors:anchors,nextAnchor:nextAnchor,pointIsClear:pointIsClear,
    routeIsClear:routeIsClear,safeAnchor:safeAnchor,widthAt:widthAt,behaviors:function(){ return Object.keys(SPRITES); },
    create:create,sendTo:sendTo,settleAt:settleAt,step:step,dwellMs:dwellMs,spriteFor:spriteFor};
})(typeof self !== "undefined" ? self : this);
