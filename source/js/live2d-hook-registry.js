(function (win) {
  'use strict';
  var allowlist = Object.create(null);
  allowlist.hitokoto = 'hitokoto';
  Object.freeze(allowlist);
  win.Live2DHookRegistry = Object.freeze({
    resolveOptionHook: function (name) {
      if (!Object.prototype.hasOwnProperty.call(allowlist, name)) return null;
      var key = allowlist[name];
      var hooks = win.live2dHooks || {};
      return key && typeof hooks[key] === 'function' ? hooks[key] : null;
    }
  });
})(window);
