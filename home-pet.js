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
      {id:"yard-shade", x:17, y:72, kind:"shade", behaviors:["curl-sleep","loaf"]},
      {id:"yard-rock", x:38, y:75, kind:"rock", behaviors:["sit","groom"]},
      {id:"yard-path", x:55, y:80, kind:"path", behaviors:["sit","loaf"]},
      {id:"yard-veranda", x:76, y:64, kind:"veranda", behaviors:["curl-sleep","loaf","groom"]}
    ],
    interior: [
      {id:"interior-door", x:50, y:74, kind:"door", behaviors:["sit"]},
      {id:"interior-cushion", x:34, y:81, kind:"furniture", behaviors:["curl-sleep","loaf"]},
      {id:"interior-window", x:22, y:78, kind:"window", behaviors:["curl-sleep","sit","groom"]},
      {id:"interior-center", x:55, y:83, kind:"tatami", behaviors:["loaf","groom"]},
      {id:"interior-alcove", x:73, y:79, kind:"alcove", behaviors:["sit"]}
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
    walk: {path:"assets/home/pet/calico-walk-v1.webp", columns:8, rows:1, frames:8},
    sit: {path:"assets/home/pet/calico-transitions-v1.webp", columns:4, rows:3, frames:4, offset:0},
    stand: {path:"assets/home/pet/calico-transitions-v1.webp", columns:4, rows:3, frames:4, offset:4},
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
  var PET_MIN_WIDTH = 9.5;
  var PET_MAX_WIDTH = 12.8;
  var PET_NEAR_Y = 86;
  var PET_FAR_Y = 58;

  /* A stride is a fraction of the cat, so a bigger cat covers more ground per
   * step and the gait stays the same whatever size it is drawn.
   *
   * 0.18 of a body length per step made the legs churn: the cat was taking
   * about 1.6 steps a second while covering only a quarter of its own length in
   * that time, so the cycle ran ahead of the ground even though it was driven
   * by the ground. A walking cat advances roughly a third of its length per
   * step, which is the number here. */
  function strideFor(y){ return widthAt(y) * 0.30; }

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
    var travel = elapsed * (0.0016 + 0.0038 * approach);
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
    next.frame = Math.floor(next.walked / strideFor(next.y)) % 8;
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

  /* Real cats rest for long periods, but literal hours would look broken in a
   * game. These compressed pauses preserve the rhythm without stalling play. */
  function dwellMs(state){
    var behavior = state && state.behavior || "loaf";
    var seed = Math.abs(Number(state && state.seed) || 1) >>> 0;
    if(behavior === "curl-sleep" || behavior === "side-sleep") return 18000 + seed % 18000;
    if(behavior === "loaf" || behavior === "sit") return 10000 + seed % 12000;
    if(behavior === "groom") return 8000 + seed % 8000;
    return 5000 + seed % 6000;
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
    widthAt:widthAt,
    behaviors:function(){ return Object.keys(SPRITES); },
    create:create,
    sendTo:sendTo,
    step:step,
    crossDoor:crossDoor,
    enterScene:enterScene,
    dwellMs:dwellMs,
    spriteFor:spriteFor
  };
})(typeof self !== "undefined" ? self : this);
