const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',').map(parseScalar);
  }
  return trimmed;
}

function parseYaml(yaml) {
  const lines = yaml.split(/\r?\n/)
    .filter(line => line.trim() && !line.trimStart().startsWith('#'))
    .map(line => ({
      indent: line.length - line.trimStart().length,
      text: line.trim()
    }));
  let index = 0;

  function parseBlock(indent) {
    const sequence = lines[index]?.indent === indent && lines[index].text.startsWith('- ');
    const result = sequence ? [] : {};
    while (index < lines.length && lines[index].indent === indent) {
      const line = lines[index];
      if (sequence !== line.text.startsWith('- ')) break;
      const entry = sequence ? line.text.slice(2) : line.text;
      const separator = entry.indexOf(':');
      assert.notEqual(separator, -1, `expected a YAML mapping entry: ${entry}`);
      const key = entry.slice(0, separator).trim();
      const value = entry.slice(separator + 1).trim();
      index += 1;
      const hasChild = index < lines.length && (
        lines[index].indent > indent ||
        (!value && lines[index].indent === indent && lines[index].text.startsWith('- '))
      );
      const child = hasChild ? parseBlock(lines[index].indent) : undefined;
      if (sequence) {
        const item = { [key]: value ? parseScalar(value) : (child ?? null) };
        if (value && child) Object.assign(item, child);
        result.push(item);
      } else {
        result[key] = value ? parseScalar(value) : (child ?? null);
      }
    }
    return result;
  }

  return parseBlock(0);
}

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

test('continuous verification runs the complete read-only build gate', () => {
  const workflow = parseYaml(fs.readFileSync(path.join(root, '.github/workflows/verify.yml'), 'utf8'));

  assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.equal(workflow.permissions.contents, 'read');

  const job = workflow.jobs.verify;
  assert.equal(job['runs-on'], 'ubuntu-latest');
  const steps = job.steps;
  const stepWith = (action) => steps.find(step => step.uses === action);
  assert.ok(stepWith('actions/checkout@v4'));
  assert.equal(stepWith('pnpm/action-setup@v4').with.version, '10.29.3');
  assert.equal(stepWith('actions/setup-node@v4').with['node-version'], '24');
  assert.equal(stepWith('actions/setup-node@v4').with.cache, 'pnpm');

  const commands = steps.filter(step => step.run).map(step => step.run);
  assert.deepEqual(commands, [
    'pnpm install --frozen-lockfile',
    'pnpm seo:obsidian:check',
    'pnpm seo:frontmatter:check',
    'pnpm seo:links:check',
    'pnpm test',
    'pnpm build',
    'git diff --exit-code -- source/_posts',
    'pnpm audit:prod'
  ]);
});

test('Dependabot checks pnpm dependencies weekly with a low pull request limit', () => {
  const dependabot = parseYaml(fs.readFileSync(path.join(root, '.github/dependabot.yml'), 'utf8'));
  const update = dependabot.updates[0];

  assert.equal(update['package-ecosystem'], 'pnpm');
  assert.equal(update.directory, '/');
  assert.equal(update.schedule.interval, 'weekly');
  assert.equal(update['open-pull-requests-limit'], '5');
});
