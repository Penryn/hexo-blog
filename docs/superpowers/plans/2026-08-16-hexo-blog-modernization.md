# Hexo Blog Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Hexo blog and customized Fluid theme while preserving URLs, appearance, analytics, comments, danmaku, and the Qiniu-hosted Live2D experience.

**Architecture:** Treat Fluid 1.9.8 as the merge base, the vendored theme as the customized branch, and Fluid 1.9.9 as upstream. Keep project-specific browser behavior in small scripts under `source/js`, generate only data from Hexo scripts, and verify user-visible contracts against a clean `public` build with Node's built-in test runner.

**Tech Stack:** Hexo 8.1.2, Fluid 1.9.9, Node.js 24 LTS, pnpm 10.29.3, EJS, Stylus, browser JavaScript, `node:test`, GitHub Actions, Vercel.

## Global Constraints

- Preserve the existing site URL and permalink scheme.
- Preserve the current visual design, Umami, Waline, danmaku, and intentional Live2D behavior.
- Keep `https://qiuniu.phlin.cn/blog/Focalors.model3.json` as the production Live2D model.
- Remove `source/live2d` and ensure a clean build does not publish `/live2d`.
- Use Node.js 24 LTS and pnpm 10.29.3 locally, in CI, and on Vercel.
- Keep Fluid customizations while adopting upstream 1.9.9 fixes; random banners stay disabled.
- Production and CI builds must not rewrite source Markdown.
- Do not enforce Content Security Policy in this change.
- A Sharp 0.35 override ships only if install, image processing, and full-build verification pass.
- Each implementation task follows red-green-refactor and ends in its own commit.

---

## File Map

- `package.json`: runtime versions, dependency versions, read-only build lifecycle, and verification commands.
- `pnpm-lock.yaml`: reproducible dependency graph and any verified Sharp override.
- `.node-version`: Node 24 declaration for local and hosting tooling.
- `docs/theme-upgrades.md`: Fluid merge base, target revision, retained customizations, and future upgrade procedure.
- `themes/fluid/**`: vendored Fluid 1.9.9 code with current project customizations reapplied.
- `scripts/live2d-config-route.js`: emits the data-only `/live2d-config.js` route.
- `source/js/live2d-hook-registry.js`: resolves a fixed allowlist of runtime hook identifiers.
- `source/js/live2d-hitokoto.js`: Hitokoto cache, backoff, formatting, fetch, and fallback behavior.
- `source/js/live2d-loader.js`: converts data-only hook identifiers into allowlisted functions before starting Oh My Live2D.
- `themes/fluid/layout/_partials/scripts.ejs`: layout-aware custom script loading and Live2D script order.
- `themes/fluid/layout/_partials/plugins/typed.ejs`: reduced-motion guard for the typing effect.
- `themes/fluid/layout/{about,archive,categories,tags,category,tag}.ejs`: one meaningful H1 per generated index page.
- `scripts/speed-insights-route.js`: copies the installed Vercel Speed Insights browser module to a local generated route.
- `source/scripts/speed-insights.js`: imports the local generated module and calls `injectSpeedInsights()`.
- `themes/fluid/layout/layout.ejs`: removes crash-title behavior and retains deferred Speed Insights loading.
- `vercel.json`: existing cache policies plus safe response headers.
- `.github/workflows/verify.yml`: frozen install, checks, tests, clean generation, and production audit.
- `.github/dependabot.yml`: weekly, low-noise dependency update schedule.
- `tools/check-production-audit.js`: rejects every unapproved high/critical production advisory.
- `test/*.test.js`: behavior tests for runtime hooks, generated routes, page loading, heading structure, and repository policy.

---

### Task 1: Reproducible Runtime, Dependencies, and Read-Only Builds

**Files:**
- Create: `.node-version`
- Create: `test/repository-policy.test.js`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: the three existing `seo:*:check` commands.
- Produces: `pnpm test`, `pnpm verify`, and a `build` command that cleans before generating.

- [ ] **Step 1: Write the failing repository policy test**

Create `test/repository-policy.test.js` with literal requirements and execute the actual package scripts used by automation:

```js
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
```

- [ ] **Step 2: Run the policy test and verify the expected failure**

Run: `node --test test/repository-policy.test.js`

Expected: FAIL because `.node-version` and `engines.node` are absent, Hexo is 8.1.1, and `prebuild` invokes mutating commands.

- [ ] **Step 3: Apply the runtime and build-script changes**

Set `.node-version` to `24`. In `package.json`, add `"engines": { "node": "24.x" }`, change `prebuild` to the three check commands, change `build` to `hexo clean && hexo generate`, and add:

```json
"test": "pnpm build && node --test",
"verify": "pnpm test"
```

Update the four direct dependency ranges to the literals asserted by the test. Run:

```bash
pnpm update hexo@8.1.2 hexo-robots@1.0.4 @adobe/css-tools@4.5.0 highlight.js@11.12.0
```

- [ ] **Step 4: Evaluate the narrow Sharp override**

Run `pnpm audit --prod` and inspect the `hexo-lightning-minify -> sharp` path. Add this only for the compatibility trial:

```json
"pnpm": {
  "overrides": {
    "hexo-lightning-minify>sharp": "^0.35.0"
  }
}
```

Then run `pnpm install`, `pnpm exec hexo clean`, and `pnpm exec hexo generate`. Confirm generated JPG/PNG/WebP files can be opened and `pnpm audit --prod` has no high-severity advisory. If install, native loading, conversion, or generation fails, remove only this override, refresh the lockfile, and record the exact advisory in `docs/theme-upgrades.md` during Task 2.

- [ ] **Step 5: Run tests and the existing SEO checks**

Run:

```bash
pnpm test
pnpm seo:obsidian:check
pnpm seo:frontmatter:check
pnpm seo:links:check
pnpm build
```

Expected: all commands PASS and `git diff --exit-code -- source/_posts` exits 0 after the build.

- [ ] **Step 6: Commit the runtime baseline**

```bash
git add .node-version package.json pnpm-lock.yaml test/repository-policy.test.js
git commit -m "build: modernize Hexo runtime baseline"
```

---

### Task 2: Merge Fluid 1.9.9 Without Losing Local Behavior

**Files:**
- Create: `docs/theme-upgrades.md`
- Modify: `themes/fluid/README.md`
- Modify: `themes/fluid/README_en.md`
- Modify: `themes/fluid/_config.yml`
- Modify: `themes/fluid/languages/{de,en,eo,es,ja,ru,zh-CN,zh-HK,zh-TW}.yml`
- Modify: `themes/fluid/layout/_partials/comments/{cusdis,disqus,waline}.ejs`
- Modify: `themes/fluid/layout/_partials/footer/statistics.ejs`
- Modify: `themes/fluid/layout/_partials/header/{banner,navigation}.ejs`
- Modify: `themes/fluid/layout/_partials/plugins/{analytics,typed}.ejs`
- Modify: `themes/fluid/layout/_partials/post/{copyright,meta-top,toc}.ejs`
- Modify: `themes/fluid/layout/index.ejs`
- Modify: `themes/fluid/package.json`
- Modify: `themes/fluid/scripts/events/index.js`
- Modify: `themes/fluid/scripts/events/lib/{footnote,random-banner}.js`
- Modify: `themes/fluid/scripts/filters/post-filter.js`
- Modify: `themes/fluid/scripts/helpers/wordcount.js`
- Modify: `themes/fluid/scripts/tags/{fold,note}.js`
- Modify: `themes/fluid/source/css/_pages/_base/_widget/{header,toc}.styl`
- Modify: `themes/fluid/source/css/_pages/_base/{base,keyframes}.styl`
- Modify: `themes/fluid/source/js/{color-schema,events,umami-view,utils}.js`
- Test: `test/theme-upgrade.test.js`

**Interfaces:**
- Consumes: upstream Fluid base `0f49caf` (1.9.8) and target `39f38de` (1.9.9).
- Produces: vendored theme version 1.9.9 with project navigation, home H1, Bootstrap-lite, Tocbot fallback, Umami, Waline, and animation policies intact.

- [ ] **Step 1: Write the failing theme contract test**

Create `test/theme-upgrade.test.js`:

```js
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
```

- [ ] **Step 2: Run the theme test and verify the expected failure**

Run: `node --test test/theme-upgrade.test.js`

Expected: FAIL because the vendored package still reports 1.9.8 and `docs/theme-upgrades.md` does not exist.

- [ ] **Step 3: Apply non-overlapping upstream 1.9.9 changes**

Compare each listed file against base `0f49caf` and target `39f38de`. Apply upstream-only hunks with `apply_patch`, including the language, comment provider, statistics, analytics, copyright, metadata, footnote, word-count, fold/note, color-schema, CSS, lazy-load, and mobile navigation corrections. Add `random-banner.js` only as upstream source compatibility; leave its configuration disabled and do not add the sample random images or OpenKounter runtime because this site does not enable those features.

- [ ] **Step 4: Resolve the nine overlapping files manually**

For `_config.yml`, `banner.ejs`, `navigation.ejs`, `typed.ejs`, `toc.ejs`, `package.json`, `events.js`, `umami-view.js`, and `utils.js`, compare base/current/target side by side. Preserve current home-page H1, local Tocbot 4.36.4 fallback, Bootstrap-lite entry, navigation labels, animation degradation rules, and custom analytics settings. Integrate upstream 1.9.9 mobile navigation, TOC, Umami parameter, and event fixes. Adopt the upstream Waline ESM template in `layout/_partials/comments/waline.ejs`.

- [ ] **Step 5: Record the merge contract**

Create `docs/theme-upgrades.md` with these literal facts:

```markdown
# Fluid Theme Upgrades

- Merge base: Fluid 1.9.8, commit `0f49caf`
- Current upstream target: Fluid 1.9.9, commit `39f38de`
- Strategy: compare base, this vendored theme, and target; apply upstream fixes file by file.
- Retained customizations: accessible home H1, Bootstrap-lite, Tocbot 4.36.4 fallback, scoped animation degradation, navigation, Umami, Waline, danmaku, and Live2D integration.
- Deliberately disabled upstream options: random banners and OpenKounter.
```

Append the Sharp advisory and failed compatibility condition here only if Task 1's override was rejected.

- [ ] **Step 6: Run theme and build regressions**

Run:

```bash
pnpm test
pnpm build
pnpm seo:obsidian:check
pnpm seo:frontmatter:check
pnpm seo:links:check
```

Expected: PASS. Inspect generated home, the AI Agent post, `/about/`, and a page with Waline. Confirm navigation opens on a narrow viewport, Tocbot renders the post outline, the home H1 stays screen-reader-only, and Umami/Waline scripts are present.

- [ ] **Step 7: Commit the theme merge**

```bash
git add docs/theme-upgrades.md themes/fluid test/theme-upgrade.test.js
git commit -m "feat(theme): merge Fluid 1.9.9 fixes"
```

---

### Task 3: Replace Executable Live2D Configuration With Named Hooks

**Files:**
- Create: `source/js/live2d-hook-registry.js`
- Create: `source/js/live2d-hitokoto.js`
- Create: `test/live2d-config.test.js`
- Create: `test/live2d-hooks.test.js`
- Modify: `_config.yml`
- Modify: `themes/fluid/_config.yml`
- Modify: `source/js/live2d-loader.js`
- Modify: `scripts/live2d-config-route.js`

**Interfaces:**
- Consumes: `_config.yml` field `option.tips.idleTips.messageHook: hitokoto`.
- Produces: `window.Live2DHookRegistry.resolveOptionHook(name): Function|null` and `window.live2dHooks.hitokoto(): Promise<string>`.

- [ ] **Step 1: Write the failing generated-config test**

In `test/live2d-config.test.js`, execute the actual clean-build artifact `public/live2d-config.js` in a VM, recursively validate its value types, and reject strings containing executable function source:

```js
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

assert.equal(context.window.__oml2d_runtime_config.option.tips.idleTips.messageHook, 'hitokoto');
assertDataOnly(context.window.__oml2d_runtime_config);
```

Also assert the generated text does not include the current YAML function-body marker `live2d:hitokoto:cache:v6` and does not contain `new Function` or `eval(`.

- [ ] **Step 2: Write the failing hook registry tests**

In `test/live2d-hooks.test.js`, execute `source/js/live2d-hook-registry.js` in a VM whose `window.live2dHooks.hitokoto` is a literal stub. Assert:

```js
assert.equal(typeof registry.resolveOptionHook('hitokoto'), 'function');
assert.equal(registry.resolveOptionHook('window.alert'), null);
assert.equal(registry.resolveOptionHook('constructor.constructor'), null);
assert.equal(registry.resolveOptionHook('missing'), null);
```

Execute `source/js/live2d-hitokoto.js` with in-memory `localStorage`, a deterministic `fetch`, and fake timers. Verify successful formatting escapes HTML, a failed fetch returns one of the four literal fallback messages, a fresh cache avoids another network request, and a failure writes a future `nextRetryAt`.

- [ ] **Step 3: Run both tests and verify the expected failure**

Run: `pnpm build && node --test test/live2d-config.test.js test/live2d-hooks.test.js`

Expected: FAIL because the registry and Hitokoto scripts do not exist and current YAML embeds function source.

- [ ] **Step 4: Extract the Hitokoto implementation**

Move the entire current `idleTips.message` function body from `_config.yml` into a named `hitokoto` function in `source/js/live2d-hitokoto.js`; remove only the environment-detection wrapper and use the injected `win` object as `root`. Preserve its cache pool, stale-while-revalidate, cross-tab lock, exponential backoff, timeout, HTML escaping, and four fallback strings. Publish exactly one hook with these final assignments:

```js
(function (win) {
  'use strict';
  var hooks = win.live2dHooks || {};
  hooks.hitokoto = hitokoto;
  win.live2dHooks = hooks;
})(window);
```

The moved function must preserve the existing cache keys, 10-minute fresh TTL, 24-hour stale TTL, 30-second-to-30-minute backoff, 3.5-second request timeout, and escaped quote/source formatting.

- [ ] **Step 5: Implement the fixed hook registry**

In `source/js/live2d-hook-registry.js`, hard-code the only accepted identifier:

```js
(function (win) {
  'use strict';
  var allowlist = Object.freeze({ hitokoto: 'hitokoto' });
  win.Live2DHookRegistry = Object.freeze({
    resolveOptionHook: function (name) {
      var key = allowlist[name];
      var hooks = win.live2dHooks || {};
      return key && typeof hooks[key] === 'function' ? hooks[key] : null;
    }
  });
})(window);
```

Add `/js/live2d-hitokoto.js`, `/js/live2d-hook-registry.js`, and the existing `/js/live2d-hooks.js` to the theme custom script list in that order.

- [ ] **Step 6: Make the loader consume data-only hooks**

In `scripts/live2d-config-route.js`, add a recursive data validator that rejects functions, symbols, undefined values, non-finite numbers, and strings beginning with function/arrow syntax before serialization. Replace `looksLikeFunctionSource`, `reviveFunctionFromString`, and `normalizeOptionFunctions` in `source/js/live2d-loader.js` with a normalizer that reads `messageHook`, resolves it through `window.Live2DHookRegistry`, assigns the returned function to `idleTips.message`, deletes `messageHook` before passing options to the SDK, and falls back to `idleTips.fallbackMessages` on unknown or missing hooks. No branch may call `eval`, `Function`, or `new Function`.

Change `_config.yml` to:

```yaml
idleTips:
  interval: 60000
  messageHook: hitokoto
  fallbackMessages:
    - 今天也要稳扎稳打，慢一点也没关系。
    - 别急，先把手上的一个点做到可验证。
    - 复杂问题先拆小，持续迭代就会有进展。
    - 写代码前先想边界条件，能省很多返工。
  wordTheDay: false
```

- [ ] **Step 7: Run Live2D tests and a clean build**

Run:

```bash
node --test test/live2d-config.test.js test/live2d-hooks.test.js
pnpm build
node --check public/js/live2d-loader.js
node --check public/js/live2d-hitokoto.js
```

Expected: PASS. Execute `public/live2d-config.js` in a VM and confirm it contains `messageHook: 'hitokoto'`; open a desktop page and confirm a manual “下一条文案” action still returns a quote or static fallback.

- [ ] **Step 8: Commit the Live2D security change**

```bash
git add _config.yml themes/fluid/_config.yml scripts/live2d-config-route.js source/js/live2d-hook-registry.js source/js/live2d-hitokoto.js source/js/live2d-loader.js test/live2d-config.test.js test/live2d-hooks.test.js
git commit -m "refactor: make Live2D config data-only"
```

---

### Task 4: Scope Page Scripts and Correct Heading/Reduced-Motion Behavior

**Files:**
- Create: `test/generated-pages.test.js`
- Modify: `_config.fluid.yml`
- Modify: `themes/fluid/_config.yml`
- Modify: `themes/fluid/layout/_partials/scripts.ejs`
- Modify: `themes/fluid/layout/_partials/plugins/typed.ejs`
- Modify: `themes/fluid/source/js/plugins.js`
- Modify: `themes/fluid/layout/{about,archive,categories,tags,category,tag}.ejs`
- Modify: `test/typing-animation.test.js`
- Modify: Mermaid post front matter only if an existing Mermaid post lacks `mermaid: true`.

**Interfaces:**
- Consumes: Hexo helpers `is_post()` and `page.mermaid`.
- Produces: post-only reading progress, opt-in Mermaid, no typing animation under reduced motion, and one H1 per tested page.

- [ ] **Step 1: Add the failing reduced-motion case**

Extend `test/typing-animation.test.js` with a VM context where `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true. Invoke `Fluid.plugins.typing('望舒的尘歌壶')` and assert no `TypedStub` instance is constructed and the subtitle retains readable static text.

- [ ] **Step 2: Add failing generated-page integration tests**

Create `test/generated-pages.test.js` that reads clean-build HTML from `public`. Count headings with `/<h1(?:\s[^>]*)?>/gi`, extract script `src` attributes into arrays, and assert:

```js
assert.equal(h1Count(home), 1);
assert.equal(h1Count(post), 1);
assert.equal(h1Count(about), 1);
assert.equal(h1Count(archives), 1);
assert.equal(h1Count(categories), 1);
assert.equal(h1Count(tags), 1);
assert.equal(scriptSources(home).some(src => src.includes('reading-progress.js')), false);
assert.equal(scriptSources(post).some(src => src.includes('reading-progress.js')), true);
assert.equal(scriptSources(home).some(src => /mermaid(?:\.min)?\.js/.test(src)), false);
assert.equal(scriptSources(mermaidPost).some(src => /mermaid(?:\.min)?\.js/.test(src)), true);
```

Use `public/2026/08/09/ai-agent-workflow/index.html` as the Mermaid fixture and select an ordinary generated post with no `mermaid: true` as the negative fixture.

- [ ] **Step 3: Run the tests and verify the expected failures**

Run: `pnpm build && node --test test/typing-animation.test.js test/generated-pages.test.js`

Expected: FAIL because reading progress is global, several index layouts have no H1, and typing starts under reduced motion.

- [ ] **Step 4: Scope reading progress and Mermaid**

Remove `/js/reading-progress.js` from the global `custom_js` list. In `_partials/scripts.ejs`, add it only inside `if (is_post())`. Change `_config.fluid.yml` to `post.mermaid.specific: true`. Search `source/_posts` for `{% mermaid %}` and fenced Mermaid blocks; every matching post must have `mermaid: true` in front matter. Keep the known AI Agent post flagged. Trial Mermaid 11.16.0 by changing `static_prefix.mermaid` to its versioned browser distribution, rebuilding, and checking the existing AI Agent flowchart. Retain 11.16.0 only if it exposes the API expected by Fluid 1.9.9 and renders without browser errors; otherwise restore the current 8.14.0 prefix and record the incompatibility in `docs/theme-upgrades.md`.

- [ ] **Step 5: Respect reduced motion**

Before constructing `window.Typed` in `Fluid.plugins.typing`, return early when `matchMedia('(prefers-reduced-motion: reduce)').matches` and leave the subtitle text visible. Keep the EJS initialization guard so the remote slogan request is also skipped when reduced motion is active.

- [ ] **Step 6: Add meaningful page headings**

Render one H1 using each page's existing `page.title`: visible `about-name` styling for About and a shared screen-reader-only heading before archive/category/tag lists when a visible heading would change the design. Do not add another H1 to home or posts.

- [ ] **Step 7: Verify page behavior**

Run:

```bash
pnpm build
node --test test/typing-animation.test.js test/generated-pages.test.js
pnpm seo:frontmatter:check
```

Expected: PASS. Confirm ordinary posts contain no Mermaid script and the AI Agent post still renders its flowchart.

- [ ] **Step 8: Commit scoped loading and accessibility**

```bash
git add _config.fluid.yml themes/fluid/_config.yml themes/fluid/layout themes/fluid/source/js/plugins.js source/_posts test/generated-pages.test.js test/typing-animation.test.js
git commit -m "perf: scope blog scripts by page"
```

---

### Task 5: Serve Vercel Speed Insights From Installed Dependencies

**Files:**
- Create: `scripts/speed-insights-route.js`
- Create: `test/speed-insights.test.js`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `source/scripts/speed-insights.js`

**Interfaces:**
- Consumes: installed file `node_modules/@vercel/speed-insights/dist/index.mjs` from `@vercel/speed-insights@^2.0.0`.
- Produces: generated `/scripts/vendor/speed-insights.mjs` and local bootstrap `/scripts/speed-insights.js`.

- [ ] **Step 1: Write the failing route test**

Create `test/speed-insights.test.js`. Load `scripts/speed-insights-route.js` with a fake generator registry, invoke the generator, resolve route data to text, and assert the result contains the package's `injectSpeedInsights` export. Build the site and assert `public/scripts/speed-insights.js` imports `/scripts/vendor/speed-insights.mjs` and contains no `http://`, `https://`, `unpkg.com`, or `jsdelivr.net` import.

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node --test test/speed-insights.test.js`

Expected: FAIL because the dependency and local vendor route do not exist.

- [ ] **Step 3: Install and publish the browser module**

Run `pnpm add @vercel/speed-insights@^2.0.0`. In `scripts/speed-insights-route.js`, resolve the package root from its package manifest, read `dist/index.mjs`, and register a generator result at `scripts/vendor/speed-insights.mjs`. Throw a build-stopping error that names the missing file if the installed package layout is incompatible.

Change the bootstrap to:

```js
import { injectSpeedInsights } from '/scripts/vendor/speed-insights.mjs';
injectSpeedInsights();
```

- [ ] **Step 4: Run route and build checks**

Run:

```bash
node --test test/speed-insights.test.js
pnpm build
node --check public/scripts/vendor/speed-insights.mjs
```

Expected: PASS. The generated HTML still defers `/scripts/speed-insights.js`, and that bootstrap has no remote executable import.

- [ ] **Step 5: Commit local Speed Insights**

```bash
git add package.json pnpm-lock.yaml scripts/speed-insights-route.js source/scripts/speed-insights.js test/speed-insights.test.js
git commit -m "perf: serve Speed Insights locally"
```

---

### Task 6: Remove Dead Assets and Add Safe Response Headers

**Files:**
- Delete: `source/live2d/`
- Delete: `themes/fluid/source/js/crash_cheat.js`
- Modify: `themes/fluid/layout/layout.ejs`
- Modify: `themes/fluid/layout/_partials/footer/beian.ejs`
- Modify: `vercel.json`
- Create: `docs/security.md`
- Create: `test/deployment-contract.test.js`

**Interfaces:**
- Consumes: clean-build guarantee from Task 1.
- Produces: no `/live2d` output, stable page title/favicon behavior, HTTPS filing links, and three global response headers while retaining cache rules.

- [ ] **Step 1: Write the failing deployment contract test**

Create `test/deployment-contract.test.js` that parses `vercel.json`, builds a map of all headers applying to `/(.*)`, and asserts literal values:

```js
assert.equal(headers['X-Content-Type-Options'], 'nosniff');
assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
assert.equal(headers['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
```

The test must also confirm all three existing `Cache-Control` values remain present, `public/live2d` does not exist after a clean build, generated HTML does not load `crash_cheat.js`, and the generated filing link uses `https://beian.miit.gov.cn/`.

- [ ] **Step 2: Run the deployment test and verify the expected failure**

Run: `pnpm build && node --test test/deployment-contract.test.js`

Expected: FAIL because the global security headers are absent and the crash script is still emitted.

- [ ] **Step 3: Remove dead and disruptive assets**

Delete the user-approved `source/live2d` directory. Remove the `crash_cheat.js` include from `layout.ejs` and delete its source file. Change the MIIT link to HTTPS; leave the public-security filing URL unchanged if that authority still redirects from HTTP and HTTPS is not available.

- [ ] **Step 4: Add global headers without changing caches**

Prepend a `/(.*)` header rule containing:

```json
[
  { "key": "X-Content-Type-Options", "value": "nosniff" },
  { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
  { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
]
```

Keep the existing HTML, feed/search, and immutable static cache rules byte-for-byte equivalent.

- [ ] **Step 5: Document the CSP decision**

Create `docs/security.md` explaining that enforced CSP is outside this change and report-only CSP is omitted because Fluid still emits inline boot/config scripts, Waline and analytics load third-party resources, and no reporting endpoint is configured. State that Live2D no longer needs `unsafe-eval`, so a future nonce/hash migration can start without that exception.

- [ ] **Step 6: Verify clean output and headers**

Run:

```bash
pnpm build
node --test test/deployment-contract.test.js
du -sh public
find public -maxdepth 1 -type d -name live2d
```

Expected: PASS; `find` prints nothing and generated output shrinks by roughly the previous local model size.

- [ ] **Step 7: Commit asset and deployment hardening**

```bash
git add source/live2d themes/fluid/source/js/crash_cheat.js themes/fluid/layout/layout.ejs themes/fluid/layout/_partials/footer/beian.ejs vercel.json docs/security.md test/deployment-contract.test.js
git commit -m "chore: remove dead assets and harden headers"
```

---

### Task 7: Add Continuous Verification and Reduce Dependency Noise

**Files:**
- Create: `.github/workflows/verify.yml`
- Create: `tools/check-production-audit.js`
- Modify: `.github/dependabot.yml`
- Modify: `package.json`
- Modify: `test/repository-policy.test.js`

**Interfaces:**
- Consumes: `pnpm test`, the three SEO checks, and clean `pnpm build`.
- Produces: identical verification on pull requests and pushes to `main`.

- [ ] **Step 1: Extend the failing repository policy test**

Read `.github/workflows/verify.yml` and `.github/dependabot.yml` in `test/repository-policy.test.js`. Assert the workflow covers `pull_request` and pushes to `main`, uses Node `24`, activates pnpm `10.29.3`, runs `pnpm install --frozen-lockfile`, the three SEO checks, `pnpm test`, `pnpm build`, `git diff --exit-code -- source/_posts`, and `pnpm audit:prod`. Assert Dependabot uses `weekly` and `open-pull-requests-limit: 5`.

- [ ] **Step 2: Run the policy test and verify the expected failure**

Run: `node --test test/repository-policy.test.js`

Expected: FAIL because the verification workflow is absent and Dependabot is daily with a limit of 20.

- [ ] **Step 3: Add the verification workflow**

Create `.github/workflows/verify.yml` with read-only `contents` permission, checkout, `pnpm/action-setup@v4` version `10.29.3`, `actions/setup-node@v4` Node `24` plus pnpm cache, frozen install, all checks, tests, clean build, source-diff guard, and `pnpm audit:prod`. Do not add deploy permissions or secrets.

- [ ] **Step 4: Make Dependabot weekly and low-noise**

Change only:

```yaml
schedule:
  interval: weekly
open-pull-requests-limit: 5
```

- [ ] **Step 5: Add the narrow production-audit gate**

Create `tools/check-production-audit.js` using `spawnSync('pnpm', ['audit', '--prod', '--json'])`. Parse `stdout`, collect advisories whose `severity` is `high` or `critical`, subtract numeric IDs from `package.json.auditAllowlist`, print every unexpected advisory with ID/module/title, and exit 1 when the unexpected list is non-empty. Add:

```js
const { spawnSync } = require('node:child_process');
const pkg = require('../package.json');

const result = spawnSync('pnpm', ['audit', '--prod', '--json'], {
  encoding: 'utf8',
  maxBuffer: 4 * 1024 * 1024
});
if (result.error) throw result.error;

let report;
try {
  report = JSON.parse(result.stdout);
} catch (error) {
  process.stderr.write(result.stderr || result.stdout);
  throw new Error(`Unable to parse pnpm audit JSON: ${error.message}`);
}

const allowed = new Set((pkg.auditAllowlist || []).map(Number));
const severe = Object.values(report.advisories || {}).filter(advisory =>
  advisory.severity === 'high' || advisory.severity === 'critical'
);
const unexpected = severe.filter(advisory => !allowed.has(Number(advisory.id)));
for (const advisory of severe) {
  const state = allowed.has(Number(advisory.id)) ? 'allowed' : 'unexpected';
  process.stderr.write(`${state}: ${advisory.id} ${advisory.module_name} ${advisory.title}\n`);
}
if (unexpected.length) process.exit(1);
```

Add these package fields:

```json
"audit:prod": "node tools/check-production-audit.js",
"auditAllowlist": []
```

Keep `auditAllowlist` empty when the Sharp override passes. Only if Task 1 proves Sharp 0.35 incompatible may it contain `[1124066]`, the current `hexo-lightning-minify -> sharp` advisory; the script must fail if that ID changes or any second high/critical advisory appears.

- [ ] **Step 6: Run the local CI equivalent**

Run:

```bash
pnpm install --frozen-lockfile
pnpm seo:obsidian:check
pnpm seo:frontmatter:check
pnpm seo:links:check
pnpm test
pnpm build
git diff --exit-code -- source/_posts
pnpm audit:prod
```

Expected: all commands PASS. An explicitly documented Sharp fallback may print advisory 1124066 as allowed; every other high/critical advisory fails the command.

- [ ] **Step 7: Commit automation**

```bash
git add .github/workflows/verify.yml .github/dependabot.yml package.json tools/check-production-audit.js test/repository-policy.test.js
git commit -m "ci: verify blog builds and dependencies"
```

---

### Task 8: Full Regression and Modernization Audit

**Files:**
- Modify: `docs/theme-upgrades.md` only if verification records a rejected Sharp override or an upstream compatibility exception.
- Modify: implementation files from prior tasks only when a failing verification identifies a real regression.

**Interfaces:**
- Consumes: all task deliverables.
- Produces: evidence that the modernization meets the approved design and leaves only intentional changes.

- [ ] **Step 1: Run the complete automated suite from a clean state**

Run:

```bash
pnpm install --frozen-lockfile
pnpm seo:obsidian:check
pnpm seo:frontmatter:check
pnpm seo:links:check
pnpm test
pnpm build
git diff --exit-code -- source/_posts
pnpm audit:prod
```

Expected: checks, tests, build, and the narrow audit gate PASS. Audit contains no high-severity advisory unless Sharp advisory 1124066 is both allowlisted and recorded in `docs/theme-upgrades.md`.

- [ ] **Step 2: Validate generated routes and metadata**

Confirm `public/index.html`, `public/robots.txt`, `public/sitemap.xml`, and the configured RSS file exist. Inspect representative home, normal post, Mermaid post, About, archive, category, tag, comments, and 404 pages for canonical URL, description, one H1 where required, navigation, stylesheets, and expected page-scoped scripts.

- [ ] **Step 3: Validate interactive behavior in a browser**

Start `pnpm server`, then inspect desktop and narrow viewport behavior. Confirm mobile navigation, dark mode, Tocbot, Waline, Umami requests, danmaku page, reduced-motion behavior, reading progress on posts only, Mermaid on the flagged post only, local Speed Insights module loading, and Qiniu Live2D delayed loading plus manual quote fallback.

- [ ] **Step 4: Review repository state and diff**

Run:

```bash
git status --short
git diff --check
git diff --stat HEAD~7..HEAD
git log --oneline -8
```

Expected: no untracked build output, no whitespace errors, and every changed file maps to one approved modernization task.

- [ ] **Step 5: Commit verification-only corrections if needed**

If Step 1–4 required code corrections, rerun the failing command and then the complete suite before committing only those corrections:

```bash
git add -u
git commit -m "fix: close modernization regressions"
```

If no correction was required, do not create an empty commit.
