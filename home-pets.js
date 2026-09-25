/* Home pet catalogue and ownership rules.
 *
 * The animation modules decide how each companion moves. This module only
 * owns shop facts and immutable purchase/grant operations so a repeated tap
 * can never charge twice.
 */
(function(root){
  "use strict";

  var PETS = [
    {id:"cat", name:"Calico cat", price:1200,
      preview:"assets/home/pet/calico-sit-v1.png"},
    {id:"bird", name:"Bush warbler", price:700,
      preview:"assets/home/pet/uguisu-perch-v1.png"},
    {id:"shiba", name:"Shiba Inu", price:1200,
      preview:"assets/home/pet/shiba-stand-v1.png"}
  ];

  function copy(value){
    return JSON.parse(JSON.stringify(value));
  }

  function get(id){
    var pet = PETS.filter(function(item){ return item.id === id; })[0];
    return pet ? copy(pet) : null;
  }

  function normalizeOwned(value){
    return (Array.isArray(value) ? value : []).filter(function(id){
      return !!get(id);
    });
  }

  function owns(ownedPets, id){
    return normalizeOwned(ownedPets).indexOf(id) >= 0;
  }

  function speciesOf(iid){ return String(iid).replace(/-[^-]+$/, ""); }

  function normalizeActivePets(ownedPets, activePets){
    var remaining = {};
    normalizeOwned(ownedPets).forEach(function(species){
      remaining[species] = (remaining[species] || 0) + 1;
    });
    var seen = {}, result = [];
    (Array.isArray(activePets) ? activePets : []).forEach(function(iid){
      if(typeof iid !== "string" || seen[iid]) return;
      var species = speciesOf(iid);
      if(!remaining[species]) return;
      seen[iid] = true;
      remaining[species]--;
      result.push(iid);
    });
    return result;
  }

  function tryActivate(ownedPets, activePets, iid, fits){
    var normalized = normalizeActivePets(ownedPets,activePets);
    var proposed = normalizeActivePets(ownedPets,normalized.concat([iid]));
    if(proposed.length !== normalized.length + 1)
      return {ok:false,reason:"owned",activePets:normalized};
    if(typeof fits === "function" && !fits(proposed))
      return {ok:false,reason:"full",activePets:normalized};
    return {ok:true,reason:null,activePets:proposed};
  }

  function unchanged(ownedPets, money, reason){
    return {
      ok:false,
      reason:reason,
      ownedPets:normalizeOwned(ownedPets),
      money:Math.max(0, Number(money) || 0)
    };
  }

  function buy(ownedPets, money, id){
    var pet = get(id);
    var wallet = Math.max(0, Number(money) || 0);
    if(!pet) return unchanged(ownedPets, wallet, "missing");
    if(wallet < pet.price) return unchanged(ownedPets, wallet, "poor");
    var next = normalizeOwned(ownedPets);
    next.push(id);
    return {ok:true, reason:null, ownedPets:next, money:wallet - pet.price};
  }

  function grant(ownedPets, id){
    if(!get(id)) return {ok:false, reason:"missing", ownedPets:normalizeOwned(ownedPets)};
    if(owns(ownedPets, id)) return {ok:false, reason:"owned", ownedPets:normalizeOwned(ownedPets)};
    var next = normalizeOwned(ownedPets);
    next.push(id);
    return {ok:true, reason:null, ownedPets:next};
  }

  root.LanternHomePets = Object.freeze({
    catalogue:function(){ return copy(PETS); },
    get:get,
    normalizeOwned:normalizeOwned,
    normalizeActivePets:normalizeActivePets,
    tryActivate:tryActivate,
    owns:owns,
    buy:buy,
    grant:grant
  });
})(typeof self !== "undefined" ? self : this);
