(function(){
  "use strict";

  var STORAGE_KEY = "lanternAlley.v2";

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
      options:[
        {key:"bow", emoji:"🙇", label:"お辞儀"},
        {key:"wave", emoji:"👋", label:"手を振る"},
        {key:"clap", emoji:"👏", label:"拍手"}
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

  var KON_PHOTO_WAVE_L = "assets/kon/kon-wave-left.webp";
  var KON_PHOTO_WAVE_R = "assets/kon/kon-wave-right.webp";
  var KON_PHOTO_WAVE_BOTH = "assets/kon/kon-wave-both.webp";
  var KON_PHOTO_SRC = "assets/kon/kon-idle.webp";

  var PLAYER_SVG =
    '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="playerRobeGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#2f4874"></stop>' +
          '<stop offset="100%" stop-color="#1b2a4a"></stop>' +
        '</linearGradient>' +
        '<linearGradient id="playerSkinGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#f0c093"></stop>' +
          '<stop offset="100%" stop-color="#d9a26e"></stop>' +
        '</linearGradient>' +
        '<linearGradient id="playerHairGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="#3a332e"></stop>' +
          '<stop offset="100%" stop-color="#201b18"></stop>' +
        '</linearGradient>' +
      '</defs>' +
      '<ellipse cx="50" cy="95" rx="20" ry="4.5" fill="rgba(36,31,28,0.18)"></ellipse>' +
      '<g class="player-root">' +
        '<path d="M40,78 L40,91 Q40,94 43,94 L46,94 Q48,94 48,91 L48,78 Z" fill="#20304f"></path>' +
        '<path d="M52,78 L52,91 Q52,94 55,94 L58,94 Q60,94 60,91 L60,78 Z" fill="#20304f"></path>' +
        '<g class="player-upper-group">' +
          '<g class="player-arm-left">' +
            '<path d="M37,52 C31,58 29,66 31,74" stroke="url(#playerRobeGrad)" stroke-width="7" fill="none" stroke-linecap="round"></path>' +
            '<circle cx="31" cy="75" r="4" fill="url(#playerSkinGrad)"></circle>' +
          '</g>' +
          '<g class="player-arm-right">' +
            '<path d="M63,52 C69,58 71,66 69,74" stroke="url(#playerRobeGrad)" stroke-width="7" fill="none" stroke-linecap="round"></path>' +
            '<circle cx="69" cy="75" r="4" fill="url(#playerSkinGrad)"></circle>' +
          '</g>' +
          '<path d="M38,50 C35,60 35,70 40,78 L60,78 C65,70 65,60 62,50 C58,45 42,45 38,50 Z" fill="url(#playerRobeGrad)"></path>' +
          '<rect x="39" y="63" width="22" height="6" rx="2" fill="#c2543a"></rect>' +
          '<g class="player-head-group">' +
            '<rect x="46" y="41" width="8" height="7" fill="url(#playerSkinGrad)"></rect>' +
            '<circle cx="50" cy="33" r="13" fill="url(#playerSkinGrad)"></circle>' +
            '<path d="M37,31 C36,19 42,13 50,13 C58,13 64,19 63,31 C63,24 58,20 50,20 C42,20 37,24 37,31 Z" fill="url(#playerHairGrad)"></path>' +
            '<circle cx="46" cy="34" r="1.3" fill="#241f1c"></circle>' +
            '<circle cx="54" cy="34" r="1.3" fill="#241f1c"></circle>' +
            '<path d="M46,39 Q50,41.5 54,39" stroke="#241f1c" stroke-width="1.3" fill="none" stroke-linecap="round"></path>' +
            '<ellipse cx="44" cy="37" rx="2.4" ry="1.4" fill="#c2543a" opacity="0.35"></ellipse>' +
            '<ellipse cx="56" cy="37" rx="2.4" ry="1.4" fill="#c2543a" opacity="0.35"></ellipse>' +
          '</g>' +
        '</g>' +
      '</g>' +
    '</svg>';

  var ENTRANCE_FOX_POSES = {
    idle:"assets/fox/fox-neutral-idle.webp",
    talkBase:"assets/fox/fox-neutral-no-mouth-transparent.webp",
    waveClosed:"assets/fox/fox-wave-closed-smile.webp",
    waveSmall:"assets/fox/fox-wave-small-open-mouth.webp",
    waveOpen:"assets/fox/fox-wave-konnichiwa-mouth.webp",
    invite:"assets/fox/fox-invite-bow.webp",
    celebrate:"assets/fox/fox-celebration.webp",
    tryAgain:"assets/fox/fox-try-again.webp",
    listen:"assets/fox/fox-listening.webp"
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

  var state = {
    currentKey:null,
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
    stageProgress:{homeInn:null},
    visited:{},
    starred:{}
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
      audio.addEventListener("ended", stopTalk);
      audio.addEventListener("error", stopTalk);
    }

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

  function speak(text, mode){
    mode = mode || "ask";
    if(!state.voiceOn) return;
    if(playClip(text, mode)) return;
    speakWithSynthesis(text, mode);
  }

  // Run `next` once Kon has finished the line now playing, then pause briefly.
  // Every place that used a fixed timer cut her off mid-sentence, which throws
  // away the listening practice the line exists to give.
  function afterSpeech(next, fallbackDelay, settle){
    settle = settle === undefined ? 700 : settle;
    var fired = false;
    var onDone = function(){
      if(fired) return;
      fired = true;
      setTimeout(next, settle);
    };

    // Not checking clip.paused: play() is async, so a clip about to start
    // still reports paused here.
    var clip = currentClip;
    if(clip && !clip.ended){
      clip.addEventListener("ended", onDone);
      clip.addEventListener("error", onDone);
      setTimeout(onDone, 20000);
      return;
    }

    if("speechSynthesis" in window && window.speechSynthesis.speaking){
      var poll = setInterval(function(){
        if(!window.speechSynthesis.speaking){
          clearInterval(poll);
          onDone();
        }
      }, 150);
      setTimeout(function(){ clearInterval(poll); onDone(); }, 20000);
      return;
    }

    setTimeout(next, fallbackDelay === undefined ? 900 : fallbackDelay);
  }

  function speakWithSynthesis(text, mode){
    mode = mode || "ask";
    if(!state.voiceOn) return;
    if(!("speechSynthesis" in window)){
      if(activeFoxEl){
        activeFoxEl.classList.add("talking");
        startWave(mode);
        var dur = Math.min(4000, Math.max(900, text.length * 90));
        setTimeout(function(){ activeFoxEl.classList.remove("talking"); stopWave(); }, dur);
      }
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
        var stopTalk = function(){ fox.classList.remove("talking"); stopWave(); };
        u.onend = stopTalk;
        u.onerror = stopTalk;
      }
      window.speechSynthesis.speak(u);
    }catch(e){ /* speech unsupported, text remains visible */ }
  }

  function loadProgress(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      var data = JSON.parse(raw);
      return data;
    }catch(e){ return null; }
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
          medal:state.stageMastered ? "gold" : (state.stagePhase === "challenge" || state.stagePhase === "review" ? "silver" : (state.stagePhase === "practice" ? "bronze" : "none"))
        };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        visited: Object.keys(state.visited),
        starred: Object.keys(state.starred),
        stageProgress:state.stageProgress
      }));
    }catch(e){ /* storage unavailable, progress just won't persist */ }
  }
  function applyProgress(data){
    state.visited = {};
    state.starred = {};
    state.stageProgress = {homeInn:null};
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

  var screenTitle = $("screen-title");
  var screenMap = $("screen-map");
  var screenGame = $("screen-game");

  var saved = loadProgress();
  applyProgress(saved);
  if(visitedCount() > 0){
    var note = $("progress-note");
    note.style.display = "block";
    note.textContent = "Kon remembers you — " + visitedCount() + "/" + locations.length +
      " spots explored, " + starCount() + " star" + (starCount() === 1 ? "" : "s") + " earned.";
    $("btn-start").textContent = "Return to the Alley";
    $("btn-restart").style.display = "inline-block";
  }

  $("btn-start").addEventListener("click", function(){
    // The alley opens at its entrance. Sending a first-time player straight
    // there means Kon explains the game before they are asked to choose a
    // destination from a map that means nothing to them yet. Once they have
    // been through it, the map is the more useful landing screen.
    if(!state.visited.entrance) enterLocation("entrance");
    else showMap();
  });
  $("btn-restart").addEventListener("click", function(){
    applyProgress(null);
    state.currentKey = null;
    saveProgress();
    $("progress-note").style.display = "none";
    $("btn-restart").style.display = "none";
    $("btn-start").textContent = "Enter the Alley";
    showMap();
  });
  $("btn-map-restart").addEventListener("click", function(){
    applyProgress(null);
    state.currentKey = null;
    saveProgress();
    renderMap();
  });
  $("btn-back-map").addEventListener("click", function(){ showMap(); });
  $("btn-restart-learn").addEventListener("click", restartStageLearning);
  $("btn-next").addEventListener("click", function(){
    var loc = getLocation(state.currentKey);
    if(loc && loc.encounters){
      continueStageEncounter(loc);
    }else{
      showMap();
    }
  });

  function showMap(){
    screenTitle.style.display = "none";
    screenGame.style.display = "none";
    screenMap.style.display = "block";
    renderMap();
  }

  function renderMap(){
    $("map-stars").textContent = "⭐ " + starCount() + "/" + CHALLENGE_KEYS.length;
    $("map-visited").textContent = "🏮 " + visitedCount() + "/" + locations.length;

    var nodesEl = $("map-nodes");
    nodesEl.innerHTML = "";
    locations.forEach(function(loc){
      var locked = loc.type === "finale" && !allChallengesVisited();
      var btn = document.createElement("button");
      btn.className = "map-node" + (state.visited[loc.key] ? " visited" : "") + (locked ? " locked" : "");
      btn.style.left = loc.pos.x + "%";
      btn.style.top = loc.pos.y + "%";
      btn.setAttribute("data-key", loc.key);
      btn.setAttribute("aria-label", loc.name + (locked ? " (locked)" : ""));

      var badge = "";
      if(state.starred[loc.key]) badge = '<span class="badge star">★</span>';
      else if(state.visited[loc.key]) badge = '<span class="badge">✓</span>';
      var medal = "";
      if(loc.key === "home-inn" && state.stageProgress.homeInn){
        var medalIcons = {bronze:"🥉",silver:"🥈",gold:"🥇"};
        medal = '<span class="medal" aria-label="'+state.stageProgress.homeInn.medal+' medal">'+(medalIcons[state.stageProgress.homeInn.medal] || "")+'</span>';
      }

      btn.innerHTML =
        '<span class="node-circle">' + loc.icon + badge + '</span>' +
        '<span class="node-label">' + loc.name + medal + '</span>';

      btn.addEventListener("click", function(){
        if(locked){
          showToast(loc.finaleUnlockNote || "This spot isn't open yet.");
          return;
        }
        enterLocation(loc.key);
      });
      nodesEl.appendChild(btn);
    });
  }

  var toastTimer = null;
  function showToast(msg){
    var el = $("map-toast");
    el.textContent = msg;
    el.classList.add("show");
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 3200);
  }

  $("romaji-switch").addEventListener("click", function(){
    state.romajiOn = !state.romajiOn;
    this.classList.toggle("on", state.romajiOn);
    this.setAttribute("aria-pressed", String(state.romajiOn));
    $("romaji-line").style.display = state.romajiOn ? "block" : "none";
  });

  $("speak-btn").addEventListener("click", function(){
    var loc = getLocation(state.currentKey);
    if(loc) speak(getActivePrompt(loc).jp);
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

  function continueStageEncounter(loc){
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

  function renderStageIntro(loc){
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
    var phaseName = state.stagePhase === "review" ? "focused review" : state.stagePhase;
    var phaseLabels = {learn:"Learn / 学ぶ", practice:"Practice / 練習", challenge:"Challenge / 挑戦", review:"Review / 復習"};
    $("scene-label").textContent = prompt.stageLabel + " - " + prompt.label;
    $("stage-phase-row").style.display = "flex";
    $("stage-phase-badge").textContent = phaseLabels[state.stagePhase] || phaseName;
    $("encounter-status").style.display = "block";
    $("encounter-progress").textContent = String(state.encounterIndex + 1);
    $("encounter-total").textContent = String((state.phaseItems || loc.getPhaseItems(state.stagePhase)).length);
    $("narration").textContent = loc.getStorySetup(prompt, state.resumedStageEntry);
    state.resumedStageEntry = false;
    $("jp-line").textContent = loc.getWrittenPrompt(prompt, state.stagePhase);
    $("romaji-line").textContent = prompt.romaji;
    $("romaji-line").style.display = state.romajiOn && state.stagePhase !== "challenge" ? "block" : "none";
    $("meaning-line").textContent = prompt.meaning;
    $("meaning-line").classList.remove("show");
    $("hint-box").textContent = prompt.hint;
    $("hint-box").classList.remove("show");
    $("hint-btn").style.display = state.stagePhase === "challenge" ? "none" : "block";
    renderInnInteraction(prompt, true);
    speak(prompt.jp);
  }

  function enterLocation(key){
    var loc = getLocation(key);
    if(!loc) return;

    screenTitle.style.display = "none";
    screenMap.style.display = "none";
    screenGame.style.display = "block";

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
    if(loc.encounters && state.stageProgress.homeInn){
      var resumed = state.stageProgress.homeInn;
      state.stagePhase = resumed.phase || "learn";
      state.phaseItems = state.stagePhase === "review" ? loc.challenge.filter(function(item){ return (resumed.misses || []).indexOf(item.focusWord) >= 0; }) : null;
      if(state.phaseItems && !state.phaseItems.length){ state.stagePhase = "challenge"; state.phaseItems = null; }
      var resumeItems = state.phaseItems || loc.getPhaseItems(state.stagePhase);
      state.encounterIndex = Math.max(0, Math.min(resumeItems.length - 1, Number(resumed.index) || 0));
      state.challengeScore = Number(resumed.challengeScore) || 0;
      (resumed.correctWords || []).forEach(function(word){ state.challengeCorrectWords[word] = true; });
      state.challengeMisses = loc.challenge.filter(function(item){ return (resumed.misses || []).indexOf(item.focusWord) >= 0; });
      state.stageMastered = !!resumed.mastered;
      state.resumedStageEntry = true;
    }

    var avatarSlot = $("avatar-slot");
    var transparentFox = LanternAlleyLogic.shouldUseTransparentFox(loc.key, !!loc.encounters);
    avatarSlot.parentElement.classList.toggle("entrance-dialogue", transparentFox);
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
    $("scene-label").textContent = loc.encounters ? loc.label + " - " + prompt.label : loc.label;
    $("encounter-status").style.display = loc.encounters ? "block" : "none";
    $("encounter-progress").textContent = "1";
    $("encounter-total").textContent = loc.encounters ? String(loc.encounters.length) : "1";
    $("narration").textContent = prompt.narration;
    $("jp-line").textContent = prompt.jp;
    $("romaji-line").textContent = prompt.romaji;
    $("romaji-line").style.display = state.romajiOn ? "block" : "none";
    $("meaning-line").textContent = prompt.meaning;
    $("meaning-line").classList.remove("show");
    $("hint-box").textContent = prompt.hint;
    $("hint-box").classList.remove("show");
    $("hint-btn").style.display = loc.type === "finale" ? "none" : "block";
    $("feedback-row").classList.remove("show");
    $("next-row").style.display = "none";

    renderHud();
    if(loc.encounters && !state.stageProgress.homeInn){
      renderStageIntro(loc);
    }else if(loc.encounters){
      renderInnInteraction(prompt, true);
      speak(prompt.jp);
    }else{
      renderScene(prompt);
      if(loc.key === "entrance") startEntranceGreeting(loc);
      else speak(prompt.jp);
    }
  }

  function setEntranceChoicesDisabled(disabled){
    var buttons = document.querySelectorAll("#scene .hotspot");
    for(var i=0;i<buttons.length;i++) buttons[i].disabled = disabled;
  }

  function startEntranceGreeting(loc){
    setEntranceChoicesDisabled(true);
    entranceTutorialState = LanternAlleyLogic.createTutorial();
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
      var world = LanternAlleyLogic.getTutorialStep(entranceTutorialState);
      $("jp-line").textContent = world.jp;
      $("romaji-line").textContent = world.romaji;
      $("meaning-line").classList.remove("show");
      setEntranceFoxPose("talkBase");
      speak(world.jp, "hello");

      afterSpeech(function(){
        if(state.currentKey !== "entrance" || state.answered) return;
        entranceTutorialState = LanternAlleyLogic.advanceTutorial(entranceTutorialState);
        var request = LanternAlleyLogic.getTutorialStep(entranceTutorialState);
        $("jp-line").textContent = request.jp;
        $("romaji-line").textContent = request.romaji;
        setEntranceFoxPose("invite");
        setEntranceChoicesDisabled(false);
        speak(request.jp, "ask");
      });
    });
  }

  function renderHud(){
    var heartsEl = $("hud-hearts");
    heartsEl.innerHTML = "";
    for(var i=0;i<3;i++){
      var s = document.createElement("span");
      s.textContent = "❤";
      s.className = i < (3 - state.mistakesThisVisit) ? "lit" : "";
      heartsEl.appendChild(s);
    }
    $("hud-star-count").textContent = starCount();
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
  function cushionMarkup(a){
    var fill = a.color === "red" ? "#c2543a" : "#3f6ea8";
    var scale = a.size === "large" ? 1 : 0.62;
    var rot = a.dir === "up" ? 0 : 90;
    var t = 'rotate(' + rot + ' 16 16) translate(16 16) scale(' + scale + ') translate(-16 -16)';
    return '<span class="inn-icon cushion-icon" aria-hidden="true"><svg viewBox="0 0 32 32">'
      + '<g transform="' + t + '">'
      + '<rect x="4" y="9" width="24" height="14" rx="4" fill="' + fill + '" stroke="#3e3024" stroke-width="2"/>'
      + '<line x1="4" y1="16" x2="28" y2="16" stroke="#3e3024" stroke-width="1.5" opacity="0.55"/>'
      + '</g></svg></span>';
  }
  function cushionLabel(a){
    return "座布団 - " + (a.color === "red" ? "赤" : "青") + "、" + (a.size === "large" ? "大" : "小") + "、" + (a.dir === "up" ? "縦向き" : "横向き");
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
    var startX, startY, origLeft, origTop, w, h, dragging = false, moved = false, slop = 6;
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", function(event){
      if(el.disabled) return;
      startX = event.clientX; startY = event.clientY; moved = false; dragging = true;
      // A finger tap routinely slides several pixels, so a 6px threshold turned
      // ordinary taps into drags that then landed on nothing.
      slop = event.pointerType === "mouse" ? 6 : 16;
      try{ el.setPointerCapture(event.pointerId); }catch(err){}
    });
    el.addEventListener("pointermove", function(event){
      if(!dragging) return;
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
    });
    function finish(event){
      if(!dragging) return;
      dragging = false;
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
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", finish);
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

  function renderInnInteraction(prompt, reset){
    var interaction = prompt.interaction;
    if(reset || !innInteractionState || innInteractionState.mechanic !== prompt.mechanic){
      innInteractionState = MoonviewInnInteractions.create(prompt.mechanic);
      if(prompt.mechanic === "coordinate"){
        innInteractionState.arrivalA = interaction.startA;
        innInteractionState.arrivalB = interaction.startB;
      }
    }
    var scene = $("scene");
    // Always visible, not a collapsed <details>: the tap-to-place shortcut is
    // useless if the only place it is mentioned is behind a disclosure arrow.
    scene.innerHTML = '<p class="inn-instruction">'+interaction.controlHelp+'</p>'
      + '<div class="inn-clue">'+interaction.clue+'</div>'
      + '<div class="inn-room"><div class="shoji" aria-hidden="true"></div><div class="inn-workspace" id="inn-workspace">'
      + '<div class="inn-scene-zones" id="inn-scene-zones"></div>'
      + '<div class="inn-tray" id="inn-tray"></div>'
      + '<div class="inn-content" id="inn-content"></div>'
      + '<div class="inn-status" id="inn-status" aria-live="polite"></div>'
      + '</div></div>';
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
          if(assign[entry[0]] === key) held += cushionMarkup(entry[1]);
        });
        zone.innerHTML = '<span class="mat-items">' + held + '</span><span class="inn-caption">' + group[1] + '</span>';
        zonesEl.appendChild(zone);
      });
      var removalZones = {};
      var sourceZones = {};
      room.swaps.forEach(function(swap){
        if(!removalZones[swap.removalKey]){
          var removal = iconButton(swap.removalIcon, swap.removalLabel, swap.removalLabel, "inn-drop-zone laundry-basket", {type:"noop"});
          removal.dataset.key = "remove-" + swap.removalKey;
          removal.dataset.verb = "replace";
          removal.dataset.action = "remove";
          removal.dataset.accepts = "";
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
        source.innerHTML = iconMarkup(swap.sourceIcon) + '<span class="inn-caption">' + swap.sourceLabel + '</span>';
        sourceZones[swap.key] = source;
        zonesEl.appendChild(source);
      });
      room.heatingAppliances.forEach(function(appliance){
        var heatingZone = iconButton(appliance.icon, appliance.label, appliance.label, "inn-drop-zone heating-zone", {type:"noop"});
        heatingZone.dataset.key = appliance.key;
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
        tray(cushionMarkup(entry[1]), cushionLabel(entry[1]), "cushion", entry[0]);
      });
      room.swaps.forEach(function(swap){
        var source = sourceZones[swap.key];
        if(st.installed === swap.key){
          source.insertAdjacentHTML("afterbegin", '<span class="inn-placed-object">' + iconMarkup(swap.newIcon) + '</span>');
        }else if(st.removed !== swap.key){
          var oldObject = document.createElement("button");
          oldObject.className = "inn-object inn-placed-object";
          oldObject.innerHTML = iconMarkup(swap.oldIcon);
          oldObject.setAttribute("aria-label", swap.oldLabel);
          oldObject.title = swap.oldLabel;
          makeMovable(oldObject, "old", swap.key);
          source.insertBefore(oldObject, source.firstChild);
        }
        if(st.removed === swap.key && st.installed !== swap.key){
          removalZones[swap.removalKey].insertAdjacentHTML("afterbegin", '<span class="inn-placed-object">' + iconMarkup(swap.oldIcon) + '</span>');
        }
        if(st.installed !== swap.key) tray(iconMarkup(swap.newIcon) + '<span class="inn-caption">' + swap.newLabel + '</span>', swap.newLabel, "new", swap.key);
      });
      room.dishes.forEach(function(dish){
        if(st.item === dish.key) return;
        tray(iconMarkup(dish.icon) + '<span class="inn-caption">' + dish.label + '</span>', dish.label, "dish", dish.key);
      });

      var tea = document.createElement("div"); tea.className = "tea-visual"; tea.id = "tea-visual";
      tea.innerHTML = '<span class="tea-steam" aria-hidden="true"></span><span class="tea-state" id="tea-state"></span>';
      work.appendChild(tea);
      updateTeaVisual(interaction);

      if(verb === "arrange"){
        var n = room.cushions.filter(function(e){ return assign[e[0]]; }).length;
        $("inn-status").textContent = n + " of " + room.cushions.length + " cushions placed.";
      }else if(verb === "replace"){
        $("inn-status").textContent = st.removed ? "The old one is out. What goes in its place?" : "";
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
      interaction.replies.forEach(function(reply){
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
        var stage = document.createElement("div");
        stage.className = "duo-stage";
        stage.innerHTML = '<div class="player-figure" id="player-figure">' + PLAYER_SVG + '</div><div class="player-caption">You</div>';
        scene.appendChild(stage);
        var how = document.createElement("div");
        how.className = "inn-control-help";
        how.innerHTML = '<strong>How to interact</strong><span>' + LanternAlleyLogic.getHowToInteract() + '</span>';
        scene.appendChild(how);
      }

      var wrap = document.createElement("div");
      wrap.className = "hotspots";
      loc.options.forEach(function(opt){
        var btn = document.createElement("button");
        btn.className = "hotspot";
        btn.setAttribute("data-key", opt.key);
        btn.innerHTML = '<span class="emoji">'+opt.emoji+'</span><span>'+opt.label+'</span>';
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
    }, 900);
  }

  function resolveDuoAnswer(isCorrect, loc){
    state.acting = false;

    if(isCorrect){
      state.answered = true;
      entranceTutorialState = LanternAlleyLogic.completeTutorial(entranceTutorialState);
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

  function answerStage(isCorrect, prompt, selectedKey){
    var stage = getLocation(prompt.stageKey);
    var items = state.phaseItems || stage.getPhaseItems(state.stagePhase);
    showKonStageResponse(stage, prompt, isCorrect, selectedKey);

    if(state.stagePhase === "challenge"){
      state.answered = true;
      if(isCorrect){
        state.challengeScore += 1;
        state.challengeCorrectWords[prompt.focusWord] = true;
        showFeedback(true, "Correct! " + prompt.meaning);
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
          showFeedback(true, "Challenge mastered: " + state.challengeScore + "/10, with all five words recalled.");
          $("btn-next").textContent = "Back to the Alley →";
        }else{
          showFeedback(false, "Challenge result: " + state.challengeScore + "/10. Review missed words, then retry the challenge.");
          $("btn-next").textContent = "Review missed words →";
        }
      }else{
        $("btn-next").textContent = "Next challenge →";
      }
      $("next-row").style.display = "block";
      saveStageProgress();
      scheduleCorrectAdvance(stage, isCorrect);
      return;
    }

    if(isCorrect){
      state.answered = true;
      $("meaning-line").classList.add("show");
      var isFinalEncounter = state.encounterIndex === items.length - 1;
      if(isFinalEncounter && state.stagePhase === "review"){
        showFeedback(true, "Focused review complete. Retry the full challenge to demonstrate mastery.");
        $("btn-next").textContent = "Retry challenge →";
      }else if(isFinalEncounter && state.stagePhase === "learn"){
        showFeedback(true, prompt.completionFeedback || "Learn phase complete. Now retrieve the same words in changed situations.");
        $("btn-next").textContent = prompt.completionNextLabel || "Start practice →";
      }else if(isFinalEncounter && state.stagePhase === "practice"){
        showFeedback(true, "Practice complete. Romaji, English, and hints will now be hidden.");
        $("btn-next").textContent = "Start challenge →";
      }else{
        showFeedback(true, "Correct! " + prompt.meaning);
        $("btn-next").textContent = "Continue →";
      }
      $("next-row").style.display = "block";
      saveStageProgress();
      scheduleCorrectAdvance(stage, true);
    }else{
      state.mistakesThisVisit = Math.min(3, state.mistakesThisVisit + 1);
      renderHud();
      showFeedback(false, stage.getWrongAnswerFeedback(prompt, selectedKey));
    }
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
