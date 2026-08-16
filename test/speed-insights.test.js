'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function resolveData(route) {
  return typeof route.data === 'function' ? route.data() : route.data;
}

function loadSpeedInsightsRoute() {
  let generator;
  const hexo = {
    extend: {
      generator: {
        register(name, callback) {
          assert.equal(name, 'speed_insights_vendor');
          generator = callback;
        }
      }
    }
  };
  const routePath = path.join(root, 'scripts', 'speed-insights-route.js');
  vm.runInNewContext(read('scripts/speed-insights-route.js'), {
    __dirname: path.dirname(routePath),
    hexo,
    require: require
  }, { filename: routePath });
  return generator;
}

test('Speed Insights route publishes the installed browser module', () => {
  const generated = loadSpeedInsightsRoute()();
  const installedModule = fs.readFileSync(
    path.join(path.dirname(require.resolve('@vercel/speed-insights/package.json')), 'dist', 'index.mjs'),
    'utf8'
  );

  assert.equal(generated.path, 'scripts/vendor/speed-insights.mjs');
  assert.match(resolveData(generated), /\binjectSpeedInsights\b/);
  assert.equal(resolveData(generated), installedModule);
});

test('built site boots Speed Insights from its local vendor module after idle loading', () => {
  childProcess.execFileSync('pnpm', ['build'], {
    cwd: root,
    stdio: 'pipe'
  });

  const html = read('public/index.html');
  const bootstrap = read('public/scripts/speed-insights.js');
  const vendorModule = read('public/scripts/vendor/speed-insights.mjs');

  assert.match(html, /requestIdleCallback\(loadSpeedInsights, \{ timeout: 2000 \}\)/);
  assert.match(html, /s\.src = '\/scripts\/speed-insights\.js'/);
  assert.match(bootstrap, /from\s*["']\/scripts\/vendor\/speed-insights\.mjs["']/);
  assert.doesNotMatch(bootstrap, /https?:\/\/|unpkg\.com|jsdelivr\.net/);
  assert.doesNotMatch(vendorModule, /(?:from\s+|import\s*\()['"]https?:\/\//);
});
