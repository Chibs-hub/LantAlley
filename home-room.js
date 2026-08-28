/* わが家 - the yard and the room the learner comes back to.
 *
 * Everything else on the map is work. This is the one place that asks nothing:
 * no clock, no question, no gauge. It exists so the coins earned at the inn and
 * the market have somewhere to land.
 *
 * This file used to draw the room in SVG and now only describes it. The scenes
 * are painted backgrounds; what this module owns is where things can stand on
 * top of them.
 *
 * Every coordinate is a percentage of the scene, not a pixel. The backgrounds
 * are fluid - the same room has to work at 320px and on a desktop - so a slot
 * fixed in pixels would drift off its own tatami mat the moment the window
 * changed. `baseRoomSvg` is kept as the fallback for a scene whose image
 * cannot be fetched, and for the standalone artifact build.
 */
(function(root){
  "use strict";

  // Slots the decor system will fill later. Named by where they are in the
  // room rather than by what goes in them, so a lamp and a plant can compete
  // for the same corner.
  var SLOTS = [
    {id:"floor-left",   x:27, y:80, kind:"floor", label:"床の左"},
    {id:"floor-right",  x:73, y:80, kind:"floor", label:"床の右"},
    {id:"wall-left",    x:12, y:45, kind:"wall",  label:"壁の左"},
    {id:"wall-right",   x:88, y:45, kind:"wall",  label:"壁の右"},
    {id:"shelf",        x:50, y:66, kind:"shelf", label:"奥の段"},
    {id:"window-sill",  x:34, y:60, kind:"sill",  label:"窓辺"}
  ];

  /* The eight beds, measured off the painting rather than estimated from it.
   *
   * The two columns lean outward as they come forward, which is what gives the
   * yard its depth - slots on a straight grid sat in the gravel.
   *
   * `y` is where a plant's foot goes, near the front edge of its bed rather
   * than the middle: something standing in the middle of a bed drawn in
   * perspective reads as standing behind it.
   *
   * `scale` is the same perspective, applied to size. The back beds are 4.4%
   * of the scene tall and the front ones 12.0%, so a plant drawn the same size
   * in all eight towers nearly three times out of the back beds and onto the
   * gravel. These are the bed heights as a fraction of the nearest row. */
  var YARD_SLOTS = [
    {id:"garden-left-1",  x:33.2, y:61.4, scale:0.37, kind:"garden", label:"左の花壇 1"},
    {id:"garden-left-2",  x:28.5, y:68.9, scale:0.52, kind:"garden", label:"左の花壇 2"},
    {id:"garden-left-3",  x:26.2, y:79.6, scale:0.74, kind:"garden", label:"左の花壇 3"},
    {id:"garden-left-4",  x:24.3, y:94.3, scale:1.00, kind:"garden", label:"左の花壇 4"},
    {id:"garden-right-1", x:67.9, y:61.4, scale:0.37, kind:"garden", label:"右の花壇 1"},
    {id:"garden-right-2", x:69.8, y:68.9, scale:0.52, kind:"garden", label:"右の花壇 2"},
    {id:"garden-right-3", x:73.9, y:79.6, scale:0.74, kind:"garden", label:"右の花壇 3"},
    {id:"garden-right-4", x:75.6, y:94.3, scale:1.00, kind:"garden", label:"右の花壇 4"}
  ];

  function cloneSlots(source){
    return source.map(function(slot){
      return {id:slot.id, x:slot.x, y:slot.y, scale:slot.scale || 1,
              kind:slot.kind, label:slot.label};
    });
  }

  function slots(){
    return cloneSlots(SLOTS);
  }

  function scenes(){
    return {
      yard: {
        background: "assets/home/exterior/starter-house-yard-v1.webp",
        slots: cloneSlots(YARD_SLOTS),
        houseHotspot: {x:43, y:25, width:16, height:27, label:"家に入る"}
      },
      interior: {
        background: "assets/home/interior/starter-room-v1.webp",
        slots: cloneSlots(SLOTS)
      }
    };
  }

  /* The empty room. One wall, one window on a night sky, tatami, a futon
   * folded in the corner and a lantern that is already lit - the lantern is
   * the point of the whole game, so it is on from the first visit. */
  function baseRoomSvg(){
    return '<svg class="home-room-art" viewBox="0 0 650 400" role="img" aria-label="わが家の部屋">'
      + '<defs>'
      + '<linearGradient id="home-wall" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#4a3524"/><stop offset="1" stop-color="#3a2819"/>'
      + '</linearGradient>'
      + '<linearGradient id="home-night" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#1b2a45"/><stop offset="1" stop-color="#2d3b56"/>'
      + '</linearGradient>'
      + '<radialGradient id="home-glow" cx="0.5" cy="0.5" r="0.5">'
      + '<stop offset="0" stop-color="#ffd489" stop-opacity="0.55"/>'
      + '<stop offset="1" stop-color="#ffd489" stop-opacity="0"/>'
      + '</radialGradient>'
      + '</defs>'

      // wall and floor
      + '<rect x="0" y="0" width="650" height="260" fill="url(#home-wall)"/>'
      + '<rect x="0" y="260" width="650" height="140" fill="#7d6242"/>'

      // tatami, laid in mats so the floor reads as a floor
      + '<g stroke="#5d472f" stroke-width="2" fill="#8a6c49">'
      + '<rect x="0" y="262" width="216" height="70"/><rect x="216" y="262" width="218" height="70"/>'
      + '<rect x="434" y="262" width="216" height="70"/>'
      + '<rect x="0" y="332" width="216" height="68"/><rect x="216" y="332" width="218" height="68"/>'
      + '<rect x="434" y="332" width="216" height="68"/>'
      + '</g>'

      // shoji window onto the alley at night
      + '<g>'
      + '<rect x="235" y="70" width="180" height="130" rx="4" fill="url(#home-night)" stroke="#6b533a" stroke-width="6"/>'
      + '<circle cx="380" cy="105" r="14" fill="#f6e7c1" opacity="0.9"/>'
      + '<g stroke="#6b533a" stroke-width="4">'
      + '<line x1="325" y1="70" x2="325" y2="200"/><line x1="235" y1="135" x2="415" y2="135"/>'
      + '</g>'
      + '<rect x="225" y="200" width="200" height="12" rx="3" fill="#6b533a"/>'
      + '</g>'

      // a shelf, because a room needs one horizontal line that is not the floor
      + '<rect x="470" y="160" width="150" height="10" rx="3" fill="#6b533a"/>'
      + '<rect x="478" y="170" width="8" height="26" fill="#5d472f"/>'
      + '<rect x="604" y="170" width="8" height="26" fill="#5d472f"/>'

      // folded futon in the corner
      + '<g>'
      + '<rect x="40" y="280" width="150" height="34" rx="8" fill="#d9c7a6" stroke="#a98f68" stroke-width="3"/>'
      + '<rect x="40" y="266" width="150" height="20" rx="8" fill="#e8dabd" stroke="#a98f68" stroke-width="3"/>'
      + '<line x1="115" y1="266" x2="115" y2="314" stroke="#a98f68" stroke-width="2"/>'
      + '</g>'

      // the lantern, lit
      + '<g>'
      + '<circle cx="325" cy="60" r="70" fill="url(#home-glow)"/>'
      + '<line x1="325" y1="0" x2="325" y2="26" stroke="#5d472f" stroke-width="4"/>'
      + '<rect x="298" y="26" width="54" height="62" rx="16" fill="#f3c568" stroke="#9c6b2f" stroke-width="4"/>'
      + '<line x1="298" y1="46" x2="352" y2="46" stroke="#9c6b2f" stroke-width="3"/>'
      + '<line x1="298" y1="68" x2="352" y2="68" stroke="#9c6b2f" stroke-width="3"/>'
      + '</g>'
      + '</svg>';
  }

  root.LanternHomeRoom = Object.freeze({
    scenes: scenes,
    slots: slots,
    baseRoomSvg: baseRoomSvg
  });
})(typeof self !== "undefined" ? self : this);
