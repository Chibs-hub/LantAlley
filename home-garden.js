(function(root){
  "use strict";

  var TYPES = [
    {id:"cherry-tree", name:"Cherry tree", kind:"tree", price:500, matureAt:12},
    {id:"japanese-maple", name:"Japanese maple", kind:"tree", price:450, matureAt:10},
    {id:"pine-tree", name:"Pine tree", kind:"tree", price:400, matureAt:8},
    {id:"hydrangea", name:"Hydrangea", kind:"shrub", price:240, matureAt:7},
    {id:"camellia", name:"Camellia", kind:"flower", price:120, matureAt:4},
    {id:"iris", name:"Iris", kind:"flower", price:90, matureAt:2},
    {id:"chrysanthemum", name:"Chrysanthemum", kind:"flower", price:110, matureAt:3},
    {id:"lantern-flower-bed", name:"Lantern-flower bed", kind:"shrub", price:200, matureAt:5}
  ];

  function catalogue(){
    return TYPES.map(function(type){
      return {id:type.id, name:type.name, kind:type.kind, price:type.price, matureAt:type.matureAt};
    });
  }

  function getType(typeId){
    return TYPES.filter(function(type){ return type.id === typeId; })[0] || null;
  }

  function emptyGarden(){
    return {plants:[], usedCreditIds:[], starterClaimed:false, nextInstanceId:1};
  }

  function normalized(garden){
    var source = garden || {};
    return {
      plants: ((source.plants || [])).map(copyPlant),
      usedCreditIds: (source.usedCreditIds || []).slice(),
      starterClaimed: source.starterClaimed === true,
      nextInstanceId: Math.max(1, Number(source.nextInstanceId) || 1)
    };
  }

  function copyPlant(plant){
    return {
      id:plant.id,
      typeId:plant.typeId,
      slotId:plant.slotId == null ? null : plant.slotId,
      growthPoints:Math.max(0, Number(plant.growthPoints) || 0),
      stage:plant.stage || "planted",
      pendingAnimation:plant.pendingAnimation === true
    };
  }

  function newInstance(state, typeId){
    var id;
    do {
      id = "plant-" + state.nextInstanceId;
      state.nextInstanceId += 1;
    } while(state.plants.some(function(plant){ return plant.id === id; }));
    state.plants.push({
      id:id,
      typeId:typeId,
      slotId:null,
      growthPoints:0,
      stage:"planted",
      pendingAnimation:false
    });
    return id;
  }

  function buy(garden, money, typeId){
    var type = getType(typeId);
    var wallet = Math.max(0, Number(money) || 0);
    if(!type) return {ok:false, reason:"unknown", garden:garden, money:wallet};
    if(wallet < type.price) return {ok:false, reason:"poor", garden:garden, money:wallet};
    var next = normalized(garden);
    var instanceId = newInstance(next, typeId);
    return {ok:true, reason:null, garden:next, money:wallet - type.price,
            spent:type.price, instanceId:instanceId};
  }

  function claimStarter(garden){
    var plants = (garden && garden.plants) || [];
    if(garden && garden.starterClaimed === true){
      return {ok:false, reason:"claimed", garden:garden, instanceId:null};
    }
    if(plants.some(function(plant){ return plant.typeId === "camellia"; })){
      var migrated = normalized(garden);
      migrated.starterClaimed = true;
      return {ok:false, reason:"owned", garden:migrated, instanceId:null};
    }
    var next = normalized(garden);
    next.starterClaimed = true;
    var instanceId = newInstance(next, "camellia");
    return {ok:true, reason:null, garden:next, instanceId:instanceId};
  }

  function findPlantIndex(garden, instanceId){
    return ((garden && garden.plants) || []).findIndex(function(plant){
      return plant.id === instanceId;
    });
  }

  function validSlot(slotId, slots){
    return (slots || []).filter(function(slot){
      return slot.id === slotId && slot.kind === "garden";
    })[0] || null;
  }

  function place(garden, instanceId, slotId, slots, moving){
    var index = findPlantIndex(garden, instanceId);
    if(index < 0) return {ok:false, reason:"unknown", garden:garden};
    if(moving && garden.plants[index].slotId == null){
      return {ok:false, reason:"stored", garden:garden};
    }
    if(!moving && garden.plants[index].slotId != null){
      return {ok:false, reason:"planted", garden:garden};
    }
    if(!validSlot(slotId, slots)) return {ok:false, reason:"noslot", garden:garden};
    if(garden.plants.some(function(plant){
      return plant.id !== instanceId && plant.slotId === slotId;
    })) return {ok:false, reason:"occupied", garden:garden};
    var next = normalized(garden);
    next.plants[index].slotId = slotId;
    return {ok:true, reason:null, garden:next, instanceId:instanceId, slotId:slotId};
  }

  function plant(garden, instanceId, slotId, slots){
    return place(garden, instanceId, slotId, slots, false);
  }

  function move(garden, instanceId, slotId, slots){
    return place(garden, instanceId, slotId, slots, true);
  }

  function store(garden, instanceId){
    var index = findPlantIndex(garden, instanceId);
    if(index < 0) return {ok:false, reason:"unknown", garden:garden};
    if(garden.plants[index].slotId == null) return {ok:false, reason:"stored", garden:garden};
    var next = normalized(garden);
    next.plants[index].slotId = null;
    return {ok:true, reason:null, garden:next, instanceId:instanceId};
  }

  function stageFor(type, points){
    if(points >= type.matureAt) return "mature";
    if(points >= Math.max(2, Math.ceil(type.matureAt / 2))) return "growing";
    if(points >= 1) return "sprout";
    return "planted";
  }

  function creditLesson(garden, creditId, bonus){
    var used = (garden && garden.usedCreditIds) || [];
    if(!creditId || used.indexOf(creditId) >= 0){
      return {garden:garden, granted:0};
    }
    var next = normalized(garden);
    next.usedCreditIds.push(creditId);
    var points = 1 + (Number(bonus) > 0 ? 1 : 0);
    var grew = false;
    next.plants = next.plants.map(function(plant){
      var type = getType(plant.typeId);
      if(!type || plant.slotId == null || plant.stage === "mature") return plant;
      var oldStage = stageFor(type, plant.growthPoints);
      plant.growthPoints = Math.min(type.matureAt, plant.growthPoints + points);
      plant.stage = stageFor(type, plant.growthPoints);
      if(plant.stage !== oldStage) plant.pendingAnimation = true;
      grew = true;
      return plant;
    });
    return {garden:next, granted:grew ? points : 0};
  }

  function acknowledgeAnimations(garden){
    var next = normalized(garden);
    next.plants.forEach(function(plant){ plant.pendingAnimation = false; });
    return next;
  }

  function lessonsRemaining(instance){
    var type = getType(instance && instance.typeId);
    if(!type) return 0;
    return Math.max(0, type.matureAt - (Number(instance.growthPoints) || 0));
  }

  root.LanternHomeGarden = Object.freeze({
    emptyGarden:emptyGarden,
    catalogue:catalogue,
    claimStarter:claimStarter,
    buy:buy,
    plant:plant,
    move:move,
    store:store,
    creditLesson:creditLesson,
    acknowledgeAnimations:acknowledgeAnimations,
    lessonsRemaining:lessonsRemaining
  });
})(typeof self !== "undefined" ? self : this);
