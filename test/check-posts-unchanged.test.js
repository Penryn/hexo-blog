const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const guard = path.join(root, 'tools/check-posts-unchanged.js');

function runGuard() {
  return spawnSync(process.execPath, [guard], {
    cwd: root,
    encoding: 'utf8'
  });
}

test('post immutability guard accepts an unchanged source post tree', () => {
  const result = runGuard();

  assert.equal(result.status, 0, result.stderr);
});

test('post immutability guard rejects an untracked post and always removes its fixture', () => {
  const filename = `.ci-untracked-post-${process.pid}-${Date.now()}.md`;
  const fixture = path.join(root, 'source/_posts', filename);

  try {
    fs.writeFileSync(fixture, '---\ntitle: CI fixture\n---\n');
    const result = runGuard();

    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(filename));
  } finally {
    fs.rmSync(fixture, { force: true });
  }

  assert.equal(fs.existsSync(fixture), false);
});
