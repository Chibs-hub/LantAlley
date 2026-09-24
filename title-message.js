(function(root){
  "use strict";

  function select(context){
    var state = context || {};
    if(!state.visitedCount){
      return {kind:"welcome", text:"いっしょに路地を歩きましょう。言葉が待っていますよ。"};
    }
    if(state.unfinishedPlaceName){
      return {kind:"resume", text:"「" + state.unfinishedPlaceName + "」の続きから始めましょう。"};
    }
    if(state.currentPlaceName){
      return {kind:"continue", text:"「" + state.currentPlaceName + "」を続けましょう。"};
    }
    if(state.nextPlaceName){
      return {kind:"next", text:"次は「" + state.nextPlaceName + "」へ行きましょう。"};
    }
    if(state.allStagesComplete){
      return {kind:"complete", text:"よくできましたね。復習して、言葉を定着させましょう。"};
    }
    return {kind:"review", text:"集めた言葉を、もう一度見てみましょう。"};
  }

  root.LanternTitleMessage = Object.freeze({select:select});
})(typeof self !== "undefined" ? self : this);
