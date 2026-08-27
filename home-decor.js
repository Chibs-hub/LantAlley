/* What the coins are for.
 *
 * Money had no sink at all until now: it counted upward and bought nothing.
 * This is the first thing a learner can turn a session into.
 *
 * Two rules from the design carry real weight, and both are here rather than
 * in the UI so they can be tested:
 *
 *   An item exists in one slot at a time. Moving it empties the slot it came
 *   from. Wanting the same lamp in two corners means buying two lamps - which
 *   keeps the shop meaningful instead of turning one purchase into wallpaper.
 *
 *   A slot holds one item. Placing into an occupied slot swaps, and the
 *   displaced item returns to storage rather than vanishing.
 *
 * Everything is drawn, not photographed. A furniture catalogue of pictures
 * would cost megabytes; these cost a few hundred bytes each and can be
 * recoloured from data.
 */
(function(root){
  "use strict";

  // Prices come from the costed model: about a day and a half of practice for
  // the cheapest, a fortnight for the dearest.
  var ITEMS = [
    // --- floor -----------------------------------------------------------
    {id:"rug-plain", name:"敷物", kind:"floor", price:50, category:"床",
     svg:'<ellipse cx="0" cy="0" rx="62" ry="22" fill="#8a4b3c" stroke="#5d2f24" stroke-width="3"/>'
       + '<ellipse cx="0" cy="0" rx="44" ry="13" fill="none" stroke="#d8a97a" stroke-width="2"/>'},
    {id:"plant-small", name:"鉢植え", kind:"floor", price:80, category:"床",
     svg:'<rect x="-14" y="-4" width="28" height="24" rx="4" fill="#9c6b4a" stroke="#6b4530" stroke-width="3"/>'
       + '<path d="M0 -4 C -18 -20 -12 -40 0 -34 C 12 -40 18 -20 0 -4 Z" fill="#4f7d4a"/>'
       + '<path d="M0 -6 L0 -30" stroke="#2f5a2c" stroke-width="3"/>'},
    {id:"low-table", name:"座卓", kind:"floor", price:200, category:"床",
     svg:'<rect x="-46" y="-16" width="92" height="12" rx="4" fill="#7d5230" stroke="#573719" stroke-width="3"/>'
       + '<rect x="-38" y="-4" width="8" height="22" fill="#573719"/>'
       + '<rect x="30" y="-4" width="8" height="22" fill="#573719"/>'},
    {id:"brazier", name:"火鉢", kind:"floor", price:400, category:"床",
     svg:'<ellipse cx="0" cy="10" rx="30" ry="10" fill="#4a3524"/>'
       + '<path d="M-30 10 L-24 -14 L24 -14 L30 10 Z" fill="#6b5340" stroke="#3f3021" stroke-width="3"/>'
       + '<ellipse cx="0" cy="-14" rx="24" ry="8" fill="#2b1c11"/>'
       + '<path d="M-8 -18 q6 -12 8 -4 q4 -10 8 2" stroke="#ffb454" stroke-width="3" fill="none"/>'},

    // --- wall ------------------------------------------------------------
    {id:"scroll", name:"掛け軸", kind:"wall", price:120, category:"壁",
     svg:'<rect x="-20" y="-46" width="40" height="92" fill="#e8dabd" stroke="#a98f68" stroke-width="2"/>'
       + '<rect x="-24" y="-50" width="48" height="8" rx="3" fill="#6b4530"/>'
       + '<rect x="-24" y="42" width="48" height="8" rx="3" fill="#6b4530"/>'
       + '<path d="M-6 -26 L6 -26 M0 -26 L0 6 M-8 6 L8 18" stroke="#3a2a1a" stroke-width="3" fill="none"/>'},
    {id:"wall-lamp", name:"掛け行灯", kind:"wall", price:220, category:"壁",
     svg:'<circle cx="0" cy="0" r="46" fill="#ffd489" opacity="0.18"/>'
       + '<rect x="-18" y="-22" width="36" height="44" rx="8" fill="#f3c568" stroke="#9c6b2f" stroke-width="3"/>'
       + '<line x1="-18" y1="-6" x2="18" y2="-6" stroke="#9c6b2f" stroke-width="2"/>'
       + '<line x1="-18" y1="8" x2="18" y2="8" stroke="#9c6b2f" stroke-width="2"/>'},
    {id:"fan", name:"扇", kind:"wall", price:90, category:"壁",
     svg:'<path d="M0 26 L-40 -18 A54 54 0 0 1 40 -18 Z" fill="#e8dabd" stroke="#a98f68" stroke-width="3"/>'
       + '<path d="M0 26 L0 -30 M0 26 L-22 -14 M0 26 L22 -14" stroke="#a98f68" stroke-width="2"/>'
       + '<circle cx="0" cy="26" r="4" fill="#6b4530"/>'},
    {id:"mask", name:"面", kind:"wall", price:400, category:"壁",
     svg:'<ellipse cx="0" cy="0" rx="26" ry="34" fill="#f0e4cd" stroke="#8a6a45" stroke-width="3"/>'
       + '<path d="M-12 -8 q6 -6 12 0 M0 -8 q6 -6 12 0" stroke="#7a2a24" stroke-width="3" fill="none"/>'
       + '<path d="M-10 14 q10 8 20 0" stroke="#7a2a24" stroke-width="3" fill="none"/>'},

    // --- shelf -----------------------------------------------------------
    {id:"teapot", name:"急須", kind:"shelf", price:70, category:"棚",
     svg:'<path d="M-16 6 q0 -16 16 -16 q16 0 16 16 q0 8 -16 8 q-16 0 -16 -8 Z" fill="#6b7d6a" stroke="#3f4d3e" stroke-width="3"/>'
       + '<path d="M16 -4 q12 -2 10 8" stroke="#3f4d3e" stroke-width="3" fill="none"/>'
       + '<path d="M-16 -2 q-10 0 -12 6" stroke="#3f4d3e" stroke-width="3" fill="none"/>'},
    {id:"books", name:"本", kind:"shelf", price:110, category:"棚",
     svg:'<rect x="-24" y="-20" width="10" height="34" fill="#8a4b3c" stroke="#5d2f24" stroke-width="2"/>'
       + '<rect x="-12" y="-24" width="10" height="38" fill="#4f6d7d" stroke="#2f4552" stroke-width="2"/>'
       + '<rect x="0" y="-18" width="10" height="32" fill="#7d6a3f" stroke="#4f4225" stroke-width="2"/>'
       + '<rect x="12" y="-22" width="10" height="36" fill="#6b5340" stroke="#3f3021" stroke-width="2"/>'},
    {id:"cat-figure", name:"招き猫", kind:"shelf", price:300, category:"棚",
     svg:'<path d="M-16 14 q0 -26 16 -26 q16 0 16 26 Z" fill="#f4efe4" stroke="#9c8c72" stroke-width="3"/>'
       + '<path d="M-12 -10 L-16 -22 L-6 -18 Z M12 -10 L16 -22 L6 -18 Z" fill="#f4efe4" stroke="#9c8c72" stroke-width="2"/>'
       + '<circle cx="-6" cy="-2" r="2" fill="#3a2a1a"/><circle cx="6" cy="-2" r="2" fill="#3a2a1a"/>'
       + '<path d="M14 2 q10 -6 6 -14" stroke="#9c8c72" stroke-width="3" fill="none"/>'},

    // --- window sill -----------------------------------------------------
    {id:"sill-plant", name:"小さな鉢", kind:"sill", price:60, category:"窓辺",
     svg:'<rect x="-10" y="0" width="20" height="16" rx="3" fill="#9c6b4a" stroke="#6b4530" stroke-width="2"/>'
       + '<path d="M0 0 q-12 -12 -6 -20 q8 4 6 20 M0 0 q12 -12 6 -20 q-8 4 -6 20" fill="#4f7d4a"/>'},
    {id:"wind-chime", name:"風鈴", kind:"sill", price:150, category:"窓辺",
     svg:'<path d="M-12 -6 q0 -14 12 -14 q12 0 12 14 q0 6 -12 6 q-12 0 -12 -6 Z" fill="#bcd7e0" stroke="#6a90a0" stroke-width="3" opacity="0.9"/>'
       + '<line x1="0" y1="0" x2="0" y2="16" stroke="#6a90a0" stroke-width="2"/>'
       + '<rect x="-5" y="16" width="10" height="14" fill="#e8dabd" stroke="#a98f68" stroke-width="2"/>'}
  ];

  function catalogue(){
    return ITEMS.map(function(item){
      return {id:item.id, name:item.name, kind:item.kind, price:item.price, category:item.category};
    });
  }

  function getItem(id){
    return ITEMS.filter(function(item){ return item.id === id; })[0] || null;
  }

  function svgFor(id){
    var item = getItem(id);
    return item ? item.svg : "";
  }

  function categories(){
    var seen = [];
    ITEMS.forEach(function(item){
      if(seen.indexOf(item.category) < 0) seen.push(item.category);
    });
    return seen;
  }

  function owns(home, id){
    return ((home && home.owned) || []).indexOf(id) >= 0;
  }

  function canAfford(money, id){
    var item = getItem(id);
    return !!item && (Number(money) || 0) >= item.price;
  }

  /* Buying never fails silently: a caller gets back why nothing happened. */
  function buy(home, money, id){
    var item = getItem(id);
    var wallet = Number(money) || 0;
    if(!item) return {ok:false, reason:"unknown", home:home, money:wallet};
    if(owns(home, id)) return {ok:false, reason:"owned", home:home, money:wallet};
    if(wallet < item.price) return {ok:false, reason:"poor", home:home, money:wallet};
    var next = {owned:((home && home.owned) || []).concat([id]), placed:copyPlaced(home)};
    return {ok:true, reason:null, home:next, money:wallet - item.price, spent:item.price};
  }

  function copyPlaced(home){
    var placed = {};
    Object.keys((home && home.placed) || {}).forEach(function(slot){ placed[slot] = home.placed[slot]; });
    return placed;
  }

  /* Placing an item into a slot.
   *
   * The item leaves wherever it was, because one purchase is one object. If
   * the destination is taken, the two trade places rather than one being lost. */
  function place(home, id, slotId, slots){
    var item = getItem(id);
    if(!item) return {ok:false, reason:"unknown", home:home};
    if(!owns(home, id)) return {ok:false, reason:"unowned", home:home};
    var slot = (slots || []).filter(function(s){ return s.id === slotId; })[0];
    if(!slot) return {ok:false, reason:"noslot", home:home};
    if(slot.kind !== item.kind) return {ok:false, reason:"wrongkind", home:home};

    var placed = copyPlaced(home);
    Object.keys(placed).forEach(function(key){
      if(placed[key] === id) delete placed[key];   // it can only be in one place
    });
    var displaced = placed[slotId] || null;
    placed[slotId] = id;
    return {ok:true, reason:null, displaced:displaced,
            home:{owned:((home && home.owned) || []).slice(), placed:placed}};
  }

  function remove(home, slotId){
    var placed = copyPlaced(home);
    var was = placed[slotId] || null;
    delete placed[slotId];
    return {ok:!!was, removed:was, home:{owned:((home && home.owned) || []).slice(), placed:placed}};
  }

  // Owned but not currently in the room.
  function inStorage(home){
    var placed = (home && home.placed) || {};
    var out = [];
    Object.keys(placed).forEach(function(slot){ out.push(placed[slot]); });
    return ((home && home.owned) || []).filter(function(id){ return out.indexOf(id) < 0; });
  }

  /* "Only 30 coins away from the 座卓." Shown after a session, because the
   * distance between what a learner has and the next thing they want is the
   * part that brings them back. */
  function nearestUnaffordable(home, money){
    var wallet = Number(money) || 0;
    var wanted = ITEMS
      .filter(function(item){ return !owns(home, item.id) && item.price > wallet; })
      .sort(function(a, b){ return a.price - b.price; })[0];
    if(!wanted) return null;
    return {id:wanted.id, name:wanted.name, price:wanted.price, short:wanted.price - wallet};
  }

  root.LanternHomeDecor = Object.freeze({
    catalogue: catalogue,
    categories: categories,
    getItem: getItem,
    svgFor: svgFor,
    owns: owns,
    canAfford: canAfford,
    buy: buy,
    place: place,
    remove: remove,
    inStorage: inStorage,
    nearestUnaffordable: nearestUnaffordable
  });
})(typeof self !== "undefined" ? self : this);
