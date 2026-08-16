const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

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
  assert.doesNotMatch(config, /^\s*random_banner:\s*true\s*$/m);
});
