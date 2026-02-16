(function (win) {
  'use strict';

  var hooks = win.live2dHooks || {};

  hooks.onReady = function (oml2d) {
    if (!oml2d || typeof oml2d.tipsMessage !== 'function') return;
    window.setTimeout(function () {
      try {
        oml2d.tipsMessage('hello world', 3000, 10);
      } catch (_) {
        // noop: keep hook failure isolated
      }
    }, 8000);
  };

  win.live2dHooks = hooks;
})(window);
