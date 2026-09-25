(function(root){
  "use strict";

  function box(anchor, width, species){
    var height = width * 16 / 9;
    var foot = species === "bird" ? .906 : .86;
    return {left:anchor.x-width*.5, right:anchor.x+width*.5,
      top:anchor.y-height*foot, bottom:anchor.y+height*(1-foot)};
  }

  function overlaps(a,b){
    return a.left < b.right && a.right > b.left &&
      a.top < b.bottom && a.bottom > b.top;
  }

  function solve(scene, pets, APIs, blockers, options){
    var ordered = (pets || []).map(function(pet, index){
      var api = APIs[pet.species], settings = options && options[pet.species] || {};
      var rows = api && api.anchors ? api.anchors(scene,settings) : [];
      var candidates = rows.filter(function(anchor){
        if(!anchor || !isFinite(anchor.x) || !isFinite(anchor.y)) return false;
        if(api.pointIsClear && !api.pointIsClear(anchor,blockers)) return false;
        var width = api.widthAt(anchor.y,scene);
        var bounds = box(anchor,width,pet.species);
        return bounds.left >= 0 && bounds.right <= 100 &&
          bounds.top >= 0 && bounds.bottom <= 100;
      });
      var shift = candidates.length ? (Math.abs(Number(pet.seed) || 0) % candidates.length) : 0;
      return {pet:pet, index:index, api:api,
        candidates:candidates.slice(shift).concat(candidates.slice(0,shift)),
        area:api && api.widthAt ? api.widthAt(85,scene) : 0};
    });
    ordered.sort(function(a,b){
      return a.candidates.length-b.candidates.length || b.area-a.area || a.index-b.index;
    });
    var placed = [], result = {};
    function search(index){
      if(index === ordered.length) return true;
      var entry = ordered[index];
      for(var i=0;i<entry.candidates.length;i++){
        var anchor = entry.candidates[i];
        var footprint = box(anchor,entry.api.widthAt(anchor.y,scene),entry.pet.species);
        if(placed.some(function(other){ return overlaps(footprint,other); })) continue;
        placed.push(footprint);
        result[entry.pet.iid] = anchor;
        if(search(index+1)) return true;
        placed.pop();
        delete result[entry.pet.iid];
      }
      return false;
    }
    if(search(0)) return {ok:true,anchors:result};
    return {ok:false,anchors:{}};
  }

  function assign(scene, pets, APIs, blockers, options){
    var found = solve(scene,pets,APIs,blockers,options);
    if(found.ok) return found;
    // Prefix capacity is the user-visible admission order, independent of
    // internal search order used to find a complete arrangement.
    for(var length=1;length<=pets.length;length++){
      if(!solve(scene,pets.slice(0,length),APIs,blockers,options).ok)
        return {ok:false,anchors:{},unassignedIid:pets[length-1].iid};
    }
    return {ok:false,anchors:{},unassignedIid:pets[pets.length-1].iid};
  }

  function fitsBoth(pets,APIs,sceneInputs){
    var assignments = {};
    for(var i=0;i<2;i++){
      var scene = i ? "interior" : "yard";
      var input = sceneInputs[scene] || {};
      assignments[scene] = assign(scene,pets,APIs,input.blockers || [],input.options || {});
      if(!assignments[scene].ok) return {ok:false,assignments:assignments,
        unassignedIid:assignments[scene].unassignedIid};
    }
    return {ok:true,assignments:assignments};
  }

  function transform(x,y,width,species){
    var horizontal = Number(x) || 0;
    var vertical = (Number(y) || 0) * 9 / 16;
    var scale = (Number(width) || 7.5) / 7.5;
    return "translate3d(" + horizontal + "cqw," + vertical + "cqw,0) scale(" + scale +
      ") translate(-50%,-" + (species === "bird" ? "90.6" : "86") + "%)";
  }

  root.LanternHomePetLayout = Object.freeze({assign:assign,fitsBoth:fitsBoth,
    transform:transform,box:box,overlaps:overlaps});
})(typeof self !== "undefined" ? self : this);
