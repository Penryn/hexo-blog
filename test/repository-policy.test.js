const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('runtime and package manager are pinned for reproducible builds', () => {
  assert.equal(fs.readFileSync(path.join(root, '.node-version'), 'utf8').trim(), '24');
  assert.equal(pkg.engines.node, '24.x');
  assert.equal(pkg.packageManager, 'pnpm@10.29.3');
});

test('production build is clean and prebuild is read-only', () => {
  assert.equal(pkg.scripts.prebuild,
    'pnpm seo:obsidian:check && pnpm seo:frontmatter:check && pnpm seo:links:check');
  assert.equal(pkg.scripts.build, 'hexo clean && hexo generate');
  assert.equal(pkg.scripts.test, 'pnpm build && node --test');
});

test('direct dependency upgrade floor is retained', () => {
  assert.equal(pkg.dependencies.hexo, '^8.1.2');
  assert.equal(pkg.dependencies['hexo-robots'], '^1.0.4');
  assert.equal(pkg.dependencies['@adobe/css-tools'], '^4.5.0');
  assert.equal(pkg.dependencies['highlight.js'], '^11.12.0');
});

test('production transitive dependency floors exclude audited high advisories', () => {
  assert.deepEqual(pkg.pnpm.overrides, {
    'hexo-lightning-minify>sharp': '^0.35.0',
    'filelist>minimatch': '^5.1.8',
    'glob>minimatch': '^3.1.4',
    'minimatch@5>brace-expansion': '^2.1.4',
    'minimatch@3>brace-expansion': '^1.1.18',
    'feedsmith>fast-xml-parser': '^5.5.6',
    'cheerio>undici': '^6.27.0',
    'anymatch>picomatch': '^2.3.2',
    'readdirp>picomatch': '^2.3.2',
    'micromatch>picomatch': '^2.3.2',
    'jsdom>form-data': '^4.0.6',
    'jsdom>ws': '^8.21.0',
    'hexo-front-matter>js-yaml': '^4.3.1',
    'hexo>js-yaml': '^4.3.1'
  });
});
