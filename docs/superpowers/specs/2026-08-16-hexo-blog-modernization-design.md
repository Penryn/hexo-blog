# Hexo Blog Modernization Design

## Goal

Modernize the blog's dependencies, Fluid theme integration, asset pipeline, runtime security, and CI without changing its URLs, content, visual identity, analytics, comments, danmaku, or intentional Live2D behavior.

## Constraints

- Preserve the existing site URL and permalink scheme.
- Preserve the current visual design and user-facing features unless a change is explicitly listed below.
- Keep the Qiniu-hosted Live2D model as the production model.
- Remove the unused `source/live2d` model copies from the repository and generated site.
- Use Node.js 24 LTS and pnpm 10.29.3 for local, CI, and Vercel builds.
- Keep Fluid customizations while adopting the upstream 1.9.9 fixes.
- Do not enable Fluid's random banner feature.
- Do not make Content Security Policy enforcement blocking in this change.

## Chosen Approach

Use a conservative three-way upgrade. Fluid 1.9.8 is the merge base, the current vendored theme is the customized branch, and Fluid 1.9.9 is the upstream branch. Resolve overlapping files in favor of current behavior while adopting upstream bug fixes. This avoids the regressions of replacing the theme wholesale and creates a clear upstream reference for future upgrades.

## Components

### Dependency and runtime baseline

Update the four outdated direct dependencies: Hexo to 8.1.2, `hexo-robots` to 1.0.4, `@adobe/css-tools` to 4.5.0, and Highlight.js to 11.12.0. Refresh the lockfile so patched transitive dependencies are selected. Pin Node.js 24 through package metadata and a version file.

`hexo-lightning-minify` currently pins Sharp below the patched release. Add a narrow pnpm override for Sharp 0.35.x only if a clean install, image conversion checks, and a full Hexo build pass. If the override is incompatible, leave the plugin unchanged for this implementation and record the remaining advisory instead of silently disabling minification.

Upgrade `@vercel/speed-insights` to the current 2.x package and serve its integration from installed project dependencies rather than importing executable code from unpkg at runtime.

### Fluid 1.9.9 merge

Apply the upstream 1.9.8-to-1.9.9 changes to the customized theme. Resolve the nine overlapping paths manually. Preserve the current home-page accessible H1, local Tocbot 4.36.4 fallback, custom Bootstrap-lite integration, animation degradation rules, navigation, comments, and styling.

Adopt the 1.9.9 Waline ES module integration, lazy-load viewport fix, Umami parameter handling, TOC fixes, mobile navigation fixes, and related correctness changes. Keep random banners disabled and do not introduce unused OpenKounter configuration.

Record the upstream base and target revisions in repository documentation so the next upgrade can repeat the same three-way process.

### Published assets and page-scoped scripts

Delete `source/live2d`. The Qiniu model URL remains the only production model. Remove other proven-unreferenced local image copies when they have no source or generated HTML reference.

Make every production build clean its output before generation. This prevents deleted or renamed assets from surviving in `public`.

Load reading-progress code only for post layouts. Keep the site-duration script global because its target is in the global footer. Keep scroll animation global. Keep the Live2D bootstrap available on supported desktop pages, but continue deferring the actual runtime until interaction or the configured fallback.

Set Mermaid to opt-in mode. Only posts whose front matter declares `mermaid: true` load Mermaid. Existing posts containing Mermaid code blocks must receive that flag. Upgrade from Mermaid 8 only after verifying every existing diagram; if Fluid 1.9.9 remains incompatible with Mermaid 11, retain the pinned compatible version and scope it correctly rather than breaking diagrams.

### Live2D data-only runtime configuration

Remove function source code from `_config.yml`. Move the Hitokoto cache, backoff, escaping, and fetch behavior into a normal browser script with a named hook. The generated `live2d-config.js` must contain JSON-compatible data and hook identifiers only.

The loader resolves only allowlisted hook names supplied by local code. It must not evaluate strings with `eval`, `new Function`, or dynamically created source code. Missing or invalid hooks fall back to static messages and log a non-fatal warning.

### CI and build behavior

Add a GitHub Actions workflow that runs on pull requests and pushes to `main`. It installs Node.js 24 and pnpm 10.29.3, performs a frozen install, runs all three read-only SEO checks, generates the site from a clean output directory, runs repository tests, and audits production dependencies at high severity.

Change `prebuild` to use read-only checks. Keep explicit fix commands for authors, but production and CI builds must never rewrite source Markdown.

Dependabot changes from daily to weekly and uses a smaller pull-request limit to reduce noise. Theme upgrades remain manual because the customized theme is vendored.

### Security headers

Extend `vercel.json` with `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` for all routes. Preserve current caching rules.

Add a non-enforcing Content Security Policy report-only header only after its source allowlist is validated against the generated site. It may temporarily permit inline scripts because Fluid emits them, but it must not require `unsafe-eval` after the Live2D change. If a useful report-only policy cannot be expressed without breaking third-party comments or analytics, omit CSP from this change and document the blocker rather than adding a misleading policy.

### Accessibility and content structure

Preserve reduced-motion handling for Live2D, progress indicators, and custom effects. Make the typing animation avoid starting when `prefers-reduced-motion: reduce` is active. Retain the screen-reader-only home H1 and add one meaningful H1 to generated about, archive, category-index, and tag-index pages where none exists.

Remove the tab-crash title trick because it changes the page title and favicon on visibility changes without user benefit. Change the ICP filing link to HTTPS.

## Error Handling and Rollback

- A failed dependency or Sharp compatibility check blocks that individual upgrade, not unrelated improvements.
- Missing optional third-party services must not block page rendering.
- Failed Live2D or Hitokoto requests use the existing static fallback messages.
- Fluid merge conflicts are resolved file by file, with a clean-build HTML comparison after each high-risk template group.
- Every task is committed independently so it can be reverted without discarding the rest of the modernization.

## Testing Strategy

Add Node test-runner tests for generated configuration and templates. Tests must verify:

- `live2d-config.js` is data-only and contains no function source, `eval`, or `new Function`.
- the loader resolves allowlisted named hooks and rejects unknown hooks.
- reading-progress is present on posts and absent from the home page.
- Mermaid loads only on posts that opt in.
- generated home, post, about, archive, category-index, and tag-index pages have exactly one H1.
- generated pages retain canonical URLs, metadata, RSS, sitemap, and robots routes.
- `vercel.json` contains the required headers and existing cache rules.
- a clean build excludes the removed Live2D model directory.

Run the three existing SEO checks, Node tests, a clean production build, `pnpm audit --prod`, and a final Git status/diff review. Compare representative generated home, post-with-Mermaid, ordinary post, comments, and about pages.

## Acceptance Criteria

- The site builds successfully on Node.js 24 with pnpm 10.29.3.
- Existing URLs, visible design, Umami, Waline, danmaku, and Qiniu Live2D behavior remain available.
- Fluid reports version 1.9.9 and includes the selected upstream fixes.
- `source/live2d` and `/live2d` are absent from source and clean output.
- Production dependency audit has no high-severity advisory, unless the Sharp compatibility fallback is explicitly documented.
- No production build rewrites Markdown.
- New tests and existing SEO checks pass.
- The working tree contains only intentional modernization changes.
