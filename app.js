(function(){
  "use strict";

  var STORAGE_KEY = "lanternAlley.v2";
  // Version 3 is the record that is written from now on. The v2 key is still
  // read once, so a learner who left mid-stage before this change keeps their
  // medal and their place.
  var STORAGE_KEY_V3 = "lanternAlley.v3";

  var locations = [
    {
      key:"entrance",
      name:"Alley Entrance",
      icon:"🏮",
      pos:{x:12, y:80},
      label:"The Alley Entrance",
      interactiveDuo:true,
      narration:"提灯に明かりがともり、小さな狐のコンが木箱の上から声をかけます。",
      jp:"まず、私にお辞儀してください。",
      romaji:"Mazu, watashi ni ojigi shite kudasai.",
      meaning:"お辞儀をしてください。",
      hint:"「お辞儀」は、体を前に傾ける日本のあいさつです。",
      type:"choice",
      // Not answer-first, even here. This is the learner's first question, and
      // it should not teach that the answer lives at the top. Correctness is
      // decided by key, so the order is free.
      options:[
        {key:"wave", emoji:"👋", label:"Wave"},
        {key:"bow", emoji:"🙇", label:"Bow"},
        {key:"clap", emoji:"👏", label:"Clap"}
      ],
      correct:"bow",
      followUpCorrect:{
        jp:"上手です！日本語を聞いて行動できました。これから路地を歩いて、行きたい場所を選んでください。",
        romaji:"Jouzu desu! Nihongo o kiite koudou dekimashita. Kore kara roji o aruite, ikitai basho o erande kudasai.",
        meaning:""
      },
      followUpWrong:{
        jp:"んー、ちがいますね。もう一度どうぞ。",
        romaji:"N-, chigaimasu ne. Mou ichido douzo.",
        meaning:""
      }
    }
  ];
  locations.push(N2HomeInnStage);

  // The four later places have no room to walk into - their whole stage is the
  // episode - so their location entry is only an identity for the map to enter
  // and for progress to be filed under. The name comes from the map so there
  // is one place where a location is named.
  // わが家 is a place on the map but not a stage: no episodes, no gauge.
  locations.push({key:"home", name:"わが家", isHome:true});

  ["market", "tea-house", "station", "shrine"].forEach(function(key){
    var place = LanternAlleyMap.getDestination(key);
    locations.push({key:key, name:(place && place.name) || key, episodesOnly:true});
  });

  var KON_PHOTO_WAVE_L = "assets/kon/kon-wave-left.webp";
  var KON_PHOTO_WAVE_R = "assets/kon/kon-wave-right.webp";
  var KON_PHOTO_WAVE_BOTH = "assets/kon/kon-wave-both.webp";
  var KON_PHOTO_SRC = "assets/kon/kon-idle.webp";

  var PLAYER_ACTION_SPRITES = {
    man:"assets/entrance/player-actions-v1.webp",
    woman:"assets/entrance/player-actions-woman-v1.webp"
  };
  function playerActionSprite(){
    return PLAYER_ACTION_SPRITES[state.playerCharacter] || PLAYER_ACTION_SPRITES.man;
  }

  var ENTRANCE_FOX_POSES = {
    idle:"assets/fox/fox-neutral-idle-transparent-v2.webp",
    talkBase:"assets/fox/fox-neutral-no-mouth-transparent.webp",
    waveClosed:"assets/fox/fox-wave-closed-smile-transparent-v2.webp",
    waveSmall:"assets/fox/fox-wave-small-open-mouth-transparent-v2.webp",
    waveOpen:"assets/fox/fox-wave-konnichiwa-mouth-transparent-v2.webp",
    invite:"assets/fox/fox-invite-bow-transparent-v2.webp",
    celebrate:"assets/fox/fox-celebration-transparent-v2.webp",
    tryAgain:"assets/fox/fox-try-again-transparent-v2.webp",
    listen:"assets/fox/fox-listening-transparent-v2.webp"
  };
  var activeFoxEl = null;
  var activeFoxImgEl = null;
  var innInteractionState = null;
  // Item chosen by tapping, waiting for a destination tap.
  var roomPick = null;
  var waveTimer = null;
  var waveFrameIndex = 0;
  var WAVE_FRAME_SETS = null;
  var entranceSpeechEndPose = "idle";
  var entranceTutorialState = null;
  var konResponseTimer = null;

  function usesTransparentFox(){
    var loc = getLocation(state.currentKey);
    return LanternAlleyLogic.shouldUseTransparentFox(state.currentKey, !!(loc && loc.encounters));
  }

  function setEntranceFoxPose(pose){
    if(!usesTransparentFox() || !activeFoxImgEl) return;
    var src = ENTRANCE_FOX_POSES[pose] || ENTRANCE_FOX_POSES.idle;
    if(activeFoxImgEl.getAttribute("src") !== src) activeFoxImgEl.src = src;
  }

  function startWave(mode){
    if(!activeFoxImgEl) return;
    if(usesTransparentFox()){
      if(waveTimer){ clearInterval(waveTimer); waveTimer = null; }
      entranceSpeechEndPose = LanternAlleyLogic.getSpeechEndPose(mode);
      setEntranceFoxPose("talkBase");
      return;
    }
    if(!WAVE_FRAME_SETS){
      WAVE_FRAME_SETS = {
        ask:[
          KON_PHOTO_SRC, KON_PHOTO_SRC,
          KON_PHOTO_WAVE_R, KON_PHOTO_WAVE_R, KON_PHOTO_WAVE_R,
          KON_PHOTO_SRC,
          KON_PHOTO_WAVE_L, KON_PHOTO_WAVE_L, KON_PHOTO_WAVE_L
        ],
        correct:[
          KON_PHOTO_WAVE_BOTH, KON_PHOTO_WAVE_BOTH, KON_PHOTO_WAVE_BOTH,
          KON_PHOTO_WAVE_R, KON_PHOTO_WAVE_R,
          KON_PHOTO_WAVE_BOTH, KON_PHOTO_WAVE_BOTH, KON_PHOTO_WAVE_BOTH,
          KON_PHOTO_WAVE_L, KON_PHOTO_WAVE_L
        ],
        wrong:[KON_PHOTO_SRC]
      };
    }
    if(waveTimer){ clearInterval(waveTimer); waveTimer = null; }
    var frames = WAVE_FRAME_SETS[mode] || WAVE_FRAME_SETS.ask;
    var intervalMs = mode === "correct" ? 240 : (mode === "wrong" ? 260 : 320);
    waveFrameIndex = 0;
    var imgEl = activeFoxImgEl;
    imgEl.src = frames[0];
    if(frames.length > 1){
      waveTimer = setInterval(function(){
        waveFrameIndex = (waveFrameIndex + 1) % frames.length;
        imgEl.src = frames[waveFrameIndex];
      }, intervalMs);
    }
  }

  function stopWave(){
    if(waveTimer){ clearInterval(waveTimer); waveTimer = null; }
    if(usesTransparentFox()){
      setEntranceFoxPose(entranceSpeechEndPose);
    }else if(activeFoxImgEl){
      activeFoxImgEl.src = KON_PHOTO_SRC;
    }
  }

  var LOCATION_KEYS = locations.map(function(l){ return l.key; });
  var CHALLENGE_KEYS = LOCATION_KEYS.filter(function(k){ return k !== "festival"; });

  function emptyGardenState(){
    if(typeof LanternHomeGarden !== "undefined" && typeof LanternHomeGarden.emptyGarden === "function"){
      return LanternHomeGarden.emptyGarden();
    }
    return {plants:[], usedCreditIds:[], starterClaimed:false, nextInstanceId:1};
  }

  var state = {
    currentKey:null,
    playerCharacter:null,
    characterSelected:false,
    mistakesThisVisit:0,
    romajiOn:true,
    voiceOn:true,
    selected:0,
    answered:false,
    acting:false,
    encounterIndex:0,
    stagePhase:"learn",
    phaseItems:null,
    challengeScore:0,
    challengeCorrectWords:{},
    challengeMisses:[],
    stageMastered:false,
    resumedStageEntry:false,
    stageDeclined:false,
    resumedAfterDecline:false,
    stageProgress:{homeInn:null},
    visited:{},
    starred:{},
    money:0,
    paidAnswers:[],
    masteredByStage:{},
    home:{owned:[], placed:{}},
    homeVisited:false,
    houseTier:"starter",
    homeTutorialComplete:false,
    starterSeedClaimed:false,
    starterCushionClaimed:false,
    activeWallpaper:"wallpaper-plain",
    garden:emptyGardenState()
  };

  var jpVoice = null;
  function initVoices(){
    if(!("speechSynthesis" in window)) return;
    function pick(){
      var voices = window.speechSynthesis.getVoices();
      for(var i=0;i<voices.length;i++){
        if(voices[i].lang && voices[i].lang.toLowerCase().indexOf("ja") === 0){
          jpVoice = voices[i]; break;
        }
      }
    }
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
  }
  initVoices();

  var currentClip = null;
  var dialogueFlow = null;

  function stopCurrentVoice(){
    if(currentClip){
      currentClip.pause();
      currentClip = null;
    }
    if("speechSynthesis" in window) window.speechSynthesis.cancel();
    if(activeFoxEl) activeFoxEl.classList.remove("talking");
    stopWave();
  }

  // Pre-rendered neural audio, when we have a clip for this exact line.
  // Falls back to speechSynthesis, which on iOS often has no Japanese voice
  // at all - and the Challenge phase is audio-only, so that would be fatal.
  function playClip(text, mode){
    var src = window.LanternAlleyAudio && window.LanternAlleyAudio[text];
    if(!src) return false;

    if(currentClip){
      currentClip.pause();
      currentClip = null;
    }
    if("speechSynthesis" in window) window.speechSynthesis.cancel();

    var audio = new Audio(src);
    audio.preload = "auto";
    currentClip = audio;

    var fox = activeFoxEl;
    var stopTalk = function(){
      if(fox) fox.classList.remove("talking");
      stopWave();
    };
    if(fox){
      audio.addEventListener("playing", function(){ fox.classList.add("talking"); startWave(mode); });
      audio.addEventListener("error", stopTalk);
    }
    audio.addEventListener("ended", function(){
      stopTalk();
      currentClip = null;
      if(dialogueFlow) dialogueFlow.voiceFinished();
    });

    var started = audio.play();
    if(started && started.catch){
      started.catch(function(){
        // Autoplay blocked (iOS before a gesture) or the file is missing.
        stopTalk();
        currentClip = null;
        speakWithSynthesis(text, mode);
      });
    }
    return true;
  }

  // `displayText` lets the audio and the written line differ. Day 3 speaks the
  // request but must show 「音声を聞いてください。」; without this the reveal
  // typed out the sentence the learner is supposed to be listening for.
  function speak(text, mode, isReplay, displayText){
    mode = mode || "ask";
    if(dialogueFlow){
      if(isReplay) dialogueFlow.replay(state.voiceOn);
      else dialogueFlow.start(displayText === undefined ? text : displayText, state.voiceOn);
    }
    if(!state.voiceOn) return;
    if(playClip(text, mode)) return;
    speakWithSynthesis(text, mode);
  }

  // A completed reply waits for the learner. During speech, the first click
  // reveals the line; only the following click can run this continuation.
  function afterSpeech(next, fallbackDelay){
    var fired = false;
    function once(){
      if(fired) return;
      fired = true;
      next();
    }
    if(dialogueFlow) dialogueFlow.setContinuation(once);
    // The voice may never report finishing: a clip can 404, autoplay can be
    // blocked before the first gesture, the tab can be muted, or synthesis can
    // have no Japanese voice. Waiting only on the voice strands the player on a
    // correct answer with no way forward, so always arm a fallback.
    setTimeout(once, (fallbackDelay || 2600) + 6000);
  }

  function speakWithSynthesis(text, mode){
    mode = mode || "ask";
    if(!state.voiceOn) return;
    if(!("speechSynthesis" in window)){
      var dur = Math.min(4000, Math.max(900, text.length * 90));
      if(activeFoxEl){ activeFoxEl.classList.add("talking"); startWave(mode); }
      setTimeout(function(){
        if(activeFoxEl) activeFoxEl.classList.remove("talking");
        stopWave();
        if(dialogueFlow) dialogueFlow.voiceFinished();
      }, dur);
      return;
    }
    try{
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = 0.82;
      u.pitch = 1.0;
      if(jpVoice) u.voice = jpVoice;
      if(activeFoxEl){
        var fox = activeFoxEl;
        u.onstart = function(){ fox.classList.add("talking"); startWave(mode); };
        var stopTalk = function(){
          fox.classList.remove("talking");
          stopWave();
          if(dialogueFlow) dialogueFlow.voiceFinished();
        };
        u.onend = stopTalk;
        u.onerror = stopTalk;
      }else{
        u.onend = function(){ if(dialogueFlow) dialogueFlow.voiceFinished(); };
        u.onerror = u.onend;
      }
      window.speechSynthesis.speak(u);
    }catch(e){ /* speech unsupported, text remains visible */ }
  }

  // Read v3 if it exists, otherwise migrate the v2 record once. Everything the
  // rest of the app touches still arrives in the shape it expects; only the
  // stored form changes, plus the episode block v2 had nowhere to put.
  function loadProgress(){
    try{
      var rawV3 = localStorage.getItem(STORAGE_KEY_V3);
      if(rawV3){
        var storedV3 = JSON.parse(rawV3);
        pendingLegacyMasteryHydration = !Object.prototype.hasOwnProperty.call(storedV3, "masteredByStage");
        var v3 = LanternProgress.migrateProgress(storedV3);
        savedEpisode = v3.episode || null;
        pendingEpisodesDone = {};
        (v3.episodesDone || []).forEach(function(id){ pendingEpisodesDone[id] = true; });
        pendingStageStarted = {};
        (v3.stageStarted || []).forEach(function(key){ pendingStageStarted[key] = true; });
        pendingItemStates = v3.items || {};
        pendingMoney = v3.money || 0;
        pendingPaidAnswers = v3.paidAnswers || [];
        pendingMasteredByStage = v3.masteredByStage || {};
        pendingHome = v3.home || {owned:[], placed:{}};
        pendingHomeVisited = v3.homeVisited === true;
        pendingHouseTier = v3.houseTier || "starter";
        pendingHomeTutorialComplete = v3.homeTutorialComplete === true;
        pendingStarterSeedClaimed = v3.starterSeedClaimed === true;
        pendingStarterCushionClaimed = v3.starterCushionClaimed === true;
        pendingActiveWallpaper = v3.activeWallpaper || "wallpaper-plain";
        pendingGarden = v3.garden || emptyGardenState();
        pendingLastPlace = v3.lastPlace || null;
        pendingReviewProgress = v3.reviewProgress || {};
        pendingDaily = {
          dailyPractice: v3.dailyPractice || null,
          streak: v3.streak || 0,
          freezes: v3.freezes || 0,
          lastActiveDate: v3.lastActiveDate || null
        };
        return legacyViewOf(v3);
      }
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      var migrated = LanternProgress.migrateProgress(JSON.parse(raw));
      pendingItemStates = migrated.items || {};
      pendingMoney = migrated.money || 0;
      pendingPaidAnswers = migrated.paidAnswers || [];
      pendingMasteredByStage = migrated.masteredByStage || {};
      pendingHome = migrated.home || {owned:[], placed:{}};
      pendingHomeVisited = migrated.homeVisited === true;
      pendingHouseTier = migrated.houseTier || "starter";
      pendingHomeTutorialComplete = migrated.homeTutorialComplete === true;
      pendingStarterSeedClaimed = migrated.starterSeedClaimed === true;
      pendingStarterCushionClaimed = migrated.starterCushionClaimed === true;
      pendingActiveWallpaper = migrated.activeWallpaper || "wallpaper-plain";
      pendingGarden = migrated.garden || emptyGardenState();
      savedEpisode = null;
      migratedFromV2 = true;
      return legacyViewOf(migrated);
    }catch(e){ return null; }
  }

  // The day flow reads state.stageProgress.homeInn. v3 stores the same facts
  // under the stage key the map uses, so translate rather than rewrite the
  // controller - the two shapes carry identical information.
  var PHASE_FOR_DAY = {1:"learn", 2:"practice", 3:"challenge"};

  function legacyViewOf(v3){
    var inn = (v3.stages || {})["home-inn"];
    return {
      playerCharacter: v3.playerCharacter || null,
      characterSelected: v3.characterSelected === true,
      visited: v3.visited || [],
      starred: v3.starred || [],
      stageProgress: {homeInn: inn ? {
        phase: inn.phase || PHASE_FOR_DAY[inn.day] || "learn",
        index: inn.question || 0,
        challengeScore: inn.challengeScore || 0,
        correctWords: inn.correctWords || [],
        misses: inn.misses || [],
        mastered: !!inn.mastered,
        declined: !!inn.declined,
        medal: inn.medal || "none"
      } : null}
    };
  }
  function saveProgress(){
    try{
      if(state.currentKey === "home-inn"){
        state.stageProgress.homeInn = {
          phase:state.stagePhase,
          index:state.encounterIndex,
          challengeScore:state.challengeScore,
          correctWords:Object.keys(state.challengeCorrectWords),
          misses:state.challengeMisses.map(function(item){ return item.focusWord; }),
          mastered:state.stageMastered,
          declined:state.stageDeclined,
          medal:state.stageMastered ? "gold" : (state.stagePhase === "challenge" || state.stagePhase === "review" ? "silver" : (state.stagePhase === "practice" ? "bronze" : "none"))
        };
      }
      var inn = state.stageProgress.homeInn;
      localStorage.setItem(STORAGE_KEY_V3, JSON.stringify({
        version: LanternProgress.VERSION,
        playerCharacter: state.playerCharacter,
        characterSelected: state.characterSelected,
        visited: Object.keys(state.visited),
        starred: Object.keys(state.starred),
        stages: inn ? {"home-inn": {
          episode: 1,
          phase: inn.phase,
          day: {learn:1, practice:2, challenge:3, review:3}[inn.phase] || 1,
          question: inn.index,
          challengeScore: inn.challengeScore,
          correctWords: inn.correctWords,
          misses: inn.misses,
          mastered: inn.mastered,
          declined: inn.declined,
          medal: inn.medal
        }} : {},
        // The shift and its correction queue: memory-only until now, so a
        // reload during an episode threw away the whole hour.
        episode: savedEpisode,
        reviewProgress: state.reviewProgress || {},
        dailyPractice: state.dailyPractice || null,
        streak: state.streak || 0,
        freezes: state.freezes || 0,
        lastActiveDate: state.lastActiveDate || null,
        episodesDone: Object.keys(state.episodesDone || {}),
        stageStarted: Object.keys(state.stageStarted || {}),
        items: state.itemStates || {},
        mistakes: [],
        repairQueue: savedEpisode ? (savedEpisode.repairQueue || []) : []
        ,money: state.money || 0
        ,paidAnswers: state.paidAnswers || []
        ,masteredByStage: state.masteredByStage || {}
        ,home: state.home || {owned:[], placed:{}}
        ,homeVisited: state.homeVisited === true
        ,houseTier: state.houseTier || "starter"
        ,homeTutorialComplete: state.homeTutorialComplete === true
        ,starterSeedClaimed: state.starterSeedClaimed === true
        ,starterCushionClaimed: state.starterCushionClaimed === true
        ,activeWallpaper: state.activeWallpaper || "wallpaper-plain"
        ,garden: state.garden || emptyGardenState()
        ,lastPlace: state.lastPlace || null
      }));
    }catch(e){ /* storage unavailable, progress just won't persist */ }
  }
  function applyProgress(data){
    state.visited = {};
    state.starred = {};
    state.stageProgress = {homeInn:null};
    state.playerCharacter = data ? (data.playerCharacter || null) : null;
    state.characterSelected = data ? data.characterSelected === true : false;
    if(!data){
      state.money = 0;
      state.paidAnswers = [];
      state.masteredByStage = {};
      state.home = {owned:[], placed:{}};
      state.homeVisited = false;
      state.houseTier = "starter";
      state.homeTutorialComplete = false;
      state.starterSeedClaimed = false;
      state.starterCushionClaimed = false;
      state.activeWallpaper = "wallpaper-plain";
      state.garden = emptyGardenState();
      state.lastPlace = null;
      state.itemStates = {};
      state.episodesDone = {};
      state.stageStarted = {};
    }
    if(!data) return;
    (data.visited || []).forEach(function(k){ state.visited[k] = true; });
    (data.starred || []).forEach(function(k){ state.starred[k] = true; });
    if(data.stageProgress && data.stageProgress.homeInn){
      state.stageProgress.homeInn = data.stageProgress.homeInn;
    }
  }

  function saveStageProgress(){ saveProgress(); }

  function starCount(){ return Object.keys(state.starred).length; }
  function visitedCount(){ return Object.keys(state.visited).length; }
  function allChallengesVisited(){
    return CHALLENGE_KEYS.every(function(k){ return state.visited[k]; });
  }

  var $ = function(id){ return document.getElementById(id); };

  var dialoguePanel = $("dialogue-panel");
  var dialogueContinue = $("dialogue-continue");
  /* ---- Reading aid: tap a word for its reading and meaning ----
   *
   * Being stuck on one kanji in the middle of a request loses the whole
   * request, and "you got it wrong" teaches nothing about why.
   *
   * Applied only once a line has finished revealing. While Kon is still
   * speaking the line is plain text, because the reveal writes it a character
   * at a time and buttons cannot be built a character at a time.
   */
  var glossIndex = null;
  var glossExclusions = {};

  function glossReady(){
    if(typeof LanternGloss === "undefined" || typeof LanternCurriculumCatalog === "undefined") return false;
    if(!glossIndex) glossIndex = LanternGloss.buildIndex(LanternCurriculumCatalog);
    return true;
  }

  function setGlossQuestion(question){
    glossExclusions = glossReady() && question
      ? LanternGloss.exclusionsFor(question, LanternCurriculumCatalog)
      : {};
  }

  function glossHtml(text){
    if(!glossReady()) return null;
    return LanternGloss.annotate(text, glossIndex, glossExclusions);
  }

  function hideGlossBubble(){
    var open = document.querySelectorAll(".gloss-bubble");
    Array.prototype.forEach.call(open, function(node){
      if(node.parentNode) node.parentNode.removeChild(node);
    });
    var lit = document.querySelectorAll(".gloss.is-open");
    Array.prototype.forEach.call(lit, function(node){ node.classList.remove("is-open"); });
  }

  function showGlossBubble(button){
    hideGlossBubble();
    var reading = button.getAttribute("data-reading") || "";
    var meaning = button.getAttribute("data-meaning") || "";
    if(!reading && !meaning) return;
    var bubble = document.createElement("span");
    bubble.className = "gloss-bubble";
    bubble.innerHTML = '<b class="gloss-reading"></b><span class="gloss-meaning"></span>';
    bubble.querySelector(".gloss-reading").textContent = reading;
    bubble.querySelector(".gloss-meaning").textContent = meaning;
    button.classList.add("is-open");
    button.appendChild(bubble);
  }

  // One delegated handler on the document: glossed words live inside the
  // dialogue and inside the reading panel, both of which are rebuilt often,
  // and this runs before the screen element itself is resolved.
  document.addEventListener("click", function(event){
    var target = event.target;
    var button = target && target.closest ? target.closest(".gloss") : null;
    if(button){
      // Tapping the dialogue normally advances it. A word is not an advance.
      event.stopPropagation();
      event.preventDefault();
      if(button.classList.contains("is-open")) hideGlossBubble();
      else showGlossBubble(button);
      return;
    }
    hideGlossBubble();
  }, true);

  dialogueFlow = LanternAlleyLogic.createDialogueFlow({
    render:function(visible, phase){
      var line = $("jp-line");
      var marked = phase === "speaking" ? null : glossHtml(visible);
      // Mid-reveal the line is plain text; finished, it becomes tappable.
      if(marked === null) line.textContent = visible;
      else line.innerHTML = marked;
      dialoguePanel.classList.toggle("dialogue-speaking", phase === "speaking");
      dialoguePanel.classList.toggle("dialogue-ready", phase === "ready");
      dialogueContinue.textContent = phase === "speaking" ? "»" : (phase === "ready" ? "▼" : "");
      var actionable = phase === "speaking" || phase === "ready";
      dialoguePanel.tabIndex = actionable ? 0 : -1;
      dialoguePanel.setAttribute("aria-label", phase === "speaking" ? "コンの話を最後まで表示" : (phase === "ready" ? "次へ進む" : "コンの会話"));
    },
    stopVoice:stopCurrentVoice,
    schedule:function(next, delay){ return setTimeout(next, delay); },
    cancelSchedule:function(timer){ clearTimeout(timer); }
  });

  dialoguePanel.addEventListener("click", function(){ dialogueFlow.activate(); });
  dialoguePanel.addEventListener("keydown", function(event){
    if(event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    dialogueFlow.activate();
  });

  var screenTitle = $("screen-title");
  var screenCharacter = $("screen-character");
  var screenMap = $("screen-map");
  var screenGame = $("screen-game");
  var selectedMapKey = "home-inn";
  var selectedMapAction = null;
  // The episode as it stood at the last save: which question, what was missed,
  // and the correction queue if the round had started.
  var savedEpisode = null;

  /* Which place the learner was last in.
   *
   * The resume machinery has always worked and has always been invisible: it
   * fires when someone walks back into the place they left, and nothing ever
   * told them which place that was. The map opened on a hardcoded default, so
   * a learner halfway through a market shift came back looking at the finished
   * inn. This is the one fact needed to point them at their own unfinished
   * work. */
  var pendingLastPlace = null;
  var pendingEpisodesDone = {};
  var pendingStageStarted = {};
  var pendingReviewProgress = {};
  var pendingDaily = {dailyPractice:null, streak:0, freezes:0, lastActiveDate:null};
  var migratedFromV2 = false;
  var pendingItemStates = {};
  var pendingMoney = 0;
  var pendingPaidAnswers = [];
  var pendingMasteredByStage = {};
  var pendingHome = {owned:[], placed:{}};
  var pendingHomeVisited = false;
  var pendingHouseTier = "starter";
  var pendingHomeTutorialComplete = false;
  var pendingStarterSeedClaimed = false;
  var pendingStarterCushionClaimed = false;
  var pendingActiveWallpaper = "wallpaper-plain";
  var pendingGarden = emptyGardenState();
  var pendingLegacyMasteryHydration = false;
  var mapDetailAction = $("map-detail-action");

  screenGame.addEventListener("click", function(event){
    var target = event.target;
    var controlSelector = "button, a, input, select, textarea, summary, label, [role='button'], [contenteditable='true'], [draggable='true']";
    var isExplicitControl = !!(target && target.closest && target.closest(controlSelector));
    dialogueFlow.activateFromSurface(isExplicitControl);
  });

  var saved = loadProgress();
  applyProgress(saved);
  state.itemStates = pendingItemStates;
  state.episodesDone = pendingEpisodesDone;
  state.stageStarted = pendingStageStarted;
  state.money = pendingMoney;
  state.paidAnswers = pendingPaidAnswers;
  state.masteredByStage = pendingMasteredByStage;
  state.home = pendingHome;
  state.homeVisited = pendingHomeVisited;
  state.houseTier = pendingHouseTier;
  state.homeTutorialComplete = pendingHomeTutorialComplete;
  state.starterSeedClaimed = pendingStarterSeedClaimed;
  state.starterCushionClaimed = pendingStarterCushionClaimed;
  state.activeWallpaper = pendingActiveWallpaper;
  state.garden = pendingGarden;
  state.lastPlace = pendingLastPlace;
  // Open the map where the learner actually was, not on a fixed default.
  if(state.lastPlace && LanternAlleyMap.getDestination(state.lastPlace)){
    selectedMapKey = state.lastPlace;
  }
  state.reviewProgress = pendingReviewProgress;
  state.dailyPractice = pendingDaily.dailyPractice;
  state.streak = pendingDaily.streak;
  state.freezes = pendingDaily.freezes;
  state.lastActiveDate = pendingDaily.lastActiveDate;
  if(pendingLegacyMasteryHydration) hydrateCompletedMastery();
  // Write the migrated record once, so the v2 shape is converted rather than
  // re-read on every load. The v2 key is left alone: if this build is rolled
  // back, that record is still the learner's progress.
  if(migratedFromV2) saveProgress();
  if(visitedCount() > 0){
    var note = $("progress-note");
    note.hidden = false;
    note.textContent = "コンが覚えています　訪れた場所 " + visitedCount() + "/" + locations.length +
      "　星 " + starCount();
    $("btn-start").textContent = "路地へ戻る";
    $("btn-restart").hidden = false;
  }

  $("btn-start").addEventListener("click", function(){
    // The alley opens at its entrance. Sending a first-time player straight
    // there means Kon explains the game before they are asked to choose a
    // destination from a map that means nothing to them yet. Once they have
    // been through it, the map is the more useful landing screen.
    if(!state.characterSelected || !state.playerCharacter){ showCharacterSelection(); return; }
    if(!state.visited.entrance) enterLocation("entrance");
    else showMap();
  });
  /* The attribution screen. Required rather than decorative: the EDRDG licence
   * covering JMdict and KANJIDIC2 asks an application to carry acknowledgement
   * on a dedicated screen - an About menu rather than a splash. The catalogue
   * here is derived from that data through OpenJLPT. */
  (function(){
    var panel = $("about-panel");
    var open = $("btn-about");
    var close = $("btn-about-close");
    if(!panel || !open || !close) return;
    function show(visible){
      panel.hidden = !visible;
      /* The dialogue already says aria-modal, which hides the page behind it
       * from a screen reader. Tab did not agree: the two title buttons stayed
       * in the tab order underneath, so a keyboard could walk out of a modal
       * it could not see. inert takes them out of reach and out of the
       * accessibility tree together. */
      [open, document.getElementById("btn-start")].forEach(function(node){
        if(!node) return;
        if(visible) node.setAttribute("inert", "");
        else node.removeAttribute("inert");
      });
      if(visible) close.focus(); else open.focus();
    }
    open.addEventListener("click", function(){ show(true); });
    close.addEventListener("click", function(){ show(false); });
    panel.addEventListener("click", function(event){
      if(event.target === panel) show(false);   // tapping the backdrop closes it
    });
    document.addEventListener("keydown", function(event){
      if(event.key === "Escape" && !panel.hidden) show(false);
    });
  })();

  /* ---- Review mode ----
   *
   * The owner reviews the Japanese in place, because whether a line fits the
   * speaker and the moment cannot be judged from a list of sentences. This
   * jumps straight to any question with the clock off and a note field.
   */
  var reviewMode = (typeof LanternReviewMode !== "undefined")
    && LanternReviewMode.isEnabled(window.location.search);
  var reviewRows = [];
  var reviewNotes = {};
  var reviewAt = 0;

  // Everything the bar shows about the current item, in one place, so the
  // checkbox and the note field cannot drift out of step with each other.
  function reviewPaint(row){
    var mark = LanternReviewMode.getMark(reviewNotes, row.id);
    var flagged = 0;
    Object.keys(reviewNotes).forEach(function(key){
      if(LanternReviewMode.getMark(reviewNotes, key).flagged) flagged += 1;
    });
    $("review-wrong").checked = mark.flagged;
    $("review-bar").classList.toggle("is-flagged", mark.flagged);
    $("review-count").textContent = (reviewAt + 1) + " / " + reviewRows.length
      + "　（おかしい " + flagged + "）";
    $("review-jump").options[reviewAt].textContent =
      (mark.flagged ? "● " : (mark.note ? "○ " : "")) + row.place + " / " + row.group + " / " + row.id;
  }

  function reviewShow(index){
    if(!reviewRows.length) return;
    reviewAt = Math.max(0, Math.min(index, reviewRows.length - 1));
    var row = reviewRows[reviewAt];
    $("review-jump").value = String(reviewAt);
    $("review-note").value = LanternReviewMode.getMark(reviewNotes, row.id).note;
    reviewPaint(row);

    if(row.kind === "episode"){
      // Open that place's episode and land on the question itself.
      state.currentKey = row.place;
      var stage = stageFor(row.place);
      var episode = stage.episodes.filter(function(e){ return e.id === row.episodeId; })[0];
      if(!episode) return;
      var list = [];
      episode.days.forEach(function(day){
        day.questions.forEach(function(question){
          list.push({day:day.day, mode:day.mode, label:day.label, question:question});
        });
      });
      var at = 0;
      list.forEach(function(entry, i){ if(entry.question.id === row.id) at = i; });
      previewState = {index:at, list:list, answered:false, missed:[], repair:null, reviewing:true};
      screenTitle.style.display = "none";
      screenMap.style.display = "none";
      screenGame.style.display = "block";
      screenGame.classList.remove("entrance-stage");
      renderPreviewQuestion();
    }else{
      // The three-day stage: open the Inn at that phase and item.
      var parts = row.id.split(":");
      enterLocation("home-inn");
      state.stagePhase = parts[1];
      state.encounterIndex = Number(parts[2]) || 0;
      state.phaseItems = null;
      startStagePhase(state.stagePhase, true);
    }
  }

  // Deferred by a tick: this block reaches into things declared with `var`
  // further down the same closure, which are still undefined while setup is
  // running. Rendering a question from here immediately threw on INN_SCENES.
  if(reviewMode) setTimeout(function(){
    reviewRows = LanternReviewMode.buildIndex(
      (typeof LanternEpisodeStages !== "undefined") ? LanternEpisodeStages : {},
      (typeof N2HomeInnStage !== "undefined") ? N2HomeInnStage : null);
    reviewNotes = LanternReviewMode.loadNotes(localStorage);
    $("review-bar").hidden = false;
    document.body.classList.add("reviewing");

    var jump = $("review-jump");
    reviewRows.forEach(function(row, i){
      var option = document.createElement("option");
      option.value = String(i);
      var mark = LanternReviewMode.getMark(reviewNotes, row.id);
      option.textContent = (mark.flagged ? "● " : (mark.note ? "○ " : ""))
        + row.place + " / " + row.group + " / " + row.id;
      jump.appendChild(option);
    });
    jump.addEventListener("change", function(){ reviewShow(Number(this.value)); });
    $("review-prev").addEventListener("click", function(){ reviewShow(reviewAt - 1); });
    $("review-next").addEventListener("click", function(){ reviewShow(reviewAt + 1); });
    // Flagging is one tap; the note is optional. Requiring a written reason
    // before an item can be marked turns a read-through into an essay.
    function reviewMark(){
      var row = reviewRows[reviewAt];
      reviewNotes = LanternReviewMode.setMark(localStorage, reviewNotes, row.id, {
        flagged: $("review-wrong").checked,
        note: $("review-note").value
      });
      reviewPaint(row);
    }
    $("review-wrong").addEventListener("change", reviewMark);
    $("review-note").addEventListener("input", reviewMark);
    $("review-export").addEventListener("click", function(){
      var text = LanternReviewMode.exportNotes(reviewRows, reviewNotes);
      var box = document.createElement("textarea");
      box.className = "review-export-box";
      box.value = text;
      box.readOnly = true;
      var wrap = document.createElement("div");
      wrap.className = "about-panel";
      wrap.appendChild(box);
      var done = document.createElement("button");
      done.className = "btn btn-primary";
      done.textContent = "閉じる";
      done.addEventListener("click", function(){ wrap.remove(); });
      wrap.appendChild(done);
      document.body.appendChild(wrap);
      box.select();
    });
    reviewShow(0);
  }, 0);

  $("btn-restart").addEventListener("click", function(){
    applyProgress(null);
    state.currentKey = null;
    saveProgress();
    $("progress-note").hidden = true;
    $("btn-restart").hidden = true;
    $("btn-start").textContent = "路地へ入る";
    showCharacterSelection();
  });
  function showCharacterSelection(){
    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "none";
    screenCharacter.hidden = false;
    var first = screenCharacter.querySelector(".character-option");
    if(first) first.focus();
  }
  screenCharacter.querySelectorAll(".character-option").forEach(function(button){
    button.addEventListener("click", function(){
      state.playerCharacter = button.getAttribute("data-character");
      state.characterSelected = true;
      saveProgress();
      screenCharacter.hidden = true;
      enterLocation("entrance");
    });
  });

  $("map-resume").addEventListener("click", function(){
    var key = this.getAttribute("data-resume-key");
    if(key) enterLocation(key);
  });
  $("map-detail-practice").addEventListener("click", function(event){
    event.stopImmediatePropagation();
    startCatalogPractice();
  });

  mapDetailAction.addEventListener("click", function(){
    var action = selectedMapAction;
    if(action) enterLocation(action.locationKey);
  });
  $("btn-back-map").addEventListener("click", function(){ showMap(); });
  $("btn-restart-learn").addEventListener("click", restartStageLearning);
  $("btn-next").addEventListener("click", function(){
    if(practiceState){ advancePractice(); return; }
    if(previewState){ advanceEpisodePreview(); return; }
    var loc = getLocation(state.currentKey);
    if(loc && loc.encounters){
      continueStageEncounter(loc);
    }else{
      showMap();
    }
  });


  function showMap(){
    screenCharacter.hidden = true;
    screenTitle.style.display = "none";
    screenGame.style.display = "none";
    screenMap.style.display = "block";
    window.scrollTo({top:0,left:0,behavior:"auto"});
    renderMap();
  }

  function renderMap(){
    var destinationsEl = $("map-destinations");
    var completedCount = 0;
    destinationsEl.innerHTML = "";
    LanternAlleyMap.destinations.forEach(function(place){
      var progressState = LanternAlleyMap.resolveState(place.key, state);
      var unlocked = locationUnlocked(place.key);
      if(!unlocked) progressState = "locked";
      var statusLabel = progressState === "locked" ? "未開放" : LanternAlleyMap.stateLabels[progressState];
      if(progressState === "completed") completedCount += 1;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-destination state-" + progressState;
      btn.style.left = place.position.x + "%";
      btn.style.top = place.position.y + "%";
      btn.setAttribute("data-map-key", place.key);
      btn.setAttribute("aria-label", place.name + "、" + statusLabel);
      btn.setAttribute("aria-pressed", String(place.key === selectedMapKey));
      btn.innerHTML =
        '<span class="map-pin" aria-hidden="true"></span>' +
        '<span class="map-destination-label">' + place.name + '</span>';
      btn.addEventListener("click", function(){
        // Clicking the place on the map enters it. Selecting and then hunting
        // for a separate action button made the map feel like a list with a
        // picture behind it. Places with no action - the 準備中 ones - still
        // just select, so their story shows and nothing dead is offered.
        selectMapDestination(place.key);
        var action = locationUnlocked(place.key) ? LanternAlleyMap.getAction(place.key, state) : null;
        if(action) runMapAction(place.key);
      });
      destinationsEl.appendChild(btn);
    });
    $("map-progress-text").textContent = "灯り " + completedCount + " / " + LanternAlleyMap.destinations.length;

    // Practice lives on the map rather than inside a place, because clicking a
    // place now enters it and the detail shelf never stays on screen.
    var practiceBtn = $("map-detail-practice");
    // `visited` is only set on mastery, so gate on having started the Inn -
    // practice is for words already met, and the first day meets them.
    var openKeys = practicePartitions();
    var canPractise = typeof LanternCatalogPractice !== "undefined" && openKeys.length > 0;
    practiceBtn.hidden = !canPractise;
    if(canPractise){
      var pool = [];
      openKeys.forEach(function(key){
        LanternCurriculumCatalog.getPartition(key).forEach(function(item){ pool.push(item); });
      });
      var known = 0;
      pool.forEach(function(item){ if((state.itemStates || {})[item.id]) known += 1; });
      practiceBtn.textContent = "コンの稽古　" + known + " / " + pool.length;
    }
    renderMapDetail();
  }

  function selectMapDestination(key){
    if(!LanternAlleyMap.getDestination(key)) return;
    selectedMapKey = key;
    renderMap();
  }

  function runMapAction(key){
    if(!locationUnlocked(key)) return;
    var action = LanternAlleyMap.getAction(key, state);
    if(action) enterLocation(action.locationKey);
  }

  /* The place holding an unfinished shift, if there is one.
   *
   * `savedEpisode` has always known this and nothing ever said it out loud, so
   * resuming depended on the learner remembering. It also has to be a place
   * they can still get into: a shift saved somewhere that later reads as locked
   * is not a lead, it is a dead end. */
  function unfinishedPlace(){
    if(!savedEpisode || !savedEpisode.locationKey) return null;
    if(!locationUnlocked(savedEpisode.locationKey)) return null;
    var place = LanternAlleyMap.getDestination(savedEpisode.locationKey);
    return place || null;
  }

  function renderMapDetail(){
    var place = LanternAlleyMap.getDestination(selectedMapKey) || LanternAlleyMap.getDestination("home-inn");
    var progressState = LanternAlleyMap.resolveState(place.key, state);
    var unlocked = locationUnlocked(place.key);
    var action = unlocked ? LanternAlleyMap.getAction(place.key, state) : null;
    var statusText = unlocked ? LanternAlleyMap.stateLabels[progressState] : "🔒 未開放";
    if(place.key === "home-inn" && state.stageProgress.homeInn){
      var medalIcons = {bronze:"🥉",silver:"🥈",gold:"🥇"};
      statusText += " " + (medalIcons[state.stageProgress.homeInn.medal] || "");
    }
    selectedMapAction = action;
    $("map-detail-status").textContent = statusText;
    $("map-detail-name").textContent = place.name;
    $("map-detail-story").textContent = place.story;
    $("map-detail-focus").textContent = unlocked ? place.focus : "前の場所を100%理解すると開きます。";
    mapDetailAction.style.display = action ? "inline-flex" : "none";
    mapDetailAction.textContent = action ? action.label : "";

    /* An unfinished shift is the single most useful thing the map can say, so
     * it is said on the map itself rather than left for the learner to
     * remember. Pressing it goes straight back into the questions. */
    var resume = $("map-resume");
    var waiting = unfinishedPlace();
    if(waiting){
      resume.hidden = false;
      resume.textContent = "「" + waiting.name + "」の仕事の続き →";
      resume.setAttribute("data-resume-key", waiting.key);
    }else{
      resume.hidden = true;
      resume.removeAttribute("data-resume-key");
    }

    /* How the day is going: the streak, and how much is due. Both were being
     * tracked and neither was ever shown, which is the whole reason a learner
     * would come back today rather than on Friday. */
    var status = $("map-day-status");
    var bits = [];
    if(state.streak > 0){
      bits.push("連続 " + state.streak + " 日目");
      if(state.freezes > 0) bits.push("お休みの札 " + state.freezes);
    }
    var due = dueTodayCount();
    if(due > 0) bits.push("今日の復習 " + due + " 問");
    status.hidden = bits.length === 0;
    status.textContent = bits.join("　・　");
  }

  // How many already-met words the schedule wants back today.
  function dueTodayCount(){
    if(typeof LanternReviewEngine === "undefined") return 0;
    var open = {};
    practicePartitions().forEach(function(key){
      LanternCurriculumCatalog.getPartition(key).forEach(function(item){ open[item.id] = true; });
    });
    return LanternReviewEngine.getDueItems(state.reviewProgress || {}, Date.now())
      .filter(function(id){ return open[id]; }).length;
  }

  $("romaji-switch").addEventListener("click", function(){
    state.romajiOn = !state.romajiOn;
    this.classList.toggle("on", state.romajiOn);
    this.setAttribute("aria-pressed", String(state.romajiOn));
    $("romaji-line").style.display = state.romajiOn ? "block" : "none";
  });

  $("speak-btn").addEventListener("click", function(){
    var loc = getLocation(state.currentKey);
    if(loc) speak(dialogueFlow.getText() || getActivePrompt(loc).jp, "ask", true);
  });

  $("hint-btn").addEventListener("click", function(){
    $("hint-box").classList.toggle("show");
  });

  function getLocation(key){
    for(var i=0;i<locations.length;i++){
      if(locations[i].key === key) return locations[i];
    }
    return null;
  }

  function getActivePrompt(loc){
    if(!loc.encounters) return loc;
    var items = state.phaseItems || loc.getPhaseItems(state.stagePhase);
    var prompt = items[Math.max(0, Math.min(items.length - 1, state.encounterIndex))];
    prompt.stageKey = loc.key;
    prompt.stageLabel = loc.label;
    prompt.type = "choice";
    return prompt;
  }

  // Kon greets a returning player once. Both render paths ask for this, so the
  // flags are cleared when the encounter advances rather than on render.
  function stageNarrationFor(loc, prompt){
    if(!(loc.encounters && loc.getStorySetup)) return prompt.narration;
    return loc.getStorySetup(prompt, state.resumedStageEntry, state.resumedAfterDecline);
  }

  function continueStageEncounter(loc){
    state.resumedStageEntry = false;
    state.resumedAfterDecline = false;
    var items = state.phaseItems || loc.getPhaseItems(state.stagePhase);
    if(state.encounterIndex >= items.length - 1){
      advanceStagePhase(loc);
      return;
    }
    state.encounterIndex += 1;
    state.answered = false;
    state.selected = 0;
    saveStageProgress();
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";
    renderStagePrompt(loc);
  }

  // Testing aid: jump straight to the next day without answering the current
  // one. Marked in the label so it cannot be mistaken for part of the lesson,
  // and it only appears inside a stage that has days.
  var DAY_ORDER = ["learn", "practice", "challenge"];

  // ---- Episode 1 preview (testing only) ----
  //
  // The new episode contract, its catalog and the question renderer are all
  // built, but nothing routes a player through them yet: the Inn still runs the
  // legacy encounter flow. This harness walks Episode 1 so the new question
  // types can be judged before the controller is rewritten around them.
  //
  // Deliberately thin. It reuses the real renderer and the real episode data,
  // but not the room interactions, so action questions show their prompt and a
  // confirm rather than a working scene.
  var previewState = null;

  function episodeStages(){
    return (typeof LanternEpisodeStages !== "undefined" && LanternEpisodeStages) || {};
  }

  function stageFor(key){
    return episodeStages()[key || state.currentKey] || null;
  }

  // Which episode a place is on. Episode 2 is the morning after Episode 1, so
  // the first unfinished one is the right one; when they are all finished the
  // last stays open, because replaying a shift should always be possible.
  function currentEpisode(key){
    var stage = stageFor(key);
    if(!stage || !stage.episodes.length) return null;
    var list = stage.episodes;
    var done = state.episodesDone || {};
    for(var i = 0; i < list.length; i++){
      if(!done[list[i].id]) return list[i];
    }
    return list[list.length - 1];
  }

  // A place is finished when every one of its episodes is, which is what turns
  // its lantern on. Half a location is not a finished location.
  function stageComplete(key){
    var stage = stageFor(key);
    if(!stage || !stage.episodes.length) return false;
    var done = state.episodesDone || {};
    return stage.episodes.every(function(episode){ return !!done[episode.id]; });
  }

  var STAGE_ORDER = ["entrance", "home-inn", "market", "tea-house", "station", "shrine"];

  function stageMaterial(key){
    if(key === "entrance") return ["entrance-greeting"];
    var stage = stageFor(key);
    var ids = [];
    if(!stage) return ids;
    stage.episodes.forEach(function(episode){
      episode.days.forEach(function(day){
        day.questions.forEach(function(question){ if(question.target) ids.push(question.target); });
      });
    });
    return ids;
  }

  function stageMastery(key){
    if(key === "entrance") return state.visited.entrance ? 100 : 0;
    return LanternLearningEconomy.masteryPercent((state.masteredByStage || {})[key] || [], stageMaterial(key));
  }

  function locationUnlocked(key){
    // The home is never locked. Coins may unlock what goes inside it; nothing
    // about understanding decides whether a learner can go home.
    var place = LanternAlleyMap.getDestination(key);
    if(place && place.kind === "home") return true;
    var mastery = {};
    STAGE_ORDER.forEach(function(stageKey){ mastery[stageKey] = stageMastery(stageKey); });
    return LanternLearningEconomy.isUnlocked(key, STAGE_ORDER, mastery);
  }

  /* ---- 仕上げの稽古: keep asking until the place is actually learned ----
   *
   * The gauge exists so a learner knows how much of a place they hold, and the
   * next place opens only at 100%. That is only fair if there is a way to
   * finish: before this, a learner who ended the four episodes on 80% had
   * nowhere to go but replay whole shifts, most of which asked about words
   * they already knew.
   *
   * This collects exactly the questions whose word is still unproven and asks
   * them, round after round, until none are left. A word is proven by being
   * answered correctly - so reaching 100% means every one of the place's forty
   * words has been answered right at least once, which is what the gauge
   * claims.
   *
   * It pays nothing: `award` is once per question id, and these have all been
   * asked before. The reward for this round is the gauge.
   */
  function unmasteredEntries(key){
    var stage = stageFor(key);
    if(!stage) return [];
    var known = {};
    ((state.masteredByStage || {})[key] || []).forEach(function(id){ known[id] = true; });
    var out = [];
    stage.episodes.forEach(function(episode){
      episode.days.forEach(function(day){
        day.questions.forEach(function(question){
          if(question.target && !known[question.target]){
            out.push({day:day.day, mode:day.mode, label:day.label, question:question});
          }
        });
      });
    });
    return out;
  }

  function startMasteryLoop(key){
    if(key) state.currentKey = key;
    var list = unmasteredEntries(state.currentKey);
    if(!list.length) return false;
    previewState = {
      index:0, list:list, answered:false, missed:[], repair:null, masteryRound:true
    };
    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "block";
    screenGame.classList.remove("entrance-stage");
    renderMasteryIntro(list.length);
    return true;
  }

  function renderMasteryIntro(remaining){
    $("stage-phase-row").style.display = "none";
    $("encounter-status").style.display = "none";
    $("hint-btn").style.display = "none";
    $("hint-box").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("feedback-text").textContent = "";
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("next-row").style.display = "none";
    $("narration").textContent = "仕上げの稽古";

    var line = "コン：「まだ覚えていない言葉が" + remaining + "語あります。全部答えられるまで、何度でも出します。」";
    if(dialogueFlow) dialogueFlow.start(line, false); else $("jp-line").textContent = line;
    speak(line);

    $("scene").innerHTML = '<div class="episode-open"><div class="episode-open-card episode-brief">'
      + '<p class="episode-open-kicker">仕上げの稽古</p>'
      + '<ul class="episode-brief-list">'
      + '<li>覚えていない言葉だけが出ます。</li>'
      + '<li>正しく答えた言葉は、もう出ません。</li>'
      + '<li>間違えた言葉は、あとでもう一度出ます。</li>'
      + '<li>全部答えられたら、この場所は100%になります。</li>'
      + '</ul>'
      + '<button class="btn btn-primary" id="btn-mastery-begin">始めます</button>'
      + '</div></div>';
    $("btn-mastery-begin").addEventListener("click", function(event){
      event.stopImmediatePropagation();
      renderPreviewQuestion();
    });
  }

  function endMasteryLoop(){
    var key = state.currentKey;
    previewState = null;
    forgetEpisode();
    if(stageComplete(key) && stageMastery(key) === 100) state.visited[key] = true;
    saveProgress();
    renderHud();
    $("stage-phase-row").style.display = "none";
    $("narration").textContent = "仕上げの稽古";
    var line = "コン：「全部覚えましたね。この場所はもう大丈夫です。」";
    if(dialogueFlow) dialogueFlow.start(line, false); else $("jp-line").textContent = line;
    speak(line, "correct");
    $("scene").innerHTML = '<div class="episode-open"><div class="episode-open-card">'
      + '<p class="episode-open-kicker">理解度 100%</p>'
      + '<h2 class="episode-open-title">' + (getLocation(key) ? getLocation(key).name : "") + '</h2>'
      + '<p class="episode-open-note">次の場所が開きました。</p>'
      + '</div></div>';
    showFeedback(true, "この場所の言葉をすべて覚えました。");
    $("btn-next").textContent = "地図へもどる →";
    $("next-row").style.display = "block";
  }

  function markMastered(key, target){
    if(!key || !target) return;
    if(!state.masteredByStage[key]) state.masteredByStage[key] = [];
    if(state.masteredByStage[key].indexOf(target) < 0) state.masteredByStage[key].push(target);
  }

  /* ---- Payday: being paid should be felt, not just recorded ----
   *
   * The wallet already counted up silently, which made the one moment of
   * reward in a shift look like a number changing. This gives it a sound and
   * a sight.
   *
   * The sound is synthesised rather than sampled. The artifact stands at
   * 14.89 MB against a 15 MB ceiling, and a coin clip would cost tens of
   * kilobytes for two notes; Web Audio costs nothing and works offline by
   * construction. It follows the existing voice switch, so muting the fox
   * mutes the till as well.
   *
   * It fires only where money is actually earned - which is once per
   * question, never on a replay - so it cannot become a noise a learner
   * earns by tapping.
   */
  var coinAudio = null;

  function playCoinSound(){
    if(!state.voiceOn) return;
    try{
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return;
      if(!coinAudio) coinAudio = new Ctx();
      if(coinAudio.state === "suspended" && coinAudio.resume) coinAudio.resume();
      var now = coinAudio.currentTime;
      // Two quick rising notes: the shape of a till, not a fanfare. This plays
      // after every correct answer, so it has to stay welcome for an hour.
      [[988, 0], [1319, 0.07]].forEach(function(note){
        var osc = coinAudio.createOscillator();
        var gain = coinAudio.createGain();
        var at = now + note[1];
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note[0], at);
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.16, at + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
        osc.connect(gain);
        gain.connect(coinAudio.destination);
        osc.start(at);
        osc.stop(at + 0.2);
      });
    }catch(err){
      // A browser that refuses audio must not break answering a question.
    }
  }

  function showPayout(amount){
    var wallet = $("hud-money");
    if(!wallet || !amount) return;
    var host = wallet.parentNode;
    if(!host) return;

    var chip = document.createElement("span");
    chip.className = "payout-chip";
    chip.textContent = "+¥" + amount;
    host.appendChild(chip);
    // Visibility never depends on the animation. A global reduced-motion rule
    // kills animations with !important, and a chip that faded in would simply
    // never appear for those learners - the same trap the episode card fell
    // into once already. It is visible on arrival and removed on a timer.
    setTimeout(function(){
      if(chip.parentNode) chip.parentNode.removeChild(chip);
    }, 1100);

    host.classList.add("is-paid");
    setTimeout(function(){ host.classList.remove("is-paid"); }, 620);
  }

  function rewardCorrect(answerId, mode){
    var result = LanternLearningEconomy.award({money:state.money, paid:state.paidAnswers}, answerId, mode);
    state.money = result.money;
    state.paidAnswers = result.paid;
    saveProgress();
    renderHud();
    if(result.earned){
      playCoinSound();
      showPayout(result.earned);
    }
    return result.earned;
  }

  function hydrateCompletedMastery(){
    Object.keys(episodeStages()).forEach(function(key){
      var stage = stageFor(key);
      stage.episodes.forEach(function(episode){
        if(!(state.episodesDone || {})[episode.id]) return;
        episode.days.forEach(function(day){ day.questions.forEach(function(question){ markMastered(key, question.target); }); });
      });
    });
  }

  function previewQuestions(key){
    var episode = currentEpisode(key);
    if(!episode) return [];
    var list = [];
    episode.days.forEach(function(day){
      day.questions.forEach(function(question){
        list.push({day:day.day, mode:day.mode, label:day.label, question:question});
      });
    });
    return list;
  }

  // ---- Kon's 稽古: the catalog practice layer ----
  //
  // The episode teaches ten words. This reaches the rest of the location's
  // partition, which is what the coverage claim rests on. Cards are generated
  // rather than authored, so it costs data and no artwork.
  var practiceState = null;

  // Every place the learner has opened. Practising only the last door visited
  // would drop the words from everywhere else the moment they moved on.
  function practicePartitions(){
    var keys = [];
    if(state.visited["home-inn"] || state.stageProgress.homeInn) keys.push("home-inn");
    Object.keys(state.stageStarted || {}).forEach(function(key){
      if(keys.indexOf(key) < 0) keys.push(key);
    });
    Object.keys(state.visited || {}).forEach(function(key){
      if(keys.indexOf(key) < 0 && stageFor(key)) keys.push(key);
    });
    return keys;
  }

  function practiceProgress(){
    return {items: (state.itemStates || {})};
  }

  /* The daily session.
   *
   * Due items first, new words after. `review-engine.js` has held the spacing
   * schedule since it was written and nothing ever called it, so every card
   * was equally likely and a word answered correctly once was never seen
   * again. Now a word comes back at 1, 3, 7 and 14 days, and comes back
   * tomorrow if it was missed.
   */
  function dailySessionCards(size){
    var keys = practicePartitions();
    if(!keys.length) return [];
    var open = {};
    keys.forEach(function(key){
      LanternCurriculumCatalog.getPartition(key).forEach(function(item){ open[item.id] = true; });
    });

    var cards = [];
    var used = {};
    var due = LanternReviewEngine.getDueItems(state.reviewProgress || {}, Date.now());
    for(var i = 0; i < due.length && cards.length < size; i++){
      if(!open[due[i]]) continue;
      var item = LanternCurriculumCatalog.getItem(due[i]);
      if(!item) continue;
      var built = LanternCatalogPractice.buildPracticeCards(item, LanternCurriculumCatalog);
      if(!built.length) continue;
      cards.push(built[Math.floor(Math.random() * built.length) % built.length]);
      used[due[i]] = true;
    }

    if(cards.length < size){
      var filler = LanternCatalogPractice.getPracticeSession(
        keys, practiceProgress(), LanternCurriculumCatalog, size - cards.length);
      filler.forEach(function(card){ if(!used[card.target]) cards.push(card); });
    }
    return cards;
  }

  function startCatalogPractice(){
    if(typeof LanternCatalogPractice === "undefined") return;
    var size = (typeof LanternDailyPractice !== "undefined") ? LanternDailyPractice.SESSION_SIZE : 8;
    var cards = dailySessionCards(size);
    if(!cards.length) return;
    practiceState = {cards: cards, index: 0, correct: 0, answered: false};
    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "block";
    screenGame.classList.remove("entrance-stage");
    renderPracticeCard();
  }

  function renderPracticeCard(){
    var card = practiceState.cards[practiceState.index];
    var item = LanternCurriculumCatalog.getItem(card.target);

    $("stage-phase-row").style.display = "flex";
    $("stage-phase-badge").textContent = "コンの稽古";
    $("encounter-status").style.display = "block";
    $("encounter-progress").textContent = String(practiceState.index + 1);
    $("encounter-total").textContent = String(practiceState.cards.length);
    $("scene-label").textContent = "月見宿 - 言葉の稽古";
    $("narration").textContent = card.sourceNote;
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("feedback-row").classList.remove("show");
    // Clear the text too - the row is only hidden, and the old verdict would
    // flash back into view for a frame on the next answer.
    $("feedback-text").textContent = "";
    $("next-row").style.display = "none";
    if(dialogueFlow) dialogueFlow.start(card.prompt, false);

    var help = {reading:"Choose the reading.", meaning:"Choose the meaning.", cloze:"Choose the word that fits the blank."}[card.kind];
    $("scene").innerHTML = '<div class="inn-workspace">'
      + '<p class="inn-instruction"><span>' + help + '</span></p>'
      + '<div class="question-controls" id="practice-controls"></div>'
      + '<div class="inn-status" id="inn-status"></div></div>';

    practiceState.answered = false;
    var host = $("practice-controls");
    card.options.forEach(function(label, index){
      var button = document.createElement("button");
      button.type = "button";
      button.className = "question-control" + (index === 0 ? " is-primary" : "");
      button.textContent = label;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", function(event){
        event.stopImmediatePropagation();
        if(practiceState.answered) return;
        practiceState.answered = true;
        var right = index === card.correctIndex;
        if(right) practiceState.correct += 1;
        // Mark the item either way: the learner has now met it, and the
        // coverage report distinguishes seen from tested.
        markItemState(card.target, right ? "tested" : "seen");
        // Feed the spacing schedule either way: a miss has to bring the word
        // back tomorrow, which is the whole point of recording it.
        state.reviewProgress = LanternReviewEngine.recordOutcome(state.reviewProgress || {}, {
          id: card.target, correct: right, now: Date.now()
        });
        if(right) earnPracticeCoins(1);
        $("jp-line").textContent = "「" + item.canonical + "」（" + item.reading + "）" + (item.meanings[0] || "");
        showFeedback(right, right ? "正解です。"
          : "正しい答えは「" + card.options[card.correctIndex] + "」です。");
        $("btn-next").textContent = practiceState.index >= practiceState.cards.length - 1 ? "稽古を終える →" : "次へ →";
        $("next-row").style.display = "block";
      });
      host.appendChild(button);
    });
  }

  /* Practice income, which is the only renewable money in the game.
   *
   * Separate from `rewardCorrect`, which pays once per authored question and
   * then never again. This pays per correct card against a daily cap, so a
   * long grind cannot out-earn a good short session.
   */
  function earnPracticeCoins(amount){
    if(typeof LanternDailyPractice === "undefined" || !amount) return 0;
    var result = LanternDailyPractice.grant(state.dailyPractice, amount, Date.now());
    state.dailyPractice = result.wallet;
    if(result.granted){
      state.money = (state.money || 0) + result.granted;
      saveProgress();
      renderHud();
      playCoinSound();
      showPayout(result.granted);
    }
    return result.granted;
  }

  // Finishing a session is what counts a day towards the streak - not opening
  // the app, and not answering one card.
  function completeDailySession(correct, total){
    if(typeof LanternDailyPractice === "undefined") return null;
    var earnings = LanternDailyPractice.sessionEarnings(correct, total);
    var bonus = earnings.gate + earnings.perfect;
    var paidBonus = bonus ? earnPracticeCoins(bonus) : 0;

    var streak = LanternDailyPractice.advanceStreak({
      streak: state.streak, freezes: state.freezes, lastActiveDate: state.lastActiveDate
    }, Date.now());
    state.streak = streak.streak;
    state.freezes = streak.freezes;
    state.lastActiveDate = streak.lastActiveDate;
    var paidMilestone = streak.milestone ? earnPracticeCoins(streak.milestone) : 0;
    saveProgress();
    renderHud();
    return {earnings:earnings, paidBonus:paidBonus, streak:streak, paidMilestone:paidMilestone};
  }

  function markItemState(id, value){
    if(!state.itemStates) state.itemStates = {};
    // Never downgrade: meeting a word again does not un-test it.
    if(state.itemStates[id] === "tested" && value === "seen") return;
    state.itemStates[id] = value;
    saveProgress();
  }

  function advancePractice(){
    if(practiceState.index >= practiceState.cards.length - 1){
      if(!practiceState.finished){
        // Show the score before leaving. Dropping straight back to the map
        // made the session end with no sense of how it went.
        renderPracticeDone();
        return;
      }
      practiceState = null;
      showMap();
      return;
    }
    practiceState.index += 1;
    renderPracticeCard();
  }

  function renderPracticeDone(){
    practiceState.finished = true;
    var total = practiceState.cards.length;
    var right = practiceState.correct;
    var summary = completeDailySession(right, total);
    var line = right === total ? "全部できたね。よく覚えている。"
      : right >= Math.ceil(total / 2) ? "いいね。あと少しだ。"
      : "まだ体が覚えていないな。もう一度やろう。";
    $("encounter-progress").textContent = String(total);
    $("narration").textContent = "稽古の結果";
    $("feedback-row").classList.remove("show");
    $("feedback-text").textContent = "";
    if(dialogueFlow) dialogueFlow.start(line, false);
    var lines = [];
    if(summary){
      var e = summary.earnings;
      lines.push('<li>正解 ' + right + ' / ' + total + '　(' + Math.round(e.accuracy * 100) + '%)</li>');
      lines.push('<li>' + (e.gate ? '八割をこえました。おまけ ¥' + e.gate : 'あと少しで、おまけがつきます（八割から）') + '</li>');
      if(e.perfect) lines.push('<li>全問正解。さらに ¥' + e.perfect + '</li>');
      lines.push('<li>連続 ' + summary.streak.streak + ' 日目'
        + (summary.streak.frozen ? '（お休みの分は、とっておいた札で埋めました）' : '') + '</li>');
      if(summary.paidMilestone) lines.push('<li>七日つづきました。ごほうび ¥' + summary.paidMilestone + '</li>');
      if(!summary.paidBonus && (e.gate + e.perfect) > 0){
        lines.push('<li>今日のぶんは、もういっぱいです。また明日。</li>');
      }
    }
    $("scene").innerHTML = '<div class="inn-workspace">'
      + '<p class="inn-instruction"><span>Practice complete.</span></p>'
      + '<p class="practice-score">' + right + ' / ' + total + '</p>'
      + '<ul class="practice-summary">' + lines.join("") + '</ul></div>';
    $("btn-next").textContent = "地図へもどる →";
    $("next-row").style.display = "block";
  }

  function rememberEpisode(){
    if(!previewState){ savedEpisode = null; saveProgress(); return; }
    var playing = currentEpisode();
    savedEpisode = {
      locationKey: state.currentKey,
      episodeId: playing ? playing.id : null,
      index: previewState.index,
      missed: previewState.missed.slice(),
      inRepair: !!previewState.repair,
      repairQueue: previewState.repair ? previewState.repair.queue.slice() : []
    };
    saveProgress();
  }

  function forgetEpisode(){
    savedEpisode = null;
    saveProgress();
  }

  // Resume where the learner left off rather than restarting the hour. The
  // correction round resumes too, since it is the part most worth not losing.
  function resumeEpisode(){
    if(!savedEpisode) return false;
    var playing = currentEpisode();
    if(savedEpisode.episodeId && playing && savedEpisode.episodeId !== playing.id){
      forgetEpisode();
      return false;
    }
    var list = previewQuestions();
    if(!list.length) return false;
    snapshotMastery(state.currentKey);
    previewState = {
      index: Math.min(savedEpisode.index, list.length - 1),
      list: list,
      answered: false,
      missed: (savedEpisode.missed || []).slice(),
      repair: null
    };
    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "block";
    screenGame.classList.remove("entrance-stage");
    if(savedEpisode.inRepair && (savedEpisode.repairQueue || []).length){
      var byId = {};
      list.forEach(function(entry){ byId[entry.question.id] = entry.question; });
      previewState.repair = {queue: savedEpisode.repairQueue.slice(), byId: byId, timer:null, tick:null};
      renderRepairCard();
      return true;
    }
    renderPreviewQuestion();
    return true;
  }

  /* What the learner already held before this shift began.
   *
   * The growth bonus is for meeting something new, so it has to be measured
   * against the state at the start. Reading `masteredByStage` at the end would
   * always find the shift's own targets in it and pay the bonus every time,
   * including on a replay - which is exactly the farming the design forbids. */
  var masteryBeforeEpisode = null;

  function snapshotMastery(key){
    var held = {};
    ((state.masteredByStage || {})[key] || []).forEach(function(target){ held[target] = true; });
    masteryBeforeEpisode = {key:key, held:held};
  }

  function startEpisode(key){
    if(key) state.currentKey = key;
    var list = previewQuestions(state.currentKey);
    if(!list.length) return;
    snapshotMastery(state.currentKey);
    previewState = {index:0, list:list, answered:false, missed:[], repair:null};
    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "block";
    screenGame.classList.remove("entrance-stage");
    renderPreviewIntro();
  }

  // Dropping straight into question 1 was jarring: the Inn's room vanished and
  // an unrelated question appeared. Kon introduces the episode first, over a
  // brief fade, so the change of place is something that happens in the story.
  function renderPreviewIntro(){
    var episode = currentEpisode();
    if(!episode) return;
    setInnScene("lobby");
    $("stage-phase-row").style.display = "none";
    $("encounter-status").style.display = "none";
    $("hint-btn").style.display = "none";
    $("hint-box").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("scene-label").textContent = "月見宿 - " + episode.title;
    $("narration").textContent = episode.sourceNote;
    $("jp-line").textContent = episode.intro.jp;
    speak(episode.intro.jp);

    // The story name, not the internal English title: 月見宿・第一話「最初のお客様」
    var parts = /^(.*?)・(.*?)「(.*)」$/.exec(episode.sourceNote) || [];
    var chapter = parts[2] || "第一話";
    var storyTitle = parts[3] || episode.title;

    var scene = $("scene");
    scene.innerHTML = '<div class="episode-open"><div class="episode-open-card">'
      + '<p class="episode-open-kicker">' + chapter + '</p>'
      + '<h2 class="episode-open-title">' + storyTitle + '</h2>'
      + '<p class="episode-open-note">' + (parts[1] || "月見宿") + '</p>'
      + '<button class="btn btn-primary" id="btn-episode-begin">始めましょう</button>'
      + '</div></div>';
    $("btn-episode-begin").addEventListener("click", function(event){
      event.stopImmediatePropagation();
      renderPreviewBriefing();
    });
    $("next-row").style.display = "none";
  }

  // An episode runs by different rules from the three days, so Kon states them
  // before the first guest arrives rather than leaving the learner to infer a
  // clock from a bar that suddenly appears.
  function renderPreviewBriefing(){
    var episode = currentEpisode();
    setInnScene("lobby");
    var brief = episode.briefing;
    $("jp-line").textContent = brief.jp;
    $("narration").textContent = episode.sourceNote;
    speak(brief.jp);

    var list = brief.points.map(function(point){ return '<li>' + point + '</li>'; }).join("");
    $("scene").innerHTML = '<div class="episode-open"><div class="episode-open-card episode-brief">'
      + '<p class="episode-open-kicker">この一時間のきまり</p>'
      + '<ul class="episode-brief-list">' + list + '</ul>'
      + '<button class="btn btn-primary" id="btn-brief-begin">受付を始めます</button>'
      + '</div></div>';
    $("btn-brief-begin").addEventListener("click", function(event){
      event.stopImmediatePropagation();
      renderPreviewQuestion();
    });
  }

  function clearPreviewTimer(){
    if(previewState && previewState.tick){
      clearInterval(previewState.tick);
      previewState.tick = null;
    }
  }

  // Spoken requests start their clock only once Kon has stopped talking, so the
  // learner is timed on understanding rather than on listening.
  // Whether this exact line has a pre-rendered clip. Lines added after the last
  // audio run do not, and the episode clock must not depend on one.
  function hasClip(text){
    return !!(window.LanternAlleyAudio && window.LanternAlleyAudio[text]);
  }

  // Roughly how long the line would take to say, so a question without a clip
  // is paced like one with a clip rather than starting instantly.
  function spokenDuration(text){
    return Math.min(6000, Math.max(1600, String(text || "").length * 95));
  }

  var pendingClock = null;

  function startQuestionClock(seconds, token){
    // Reviewing is reading, and a countdown makes that impossible.
    if(reviewMode) return;
    if(!previewState || previewState.token !== token) return;
    previewState.timer = LanternQuestionRenderer.startTimer(
      LanternQuestionRenderer.createTimer({seconds: seconds}), Date.now());
    paintPreviewTimer();
    clearPreviewTimer();
    previewState.tick = setInterval(function(){
      if(!previewState || previewState.token !== token){ clearPreviewTimer(); return; }
      if(previewState.answered){ clearPreviewTimer(); return; }
      previewState.timer = LanternQuestionRenderer.tickTimer(previewState.timer, Date.now());
      paintPreviewTimer();
      if(previewState.timer.expired){
        clearPreviewTimer();
        previewState.answered = true;
        // The choices have to stop looking like choices here too. Left live
        // after a timeout they read as a question waiting to be answered, and
        // tapping one did nothing at all - which looks like a broken game
        // rather than a clock that ran out.
        settlePreviewChoices(-1);
        var entry = previewState.list[previewState.index];
        if(previewState.missed.indexOf(entry.question.id) < 0) previewState.missed.push(entry.question.id);
        showFeedback(false, "時間切れです。お客様を待たせました。この問題は最後にもう一度出ます。");
        advancePreviewLater(false);
      }
    }, 100);
  }

  function paintPreviewTimer(){
    var timer = previewState.timer;
    if(!timer) return;
    var fill = $("preview-timer-fill");
    if(fill) fill.style.width = Math.round((timer.remaining / timer.total) * 100) + "%";
    var text = $("preview-timer-text");
    if(text) text.textContent = (Math.max(0, timer.remaining) / 1000).toFixed(1) + " 秒";
  }

  // A multi-line prompt is a document: a notice, a schedule, a board. Kon's card
  // says what to look at; the document itself gets the wide panel, because 190
  // characters in a 325px speech bubble is unreadable however clear the writing.
  function previewDocument(question){
    var jp = question.prompt.jp || "";
    if(jp.indexOf("\n") < 0) return null;
    var lines = jp.split("\n");
    var heading = lines[0];
    var ask = lines[lines.length - 1];
    return {heading:heading, body:lines.slice(1, -1), ask:ask};
  }

  function previewSpokenLine(question){
    var doc = previewDocument(question);
    if(!doc) return question.prompt.jp;
    return doc.heading + "を読んでください。";
  }

  // Marks the answered question as answered: every choice goes inert, and the
  // one that was picked stays visible so the explanation has something to
  // point at.
  function settlePreviewChoices(picked){
    var host = $("preview-controls");
    if(!host) return;
    var buttons = host.querySelectorAll("button");
    Array.prototype.forEach.call(buttons, function(button, index){
      button.disabled = true;
      button.classList.add("is-settled");
      if(index === picked) button.classList.add("is-picked");
    });
  }

  function renderPreviewQuestion(){
    var entry = previewState.list[previewState.index];
    var question = entry.question;
    /* The wallet is only written by renderHud and by a payout, so a learner
     * resuming a shift read ¥0 until they got something right - their money
     * was there, the HUD simply had never been painted for this screen. */
    renderHud();
    // Before anything is rendered: the reading panel is built further down and
    // would otherwise gloss this question's own answer using the last
    // question's exclusions.
    setGlossQuestion(question);
    setInnScene(innSceneFor(question));
    // An episode is one evening, not three days, so the badge names the part of
    // the shift the learner is in.
    var dayLabel = (entry.label || "宵の一時間") + "・" + (entry.question.seconds || 8) + "秒";

    $("stage-phase-row").style.display = "flex";
    $("stage-phase-badge").textContent = dayLabel;
    $("scene-label").textContent = "Episode 1 preview - " + question.skill;
    $("encounter-status").style.display = "block";
    $("encounter-progress").textContent = String(previewState.index + 1);
    $("encounter-total").textContent = String(previewState.list.length);
    $("narration").textContent = question.sourceNote;
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("hint-btn").style.display = "none";
    $("hint-box").classList.remove("show");
    $("feedback-row").classList.remove("show");
    // Clear the text too. Hiding the row left the previous question's verdict
    // on screen - a learner opening the market saw 時間切れ over a question they
    // had not been asked yet.
    $("feedback-text").textContent = "";
    $("next-row").style.display = "none";

    previewState.token = (previewState.token || 0) + 1;
    var token = previewState.token;
    clearPreviewTimer();
    previewState.timer = null;

    // Episodes show the request in writing as well: the clock, not concealment,
    // is what makes them harder than the days.
    if(question.prompt.audio){
      speak(question.prompt.jp);
      if(hasClip(question.prompt.jp)){
        // There is a recording: count from when it stops, so the learner is
        // timed on understanding rather than on listening.
        afterSpeech(function(){ startQuestionClock(question.seconds || 8, token); }, 1200);
      }else{
        // No recording for this line. Waiting on a voice that will never report
        // back left the clock either firing at once - the question was dead
        // before it could be read - or stuck on its placeholder for seven
        // seconds. Wait roughly as long as the line would have taken to say.
        pendingClock = {token: token, seconds: question.seconds || 8, delay: spokenDuration(question.prompt.jp)};
      }
    }else if(dialogueFlow){
      // Silent questions must still hand the line to the dialogue controller.
      // Writing straight to #jp-line left the previous question's reply mid
      // reveal, and the controller then painted it back over the new prompt -
      // so a reading question showed the answer to the one before it.
      dialogueFlow.start(previewSpokenLine(question), false);
    }else{
      $("jp-line").textContent = previewSpokenLine(question);
    }

    var doc = previewDocument(question);
    var mark = function(line){
      var marked = glossHtml(line);
      return marked === null ? line : marked;
    };
    var docMarkup = doc
      ? '<div class="reading-document"><p class="reading-document-heading">' + mark(doc.heading) + '</p>'
        + '<ul class="reading-document-body">'
        + doc.body.map(function(line){
            var rule = line.indexOf("※") === 0;
            return '<li' + (rule ? ' class="is-rule"' : '') + '>' + mark(line) + '</li>';
          }).join("")
        + '</ul>'
        + '<p class="reading-document-ask">' + mark(doc.ask) + '</p></div>'
      : "";

    var scene = $("scene");
    scene.innerHTML = '<div class="inn-workspace">'
      + '<p class="inn-instruction" id="inn-instruction"></p>'
      + '<div class="repair-timer" id="preview-timer"><span class="repair-timer-fill" id="preview-timer-fill"></span><b id="preview-timer-text">…</b></div>'
      + docMarkup
      + '<div class="question-controls" id="preview-controls"></div>'
      + '<div class="inn-status" id="inn-status"></div></div>';

    var spec = LanternQuestionRenderer.describe(question, {phase: entry.mode});
    $("inn-instruction").innerHTML = '<span>' + spec.howToInteract + '</span>';
    // Only now that the question is on screen. Starting the clock before the
    // scene was rebuilt counted down against a timer the learner could not see.
    if(!question.prompt.audio){
      startQuestionClock(question.seconds || 8, token);
    }else if(pendingClock && pendingClock.token === token){
      var armed = pendingClock;
      pendingClock = null;
      setTimeout(function(){ startQuestionClock(armed.seconds, armed.token); }, armed.delay);
    }

    var options = (question.answer && question.answer.options) || [];
    if(!options.length){
      // Action questions need the room, which this harness does not build.
      $("inn-status").textContent = "この問題は部屋の操作で答えます（プレビューでは省略）。";
    }

    previewState.answered = false;
    LanternQuestionRenderer.renderInto($("preview-controls"), question, function(value){
      if(previewState.answered) return;
      clearPreviewTimer();
      if(!options.length){
        previewState.answered = true;
        showFeedback(true, "Action question - skipped in preview.");
        advancePreviewLater(true);
        return;
      }
      var correct = value === question.answer.correctIndex;
      previewState.answered = true;
      // The choices stay on screen while the explanation is read, so they have
      // to stop looking like choices. Left live, a learner who answered wrong
      // taps the one they now believe is right and nothing at all happens.
      settlePreviewChoices(value);
      if(!correct && previewState.missed.indexOf(question.id) < 0){
        previewState.missed.push(question.id);
        rememberEpisode();
      }
      var earned = 0;
      if(correct){
        markMastered(state.currentKey, question.target);
        earned = rewardCorrect(question.id, entry.mode);
      }
      $("jp-line").textContent = correct ? question.feedback.correct : question.feedback.incorrect;
      speak($("jp-line").textContent, correct ? "correct" : "wrong");
      // Say what the chosen answer actually meant. "Not that one" teaches
      // nothing; naming the word the learner reached for is the lesson.
      var note = (question.optionNotes || [])[value];
      var chosen = (question.answer.options || [])[value];
      showFeedback(correct, correct ? "正解です。" + (earned ? " +¥" + earned : "")
        : (note ? "「" + chosen + "」 = " + note : "もう一度考えてみましょう。"));
      // A wrong answer used to re-render the same question after 1.8 seconds,
      // which wiped the explanation before it could be read - and retrying
      // makes no sense in a timed hour, where the guest has already been kept
      // waiting. The item returns in the correction round instead.
      advancePreviewLater(correct);
    }, {phase: entry.mode});
  }

  function advancePreviewLater(isCorrect){
    $("btn-next").textContent = previewState.index >= previewState.list.length - 1 ? "路地へ戻る →" : "次へ →";
    $("next-row").style.display = "block";

    // A correct answer moves on by itself: the first tap finishes Kon's line,
    // the next one advances. A wrong one waits for the learner, because the
    // explanation of what they chose is the only reason the question was worth
    // getting wrong, and an auto-advance takes it away while they are reading.
    if(isCorrect === false){
      $("btn-next").textContent = "読みました。次へ →";
      return;
    }
    var at = previewState.index;
    afterSpeech(function(){
      if(!previewState || previewState.index !== at) return;
      advanceEpisodePreview();
    }, 2600);
  }

  function advanceEpisodePreview(){
    if(previewState.masteryRound){
      if(previewState.index >= previewState.list.length - 1){
        // Round over. Anything still unproven comes round again; when nothing
        // is left the place is genuinely at 100%.
        var again = unmasteredEntries(state.currentKey);
        if(!again.length){ endMasteryLoop(); return; }
        previewState.list = again;
        previewState.index = 0;
        previewState.answered = false;
        renderPreviewQuestion();
        return;
      }
      previewState.index += 1;
      renderPreviewQuestion();
      return;
    }
    if(previewState.index >= previewState.list.length - 1){
      if(previewState.missed.length){ startRepairLoop(); return; }
      endEpisodePreview();
      return;
    }
    previewState.index += 1;
    rememberEpisode();
    renderPreviewQuestion();
  }

  /* The garden grows here and nowhere else.
   *
   * This is the only path out of a finished shift, and it is reached only once
   * the correction queue is empty - so a plant grows for work completed, not
   * for time passed, cards seen, or an hour abandoned halfway. The credit id is
   * the episode's own id, so replaying it credits nothing: the engine keeps the
   * ids it has already honoured.
   *
   * The bonus is for meeting a word this shift that the learner did not hold
   * before it began. */
  function creditGardenFor(episode){
    if(typeof LanternHomeGarden === "undefined" || !episode) return;
    var before = (masteryBeforeEpisode && masteryBeforeEpisode.key === state.currentKey)
      ? masteryBeforeEpisode.held : {};
    var held = {};
    ((state.masteredByStage || {})[state.currentKey] || []).forEach(function(t){ held[t] = true; });
    var introducedSomething = false;
    episode.days.forEach(function(day){
      day.questions.forEach(function(question){
        if(held[question.target] && !before[question.target]) introducedSomething = true;
      });
    });
    var result = LanternHomeGarden.creditLesson(
      gardenState(), "episode:" + episode.id, introducedSomething ? 1 : 0);
    state.garden = result.garden;
    masteryBeforeEpisode = null;
  }

  function endEpisodePreview(){
    var finished = currentEpisode();
    if(finished){
      if(!state.episodesDone) state.episodesDone = {};
      creditGardenFor(finished);
      state.episodesDone[finished.id] = true;
      // The lantern lights when the whole place is done, not one shift of it.
      if(stageComplete(state.currentKey) && stageMastery(state.currentKey) === 100) state.visited[state.currentKey] = true;
    }
    previewState = null;
    forgetEpisode();
    showMap();
  }

  // ---- 間違い直し: the timed correction loop ----
  //
  // Specified since the curriculum design and built in review-engine.js and
  // question-renderer.js, but nothing ran it. Only missed items appear, the
  // clock is per question type rather than a flat five seconds, and a timeout
  // returns the item without recording a misconception.
  function startRepairLoop(){
    var byId = {};
    previewState.list.forEach(function(entry){ byId[entry.question.id] = entry.question; });
    previewState.repair = {
      queue: LanternReviewEngine.createRepairQueue(previewState.missed),
      byId: byId,
      timer: null,
      tick: null
    };
    rememberEpisode();
    renderRepairIntro();
  }

  // The correction round is stricter than the hour that preceded it, so say so
  // before the first card rather than letting a clock appear unannounced.
  function renderRepairIntro(){
    var count = previewState.repair.queue.length;
    var line = "コン：「お疲れさまでした。最後に、間違えた仕事だけをもう一度確認します。今度は時間が短いので、すぐに答えてください。」";
    clearRepairTimer();
    $("stage-phase-row").style.display = "flex";
    $("stage-phase-badge").textContent = "間違い直し";
    $("encounter-status").style.display = "none";
    $("scene-label").textContent = "月見宿 - 間違い直し";
    $("narration").textContent = previewState.list[0].question.sourceNote;
    $("jp-line").textContent = line;
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";
    speak(line);

    $("scene").innerHTML = '<div class="episode-open"><div class="episode-open-card episode-brief">'
      + '<p class="episode-open-kicker">間違い直し</p>'
      + '<ul class="episode-brief-list">'
      + '<li>' + count + ' 問だけ、もう一度出ます。</li>'
      + '<li>一問ごとに制限時間があります。短い問題は五秒です。</li>'
      + '<li>時間が切れても間違いにはなりません。もう一度出ます。</li>'
      + '<li>全部正解すると終わりです。</li>'
      + '</ul>'
      + '<button class="btn btn-primary" id="btn-repair-begin">始めます</button>'
      + '</div></div>';
    $("btn-repair-begin").addEventListener("click", function(event){
      event.stopImmediatePropagation();
      renderRepairCard();
    });
  }

  function clearRepairTimer(){
    if(previewState && previewState.repair && previewState.repair.tick){
      clearInterval(previewState.repair.tick);
      previewState.repair.tick = null;
    }
  }

  function renderRepairCard(){
    var repair = previewState.repair;
    if(!repair.queue.length){ renderRepairDone(); return; }
    // Each card gets a token. A timer left over from the previous card was
    // settling the new one - disabling its buttons and freezing its clock the
    // moment it appeared.
    repair.token = (repair.token || 0) + 1;
    var token = repair.token;

    var question = repair.byId[repair.queue[0]];
    var card = LanternLearningContent.makeRepairQuestion(question);

    $("stage-phase-row").style.display = "flex";
    $("stage-phase-badge").textContent = "間違い直し";
    $("encounter-status").style.display = "block";
    $("encounter-progress").textContent = String(previewState.missed.length - repair.queue.length + 1);
    $("encounter-total").textContent = String(previewState.missed.length);
    $("scene-label").textContent = "月見宿 - 間違い直し";
    $("narration").textContent = card.sourceNote;
    $("jp-line").textContent = card.prompt;
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";

    // No illustrated room here: correction is a focused quiz card.
    $("scene").innerHTML = '<div class="inn-workspace repair-card">'
      + '<p class="inn-instruction"><span>Answer before the lantern goes out.</span></p>'
      + '<div class="repair-timer is-countdown" id="repair-timer"><span class="repair-timer-fill" id="repair-timer-fill"></span><b id="repair-timer-text"></b></div>'
      + '<div class="question-controls" id="repair-controls"></div>'
      + '<div class="inn-status" id="inn-status"></div></div>';

    var host = $("repair-controls");
    card.options.forEach(function(label, index){
      var button = document.createElement("button");
      button.type = "button";
      button.className = "question-control" + (index === 0 ? " is-primary" : "");
      button.textContent = label;
      button.setAttribute("aria-label", label);
      button.addEventListener("click", function(event){
        event.stopImmediatePropagation();
        settleRepair(index === card.correctIndex ? "correct" : "incorrect", card, token);
      });
      host.appendChild(button);
    });

    repair.timer = LanternQuestionRenderer.startTimer(
      LanternQuestionRenderer.createTimer({seconds: card.seconds}), Date.now());
    paintRepairTimer(card);
    clearRepairTimer();
    repair.tick = setInterval(function(){
      if(!previewState || !previewState.repair) return;
      if(previewState.repair.token !== token){ clearRepairTimer(); return; }
      repair.timer = LanternQuestionRenderer.tickTimer(repair.timer, Date.now());
      paintRepairTimer(card);
      if(repair.timer.expired) settleRepair("timeout", card, token);
    }, 100);
  }

  function paintRepairTimer(card){
    var timer = previewState.repair.timer;
    var left = Math.max(0, timer.remaining) / 1000;
    var fill = $("repair-timer-fill");
    if(fill){
      fill.style.width = Math.round((timer.remaining / timer.total) * 100) + "%";
      fill.classList.toggle("is-urgent", left <= 2);
    }
    var text = $("repair-timer-text");
    if(text) text.textContent = "のこり " + left.toFixed(1) + " 秒 / " + card.seconds + " 秒";
  }

  function settleRepair(outcome, card, token){
    var repair = previewState.repair;
    if(!repair || (token !== undefined && repair.token !== token)) return;
    if(repair.settled === token) return;
    repair.settled = token;
    clearRepairTimer();
    [...$("repair-controls").querySelectorAll("button")].forEach(function(b){ b.disabled = true; });

    var cardId = repair.queue[0];
    if(!repair.attempts) repair.attempts = {};
    if(outcome !== "correct") repair.attempts[cardId] = (repair.attempts[cardId] || 0) + 1;
    var result = LanternReviewEngine.answerRepair(
      repair.queue, cardId, outcome, null, (repair.attempts[cardId] || 1) - 1);
    repair.queue = result.queue;
    rememberEpisode();

    if(outcome === "correct"){
      var repairedQuestion = repair.byId[cardId];
      if(repairedQuestion) markMastered(state.currentKey, repairedQuestion.target);
      var repairPay = rewardCorrect(cardId, "review");
      showFeedback(true, "正解です。" + (repairPay ? " +¥" + repairPay : ""));
    }else if(result.exhausted){
      // Show the answer after three misses, then keep this target in the round.
      // A stage cannot claim 100% while silently dropping an item.
      repair.queue.push(cardId);
      repair.attempts[cardId] = 0;
      $("jp-line").textContent = "コン：「この言葉は、また後で一緒に見ましょう。」";
      showFeedback(false, "正しい答えは「" + card.options[card.correctIndex] + "」です。もう一度出ます。");
    }else if(outcome === "timeout"){
      // Slowness, not a misconception: the item simply comes back.
      showFeedback(false, "時間切れです。もう一度出ます。");
    }else{
      showFeedback(false, "正しい答えは「" + card.options[card.correctIndex] + "」です。");
    }
    rememberEpisode();
    setTimeout(function(){ if(previewState && previewState.repair) renderRepairCard(); }, 1400);
  }

  function renderRepairDone(){
    clearRepairTimer();
    $("stage-phase-badge").textContent = "間違い直し";
    $("jp-line").textContent = "コン：「間違えた仕事は全部できました。お疲れさまでした。」";
    speak("間違えた仕事は全部できました。お疲れさまでした。", "correct");
    $("scene").innerHTML = "";
    showFeedback(true, "All corrections cleared.");
    $("btn-next").textContent = "路地へ戻る →";
    $("next-row").style.display = "block";
    previewState.repair = null;
    previewState.index = previewState.list.length - 1;
    previewState.missed = [];
  }


  function startStagePhase(loc, phase, items){
    state.stagePhase = phase;
    state.phaseItems = items || null;
    state.encounterIndex = 0;
    state.answered = false;
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";
    saveStageProgress();
    renderStagePrompt(loc);
  }

  function advanceStagePhase(loc){
    if(state.stageMastered){
      // The three days teach the words; the episode is the shift they were
      // training for. Finishing the days used to drop the learner back on the
      // map, so the episode existed but nothing led to it.
      if(typeof N2InnEpisodes !== "undefined" && loc.key === "home-inn"){
        startEpisode();
        return;
      }
      showMap();
    }else if(state.stagePhase === "learn"){
      startStagePhase(loc, "practice");
    }else if(state.stagePhase === "practice"){
      state.challengeScore = 0;
      state.challengeCorrectWords = {};
      state.challengeMisses = [];
      startStagePhase(loc, "challenge");
    }else if(state.stagePhase === "challenge"){
      startStagePhase(loc, "review", state.challengeMisses.slice());
    }else{
      state.challengeScore = 0;
      state.challengeCorrectWords = {};
      state.challengeMisses = [];
      startStagePhase(loc, "challenge");
    }
  }

  function restartStageLearning(){
    var loc = getLocation(state.currentKey);
    if(!loc || !loc.encounters) return;
    state.stageProgress.homeInn = null;
    state.challengeScore = 0;
    state.challengeCorrectWords = {};
    state.challengeMisses = [];
    state.stageMastered = false;
    startStagePhase(loc, "learn");
  }

  var INN_SCENES = {
    room:"assets/inn/scenes/guest-room.jpg",
    lobby:"assets/inn/scenes/lobby.jpg",
    kitchen:"assets/inn/scenes/kitchen.jpg",
    dining:"assets/inn/scenes/dining-hall.jpg",
    hallway:"assets/inn/scenes/hallway.jpg",
    office:"assets/inn/scenes/office.jpg",
    courtyard:"assets/inn/scenes/courtyard.jpg"
  };
  function innSceneFor(prompt){
    var text = [prompt && prompt.target, prompt && prompt.mechanic,
      prompt && prompt.jp, prompt && prompt.prompt && prompt.prompt.jp].join(" ");
    if(/花火|祭|庭|外/.test(text)) return "courtyard";
    if(/予定|確認|調整|知らせ|schedule|reading|evidence/.test(text)) return "office";
    if(/料理|食事|注文|配膳|茶|汁|米|温め|warm/.test(text)) return "kitchen";
    if(/座布団|夕食|朝食|宴会/.test(text)) return "dining";
    if(/掃除|タオル|シーツ|布団|部屋|replace|arrange/.test(text)) return "room";
    if(/案内|送る|廊下/.test(text)) return "hallway";
    return "lobby";
  }
  function setInnScene(key){
    var asset = INN_SCENES[key] || INN_SCENES.lobby;
    screenGame.style.setProperty("--inn-scene-image", 'url("' + asset + '")');
  }

  function renderStageIntro(loc){
    setInnScene("lobby");
    var intro = loc.intro;
    $("scene-label").textContent = loc.label;
    $("stage-phase-row").style.display = "none";
    $("encounter-status").style.display = "none";
    $("narration").textContent = intro.context;
    $("jp-line").textContent = intro.jp;
    $("romaji-line").textContent = intro.romaji;
    $("romaji-line").style.display = state.romajiOn ? "block" : "none";
    $("meaning-line").textContent = "";
    $("hint-btn").style.display = "none";
    $("hint-box").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";
    $("scene").innerHTML = '<div class="stage-intro-action"><button class="btn btn-primary" id="btn-accept-helper">' + intro.accept + '</button></div>';
    $("btn-accept-helper").addEventListener("click", function(){
      startStagePhase(loc, "learn");
    });
    speak(intro.jp);
  }

  function renderStagePrompt(loc){
    var prompt = getActivePrompt(loc);
    setInnScene(innSceneFor(prompt));
    var phaseName = state.stagePhase === "review" ? "focused review" : state.stagePhase;
    var phaseLabels = {learn:"Learn / 学ぶ", practice:"Practice / 練習", challenge:"Challenge / 挑戦", review:"Review / 復習"};
    var dayMeta = loc.getDayMeta ? loc.getDayMeta(state.stagePhase) : null;
    $("scene-label").textContent = prompt.stageLabel + " - " + prompt.label;
    $("stage-phase-row").style.display = "flex";
    $("stage-phase-badge").textContent = dayMeta ? dayMeta.label + "・" + dayMeta.mode + " " + dayMeta.stars : (phaseLabels[state.stagePhase] || phaseName);
    $("encounter-status").style.display = "block";
    $("encounter-progress").textContent = String(state.encounterIndex + 1);
    $("encounter-total").textContent = String((state.phaseItems || loc.getPhaseItems(state.stagePhase)).length);
    // Resolve the greeting once. Calling stageNarrationFor twice consumed the
    // resume flag on the first call and produced a different line on the second.
    var storyNarration = stageNarrationFor(loc, prompt);
    if(state.encounterIndex === 0 && loc.getDayAnnouncement){
      // The day announcement already places the learner, so the welcome-back
      // line on top of it made three Kon greetings before the situation.
      // Prefer the day announcement and drop the resume greeting.
      storyNarration = loc.getDayAnnouncement(state.stagePhase) + " " + prompt.narration;
    }
    $("narration").textContent = storyNarration;
    $("jp-line").textContent = loc.getWrittenPrompt(prompt, state.stagePhase);
    $("romaji-line").textContent = prompt.romaji;
    $("romaji-line").style.display = state.romajiOn && state.stagePhase !== "challenge" ? "block" : "none";
    $("meaning-line").textContent = prompt.meaning;
    // Day 2 shows the English translation as part of the question, in place of
    // the romaji it no longer gets. Every other day reveals meaning only after
    // an answer, so it cannot be read instead of the Japanese.
    $("meaning-line").classList.toggle("show", state.stagePhase === "practice");
    $("hint-box").textContent = prompt.hint;
    $("hint-box").classList.remove("show");
    $("hint-btn").style.display = state.stagePhase === "challenge" ? "none" : "block";
    renderInnInteraction(prompt, true);
    speak(prompt.jp, undefined, false, loc.getWrittenPrompt ? loc.getWrittenPrompt(prompt, state.stagePhase) : undefined);
  }

  function enterLocation(key){
    var loc = getLocation(key);
    if(!loc) return;
    /* Only the home silences the speech panel or hides the furigana switch and
     * the understanding gauge, so both are restored here.
     *
     * `home-stage` was being added by renderHome and never taken off again, so
     * it followed the learner into every other place. Nothing depended on it
     * until now, which is exactly why it went unnoticed. */
    $("dialogue-shell").classList.remove("is-silent");
    screenGame.classList.remove("home-stage");
    if(loc.key !== "home"){
      state.lastPlace = loc.key;
      saveProgress();
    }

    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "block";
    screenCharacter.hidden = true;
    screenGame.classList.toggle("entrance-stage", loc.key === "entrance");
    screenGame.classList.toggle("inn-stage", loc.key === "home-inn");
    if(loc.key !== "home-inn") screenGame.style.removeProperty("--inn-scene-image");
    screenGame.classList.remove("entrance-complete");
    $("entrance-progress").hidden = loc.key !== "entrance";

    state.currentKey = key;
    state.mistakesThisVisit = 0;
    state.selected = 0;
    state.answered = false;
    state.acting = false;
    state.encounterIndex = 0;
    state.stagePhase = "learn";
    state.phaseItems = null;
    state.challengeScore = 0;
    state.challengeCorrectWords = {};
    state.challengeMisses = [];
    state.stageMastered = false;
    state.resumedStageEntry = false;
    if(loc.isHome){ renderHome(); return; }
    if(savedEpisode && savedEpisode.locationKey === loc.key && resumeEpisode()) return;
    // Every shift done, but the place is not yet held: finish it properly
    // rather than replaying an hour of questions already answered.
    if(stageFor(loc.key) && stageComplete(loc.key) && stageMastery(loc.key) < 100){
      if(startMasteryLoop(loc.key)) return;
    }
    // An episode-only place has no room to walk into: the shift is the stage.
    if(!loc.encounters && stageFor(loc.key)){
      if(!state.stageStarted) state.stageStarted = {};
      state.stageStarted[loc.key] = true;
      saveProgress();
      startEpisode(loc.key);
      return;
    }
    if(loc.encounters && state.stageProgress.homeInn){
      var resumed = state.stageProgress.homeInn;
      state.stagePhase = resumed.phase || "learn";
      state.phaseItems = state.stagePhase === "review" ? loc.challenge.filter(function(item){ return (resumed.misses || []).indexOf(item.focusWord) >= 0; }) : null;
      if(state.phaseItems && !state.phaseItems.length){ state.stagePhase = "challenge"; state.phaseItems = null; }
      var resumeItems = state.phaseItems || loc.getPhaseItems(state.stagePhase);
      state.encounterIndex = Math.max(0, Math.min(resumeItems.length - 1, Number(resumed.index) || 0));
      state.challengeScore = Number(resumed.challengeScore) || 0;
      state.resumedAfterDecline = !!resumed.declined;
      state.stageDeclined = false;
      (resumed.correctWords || []).forEach(function(word){ state.challengeCorrectWords[word] = true; });
      state.challengeMisses = loc.challenge.filter(function(item){ return (resumed.misses || []).indexOf(item.focusWord) >= 0; });
      state.stageMastered = !!resumed.mastered;
      state.resumedStageEntry = true;
    }

    var avatarSlot = $("avatar-slot");
    var dialogueShell = $("dialogue-shell");
    if(avatarSlot.parentElement !== dialogueShell){
      dialogueShell.insertBefore(avatarSlot, $("dialogue-panel"));
    }
    var transparentFox = LanternAlleyLogic.shouldUseTransparentFox(loc.key, !!loc.encounters);
    dialogueShell.classList.toggle("entrance-dialogue", transparentFox);
    avatarSlot.classList.add("avatar-animated");
    avatarSlot.classList.toggle("entrance-fox", transparentFox);
    var initialFoxSrc = transparentFox ? ENTRANCE_FOX_POSES.idle : KON_PHOTO_SRC;
    avatarSlot.innerHTML = '<div class="kon-photo-wrap"><img class="kon-photo" id="kon-photo-img" src="' + initialFoxSrc + '" alt="Kon the fox spirit"><div class="live-mouth" aria-hidden="true"></div></div>';
    activeFoxEl = avatarSlot;
    activeFoxImgEl = $("kon-photo-img");
    if(transparentFox){
      var transparentFoxStyle = LanternAlleyLogic.getTransparentFoxStyle();
      activeFoxImgEl.style.boxShadow = transparentFoxStyle.boxShadow;
      activeFoxImgEl.style.filter = transparentFoxStyle.filter;
      var happyMouthStyle = LanternAlleyLogic.getHappyMouthStyle();
      var liveMouthEl = avatarSlot.querySelector(".live-mouth");
      liveMouthEl.style.left = happyMouthStyle.left;
      liveMouthEl.style.top = happyMouthStyle.top;
      liveMouthEl.style.borderRadius = happyMouthStyle.borderRadius;
      liveMouthEl.style.background = happyMouthStyle.background;
    }

    var prompt = getActivePrompt(loc);
    $("stage-phase-row").style.display = loc.encounters ? "flex" : "none";
    $("scene-label").textContent = loc.key === "entrance" ? "路地の入口" : (loc.encounters ? loc.label + " - " + prompt.label : loc.label);
    $("encounter-status").style.display = loc.encounters ? "block" : "none";
    // Resuming into a stage never ran renderStagePrompt, so the day badge kept
    // its markup default of "Learn" and the counter stayed at 1 of 5 no matter
    // which day the learner was actually on. That is why Day 2 looked like
    // Day 1 even though its content differed.
    var resumedMeta = loc.getDayMeta ? loc.getDayMeta(state.stagePhase) : null;
    if(resumedMeta){
      $("stage-phase-badge").textContent = resumedMeta.label + "・" + resumedMeta.mode + " " + resumedMeta.stars;
    }
    var resumedItems = loc.encounters ? (state.phaseItems || loc.getPhaseItems(state.stagePhase)) : null;
    $("encounter-progress").textContent = resumedItems ? String(state.encounterIndex + 1) : "1";
    $("encounter-total").textContent = resumedItems ? String(resumedItems.length) : "1";
    $("narration").textContent = stageNarrationFor(loc, prompt);
    // Day 3 is audio-first, so the written prompt must stay
    // 「音声を聞いてください。」. This path runs when entering a stage and printed
    // the sentence directly, so arriving at Challenge revealed the request.
    $("jp-line").textContent = loc.getWrittenPrompt
      ? loc.getWrittenPrompt(prompt, state.stagePhase)
      : prompt.jp;
    $("romaji-line").textContent = prompt.romaji;
    $("romaji-line").style.display = state.romajiOn ? "block" : "none";
    $("meaning-line").textContent = prompt.meaning;
    // Day 2 shows the English translation as part of the question, in place of
    // the romaji it no longer gets. Every other day reveals meaning only after
    // an answer, so it cannot be read instead of the Japanese.
    $("meaning-line").classList.toggle("show", state.stagePhase === "practice");
    $("hint-box").textContent = prompt.hint;
    $("hint-box").classList.remove("show");
    $("hint-btn").style.display = loc.type === "finale" || loc.key === "entrance" ? "none" : "block";
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";

    renderHud();
    if(loc.encounters && !state.stageProgress.homeInn){
      renderStageIntro(loc);
    }else if(loc.encounters){
      renderInnInteraction(prompt, true);
      speak(prompt.jp, undefined, false, loc.getWrittenPrompt ? loc.getWrittenPrompt(prompt, state.stagePhase) : undefined);
    }else{
      renderScene(prompt);
      if(loc.key === "entrance") startEntranceGreeting(loc);
      else speak(prompt.jp, undefined, false, loc.getWrittenPrompt ? loc.getWrittenPrompt(prompt, state.stagePhase) : undefined);
    }
  }

  function setEntranceChoicesDisabled(disabled){
    var buttons = document.querySelectorAll("#scene .hotspot");
    for(var i=0;i<buttons.length;i++) buttons[i].disabled = disabled;
    $("scene").classList.toggle("entrance-actions-visible", !disabled);
  }

  function renderEntranceTutorialProgress(){
    if(state.currentKey !== "entrance" || !entranceTutorialState) return;
    var progress = LanternAlleyLogic.getTutorialProgress(entranceTutorialState);
    $("entrance-progress-current").textContent = String(progress.current);
  }

  function startEntranceGreeting(loc){
    entranceTutorialState = LanternAlleyLogic.createTutorial();
    setEntranceChoicesDisabled(true);
    renderEntranceTutorialProgress();
    var greeting = LanternAlleyLogic.getTutorialStep(entranceTutorialState);
    $("jp-line").textContent = greeting.jp;
    $("romaji-line").textContent = greeting.romaji;
    $("romaji-line").style.display = state.romajiOn ? "block" : "none";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    setEntranceFoxPose("talkBase");
    speak(greeting.jp, "hello");

    // Each tutorial line waits for the previous one to finish. Fixed 2.6s and
    // 6.6s timers used to talk over Kon, and the clips run longer than that.
    afterSpeech(function(){
      if(state.currentKey !== "entrance" || state.answered) return;
      entranceTutorialState = LanternAlleyLogic.advanceTutorial(entranceTutorialState);
      renderEntranceTutorialProgress();
      var world = LanternAlleyLogic.getTutorialStep(entranceTutorialState);
      $("jp-line").textContent = world.jp;
      $("romaji-line").textContent = world.romaji;
      $("meaning-line").classList.remove("show");
      setEntranceFoxPose("talkBase");
      speak(world.jp, "hello");

      afterSpeech(function(){
        if(state.currentKey !== "entrance" || state.answered) return;
        entranceTutorialState = LanternAlleyLogic.advanceTutorial(entranceTutorialState);
        renderEntranceTutorialProgress();
        var request = LanternAlleyLogic.getTutorialStep(entranceTutorialState);
        $("jp-line").textContent = request.jp;
        $("romaji-line").textContent = request.romaji;
        setEntranceFoxPose("invite");
        setEntranceChoicesDisabled(false);
        speak(request.jp, "ask");
      });
    });
  }

  /* わが家. The one screen in the game that asks nothing of the learner.
   *
   * Deliberately quiet: no clock, no question, no gauge. The wallet is here
   * because this is where the coins are going to be spent, and Kon says one
   * line so the room is not silent on a first visit.
   */
  function renderHome(){
    state.currentKey = "home";
    if(!state.homeVisited){
      state.homeVisited = true;
      saveProgress();
    }
    screenGame.classList.remove("entrance-stage", "inn-stage");
    screenGame.classList.add("home-stage");
    if(typeof LanternHomeGarden !== "undefined" && !gardenState().starterSceneryClaimed){
      state.garden = LanternHomeGarden.claimStarterScenery(gardenState()).garden;
      saveProgress();
    }
    $("stage-phase-row").style.display = "none";
    $("encounter-status").style.display = "none";
    $("hint-btn").style.display = "none";
    $("hint-box").classList.remove("show");
    $("feedback-row").classList.remove("show");
    $("feedback-text").textContent = "";
    $("next-row").style.display = "none";
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    $("meaning-line").classList.remove("show");
    $("scene-label").textContent = "わが家";
    $("narration").textContent = "路地の奥の部屋";

    /* Kon's welcome is the tutorial's first line on a first visit, so it is not
     * also said here - the learner would be greeted twice. With nothing to say,
     * the speech panel is an empty box and a mute button holding a hundred
     * pixels above the yard, so it is taken out rather than left blank. */
    if(!state.homeTutorialComplete){
      $("jp-line").textContent = "";
      $("dialogue-shell").classList.add("is-silent");
      startHomeTutorial(false);
      renderHud();
      return;
    }
    $("dialogue-shell").classList.remove("is-silent");

    var line = "コン：「おかえりなさい。ゆっくりしていってください。」";
    if(dialogueFlow) dialogueFlow.start(line, false);
    else $("jp-line").textContent = line;

    paintHome();
    renderHud();
  }

  /* ---- The yard, the room, and the shop that fills them ----
   *
   * Money counted upward for the whole game and bought nothing. This is the
   * sink: coins earned at the inn and the market turn into a house that looks
   * like somebody lives in it.
   *
   * The yard opens first and the house is behind a tap, because the garden is
   * the part that changes on its own - a plant that grew while you were away is
   * a reason to come back, and burying it one screen deep wastes it.
   *
   * The flow is two taps everywhere, because it has to work with a thumb. Tap
   * something you own and only the places it could stand light up; tap a place
   * and it goes there. Nothing is dragged onto a target too small to hit.
   *
   * Both scenes are a painted background with things positioned on top by
   * percentage, so the same room works at 320px and on a desktop.
   */
  var homeView = "yard";      // "yard" | "interior" | "shop"
  var homeReturnView = "yard";
  var homeDecorating = false;
  var homeShopCategory = "plants";
  var homeSelected = null;    // {kind:"decor"|"plant", id:...} waiting to be placed
  var homeTab = "garden";     // "garden" | "storage" | "shop"
  var homeNotice = "";
  var homePetState = null;
  var homePetFrame = 0;
  var homePetLastTime = 0;
  var homePetIdleMs = 0;

  /* The light in the yard and the room follows the learner's own clock, and
   * that is the whole of it: there is no picker, on purpose.
   *
   * A cosmetic override was designed and dropped. The house is somewhere to
   * come back to rather than something to configure, and asking what time it
   * should look like is a question a learner has no reason to have an opinion
   * about - their own evening is the right answer. Metadata and styling for a
   * picker were removed with this comment; if it ever comes back, it comes
   * back as a decision rather than as leftovers.
   *
   * Lighting touches filters and overlays only. It cannot reach growth,
   * rewards or lessons. */
  function effectiveHomeLighting(){
    var hour = new Date().getHours();
    if(hour >= 5 && hour < 10) return "morning";
    if(hour >= 10 && hour < 17) return "day";
    if(hour >= 17 && hour < 20) return "evening";
    return "night";
  }

  function homeSceneChrome(area){
    var back = area === "interior"
      ? '<button type="button" class="home-scene-back" data-leave-house="1">&larr; 庭</button>'
      : '<button type="button" class="home-scene-back" data-home-map="1">&larr; Lantern Alley</button>';
    return '<div class="home-scene-chrome" aria-label="わが家の情報">'
      + back
      + '<span class="home-scene-stars">' + (state.stars || 0) + ' ⭐</span>'
      + '<span class="home-scene-money">¥' + (state.money || 0) + '</span>'
      + '</div>';
  }

  /* Which species have painted art, and where each stage lives.
   *
   * Spelled out rather than built from the id and the stage, because a path
   * assembled at runtime never appears in the source - and the standalone
   * build inlines assets by finding their paths in the source. Concatenating
   * them meant every planted camellia was a broken image in the artifact while
   * looking perfectly fine when served as files.
   *
   * The table is also the switch: a species with an entry is painted, one
   * without is drawn. Adding a species is one block. */
  var PLANT_ART = {
    "cherry-tree": {
      planted: "assets/home/garden/sakura-planted-v1.webp",
      sprout:  "assets/home/garden/sakura-sprout-v1.webp",
      sapling: "assets/home/garden/sakura-sapling-v1.webp",
      young:   "assets/home/garden/sakura-young-v1.webp",
      mature:  "assets/home/garden/sakura-mature-v1.webp"
    },
    "japanese-maple": {
      planted: "assets/home/garden/maple-planted-v1.webp",
      sprout:  "assets/home/garden/maple-sprout-v1.webp",
      sapling: "assets/home/garden/maple-sapling-v1.webp",
      young:   "assets/home/garden/maple-young-v1.webp",
      mature:  "assets/home/garden/maple-mature-v1.webp"
    },
    camellia: {
      planted: "assets/home/garden/camellia-planted-v1.webp",
      sprout:  "assets/home/garden/camellia-sprout-v1.webp",
      growing: "assets/home/garden/camellia-growing-v1.webp",
      mature:  "assets/home/garden/camellia-mature-v1.webp"
    }
  };

  /* Stand-in art, so the whole garden is playable before it is painted.
   *
   * Seven of the eight species have no pictures yet. Rather than hide them and
   * ship a shop with one thing in it, they are drawn from data: a silhouette
   * per kind, a colour per species, and four sizes for the four stages. They
   * are obviously drawings, which is the point - nobody will mistake one for
   * the finished art, and the garden can be played and balanced now.
   *
   * Swapping in a real set is one line: drop the four PNGs into
   * assets/home/garden/ and add the species to PLANT_ART. Nothing else
   * changes, and pwa.test.mjs will fail the build if the files are not there.
   *
   * Because these are generated, every stage shares a baseline exactly, so no
   * PLANT_BASE row is needed for a species until it gets real art.
   */
  var PLANT_TINT = {
    "cherry-tree":     {leaf:"#5f8a52", bloom:"#e8a9bd"},
    "japanese-maple":  {leaf:"#6a8a4e", bloom:"#c4543a"},
    "pine-tree":       {leaf:"#3f6b46", bloom:"#3f6b46"},
    "hydrangea":       {leaf:"#4f7d4a", bloom:"#7f8fc4"},
    "camellia":        {leaf:"#3f6b46", bloom:"#c4485c"},
    "iris":            {leaf:"#4f7d4a", bloom:"#7a6ab5"},
    "chrysanthemum":   {leaf:"#4f7d4a", bloom:"#e0c25e"},
    "lantern-flower-bed": {leaf:"#4f7d4a", bloom:"#e08a3c"}
  };

  // How tall each stage stands, as a fraction of the mature plant.
  var STAGE_SCALE = {planted:0.28, sprout:0.45, growing:0.72, mature:1};

  /* A plant's width in the front row, as a percentage of the scene. Every bed
   * takes a fraction of this from its own `scale`, so one number sets the
   * whole garden's sense of size. */
  var PLANT_WIDTH = 22;

  function placeholderPlant(typeId, stage){
    var tint = PLANT_TINT[typeId] || {leaf:"#4f7d4a", bloom:"#c4485c"};
    var type = (typeof LanternHomeGarden !== "undefined")
      ? LanternHomeGarden.catalogue().filter(function(t){ return t.id === typeId; })[0] : null;
    var kind = type ? type.kind : "flower";
    var k = STAGE_SCALE[stage] || 1;
    var h = (kind === "tree" ? 96 : kind === "shrub" ? 62 : 52) * k;   // above ground
    var w = (kind === "tree" ? 62 : kind === "shrub" ? 74 : 40) * k;

    // Drawn on a 120x120 box with the ground line at y=104, so every stage of
    // every species stands on the same spot.
    var art = '<ellipse cx="60" cy="104" rx="' + (16 + w * 0.22).toFixed(1)
      + '" ry="5" fill="#4a3524" opacity="0.55"/>';

    if(stage === "planted"){
      art += '<path d="M60 104 q-3 -' + h.toFixed(0) + ' 4 -' + (h + 4).toFixed(0)
        + '" stroke="' + tint.leaf + '" stroke-width="3" fill="none"/>'
        + '<ellipse cx="' + (62 + w * 0.2).toFixed(1) + '" cy="' + (104 - h).toFixed(1)
        + '" rx="7" ry="4" fill="' + tint.leaf + '"/>';
      return art;
    }

    art += '<line x1="60" y1="104" x2="60" y2="' + (104 - h).toFixed(1)
      + '" stroke="' + (kind === "tree" ? "#6b4530" : tint.leaf)
      + '" stroke-width="' + (kind === "tree" ? 6 * k + 2 : 3).toFixed(1) + '"/>';

    if(kind === "tree"){
      art += '<circle cx="60" cy="' + (104 - h).toFixed(1) + '" r="' + (w * 0.55).toFixed(1)
        + '" fill="' + tint.leaf + '"/>'
        + '<circle cx="' + (60 - w * 0.34).toFixed(1) + '" cy="' + (104 - h * 0.82).toFixed(1)
        + '" r="' + (w * 0.36).toFixed(1) + '" fill="' + tint.leaf + '"/>'
        + '<circle cx="' + (60 + w * 0.34).toFixed(1) + '" cy="' + (104 - h * 0.82).toFixed(1)
        + '" r="' + (w * 0.36).toFixed(1) + '" fill="' + tint.leaf + '"/>';
    }else if(kind === "shrub"){
      art += '<path d="M' + (60 - w * 0.5).toFixed(1) + ' 104 q0 -' + h.toFixed(0)
        + ' ' + (w * 0.5).toFixed(1) + ' -' + h.toFixed(0)
        + ' q' + (w * 0.5).toFixed(1) + ' 0 ' + (w * 0.5).toFixed(1) + ' ' + h.toFixed(0)
        + ' Z" fill="' + tint.leaf + '"/>';
    }else{
      art += '<ellipse cx="' + (60 - w * 0.42).toFixed(1) + '" cy="' + (104 - h * 0.45).toFixed(1)
        + '" rx="' + (w * 0.4).toFixed(1) + '" ry="' + (h * 0.16).toFixed(1)
        + '" fill="' + tint.leaf + '"/>'
        + '<ellipse cx="' + (60 + w * 0.42).toFixed(1) + '" cy="' + (104 - h * 0.6).toFixed(1)
        + '" rx="' + (w * 0.4).toFixed(1) + '" ry="' + (h * 0.16).toFixed(1)
        + '" fill="' + tint.leaf + '"/>';
    }

    // Flowers only once it is worth looking at, so the stages read differently.
    if(stage === "growing" || stage === "mature"){
      var blooms = stage === "mature" ? 3 : 1;
      for(var i = 0; i < blooms; i++){
        var bx = 60 + (i - (blooms - 1) / 2) * w * 0.44;
        var by = 104 - h - (kind === "tree" ? -w * 0.2 : 2);
        art += '<circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1)
          + '" r="' + (5 + 3 * k).toFixed(1) + '" fill="' + tint.bloom + '"/>';
      }
    }
    return art;
  }

  function plantHasArt(typeId){
    return !!PLANT_ART[typeId];
  }

  /* One picture of a plant, however it happens to be drawn today. Every caller
   * goes through this, so the day the art lands nothing else has to change. */
  function plantFigure(typeId, stage, label){
    if(plantHasArt(typeId)){
      return '<img src="' + plantArt(typeId, stage) + '" alt="' + (label || "") + '">';
    }
    return '<svg viewBox="0 0 120 120" class="home-plant-drawn" role="img" aria-label="'
      + (label || "") + '">' + placeholderPlant(typeId, stage) + '</svg>';
  }

  function plantVisualStage(plant){
    if(!plant || plant.stage !== "growing") return plant ? plant.stage : "planted";
    var type = (typeof LanternHomeGarden !== "undefined")
      ? LanternHomeGarden.catalogue().filter(function(row){ return row.id === plant.typeId; })[0] : null;
    if(!type || !PLANT_ART[plant.typeId] || !PLANT_ART[plant.typeId].young) return "growing";
    return plant.growthPoints >= Math.ceil(type.matureAt * 0.72) ? "young" : "sapling";
  }

  /* Where the plant meets the ground, per stage, as a percentage down its own
   * file. The four camellia pictures do not share a baseline - the seedling's
   * art stops at 77% of its frame and the mature bush at 94% - so anchoring
   * them all the same way left the young plant hovering above its bed. These
   * numbers come from each file's alpha bounding box.
   *
   * Task 7 generates the remaining species; each one needs its own row, or
   * consistent baselines at generation time so this table can go away. */
  var PLANT_BASE = {
    camellia: {planted:77.4, sprout:82.7, growing:94.0, mature:94.5},
    "cherry-tree": {planted:96.5, sprout:96.5, sapling:96.5, young:96.5, mature:96.5},
    "japanese-maple": {planted:96.5, sprout:96.5, sapling:96.5, young:96.5, mature:96.5}
  };
  var PLANT_BASE_FALLBACK = {planted:90, sprout:90, growing:92, mature:94};

  function plantBase(typeId, stage){
    // A drawn stand-in is built with its ground line at y=104 of a 120 box, so
    // its anchor is known exactly rather than measured.
    if(!plantHasArt(typeId)) return 86.7;
    var rows = PLANT_BASE[typeId] || PLANT_BASE_FALLBACK;
    return rows[stage] || rows.mature || 92;
  }

  function homeState(){
    if(!state.home) state.home = {owned:[], placed:{}};
    if(!state.home.owned) state.home.owned = [];
    if(!state.home.placed) state.home.placed = {};
    return state.home;
  }

  function gardenState(){
    if(!state.garden) state.garden = emptyGardenState();
    return state.garden;
  }

  function homeScenes(){
    return (typeof LanternHomeRoom !== "undefined" && LanternHomeRoom.scenes)
      ? LanternHomeRoom.scenes() : null;
  }

  function homeSlots(){
    var scenes = homeScenes();
    return scenes ? scenes.interior.slots : [];
  }

  function yardSlots(){
    var scenes = homeScenes();
    return scenes ? scenes.yard.slots : [];
  }

  function plantArt(typeId, stage){
    var set = PLANT_ART[typeId];
    return set ? (set[stage || "planted"] || set.planted) : "";
  }

  function plantName(typeId){
    if(typeof LanternHomeGarden === "undefined") return typeId;
    var type = LanternHomeGarden.catalogue().filter(function(t){ return t.id === typeId; })[0];
    return type ? (PLANT_JP[type.id] || type.name) : typeId;
  }

  // The rest of the game speaks Japanese to the learner; the engine's own
  // catalogue is in English for the tests that read it.
  var PLANT_JP = {
    "cherry-tree":"桜", "japanese-maple":"もみじ", "pine-tree":"松",
    "hydrangea":"あじさい", "camellia":"椿", "iris":"あやめ",
    "chrysanthemum":"菊", "lantern-flower-bed":"ほおずきの花壇"
  };

  var STAGE_JP = {planted:"植えたばかり", sprout:"芽", growing:"育ち中", mature:"満開"};

  function plantsInYard(){
    return (gardenState().plants || []).filter(function(p){ return p.slotId; });
  }

  function plantsInStorage(){
    return (gardenState().plants || []).filter(function(p){ return !p.slotId; });
  }

  function findPlant(instanceId){
    return (gardenState().plants || []).filter(function(p){ return p.id === instanceId; })[0] || null;
  }

  /* ---- scene painting ---- */

  function sceneLayer(background, label){
    return '<img class="home-scene-bg" src="' + background + '" alt="' + label + '">';
  }

  function positioned(className, slot, inner, attrs, extraStyle){
    return '<div class="' + className + '" style="left:' + slot.x + '%;top:' + slot.y + '%;'
      + (extraStyle || "") + '"'
      + (attrs || "") + '>' + inner + '</div>';
  }

  /* An object's size on screen is what it is, times where it stands.
   *
   * This used to be the item alone, so the same low table covered the same
   * fraction of the picture at the back wall as at the front of the room - the
   * one thing a scene drawn in perspective cannot survive. The slot's `scale`
   * supplies the depth; the table below stays what it always was, the object's
   * own size. */
  function decorSceneWidth(item, slot){
    var widths = {
      "rug-plain":26, "low-table":28, kotatsu:30, "folding-screen":32,
      "floor-cushion-navy":18, "plant-small":12, brazier:12,
      "floor-lantern":10, chrysanthemum:12, scroll:12, "wall-lamp":9,
      fan:10, mask:9, teapot:8, books:10, "cat-figure":8, daruma:8,
      "sakura-bonsai":13, "pine-bonsai":13, "sill-plant":7, "wind-chime":7
    };
    var base = widths[item && item.id] || 18;
    return +(base * ((slot && slot.scale) || 1)).toFixed(2);
  }

  function homePetMarkup(scene){
    if(typeof LanternHomePet === "undefined") return "";
    if(!homePetState || homePetState.scene !== scene){
      homePetState = LanternHomePet.enterScene
        ? LanternHomePet.enterScene(scene, Date.now())
        : LanternHomePet.create(scene, Date.now());
      homePetIdleMs = 0;
    }
    var sprite = LanternHomePet.spriteFor(homePetState);
    var petWidth = (typeof LanternHomePet !== "undefined" && LanternHomePet.widthAt)
      ? LanternHomePet.widthAt(homePetState.y) : 7.5;
    return '<div class="home-pet" aria-hidden="true" style="width:' + petWidth + '%;left:' + homePetState.x
      + '%;top:' + homePetState.y + '%;--pet-facing:' + homePetState.facing + '">'
      + '<span style="background-image:url(\'' + sprite.path + '\');background-size:'
      + (sprite.columns * 100) + '% ' + (sprite.rows * 100) + '%"></span></div>';
  }

  function updateHomePetNode(){
    var node = document.querySelector(".home-pet");
    if(!node || !homePetState || typeof LanternHomePet === "undefined") return;
    var sprite = LanternHomePet.spriteFor(homePetState);
    var column = sprite.frame % sprite.columns;
    var row = Math.floor(sprite.frame / sprite.columns);
    var x = sprite.columns > 1 ? column * 100 / (sprite.columns - 1) : 0;
    var y = sprite.rows > 1 ? row * 100 / (sprite.rows - 1) : 0;
    node.style.left = homePetState.x + "%";
    node.style.top = homePetState.y + "%";
    node.style.setProperty("--pet-facing", homePetState.facing);
    var art = node.firstElementChild;
    if(art){
      art.style.backgroundImage = "url('" + sprite.path + "')";
      art.style.backgroundSize = (sprite.columns * 100) + "% " + (sprite.rows * 100) + "%";
      art.style.backgroundPosition = x + "% " + y + "%";
    }
  }

  function startHomePetMotion(){
    if(homePetFrame && typeof cancelAnimationFrame === "function") cancelAnimationFrame(homePetFrame);
    if(typeof requestAnimationFrame !== "function" || homeView === "shop") return;
    homePetLastTime = 0;
    function tick(time){
      if(state.currentKey !== "home" || homeView === "shop") return;
      var elapsed = homePetLastTime ? Math.min(80, time - homePetLastTime) : 16;
      homePetLastTime = time;
      var reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
      homePetState = LanternHomePet.step(homePetState, elapsed, {paused:document.hidden, reducedMotion:reduced});
      if(homePetState && !homePetState.targetId){
        homePetIdleMs += elapsed;
        var dwell = LanternHomePet.dwellMs ? LanternHomePet.dwellMs(homePetState) : 6000;
        if(!reduced && homePetIdleMs > dwell){
          var anchors = LanternHomePet.anchors(homePetState.scene);
          var choices = anchors.filter(function(anchor){ return anchor.id !== homePetState.anchorId; });
          homePetState.seed = (homePetState.seed * 1664525 + 1013904223) >>> 0;
          homePetState = LanternHomePet.sendTo(homePetState, choices[homePetState.seed % choices.length].id);
          homePetIdleMs = 0;
        }
      }
      updateHomePetNode();
      homePetFrame = requestAnimationFrame(tick);
    }
    homePetFrame = requestAnimationFrame(tick);
  }

  function targetButton(slot, occupied){
    return '<button type="button" class="home-target' + (occupied ? " is-occupied" : "") + '"'
      + ' data-slot="' + slot.id + '" style="left:' + slot.x + '%;top:' + slot.y + '%"'
      + ' aria-label="' + slot.label + (occupied ? "（入れかえる）" : "に置く") + '">'
      + '<span aria-hidden="true">' + (occupied ? "↔" : "+") + '</span></button>';
  }

  function renderHomeYard(){
    var scenes = homeScenes();
    if(!scenes) return "";
    var yard = scenes.yard;
    var slots = yard.slots;
    var byId = {};
    plantsInYard().forEach(function(p){ byId[p.slotId] = p; });
    var picking = homeSelected && homeSelected.kind === "plant";

    var html = '<div class="home-scene home-yard-scene light-' + effectiveHomeLighting() + '">'
      + sceneLayer(yard.background, "わが家の庭") + homePetMarkup("yard") + homeSceneChrome("yard");

    // The house is a real button, not a hot region with no name: a learner who
    // cannot see the picture still has to be able to go inside.
    html += '<button type="button" class="home-house-hotspot" data-enter-house="1"'
      + ' style="left:' + yard.houseHotspot.x + '%;top:' + yard.houseHotspot.y + '%;'
      + 'width:' + yard.houseHotspot.width + '%;height:' + yard.houseHotspot.height + '%"'
      + ' aria-label="' + yard.houseHotspot.label + '"><span>' + yard.houseHotspot.label + '</span></button>';

    slots.forEach(function(slot){
      var plant = byId[slot.id];
      if(!plant) return;
      var visualStage = plantVisualStage(plant);
      var base = plantBase(plant.typeId, visualStage);
      /* Sized against its own bed, not against the scene. A camellia in the
       * back row is a third the size of the same camellia at the front,
       * because that is what the painting does with everything else in it. */
      var width = (PLANT_WIDTH * (slot.scale || 1)).toFixed(2);
      html += '<div class="home-plant' + (plant.pendingAnimation ? " is-growing" : "") + '"'
        + ' style="left:' + slot.x + '%;top:' + slot.y + '%;width:' + width + '%;'
        + 'transform:translate(-50%,-' + base + '%)"'
        + ' data-plant="' + plant.id + '" role="button" tabindex="0"'
        + ' aria-label="' + plantName(plant.typeId) + ' をあつかう">'
        + plantFigure(plant.typeId, visualStage,
            plantName(plant.typeId) + '（' + (STAGE_JP[plant.stage] || plant.stage) + '）')
        + '</div>';
    });

    if(picking){
      slots.forEach(function(slot){ html += targetButton(slot, !!byId[slot.id]); });
    }
    return html + '</div>';
  }

  /* The chosen wallpaper, over the upper part of the room only.
   *
   * The room is a painting, so the pattern is laid over the walls rather than
   * replacing them - it tints and textures what is already there, and stops
   * above the tatami. 無地 draws nothing at all, which is the room as painted. */
  function wallpaperLayer(){
    var svg = LanternHomeDecor.wallpaperSvg(state.activeWallpaper || "wallpaper-plain");
    return svg ? '<div class="home-wallpaper" aria-hidden="true">' + svg + '</div>' : "";
  }

  function renderHomeInterior(){
    var scenes = homeScenes();
    if(!scenes) return "";
    var interior = scenes.interior;
    var home = homeState();
    var decor = (typeof LanternHomeDecor !== "undefined") ? LanternHomeDecor : null;
    var picked = (homeSelected && homeSelected.kind === "decor" && decor)
      ? decor.getItem(homeSelected.id) : null;

    var html = '<div class="home-scene home-interior-scene light-' + effectiveHomeLighting() + '">'
      + sceneLayer(interior.background, "わが家の部屋")
      + wallpaperLayer() + homePetMarkup("interior") + homeSceneChrome("interior");

    if(decor){
      interior.slots.forEach(function(slot){
        var here = home.placed[slot.id];
        if(!here) return;
        var item = decor.getItem(here) || {name:""};
        html += positioned("home-item", slot, decorArt(here, item.name),
          ' data-slot-item="' + slot.id + '" role="button" tabindex="0"'
            + ' aria-label="' + item.name + ' をかたづける"',
          'width:' + decorSceneWidth(item, slot) + '%');
      });
      if(picked){
        interior.slots.forEach(function(slot){
          if(slot.kind !== picked.kind) return;
          html += targetButton(slot, !!home.placed[slot.id]);
        });
      }
    }
    return html + '</div>';
  }

  /* Use production pictures where the catalogue has them and retain the
   * original vectors as reliable fallbacks. */
  function decorArt(id, name){
    var decor = LanternHomeDecor;
    var item = decor.getItem(id);
    if(item && item.image) return '<img src="' + item.image + '" alt="' + name + '">';
    return '<svg viewBox="-60 -52 120 104" role="img" aria-label="' + name + '">'
      + decor.svgFor(id) + '</svg>';
  }

  /* ---- the dock: what you own and what you can buy ---- */

  function dockCard(art, label, sub, attr, extra){
    return '<button type="button" class="home-card' + (extra || '') + '" ' + attr + '>'
      + '<span class="home-card-art" aria-hidden="true">' + art + '</span>'
      + '<span class="home-card-name">' + label + '</span>'
      + '<span class="home-card-sub">' + sub + '</span></button>';
  }

  function decorCardArt(id){
    var item = LanternHomeDecor.getItem(id);
    if(item && item.image) return '<img src="' + item.image + '" alt="">';
    return '<svg viewBox="-60 -52 120 104" aria-hidden="true">' + LanternHomeDecor.svgFor(id) + '</svg>';
  }

  function homeDock(){
    var money = state.money || 0;
    var html = "";
    // While a gift is on offer the dock shows only the gift, so the one thing
    // the learner is being asked to press is the only thing there.
    var step = tutorialStep();
    if(step && !homeTutorialReplay && (step.id === "claim-seed" || step.id === "claim-cushion")) return "";

    if(homeTab === "garden"){
      var waiting = plantsInStorage();
      if(!(gardenState().plants || []).length){
        return '<p class="home-empty">まだ何も植えていません。「店」で種を買ってみましょう。</p>';
      }
      if(!waiting.length){
        return '<p class="home-empty">持っている草花は全部植えてあります。</p>'
          + gardenSummary();
      }
      waiting.forEach(function(plant){
        /* The picture stage, not the engine stage.
         *
         * Sakura and maple are painted in five steps and the engine counts in
         * four, so `growing` has no picture of its own and falls back to the
         * bare seedling. The yard already resolves that; this card did not, so
         * the same half-grown tree was a sapling in the ground and a sprout in
         * the cupboard. */
        html += dockCard(plantFigure(plant.typeId, plantVisualStage(plant), ""),
          plantName(plant.typeId), STAGE_JP[plant.stage] || plant.stage,
          'data-pick-plant="' + plant.id + '"',
          (homeSelected && homeSelected.kind === "plant" && homeSelected.id === plant.id) ? " is-picked" : "");
      });
      return html + gardenSummary();
    }

    if(homeTab === "wallpaper"){
      /* Owned and active are separate, so changing your mind never costs the
       * roll you already paid for. A pattern you own is always one tap away. */
      LanternHomeDecor.wallpapers().forEach(function(paper){
        var owned = LanternHomeDecor.ownsWallpaper(homeState(), paper.id);
        var active = (state.activeWallpaper || "wallpaper-plain") === paper.id;
        var swatch = paper.hasPattern
          ? '<span class="home-swatch">' + LanternHomeDecor.wallpaperSvg(paper.id) + '</span>'
          : '<span class="home-swatch is-plain"></span>';
        html += dockCard(swatch, paper.name,
          active ? "使用中" : (owned ? "はる" : "¥" + paper.price),
          (owned ? 'data-wallpaper="' : 'data-buy-wallpaper="') + paper.id + '"',
          active ? " is-picked" : (owned || money >= paper.price ? "" : " is-locked"));
      });
      return html;
    }

    if(homeTab === "storage"){
      var stored = LanternHomeDecor.inStorage(homeState());
      if(!homeState().owned.length){
        return '<p class="home-empty">まだ何も持っていません。「店」で買ってみましょう。</p>';
      }
      if(!stored.length){
        return '<p class="home-empty">持っているものは全部かざってあります。</p>';
      }
      stored.forEach(function(id){
        var item = LanternHomeDecor.getItem(id);
        html += dockCard(decorCardArt(id), item.name, item.category,
          'data-pick="' + id + '"',
          (homeSelected && homeSelected.kind === "decor" && homeSelected.id === id) ? " is-picked" : "");
      });
      return html;
    }

    // The shop sells seeds in the yard and furniture in the house, because a
    // learner standing in the garden is not shopping for a wall scroll.
    if(homeView === "yard"){
      if(typeof LanternHomeGarden === "undefined") return '<p class="home-empty">店はまだ開いていません。</p>';
      LanternHomeGarden.catalogue().forEach(function(type){
        html += dockCard(plantFigure(type.id, "mature", ""),
          PLANT_JP[type.id] || type.name, "¥" + type.price,
          'data-buy-plant="' + type.id + '"',
          money >= type.price ? "" : " is-locked");
      });
      return html || '<p class="home-empty">売れる苗がまだありません。</p>';
    }

    LanternHomeDecor.catalogue().forEach(function(item){
      var owned = LanternHomeDecor.owns(homeState(), item.id);
      html += dockCard(decorCardArt(item.id), item.name,
        owned ? "持っている" : "¥" + item.price,
        'data-buy="' + item.id + '"' + (owned ? " disabled" : ""),
        owned ? " is-owned" : (money >= item.price ? "" : " is-locked"));
    });
    return html;
  }

  /* Growth is the whole point of the garden, so what a plant is still waiting
   * for is stated rather than left to be guessed from its picture. */
  function gardenSummary(){
    if(typeof LanternHomeGarden === "undefined") return "";
    var lines = plantsInYard().map(function(plant){
      var left = LanternHomeGarden.lessonsRemaining(plant);
      return '<li>' + plantName(plant.typeId) + '：'
        + (left > 0 ? 'あと ' + left + ' 回の稽古で育ちます' : '満開です') + '</li>';
    });
    return lines.length ? '<ul class="home-garden-list">' + lines.join("") + '</ul>' : "";
  }

  /* What the shop still holds, across all three of its shelves.
   *
   * This used to ask `LanternHomeDecor.nearestUnaffordable`, which knows only
   * about furniture. Once the shop began selling plants and wallpaper the line
   * was answering a question about a third of the stock, and its empty case
   * made things worse: a null there means "nothing is currently out of reach",
   * and it was being read as "you own everything". A learner with 2,120 yen,
   * five unbought species and thirteen unbought furniture items was being told
   * the shop was cleared out. */
  function homeWants(){
    var money = state.money || 0;
    var home = homeState();
    var wanted = [];

    LanternHomeDecor.catalogue().forEach(function(item){
      if(!LanternHomeDecor.owns(home, item.id)) wanted.push({name:item.name, price:item.price});
    });
    LanternHomeDecor.wallpapers().forEach(function(paper){
      if(!LanternHomeDecor.ownsWallpaper(home, paper.id)) wanted.push({name:paper.name, price:paper.price});
    });
    if(typeof LanternHomeGarden !== "undefined"){
      LanternHomeGarden.catalogue().forEach(function(type){
        wanted.push({name:PLANT_JP[type.id] || type.name, price:type.price});
      });
    }

    var short = wanted.filter(function(w){ return w.price > money; })
                      .sort(function(a, b){ return a.price - b.price; })[0];
    return {
      // Nothing left to buy at all.
      empty: wanted.length === 0,
      // Something is out of reach, and how far.
      next: short ? {name:short.name, short:short.price - money} : null,
      // Everything left is affordable, which is a different thing entirely.
      affordable: wanted.length > 0 && !short
    };
  }

  function homeGoalLine(){
    /* The gap between what a learner has and the next thing they want is the
     * part that brings them back tomorrow, so it is said out loud. */
    if(homeNotice) return '<p class="home-goal">' + homeNotice + '</p>';
    var want = homeWants();
    if(want.next){
      return '<p class="home-goal">あと <b>¥' + want.next.short + '</b> で「'
        + want.next.name + '」が買えます。</p>';
    }
    if(want.affordable){
      return '<p class="home-goal">お店のものは今なら全部買えます。</p>';
    }
    return '<p class="home-goal">お店のものは全部そろいました。</p>';
  }

  /* ---- Kon's first visit ----
   *
   * A learner arriving at an empty yard with a wallet and no explanation will
   * read it as scenery. The tutorial exists to make them do each thing once:
   * take a seed, plant it, go inside, take a cushion, place it, move it. After
   * that the house explains itself.
   *
   * Two rules shape the whole thing.
   *
   * It advances on the action, never on a Next button. A tutorial that can be
   * clicked through teaches nothing, and this one is short enough that doing
   * the step is faster than reading about it.
   *
   * Replaying it gives nothing away twice. 「使いかた」 walks the same script
   * with the claim steps already satisfied, so a learner can re-read the
   * explanation without farming free plants. The claim functions check current
   * ownership as well as the flags, so even a corrupted save cannot mint a
   * second camellia.
   *
   * Kon speaks Japanese because he always has. The one English line is the
   * mechanical instruction - which thing to press - kept separate from the
   * Japanese so a learner is never guessing at both at once.
   */
  var STARTER_PLANT = "camellia";
  var STARTER_DECOR = "floor-cushion-navy";

  var HOME_TUTORIAL = [
    {id:"welcome",
     jp:"コン：「おかえりなさい。ここがあなたの家と庭です。稽古で稼いだお金で、少しずつ好きなように整えていきましょう。」",
     how:"Press 店.",
     done:function(){ return homeView === "shop"; }},

    {id:"claim-seed",
     jp:"コン：「まずは椿の苗を一つどうぞ。お代はいりません。」",
     how:"Press the free 椿 seed to take it.",
     done:function(){ return state.starterSeedClaimed === true; }},

    {id:"plant-seed",
     jp:"コン：「好きなところに植えてください。この庭の草花は、日にちではなく稽古で育ちます。」",
     how:"Press a glowing spot to plant it.",
     /* The seed the learner was just handed, not any plant in the yard.
      *
      * "Is anything planted?" was true before they touched it, because a first
      * visit already grants a pine and a maple as scenery - so the step
      * satisfied itself and the tutorial skipped from taking the seed straight
      * to going indoors, never once teaching the thing it exists to teach. */
     done:function(){
       var seed = findPlant(starterSeedInstance);
       return !!(seed && seed.slotId);
     }},

    {id:"enter-house",
     jp:"コン：「家の中も見ていきましょう。戸を押してください。」",
     how:"Press the door to go inside.",
     done:function(){ return homeView === "interior"; }},

    {id:"claim-cushion",
     jp:"コン：「座布団を一枚どうぞ。これもお代はいりません。」",
     how:"Press 店, then the free 座布団.",
     done:function(){ return state.starterCushionClaimed === true; }},

    {id:"place-cushion",
     jp:"コン：「持ち物からえらんで、置きたいところに置いてください。」",
     how:"Press 飾る, then the 座布団, then a glowing spot.",
     done:function(){ return decorPlacedAt(STARTER_DECOR) !== null; }},

    {id:"move-cushion",
     jp:"コン：「気に入らなければ、置いたものを押せば持ち物にもどせます。何度でもやり直せますよ。」",
     how:"Press the cushion in the room to put it away again.",
     done:function(){ return homeTutorialMoved; }},

    {id:"finish",
     jp:"コン：「これで全部です。稽古をして、お金を貯めて、好きな家にしてください。」",
     how:"Press 分かりました to finish.",
     done:function(){ return false; }}
  ];

  // Which plant the free seed became, so the tutorial can tell it apart from
  // the starter scenery that is already standing in the yard.
  var starterSeedInstance = null;
  var homeTutorialAt = -1;      // -1 means the tutorial is not running
  var homeTutorialReplay = false;
  var homeTutorialMoved = false;

  function tutorialRunning(){
    return homeTutorialAt >= 0 && homeTutorialAt < HOME_TUTORIAL.length;
  }

  function tutorialStep(){
    return tutorialRunning() ? HOME_TUTORIAL[homeTutorialAt] : null;
  }

  function decorPlacedAt(id){
    var placed = homeState().placed || {};
    var found = null;
    Object.keys(placed).forEach(function(slot){ if(placed[slot] === id) found = slot; });
    return found;
  }

  function startHomeTutorial(replay){
    homeTutorialReplay = !!replay;
    homeTutorialMoved = false;
    homeTutorialAt = 0;
    homeView = "yard";
    homeSelected = null;
    homeTab = "garden";
    paintHome();
  }

  /* Called after every home action. Steps whose work is already done - which is
   * every claim step on a replay - fall through silently, so the script reads
   * the same either way without handing anything out again. */
  function advanceHomeTutorial(){
    if(!tutorialRunning()) return;
    var guard = 0;
    while(tutorialRunning() && HOME_TUTORIAL[homeTutorialAt].done() && guard < HOME_TUTORIAL.length + 2){
      homeTutorialAt += 1;
      guard += 1;
    }
    if(homeTutorialAt >= HOME_TUTORIAL.length) endHomeTutorial();
  }

  function endHomeTutorial(){
    homeTutorialAt = -1;
    if(!homeTutorialReplay && !state.homeTutorialComplete){
      state.homeTutorialComplete = true;
      saveProgress();
    }
    homeTutorialReplay = false;
    paintHome();
  }

  /* The free gifts. Both flags and current holdings are checked, because the
   * flag is the record of the promise and the holding is the truth. */
  function claimHomeStarter(kind){
    if(homeTutorialReplay) return false;
    if(kind === "plant"){
      if(state.starterSeedClaimed) return false;
      if(typeof LanternHomeGarden === "undefined") return false;
      var claim = LanternHomeGarden.claimStarter(gardenState());
      state.garden = claim.garden;
      state.starterSeedClaimed = true;
      saveProgress();
      if(!claim.ok) return false;          // already had one; the flag is now honest
      starterSeedInstance = claim.instanceId;
      homeSelected = {kind:"plant", id:claim.instanceId};
      homeView = homeReturnView;
      homeDecorating = true;
      homeTab = "garden";
      return true;
    }
    if(state.starterCushionClaimed) return false;
    state.starterCushionClaimed = true;
    if(LanternHomeDecor.owns(homeState(), STARTER_DECOR)){
      saveProgress();
      return false;
    }
    state.home = {owned: homeState().owned.concat([STARTER_DECOR]),
                  placed: homeState().placed};
    homeSelected = {kind:"decor", id:STARTER_DECOR};
    homeView = homeReturnView;
    homeDecorating = true;
    homeTab = "storage";
    saveProgress();
    return true;
  }

  function tutorialPanel(){
    var step = tutorialStep();
    if(!step) return "";
    return '<div class="home-tutorial" role="status">'
      + '<p class="home-tutorial-jp">' + step.jp + '</p>'
      + '<p class="home-tutorial-how"><b>How to interact:</b> ' + step.how + '</p>'
      /* A replay must be leavable at any point. Someone re-reading the
       * explanation already knows how the room works, and holding them at a
       * step until they put the cushion back down would be a trap - the first
       * run earns the right to insist, a second reading does not. */
      + (step.id === "finish"
          ? '<button type="button" class="btn btn-primary" data-tutorial-done="1">分かりました</button>'
          : (homeTutorialReplay
              ? '<button type="button" class="btn btn-ghost" data-tutorial-done="1">閉じる</button>'
              : ''))
      + '</div>';
  }

  /* The free items only appear while the step that gives them is on screen, so
   * the shop does not carry a permanent "free" shelf to be re-checked later. */
  function tutorialGiftCard(){
    var step = tutorialStep();
    if(!step || homeTutorialReplay) return "";
    if(step.id === "claim-seed" && homeView === "shop"){
      return dockCard(plantFigure(STARTER_PLANT, "mature", ""),
        PLANT_JP[STARTER_PLANT], "ただ", 'data-claim="plant"', " is-gift");
    }
    if(step.id === "claim-cushion" && homeView === "shop"){
      return dockCard(decorCardArt(STARTER_DECOR),
        (LanternHomeDecor.getItem(STARTER_DECOR) || {name:""}).name, "ただ",
        'data-claim="decor"', " is-gift");
    }
    return "";
  }

  function homeShopDock(){
    var money = state.money || 0;
    var html = tutorialGiftCard();
    if(homeShopCategory === "plants" && typeof LanternHomeGarden !== "undefined"){
      LanternHomeGarden.catalogue().forEach(function(type){
        html += dockCard(plantFigure(type.id, "mature", ""), PLANT_JP[type.id] || type.name,
          "¥" + type.price, 'data-buy-plant="' + type.id + '"', money >= type.price ? "" : " is-locked");
      });
    }else if(homeShopCategory === "wallpaper"){
      LanternHomeDecor.wallpapers().forEach(function(paper){
        var owned = LanternHomeDecor.ownsWallpaper(homeState(), paper.id);
        var swatch = paper.hasPattern
          ? '<span class="home-swatch">' + LanternHomeDecor.wallpaperSvg(paper.id) + '</span>'
          : '<span class="home-swatch is-plain"></span>';
        html += dockCard(swatch, paper.name, owned ? "持っている" : "¥" + paper.price,
          'data-buy-wallpaper="' + paper.id + '"' + (owned ? " disabled" : ""),
          owned ? " is-owned" : (money >= paper.price ? "" : " is-locked"));
      });
    }else{
      LanternHomeDecor.catalogue().forEach(function(item){
        var owned = LanternHomeDecor.owns(homeState(), item.id);
        html += dockCard(decorCardArt(item.id), item.name, owned ? "持っている" : "¥" + item.price,
          'data-buy="' + item.id + '"' + (owned ? " disabled" : ""),
          owned ? " is-owned" : (money >= item.price ? "" : " is-locked"));
      });
    }
    return html || '<p class="home-empty">商品はまだありません。</p>';
  }

  function renderHomeShop(){
    var categories = [["plants","草花"],["decor","家具"],["wallpaper","壁紙"]];
    return '<div class="home-shop-stage">'
      + '<img class="home-shop-bg" src="assets/map/lantern-alley-map-v1.jpg" alt="灯り市の店">'
      + '<div class="home-shop-chrome"><button type="button" data-home-shop-back="1">&larr; わが家</button>'
      + '<strong>灯り屋</strong><span>¥' + (state.money || 0) + '</span></div>'
      + '<section class="home-shop-panel"><p class="home-shop-kicker">家と庭の道具</p><h2>灯り屋</h2>'
      + '<div class="home-shop-categories" role="tablist">'
      + categories.map(function(category){
          return '<button type="button" data-shop-category="' + category[0] + '" class="home-tab'
            + (homeShopCategory === category[0] ? ' is-on' : '') + '" aria-pressed="'
            + (homeShopCategory === category[0]) + '">' + category[1] + '</button>';
        }).join("") + '</div>'
      + '<div class="home-shop-grid" id="home-shelf">' + homeShopDock() + '</div></section></div>';
  }

  function paintHome(){
    if(typeof LanternHomeDecor === "undefined" || !homeScenes()){
      $("scene").innerHTML = '<div class="home-room"></div>';
      return;
    }
    if(homeView === "shop"){
      $("scene").innerHTML = renderHomeShop() + tutorialPanel();
      homeNotice = "";
      renderHud();
      return;
    }
    var tabs = homeView === "yard"
      ? [["garden", "草花"]]
      : [["storage", "家具"], ["wallpaper", "壁紙"]];
    // A tab that belongs to the other scene must not stay selected when the
    // learner walks through the door.
    if(!tabs.some(function(t){ return t[0] === homeTab; })) homeTab = tabs[0][0];

    // No leading space now that this is a line of its own rather than a tail.
    var hint = homeSelected
      ? '<span class="home-hint">置きたい場所をえらんでください</span>' : '';

    $("scene").innerHTML = '<div class="home-room">'
      + (homeView === "yard" ? renderHomeYard() : renderHomeInterior())
      /* The wallet is already in the HUD a few pixels above; printing it again
       * under the picture was the same number twice. What is left is the line
       * that says something the HUD cannot: what to do next. */
      + '<div class="home-scene-controls">'
      + (hint ? '<p class="home-room-note">' + hint + '</p>' : '')
      + homeGoalLine()
      + '<div class="home-main-menu" role="group" aria-label="わが家のメニュー">'
      + '<button type="button" data-home-decorate="1" class="home-menu-button'
      + (homeDecorating ? ' is-on' : '') + '" aria-pressed="' + homeDecorating + '">飾る</button>'
      + '<button type="button" data-home-shop="1" class="home-menu-button">店</button>'
      + (homeView === "yard" ? '<details class="home-yard-more"><summary aria-label="庭のその他の操作">•••</summary>'
          + '<div><button type="button" data-clear-yard="1">庭を空にする</button>'
          + '<button type="button" data-restore-yard="1">最初の配置に戻す</button></div></details>' : '')
      + '</div>'
      + (homeDecorating ? '<div class="home-tabs" role="tablist">' + tabs.map(function(t){
          return '<button type="button" class="home-tab' + (homeTab === t[0] ? " is-on" : "")
            + '" data-tab="' + t[0] + '" aria-pressed="' + (homeTab === t[0]) + '">' + t[1] + '</button>';
        }).join("") + '</div>' : '') + '</div>'
      + (homeDecorating ? '<div class="home-shelf" id="home-shelf">' + homeDock() + '</div>' : '')
      + (tutorialRunning() ? '' :
          '<button type="button" class="home-howto" data-howto="1">使いかた</button>')
      + '</div>'
      + tutorialPanel();
    homeNotice = "";
    startHomePetMotion();
    renderHud();
    settleGrowth();
  }

  /* A plant that changed while the learner was away is the reason to come back,
   * so the change is announced rather than simply being there when they look.
   *
   * The flag is cleared straight after, so the moment happens once. The message
   * stays even when motion is switched off - the animation is decoration, the
   * news is not. */
  function settleGrowth(){
    if(typeof LanternHomeGarden === "undefined") return;
    var grown = plantsInYard().filter(function(p){ return p.pendingAnimation; });
    if(!grown.length) return;
    var names = grown.map(function(p){
      return "「" + plantName(p.typeId) + "」" + (STAGE_JP[p.stage] || "");
    }).join("、");
    homeSay(names + " になりました。");
    state.garden = LanternHomeGarden.acknowledgeAnimations(gardenState());
    saveProgress();
  }

  function homeSay(text){
    homeNotice = text;
    var note = $("scene").querySelector(".home-goal");
    if(note) note.innerHTML = text;
    homeNotice = "";
  }

  // One delegated listener, because both scenes are rebuilt on every change.
  $("scene").addEventListener("keydown", function(event){
    if(event.key !== "Enter" && event.key !== " ") return;
    var control = event.target.closest("[data-plant],[data-slot-item]");
    if(!control) return;
    event.preventDefault();
    control.click();
  });

  $("scene").addEventListener("click", function(event){
    if(state.currentKey !== "home" || typeof LanternHomeDecor === "undefined") return;
    if(!event.target || !event.target.closest) return;
    var decor = LanternHomeDecor;
    var garden = (typeof LanternHomeGarden !== "undefined") ? LanternHomeGarden : null;

    if(event.target.closest("[data-home-map]")){
      showMap();
      return;
    }

    if(event.target.closest("[data-howto]")){
      startHomeTutorial(true);
      return;
    }
    if(event.target.closest("[data-tutorial-done]")){
      endHomeTutorial();
      return;
    }
    if(event.target.closest("[data-home-decorate]")){
      homeDecorating = !homeDecorating;
      homeSelected = null;
      homeTab = homeView === "yard" ? "garden" : "storage";
      paintHome();
      return;
    }
    if(event.target.closest("[data-home-shop]")){
      homeReturnView = homeView === "interior" ? "interior" : "yard";
      homeView = "shop";
      homeDecorating = false;
      homeSelected = null;
      advanceHomeTutorial();
      paintHome();
      return;
    }
    if(event.target.closest("[data-home-shop-back]")){
      homeView = homeReturnView;
      homeDecorating = false;
      homeSelected = null;
      paintHome();
      return;
    }
    var shopCategory = event.target.closest("[data-shop-category]");
    if(shopCategory){
      homeShopCategory = shopCategory.getAttribute("data-shop-category") || "plants";
      paintHome();
      return;
    }
    if(event.target.closest("[data-clear-yard]") && garden){
      state.garden = garden.clearPlacement(gardenState());
      homeSelected = null;
      saveProgress();
      paintHome();
      homeSay("庭の物をすべて持ち物に戻しました。");
      return;
    }
    if(event.target.closest("[data-restore-yard]") && garden){
      state.garden = garden.restoreStarterLayout(gardenState());
      homeSelected = null;
      saveProgress();
      paintHome();
      homeSay("最初の木の配置に戻しました。");
      return;
    }
    var claim = event.target.closest("[data-claim]");
    if(claim){
      var got = claimHomeStarter(claim.getAttribute("data-claim"));
      advanceHomeTutorial();
      paintHome();
      if(got) playCoinSound();
      homeSay(got
        ? (claim.getAttribute("data-claim") === "plant"
            ? "苗をもらいました。植えたい花壇をえらんでください。"
            : "座布団をもらいました。置きたい場所をえらんでください。")
        : "もう持っています。");
      return;
    }

    if(event.target.closest("[data-enter-house]")){
      homeView = "interior";
      homeDecorating = false;
      homeSelected = null;
      homeTab = "storage";
      advanceHomeTutorial();
      paintHome();
      return;
    }
    if(event.target.closest("[data-leave-house]")){
      homeView = "yard";
      homeDecorating = false;
      homeSelected = null;
      homeTab = "garden";
      paintHome();
      return;
    }

    var tab = event.target.closest("[data-tab]");
    if(tab){
      homeTab = tab.getAttribute("data-tab");
      advanceHomeTutorial();
      paintHome();
      return;
    }

    var pick = event.target.closest("[data-pick]");
    if(pick){
      var id = pick.getAttribute("data-pick");
      homeSelected = (homeSelected && homeSelected.kind === "decor" && homeSelected.id === id)
        ? null : {kind:"decor", id:id};
      paintHome();
      return;
    }

    var pickPlant = event.target.closest("[data-pick-plant]");
    if(pickPlant){
      var instanceId = pickPlant.getAttribute("data-pick-plant");
      homeSelected = (homeSelected && homeSelected.kind === "plant" && homeSelected.id === instanceId)
        ? null : {kind:"plant", id:instanceId};
      paintHome();
      return;
    }

    var buyPlant = event.target.closest("[data-buy-plant]");
    if(buyPlant && garden){
      var bought = garden.buy(gardenState(), state.money || 0, buyPlant.getAttribute("data-buy-plant"));
      if(!bought.ok){
        paintHome();
        if(bought.reason === "poor") homeSay("お金が足りません。もう少し稼ぎましょう。");
        return;
      }
      state.garden = bought.garden;
      state.money = bought.money;
      playCoinSound();
      homeSelected = {kind:"plant", id:bought.instanceId};
      homeTab = "garden";
      saveProgress();
      paintHome();
      homeSay("買いました。植えたい花壇をえらんでください。");
      return;
    }

    var setPaper = event.target.closest("[data-wallpaper]");
    if(setPaper){
      state.activeWallpaper = setPaper.getAttribute("data-wallpaper");
      saveProgress();
      paintHome();
      return;
    }

    var buyPaper = event.target.closest("[data-buy-wallpaper]");
    if(buyPaper){
      var paperId = buyPaper.getAttribute("data-buy-wallpaper");
      var paid = decor.buyWallpaper(homeState(), state.money || 0, paperId);
      if(!paid.ok){
        // Never fail in silence: a tap that does nothing reads as a broken app.
        homeSay(paid.reason === "poor"
          ? "お金が足りません。もう少し稼ぎましょう。"
          : "その壁紙は今は買えません。");
        return;
      }
      state.home = paid.home;
      state.money = paid.money;
      // Bought and up: nobody buys wallpaper to leave it rolled in a cupboard.
      state.activeWallpaper = paperId;
      playCoinSound();
      saveProgress();
      paintHome();
      homeSay("はりました。");
      return;
    }

    var buy = event.target.closest("[data-buy]");
    if(buy){
      var result = decor.buy(homeState(), state.money || 0, buy.getAttribute("data-buy"));
      if(!result.ok){
        if(result.reason === "poor") homeSay("お金が足りません。もう少し稼ぎましょう。");
        return;
      }
      state.home = result.home;
      state.money = result.money;
      playCoinSound();
      homeSelected = {kind:"decor", id:buy.getAttribute("data-buy")};
      homeTab = "storage";
      saveProgress();
      paintHome();
      homeSay("買いました。置きたい場所をえらんでください。");
      return;
    }

    var target = event.target.closest(".home-target");
    if(target && homeSelected){
      var slotId = target.getAttribute("data-slot");
      if(homeSelected.kind === "plant" && garden){
        var here = plantsInYard().filter(function(p){ return p.slotId === slotId; })[0];
        var existing = findPlant(homeSelected.id);
        var working = gardenState();

        /* A taken spot swaps, the way furniture already does.
         *
         * It was drawn as a swap - an occupied position shows ↔ - and then
         * refused, so the marker promised something the code would not do and
         * the tap did nothing but scold. The occupant goes back to storage with
         * its growth untouched, which is exactly what tapping it directly does,
         * so nothing here can lose a plant or the work that grew it. */
        var displacedPlant = null;
        if(here && here.id !== homeSelected.id){
          var lifted = garden.store(working, here.id);
          if(lifted.ok){ working = lifted.garden; displacedPlant = here; }
        }

        var put = existing && existing.slotId
          ? garden.move(working, homeSelected.id, slotId, yardSlots())
          : garden.plant(working, homeSelected.id, slotId, yardSlots());
        if(!put.ok){
          // Nothing is committed unless the whole move succeeds, so a refusal
          // leaves the occupant standing where it was.
          paintHome();
          homeSay("そこには植えられません。");
          return;
        }
        state.garden = put.garden;
        homeSelected = null;
        saveProgress();
        advanceHomeTutorial();
        paintHome();
        homeSay(displacedPlant
          ? "「" + plantName(displacedPlant.typeId) + "」は鉢にもどしました。"
          : "植えました。稽古をすると育ちます。");
        return;
      }
      var placed = decor.place(homeState(), homeSelected.id, slotId, homeSlots());
      if(!placed.ok) return;
      var displaced = placed.displaced;
      state.home = placed.home;
      homeSelected = null;
      saveProgress();
      advanceHomeTutorial();
      paintHome();
      // A swap has to be visible, or the displaced item looks lost.
      if(displaced){
        homeSay("「" + (decor.getItem(displaced) || {name:""}).name
          + "」は持ち物にもどしました。");
      }
      return;
    }

    var plantInYard = event.target.closest("[data-plant]");
    if(plantInYard && garden){
      var dug = garden.store(gardenState(), plantInYard.getAttribute("data-plant"));
      if(!dug.ok) return;
      state.garden = dug.garden;
      saveProgress();
      paintHome();
      homeSay("鉢にもどしました。育ち具合はそのままです。");
      return;
    }

    var placedItem = event.target.closest("[data-slot-item]");
    if(placedItem){
      var gone = decor.remove(homeState(), placedItem.getAttribute("data-slot-item"));
      if(!gone.ok) return;
      state.home = gone.home;
      if(gone.removed === STARTER_DECOR) homeTutorialMoved = true;
      saveProgress();
      advanceHomeTutorial();
      paintHome();
      homeSay("「" + (decor.getItem(gone.removed) || {name:""}).name
        + "」を持ち物にもどしました。");
    }
  });

  function renderHud(){
    $("hud-star-count").textContent = starCount();
    var mastery = stageMastery(state.currentKey || selectedMapKey || "entrance");
    $("hud-mastery-value").textContent = mastery + "%";
    $("hud-mastery-fill").style.width = mastery + "%";
    $("hud-money").textContent = String(state.money || 0);
  }

  var ICON_SVGS = {
    futon:'<svg viewBox="0 0 32 32"><rect x="4" y="10" width="24" height="14" rx="3"/><line x1="4" y1="17" x2="28" y2="17"/></svg>',
    pillow:'<svg viewBox="0 0 32 32"><rect x="6" y="11" width="20" height="12" rx="6"/></svg>',
    robe:'<svg viewBox="0 0 32 32"><path d="M16 5 L11 9 L8 26 L24 26 L21 9 Z"/><path d="M11 9 L4 15 M21 9 L28 15"/><line x1="16" y1="9" x2="16" y2="26"/></svg>',
    towelUsed:'<svg viewBox="0 0 32 32"><path d="M6 12 Q10 8 14 12 T22 12 T28 14 L26 24 Q16 27 6 22 Z"/></svg>',
    towelClean:'<svg viewBox="0 0 32 32"><rect x="6" y="9" width="20" height="5" rx="1.5"/><rect x="6" y="15" width="20" height="5" rx="1.5"/><rect x="6" y="21" width="20" height="5" rx="1.5"/></svg>',
    basket:'<svg viewBox="0 0 32 32"><path d="M7 13 L25 13 L23 26 L9 26 Z"/><path d="M12 13 L11 8 M20 13 L21 8"/><line x1="12" y1="17" x2="13" y2="23"/><line x1="20" y1="17" x2="19" y2="23"/></svg>',
    rack:'<svg viewBox="0 0 32 32"><line x1="6" y1="9" x2="26" y2="9"/><line x1="9" y1="9" x2="9" y2="26"/><line x1="23" y1="9" x2="23" y2="26"/></svg>',
    bulbBroken:'<svg viewBox="0 0 32 32"><circle cx="16" cy="13" r="8"/><path d="M12 21 L20 21 M13 24 L19 24 M14 27 L18 27"/><path d="M12 9 L20 17 M20 9 L12 17"/></svg>',
    bulbNew:'<svg viewBox="0 0 32 32"><circle cx="16" cy="13" r="8"/><path d="M12 21 L20 21 M13 24 L19 24 M14 27 L18 27"/><line x1="16" y1="1" x2="16" y2="4"/><line x1="5" y1="6" x2="7.5" y2="8.5"/><line x1="27" y1="6" x2="24.5" y2="8.5"/></svg>',
    recycle:'<svg viewBox="0 0 32 32"><path d="M8 12 A9 9 0 1 1 8 21"/><path d="M4 9 L8 12 L11 8"/></svg>',
    socket:'<svg viewBox="0 0 32 32"><rect x="10" y="6" width="12" height="8" rx="1.5"/><path d="M13 14 L13 20 Q16 24 19 20 L19 14"/></svg>',
    kettle:'<svg viewBox="0 0 32 32"><path d="M9 13 Q16 9 23 13 L22 25 Q16 28 10 25 Z"/><path d="M12 12 Q12 6 16 6 Q20 6 20 12"/><path d="M23 15 L29 12 L27 19 L23 19"/><path d="M9 15 Q4 14 5 20 Q6 24 10 23"/></svg>',
    pot:'<svg viewBox="0 0 32 32"><path d="M7 13 L25 13 L23 25 L9 25 Z"/><path d="M11 10 L21 10 L23 13 L9 13 Z"/><line x1="13" y1="7" x2="19" y2="7"/><line x1="7" y1="16" x2="3" y2="16"/><line x1="25" y1="16" x2="29" y2="16"/></svg>',
    stove:'<svg viewBox="0 0 32 32"><rect x="5" y="8" width="22" height="19" rx="2"/><ellipse cx="16" cy="14" rx="7" ry="3"/><ellipse cx="16" cy="14" rx="3" ry="1.3"/><circle cx="10" cy="23" r="1.5"/><circle cx="16" cy="23" r="1.5"/><circle cx="22" cy="23" r="1.5"/></svg>',
    microwave:'<svg viewBox="0 0 32 32"><rect x="4" y="7" width="24" height="19" rx="2"/><rect x="7" y="10" width="14" height="12" rx="1"/><circle cx="24.5" cy="12" r="1.3"/><circle cx="24.5" cy="17" r="1.3"/><line x1="9" y1="24" x2="9" y2="27"/><line x1="23" y1="24" x2="23" y2="27"/></svg>',
    ice:'<svg viewBox="0 0 32 32"><rect x="9" y="9" width="14" height="14" rx="2"/><line x1="9" y1="16" x2="23" y2="16"/><line x1="16" y1="9" x2="16" y2="23"/></svg>',
    calendar:'<svg viewBox="0 0 32 32"><rect x="6" y="8" width="20" height="18" rx="2"/><line x1="6" y1="13" x2="26" y2="13"/><line x1="11" y1="5" x2="11" y2="10"/><line x1="21" y1="5" x2="21" y2="10"/><path d="M11 19 L14 22 L21 15"/></svg>',
    map:'<svg viewBox="0 0 32 32"><path d="M6 8 L12 6 L20 8 L26 6 L26 24 L20 26 L12 24 L6 26 Z"/><line x1="12" y1="6" x2="12" y2="24"/><line x1="20" y1="8" x2="20" y2="26"/></svg>',
    suitcase:'<svg viewBox="0 0 32 32"><rect x="6" y="12" width="20" height="14" rx="2"/><path d="M12 12 L12 8 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 L20 12"/><line x1="6" y1="18" x2="26" y2="18"/></svg>',
    room:'<svg viewBox="0 0 32 32"><path d="M6 27 L6 12 L16 5 L26 12 L26 27 Z"/><rect x="13" y="17" width="6" height="10"/></svg>',
    sheetStained:'<svg viewBox="0 0 32 32"><path d="M5 8 L27 8 L27 24 Q16 28 5 24 Z"/><circle cx="13" cy="15" r="2.5"/><circle cx="20" cy="19" r="1.8"/></svg>',
    sheetFresh:'<svg viewBox="0 0 32 32"><path d="M5 8 L27 8 L27 24 Q16 28 5 24 Z"/><line x1="5" y1="14" x2="27" y2="14"/></svg>',
    rice:'<svg viewBox="0 0 32 32"><path d="M6 15 L26 15 Q25 25 16 25 Q7 25 6 15 Z"/><path d="M10 15 Q13 9 16 12 Q19 9 22 15"/></svg>',
    keys:'<svg viewBox="0 0 32 32"><circle cx="11" cy="12" r="6"/><path d="M15 16 L25 26 M22 23 L25 20 M19 20 L22 17"/></svg>',
    bin:'<svg viewBox="0 0 32 32"><path d="M8 11 L24 11 L22 27 L10 27 Z"/><line x1="6" y1="11" x2="26" y2="11"/><path d="M13 11 L13 7 L19 7 L19 11"/></svg>',
    fitting:'<svg viewBox="0 0 32 32"><rect x="7" y="8" width="18" height="18" rx="3"/><line x1="7" y1="15" x2="25" y2="15"/></svg>'
  };
  function iconMarkup(key){
    return '<span class="inn-icon" aria-hidden="true">' + (ICON_SVGS[key] || "") + '</span>';
  }
  function cushionLabel(a){
    return "座布団 - " + (a.color === "red" ? "赤" : "青") + "、" + (a.size === "large" ? "大" : "小") + "、" + (a.dir === "up" ? "縦向き" : "横向き");
  }
  function roomSpriteMarkup(room, key){
    var asset = room.visual && room.visual.assets && room.visual.assets[key];
    if(asset){
      return '<img class="inn-photo-sprite inn-photo-sprite-' + key + '" src="' + asset
        + '" alt="" aria-hidden="true" draggable="false" style="--object-image:url(\'' + asset + '\')">';
    }
    var cell = room.visual && room.visual.sprites[key];
    if(!cell) return iconMarkup(key);
    return '<span class="inn-sprite inn-sprite-' + key + '" aria-hidden="true"'
      + ' style="--sprite-col:' + cell.col + ';--sprite-row:' + cell.row
      + ';--sprite-rotate:' + (cell.rotate || 0) + 'deg;--sprite-zoom:' + (cell.zoom || 1.2) + '"></span>';
  }
  function positionRoomHotspot(room, zone, key){
    var spot = room.visual && room.visual.hotspots[key];
    if(!spot) return;
    zone.classList.add("inn-hotspot");
    zone.style.left = spot.x + "%";
    zone.style.top = spot.y + "%";
    zone.style.width = spot.w + "%";
    zone.style.height = spot.h + "%";
  }
  function addFloorLabel(zonesEl, text){
    if(!text) return;
    var label = document.createElement("div");
    label.className = "inn-floor-label";
    label.textContent = text;
    zonesEl.appendChild(label);
  }
  function iconButton(key, caption, ariaLabel, className, action){
    var html = iconMarkup(key) + '<span class="inn-caption">' + caption + '</span>';
    var button = innButton(html, className, action);
    button.setAttribute("aria-label", ariaLabel);
    button.title = ariaLabel;
    return button;
  }

  function makeDraggable(el, getZones, onDrop){
    var startX, startY, origLeft, origTop, w, h, activePointer = null, dragging = false, moved = false, slop = 6;
    el.style.touchAction = "none";
    function removeWindowTracking(){
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    }
    function move(event){
      if(!dragging || event.pointerId !== activePointer) return;
      var dx = event.clientX - startX, dy = event.clientY - startY;
      if(!moved && Math.sqrt(dx*dx + dy*dy) > slop){
        moved = true;
        var rect = el.getBoundingClientRect();
        origLeft = rect.left; origTop = rect.top; w = rect.width; h = rect.height;
        el.style.left = origLeft + "px"; el.style.top = origTop + "px";
        el.style.width = w + "px"; el.style.height = h + "px";
        el.classList.add("dragging");
      }
      if(moved){
        el.style.left = (origLeft + dx) + "px";
        el.style.top = (origTop + dy) + "px";
        getZones().forEach(function(zone){
          var r = zone.getBoundingClientRect();
          var hit = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
          zone.classList.toggle("drop-hover", hit);
        });
      }
    }
    function finish(event){
      if(!dragging || event.pointerId !== activePointer) return;
      dragging = false;
      activePointer = null;
      removeWindowTracking();
      if(moved){
        el.classList.remove("dragging");
        el.style.left = ""; el.style.top = ""; el.style.width = ""; el.style.height = "";
        // The browser fires a click after the drag; flag it so the tap-to-select
        // handler ignores that one and does not re-select what we just placed.
        el.dataset.dragged = "1";
        var target = null;
        getZones().forEach(function(zone){
          zone.classList.remove("drop-hover");
          var r = zone.getBoundingClientRect();
          if(event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) target = zone;
        });
        onDrop(target);
      }
      moved = false;
    }
    el.addEventListener("pointerdown", function(event){
      if(el.disabled || dragging) return;
      startX = event.clientX; startY = event.clientY; moved = false; dragging = true;
      activePointer = event.pointerId;
      // A finger tap routinely slides several pixels, so a 6px threshold turned
      // ordinary taps into drags that then landed on nothing.
      slop = event.pointerType === "mouse" ? 6 : 16;
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
      try{ el.setPointerCapture(event.pointerId); }catch(err){}
    });
  }

  function innButton(label, className, action){
    var button = document.createElement("button");
    button.className = className || "inn-action";
    button.innerHTML = label;
    button.setAttribute("data-inn-action", action.type);
    button.addEventListener("click", function(){
      if(action.type === "select" || action.type === "heater" || action.type === "confirmTimes" || action.type === "noop") return;
      performInnAction(action);
    });
    return button;
  }

  // Day 2 asks the same words a different way. Repeating Day 1's drag with one
  // attribute changed tested the same skill twice, so Practice drops the scene
  // and asks the learner to name the action in Japanese instead, choosing
  // between the verb, its intransitive partner and a plausible wrong action.
  // No objects to move means no answering by trial and error.
  function isWordChoiceDay(prompt){
    // Every Day 2 item carries a cloze question, including the dialogue one.
    // Excluding undertake left it showing a cloze prompt above yes/no replies:
    // 「配膳を（　　）くれませんか」 answered by 「はい、引き受けます。」. The
    // decline branch still lives on Day 1, where the offer is actually made.
    return state.stagePhase === "practice"
      && !!(prompt.options && prompt.options.length > 1)
      && prompt.options.every(function(option){ return !/[A-Za-z]{2,}/.test(option.label); });
  }

  function renderWordChoice(prompt){
    var scene = $("scene");
    scene.innerHTML = '<div class="inn-workspace"><p class="inn-instruction" id="inn-instruction"></p>'
      + '<div class="inn-actions inn-replies" id="inn-word-choice"></div>'
      + '<div class="inn-status" id="inn-status"></div></div>';
    $("inn-instruction").innerHTML = '<span>Choose the word that matches the request.</span>';
    var host = $("inn-word-choice");

    prompt.options.forEach(function(option){
      var button = document.createElement("button");
      button.className = "inn-action reply-option";
      button.textContent = option.label;
      button.setAttribute("aria-label", option.label);
      button.addEventListener("click", function(event){
        event.stopImmediatePropagation();
        if(state.answered) return;
        if(option.key === prompt.correct){
          answerStage(true, prompt, option.key);
          return;
        }
        var stage = getLocation(state.currentKey);
        state.mistakesThisVisit = Math.min(3, state.mistakesThisVisit + 1);
        renderHud();
        showPracticeTranslation(false);
        showKonStageResponse(stage, prompt, false, option.key);
        showFeedback(false, option.explanation || stage.getWrongAnswerFeedback(prompt, option.key));
        offerRetry(prompt);
      });
      host.appendChild(button);
    });
  }

  function renderInnInteraction(prompt, reset){
    if(isWordChoiceDay(prompt)){
      renderWordChoice(prompt);
      return;
    }
    var interaction = prompt.interaction;
    if(reset || !innInteractionState || innInteractionState.mechanic !== prompt.mechanic){
      innInteractionState = MoonviewInnInteractions.create(prompt.mechanic);
      if(prompt.mechanic === "coordinate"){
        innInteractionState.arrivalA = interaction.startA;
        innInteractionState.arrivalB = interaction.startB;
      }
    }
    var scene = $("scene");
    var isObjectRoom = prompt.mechanic === "arrange" || prompt.mechanic === "replace" || prompt.mechanic === "warm";
    var roomVisual = isObjectRoom && interaction.room && interaction.room.visual;
    var roomSurface = roomVisual
      ? '<div class="inn-room-composite"><div class="inn-room-viewport"><img class="inn-room-art" src="' + roomVisual.background + '" alt="">'
        + '<div class="inn-scene-zones" id="inn-scene-zones"></div></div>'
        + '<div class="inn-supply-shelf"><div class="inn-tray" id="inn-tray"></div></div></div>'
      // The shoji was decoration for scenes with no illustrated room, but it is
        // absolutely positioned and overlapped whatever those scenes actually
        // use: the schedule board's timeline and cards, and the reply buttons
        // on the dialogue scene. A backdrop that covers the answer is worse
        // than no backdrop.
      : '<div class="inn-scene-zones" id="inn-scene-zones"></div>'
        + '<div class="inn-tray" id="inn-tray"></div>';
    var clueSurface = roomVisual
      ? '<details class="inn-clue"><summary>部屋の様子</summary><span>' + interaction.clue + '</span></details>'
      : '<div class="inn-clue">' + interaction.clue + '</div>';
    // Always visible, not a collapsed <details>: the tap-to-place shortcut is
    // useless if the only place it is mentioned is behind a disclosure arrow.
    scene.innerHTML = '<p class="inn-instruction">'+interaction.controlHelp+'</p>'
      + clueSurface
      + '<div class="inn-room' + (roomVisual ? ' inn-room-illustrated' : '') + '"><div class="inn-workspace" id="inn-workspace">'
      + roomSurface
      + '<div class="inn-content" id="inn-content"></div>'
      + '<div class="inn-status" id="inn-status" aria-live="polite"></div>'
      + '</div></div>';
    if(roomVisual){
      scene.querySelector(".inn-room-illustrated").style.setProperty(
        "--inn-sprite-sheet",
        'url("' + roomVisual.spriteSheet + '")'
      );
      var roomLightState = MoonviewInnInteractions.getRoomLightState(innInteractionState, interaction.target);
      scene.querySelector(".inn-room-viewport").classList.add("room-light-" + roomLightState);
    }
    var work = $("inn-content");
    var zonesEl = $("inn-scene-zones");
    var trayEl = $("inn-tray");
    var actions = document.createElement("div");
    actions.className = "inn-actions";

    if(prompt.mechanic === "arrange" || prompt.mechanic === "replace" || prompt.mechanic === "warm"){
      var room = interaction.room;
      var verb = interaction.verb;
      var st = innInteractionState;
      var assign = st.assign || {};

      // Every zone is present every time. Which one is correct depends on the verb
      // in the sentence, never on what the room happens to contain.
      var zoneVerb = {g1:"arrange", g2:"arrange"};
      room.heatingAppliances.forEach(function(appliance){ zoneVerb[appliance.key] = "warm"; });

      room.groups.forEach(function(group, gi){
        var key = group[0];
        var zone = document.createElement("button");
        zone.className = "inn-drop-zone mat-zone";
        zone.dataset.key = key;
        zone.setAttribute("aria-label", group[1]);
        var held = "";
        room.cushions.forEach(function(entry){
          if(assign[entry[0]] === key) held += roomSpriteMarkup(room, entry[0]);
        });
        zone.innerHTML = '<span class="mat-items">' + held + '</span><span class="inn-caption">' + group[1] + '</span>';
        positionRoomHotspot(room, zone, key);
        zonesEl.appendChild(zone);
      });
      var removalZones = {};
      var sourceZones = {};
      room.swaps.forEach(function(swap){
        if(!removalZones[swap.removalKey]){
          var removal = innButton('<span class="inn-caption">' + swap.removalLabel + '</span>', "inn-drop-zone laundry-basket", {type:"noop"});
          removal.setAttribute("aria-label", swap.removalLabel);
          removal.dataset.key = "remove-" + swap.removalKey;
          removal.dataset.verb = "replace";
          removal.dataset.action = "remove";
          removal.dataset.accepts = "";
          positionRoomHotspot(room, removal, removal.dataset.key);
          removalZones[swap.removalKey] = removal;
          zonesEl.appendChild(removal);
        }
        removalZones[swap.removalKey].dataset.accepts += (removalZones[swap.removalKey].dataset.accepts ? "," : "") + swap.key;

        var source = document.createElement("div");
        source.className = "inn-drop-zone towel-rack";
        source.dataset.key = "install-" + swap.key;
        source.dataset.verb = "replace";
        source.dataset.action = "install";
        source.dataset.item = swap.key;
        source.setAttribute("aria-label", swap.sourceLabel);
        source.innerHTML = '<span class="inn-caption">' + swap.sourceLabel + '</span>';
        positionRoomHotspot(room, source, source.dataset.key);
        sourceZones[swap.key] = source;
        zonesEl.appendChild(source);
      });
      var heatingZones = {};
      room.heatingAppliances.forEach(function(appliance){
        var heatingZone = innButton('<span class="inn-caption">' + appliance.label + '</span>', "inn-drop-zone heating-zone", {type:"noop"});
        heatingZone.setAttribute("aria-label", appliance.label);
        heatingZone.dataset.key = appliance.key;
        positionRoomHotspot(room, heatingZone, appliance.key);
        heatingZones[appliance.key] = heatingZone;
        zonesEl.appendChild(heatingZone);
      });

      var allZones = function(){ return Array.prototype.slice.call(zonesEl.querySelectorAll(".inn-drop-zone")); };

      function dropped(kind, itemKey, zone){
        if(!zone) return;
        var wanted = zone.dataset.verb || zoneVerb[zone.dataset.key];
        if(wanted !== verb){
          performInnAction({type:"wrongVerb"});
          return;
        }
        if(verb === "arrange"){
          if(kind !== "cushion"){ performInnAction({type:"wrongVerb"}); return; }
          performInnAction({type:"place", item:itemKey, group:zone.dataset.key, items:room.cushions, attribute:interaction.attribute});
        }else if(verb === "replace"){
          var accepts = (zone.dataset.accepts || "").split(",");
          if(kind === "old" && zone.dataset.action === "remove" && accepts.indexOf(itemKey) >= 0) performInnAction({type:"removeOld", item:itemKey, target:interaction.target});
          else if(kind === "new" && zone.dataset.action === "install" && zone.dataset.item === itemKey) performInnAction({type:"placeClean", item:itemKey, target:interaction.target});
          else performInnAction({type:"replaceOrder"});
        }else{
          if(kind !== "dish"){ performInnAction({type:"wrongVerb"}); return; }
          var targetDish = room.dishes.filter(function(dish){ return dish.key === interaction.target; })[0];
          performInnAction({type:"heat", item:itemKey, target:interaction.target, appliance:zone.dataset.key, targetAppliance:targetDish && targetDish.appliance});
        }
      }

      // Tap-to-place, so a phone never has to drag an object the full height of
      // the screen. Dragging still works; this is the shorter path, and it is
      // also what makes the room usable by keyboard.
      function selectItem(button, kind, itemKey){
        var already = button.classList.contains("selected");
        // Clear across the whole scene, not just the tray: worn items sit
        // inside their source zone.
        Array.prototype.forEach.call(
          scene.querySelectorAll(".inn-object.selected"),
          function(el){ el.classList.remove("selected"); }
        );
        zonesEl.classList.remove("awaiting-drop");

        if(already){
          roomPick = null;
          $("inn-status").textContent = "";
          return;
        }
        roomPick = {kind:kind, item:itemKey};
        button.classList.add("selected");
        zonesEl.classList.add("awaiting-drop");
        $("inn-status").textContent = "置く場所を選んでください。";
        // On a phone the destinations can sit off-screen above the tray.
        // "nearest" leaves them alone when they are already visible.
        if(zonesEl.scrollIntoView){
          try{ zonesEl.scrollIntoView({block:"nearest", behavior:"smooth"}); }catch(e){ zonesEl.scrollIntoView(); }
        }
      }

      // Every movable object gets both paths: drag, or tap then tap a place.
      // Worn items live inside their source zone rather than the tray, so this
      // has to be shared rather than living in tray() alone.
      function makeMovable(button, kind, itemKey){
        makeDraggable(button, allZones, function(zone){
          // Released away from any destination, or back onto the zone the object
          // already sits in: treat it as having picked the object up rather than
          // doing nothing (which read as "it won't move") or scoring it wrong.
          if(!zone || zone.contains(button)){ selectItem(button, kind, itemKey); return; }
          roomPick = null;
          dropped(kind, itemKey, zone);
        });
        button.addEventListener("click", function(event){
          event.stopImmediatePropagation();
          // A finished drag also emits a click; ignore that one.
          if(button.dataset.dragged === "1"){ delete button.dataset.dragged; return; }
          selectItem(button, kind, itemKey);
        });
        return button;
      }

      function tray(markup, label, kind, itemKey){
        var button = document.createElement("button");
        button.className = "inn-object";
        button.innerHTML = markup;
        button.setAttribute("aria-label", label);
        button.title = label;
        makeMovable(button, kind, itemKey);
        trayEl.appendChild(button);
      }

      allZones().forEach(function(zone){
        zone.addEventListener("click", function(event){
          event.stopImmediatePropagation();
          if(!roomPick) return;
          var pick = roomPick;
          roomPick = null;
          dropped(pick.kind, pick.item, zone);
        });
      });

      room.cushions.forEach(function(entry){
        if(assign[entry[0]]) return;
        tray(roomSpriteMarkup(room, entry[0]) + '<span class="inn-caption">' + cushionLabel(entry[1]) + '</span>', cushionLabel(entry[1]), "cushion", entry[0]);
      });
      room.swaps.forEach(function(swap){
        var source = sourceZones[swap.key];
        if(st.installed === swap.key){
          source.insertAdjacentHTML("afterbegin", '<span class="inn-placed-object">' + roomSpriteMarkup(room, swap.newIcon) + '</span>');
        }else if(st.removed !== swap.key){
          var oldObject = document.createElement("button");
          oldObject.className = "inn-object inn-placed-object";
          oldObject.innerHTML = roomSpriteMarkup(room, swap.oldIcon) + '<span class="inn-caption">' + swap.oldLabel + '</span>';
          oldObject.setAttribute("aria-label", swap.oldLabel);
          oldObject.title = swap.oldLabel;
          makeMovable(oldObject, "old", swap.key);
          source.insertBefore(oldObject, source.firstChild);
        }
        if(st.removed === swap.key && st.installed !== swap.key){
          removalZones[swap.removalKey].insertAdjacentHTML("afterbegin", '<span class="inn-placed-object">' + roomSpriteMarkup(room, swap.oldIcon) + '</span>');
        }
        if(st.installed !== swap.key) tray(roomSpriteMarkup(room, swap.newIcon) + '<span class="inn-caption">' + swap.newLabel + '</span>', swap.newLabel, "new", swap.key);
      });
      room.dishes.forEach(function(dish){
        if(st.item === dish.key) return;
        tray(roomSpriteMarkup(room, dish.icon) + '<span class="inn-caption">' + dish.label + '</span>', dish.label, "dish", dish.key);
      });
      if(st.item){
        var heatedDish = room.dishes.filter(function(dish){ return dish.key === st.item; })[0];
        if(heatedDish && heatingZones[heatedDish.appliance]){
          heatingZones[heatedDish.appliance].insertAdjacentHTML(
            "afterbegin",
            '<span class="inn-placed-object inn-heated-object">' + roomSpriteMarkup(room, heatedDish.icon) + '</span>'
              + '<span class="inn-heat-waves" aria-hidden="true">〰</span>'
          );
          heatingZones[heatedDish.appliance].classList.add("filled", "heated");
        }
      }

      if(verb === "arrange"){
        var n = room.cushions.filter(function(e){ return assign[e[0]]; }).length;
        $("inn-status").textContent = n + " / " + room.cushions.length + " 枚の座布団を置きました。";
      }else if(verb === "replace"){
        $("inn-status").textContent = st.removed ? "古い物を外しました。次に新しい物を選んでください。" : "";
      }else{
        $("inn-status").textContent = "";
      }
    }else if(prompt.mechanic === "coordinate"){
      var timeline = document.createElement("div"); timeline.className = "schedule-timeline";
      timeline.style.gridTemplateColumns = "repeat(" + (interaction.max - interaction.min + 1) + ", 1fr)";
      for(var hour=interaction.min;hour<=interaction.max;hour++){ var mark=document.createElement("span"); mark.textContent=hour+":00"; timeline.appendChild(mark); }
      work.appendChild(timeline);
      var handleTrack = document.createElement("div"); handleTrack.className = "schedule-handle-track";
      var handleA = document.createElement("div"); handleA.className = "schedule-handle"; handleA.id = "handle-a"; handleA.setAttribute("aria-hidden", "true");
      handleTrack.appendChild(handleA);
      if(!interaction.fixedB){
        var handleB = document.createElement("div"); handleB.className = "schedule-handle"; handleB.id = "handle-b"; handleB.setAttribute("aria-hidden", "true");
        handleTrack.appendChild(handleB);
      }
      work.appendChild(handleTrack);
      var controls = document.createElement("div"); controls.className = "schedule-controls";
      controls.innerHTML = '<label>'+interaction.labelA+': <output id="arrival-a-out">'+innInteractionState.arrivalA+':00</output><input id="arrival-a" type="range" min="'+interaction.min+'" max="'+interaction.max+'" value="'+innInteractionState.arrivalA+'"></label><label>'+interaction.labelB+': <output id="arrival-b-out">'+innInteractionState.arrivalB+':00</output><input id="arrival-b" type="range" min="'+interaction.min+'" max="'+interaction.max+'" value="'+innInteractionState.arrivalB+'" '+(interaction.fixedB ? "disabled" : "")+'></label>';
      work.appendChild(controls);
      function updateScheduleHandles(){
        var a = Number($("arrival-a").value);
        var b = Number($("arrival-b").value);
        var span = interaction.max - interaction.min;
        var elA = $("handle-a");
        if(elA){
          elA.style.left = ((a - interaction.min) / span * 100) + "%";
          elA.classList.toggle("out-of-range", Math.abs(a - b) < interaction.gap);
        }
        var elB = $("handle-b");
        if(elB){
          elB.style.left = ((b - interaction.min) / span * 100) + "%";
          elB.classList.toggle("out-of-range", Math.abs(a - b) < interaction.gap);
        }
      }
      ["a","b"].forEach(function(key){ $("arrival-"+key).addEventListener("input", function(){ $("arrival-"+key+"-out").textContent = this.value + ":00"; updateScheduleHandles(); }); });
      updateScheduleHandles();
      var confirm = iconButton("calendar", "決定", "Confirm this schedule", "inn-action", {type:"confirmTimes"});
      confirm.addEventListener("click", function(event){ event.stopImmediatePropagation(); performInnAction({type:"setTimes",arrivalA:Number($("arrival-a").value),arrivalB:Number($("arrival-b").value),min:interaction.min,max:interaction.max,gap:interaction.gap,targetA:interaction.targetA,targetB:interaction.targetB}); });
      actions.appendChild(confirm);
      work.appendChild(actions);
    }else{
      // The reply is the whole answer. No object to find, no destination to guess.
      actions.className = "inn-actions inn-replies";
      // The accept/decline replies were listed accept-first every time.
      var orderedReplies = (typeof N2HomeInnStage !== "undefined" && N2HomeInnStage.balanceOptions)
        ? N2HomeInnStage.balanceOptions(interaction.replies, "replies:" + (prompt.focusWord || "") + ":" + state.stagePhase)
        : interaction.replies;
      orderedReplies.forEach(function(reply){
        var button = document.createElement("button");
        button.className = "inn-action reply-option";
        button.textContent = reply.label;
        button.setAttribute("aria-label", reply.label);
        button.addEventListener("click", function(event){
          event.stopImmediatePropagation();
          performInnAction({type:"respond", key:reply.key});
        });
        actions.appendChild(button);
      });
      work.appendChild(actions);
      $("inn-status").textContent = "";
    }
  }

  function updateTeaVisual(interaction){
    var tea = $("tea-visual");
    if(!tea) return;
    var isHeated = innInteractionState.item;
    tea.className = "tea-visual " + (isHeated ? "ready" : "cold");
    var label = $("tea-state");
    if(label) label.textContent = isHeated ? "湯気が立っています。" : "";
  }

  // Turning work down is a choice, not a mistake: Kon is disappointed, the
  // learner leaves the inn, and returning is welcomed. No heart is lost.
  function declineStageWork(prompt){
    if(state.answered) return;
    state.answered = true;
    var reply = prompt.declineReply;
    $("jp-line").textContent = reply;
    $("romaji-line").textContent = "";
    $("meaning-line").textContent = "";
    speak(reply, "wrong");
    state.stageDeclined = true;
    saveProgress();
    showFeedback(false, "You turned the work down. Kon will welcome you back whenever you return.");
    $("next-row").style.display = "block";
    $("btn-next").textContent = "宿を出る →";
    setTimeout(function(){
      if(state.currentKey !== "home-inn" || !state.answered) return;
      showMap();
    }, 3200);
  }

  function performInnAction(action){
    if(state.answered) return;
    var stage = getLocation(state.currentKey);
    var prompt = getActivePrompt(stage);
    if(action.type === "nearMiss"){
      var near = prompt.options.filter(function(option){ return option.nearMiss; })[0];
      if(state.stagePhase === "challenge") answerStage(false, prompt, near.key);
      else{
        showKonStageResponse(stage, prompt, false);
        showFeedback(false, near.explanation);
        offerRetry(prompt);
      }
      return;
    }
    if(action.type === "wrongVerb"){
      var missed = prompt.options.filter(function(option){ return option.nearMiss; })[0];
      if(state.stagePhase === "challenge") answerStage(false, prompt, missed.key);
      else{
        showKonStageResponse(stage, prompt, false);
        showFeedback(false, "That is a different action from the one the request asked for.");
        setTimeout(function(){ if(!state.answered) renderInnInteraction(prompt, true); }, 900);
      }
      return;
    }
    if(action.type === "respond" && action.key === "decline" && prompt.declineReply){
      declineStageWork(prompt);
      return;
    }
    var result = MoonviewInnInteractions.apply(innInteractionState, action);
    innInteractionState = result.state;
    if(result.outcome === "success"){
      renderInnInteraction(prompt, false);
      answerStage(true, prompt, prompt.correct);
      return;
    }
    if(result.outcome === "wrong"){
      var nearMiss = prompt.options.filter(function(option){ return option.nearMiss; })[0];
      var selectedKey = action.key || (nearMiss && nearMiss.key) || "";
      if(state.stagePhase === "challenge") answerStage(false, prompt, selectedKey);
      else{
        showKonStageResponse(stage, prompt, false, selectedKey);
        if(prompt.replyResponses && prompt.replyResponses[selectedKey]) $("feedback-row").classList.remove("show");
        else showFeedback(false, result.reason);
        setTimeout(function(){ if(!state.answered) renderInnInteraction(prompt, true); }, 900);
      }
      return;
    }
    $("inn-status").textContent = result.reason;
    renderInnInteraction(prompt, false);
  }

  function renderScene(loc){
    var scene = $("scene");
    scene.innerHTML = "";

    if(loc.type === "choice"){
      if(loc.interactiveDuo){
        scene.appendChild($("avatar-slot"));
        var stage = document.createElement("div");
        stage.className = "duo-stage";
        stage.innerHTML = '<div class="player-figure" id="player-figure" style="--player-action-sprite:url(\'' + playerActionSprite() + '\')"><span class="entrance-player-art" aria-hidden="true"></span></div><div class="player-caption">You</div>';
        scene.appendChild(stage);
        var how = document.createElement("div");
        how.className = "inn-control-help entrance-control-help";
        how.innerHTML = '<strong>How to interact</strong><span>' + LanternAlleyLogic.getHowToInteract() + '</span>';
        scene.appendChild(how);
      }

      var wrap = document.createElement("div");
      wrap.className = "hotspots entrance-action-grid";
      loc.options.forEach(function(opt){
        var btn = document.createElement("button");
        btn.className = "hotspot";
        btn.setAttribute("data-key", opt.key);
        btn.innerHTML = '<span class="entrance-action-art entrance-action-art-'+opt.key+'" aria-hidden="true" style="--player-action-sprite:url(\'' + playerActionSprite() + '\')"></span><span>'+opt.label+'</span>';
        btn.addEventListener("click", function(){
          var key = this.getAttribute("data-key");
          if(loc.interactiveDuo){
            if(state.answered || state.acting) return;
            answerDuoAction(key, loc);
          }else{
            if(state.answered) return;
            if(loc.stageKey) answerStage(key === loc.correct, loc, key);
            else answer(key === loc.correct, loc);
          }
        });
        wrap.appendChild(btn);
      });
      scene.appendChild(wrap);
    }

    else if(loc.type === "path"){
      var row = document.createElement("div");
      row.className = "path-row";
      loc.options.forEach(function(opt){
        var card = document.createElement("button");
        card.className = "path-card";
        card.setAttribute("data-key", opt.key);
        card.innerHTML = '<span class="emoji">'+opt.emoji+'</span><span>'+opt.label+'</span>';
        card.addEventListener("click", function(){
          if(state.answered) return;
          answer(this.getAttribute("data-key") === loc.correct, loc);
        });
        row.appendChild(card);
      });
      scene.appendChild(row);
    }

    else if(loc.type === "count"){
      var cwrap = document.createElement("div");
      cwrap.className = "count-wrap";
      var status = document.createElement("div");
      status.className = "count-status";
      status.textContent = "Selected: 0";
      cwrap.appendChild(status);

      var grid = document.createElement("div");
      grid.className = "count-grid";
      var picked = {};
      for(var i=0;i<loc.pool;i++){
        (function(idx){
          var item = document.createElement("button");
          item.className = "count-item";
          item.textContent = loc.emoji;
          item.addEventListener("click", function(){
            if(state.answered) return;
            var isPicked = item.classList.toggle("picked");
            picked[idx] = isPicked;
            var count = Object.keys(picked).filter(function(k){return picked[k];}).length;
            state.selected = count;
            status.textContent = "Selected: " + count;
          });
          grid.appendChild(item);
        })(i);
      }
      cwrap.appendChild(grid);

      var confirm = document.createElement("button");
      confirm.className = "btn btn-primary";
      confirm.textContent = "Give apples";
      confirm.addEventListener("click", function(){
        if(state.answered) return;
        answer(state.selected === loc.target, loc);
      });
      cwrap.appendChild(confirm);
      scene.appendChild(cwrap);
    }

    else if(loc.type === "yesno"){
      var outer = document.createElement("div");
      var sky = document.createElement("div");
      sky.className = "sky-strip";
      sky.textContent = loc.sky;
      outer.appendChild(sky);

      var yn = document.createElement("div");
      yn.className = "yesno-row";
      var yes = document.createElement("button");
      yes.className = "yesno-card";
      yes.innerHTML = '<span class="emoji">🙆</span><span class="jp">はい</span>';
      yes.addEventListener("click", function(){
        if(state.answered) return;
        answer(loc.correct === "yes", loc);
      });
      var no = document.createElement("button");
      no.className = "yesno-card";
      no.innerHTML = '<span class="emoji">🙅</span><span class="jp">いいえ</span>';
      no.addEventListener("click", function(){
        if(state.answered) return;
        answer(loc.correct === "no", loc);
      });
      yn.appendChild(yes); yn.appendChild(no);
      outer.appendChild(yn);
      scene.appendChild(outer);
    }

    else if(loc.type === "finale"){
      var fwrap = document.createElement("div");
      fwrap.className = "finale-wrap";
      var p = document.createElement("p");
      p.textContent = "Kon bows low, tails curling in the lantern light. Bow back to say farewell.";
      fwrap.appendChild(p);
      var bow = document.createElement("button");
      bow.className = "hotspot";
      bow.style.margin = "0 auto";
      bow.innerHTML = '<span class="emoji">🙇</span><span>Bow farewell</span>';
      bow.addEventListener("click", function(){
        if(state.answered) return;
        answer(true, loc);
      });
      fwrap.appendChild(bow);
      scene.appendChild(fwrap);
    }
  }

  function answerDuoAction(optKey, loc){
    if(state.answered || state.acting) return;
    state.acting = true;
    var playerEl = $("player-figure");
    if(playerEl){
      playerEl.classList.remove("action-bow", "action-wave", "action-clap", "action-celebrate", "action-try-again");
      void playerEl.offsetWidth;
      playerEl.classList.add("action-" + optKey);
    }
    setTimeout(function(){
      if(playerEl) playerEl.classList.remove("action-" + optKey);
      resolveDuoAnswer(optKey === loc.correct, loc);
    }, 1250);
  }

  function resolveDuoAnswer(isCorrect, loc){
    state.acting = false;

    if(isCorrect){
      state.answered = true;
      entranceTutorialState = LanternAlleyLogic.completeTutorial(entranceTutorialState);
      renderEntranceTutorialProgress();
      setEntranceChoicesDisabled(true);
      var completeStep = LanternAlleyLogic.getTutorialStep(entranceTutorialState);
      var fu = {jp:completeStep.jp, romaji:completeStep.romaji, meaning:""};
      $("jp-line").textContent = fu.jp;
      $("romaji-line").textContent = fu.romaji;
      $("romaji-line").style.display = state.romajiOn ? "block" : "none";
      $("meaning-line").textContent = fu.meaning;
      $("meaning-line").classList.add("show");
      speak(fu.jp, "correct");
      var correctPlayer = $("player-figure");
      if(correctPlayer){
        correctPlayer.classList.add("action-celebrate");
        setTimeout(function(){ correctPlayer.classList.remove("action-celebrate"); }, 800);
      }

      var already = !!state.starred[loc.key];
      state.visited[loc.key] = true;
      rewardCorrect("entrance:greeting", "learn");
      if(state.mistakesThisVisit === 0 && !already){
        state.starred[loc.key] = true;
      }
      saveProgress();
      renderHud();

      var msg = "正しく行動できました。";
      if(state.mistakesThisVisit === 0 && !already){
        msg += " <b>+1 ⭐</b>";
      }else if(already){
        msg += "（星は獲得済みです）";
      }
      showFeedback(true, msg);
      $("btn-next").textContent = "路地を見る";
      $("next-row").style.display = "block";
      // The Entrance scene fills its grid row, so the continue button lands
      // below the stage and off-screen. This hands it the finished action
      // dock's slot instead.
      screenGame.classList.add("entrance-complete");
    }else{
      state.mistakesThisVisit = Math.min(3, state.mistakesThisVisit + 1);
      renderHud();

      var fw = loc.followUpWrong;
      $("jp-line").textContent = fw.jp;
      $("romaji-line").textContent = fw.romaji;
      $("romaji-line").style.display = state.romajiOn ? "block" : "none";
      $("meaning-line").textContent = fw.meaning;
      $("meaning-line").classList.add("show");
      speak(fw.jp, "wrong");
      var retryPlayer = $("player-figure");
      if(retryPlayer){
        retryPlayer.classList.add("action-try-again");
        setTimeout(function(){ retryPlayer.classList.remove("action-try-again"); }, 800);
      }

      if(activeFoxEl){
        activeFoxEl.classList.add("confused");
        setTimeout(function(){ activeFoxEl.classList.remove("confused"); }, 750);
      }
      showFeedback(false, "頼まれた行動をもう一度考えてみましょう。");

      setTimeout(function(){
        if(state.answered) return;
        $("jp-line").textContent = loc.jp;
        $("romaji-line").textContent = loc.romaji;
        $("romaji-line").style.display = state.romajiOn ? "block" : "none";
        $("meaning-line").classList.remove("show");
        $("feedback-row").classList.remove("show");
      }, 2600);
    }
  }

  function answer(isCorrect, loc){
    if(isCorrect){
      state.answered = true;
      $("meaning-line").classList.add("show");

      var already = !!state.starred[loc.key];
      var firstVisit = !state.visited[loc.key];
      state.visited[loc.key] = true;
      if(state.mistakesThisVisit === 0 && !already){
        state.starred[loc.key] = true;
      }
      saveProgress();
      renderHud();

      var msg = "Correct! " + loc.meaning;
      if(state.mistakesThisVisit === 0 && !already){
        msg += " <b>+1 star</b>";
      }else if(already){
        msg += " (already starred here)";
      }
      showFeedback(true, msg);
      $("next-row").style.display = "block";
    }else{
      state.mistakesThisVisit = Math.min(3, state.mistakesThisVisit + 1);
      renderHud();
      showFeedback(false, "Not quite — try listening again, or check the hint below.");
    }
  }

  function showKonStageResponse(stage, prompt, isCorrect, selectedKey){
    if(!stage || !stage.getKonResponse) return;
    if(konResponseTimer){ clearTimeout(konResponseTimer); konResponseTimer = null; }
    var response = stage.getKonResponse(prompt, isCorrect, selectedKey);
    $("jp-line").textContent = response;
    $("romaji-line").textContent = "";
    $("romaji-line").style.display = "none";
    setEntranceFoxPose(isCorrect ? "celebrate" : "tryAgain");
    speak(response, isCorrect ? "correct" : "wrong");

    if(!isCorrect && state.stagePhase !== "challenge"){
      konResponseTimer = setTimeout(function(){
        if(state.answered || state.currentKey !== stage.key) return;
        $("jp-line").textContent = stage.getWrittenPrompt(prompt, state.stagePhase);
        $("romaji-line").textContent = prompt.romaji;
        $("romaji-line").style.display = state.romajiOn ? "block" : "none";
        setEntranceFoxPose("listen");
        konResponseTimer = null;
      }, 2400);
    }
  }

  // The Day 2 translation belongs to the question. Once Kon replies, the
  // Japanese on screen is her answer, and leaving the question's English under
  // it read as a mistranslation of what she just said.
  function showPracticeTranslation(visible){
    if(state.stagePhase !== "practice") return;
    var line = $("meaning-line");
    // Clear the text, not just the class: the correct-answer branch re-adds
    // "show" further down, which brought the question's English back under
    // Kon's reply.
    if(visible){
      var prompt = getActivePrompt(getLocation(state.currentKey));
      line.textContent = prompt ? prompt.meaning : "";
    }else{
      line.textContent = "";
    }
    line.classList.toggle("show", !!visible);
  }

  function answerStage(isCorrect, prompt, selectedKey){
    showPracticeTranslation(false);
    var stage = getLocation(prompt.stageKey);
    var items = state.phaseItems || stage.getPhaseItems(state.stagePhase);
    showKonStageResponse(stage, prompt, isCorrect, selectedKey);
    if(isCorrect){
      // Credit the word itself, not just the wallet. The three days teach five
      // of the Inn's forty catalog words, and answering one correctly here is
      // the same evidence of understanding as answering it in an episode.
      var masteredId = stage.getTargetId && stage.getTargetId(prompt.focusWord);
      if(masteredId) markMastered(prompt.stageKey, masteredId);
      rewardCorrect("training:" + prompt.stageKey + ":" + state.stagePhase + ":" + (prompt.id || prompt.focusWord || state.encounterIndex), state.stagePhase);
    }

    if(state.stagePhase === "challenge"){
      state.answered = true;
      if(isCorrect){
        state.challengeScore += 1;
        state.challengeCorrectWords[prompt.focusWord] = true;
        showFeedback(true, prompt.meaning ? "Correct! " + prompt.meaning : "正解です。");
      }else{
        state.mistakesThisVisit = Math.min(3, state.mistakesThisVisit + 1);
        state.challengeMisses.push(prompt);
        showFeedback(false, stage.getWrongAnswerFeedback(prompt, selectedKey) + " This word will return in focused review.");
      }
      $("meaning-line").classList.add("show");
      renderHud();

      if(state.encounterIndex === items.length - 1){
        var correctWords = Object.keys(state.challengeCorrectWords);
        state.stageMastered = stage.isChallengeMastered(state.challengeScore, correctWords);
        if(state.stageMastered){
          var already = !!state.starred[stage.key];
          state.visited[stage.key] = true;
          if(state.mistakesThisVisit === 0 && !already) state.starred[stage.key] = true;
          saveProgress();
          renderHud();
          showFeedback(true, "三日目の挑戦を達成しました。" + state.challengeScore + "/" + items.length + "、五つの言葉を思い出せました。");
          $("btn-next").textContent = "路地へ戻る →";
        }else{
          showFeedback(false, "三日目の結果は" + state.challengeScore + "/" + items.length + "です。間違えた言葉だけ復習しましょう。");
          $("btn-next").textContent = "間違えた言葉を復習する →";
        }
      }else{
        $("btn-next").textContent = "次の仕事へ →";
      }
      $("next-row").style.display = "block";
      saveStageProgress();
      scheduleCorrectAdvance(stage, isCorrect);
      return;
    }

    if(isCorrect){
      state.answered = true;
      $("meaning-line").classList.add("show");
      if(state.stagePhase === "review") state.challengeCorrectWords[prompt.focusWord] = true;
      var isFinalEncounter = state.encounterIndex === items.length - 1;
      if(isFinalEncounter && state.stagePhase === "review"){
        state.stageMastered = stage.isFocusedReviewComplete(items, Object.keys(state.challengeCorrectWords));
        state.visited[stage.key] = true;
        saveProgress();
        renderHud();
        showFeedback(true, "復習が終わりました。間違えた言葉をすべて思い出せました。");
        $("btn-next").textContent = "路地へ戻る →";
      }else if(isFinalEncounter && state.stagePhase === "learn"){
        showFeedback(true, prompt.completionFeedback || "Learn phase complete. Now retrieve the same words in changed situations.");
        $("btn-next").textContent = prompt.completionNextLabel || "Start practice →";
      }else if(isFinalEncounter && state.stagePhase === "practice"){
        showFeedback(true, "二日目の仕事が終わりました。三日目は音声だけで挑戦します。");
        $("btn-next").textContent = "三日目へ →";
      }else{
        showFeedback(true, prompt.meaning ? "Correct! " + prompt.meaning : "正解です。");
        $("btn-next").textContent = "Continue →";
      }
      $("next-row").style.display = "block";
      saveStageProgress();
      scheduleCorrectAdvance(stage, true);
    }else{
      state.mistakesThisVisit = Math.min(3, state.mistakesThisVisit + 1);
      renderHud();
      showFeedback(false, stage.getWrongAnswerFeedback(prompt, selectedKey));
      offerRetry(prompt);
    }
  }

  // Learn and Practice are for learning, so a wrong answer must leave the
  // question answerable. Only Challenge is scored on one attempt. Without this
  // the scene kept whatever state the failed attempt left behind and there was
  // no way to try again.
  function offerRetry(prompt){
    if(state.stagePhase === "challenge") return;
    setTimeout(function(){
      if(state.answered) return;
      if(state.currentKey !== "home-inn") return;
      renderInnInteraction(prompt, true);
      showPracticeTranslation(true);
      $("inn-status").textContent = "もう一度どうぞ。";
    }, 900);
  }

  function scheduleCorrectAdvance(stage, isCorrect){
    var delay = stage.getAutoAdvanceDelay(isCorrect);
    if(delay === null) return;
    var expectedPhase = state.stagePhase;
    var expectedIndex = state.encounterIndex;
    $("next-row").style.display = "none";

    function go(){
      if(state.currentKey !== stage.key || !state.answered) return;
      if(state.stagePhase !== expectedPhase || state.encounterIndex !== expectedIndex) return;
      continueStageEncounter(stage);
    }

    // Kon's reply runs longer than the old fixed delay, so wait for her to
    // finish rather than talking over the listening practice.
    afterSpeech(go, delay);

    // Bring the button back if the advance has not happened yet, so there is
    // always a visible way forward even when the voice never reports back.
    setTimeout(function(){
      if(state.currentKey !== stage.key || !state.answered) return;
      if(state.stagePhase !== expectedPhase || state.encounterIndex !== expectedIndex) return;
      $("next-row").style.display = "block";
    }, delay + 2500);
  }

  function showFeedback(isCorrect, text){
    var row = $("feedback-row");
    var stamp = $("stamp");
    stamp.className = "stamp" + (isCorrect ? " good" : "");
    stamp.textContent = isCorrect ? "正解" : "もう一度";
    stamp.style.animation = "none";
    void stamp.offsetWidth;
    stamp.style.animation = "";
    $("feedback-text").innerHTML = text;
    row.classList.add("show");
  }

})();
