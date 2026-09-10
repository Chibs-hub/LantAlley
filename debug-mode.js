(function(root){
  "use strict";
  // Set this to false to remove Debug Mode from the release.
  var available = true;
  root.LanternDebug = {
    available:available,
    enabled:available && /[?&]debug=1(&|$)/.test(root.location.search)
  };
})(window);
