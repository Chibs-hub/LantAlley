(function(root){
  "use strict";

  /* Plant spots are derived from the same rendered measurements the yard uses.
   * The renderer passes the slot position, visual width, ground pivot and
   * stage, so these anchors cannot drift away from a plant when perspective or
   * a small per-tree variation changes. */
  var CANOPY_LIFT = {sapling:0.54, young:0.68, mature:0.72};

  function copy(value){ return JSON.parse(JSON.stringify(value)); }
  function round(value){ return +Number(value).toFixed(2); }
  function clamp(value, min, max){ return Math.max(min, Math.min(max, value)); }

  function inwardSide(item){
    var x = Number(item && item.x);
    if(x < 49.5) return 1;
    if(x > 50.5) return -1;
    var text = String(item && item.id || "plant");
    var hash = 0;
    for(var i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return hash % 2 ? 1 : -1;
  }

  function baseBehaviors(species){
    if(species === "bird") return ["peck", "perch"];
    if(species === "shiba") return ["stand", "sit", "sniff"];
    return ["loaf", "sit", "groom", "sniff"];
  }

  function baseSpot(item, species){
    var width = Number(item.width);
    var side = inwardSide(item);
    /* Cats take the sheltered shoulder toward the house. A bird at the
     * same tree uses the outer shoulder, leaving room for both sprites while
     * keeping its feet on the same gravel line. */
    if(species === "bird") side *= -1;
    /* The plant blocker ends at roughly 45% of its width. A further two
     * percent gives the pet a visible shoulder of gravel without sending it
     * so far away that it no longer reads as resting beside the plant. */
    var offset = Math.max(3, Math.min(11, width * 0.52 + 1.8));
    var yOffset = Math.max(1.8, Math.min(4.8, width * 0.08));
    return {
      id:item.id + "-base-" + species,
      x:round(clamp(Number(item.x) + side * offset, 2.5, 97.5)),
      y:round(clamp(Number(item.y) + yOffset, 0, 99)),
      z:20 + Math.round(Number(item.y) + yOffset),
      kind:"plant-base", support:"ground", plantId:item.id,
      behaviors:baseBehaviors(species)
    };
  }

  function canopySpot(item){
    var lift = CANOPY_LIFT[item.stage];
    if(item.kind !== "tree" || !lift) return null;
    var width = Number(item.width);
    var side = inwardSide(item);
    var lean = Math.sin((Number(item.tilt) || 0) * Math.PI / 180) * width * lift * 0.42;
    var branch = side * width * 0.11;
    return {
      id:item.id + "-canopy-bird",
      x:round(clamp(Number(item.x) + lean + branch, 2.5, 97.5)),
      y:round(clamp(Number(item.y) - width * lift, 8, 96)),
      /* The tree's depth is its slot, while the bird's feet are higher in the
       * same tree. Raise only the layer so foliage does not hide the perched
       * bird; its size still follows the canopy's actual y position. */
      z:25 + Math.round(Number(item.y)),
      kind:"plant-canopy", support:"tree", plantId:item.id,
      behaviors:["perch", "preen", "sing"]
    };
  }

  function fromPlants(items, species){
    if(species !== "bird" && species !== "cat" && species !== "shiba") return [];
    var out = [];
    (items || []).forEach(function(item){
      if(!item || !item.id || item.slotId == null) return;
      var width = Number(item.width);
      var x = Number(item.x), y = Number(item.y);
      if(!isFinite(width) || width <= 0 || !isFinite(x) || !isFinite(y)) return;
      out.push(baseSpot(item, species));
      if(species === "bird"){
        var canopy = canopySpot(item);
        if(canopy) out.push(canopy);
      }
    });
    return out.map(copy);
  }

  root.LanternHomePetSpots = Object.freeze({fromPlants:fromPlants});
})(typeof self !== "undefined" ? self : this);
