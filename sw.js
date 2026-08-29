/* Lantern Alley service worker.
 *
 * Strategy: cache-first for the app shell, because the game is fully offline
 * once loaded - there is no server to be fresher than. Updates arrive by
 * bumping CACHE_VERSION, which discards every older cache on activate.
 *
 * Bump CACHE_VERSION whenever any shell file changes, or returning players
 * will keep the old build.
 */
var CACHE_VERSION = "lantern-alley-v156";

// audio-index.js assigns to `self`, so the worker and the page share one list
// of clip paths. Importing it here means new lines are cached automatically
// after regenerating audio - no second list to keep in sync.
importScripts("./audio-index.js");

var SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./entrance-stage-logic.js",
  "./moonview-inn-interactions.js",
  "./n2-home-inn-stage.js",
  "./n2-inn-episodes.js",
  "./n2-market-episodes.js",
  "./n2-teahouse-episodes.js",
  "./n2-station-episodes.js",
  "./n2-shrine-episodes.js",
  "./audio-index.js",
  "./lantern-map.js",
  "./curriculum-catalog.js",
  "./learning-content.js",
  "./review-engine.js",
  "./learning-progress.js",
  "./learning-economy.js",
  "./learning-gloss.js",
  "./home-room.js",
  "./home-decor.js",
  "./home-garden.js",
  "./home-pet.js",
  // The house and yard. A learner who installed the game offline and
  // walks home to a broken image has lost the reward, not a decoration.
  "./assets/home/exterior/open-house-yard-v1.webp",
  "./assets/home/interior/starter-room-v1.webp",
  "./assets/home/decor/floor-cushion-navy-v1.webp",
  "./assets/home/decor/rug-plain-v1.webp",
  "./assets/home/decor/bonsai-green-v1.webp",
  "./assets/home/decor/low-table-round-v1.webp",
  "./assets/home/decor/paper-lantern-red-v1.webp",
  "./assets/home/decor/hanging-scroll-bamboo-v1.webp",
  "./assets/home/decor/maneki-neko-v1.webp",
  "./assets/home/decor/wind-chime-blue-v1.webp",
  "./assets/home/decor/kotatsu-blue-v1.webp",
  "./assets/home/decor/daruma-red-v1.webp",
  "./assets/home/decor/folding-screen-cranes-v1.webp",
  "./assets/home/decor/floor-lantern-v1.webp",
  "./assets/home/decor/chrysanthemum-pot-v1.webp",
  "./assets/home/decor/sakura-bonsai-v1.webp",
  "./assets/home/decor/pine-bonsai-v1.webp",
  "./assets/home/decor/wallpaper-asanoha-blue-v1.webp",
  "./assets/home/garden/camellia-planted-v1.webp",
  "./assets/home/garden/camellia-sprout-v1.webp",
  "./assets/home/garden/camellia-growing-v1.webp",
  "./assets/home/garden/camellia-mature-v1.webp",
  "./assets/home/garden/sakura-planted-v1.webp",
  "./assets/home/garden/sakura-sprout-v1.webp",
  "./assets/home/garden/sakura-sapling-v1.webp",
  "./assets/home/garden/sakura-young-v1.webp",
  "./assets/home/garden/sakura-mature-v1.webp",
  "./assets/home/garden/maple-planted-v1.webp",
  "./assets/home/garden/maple-sprout-v1.webp",
  "./assets/home/garden/maple-sapling-v1.webp",
  "./assets/home/garden/maple-young-v1.webp",
  "./assets/home/garden/maple-mature-v1.webp",
  "./assets/home/pet/calico-walk-v1.webp",
  "./assets/home/pet/calico-transitions-v1.webp",
  "./assets/home/pet/calico-idles-v1.webp",
  "./assets/home/pet/calico-interactions-v1.webp",
  "./daily-practice.js",
  "./review-mode.js",
  "./question-renderer.js",
  "./catalog-practice.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/kon/kon-idle.webp",
  "./assets/kon/kon-wave-left.webp",
  "./assets/kon/kon-wave-right.webp",
  "./assets/kon/kon-wave-both.webp",
  "./assets/inn/room-empty-v4.webp",
  "./assets/inn/room-objects-v2.webp",
  "./assets/inn/sheet-stained-messy-v1.webp",
  "./assets/inn/scenes/guest-room.jpg",
  "./assets/inn/scenes/lobby.jpg",
  "./assets/inn/scenes/kitchen.jpg",
  "./assets/inn/scenes/dining-hall.jpg",
  "./assets/inn/scenes/hallway.jpg",
  "./assets/inn/scenes/office.jpg",
  "./assets/inn/scenes/courtyard.jpg",
  "./assets/map/lantern-alley-map-v1.jpg",
  "./assets/entrance/wooden-gate-v1.webp",
  "./assets/entrance/player-actions-v1.webp",
  "./assets/entrance/player-actions-woman-v1.webp",
  "./assets/fox/fox-neutral-idle-transparent-v2.webp",
  "./assets/fox/fox-neutral-no-mouth-transparent.webp",
  "./assets/fox/fox-wave-closed-smile-transparent-v2.webp",
  "./assets/fox/fox-wave-small-open-mouth-transparent-v2.webp",
  "./assets/fox/fox-wave-konnichiwa-mouth-transparent-v2.webp",
  "./assets/fox/fox-invite-bow-transparent-v2.webp",
  "./assets/fox/fox-celebration-transparent-v2.webp",
  "./assets/fox/fox-try-again-transparent-v2.webp",
  "./assets/fox/fox-listening-transparent-v2.webp"
];

Object.keys(self.LanternAlleyAudio || {}).forEach(function(line){
  SHELL.push("./" + self.LanternAlleyAudio[line]);
});

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      // addAll fails the whole install if any single file 404s, which is the
      // behaviour we want: a half-cached shell breaks offline in confusing ways.
      return cache.addAll(SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.map(function(name){
        return name === CACHE_VERSION ? null : caches.delete(name);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event){
  var request = event.request;

  // Only handle same-origin GETs. Google Fonts and anything else falls through
  // to the network untouched.
  if(request.method !== "GET") return;
  if(new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(function(hit){
      if(hit) return hit;
      return fetch(request).then(function(response){
        // Cache successful same-origin responses so later visits work offline.
        if(response && response.status === 200 && response.type === "basic"){
          var copy = response.clone();
          caches.open(CACHE_VERSION).then(function(cache){ cache.put(request, copy); });
        }
        return response;
      }).catch(function(){
        // Offline and uncached: for a page request, fall back to the shell.
        if(request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    })
  );
});
