(function (win) {
  'use strict';

  var hooks = win.live2dHooks || {};

  function hitokoto() {
    var root = win;
    var cacheKey = 'live2d:hitokoto:cache:v6';
    var lockKey = 'live2d:hitokoto:lock:v1';
    var inflightKey = '__live2d_hitokoto_inflight_v1';
    var cacheTtlMs = 10 * 60 * 1000;
    var staleTtlMs = 24 * 60 * 60 * 1000;
    var lockTtlMs = 15 * 1000;
    var waitForLockMs = 1800;
    var requestTimeoutMs = 3500;
    var backoffKey = 'live2d:hitokoto:backoff:v1';
    var backoffBaseMs = 30 * 1000;
    var backoffMaxMs = 30 * 60 * 1000;
    var backoffMaxFailCount = 8;
    var targetPoolSize = 4;
    var fallbackPool = [
      '今天也要稳扎稳打，慢一点也没关系。',
      '别急，先把手上的一个点做到可验证。',
      '复杂问题先拆小，持续迭代就会有进展。',
      '写代码前先想边界条件，能省很多返工。'
    ];
    var categories = ['a', 'b', 'c', 'd', 'e', 'f', 'h', 'i', 'k', 'l'];
    function now() {
      return Date.now();
    }
    function randomPick(arr, count) {
      var copied = arr.slice();
      var out = [];
      var take = Math.max(1, Math.min(count, copied.length));
      for (var i = 0; i < take; i++) {
        var idx = Math.floor(Math.random() * copied.length);
        out.push(copied.splice(idx, 1)[0]);
      }
      return out;
    }
    function randomFallback() {
      return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
    }
    function normalizeText(value) {
      return (typeof value === 'string') ? value.trim() : '';
    }
    function normalizeComparableText(value) {
      return normalizeText(value)
        .toLowerCase()
        .replace(/[\s\-_.·•,，。!！?？'"“”‘’`~:：;；()（）\[\]{}<>《》【】]/g, '');
    }
    function sameTextIgnoreCase(a, b) {
      if (!a || !b) return false;
      return normalizeComparableText(a) === normalizeComparableText(b);
    }
    function limitText(value, maxLen) {
      if (!value || value.length <= maxLen) return value;
      return value.slice(0, maxLen - 1) + '…';
    }
    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
    // 兼容历史缓存格式：去掉末尾的 “ · 类型”
    function stripLegacyTypeSuffix(value) {
      var text = normalizeText(value);
      if (!text) return '';
      text = text.replace(/(<br>——[^<]+?)\s·\s[^<·]+$/, '$1');
      text = text.replace(/\s·\s[^<·]+$/, '');
      return text;
    }
    function formatQuote(data) {
      var quote = normalizeText(data && data.hitokoto) || randomFallback();
      quote = limitText(quote, 88);
      var from = limitText(normalizeText(data && data.from), 20);
      var fromWho = limitText(normalizeText(data && data.from_who), 14);
      if (sameTextIgnoreCase(from, fromWho)) fromWho = '';
      var source = '';
      if (from) {
        source = '《' + from + '》';
        if (fromWho) source += '（' + fromWho + '）';
      } else if (fromWho) {
        source = fromWho;
      }
      var safeQuote = escapeHtml(quote);
      return source
        ? (safeQuote + '<br>—— ' + escapeHtml(source))
        : safeQuote;
    }
    function fetchJsonWithTimeout(url, timeoutMs) {
      if (typeof AbortController === 'function') {
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
        return fetch(url, { signal: controller.signal })
          .then(function (response) {
            clearTimeout(timer);
            return response;
          })
          .catch(function (error) {
            clearTimeout(timer);
            throw error;
          });
      }
      var timerId = 0;
      var timeoutPromise = new Promise(function (_, reject) {
        timerId = setTimeout(function () {
          reject(new Error('hitokoto request timeout'));
        }, timeoutMs);
      });
      return Promise.race([fetch(url), timeoutPromise]).then(function (response) {
        clearTimeout(timerId);
        return response;
      }, function (error) {
        clearTimeout(timerId);
        throw error;
      });
    }
    function fetchOne() {
      var selected = randomPick(categories, 2 + Math.floor(Math.random() * 2));
      var params = new URLSearchParams();
      for (var i = 0; i < selected.length; i++) {
        params.append('c', selected[i]);
      }
      params.set('min_length', '8');
      params.set('max_length', '80');
      return fetchJsonWithTimeout('https://v1.hitokoto.cn?' + params.toString(), requestTimeoutMs)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('hitokoto request failed: ' + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        return formatQuote(data);
      });
    }
    function readCache() {
      try {
        var raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        var cache = JSON.parse(raw);
        if (!cache || !Array.isArray(cache.pool) || !cache.pool.length) return null;
        if (!cache.ts || (now() - cache.ts) >= staleTtlMs) return null;
        var pool = [];
        for (var i = 0; i < cache.pool.length; i++) {
          var text = stripLegacyTypeSuffix(cache.pool[i]);
          if (!text) continue;
          if (pool.indexOf(text) !== -1) continue;
          pool.push(text);
        }
        if (!pool.length) return null;
        cache.pool = pool;
        if (typeof cache.idx !== 'number' || !isFinite(cache.idx)) cache.idx = 0;
        return cache;
      } catch (_) {
        return null;
      }
    }
    function writeCache(cache) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cache));
      } catch (_) {}
    }
    function readBackoff() {
      try {
        var raw = localStorage.getItem(backoffKey);
        if (!raw) return { failCount: 0, nextRetryAt: 0 };
        var state = JSON.parse(raw);
        if (!state || typeof state !== 'object') return { failCount: 0, nextRetryAt: 0 };
        var failCount = Number(state.failCount);
        if (!isFinite(failCount) || failCount < 0) failCount = 0;
        var nextRetryAt = Number(state.nextRetryAt);
        if (!isFinite(nextRetryAt) || nextRetryAt < 0) nextRetryAt = 0;
        return { failCount: Math.floor(failCount), nextRetryAt: Math.floor(nextRetryAt) };
      } catch (_) {
        return { failCount: 0, nextRetryAt: 0 };
      }
    }
    function writeBackoff(state) {
      try {
        localStorage.setItem(backoffKey, JSON.stringify(state));
      } catch (_) {}
    }
    function getBackoffState() {
      return readBackoff();
    }
    function inBackoffWindow(state) {
      return !!(state && state.nextRetryAt > now());
    }
    function markRefreshSuccess() {
      writeBackoff({ failCount: 0, nextRetryAt: 0 });
    }
    function markRefreshFailure() {
      var state = readBackoff();
      var failCount = state.failCount + 1;
      if (failCount > backoffMaxFailCount) failCount = backoffMaxFailCount;
      var delay = backoffBaseMs * Math.pow(2, failCount - 1);
      if (!isFinite(delay) || delay < backoffBaseMs) delay = backoffBaseMs;
      if (delay > backoffMaxMs) delay = backoffMaxMs;
      writeBackoff({
        failCount: failCount,
        nextRetryAt: now() + delay
      });
    }
    function nextFromCache(cache) {
      if (!cache || !Array.isArray(cache.pool) || !cache.pool.length) return '';
      var idx = cache.idx % cache.pool.length;
      if (idx < 0) idx = 0;
      var text = cache.pool[idx] || '';
      cache.idx = (idx + 1) % cache.pool.length;
      writeCache(cache);
      return text;
    }
    function readLock() {
      try {
        var raw = localStorage.getItem(lockKey);
        if (!raw) return null;
        var lock = JSON.parse(raw);
        if (!lock || typeof lock.id !== 'string' || typeof lock.expireAt !== 'number') return null;
        return lock;
      } catch (_) {
        return null;
      }
    }
    function createLockId() {
      return String(now()) + ':' + Math.random().toString(36).slice(2);
    }
    function tryAcquireLock(lockId) {
      try {
        var current = readLock();
        if (current && current.expireAt > now() && current.id !== lockId) return false;
        localStorage.setItem(lockKey, JSON.stringify({ id: lockId, expireAt: now() + lockTtlMs }));
        var verify = readLock();
        return !!(verify && verify.id === lockId);
      } catch (_) {
        return false;
      }
    }
    function releaseLock(lockId) {
      try {
        var current = readLock();
        if (current && current.id === lockId) {
          localStorage.removeItem(lockKey);
        }
      } catch (_) {}
    }
    function waitForCache(timeoutMs) {
      return new Promise(function (resolve) {
        var end = now() + timeoutMs;
        (function poll() {
          var cache = readCache();
          if (cache) return resolve(cache);
          if (now() >= end) return resolve(null);
          setTimeout(poll, 120);
        })();
      });
    }
    function buildPoolWithLock(lockId) {
      var tasks = [];
      for (var n = 0; n < targetPoolSize; n++) {
        tasks.push(fetchOne().catch(function () { return ''; }));
      }
      return Promise.all(tasks).then(function (response) {
        var pool = [];
        for (var i = 0; i < response.length; i++) {
          var text = response[i];
          if (!text || pool.indexOf(text) !== -1) continue;
          pool.push(text);
        }
        if (!pool.length) return null;
        var cache = { pool: pool, idx: 0, ts: now() };
        writeCache(cache);
        return cache;
      }).finally(function () {
        releaseLock(lockId);
      });
    }
    function refreshPool() {
      var backoff = getBackoffState();
      if (inBackoffWindow(backoff)) {
        return Promise.resolve(readCache());
      }
      if (root[inflightKey]) return root[inflightKey];
      var lockId = createLockId();
      if (!tryAcquireLock(lockId)) {
        return waitForCache(waitForLockMs).then(function (cache) {
          return cache || readCache();
        });
      }
      var task = buildPoolWithLock(lockId)
        .then(function (cache) {
          if (cache && cache.pool && cache.pool.length) {
            markRefreshSuccess();
            return cache;
          }
          markRefreshFailure();
          return null;
        })
        .catch(function (error) {
          console.error('[OhMyLive2D] idleTips refresh failed', error);
          markRefreshFailure();
          return null;
        });
      var wrapped = task.finally(function () {
        if (root[inflightKey] === wrapped) root[inflightKey] = null;
      });
      root[inflightKey] = wrapped;
      return wrapped;
    }
    function refreshInBackground() {
      refreshPool().catch(function () {});
    }
    var cached = readCache();
    if (cached) {
      var text = nextFromCache(cached) || randomFallback();
      var backoff = getBackoffState();
      if ((now() - cached.ts) >= cacheTtlMs && !inBackoffWindow(backoff)) {
        refreshInBackground();
      }
      return Promise.resolve(text);
    }
    return refreshPool()
      .then(function (cache) {
        var latest = cache || readCache();
        if (!latest) return randomFallback();
        return nextFromCache(latest) || randomFallback();
      })
      .catch(function (error) {
        console.error('[OhMyLive2D] idleTips request failed', error);
        return randomFallback();
      });
  }

  hooks.hitokoto = hitokoto;
  win.live2dHooks = hooks;
})(window);
