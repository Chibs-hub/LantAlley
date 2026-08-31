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
  /* The room is painted in perspective too, so each position carries how far
   * back it is - the same `scale` the yard beds use.
   *
   * The floor is calibrated separately from the wall on purpose. Depth on a
   * floor is real recession: a table at the back of the room genuinely covers
   * less of the picture than the same table at the front. A wall is a flat
   * plane facing the viewer, so a scroll hung high is not further away and
   * shrinking it would look wrong rather than deep. Shelf and sill sit on that
   * same back plane and are treated with it. */
  /* Every position sampled off the painting, not estimated from it.
   *
   * The tatami begins at y=70: scanning down the middle of the picture, the
   * paper screens end and the mat starts at 70.1, 71.3 and 69.8 percent at
   * x=42, 50 and 58. The two back floor positions were at y=63, seven points
   * above that line, so anything placed there stood on the shoji rather than
   * on the floor - which is exactly what a table floating in mid-air looks
   * like. They are on the mat now, far enough behind the front row to keep
   * the depth reading.
   *
   * The two wall positions were hanging in the doorways. Scanning across the
   * painting at y=45 gives solid plaster from 0 to 9.6 percent and from 90.5
   * to 100; between those, 9.6 to 23.4 is the open veranda and 76.5 to 88.9 is
   * the doorway to the right. They were at 12 and 88 - one in each opening, so
   * a hung scroll floated in front of the garden. They are on the outer panels
   * now, which are the only stretches wide enough to take one.
   *
   * `post` is separate from `wall` because a 掛け行灯 hangs on a pillar, not on
   * plaster. Looking at the upper band of the painting rather than measuring
   * it: the dark structural posts stand at 24-27% and 73.5-76.5%, with plain
   * plaster outside them and shoji between. A lantern on the plaster read as
   * being on the sliding door beside it, which is what the owner kept seeing.
   * A scroll, a fan and a mask still want flat wall; only the lantern wants
   * the post. The lamp is a little wider than the pillar and overhangs it,
   * which is what a hung lantern does.
   *
   * The wall positions are the outer strips, hung high: (5,32) and (95,32).
   *
   * Getting here took two wrong moves, and the second undid the first. They
   * began at y=45 on those outer strips, which read as being on the sliding
   * doors; I moved them inward to 34 and 66 on the assumption that the outer
   * strips were the problem. They were not.
   *
   * Scanning each panel downward rather than across settles it. The outer
   * strips are plain plaster from y=20 to y=45 - a standard deviation of 1.3
   * to 2.3, which is featureless - and the ink landscape is a dado band that
   * begins at y=45. The inner panels are the shoji surrounds and never fall
   * below 6. So the outer strips were the right wall all along and **the
   * height was the fault**: at y=45 a scroll sat exactly on the top edge of
   * the painted band, next to a door, which is what made it read as hung on
   * one. Raised to y=32, in the middle of provably blank plaster.
   *
   * A scroll still belongs in a tokonoma, and this room has none. That is the
   * art-queue item; this is the best position the painting actually offers.
   *
   * `eave` is a new kind, for the one object that hangs from something rather
   * than resting on it. A wind chime under the veranda beam is the whole point
   * of a wind chime; it was filed as `sill` furniture and sat on the boards.
   *
   * The five floor positions are spread sideways rather than stacked, because
   * they cannot be stacked. A phone scene is about 320x180, a comfortable
   * target is 44px, and the visible tatami runs only from y=70 to the bottom -
   * thirty percent of the height, or 54px. Two rows inside that can never be
   * 44px apart vertically, so every same-kind pair earns its separation on the
   * horizontal instead: fourteen percent of the width is 44.8px, and no two
   * floor positions are closer than that.
   *
   * `shelf` and `tokonoma` are a different problem, half-solved. This room has
   * no shelf and no alcove - the names describe furniture the painting does
   * not contain - so they were hanging on a flat wall. Small objects now rest
   * on the tatami near the back wall instead, which is somewhere a teapot or a
   * bonsai could actually sit. They keep their `shelf` kind so the same items
   * still go to them. A room painted with a real tokonoma would want them
   * moved back up.
   *
   * `window-sill` likewise: it sat on a wall panel. It is now on the veranda
   * boards visible through the left opening, which is where a potted plant or
   * a wind chime belongs in this house. */
  var SLOTS = [
    {id:"floor-left",   x:22, y:80, scale:0.89, kind:"floor", label:"床の左"},
    {id:"floor-right",  x:78, y:80, scale:0.89, kind:"floor", label:"床の右"},
    {id:"floor-back-left", x:36, y:73, scale:0.72, kind:"floor", label:"床の奥左"},
    {id:"floor-back-right", x:64, y:73, scale:0.72, kind:"floor", label:"床の奥右"},
    {id:"floor-front", x:50, y:88, scale:1.00, kind:"floor", label:"床の手前"},
    {id:"wall-left",    x:5,  y:32, scale:0.92, kind:"wall",  label:"壁の左"},
    {id:"wall-right",   x:95, y:32, scale:0.92, kind:"wall",  label:"壁の右"},
    {id:"post-left",    x:25, y:32, scale:0.88, kind:"post",  label:"柱の左"},
    {id:"post-right",   x:75, y:32, scale:0.88, kind:"post",  label:"柱の右"},
    {id:"eave", x:15, y:30, scale:0.80, kind:"eave", label:"軒下"},
    {id:"shelf",        x:50, y:72, scale:0.78, kind:"shelf", label:"奥の段"},
    {id:"window-sill",  x:12, y:78, scale:0.80, kind:"sill",  label:"窓辺"},
    {id:"tokonoma", x:70, y:74, scale:0.85, kind:"shelf", label:"床の間"}
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
  /* The depth falloff is compressed, because it was shrinking the back of the
   * yard harder than the painting does.
   *
   * Measured against the house: its ground line is at y=54 and its eaves at
   * about y=25, so the building stands 29% of the scene tall. A mature cherry
   * is 22% of the scene wide on a square canvas, which makes it 39% tall at
   * the front row - 1.35x the house, right for a cherry - but the old 0.42 at
   * the back row brought it to 16%, barely half the house it was standing
   * against. A tree planted at the veranda is only a few metres further away
   * than the veranda; it should not be a third the size.
   *
   * The range is now 0.74 to 1.00, having gone 0.42 to 0.62 on the way, so a
   * mature cherry reads between 1.00x and 1.35x the house. The floor of that
   * range is deliberate: a full-grown cherry should be at least as tall as the
   * house it stands beside, wherever in the yard it is planted. The falloff
   * still exists - the back row is visibly further away - it just no longer
   * outruns the perspective it is meant to imitate. The exact figure is a
   * judgement about how far the garden may crowd the house, so it is one
   * number to move if it wants to be bolder or shyer.
   *
   */
  var YARD_SLOTS = [
    {id:"garden-left-1",x:25,y:58,scale:.74,kind:"garden",label:"庭の左奥 1"},
    {id:"garden-left-2",x:34,y:63,scale:.77,kind:"garden",label:"庭の左奥 2"},
    {id:"garden-left-3",x:21,y:72,scale:.84,kind:"garden",label:"庭の左中 1"},
    {id:"garden-left-4",x:35,y:77,scale:.88,kind:"garden",label:"庭の左中 2"},
    {id:"garden-right-1",x:75,y:58,scale:.74,kind:"garden",label:"庭の右奥 1"},
    {id:"garden-right-2",x:66,y:63,scale:.77,kind:"garden",label:"庭の右奥 2"},
    {id:"garden-right-3",x:79,y:72,scale:.84,kind:"garden",label:"庭の右中 1"},
    {id:"garden-right-4",x:65,y:77,scale:.88,kind:"garden",label:"庭の右中 2"},
    {id:"garden-free-09",x:15,y:61,scale:.77,kind:"garden",label:"庭 9"},
    {id:"garden-free-10",x:43,y:60,scale:.76,kind:"garden",label:"庭 10"},
    {id:"garden-free-11",x:57,y:60,scale:.76,kind:"garden",label:"庭 11"},
    {id:"garden-free-12",x:85,y:61,scale:.77,kind:"garden",label:"庭 12"},
    {id:"garden-free-13",x:12,y:78,scale:.88,kind:"garden",label:"庭 13"},
    {id:"garden-free-14",x:28,y:84,scale:.92,kind:"garden",label:"庭 14"},
    {id:"garden-free-15",x:41,y:82,scale:.91,kind:"garden",label:"庭 15"},
    {id:"garden-free-16",x:59,y:82,scale:.91,kind:"garden",label:"庭 16"},
    {id:"garden-free-17",x:72,y:84,scale:.92,kind:"garden",label:"庭 17"},
    {id:"garden-free-18",x:88,y:78,scale:.88,kind:"garden",label:"庭 18"},
    {id:"garden-free-19",x:10,y:93,scale:1.00,kind:"garden",label:"庭 19"},
    {id:"garden-free-20",x:25,y:94,scale:1.00,kind:"garden",label:"庭 20"},
    {id:"garden-free-21",x:40,y:94,scale:1.00,kind:"garden",label:"庭 21"},
    {id:"garden-free-22",x:60,y:94,scale:1.00,kind:"garden",label:"庭 22"},
    {id:"garden-free-23",x:75,y:94,scale:1.00,kind:"garden",label:"庭 23"},
    {id:"garden-free-24",x:90,y:93,scale:1.00,kind:"garden",label:"庭 24"}
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

  var BACKGROUNDS = {
    yard: {
      morning:"assets/home/exterior/open-house-yard-morning-v1.webp",
      day:"assets/home/exterior/open-house-yard-day-v1.webp",
      evening:"assets/home/exterior/open-house-yard-v1.webp",
      night:"assets/home/exterior/open-house-yard-night-v1.webp"
    },
    interior: {
      morning:"assets/home/interior/starter-room-morning-v1.webp",
      day:"assets/home/interior/starter-room-day-v1.webp",
      evening:"assets/home/interior/starter-room-v1.webp",
      night:"assets/home/interior/starter-room-night-v1.webp"
    }
  };

  function backgroundFor(area, period){
    var group = BACKGROUNDS[area];
    return group ? (group[period] || group.evening) : "";
  }

  function scenes(){
    return {
      yard: {
        background: backgroundFor("yard", "evening"),
        slots: cloneSlots(YARD_SLOTS),
        houseHotspot: {x:43, y:22, width:16, height:31, label:"家に入る"}
      },
      interior: {
        background: backgroundFor("interior", "evening"),
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
    backgroundFor: backgroundFor,
    baseRoomSvg: baseRoomSvg
  });
})(typeof self !== "undefined" ? self : this);
