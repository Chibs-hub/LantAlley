/* わが家 - the room the learner comes back to.
 *
 * Everything else on the map is work. This is the one place that asks nothing:
 * no clock, no question, no gauge. It exists so the coins earned at the inn and
 * the market have somewhere to land.
 *
 * Drawn as inline SVG rather than as a picture, for two reasons. It costs
 * kilobytes instead of megabytes, which matters because this room is going to
 * grow a catalogue of furniture. And it can be recoloured and rearranged from
 * data, which a photograph cannot - the decor system needs slots it can put
 * things into, not a flat image.
 *
 * The base layer is deliberately sparse but not empty: a room with nothing in
 * it reads as broken rather than as a room waiting to be furnished.
 */
(function(root){
  "use strict";

  // Slots the decor system will fill later. Named by where they are in the
  // room rather than by what goes in them, so a lamp and a plant can compete
  // for the same corner.
  var SLOTS = [
    {id:"floor-left",   x:290, y:352, kind:"floor", label:"床の左"},
    {id:"floor-right",  x:520, y:352, kind:"floor", label:"床の右"},
    {id:"wall-left",    x:130, y:120, kind:"wall",  label:"壁の左"},
    {id:"wall-right",   x:545, y:66,  kind:"wall",  label:"壁の右"},
    {id:"shelf",        x:545, y:146, kind:"shelf", label:"棚の上"},
    {id:"window-sill",  x:325, y:184, kind:"sill",  label:"窓辺"}
  ];

  function slots(){
    return SLOTS.map(function(slot){ return {id:slot.id, x:slot.x, y:slot.y, kind:slot.kind, label:slot.label}; });
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
    slots: slots,
    baseRoomSvg: baseRoomSvg
  });
})(typeof self !== "undefined" ? self : this);
