/* Version 3 progress: generic across stages, where version 2 was Inn-specific.
 *
 * Pure and immutable. `app.js` owns storage and rendering; this module only
 * decides what a progress record contains and how an older one becomes a newer
 * one. Migration is written so a learner never loses a medal, completed work or
 * a declined offer by opening the game after an update.
 */
(function(root){
  "use strict";

  var VERSION = 3;

  // Version 2 stored a phase name. The three-day story stores a day, and
  // focused review happens at the end of day 3 rather than on a fourth day.
  var PHASE_DAY = {learn:1, practice:2, challenge:3, review:3};

  function emptyGarden(){
    if(root.LanternHomeGarden && typeof root.LanternHomeGarden.emptyGarden === "function"){
      return root.LanternHomeGarden.emptyGarden();
    }
    return {plants:[], usedCreditIds:[], starterClaimed:false, nextInstanceId:1};
  }

  function emptyProgress(){
    return {
      version: VERSION,
      playerCharacter: null,
      characterSelected: false,
      visited: [],
      starred: [],
      stages: {},
      items: {},
      mistakes: [],
      repairQueue: [],
      mastered: [],
      money: 0,
      paidAnswers: [],
      masteredByStage: {},
      // The room at わが家: what has been bought, and where it stands.
      home: {owned: [], placed: {}},
      homeVisited: false,
      // The place the learner was last in, so the map can open there.
      lastPlace: null,
      houseTier: "starter",
      homeTutorialComplete: false,
      starterSeedClaimed: false,
      starterCushionClaimed: false,
      activeWallpaper: "wallpaper-plain",
      garden: emptyGarden(),
      // Which shifts are finished, which places have been walked into, and any
      // shift left half-done. These are written by saveProgress and were being
      // dropped here, so every one of them was lost on reload.
      episodesDone: [],
      stageStarted: [],
      episode: null,
      // The daily practice layer. Added here at the same time as saveProgress
      // writes them, because last time that was not done these were silently
      // dropped on every reload.
      reviewProgress: {},
      dailyPractice: null,
      streak: 0,
      freezes: 0,
      lastActiveDate: null
    };
  }

  function clone(progress){
    return JSON.parse(JSON.stringify(progress));
  }

  function migrateStage(stored){
    return {
      episode: Number(stored.episode) || 1,
      day: PHASE_DAY[stored.phase] || Number(stored.day) || 1,
      question: Number(stored.index) || Number(stored.question) || 0,
      // Never promote a learner to a medal they did not earn: an absent medal
      // is "none", not a guess derived from how far they happened to get.
      medal: stored.medal || "none",
      mastered: !!stored.mastered,
      declined: !!stored.declined,
      misses: (stored.misses || []).slice(),
      correctWords: (stored.correctWords || []).slice(),
      challengeScore: Number(stored.challengeScore) || 0
    };
  }

  function migrateProgress(stored){
    var next = emptyProgress();
    if(!stored) return next;

    next.visited = (stored.visited || []).slice();
    next.starred = (stored.starred || []).slice();

    next.money = Number(stored.money) || 0;
    next.home = {
      owned: ((stored.home || {}).owned || []).slice(),
      placed: clone((stored.home || {}).placed || {})
    };
    next.homeVisited = stored.homeVisited === true;
    next.lastPlace = stored.lastPlace || null;
    next.houseTier = typeof stored.houseTier === "string" && stored.houseTier ? stored.houseTier : "starter";
    next.homeTutorialComplete = stored.homeTutorialComplete === true;
    next.activeWallpaper = typeof stored.activeWallpaper === "string" && stored.activeWallpaper
      ? stored.activeWallpaper : "wallpaper-plain";

    var gardenSource = stored.garden || emptyGarden();
    var gardenDefault = emptyGarden();
    next.garden = {
      plants: clone(gardenSource.plants || gardenDefault.plants || []),
      usedCreditIds: (gardenSource.usedCreditIds || gardenDefault.usedCreditIds || []).slice(),
      starterClaimed: gardenSource.starterClaimed === true,
      nextInstanceId: Math.max(1, Number(gardenSource.nextInstanceId) || gardenDefault.nextInstanceId || 1)
    };
    var ownsStarterCushion = next.home.owned.some(function(id){
      return id === "floor-cushion-red" || id === "floor-cushion-navy";
    });
    var ownsStarterSeed = next.garden.plants.some(function(plant){
      return plant && plant.typeId === "camellia";
    });
    next.starterSeedClaimed = stored.starterSeedClaimed === true || ownsStarterSeed;
    next.starterCushionClaimed = stored.starterCushionClaimed === true || ownsStarterCushion;
    if(next.starterSeedClaimed) next.garden.starterClaimed = true;

    if(stored.version === VERSION && stored.stages){
      next.characterSelected = stored.characterSelected === true;
      next.playerCharacter = next.characterSelected && stored.playerCharacter === "woman" ? "woman"
        : (next.characterSelected && stored.playerCharacter === "man" ? "man" : null);
      next.stages = clone(stored.stages);
      next.items = clone(stored.items || {});
      next.mistakes = clone(stored.mistakes || []);
      next.repairQueue = (stored.repairQueue || []).slice();
      next.mastered = (stored.mastered || []).slice();
      next.paidAnswers = (stored.paidAnswers || []).slice();
      next.masteredByStage = clone(stored.masteredByStage || {});
      next.episodesDone = (stored.episodesDone || []).slice();
      next.stageStarted = (stored.stageStarted || []).slice();
      next.episode = stored.episode ? clone(stored.episode) : null;
      next.reviewProgress = clone(stored.reviewProgress || {});
      next.dailyPractice = stored.dailyPractice ? clone(stored.dailyPractice) : null;
      next.streak = Number(stored.streak) || 0;
      next.freezes = Number(stored.freezes) || 0;
      next.lastActiveDate = stored.lastActiveDate || null;
      return next;
    }

    next.playerCharacter = null;

    // Version 2 held one hard-coded Inn record under a camelCase key.
    var legacy = stored.stageProgress || {};
    Object.keys(legacy).forEach(function(key){
      var stageKey = key === "homeInn" ? "home-inn" : key;
      next.stages[stageKey] = migrateStage(legacy[key] || {});
    });
    return next;
  }

  function setItemState(progress, id, stateName){
    var next = clone(progress);
    next.items[id] = stateName;
    return next;
  }

  // One record per question, not per attempt: a learner who misses the same
  // item three times should see it once in review, not three times.
  function addMistake(progress, mistake){
    var next = clone(progress);
    var exists = next.mistakes.some(function(entry){ return entry.id === mistake.id; });
    if(!exists) next.mistakes.push(clone(mistake));
    return next;
  }

  function clearMistake(progress, id){
    var next = clone(progress);
    next.mistakes = next.mistakes.filter(function(entry){ return entry.id !== id; });
    return next;
  }

  function getStage(progress, stageKey){
    return (progress.stages || {})[stageKey];
  }

  root.LanternProgress = {
    VERSION: VERSION,
    emptyProgress: emptyProgress,
    migrateProgress: migrateProgress,
    setItemState: setItemState,
    addMistake: addMistake,
    clearMistake: clearMistake,
    getStage: getStage
  };
})(typeof self !== "undefined" ? self : this);
