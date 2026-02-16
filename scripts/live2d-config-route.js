'use strict';

function getLive2dConfig() {
  const cfg = (hexo.config && hexo.config.OhMyLive2d) || {};
  return (cfg && typeof cfg === 'object') ? cfg : {};
}

hexo.extend.generator.register('live2d_runtime_config', function() {
  const cfg = getLive2dConfig();
  const script = [
    '(function (win) {',
    '  "use strict";',
    '  win.__oml2d_runtime_config = ' + JSON.stringify(cfg) + ';',
    '})(window);',
    ''
  ].join('\n');

  return {
    path: 'live2d-config.js',
    data: script
  };
});
