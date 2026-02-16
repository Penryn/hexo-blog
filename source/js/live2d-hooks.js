(function (win, doc) {
  'use strict';

  var hooks = win.live2dHooks || {};
  var modelRotateTimer = null;
  var clothesRotateTimer = null;
  var currentOml2d = null;
  var currentStrategy = null;

  function getEnabledStorageKey() {
    return win.__oml2d_toggle_key || 'live2d:enabled';
  }

  function getStatusStorageKey() {
    return win.__oml2d_status_key || 'live2d:status';
  }

  function readEnabledState() {
    try {
      var raw = win.localStorage.getItem(getEnabledStorageKey());
      if (raw === null || raw === undefined || raw === '') return true;
      return !/^(0|false|off)$/i.test(String(raw).trim());
    } catch (_) {
      return true;
    }
  }

  function writeEnabledState(enabled) {
    try {
      win.localStorage.setItem(getEnabledStorageKey(), enabled ? '1' : '0');
    } catch (_) {}
  }

  function readDisplayStatus() {
    try {
      var raw = win.localStorage.getItem(getStatusStorageKey());
      if (raw === 'sleep' || raw === 'active') return raw;
    } catch (_) {}
    return 'active';
  }

  function writeDisplayStatus(status) {
    if (status !== 'sleep' && status !== 'active') return;
    try {
      win.localStorage.setItem(getStatusStorageKey(), status);
    } catch (_) {}
  }

  function ensureDisplayStatusInitialized() {
    try {
      var raw = win.localStorage.getItem(getStatusStorageKey());
      if (raw !== 'sleep' && raw !== 'active') {
        win.localStorage.setItem(getStatusStorageKey(), 'active');
      }
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

  function applyTipsContentReadableStyle() {
    var content = doc.getElementById('oml2d-tips-content');
    if (!content) return false;
    content.style.textAlign = 'left';
    content.style.whiteSpace = 'normal';
    content.style.wordBreak = 'normal';
    content.style.overflowWrap = 'break-word';
    content.style.lineHeight = '1.45';
    return true;
  }

  function ensureTipsContentReadableStyle(retries) {
    if (applyTipsContentReadableStyle()) return;
    if (retries <= 0) return;
    win.setTimeout(function () {
      ensureTipsContentReadableStyle(retries - 1);
    }, 120);
  }

  function bindTipsStyleSync(oml2d) {
    ensureTipsContentReadableStyle(30);
    if (typeof oml2d.onLoad === 'function') {
      oml2d.onLoad(function (status) {
        if (status === 'success') ensureTipsContentReadableStyle(20);
      });
    }
  }

  function applyEnabledState(enabled) {
    writeEnabledState(enabled);
    if (!enabled) writeDisplayStatus('sleep');
    if (enabled) writeDisplayStatus('active');
    if (!enabled) {
      pauseActivities();
    } else {
      resumeActivities();
    }
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
      clothesRotateIntervalMs: typeof cfg.clothesRotateIntervalMs === 'number' ? cfg.clothesRotateIntervalMs : 10 * 60 * 1000,
      pageTypeModelMap: (cfg.pageTypeModelMap && typeof cfg.pageTypeModelMap === 'object') ? cfg.pageTypeModelMap : {},
      useTimeFallback: cfg.useTimeFallback !== false
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

  function detectPageType() {
    var pathname = (win.location && win.location.pathname ? win.location.pathname : '/').toLowerCase();
    pathname = pathname.replace(/\/index\.html$/, '/');
    if (!pathname || pathname === '/') return 'home';
    if (pathname.indexOf('/archives') === 0) return 'archive';
    if (pathname.indexOf('/categories') === 0) return 'category';
    if (pathname.indexOf('/tags') === 0) return 'tag';
    if (pathname.indexOf('/about') === 0) return 'about';
    if (pathname.indexOf('/links') === 0) return 'links';
    if (pathname.indexOf('/comments') === 0) return 'comments';
    if (/^\/\d{4}\/\d{2}\/\d{2}\//.test(pathname)) return 'post';
    return 'page';
  }

  function findModelIndexByName(models, name) {
    if (!name) return -1;
    var target = String(name);
    for (var i = 0; i < models.length; i++) {
      if (models[i] && models[i].name === target) return i;
    }
    return -1;
  }

  function resolvePageModelTarget(strategy, modelCount) {
    var pageType = detectPageType();
    var map = strategy.pageTypeModelMap || {};
    if (Object.prototype.hasOwnProperty.call(map, pageType)) return map[pageType];
    // 兼容 archive/archives 写法
    if (pageType === 'archive' && Object.prototype.hasOwnProperty.call(map, 'archives')) return map.archives;
    if (!strategy.useTimeFallback) return null;
    return pickTimeSlotModelIndex(modelCount);
  }

  function applyPageBasedModel(oml2d, strategy) {
    var models = getModelOptions(oml2d);
    if (!strategy.enable || models.length <= 1) return;
    var currentIndex = typeof oml2d.modelIndex === 'number' ? oml2d.modelIndex : 0;
    var currentModel = models[currentIndex] || null;
    var target = resolvePageModelTarget(strategy, models.length);
    if (target === null || target === undefined) return;

    if (typeof target === 'string' && typeof oml2d.loadModelByName === 'function') {
      if (currentModel && currentModel.name === target) return;
      var targetNameIndex = findModelIndexByName(models, target);
      if (targetNameIndex === -1) return;
      oml2d.loadModelByName(target).then(function () {
        if (typeof oml2d.tipsMessage === 'function') {
          oml2d.tipsMessage('已按页面类型切换模型', 2200, 6);
        }
      }).catch(function () {});
      return;
    }

    if (typeof target !== 'number' || typeof oml2d.loadModelByIndex !== 'function') return;
    var normalizedIndex = Math.floor(target);
    if (!isFinite(normalizedIndex)) return;
    normalizedIndex = ((normalizedIndex % models.length) + models.length) % models.length;
    if (normalizedIndex === currentIndex) return;
    oml2d.loadModelByIndex(normalizedIndex).then(function () {
      if (typeof oml2d.tipsMessage === 'function') {
        oml2d.tipsMessage('已按页面类型切换模型', 2200, 6);
      }
    }).catch(function () {});
  }

  function setupModelRotateStrategy(oml2d, strategy) {
    if (!strategy.enable || strategy.modelRotateIntervalMs <= 0) return;
    if (typeof oml2d.loadRandomModel !== 'function') return;
    var models = getModelOptions(oml2d);
    if (models.length <= 1) return;
    modelRotateTimer = win.setInterval(function () {
      if (!readEnabledState() || readDisplayStatus() !== 'active' || doc.visibilityState === 'hidden') return;
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
        if (!readEnabledState() || readDisplayStatus() !== 'active' || doc.visibilityState === 'hidden') return;
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

  function pauseActivities() {
    clearStrategyTimers();
    if (!currentOml2d) return;
    if (typeof currentOml2d.stopTipsIdle === 'function') {
      try { currentOml2d.stopTipsIdle(); } catch (_) {}
    }
  }

  function resumeActivities() {
    if (!currentOml2d || !currentStrategy) return;
    if (!readEnabledState()) return;
    if (readDisplayStatus() !== 'active') return;
    if (doc.visibilityState === 'hidden') return;
    if (typeof currentOml2d.startTipsIdle === 'function') {
      try { currentOml2d.startTipsIdle(); } catch (_) {}
    }
    clearStrategyTimers();
    setupModelRotateStrategy(currentOml2d, currentStrategy);
    setupClothesRotateStrategy(currentOml2d, currentStrategy);
  }

  function bindStageStatusSync(oml2d) {
    if (typeof oml2d.onStageSlideOut === 'function') {
      oml2d.onStageSlideOut(function () {
        writeDisplayStatus('sleep');
        pauseActivities();
      });
    }
    if (typeof oml2d.onStageSlideIn === 'function') {
      oml2d.onStageSlideIn(function () {
        writeDisplayStatus('active');
        resumeActivities();
      });
    }
  }

  hooks.onReady = function (oml2d) {
    if (!oml2d) return;
    ensureDisplayStatusInitialized();
    currentOml2d = oml2d;
    currentStrategy = mergeStrategyConfig();
    bindStageStatusSync(oml2d);
    bindTipsStyleSync(oml2d);
    clearStrategyTimers();
    applyPageBasedModel(oml2d, currentStrategy);
    resumeActivities();
  };

  hooks.setEnabled = function (enabled) {
    applyEnabledState(!!enabled);
  };

  hooks.toggle = function () {
    applyEnabledState(!readEnabledState());
  };

  win.live2dHooks = hooks;

  doc.addEventListener('visibilitychange', function () {
    if (doc.visibilityState === 'hidden') {
      pauseActivities();
    } else {
      resumeActivities();
    }
  });

  win.addEventListener('storage', function (evt) {
    if (!evt) return;
    var key = evt.key || '';
    if (key === getEnabledStorageKey()) {
      if (!readEnabledState()) pauseActivities();
      else resumeActivities();
      return;
    }
    if (key === getStatusStorageKey()) {
      if (readDisplayStatus() === 'sleep') pauseActivities();
      else resumeActivities();
    }
  });
})(window, document);
