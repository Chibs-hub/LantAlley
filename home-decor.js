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
 * Matching reward pictures are used when available; compact vectors remain as
 * fallbacks so a missing image never makes an owned object disappear.
 */
(function(root){
  "use strict";

  // Prices come from the costed model: about a day and a half of practice for
  // the cheapest, a fortnight for the dearest.
  var ITEMS = [
    // --- floor -----------------------------------------------------------

    /* The one thing in here that is given rather than sold. Kon hands it over
     * during the first visit so a learner places something before they can
     * afford anything - the tutorial has to teach placing, and teaching it on
     * an empty room means teaching it on nothing.
     *
     * It carries a picture as well as a drawing: the picture is used where it
     * loads, and the vector keeps the room intact if it does not. */
    {id:"floor-cushion-navy", name:"座布団", kind:"floor", price:50, category:"床",
     image:"assets/home/decor/floor-cushion-navy-v1.webp",
     svg:'<path d="M-46 8 L-30 -12 L34 -12 L50 8 L34 22 L-30 22 Z" fill="#2f4670" stroke="#1c2b47" stroke-width="3"/>'
       + '<path d="M-30 -12 L-14 4 L50 8" fill="none" stroke="#4a648f" stroke-width="2"/>'
       + '<path d="M-24 -6 L-8 0 M-6 -8 L10 -2 M12 -10 L28 -4" stroke="#d8cfae" stroke-width="2"/>'},
    {id:"rug-plain", name:"敷物", kind:"floor", price:50, category:"床",
     image:"assets/home/decor/rug-plain-v1.webp",
     svg:'<ellipse cx="0" cy="0" rx="62" ry="22" fill="#8a4b3c" stroke="#5d2f24" stroke-width="3"/>'
       + '<ellipse cx="0" cy="0" rx="44" ry="13" fill="none" stroke="#d8a97a" stroke-width="2"/>'},
    {id:"plant-small", name:"鉢植え", kind:"floor", price:80, category:"床",
     image:"assets/home/decor/bonsai-green-v1.webp",
     svg:'<rect x="-14" y="-4" width="28" height="24" rx="4" fill="#9c6b4a" stroke="#6b4530" stroke-width="3"/>'
       + '<path d="M0 -4 C -18 -20 -12 -40 0 -34 C 12 -40 18 -20 0 -4 Z" fill="#4f7d4a"/>'
       + '<path d="M0 -6 L0 -30" stroke="#2f5a2c" stroke-width="3"/>'},
    {id:"low-table", name:"座卓", kind:"floor", price:200, category:"床",
     image:"assets/home/decor/low-table-round-v1.webp",
     svg:'<rect x="-46" y="-16" width="92" height="12" rx="4" fill="#7d5230" stroke="#573719" stroke-width="3"/>'
       + '<rect x="-38" y="-4" width="8" height="22" fill="#573719"/>'
       + '<rect x="30" y="-4" width="8" height="22" fill="#573719"/>'},
    {id:"brazier", name:"火鉢", kind:"floor", price:400, category:"床",
     svg:'<ellipse cx="0" cy="10" rx="30" ry="10" fill="#4a3524"/>'
       + '<path d="M-30 10 L-24 -14 L24 -14 L30 10 Z" fill="#6b5340" stroke="#3f3021" stroke-width="3"/>'
       + '<ellipse cx="0" cy="-14" rx="24" ry="8" fill="#2b1c11"/>'
       + '<path d="M-8 -18 q6 -12 8 -4 q4 -10 8 2" stroke="#ffb454" stroke-width="3" fill="none"/>'},
    {id:"kotatsu", name:"こたつ", kind:"floor", price:260, category:"床",
     image:"assets/home/decor/kotatsu-blue-v1.webp",
     svg:'<rect x="-44" y="-16" width="88" height="32" rx="8" fill="#334b72"/><rect x="-38" y="-24" width="76" height="12" rx="4" fill="#7d5230"/>'},
    {id:"folding-screen", name:"屏風", kind:"floor", price:360, category:"床",
     image:"assets/home/decor/folding-screen-cranes-v1.webp",
     svg:'<path d="M-52 -36 L-18 -42 L-18 38 L-52 32 Z M-16 -42 L16 -38 L16 38 L-16 38 Z M18 -38 L52 -34 L52 32 L18 38 Z" fill="#d7ad55" stroke="#5d3d22" stroke-width="3"/>'},
    {id:"floor-lantern", name:"置き行灯", kind:"floor", price:180, category:"床",
     image:"assets/home/decor/floor-lantern-v1.webp",
     svg:'<rect x="-20" y="-36" width="40" height="70" rx="3" fill="#f1cf82" stroke="#3b2a1b" stroke-width="5"/><path d="M-20 -12 H20 M-20 12 H20" stroke="#3b2a1b" stroke-width="3"/>'},
    /* `chrysanthemum-pot`, not `chrysanthemum`.
     *
     * The plain name belongs to the garden species in home-garden.js, and both
     * catalogues held it. Nothing broke, because plants live in garden.plants
     * and furniture in home.owned and the two were never resolved together -
     * but the next lookup that did not know which catalogue an id came from
     * would have found the wrong object, and silently. The picture has always
     * been chrysanthemum-pot-v1.webp, so the id now matches the asset. */
    {id:"chrysanthemum-pot", name:"菊の鉢", kind:"floor", price:140, category:"床",
     image:"assets/home/decor/chrysanthemum-pot-v1.webp",
     svg:'<ellipse cx="0" cy="18" rx="28" ry="9" fill="#79553b"/><path d="M-24 15 L-18 -12 L18 -12 L24 15 Z" fill="#9b704c"/><circle cx="0" cy="-24" r="22" fill="#cf9d3c"/>'},

    // --- wall ------------------------------------------------------------
    {id:"scroll", name:"掛け軸", kind:"wall", price:120, category:"壁",
     image:"assets/home/decor/hanging-scroll-bamboo-v1.webp",
     svg:'<rect x="-20" y="-46" width="40" height="92" fill="#e8dabd" stroke="#a98f68" stroke-width="2"/>'
       + '<rect x="-24" y="-50" width="48" height="8" rx="3" fill="#6b4530"/>'
       + '<rect x="-24" y="42" width="48" height="8" rx="3" fill="#6b4530"/>'
       + '<path d="M-6 -26 L6 -26 M0 -26 L0 6 M-8 6 L8 18" stroke="#3a2a1a" stroke-width="3" fill="none"/>'},
    {id:"wall-lamp", name:"掛け行灯", kind:"wall", price:220, category:"壁",
     image:"assets/home/decor/paper-lantern-red-v1.webp",
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
     image:"assets/home/decor/maneki-neko-v1.webp",
     svg:'<path d="M-16 14 q0 -26 16 -26 q16 0 16 26 Z" fill="#f4efe4" stroke="#9c8c72" stroke-width="3"/>'
       + '<path d="M-12 -10 L-16 -22 L-6 -18 Z M12 -10 L16 -22 L6 -18 Z" fill="#f4efe4" stroke="#9c8c72" stroke-width="2"/>'
       + '<circle cx="-6" cy="-2" r="2" fill="#3a2a1a"/><circle cx="6" cy="-2" r="2" fill="#3a2a1a"/>'
       + '<path d="M14 2 q10 -6 6 -14" stroke="#9c8c72" stroke-width="3" fill="none"/>'},
    {id:"daruma", name:"だるま", kind:"shelf", price:180, category:"棚",
     image:"assets/home/decor/daruma-red-v1.webp",
     svg:'<ellipse cx="0" cy="2" rx="28" ry="34" fill="#a9342c" stroke="#67231f" stroke-width="3"/><ellipse cx="0" cy="-8" rx="20" ry="15" fill="#efe0bd"/>'},
    {id:"sakura-bonsai", name:"桜の盆栽", kind:"shelf", price:320, category:"棚",
     image:"assets/home/decor/sakura-bonsai-v1.webp",
     svg:'<rect x="-24" y="14" width="48" height="12" rx="4" fill="#3c5260"/><path d="M0 14 Q-12 -8 5 -30" stroke="#68452d" stroke-width="6" fill="none"/><circle cx="6" cy="-32" r="22" fill="#e4a9ba"/>'},
    {id:"pine-bonsai", name:"松の盆栽", kind:"shelf", price:280, category:"棚",
     image:"assets/home/decor/pine-bonsai-v1.webp",
     svg:'<rect x="-24" y="14" width="48" height="12" rx="4" fill="#72634a"/><path d="M0 14 Q-14 -8 4 -32" stroke="#68452d" stroke-width="6" fill="none"/><ellipse cx="6" cy="-34" rx="28" ry="15" fill="#48694a"/>'},

    // --- window sill -----------------------------------------------------
    {id:"sill-plant", name:"小さな鉢", kind:"sill", price:60, category:"窓辺",
     svg:'<rect x="-10" y="0" width="20" height="16" rx="3" fill="#9c6b4a" stroke="#6b4530" stroke-width="2"/>'
       + '<path d="M0 0 q-12 -12 -6 -20 q8 4 6 20 M0 0 q12 -12 6 -20 q-8 4 -6 20" fill="#4f7d4a"/>'},
    {id:"wind-chime", name:"風鈴", kind:"sill", price:150, category:"窓辺",
     image:"assets/home/decor/wind-chime-blue-v1.webp",
     svg:'<path d="M-12 -6 q0 -14 12 -14 q12 0 12 14 q0 6 -12 6 q-12 0 -12 -6 Z" fill="#bcd7e0" stroke="#6a90a0" stroke-width="3" opacity="0.9"/>'
       + '<line x1="0" y1="0" x2="0" y2="16" stroke="#6a90a0" stroke-width="2"/>'
       + '<rect x="-5" y="16" width="10" height="14" fill="#e8dabd" stroke="#a98f68" stroke-width="2"/>'}
  ];

  /* Wallpaper.
   *
   * Not decor: it is not placed, it does not occupy a slot, and only one can be
   * up at a time. It is bought like everything else and then chosen, which is
   * why ownership and the active choice are stored separately - changing your
   * mind must not cost you the roll you already paid for.
   *
   * The patterns are drawn as tiling SVG rather than photographed. A seamless
   * repeat is exactly what vector is good at: it costs a few hundred bytes,
   * tiles without a seam at any size, and recolours from data. Raster versions
   * can replace them later by giving an entry an `image`, with no other change.
   *
   * 無地 has no art at all, because the painted room already has walls.
   */
  var WALLPAPERS = [
    {id:"wallpaper-plain", name:"無地", price:0, pattern:null},

    {id:"wallpaper-asanoha", name:"麻の葉", price:180,
     image:"assets/home/decor/wallpaper-asanoha-blue-v1.webp",
     tile:56,
     pattern:'<g stroke="#8a6a45" stroke-width="1.6" fill="none" opacity="0.85">'
       + '<path d="M28 0 L28 56 M0 14 L56 14 M0 42 L56 42"/>'
       + '<path d="M0 14 L28 0 L56 14 L56 42 L28 56 L0 42 Z"/>'
       + '<path d="M0 14 L28 28 L56 14 M0 42 L28 28 L56 42"/>'
       + '<path d="M14 7 L14 21 M42 7 L42 21 M14 35 L14 49 M42 35 L42 49"/>'
       + '</g>'},

    {id:"wallpaper-sakura", name:"桜", price:220,
     tile:64,
     pattern:'<g fill="#c98a92" opacity="0.7">'
       + blossom(16, 14, 7) + blossom(48, 34, 6) + blossom(30, 54, 5)
       + '</g>'
       + '<g fill="#e2b3b8" opacity="0.5">'
       + blossom(54, 8, 4) + blossom(6, 44, 4)
       + '</g>'}
  ];

  /* Physical presentation in the painted room.
   *
   * A single percentage made a teapot, a cushion and a table behave like the
   * same-size cut-out. Width is the item's full-size footprint before the
   * slot's perspective scale. anchorY is the point in the image that meets the
   * slot: 100 is the feet/base, 50 is the centre of wall art, and 0 is the top
   * hook of a hanging wind chime. */
  var PRESENTATION = {
    "floor-cushion-navy": {width:12, anchorY:82},
    "rug-plain":          {width:20, anchorY:55, scaleY:0.58},
    "plant-small":        {width:8, anchorY:100},
    "low-table":          {width:20, anchorY:100},
    brazier:               {width:14, anchorY:100},
    kotatsu:               {width:22, anchorY:100},
    "folding-screen":     {width:25, anchorY:100},
    "floor-lantern":      {width:6.5, anchorY:100},
    "chrysanthemum-pot":   {width:8, anchorY:100},
    scroll:                {width:7, anchorY:50},
    "wall-lamp":          {width:5.5, anchorY:50},
    fan:                   {width:9, anchorY:50},
    mask:                  {width:9, anchorY:50},
    teapot:                {width:8, anchorY:100},
    books:                 {width:9, anchorY:100},
    "cat-figure":         {width:4.5, anchorY:100},
    daruma:                {width:4.5, anchorY:100},
    "sakura-bonsai":      {width:7, anchorY:100},
    "pine-bonsai":        {width:7, anchorY:100},
    "sill-plant":         {width:14, anchorY:100},
    "wind-chime":         {width:4, anchorY:0, offsetY:-40}
  };

  function presentationFor(id){
    var row = PRESENTATION[id] || {width:10, anchorY:100};
    return {width:row.width, anchorY:row.anchorY,
            scaleY:row.scaleY || 1, offsetY:row.offsetY || 0};
  }

  /* Five petals around a centre. Written once rather than five times per
   * blossom, because the pattern needs several and they must match. */
  function blossom(cx, cy, r){
    var out = "";
    for(var i = 0; i < 5; i++){
      var a = (i * 72 - 90) * Math.PI / 180;
      out += '<ellipse cx="' + (cx + Math.cos(a) * r).toFixed(1)
        + '" cy="' + (cy + Math.sin(a) * r).toFixed(1)
        + '" rx="' + (r * 0.62).toFixed(1) + '" ry="' + (r * 0.46).toFixed(1)
        + '" transform="rotate(' + (i * 72) + ' ' + (cx + Math.cos(a) * r).toFixed(1)
        + ' ' + (cy + Math.sin(a) * r).toFixed(1) + ')"/>';
    }
    return out;
  }

  function wallpapers(){
    return WALLPAPERS.map(function(w){
      return {id:w.id, name:w.name, price:w.price, hasPattern: !!(w.pattern || w.image)};
    });
  }

  function getWallpaper(id){
    return WALLPAPERS.filter(function(w){ return w.id === id; })[0] || null;
  }

  /* A whole wall of the chosen pattern, as a tiling SVG. Returns "" for 無地,
   * which is the room's own walls and needs no layer at all. */
  function wallpaperSvg(id){
    var paper = getWallpaper(id);
    if(paper && paper.image){
      /* Tiled, not stretched.
       *
       * The file is a sheet of about thirteen motifs, and it was being drawn
       * as a single <img> scaled to fill the whole wall - so those thirteen
       * motifs spanned the room and each one came out around 28cm across,
       * roughly three times life size. Repeating the sheet at a third of the
       * wall's width puts the motif near 9cm, which is what asanoha actually
       * is, and repeating also keeps the sheet's own proportions instead of
       * stretching them to the band's aspect. */
      return '<div class="home-wallpaper-art is-raster" style="background-image:url('
        + paper.image + ')"></div>';
    }
    if(!paper || !paper.pattern) return "";
    var tile = paper.tile || 56;
    var name = "wp-" + paper.id;
    return '<svg class="home-wallpaper-art" preserveAspectRatio="none" aria-hidden="true">'
      + '<defs><pattern id="' + name + '" width="' + tile + '" height="' + tile
      + '" patternUnits="userSpaceOnUse">' + paper.pattern + '</pattern></defs>'
      + '<rect width="100%" height="100%" fill="url(#' + name + ')"/></svg>';
  }

  /* Wallpaper has its own purchase because it has its own list. Routing it
   * through buy() looked right and quietly did nothing: buy() resolves ids
   * against the furniture catalogue, so every wallpaper came back "unknown"
   * and the tap simply had no effect. */
  function buyWallpaper(home, money, id){
    var paper = getWallpaper(id);
    var wallet = Number(money) || 0;
    if(!paper) return {ok:false, reason:"unknown", home:home, money:wallet};
    if(ownsWallpaper(home, id)) return {ok:false, reason:"owned", home:home, money:wallet};
    if(wallet < paper.price) return {ok:false, reason:"poor", home:home, money:wallet};
    return {ok:true, reason:null, spent:paper.price, money:wallet - paper.price,
            home:{owned:((home && home.owned) || []).concat([id]), placed:copyPlaced(home)}};
  }

  function ownsWallpaper(home, id){
    // 無地 is what the room already is, so it is never bought.
    return id === "wallpaper-plain" || owns(home, id);
  }

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
  function isWallpaper(id){
    return !!getWallpaper(id);
  }

  function inStorage(home){
    var placed = (home && home.placed) || {};
    var out = [];
    Object.keys(placed).forEach(function(slot){ out.push(placed[slot]); });
    // A wallpaper is owned but never placed, so without this it would sit in
    // the storage shelf forever offering a spot that does not exist.
    return ((home && home.owned) || []).filter(function(id){
      return out.indexOf(id) < 0 && !isWallpaper(id);
    });
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
    wallpapers: wallpapers,
    getWallpaper: getWallpaper,
    wallpaperSvg: wallpaperSvg,
    ownsWallpaper: ownsWallpaper,
    buyWallpaper: buyWallpaper,
    isWallpaper: isWallpaper,
    categories: categories,
    presentationFor: presentationFor,
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
