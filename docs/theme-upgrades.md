# Fluid Theme Upgrades

- Merge base: Fluid 1.9.8, commit `0f49caf`
- Current upstream target: Fluid 1.9.9, commit `39f38de`
- Strategy: compare base, this vendored theme, and target; apply upstream fixes file by file.
- Retained customizations: accessible home H1, Bootstrap-lite, Tocbot 4.36.4 fallback, scoped animation degradation, navigation, Umami, Waline, danmaku, and Live2D integration.
- Deliberately disabled upstream options: random banners and OpenKounter.

## Selective merge notes

- Adopted upstream language, comment-provider, copyright URL, footnote escaping, heading ID, word-count, fold/note whitespace, lazy-load visibility, mobile navigation, TOC expansion, color-schema, and CSS fixes.
- Adopted the Waline ESM template and upstream 3.6.0 asset prefix while retaining the existing Waline server configuration. The former Qiniu `waline.js` is UMD-only and has no named ESM `init` export, so retaining it would break the upstream template.
- Added upstream random-banner source compatibility, but kept `banner.random_img: false` and did not add upstream sample images.
- Omitted the OpenKounter config block, analytics loader, footer statistics branch, post metadata branch, and `source/js/openkounter.js` runtime because OpenKounter is not enabled for this site.
- Omitted upstream's hidden home-page H1 in `layout/index.ejs` because the retained banner already renders a screen-reader-only home H1; adding both would duplicate the page heading.
- Trialed Mermaid 11.16.0 from jsDelivr: the versioned browser bundle returned HTTP 200 and the generated AI Agent page referenced it, but runtime compatibility could not be established because the available Playwright CLI was missing and its Chromium download repeatedly disconnected. Fluid 1.9.9 still calls the legacy `mermaid.init()` API, so 8.14.0 remains pinned until the real diagram can be rendered without browser errors.
