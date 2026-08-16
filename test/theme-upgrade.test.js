const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const yamlScalarAtPath = (source, wantedPath) => {
  const stack = [];

  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^(\s*)([^:#][^:]*):(?:\s*(.*))?$/);
    if (!match) continue;

    const indent = match[1].length;
    const key = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    const value = (match[3] || '').trim();
    while (stack.length > 0 && stack.at(-1).indent >= indent) stack.pop();

    const currentPath = [...stack.map(entry => entry.key), key];
    if (currentPath.length === wantedPath.length
      && currentPath.every((part, index) => part === wantedPath[index])) {
      return value || null;
    }
    stack.push({ indent, key });
  }

  return undefined;
};

class FakeClassList {
  constructor(classes = []) {
    this.classes = new Set(classes);
  }

  add(name) {
    this.classes.add(name);
  }

  remove(name) {
    this.classes.delete(name);
  }

  contains(name) {
    return this.classes.has(name);
  }

  toggle(name, force) {
    if (force === true) {
      this.add(name);
      return true;
    }
    if (force === false) {
      this.remove(name);
      return false;
    }
    if (this.contains(name)) {
      this.remove(name);
      return false;
    }
    this.add(name);
    return true;
  }
}

class FakeElement {
  constructor(id, classes = []) {
    this.id = id;
    this.classList = new FakeClassList(classes);
    this.dataset = {};
    this.listeners = {};
    this.style = {};
    this.childrenBySelector = new Map();
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  querySelectorAll(selector) {
    return this.childrenBySelector.get(selector) || [];
  }

  querySelector() {
    return null;
  }
}

test('vendored Fluid target and retained local integrations are explicit', () => {
  const pkg = JSON.parse(read('themes/fluid/package.json'));
  const upgrade = read('docs/theme-upgrades.md');
  const scripts = read('themes/fluid/layout/_partials/scripts.ejs');
  const banner = read('themes/fluid/layout/_partials/header/banner.ejs');
  assert.equal(pkg.version, '1.9.9');
  assert.match(upgrade, /0f49caf/);
  assert.match(upgrade, /39f38de/);
  assert.match(scripts, /bootstrap-lite\.js/);
  assert.match(banner, /<h1 class="sr-only">/);
});

test('random banners remain disabled', () => {
  const config = read('themes/fluid/_config.yml');
  assert.equal(yamlScalarAtPath(config, ['banner', 'random_img']), 'false');
  assert.doesNotMatch(config, /^\s*random_banner:\s*true\s*$/m);
});

test('generated pages contain no OpenKounter configuration or runtime', () => {
  const config = read('themes/fluid/_config.yml');
  const home = read('public/index.html');
  const post = read('public/2026/08/09/ai-agent-workflow/index.html');

  assert.equal(yamlScalarAtPath(config, ['web_analytics', 'openkounter']), undefined);
  assert.equal(fs.existsSync(path.join(root, 'themes/fluid/source/js/openkounter.js')), false);
  assert.doesNotMatch(home, /openkounter/i);
  assert.doesNotMatch(post, /openkounter/i);
});

test('generated Waline comments use the upstream ESM client and retained server', () => {
  const comments = read('public/comments/index.html');

  assert.match(comments, /<script type="module">[\s\S]*import\('https:\/\/lib\.baomitu\.com\/waline\/3\.6\.0\/waline\.js'\)/);
  assert.match(comments, /"serverURL":"https:\/\/waline\.phlin\.cn\/"/);
  assert.doesNotMatch(comments, /qiuniu\.phlin\.cn\/static\/waline\.js/);
});

test('generated Live2D config retains the Qiniu model and degradation policy', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(read('public/live2d-config.js'), sandbox);
  const live2d = sandbox.window.__oml2d_runtime_config;

  assert.equal(live2d.option.models[0].path, 'https://qiuniu.phlin.cn/blog/Focalors.model3.json');
  assert.equal(live2d.degrade.disableOnReducedMotion, true);
  assert.equal(live2d.degrade.disableOnSaveData, true);
  assert.equal(live2d.degrade.startOnInteraction, true);
});

test('danmaku assets and configuration stay scoped to the comments page', () => {
  const comments = read('public/comments/index.html');
  const home = read('public/index.html');

  assert.match(comments, /window\.danmakuConfig\s*=/);
  assert.match(comments, /<script defer="" src="\/js\/comment\.js"><\/script>/);
  assert.match(comments, /<script defer="" src="\/js\/comments\.js"><\/script>/);
  assert.doesNotMatch(home, /window\.danmakuConfig\s*=/);
});

test('built mobile navigation opens the grid and locks body scrolling', () => {
  const navbar = new FakeElement('navbar', ['navbar-dark']);
  const toggler = new FakeElement('navbar-toggler-btn');
  const mobileMenu = new FakeElement('mobile-grid-menu');
  const icon = new FakeElement('menu-icon', ['animated-icon']);
  const cell = new FakeElement('menu-cell', ['mobile-grid-cell']);
  const body = new FakeElement('body');
  mobileMenu.childrenBySelector.set('.mobile-grid-cell, .mobile-grid-group-header', [cell]);

  const elements = new Map([
    ['navbar', navbar],
    ['navbar-toggler-btn', toggler],
    ['mobile-grid-menu', mobileMenu]
  ]);
  const document = {
    body,
    documentElement: { scrollTop: 0 },
    getElementById: id => elements.get(id) || null,
    querySelectorAll: selector => {
      if (selector === '#navbar .dropdown-menu') return [];
      if (selector === '.animated-icon') return [icon];
      return [];
    },
    addEventListener() {}
  };
  const window = {
    innerWidth: 390,
    pageYOffset: 0,
    addEventListener() {}
  };
  const sandbox = {
    console,
    document,
    window,
    HTMLElement: FakeElement,
    Fluid: { utils: { listenScroll: callback => callback() } },
    setTimeout() {}
  };
  vm.runInNewContext(read('public/js/events.js'), sandbox);
  sandbox.Fluid.events.registerNavbarEvent();
  toggler.listeners.click();

  assert.equal(mobileMenu.classList.contains('show'), true);
  assert.equal(body.classList.contains('mobile-menu-open'), true);
  assert.equal(navbar.classList.contains('top-nav-collapse'), true);
  assert.equal(icon.classList.contains('open'), true);
});

test('generated post wires the local Tocbot bundle to a real outline', () => {
  const post = read('public/2026/08/09/ai-agent-workflow/index.html');
  const headings = post.match(/<h[1-6]\b[^>]*id="[^"]+"/g) || [];

  assert.match(post, /<div class="toc-body" id="toc-body"><\/div>/);
  assert.match(post, /Fluid\.utils\.createScript\('\/lib\/tocbot\/4\.36\.4\/tocbot\.min\.js'/);
  assert.match(post, /window\.tocbot\.init\(tocConfig\)/);
  assert.match(post, /"toc":\{"enable":true,"expand_all":true/);
  assert.ok(headings.length > 1, `expected a post outline, found ${headings.length} heading`);
  assert.ok(fs.statSync(path.join(root, 'public/lib/tocbot/4.36.4/tocbot.min.js')).size > 0);
});

test('built Umami client uses the v2 API and visitors response', async () => {
  const calls = [];
  const pvContainer = { style: {} };
  const pv = {};
  const uvContainer = { style: {} };
  const uv = {};
  const elements = new Map([
    ['#umami-site-pv-container', pvContainer],
    ['#umami-site-pv', pv],
    ['#umami-site-uv-container', uvContainer],
    ['#umami-site-uv', uv]
  ]);
  const window = {
    CONFIG: {
      web_analytics: {
        umami: {
          website_id: 'website-id',
          api_server: 'https://umami.example',
          start_time: '2024-01-01',
          token: 'view-token'
        }
      }
    },
    location: { pathname: '/post/' }
  };
  const sandbox = {
    console,
    document: { querySelector: selector => elements.get(selector) || null },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ pageviews: { value: 21 }, visitors: { value: 8 } })
      };
    },
    URLSearchParams,
    window
  };
  vm.runInNewContext(read('public/js/umami-view.js'), sandbox);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /^https:\/\/umami\.example\/api\/websites\/website-id\/stats\?/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer view-token');
  assert.equal(pv.textContent, 21);
  assert.equal(uv.textContent, 8);
  assert.equal(pvContainer.style.display, 'inline');
  assert.equal(uvContainer.style.display, 'inline');
});
