/* Lantern Alley service worker.
 *
 * Strategy: cache-first for the app shell, because the game is fully offline
 * once loaded - there is no server to be fresher than. Updates arrive by
 * bumping CACHE_VERSION, which discards every older cache on activate.
 *
 * Bump CACHE_VERSION whenever any shell file changes, or returning players
 * will keep the old build.
 */
var CACHE_VERSION = "lantern-alley-v40";

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
  "./audio-index.js",
  "./lantern-map.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./assets/kon/kon-idle.webp",
  "./assets/kon/kon-wave-left.webp",
  "./assets/kon/kon-wave-right.webp",
  "./assets/kon/kon-wave-both.webp",
  "./assets/inn/room-empty-v4.png",
  "./assets/inn/room-objects-v2.png",
  "./assets/map/lantern-alley-map-v1.jpg",
  "./assets/entrance/wooden-gate-v1.png",
  "./assets/entrance/player-actions-v1.png",
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
