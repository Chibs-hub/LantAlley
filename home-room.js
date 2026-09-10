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
   * `skew` is the angle of the wall the object is hung on.
   *
   * The two side walls recede, and a picture drawn face-on does not lie on a
   * receding plane - it reads as pinned to the air in front of it, which is
   * what a scroll at a weird angle looks like. Measuring the ceiling beams
   * gives a clean symmetric pair, +31.1 degrees on the left and -31.1 on the
   * right, but that is the slope at the ceiling and it is not the number to
   * use: every horizontal on a wall runs to the same vanishing point, so the
   * slope depends on how far the line sits from the horizon. Carrying the
   * beams' convergence down to the hanging height of y=32 gives 12.8 degrees.
   * At y=45 it would be 3.6, which is why the same object looks wronger the
   * higher it is hung.
   *
   * The posts take no skew. A pillar is a column facing the viewer, not a
   * plane running away from one, and a lantern hung on it stays square.
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
   * `shelf` and `tokonoma` were the half-solved case, and this is the other
   * half. The painting has no shelf and no alcove, so the two slots first hung
   * on flat wall, then retreated to the tatami by the back wall - somewhere a
   * teapot *can* sit, but it left a kyusu and a daruma marooned in the middle
   * of an empty floor with nothing under them, and the room reading as bare
   * boards.
   *
   * So the room owns a piece of furniture now. `display-shelf-staggered-v1`
   * was already in the repo, transparent and unused; it stands against the
   * right fusuma as a FIXTURE - scenery, not stock, so it needs no purchase,
   * cannot be picked up, and every room has one from the first visit. These
   * two slots sit on two of its real surfaces. It is also the horizontal line
   * above floor level that the room never had.
   *
   * The pair is split across the shelf - top plank left, bottom plank right -
   * rather than stacked on adjacent surfaces, and 10% apart rather than the
   * 14% the floor slots keep between them.
   *
   * 14% belongs to a 320px-wide scene, which no longer exists: the camera is
   * pannable and its own floor is `clamp(300px,50dvh,480px)` of height at
   * 16/9, so even a 320x568 phone renders the room 533x300 and pans it. That
   * is measured, not derived - a 320px viewport was loaded and the scene came
   * back 533 wide. At that floor 10% is 53px, clear of the 44px target, while
   * the 8% first tried here was 43px: one pixel short, and the separation
   * test was right to refuse it.
   *
   * Both carry the same scale, because they are the same distance from the
   * camera. A shelf's height off the floor is not depth.
   *
   * The y values are the planks themselves, read off the asset rather than
   * judged: each row of the picture was scanned for how much of it is opaque,
   * a run above 55% is a plank, and the top of that run is its surface. On the
   * cropped 572x407 art those come out at 0.0147, 0.3096, 0.5381 and 0.7445 of
   * the height, and at a 15%-wide shelf standing at y=73 that puts the top
   * plank at 54.30 and the bottom one at 68.15. Re-measure if the art changes:
   *
   *   the shelf's own picture had 4.8% of transparent height beneath it, so it
   *   stood that far off the floor and carried everything on it up with it.
   *   Cropping the file changed its aspect from 1.385 to 1.405 and moved every
   *   plank, which is why these are not round numbers.
   *
   * That scale is 0.52 rather than the 0.74 these had on the floor, and the
   * shelf itself is 14% wide rather than the 24% first tried, because the
   * back wall is not the front row. The PRESENTATION widths in home-decor.js
   * are calibrated where the tatami seams were measured - the front of the
   * room, about a quarter of a percent of the scene per centimetre - but the
   * back wall spans roughly 350px to 850px of the painting's 1200 for a room
   * about 3.5m across, which is 0.12% per centimetre, half as much. Sized on
   * the front-row figure the shelf came out over two metres wide and ran off
   * the fusuma into the corner post.
   *
   * `window-sill` likewise: it sat on a wall panel. It is now on the veranda
   * boards visible through the left opening, which is where a potted plant or
   * a wind chime belongs in this house. */
  /* Eight places on a shelf, and one target to reach them by.
   *
   * A 違い棚 plainly holds more than two things, and two was never a judgement
   * about the furniture - it was the most tap targets that fit. At the
   * smallest scene the room is drawn at, 533x300, a shelf is 80x58px and its
   * planks are 15px apart: eight targets 44px from each other need roughly
   * 180x130px, so they cannot coexist with the furniture at its real size.
   *
   * The way out is to stop making each position a target. `surface` groups
   * these eight into one, and the renderer draws a single target over the
   * whole shelf: "put it on the shelf" is the instruction anyway, and the
   * shelf is a large, easy thing to hit. Which plank it lands on is decided
   * by filling the first free position, top-left to bottom-right, the way you
   * would set objects down yourself. Taking one off is unchanged - press the
   * object, not the shelf.
   *
   * The planks are measured, not judged: rows of the asset more than 55%
   * opaque, giving four bands whose tops are 0.0147, 0.3096, 0.5381 and
   * 0.7445 of its height. A band is 28-32px thick because the board is seen
   * at a slight angle and that is its top surface in perspective, so the
   * contact point is 45% into the band rather than at the top of it - resting
   * an object on the band's first row put it at the plank's far edge, hanging
   * over the front of the shelf. The base contact sits below its sloping
   * right edge. `xs` are fractions of the shelf's width. The second board ends
   * at x=0.65 and the third starts at x=0.36; the outer frame is not a
   * usable surface. Clearance leaves room for the board above the item. */
  var SHELF_PLANKS = [
    {contact:0.0479, xs:[0.25, 0.75], maxWidth:5.4, maxHeight:9},
    {contact:0.3406, xs:[0.20, 0.50], maxWidth:3.3, maxHeight:4.5},
    {contact:0.5735, xs:[0.51, 0.81], maxWidth:3.3, maxHeight:3.4},
    {contact:0.786, xs:[0.25, 0.75], maxWidth:5.4, maxHeight:2.6}
  ];

  function shelfPositions(prefix, centreX, mirrored, requires){
    var WIDTH = 15, BASE = 73;
    var HEIGHT = WIDTH * 1.778 / 1.405;      // scene is 16/9; asset is 572x407
    var top = BASE - HEIGHT, left = centreX - WIDTH / 2;
    var out = [];
    SHELF_PLANKS.forEach(function(plank, row){
      plank.xs.forEach(function(fx, col){
        var f = mirrored ? 1 - fx : fx;      // the left shelf is drawn mirrored
        out.push({
          id: prefix + "-" + (row + 1) + (col ? "b" : "a"),
          x: +(left + WIDTH * f).toFixed(2),
          y: +(top + HEIGHT * plank.contact).toFixed(2),
          scale: 0.52, kind: "shelf", surface: prefix, requires: requires || null,
          maxWidth: plank.maxWidth, maxHeight: plank.maxHeight,
          label: (mirrored ? "左棚" : "右棚") + "の" + (row + 1) + "段目"
        });
      });
    });
    return out;
  }

  var SLOTS = [
    {id:"floor-left",   x:22, y:80, scale:0.89, kind:"floor", label:"床の左"},
    {id:"floor-right",  x:78, y:80, scale:0.89, kind:"floor", label:"床の右"},
    /* These two used to sit at y:73, which is the foot of the back wall - and
       is now the foot of a shelf. A floor object placed there stood on the
       same ground line as the furniture and inside its footprint, so a bonsai
       came out looking like it had been posted through the shelf rather than
       set down in the room. Five percent nearer the viewer puts it in front
       of the shelf, where a plant on the floor beside a piece of furniture
       actually stands. The x stays: it is the depth that was wrong. */
    {id:"floor-back-left", x:36, y:78, scale:0.74, kind:"floor", label:"床の奥左"},
    {id:"floor-back-right", x:64, y:78, scale:0.74, kind:"floor", label:"床の奥右"},
    {id:"floor-front", x:50, y:88, scale:1.00, kind:"floor", label:"床の手前"},
    {id:"wall-left",    x:5,  y:32, scale:0.92, skew:12.8,  kind:"wall",  label:"壁の左"},
    {id:"wall-right",   x:95, y:32, scale:0.92, skew:-12.8, kind:"wall",  label:"壁の右"},
    {id:"post-left",    x:25, y:32, scale:0.88, kind:"post",  label:"柱の左"},
    {id:"post-right",   x:75, y:32, scale:0.88, kind:"post",  label:"柱の右"},
    {id:"eave", x:15, y:30, scale:0.80, kind:"eave", label:"軒下"},
    {id:"window-sill",  x:12, y:78, scale:0.80, kind:"sill",  label:"窓辺"},
    /* Where the second shelf goes if the learner buys one. `z` sorts it with
       the fixtures rather than by its own foot: whatever stands on its planks
       has a higher y than the shelf's base, so without this the shelf would
       draw in front of the things it is holding. */
    {id:"cabinet-left", x:32.5, y:73, scale:0.74, z:38, kind:"cabinet", label:"左の壁際"},

  ].concat(shelfPositions("shelf-right", 65.5, false, null))
   .concat(shelfPositions("shelf-left", 32.5, true, "cabinet-left"));

  /* Furniture the room owns rather than the player.
   *
   * A fixture is drawn from the same art as the catalogue but is not stock:
   * it cannot be bought, placed or put away, and it is there on a first
   * visit. The shelf exists so the `shelf` slots above have something real
   * under them - see the note on those two.
   *
   * `y` is the foot, like a floor slot, and `z` is the depth the renderer
   * sorts it by. That is deliberately shallower than the slots standing on
   * it: the objects on a shelf are in front of its frame, so they must sort
   * above it, and depth here is measured from the object's base, which for
   * the shelf is lower down the picture than the surfaces it holds.
   *
   * The three numbers are read off the painting, not chosen by eye. Blown up
   * 3x, the right fusuma runs x=715 to x=855 of the 1200-wide source and its
   * bottom rail meets the tatami at y=487. The scene is `cover` on a 533x300
   * box, which scales the source by 0.4484 and crops 2.55px from each side,
   * so image x maps to (x*0.4484-2.55)/533 and image y maps to y/669:
   *
   *   fusuma      x 715..855 -> 59.7%..71.5%, centre 65.6
   *   floor line  y 487      -> 72.8%
   *
   * Hence x:65.5 and y:73. The first attempt used y:69, which is image y=461
   * - twenty-five pixels up the wall, with the shelf hanging in the air above
   * its own floor.
   *
   * The width is 15 rather than the 11 that would fit inside the fusuma leaf,
   * because 11 is 90cm and the asset is 1.36 times wider than tall, which
   * would make it 66cm high - a sideboard, not a chigaidana. 15 is about
   * 124cm by 87cm, which is the real proportion, and it overlaps the panel
   * frame by a hand's width each side the way a real piece of furniture
   * standing against fusuma does. It also leaves the two slots 9% apart,
   * which is 48px on the smallest scene; at 11 they were 37px and would have
   * failed the reachability rule. */
  var INTERIOR_FIXTURES = [
    {id:"display-shelf", image:"assets/home/decor/display-shelf-staggered-v1.webp",
     x:65.5, y:73, width:15, z:38, label:"違い棚"},
    /* There is deliberately no second fixture. The left fusuma has a slot for
       a shelf - `cabinet-left` below - and the shelf that goes in it is
       bought, so the room starts with one display piece and the other is
       something to earn. */
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

  /* The clone lists its fields, so a new one has to be added here too.
   *
   * `skew` was added to the wall positions and silently did not arrive: the
   * renderer read `slot.skew` from a copy that never carried it, so the angle
   * was always undefined and every scroll stayed square. Nothing failed - the
   * transform simply omitted a term. */
  function cloneSlots(source){
    return source.map(function(slot){
      return {id:slot.id, x:slot.x, y:slot.y, scale:slot.scale || 1,
              skew:slot.skew || 0, kind:slot.kind, label:slot.label,
              // Which piece of furniture this position is on, so the renderer
              // can offer one target for the whole shelf instead of eight.
              surface:slot.surface || null,
              maxWidth:slot.maxWidth || null, maxHeight:slot.maxHeight || null,
              // Same trap as `skew` above: a field left out here is not a
              // missing field at the far end, it is a silently absent one.
              // `z` decides whether a shelf draws behind what stands on it,
              // and `requires` decides whether a plank exists at all.
              z:(slot.z == null ? null : slot.z),
              requires:slot.requires || null};
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
        houseHotspot: {x:43, y:22, width:16, height:31, label:"家に入る"},
        /* The stone path down the middle of the yard is the only ground with
         * no garden slot on it at any row - it is already the visual "way
         * out" toward the viewer, the same reasoning the house hotspot itself
         * uses for the door. A text link back to the map already existed,
         * top-left, but a learner who did not read it as navigation (rather
         * than a title) had no picture-shaped way out symmetric to the one
         * picture-shaped way in. */
        exitHotspot: {x:40, y:84, width:20, height:14, label:"路地へ戻る"}
      },
      interior: {
        background: backgroundFor("interior", "evening"),
        slots: cloneSlots(SLOTS),
        fixtures: INTERIOR_FIXTURES.map(function(f){
          return {id:f.id, image:f.image, x:f.x, y:f.y, width:f.width, z:f.z, label:f.label};
        }),
        /* The open veranda on the left is the one place the painting actually
         * shows the outside - sliding door drawn open, garden visible through
         * it - so it is the room's own equivalent of the yard's door: the
         * spot that already reads as "the way out" before any button is even
         * drawn on it. Kept below y=38 so it does not sit under wall-left or
         * eave, both hung higher on the same strip of wall. */
        exitHotspot: {x:9, y:38, width:15, height:34, label:"庭へ戻る"}
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
