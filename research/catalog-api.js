
  var items = DATA.items;
  var byId = {};
  items.forEach(function(item){ byId[item.id] = item; });

  function getItem(id){ return byId[id]; }

  function validateCatalog(){
    var errors = [];
    var warnings = [];
    var seen = {};
    items.forEach(function(item){
      if(!item.canonical || !item.reading || !item.meanings.length){
        errors.push("incomplete item: " + item.id);
      }
      if(seen[item.id]) errors.push("duplicate id: " + item.id);
      seen[item.id] = true;
    });
    var unreviewed = items.filter(function(item){ return !item.reviewed; }).length;
    if(unreviewed){
      // No native reviewer is named yet. This is a warning rather than an error
      // so the build is not blocked, but nothing may claim reviewed status.
      warnings.push(unreviewed + " items await native review");
    }
    return {errors:errors, warnings:warnings, excluded:DATA.excluded};
  }

  // Reports which ids are missing rather than a bare percentage, so a coverage
  // gap can be acted on instead of merely observed.
  function getCoverage(assignments){
    assignments = assignments || {};
    var counts = {unseen:0, seen:0, tested:0, mastered:0};
    var untestedIds = [];
    items.forEach(function(item){
      var stateName = assignments[item.id] || "unseen";
      if(counts[stateName] === undefined) counts[stateName] = 0;
      counts[stateName]++;
      if(stateName !== "tested" && stateName !== "mastered") untestedIds.push(item.id);
    });
    counts.total = items.length;
    counts.untestedIds = untestedIds;
    return counts;
  }

  function getPartition(key){
    return items.filter(function(item){ return item.partition === key; });
  }

  var API = {
    items: items,
    excluded: DATA.excluded,
    getItem: getItem,
    validateCatalog: validateCatalog,
    getCoverage: getCoverage,
    getPartition: getPartition
  };
