'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const fallbackMessages = [
  '今天也要稳扎稳打，慢一点也没关系。',
  '别急，先把手上的一个点做到可验证。',
  '复杂问题先拆小，持续迭代就会有进展。',
  '写代码前先想边界条件，能省很多返工。'
];
const quietConsole = { error() {}, log() {}, warn() {} };

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

function createFakeTimers() {
  let nextId = 1;
  const pending = new Map();
  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      pending.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      pending.delete(id);
    }
  };
}

function createHitokotoHarness(fetchImpl, now = 2_000_000_000_000) {
  const localStorage = createMemoryStorage();
  const timers = createFakeTimers();
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => 0;
  class FakeDate extends Date {
    static now() {
      return now;
    }
  }
  const window = { localStorage };
  const context = {
    Date: FakeDate,
    Math: deterministicMath,
    Promise,
    URLSearchParams,
    clearTimeout: timers.clearTimeout,
    console: quietConsole,
    fetch: fetchImpl,
    localStorage,
    setTimeout: timers.setTimeout,
    window
  };
  vm.runInNewContext(read('source/js/live2d-hitokoto.js'), context);
  return { hook: window.live2dHooks.hitokoto, localStorage, now, window };
}

function createLoaderHarness({ hookName = 'hitokoto', hook, reducedMotion = false, saveData = false } = {}) {
  const localStorage = createMemoryStorage();
  const timers = createFakeTimers();
  const elements = new Map();
  const bodyClasses = new Set();
  const body = {
    classList: {
      add(name) { bodyClasses.add(name); },
      remove(name) { bodyClasses.delete(name); }
    }
  };
  let capturedOptions = null;
  const shownMessages = [];
  const document = {
    body,
    head: {
      appendChild(node) {
        if (node.id) elements.set(node.id, node);
        if (node.tagName === 'SCRIPT' && typeof node.onload === 'function') node.onload();
      }
    },
    readyState: 'loading',
    visibilityState: 'visible',
    addEventListener() {},
    removeEventListener() {},
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        id: '',
        style: {},
        textContent: '',
        remove() {}
      };
    }
  };
  const navigator = {
    connection: { effectiveType: '4g', saveData },
    deviceMemory: 8,
    hardwareConcurrency: 8,
    userAgent: 'Live2D VM test'
  };
  const window = {
    innerWidth: 1280,
    localStorage,
    navigator,
    addEventListener() {},
    removeEventListener() {},
    cancelIdleCallback() {},
    clearTimeout: timers.clearTimeout,
    matchMedia(query) {
      return { matches: reducedMotion && query === '(prefers-reduced-motion: reduce)' };
    },
    requestIdleCallback(callback) {
      callback();
      return 1;
    },
    setTimeout: timers.setTimeout
  };
  const context = { console: quietConsole, document, navigator, Promise, window };
  vm.runInNewContext(read('public/live2d-config.js'), context);
  const idleTips = window.__oml2d_runtime_config.option.tips.idleTips;
  delete idleTips.message;
  if (hookName === null) delete idleTips.messageHook;
  else idleTips.messageHook = hookName;
  idleTips.fallbackMessages = fallbackMessages.slice();
  window.live2dHooks = { hitokoto: hook || (() => Promise.resolve('VM quote')) };
  vm.runInNewContext(read('source/js/live2d-hook-registry.js'), context);
  window.OML2D = {
    loadOml2d(options) {
      capturedOptions = options;
      return {
        options,
        onLoad(callback) { callback('success'); },
        tipsMessage(message) { shownMessages.push(message); }
      };
    }
  };
  vm.runInNewContext(read('source/js/live2d-loader.js'), context);
  window.__loadOhMyLive2D();
  return {
    get options() { return capturedOptions; },
    get instance() { return window.__oml2d_instance; },
    shownMessages,
    window
  };
}

test('the fixed registry resolves only the literal Hitokoto hook', () => {
  const hitokoto = () => Promise.resolve('quote');
  const window = { live2dHooks: { hitokoto } };
  vm.runInNewContext(read('source/js/live2d-hook-registry.js'), { window });
  const registry = window.Live2DHookRegistry;

  assert.equal(registry.resolveOptionHook('hitokoto'), hitokoto);
  assert.equal(registry.resolveOptionHook('window.alert'), null);
  assert.equal(registry.resolveOptionHook('constructor.constructor'), null);
  assert.equal(registry.resolveOptionHook('missing'), null);
});

test('the Hitokoto hook escapes formatted API content and reuses a fresh cache', async () => {
  let fetchCount = 0;
  const response = {
    ok: true,
    status: 200,
    async json() {
      return {
        hitokoto: '<hello & "friends">',
        from: 'Book & Co',
        from_who: "Alice 'A'"
      };
    }
  };
  const harness = createHitokotoHarness(async () => {
    fetchCount += 1;
    return response;
  });

  const first = await harness.hook();
  const second = await harness.hook();

  assert.equal(
    first,
    '&lt;hello &amp; &quot;friends&quot;&gt;<br>—— 《Book &amp; Co》（Alice &#39;A&#39;）'
  );
  assert.equal(second, first);
  assert.equal(fetchCount, 4);
});

test('the Hitokoto hook returns a literal fallback and records future backoff after failure', async () => {
  const harness = createHitokotoHarness(async () => {
    throw new Error('network unavailable');
  });

  const message = await harness.hook();
  const backoff = JSON.parse(harness.localStorage.getItem('live2d:hitokoto:backoff:v1'));

  assert.ok(fallbackMessages.includes(message));
  assert.equal(backoff.failCount, 1);
  assert.ok(backoff.nextRetryAt > harness.now);
});

test('the loader resolves the named hook and manual next quote uses it', async () => {
  const hook = () => Promise.resolve('Named hook quote');
  const harness = createLoaderHarness({ hook });

  assert.equal(harness.options.tips.idleTips.message, hook);
  assert.equal(Object.hasOwn(harness.options.tips.idleTips, 'messageHook'), false);
  const menuItems = harness.options.menus.items([]);
  const nextQuote = menuItems.find(item => item.id === 'NextQuote');
  nextQuote.onClick(harness.instance);
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(harness.shownMessages, ['Named hook quote']);
});

test('the loader falls back to static messages for unknown or missing hook names', () => {
  for (const hookName of ['window.alert', null]) {
    const harness = createLoaderHarness({ hookName });
    assert.deepEqual(Array.from(harness.options.tips.idleTips.message), fallbackMessages);
    assert.equal(Object.hasOwn(harness.options.tips.idleTips, 'messageHook'), false);
  }
});

test('the loader keeps reduced-motion and save-data degradation', () => {
  assert.equal(createLoaderHarness({ reducedMotion: true }).options, null);
  assert.equal(createLoaderHarness({ saveData: true }).options, null);
});
