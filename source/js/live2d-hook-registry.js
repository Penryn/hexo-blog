(function (win) {
  'use strict';
  var allowlist = Object.freeze({ hitokoto: 'hitokoto' });
  win.Live2DHookRegistry = Object.freeze({
    resolveOptionHook: function (name) {
      var key = allowlist[name];
      var hooks = win.live2dHooks || {};
      return key && typeof hooks[key] === 'function' ? hooks[key] : null;
    }
  });
})(window);
