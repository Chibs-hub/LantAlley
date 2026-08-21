(function(root){
  "use strict";

  var tutorialSteps = [
    {kind:"greeting", jp:"こんにちは！言葉の路地へようこそ。", romaji:"Konnichiwa! Kotoba no roji e youkoso."},
    {kind:"world", jp:"ここでは、日本語を聞いて、頼まれたことを行動で答えます。正しくできると、次の場所へ進めます。", romaji:"Koko de wa, nihongo o kiite, tanomareta koto o koudou de kotaemasu. Tadashiku dekiru to, tsugi no basho e susumemasu."},
    {kind:"request", jp:"まず、私にお辞儀してください。", romaji:"Mazu, watashi ni ojigi shite kudasai."},
    {kind:"complete", jp:"上手です！日本語を聞いて行動できました。これから路地を歩いて、行きたい場所を選んでください。", romaji:"Jouzu desu! Nihongo o kiite koudou dekimashita. Kore kara roji o aruite, ikitai basho o erande kudasai.", destination:"map"}
  ];
  var tutorialActions = [
    {key:"bow", emoji:"🙇", label:"お辞儀"},
    {key:"wave", emoji:"👋", label:"手を振る"},
    {key:"clap", emoji:"👏", label:"拍手"}
  ];

  function createTutorial(){ return {index:0}; }
  function advanceTutorial(state){ return {index:Math.min(2, Number(state && state.index || 0) + 1)}; }
  function completeTutorial(){ return {index:3}; }
  function getTutorialStep(state){ return tutorialSteps[Math.max(0, Math.min(3, Number(state && state.index || 0)))]; }
  function getTutorialActions(){ return tutorialActions.map(function(item){ return {key:item.key, emoji:item.emoji, label:item.label}; }); }
  function getHowToInteract(){ return "Choose the action Kon asks for."; }

  function getSpeechEndPose(mode){
    if(mode === "correct") return "celebrate";
    if(mode === "wrong") return "tryAgain";
    if(mode === "ask") return "listen";
    return "talkBase";
  }

  function shouldUseTransparentFox(locationKey, hasEncounters){
    return locationKey === "entrance" || !!hasEncounters;
  }

  function getTransparentFoxStyle(){
    return {
      boxShadow:"none",
      filter:"drop-shadow(0 6px 5px rgba(36,31,28,0.16))"
    };
  }

  function getHappyMouthStyle(){
    return {
      left:"50%",
      top:"53%",
      borderRadius:"50% 50% 64% 64% / 34% 34% 76% 76%",
      background:"radial-gradient(ellipse at 50% 84%, #c97872 0 24%, transparent 28%), radial-gradient(ellipse at 50% 38%, #7a4338 0%, #4d2825 56%, #2a1517 100%)"
    };
  }

  root.LanternAlleyLogic = {
    createTutorial:createTutorial,
    advanceTutorial:advanceTutorial,
    completeTutorial:completeTutorial,
    getTutorialStep:getTutorialStep,
    getTutorialActions:getTutorialActions,
    getHowToInteract:getHowToInteract,
    getSpeechEndPose:getSpeechEndPose,
    shouldUseTransparentFox:shouldUseTransparentFox,
    getTransparentFoxStyle:getTransparentFoxStyle,
    getHappyMouthStyle:getHappyMouthStyle
  };
})(typeof window !== "undefined" ? window : globalThis);
