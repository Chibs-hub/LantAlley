(function(root){
  var config = root.LanternTelemetryConfig || {};
  var projectKey = typeof config.projectKey === "string" ? config.projectKey.trim() : "";
  var apiHost = typeof config.apiHost === "string" && config.apiHost
    ? config.apiHost : "https://us.i.posthog.com";
  var preferenceKey = "lanternAlley.telemetry.enabled";
  var allowedEvents = {
    app_opened:1, new_player_selected:1, entrance_started:1,
    entrance_completed:1, inn_training_started:1, inn_training_completed:1,
    episode_started:1, episode_completed:1, reward_claimed:1,
    home_visited:1, feedback_submitted:1, progress_reset:1,
    storage_failed:1, app_error:1
  };
  var commonProperties = {
    build:1, screen:1, location:1, section:1, question_id:1, device_class:1
  };
  var eventProperties = {
    feedback_submitted:{category:1, details:1},
    episode_started:{episode_id:1},
    episode_completed:{episode_id:1},
    reward_claimed:{reward_id:1},
    app_error:{message:1, source:1}
  };
  var enabled = projectKey !== "" && readPreference() !== "off";
  var contextProvider = function(){ return {}; };
  var provider = null;
  var queued = [];
  var failed = false;

  function readPreference(){
    try{ return root.localStorage ? root.localStorage.getItem(preferenceKey) : null; }
    catch(e){ return null; }
  }

  function writePreference(value){
    try{
      if(root.localStorage) root.localStorage.setItem(preferenceKey, value);
    }catch(e){}
  }

  function providerOptions(){
    return {
      api_host:apiHost,
      persistence:"localStorage",
      cross_subdomain_cookie:false,
      autocapture:false,
      capture_pageview:false,
      capture_pageleave:false,
      capture_dead_clicks:false,
      capture_exceptions:false,
      capture_heatmaps:false,
      capture_performance:false,
      disable_surveys:true,
      disable_session_recording:true
    };
  }

  function startProvider(client){
    provider = client;
    try{
      if(typeof provider.init === "function") provider.init(projectKey, providerOptions());
      flush();
    }catch(e){
      failed = true;
      queued = [];
    }
  }

  function loadProvider(){
    if(!enabled || !projectKey || failed) return;
    if(root.posthog && typeof root.posthog.capture === "function"){
      startProvider(root.posthog);
      return;
    }
    if(!root.document || !root.document.createElement || !root.document.head) return;
    var stub = root.posthog || [];
    if(typeof stub.init !== "function"){
      stub._i = stub._i || [];
      stub.init = function(key, options){ stub._i.push([key, options]); };
    }
    root.posthog = stub;
    startProvider(stub);
    var script = root.document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = apiHost.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
    script.onload = function(){
      provider = root.posthog;
      if(!provider || typeof provider.capture !== "function"){
        failed = true;
        queued = [];
        return;
      }
      flush();
    };
    script.onerror = function(){
      failed = true;
      queued = [];
    };
    root.document.head.appendChild(script);
  }

  function sanitize(name, properties){
    var clean = {};
    var source = properties && typeof properties === "object" ? properties : {};
    var allowed = eventProperties[name] || {};
    var key;
    for(key in source){
      if(commonProperties[key] || allowed[key]) clean[key] = source[key];
    }
    return clean;
  }

  function mergedProperties(name, properties){
    var context = {};
    try{ context = contextProvider() || {}; }catch(e){ context = {}; }
    var merged = {};
    var key;
    for(key in context) merged[key] = context[key];
    for(key in properties) merged[key] = properties[key];
    return sanitize(name, merged);
  }

  function send(event){
    if(!provider || typeof provider.capture !== "function"){
      if(queued.length < 20) queued.push(event);
      return;
    }
    try{ provider.capture(event.name, event.properties); }
    catch(e){}
  }

  function flush(){
    while(queued.length && provider && typeof provider.capture === "function") send(queued.shift());
  }

  function track(name, properties){
    if(!enabled || !allowedEvents[name] || failed) return;
    send({name:name, properties:mergedProperties(name, properties || {})});
  }

  function setEnabled(value){
    enabled = !!value && projectKey !== "";
    writePreference(enabled ? "on" : "off");
    if(provider){
      try{
        if(enabled && typeof provider.opt_in_capturing === "function") provider.opt_in_capturing();
        if(!enabled && typeof provider.opt_out_capturing === "function") provider.opt_out_capturing();
      }catch(e){}
    }
    if(enabled) loadProvider();
  }

  function sourceName(value){
    return String(value || "").split("?")[0].split("#")[0].split("/").pop() || "";
  }

  function reportError(error, source, context){
    var message = error && error.message ? error.message : error;
    var properties = context && typeof context === "object" ? context : {};
    properties.message = String(message || "Unknown error").slice(0, 240);
    properties.source = sourceName(source);
    track("app_error", properties);
  }

  root.LanternTelemetry = {
    track:track,
    setEnabled:setEnabled,
    isConfigured:function(){ return projectKey !== ""; },
    isEnabled:function(){ return enabled; },
    setContext:function(next){ contextProvider = typeof next === "function" ? next : function(){ return {}; }; },
    reportError:reportError
  };
  loadProvider();
})(typeof window !== "undefined" ? window : self);
