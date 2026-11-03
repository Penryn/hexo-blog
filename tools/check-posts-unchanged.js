const { spawnSync } = require('node:child_process');

const result = spawnSync('git', [
  'status',
  '--porcelain',
  '--untracked-files=all',
  '--',
  'source/_posts'
], {
  encoding: 'utf8'
});

if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exitCode = result.status || 1;
} else if (result.stdout) {
  process.stderr.write(`source/_posts changed or untracked:\n${result.stdout}`);
  process.exitCode = 1;
}
