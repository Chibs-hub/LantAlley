(function(root){
  "use strict";

  /* Every anchor stands on ground the cat could actually stand on.
   *
   * Sampled from the two backgrounds: the yard's gravel begins at about y=55
   * and the room's tatami at about y=70; above those lines are the house and
   * the shoji. `yard-door` was at y=45 and `interior-door` at y=65, which put
   * the cat inside the building and against the paper screen - and because a
   * journey is a straight line between anchors, it then walked across the wall
   * to get anywhere. Nothing sits above its scene's floor line now, so no path
   * between two anchors can leave the ground. */
  var SCENES = {
    yard: [
      {id:"yard-door", x:50, y:59, kind:"door", behaviors:["sit"]},
      {id:"yard-shade", x:17, y:72, kind:"shade", behaviors:["side-sleep","curl-sleep","loaf"]},
      {id:"yard-rock", x:38, y:75, kind:"rock", behaviors:["sit","groom","sniff","look"]},
      {id:"yard-path", x:55, y:80, kind:"path", behaviors:["sniff","play","look"]},
      {id:"yard-veranda", x:76, y:64, kind:"veranda", behaviors:["stretch","curl-sleep","loaf","groom"]},
      /* No garden slot touches the centre path. These quiet fallback stops
       * keep the cat mobile when the learner fills every bed. */
      {id:"yard-lane-back", x:50, y:68, kind:"path", behaviors:["look","sniff"]},
      {id:"yard-lane-mid", x:50, y:76, kind:"path", behaviors:["sniff","groom"]},
      {id:"yard-lane-front", x:50, y:87, kind:"path", behaviors:["look","stretch"]}
    ],
    interior: [
      {id:"interior-door", x:50, y:74, kind:"door", behaviors:["sit"]},
      {id:"interior-cushion", x:34, y:81, kind:"furniture", behaviors:["side-sleep","curl-sleep","loaf"]},
      {id:"interior-window", x:22, y:78, kind:"window", behaviors:["look","curl-sleep","sit","groom"]},
      {id:"interior-center", x:55, y:83, kind:"tatami", behaviors:["loaf","groom","stretch","play"]},
      {id:"interior-alcove", x:73, y:79, kind:"alcove", behaviors:["sit","look","sniff"]},
      /* The back tatami strip is not a decor target, so it remains traversable
       * even when all five floor positions are occupied. */
      {id:"interior-lane-left", x:40, y:72, kind:"tatami", behaviors:["look","sit"]},
      {id:"interior-lane-right", x:60, y:72, kind:"tatami", behaviors:["look","groom"]}
    ]
  };

  /* `enter` is deliberately absent.
   *
   * It was the scene-entry animation, and its four frames are drawn 79%, 69%,
   * 51% and 53% of the cell wide - the cat shrank by half and grew back every
   * time the player walked between the yard and the room. No repack can correct
   * that, because it is one pose drawn at four different scales, and which of
   * them is the "true" size is not recoverable from the picture. Every other
   * row holds its width to within a few percent, so entry now uses the standing
   * row, which is the steadiest of them at 1%. */
  var SPRITES = {
    walk: {path:"assets/home/pet/calico-walk-v3.png", columns:4, rows:1, frames:4},
    sit: {path:"assets/home/pet/calico-sit-v1.png", columns:4, rows:1, frames:4, loop:false, frameMs:280},
    loaf: {path:"assets/home/pet/calico-loaf-v2.png", columns:4, rows:1, frames:4, frameMs:550},
    "curl-sleep": {path:"assets/home/pet/calico-curl-sleep-v2.png", columns:4, rows:1, frames:4, frameMs:700},
    "side-sleep": {path:"assets/home/pet/calico-side-sleep-v1.png", columns:4, rows:1, frames:4, frameMs:700},
    groom: {path:"assets/home/pet/calico-groom-v2.png", columns:4, rows:1, frames:4, frameMs:600},
    sniff: {path:"assets/home/pet/calico-sniff-v2.png", columns:4, rows:1, frames:4, frameMs:350},
    stretch: {path:"assets/home/pet/calico-stretch-v1.png", columns:4, rows:1, frames:4, loop:false, frameMs:280},
    look: {path:"assets/home/pet/calico-look-v1.png", columns:4, rows:1, frames:4, frameMs:500},
    play: {path:"assets/home/pet/calico-play-v1.png", columns:4, rows:1, frames:4, frameMs:350}
  };

  function copy(value){ return JSON.parse(JSON.stringify(value)); }
  function sceneAnchors(scene){ return (SCENES[scene] || []).map(copy); }

  /* Follow the authored scene clockwise instead of teleporting between random
   * points. Each stop has a real cat reason: shade, rock, path, veranda, door. */
  function pointIsClear(point, blockers){
    return !(blockers || []).some(function(blocker){
      var rx = Math.max(.1, Number(blocker.rx) || 0);
      var ry = Math.max(.1, Number(blocker.ry) || 0);
      var dx = (Number(point.x) - Number(blocker.x)) / rx;
      var dy = (Number(point.y) - Number(blocker.y)) / ry;
      return dx * dx + dy * dy <= 1;
    });
  }

  /* Test the cat's ground path, not its square sprite box. In each obstacle's
   * normalized ellipse, a blocked route is simply a line segment that comes
   * within one radius of the origin. */
  function routeIsClear(from, to, blockers){
    return (blockers || []).every(function(blocker){
      var rx = Math.max(.1, Number(blocker.rx) || 0);
      var ry = Math.max(.1, Number(blocker.ry) || 0);
      var ax = (Number(from.x) - Number(blocker.x)) / rx;
      var ay = (Number(from.y) - Number(blocker.y)) / ry;
      var bx = (Number(to.x) - Number(blocker.x)) / rx;
      var by = (Number(to.y) - Number(blocker.y)) / ry;
      var dx = bx - ax;
      var dy = by - ay;
      var length2 = dx * dx + dy * dy;
      var t = length2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length2)) : 0;
      var px = ax + dx * t;
      var py = ay + dy * t;
      return px * px + py * py > 1;
    });
  }

  function nextAnchor(state, blockers){
    var anchors = SCENES[state && state.scene] || [];
    if(anchors.length < 2) return null;
    var index = anchors.findIndex(function(anchor){ return anchor.id === state.anchorId; });
    for(var offset = 1; offset < anchors.length; offset++){
      var candidate = anchors[(index + offset + anchors.length) % anchors.length];
      if(pointIsClear(candidate, blockers) && routeIsClear(state, candidate, blockers)) return copy(candidate);
    }
    return null;
  }

  function safeAnchor(state, blockers){
    var anchors = (SCENES[state && state.scene] || []).filter(function(anchor){
      return pointIsClear(anchor, blockers);
    });
    if(!anchors.length) return null;
    anchors.sort(function(a, b){
      return Math.hypot(a.x - state.x, a.y - state.y) - Math.hypot(b.x - state.x, b.y - state.y);
    });
    return copy(anchors[0]);
  }

  /* How big the cat is where it is standing.
   *
   * Both scenes are painted in perspective and the cat was a flat 13% of the
   * scene everywhere, which made it a giant at the back wall and left it
   * ignoring the depth every other object respects. Anchors run from y=45 at
   * the back to y=88 at the front; this maps that onto the approved 6-9% band
   * and clamps, so a position outside the authored range cannot produce an
   * absurd size. */
  /* Sized against what is already in the room rather than by eye.
   *
   * A floor cushion is 18% of the scene at the front slot and a low table 28%.
   * A cat is about two thirds of a cushion, which puts it near 12% down there -
   * and 13% flat was the size that read as a giant at the back wall, so the
   * depth is what was missing rather than the number. It has been too big and
   * then too small; this is the width the objects around it imply.
   *
   * The floor line is at y=59 in the yard and y=74 in the room, and the
   * interface covers the scene below about y=87, so the useful band is the
   * ground between them. */
  /* Calibrated against the painted doors and tatami grid in the live scene.
   * The previous 9.5-12.8% range made the cat nearly doorway-wide. The sprite
   * itself occupies about four fifths of its cell, so 6.8-9% keeps a readable
   * long-haired silhouette without overpowering the architecture. */
  var PET_MIN_WIDTH = 6.8;
  var PET_MAX_WIDTH = 9;
  var PET_NEAR_Y = 86;
  var PET_FAR_Y = 58;

  /* A stride is a fraction of the cat, so a bigger cat covers more ground per
   * step and the gait stays the same whatever size it is drawn.
   *
   * 0.18 of a body length per step made the legs churn: the cat was taking
   * about 1.6 steps a second while covering only a quarter of its own length in
   * that time, so the cycle ran ahead of the ground even though it was driven
   * by the ground. The production cycle now has four key poses rather than
   * eight drawings, so each key covers half the old distance. A complete
   * four-key cycle still advances about 0.6 body lengths. */
  function strideFor(y){ return widthAt(y) * 0.15; }

  function widthAt(y){
    var depth = (Number(y) - PET_FAR_Y) / (PET_NEAR_Y - PET_FAR_Y);
    depth = Math.max(0, Math.min(1, depth));
    return +(PET_MIN_WIDTH + (PET_MAX_WIDTH - PET_MIN_WIDTH) * depth).toFixed(2);
  }
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
      var rawFrame = Math.floor(next.clock / (sprite.frameMs || 220));
      next.frame = sprite.loop === false
        ? Math.min(Math.max(0, sprite.frames - 1), rawFrame)
        : rawFrame % Math.max(1, sprite.frames);
      return next;
    }
    var target = find(next.scene, next.targetId);
    if(!target){ next.targetId = null; return next; }
    var dx = target.x - next.x;
    var dy = target.y - next.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    /* Slower, and slowing further as it arrives.
      *
      * A flat 0.012 scene-percent per millisecond crossed the yard in about
      * three seconds and stopped dead on the spot, which is what read as jumpy.
      * Speed now falls away over the last stretch, so the cat settles onto an
      * anchor instead of hitting it. No extra state: the distance left is the
      * only input. */
    /* Paced in body lengths, not in scene-percent.
     *
     * The earlier speeds were picked against a much smaller cat, so when it was
     * resized to match the furniture the same numbers became a crawl: it took
     * 22 seconds to cross the yard, a quarter of a body length per second, and
     * the legs cycled below one step per second to stay honest with it. A cat
     * ambling covers around a body length a second; this is deliberately under
     * half that, which is a slow stroll rather than the dash that was too fast
     * before. */
    var approach = Math.min(1, distance / 14);
    /* Never let the gait run while travel becomes visually stationary. At the
     * nearest approach this is about half a body length per second; distance-
     * linked frames still slow with it, and arrival ends the walk immediately. */
    var travel = elapsed * (0.0034 + 0.002 * approach);
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
    /* The stride follows the ground, not a clock.
     *
     * Frames advanced on elapsed time, so the legs cycled at a fixed rate while
     * the body moved at a variable one - and since the approach slows near an
     * anchor, the feet kept stepping while the cat barely moved. That mismatch
     * is what reads as sliding. Tying the frame to distance covered means one
     * stride is always the same distance travelled, at any speed. */
    next.walked = (next.walked || 0) + travel;
    next.frame = Math.floor(next.walked / strideFor(next.y)) % SPRITES.walk.frames;
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
    next.behavior = "sit";
    next.frame = 0;
    return next;
  }

  /* Rest long enough to feel calm while the sprite breathes, but never long
   * enough to look abandoned. */
  function dwellMs(state){
    var behavior = state && state.behavior || "loaf";
    var seed = Math.abs(Number(state && state.seed) || 1) >>> 0;
    if(behavior === "curl-sleep" || behavior === "side-sleep") return 10000 + seed % 5001;
    if(behavior === "loaf" || behavior === "sit") return 8000 + seed % 4001;
    if(behavior === "groom") return 6000 + seed % 4001;
    return 5000 + seed % 3001;
  }

  function enterScene(scene, seed){
    if(!SCENES[scene]) return null;
    var previous = scene === "yard" ? "interior" : "yard";
    var door = SCENES[previous].filter(function(row){ return row.kind === "door"; })[0];
    var state = {scene:previous, anchorId:door.id, targetId:null, x:door.x, y:door.y,
      facing:scene === "yard" ? 1 : -1, behavior:"look", frame:0, clock:0,
      seed:Math.abs(Number(seed) || 1) >>> 0};
    return crossDoor(state);
  }

  function spriteFor(state){
    var row = SPRITES[state && state.behavior] || SPRITES.loaf;
    var frames = Math.max(1, row.frames || 1);
    return {path:row.path, columns:row.columns, rows:row.rows,
      frame:(row.offset || 0) + (Math.max(0, Number(state && state.frame) || 0) % frames)};
  }

  root.LanternHomePet = {
    anchors:sceneAnchors,
    nextAnchor:nextAnchor,
    pointIsClear:pointIsClear,
    routeIsClear:routeIsClear,
    safeAnchor:safeAnchor,
    widthAt:widthAt,
    behaviors:function(){ return Object.keys(SPRITES); },
    create:create,
    sendTo:sendTo,
    settleAt:settleAt,
    step:step,
    crossDoor:crossDoor,
    enterScene:enterScene,
    dwellMs:dwellMs,
    spriteFor:spriteFor
  };
})(typeof self !== "undefined" ? self : this);
