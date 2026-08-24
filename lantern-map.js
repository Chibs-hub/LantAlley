(function(root){
  "use strict";

  var destinations = [
    {
      key:"entrance",
      name:"路地の入口",
      story:"コンと出会い、日本語を聞いて行動する方法を覚える場所です。",
      focus:"あいさつを聞き分け、動作で答えます。",
      position:{x:50,y:88},
      availability:"implemented",
      playableLocationKey:"entrance"
    },
    {
      key:"home-inn",
      name:"月見宿",
      story:"宿の主人が、明日の客を迎える準備を手伝ってほしいそうです。",
      focus:"部屋の物を動かし、聞こえた依頼どおりに行動します。",
      position:{x:19,y:62},
      availability:"implemented",
      playableLocationKey:"home-inn"
    },
    {
      key:"market",
      name:"灯り市",
      story:"夕市の店主が、品物を選び、客へ渡す手伝いを探しています。",
      focus:"品物を比べ、数や特徴を聞き分けて扱います。",
      position:{x:35,y:37},
      availability:"preparing"
    },
    {
      key:"tea-house",
      name:"夕月茶屋",
      story:"注文が重なった茶屋で、女将が配膳を手伝ってほしいそうです。",
      focus:"料理と順番を聞き分け、頼まれた席へ運びます。",
      position:{x:75,y:59},
      availability:"preparing"
    },
    {
      key:"station",
      name:"路地駅",
      story:"最終列車の前に、駅員が旅人の案内を手伝う人を必要としています。",
      focus:"時刻、行き先、乗り換えを聞いて正しい場所へ導きます。",
      position:{x:73,y:22},
      availability:"preparing"
    },
    {
      key:"shrine",
      name:"灯守神社",
      story:"今夜の祭りを前に、宮司が境内の準備を手伝ってほしいそうです。",
      focus:"場所と順番を聞き分け、飾りや人の流れを整えます。",
      position:{x:50,y:13},
      availability:"preparing"
    }
  ];

  destinations.forEach(function(place){
    Object.freeze(place.position);
    Object.freeze(place);
  });
  Object.freeze(destinations);

  function getDestination(key){
    for(var i=0;i<destinations.length;i+=1){
      if(destinations[i].key === key) return destinations[i];
    }
    return null;
  }

  function resolveState(key, progress){
    var place = getDestination(key);
    var data = progress || {};
    var visited = data.visited || {};
    var stageProgress = data.stageProgress || {};
    if(!place || place.availability === "preparing") return "preparing";
    if(visited[key]) return "completed";
    if(key === "home-inn" && stageProgress.homeInn) return "in-progress";
    return "available";
  }

  function getAction(key, progress){
    var place = getDestination(key);
    if(!place || !place.playableLocationKey) return null;
    var state = resolveState(key, progress);
    var label;
    if(state === "completed") label = "もう一度見る";
    else if(state === "in-progress") label = "続きを始める";
    else label = key === "entrance" ? "入口へ行く" : place.name + "へ行く";
    return Object.freeze({label:label,locationKey:place.playableLocationKey});
  }

  root.LanternAlleyMap = Object.freeze({
    destinations:destinations,
    getDestination:getDestination,
    resolveState:resolveState,
    getAction:getAction,
    stateLabels:Object.freeze({
      completed:"完了",
      "in-progress":"学習中",
      available:"未訪問",
      preparing:"準備中"
    })
  });
})(typeof self !== "undefined" ? self : this);
