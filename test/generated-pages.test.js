const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function generatedPage(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', 'public', relativePath), 'utf8');
}

function h1Count(html) {
  return (html.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
}

function scriptSources(html) {
  const literalSources = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    match => match[1]
  );
  const dynamicSources = Array.from(
    html.matchAll(/Fluid\.utils\.createScript\(\s*['"]([^'"]+)['"]/g),
    match => match[1]
  );
  return literalSources.concat(dynamicSources);
}

test('generated pages load page-specific scripts and expose one primary heading', () => {
  const home = generatedPage('index.html');
  const ordinaryPost = generatedPage('2024/05/02/go_testing/index.html');
  const mermaidPost = generatedPage('2026/08/09/ai-agent-workflow/index.html');
  const about = generatedPage('about/index.html');
  const archives = generatedPage('archives/index.html');
  const categories = generatedPage('categories/index.html');
  const categoryDetail = generatedPage('categories/开发/index.html');
  const tags = generatedPage('tags/index.html');
  const tagDetail = generatedPage('tags/golang/index.html');

  assert.equal(h1Count(home), 1);
  assert.equal(h1Count(ordinaryPost), 1);
  assert.equal(h1Count(about), 1);
  assert.equal(h1Count(archives), 1);
  assert.equal(h1Count(categories), 1);
  assert.equal(h1Count(categoryDetail), 1);
  assert.equal(h1Count(tags), 1);
  assert.equal(h1Count(tagDetail), 1);
  assert.match(about, /<h1 class="about-name">关于<\/h1>/);
  assert.match(categoryDetail, /<h1 class="sr-only">分类 - 开发<\/h1>/);
  assert.match(tagDetail, /<h1 class="sr-only">标签 - golang<\/h1>/);

  assert.equal(scriptSources(home).some(src => src.includes('reading-progress.js')), false);
  assert.equal(scriptSources(ordinaryPost).some(src => src.includes('reading-progress.js')), true);
  assert.equal(scriptSources(home).some(src => /mermaid(?:\.min)?\.js/.test(src)), false);
  assert.equal(scriptSources(ordinaryPost).some(src => /mermaid(?:\.min)?\.js/.test(src)), false);
  assert.equal(scriptSources(mermaidPost).some(src => /mermaid(?:\.min)?\.js/.test(src)), true);
});
