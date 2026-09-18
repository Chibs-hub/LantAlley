(function(root){
  "use strict";

  function select(context){
    var state = context || {};
    if(!state.visitedCount){
      return {kind:"welcome", text:"いっしょに路地を歩こう。言葉が待っているよ。"};
    }
    if(state.unfinishedPlaceName){
      return {kind:"resume", text:"「" + state.unfinishedPlaceName + "」の続きから始めよう。"};
    }
    if(state.currentPlaceName){
      return {kind:"continue", text:"「" + state.currentPlaceName + "」を続けよう。"};
    }
    if(state.nextPlaceName){
      return {kind:"next", text:"次は「" + state.nextPlaceName + "」へ行こう。"};
    }
    if(state.allStagesComplete){
      return {kind:"complete", text:"よくできたね。復習して、言葉を定着させよう。"};
    }
    return {kind:"review", text:"集めた言葉を、もう一度見てみよう。"};
  }

  root.LanternTitleMessage = Object.freeze({select:select});
})(typeof self !== "undefined" ? self : this);
