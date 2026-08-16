const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
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

test('reduced-motion home typing keeps its generated fallback and skips the slogan API', () => {
  const home = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  const subtitleMatch = home.match(/<span id="subtitle" data-typed-text="([^"]+)">([^<]*)<\/span>/);

  assert.ok(subtitleMatch);
  const [, typedText, staticText] = subtitleMatch;
  assert.equal(staticText, typedText);

  const typedTemplatePath = path.join(
    __dirname,
    '..',
    'themes',
    'fluid',
    'layout',
    '_partials',
    'plugins',
    'typed.ejs'
  );
  const ejs = createRequire(require.resolve('hexo-renderer-ejs'))('ejs');
  const rendered = ejs.render(fs.readFileSync(typedTemplatePath, 'utf8'), {
    in_scope: () => true,
    is_home: () => true,
    js_ex: () => '',
    page: {},
    theme: {
      fun_features: { typing: { enable: true, scope: ['home'] } },
      index: {
        slogan: {
          api: {
            enable: true,
            headers: {},
            keys: 'hitokoto',
            method: 'GET',
            url: 'https://example.test/slogan'
          }
        }
      },
      static_prefix: { typed: 'https://example.test/typed/' }
    }
  }, { filename: typedTemplatePath });
  const initializer = rendered.match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];

  let typedInstances = 0;
  let fetchCalls = 0;
  const subtitle = {
    getAttribute: name => name === 'data-typed-text' ? typedText : null,
    innerText: staticText
  };

  class TypedStub {
    constructor() {
      typedInstances += 1;
    }

    start() {}

    stop() {}
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
    fetch: () => {
      fetchCalls += 1;
      return Promise.resolve();
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
  vm.runInNewContext(initializer, context);

  assert.equal(typedInstances, 0);
  assert.equal(fetchCalls, 0);
  assert.equal(subtitle.innerText, typedText);
});
