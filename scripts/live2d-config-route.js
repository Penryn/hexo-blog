'use strict';

function getLive2dConfig() {
  const cfg = (hexo.config && hexo.config.OhMyLive2d) || {};
  return (cfg && typeof cfg === 'object') ? cfg : {};
}

function looksLikeExecutableString(value) {
  const source = value.trim();
  if (/^(?:async\s+)?function(?:\s*\*\s*(?:[A-Za-z_$][\w$]*)?|\s+[A-Za-z_$][\w$]*)?\s*\(/.test(source)) return true;
  if (/^(?:async\s+)?(?:\([^)]*\)|\[[^\]]*\])\s*=>/.test(source)) return true;
  return /^(?:async\s+)?[A-Za-z_$][\w$]*\s*=>/.test(source);
}

function assertDataOnly(value, valuePath, ancestors) {
  if (value === null) return;
  const valueType = typeof value;
  if (valueType === 'string') {
    if (looksLikeExecutableString(value)) {
      throw new TypeError('data-only Live2D config rejects executable-looking string at ' + valuePath);
    }
    return;
  }
  if (valueType === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('data-only Live2D config rejects non-finite number at ' + valuePath);
    }
    return;
  }
  if (valueType === 'boolean') return;
  if (valueType !== 'object') {
    throw new TypeError('data-only Live2D config rejects ' + valueType + ' at ' + valuePath);
  }
  const isArray = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (isArray) {
    if (prototype !== Array.prototype) {
      throw new TypeError('data-only Live2D config rejects custom array prototype at ' + valuePath);
    }
  } else if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('data-only Live2D config rejects non-plain object at ' + valuePath);
  }
  if ('toJSON' in value) {
    throw new TypeError('data-only Live2D config rejects custom serialization at ' + valuePath);
  }
  if (ancestors.indexOf(value) !== -1) {
    throw new TypeError('data-only Live2D config rejects circular value at ' + valuePath);
  }
  ancestors.push(value);
  if (isArray) {
    for (let i = 0; i < value.length; i += 1) {
      assertDataOnly(value[i], valuePath + '[' + i + ']', ancestors);
    }
  } else {
    for (const key of Object.getOwnPropertyNames(value)) {
      assertDataOnly(value[key], valuePath + '.' + key, ancestors);
    }
  }
  ancestors.pop();
}

hexo.extend.generator.register('live2d_runtime_config', function() {
  const cfg = getLive2dConfig();
  assertDataOnly(cfg, 'OhMyLive2d', []);
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
