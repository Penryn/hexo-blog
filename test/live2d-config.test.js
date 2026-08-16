'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function assertDataOnly(value) {
  if (value === null) return;
  if (Array.isArray(value)) return value.forEach(assertDataOnly);
  if (typeof value === 'object') return Object.values(value).forEach(assertDataOnly);
  assert.ok(['string', 'number', 'boolean'].includes(typeof value));
  if (typeof value === 'string') {
    assert.doesNotMatch(value, /^(?:async\s+)?function\s*\(/);
    assert.doesNotMatch(value, /=>/);
  }
}

function loadRouteGenerator() {
  let generator;
  const hexo = {
    config: {},
    extend: {
      generator: {
        register(name, callback) {
          assert.equal(name, 'live2d_runtime_config');
          generator = callback;
        }
      }
    }
  };
  vm.runInNewContext(read('scripts/live2d-config-route.js'), { hexo });
  return {
    generate(config) {
      hexo.config = { OhMyLive2d: config };
      return generator();
    }
  };
}

test('clean build emits a data-only Live2D runtime config with a named message hook', () => {
  const generated = read('public/live2d-config.js');
  const context = { window: {} };
  vm.runInNewContext(generated, context);

  assert.equal(context.window.__oml2d_runtime_config.option.tips.idleTips.messageHook, 'hitokoto');
  assertDataOnly(context.window.__oml2d_runtime_config);
  assert.doesNotMatch(generated, /live2d:hitokoto:cache:v6/);
  assert.doesNotMatch(generated, /new Function/);
  assert.doesNotMatch(generated, /eval\s*\(/);
});

test('generated pages load the Hitokoto hook and registry before the Live2D loader', () => {
  const html = read('public/index.html');
  const sources = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => match[1]);
  const expectedOrder = [
    '/js/live2d-hitokoto.js',
    '/js/live2d-hook-registry.js',
    '/js/live2d-hooks.js',
    '/live2d-config.js',
    '/js/live2d-loader.js'
  ];

  assert.deepEqual(
    expectedOrder.map(source => sources.indexOf(source)),
    expectedOrder.map(source => sources.indexOf(source)).toSorted((a, b) => a - b)
  );
  for (const source of expectedOrder) {
    assert.notEqual(sources.indexOf(source), -1, `missing script ${source}`);
  }
});

test('the Live2D config route rejects non-data and executable-looking values', () => {
  const route = loadRouteGenerator();
  const invalidValues = [
    () => 'quote',
    Symbol('quote'),
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    'function () { return "quote"; }',
    'async function named() { return "quote"; }',
    'function* () { yield "quote"; }',
    'async function* named() { yield "quote"; }',
    '() => "quote"',
    'quote => quote',
    'async quote => quote',
    '[quote] => quote'
  ];

  for (const value of invalidValues) {
    assert.throws(
      () => route.generate({ option: { tips: { idleTips: { message: value } } } }),
      /data-only Live2D config/
    );
  }
});

test('the Live2D config route accepts ordinary user messages', () => {
  const route = loadRouteGenerator();
  const ordinaryMessages = [
    'A small function can make intent clearer.',
    'In documentation, use => when explaining arrow syntax.',
    '今天也要稳扎稳打，慢一点也没关系。'
  ];

  const output = route.generate({
    option: { tips: { idleTips: { fallbackMessages: ordinaryMessages } } }
  });
  const context = { window: {} };
  vm.runInNewContext(output.data, context);

  assert.deepEqual(
    Array.from(context.window.__oml2d_runtime_config.option.tips.idleTips.fallbackMessages),
    ordinaryMessages
  );
});
