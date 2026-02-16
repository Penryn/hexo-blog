(function (win, doc) {
  'use strict';

  var hooks = win.live2dHooks || {};
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

  function applyEnabledState(enabled) {
    writeEnabledState(enabled);
    if (!enabled) clearStrategyTimers();
    if (typeof win.__setOhMyLive2DEnabled === 'function') {
      win.__setOhMyLive2DEnabled(enabled);
      return;
    }
    if (enabled && typeof win.__loadOhMyLive2D === 'function') win.__loadOhMyLive2D();
    if (!enabled && typeof win.__unloadOhMyLive2D === 'function') win.__unloadOhMyLive2D();
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

  win.addEventListener('storage', function (evt) {
    if (!evt || evt.key !== getStorageKey()) return;
    if (!readEnabledState()) clearStrategyTimers();
  });
})(window, document);
