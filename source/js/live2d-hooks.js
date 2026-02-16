(function (win, doc) {
  'use strict';

  var hooks = win.live2dHooks || {};
  var toggleId = 'live2d-toggle-btn';
  var toggleStyleId = 'live2d-toggle-style';
  var modelRotateTimer = null;
  var clothesRotateTimer = null;

  function getStorageKey() {
    return win.__oml2d_toggle_key || 'live2d:enabled';
  }

  function readEnabledState() {
    try {
      var raw = win.localStorage.getItem(getStorageKey());
      if (raw === null || raw === undefined || raw === '') return true;
      return !/^(0|false|off)$/i.test(String(raw).trim());
    } catch (_) {
      return true;
    }
  }

  function writeEnabledState(enabled) {
    try {
      win.localStorage.setItem(getStorageKey(), enabled ? '1' : '0');
    } catch (_) {}
  }

  function clearStrategyTimers() {
    if (modelRotateTimer) {
      win.clearInterval(modelRotateTimer);
      modelRotateTimer = null;
    }
    if (clothesRotateTimer) {
      win.clearInterval(clothesRotateTimer);
      clothesRotateTimer = null;
    }
  }

  function toggleLabel(enabled) {
    return enabled ? 'Live2D: ON' : 'Live2D: OFF';
  }

  function updateToggleButtonState() {
    var btn = doc.getElementById(toggleId);
    if (!btn) return;
    var enabled = readEnabledState();
    btn.textContent = toggleLabel(enabled);
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  }

  function applyEnabledState(enabled) {
    writeEnabledState(enabled);
    updateToggleButtonState();
    if (!enabled) clearStrategyTimers();
    if (typeof win.__setOhMyLive2DEnabled === 'function') {
      win.__setOhMyLive2DEnabled(enabled);
      return;
    }
    if (enabled && typeof win.__loadOhMyLive2D === 'function') win.__loadOhMyLive2D();
    if (!enabled && typeof win.__unloadOhMyLive2D === 'function') win.__unloadOhMyLive2D();
  }

  function ensureToggleStyle() {
    if (doc.getElementById(toggleStyleId)) return;
    var style = doc.createElement('style');
    style.id = toggleStyleId;
    style.textContent = [
      '#' + toggleId + ' {',
      '  position: fixed;',
      '  left: 18px;',
      '  bottom: 18px;',
      '  z-index: 2147483646;',
      '  border: 0;',
      '  border-radius: 999px;',
      '  padding: 8px 12px;',
      '  font-size: 12px;',
      '  line-height: 1;',
      '  cursor: pointer;',
      '  color: #fff;',
      '  background: rgba(47, 65, 84, 0.85);',
      '  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);',
      '}',
      '#' + toggleId + ':hover {',
      '  background: rgba(47, 65, 84, 1);',
      '}'
    ].join('\n');
    doc.head.appendChild(style);
  }

  function ensureToggleButton() {
    if (!doc.body) return;
    ensureToggleStyle();
    if (doc.getElementById(toggleId)) {
      updateToggleButtonState();
      return;
    }
    var btn = doc.createElement('button');
    btn.id = toggleId;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle Live2D');
    btn.addEventListener('click', function () {
      applyEnabledState(!readEnabledState());
    });
    doc.body.appendChild(btn);
    updateToggleButtonState();
  }

  function mergeStrategyConfig() {
    var cfg = win.__oml2d_strategy || {};
    return {
      enable: cfg.enable !== false,
      modelRotateIntervalMs: typeof cfg.modelRotateIntervalMs === 'number' ? cfg.modelRotateIntervalMs : 30 * 60 * 1000,
      clothesRotateIntervalMs: typeof cfg.clothesRotateIntervalMs === 'number' ? cfg.clothesRotateIntervalMs : 10 * 60 * 1000
    };
  }

  function getModelOptions(oml2d) {
    if (!oml2d || !oml2d.options || !Array.isArray(oml2d.options.models)) return [];
    return oml2d.options.models;
  }

  function pickTimeSlotModelIndex(modelCount) {
    var hour = new Date().getHours();
    var slot = hour < 8 ? 0 : (hour < 16 ? 1 : 2);
    return slot % modelCount;
  }

  function applyTimeBasedModel(oml2d, strategy) {
    var models = getModelOptions(oml2d);
    if (!strategy.enable || models.length <= 1 || typeof oml2d.loadModelByIndex !== 'function') return;
    var currentIndex = typeof oml2d.modelIndex === 'number' ? oml2d.modelIndex : 0;
    var targetIndex = pickTimeSlotModelIndex(models.length);
    if (targetIndex === currentIndex) return;
    oml2d.loadModelByIndex(targetIndex).then(function () {
      if (typeof oml2d.tipsMessage === 'function') {
        oml2d.tipsMessage('已根据当前时段切换模型', 2200, 6);
      }
    }).catch(function () {});
  }

  function setupModelRotateStrategy(oml2d, strategy) {
    if (!strategy.enable || strategy.modelRotateIntervalMs <= 0) return;
    if (typeof oml2d.loadRandomModel !== 'function') return;
    var models = getModelOptions(oml2d);
    if (models.length <= 1) return;
    modelRotateTimer = win.setInterval(function () {
      if (!readEnabledState() || doc.visibilityState === 'hidden') return;
      oml2d.loadRandomModel().catch(function () {});
    }, strategy.modelRotateIntervalMs);
  }

  function setupClothesRotateStrategy(oml2d, strategy) {
    if (!strategy.enable || strategy.clothesRotateIntervalMs <= 0) return;
    if (typeof oml2d.loadNextModelClothes !== 'function') return;
    function resetByCurrentModel() {
      if (clothesRotateTimer) {
        win.clearInterval(clothesRotateTimer);
        clothesRotateTimer = null;
      }
      var models = getModelOptions(oml2d);
      var idx = typeof oml2d.modelIndex === 'number' ? oml2d.modelIndex : 0;
      var model = models[idx];
      var hasClothes = !!(model && Array.isArray(model.path) && model.path.length > 1);
      if (!hasClothes) return;
      clothesRotateTimer = win.setInterval(function () {
        if (!readEnabledState() || doc.visibilityState === 'hidden') return;
        oml2d.loadNextModelClothes().catch(function () {});
      }, strategy.clothesRotateIntervalMs);
    }
    resetByCurrentModel();
    if (typeof oml2d.onLoad === 'function') {
      oml2d.onLoad(function (status) {
        if (status === 'success') resetByCurrentModel();
      });
    }
  }

  hooks.onReady = function (oml2d) {
    if (!oml2d) return;
    var strategy = mergeStrategyConfig();
    window.setTimeout(function () {
      try {
        if (typeof oml2d.tipsMessage === 'function') {
          oml2d.tipsMessage('hello world', 3000, 10);
        }
      } catch (_) {}
    }, 8000);
    clearStrategyTimers();
    applyTimeBasedModel(oml2d, strategy);
    setupModelRotateStrategy(oml2d, strategy);
    setupClothesRotateStrategy(oml2d, strategy);
  };

  hooks.setEnabled = function (enabled) {
    applyEnabledState(!!enabled);
  };

  hooks.toggle = function () {
    applyEnabledState(!readEnabledState());
  };

  win.live2dHooks = hooks;

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', ensureToggleButton, { once: true });
  } else {
    ensureToggleButton();
  }
  win.addEventListener('storage', function (evt) {
    if (!evt || evt.key !== getStorageKey()) return;
    updateToggleButtonState();
    if (!readEnabledState()) clearStrategyTimers();
  });
})(window, document);
