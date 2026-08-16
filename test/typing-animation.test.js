const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('typing animation uses one visible string and a readable loop cadence', () => {
  let captured;

  class TypedStub {
    constructor(selector, options) {
      captured = { selector, options, started: false };
    }

    stop() {}

    start() {
      captured.started = true;
    }
  }

  function HTMLElementStub() {}

  const context = {
    CONFIG: {
      typing: {
        backDelay: 3000,
        backSpeed: 50,
        cursorChar: '_',
        loop: true,
        startDelay: 500,
        typeSpeed: 85
      }
    },
    Fluid: {},
    HTMLElement: HTMLElementStub,
    document: {
      getElementById: () => ({ innerText: '望舒的尘歌壶' }),
      readyState: 'complete'
    },
    window: { Typed: TypedStub }
  };

  const pluginPath = path.join(
    __dirname,
    '..',
    'themes',
    'fluid',
    'source',
    'js',
    'plugins.js'
  );
  vm.runInNewContext(fs.readFileSync(pluginPath, 'utf8'), context);
  context.Fluid.plugins.typing('望舒的尘歌壶');

  assert.equal(captured.selector, '#subtitle');
  assert.deepEqual(Array.from(captured.options.strings), ['望舒的尘歌壶']);
  assert.equal(captured.options.startDelay, 500);
  assert.equal(captured.options.typeSpeed, 85);
  assert.equal(captured.options.backDelay, 3000);
  assert.equal(captured.options.backSpeed, 50);
  assert.equal(captured.options.cursorChar, '_');
  assert.equal(captured.options.loop, true);
  assert.equal(captured.started, true);
});

test('typing animation leaves the subtitle readable when reduced motion is preferred', () => {
  let typedInstances = 0;
  const subtitle = { innerText: '望舒的尘歌壶' };

  class TypedStub {
    constructor() {
      typedInstances += 1;
    }

    stop() {}

    start() {}
  }

  function HTMLElementStub() {}

  const context = {
    CONFIG: {
      typing: {
        backDelay: 3000,
        backSpeed: 50,
        cursorChar: '_',
        loop: true,
        startDelay: 500,
        typeSpeed: 85
      }
    },
    Fluid: {},
    HTMLElement: HTMLElementStub,
    document: {
      getElementById: () => subtitle,
      readyState: 'complete'
    },
    window: {
      Typed: TypedStub,
      matchMedia: query => ({ matches: query === '(prefers-reduced-motion: reduce)' })
    }
  };

  const pluginPath = path.join(
    __dirname,
    '..',
    'themes',
    'fluid',
    'source',
    'js',
    'plugins.js'
  );
  vm.runInNewContext(fs.readFileSync(pluginPath, 'utf8'), context);
  context.Fluid.plugins.typing('望舒的尘歌壶');

  assert.equal(typedInstances, 0);
  assert.equal(subtitle.innerText, '望舒的尘歌壶');
});
