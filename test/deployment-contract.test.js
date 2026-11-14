'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const cacheControlValues = [
  'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
  'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'public, max-age=31536000, immutable'
];

function generatedHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return generatedHtmlFiles(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

test('Vercel applies the required global security headers without changing cache rules', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const headers = Object.fromEntries(
    vercel.headers
      .filter(rule => rule.source === '/(.*)')
      .flatMap(rule => rule.headers.map(header => [header.key, header.value]))
  );
  const cacheValues = vercel.headers.flatMap(rule =>
    rule.headers.filter(header => header.key === 'Cache-Control').map(header => header.value)
  );

  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.equal(headers['Permissions-Policy'], 'camera=(), microphone=(), geolocation=()');
  assert.deepEqual(cacheValues, cacheControlValues);
});

test('Vercel redirects duplicate and timezone-shifted production URLs', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = Object.fromEntries(
    vercel.redirects.map(redirect => [redirect.source, redirect.destination])
  );

  assert.deepEqual(redirects, {
    '/index.html': '/',
    '/2024/08/02/cross-origin/': '/2024/08/03/cross-origin/',
    '/2024/08/27/session-cookie/': '/2024/08/28/session-cookie/',
    '/2024/09/04/nginx-upstream-check-module-using/': '/2024/09/05/nginx-upstream-check-module-using/',
    '/2024/10/17/2023-2024/': '/2024/10/18/2023-2024/'
  });
  assert.ok(vercel.redirects.every(redirect => redirect.permanent === true));
});

test('a clean build omits dead Live2D output and unsafe crash script while using HTTPS MIIT filing', () => {
  assert.equal(fs.existsSync(path.join(publicDir, 'live2d')), false);

  const generatedHtml = generatedHtmlFiles(publicDir).map(file => fs.readFileSync(file, 'utf8'));
  assert.ok(generatedHtml.length > 0, 'expected generated HTML files');
  for (const html of generatedHtml) {
    assert.doesNotMatch(html, /\/js\/crash_cheat\.js/);
  }
  assert.ok(
    generatedHtml.some(html => html.includes('https://beian.miit.gov.cn/')),
    'expected an HTTPS MIIT filing link in generated HTML'
  );
});
