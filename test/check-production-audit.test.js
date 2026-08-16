const assert = require('node:assert/strict');
const test = require('node:test');

function evaluate(result, allowlist = []) {
  const { evaluateAuditResult } = require('../tools/check-production-audit.js');
  const output = [];
  const exitCode = evaluateAuditResult(result, allowlist, message => output.push(message));
  return { exitCode, output };
}

test('accepts a nonzero pnpm audit exit when no high or critical advisories exist', () => {
  const { exitCode, output } = evaluate({
    status: 1,
    stdout: JSON.stringify({
      advisories: {
        1001: { id: 1001, severity: 'moderate', module_name: 'example', title: 'moderate issue' }
      }
    }),
    stderr: 'pnpm audit found lower-severity advisories'
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(output, []);
});

test('fails and reports every unexpected high or critical advisory', () => {
  const { exitCode, output } = evaluate({
    status: 1,
    stdout: JSON.stringify({
      advisories: {
        2001: { id: 2001, severity: 'high', module_name: 'high-package', title: 'high issue' },
        2002: { id: 2002, severity: 'critical', module_name: 'critical-package', title: 'critical issue' }
      }
    }),
    stderr: ''
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(output, [
    'unexpected: 2001 high-package high issue\n',
    'unexpected: 2002 critical-package critical issue\n'
  ]);
});

test('rejects malformed pnpm audit JSON and preserves audit output for diagnosis', () => {
  const output = [];
  const { evaluateAuditResult } = require('../tools/check-production-audit.js');

  assert.throws(
    () => evaluateAuditResult({ stdout: 'not-json', stderr: 'audit stderr' }, [], message => output.push(message)),
    /Unable to parse pnpm audit JSON/
  );
  assert.deepEqual(output, ['audit stderr']);
});

test('allows only explicitly allowlisted numeric advisory IDs', () => {
  const { exitCode, output } = evaluate({
    status: 1,
    stdout: JSON.stringify({
      advisories: {
        1124066: { id: '1124066', severity: 'high', module_name: 'sharp', title: 'known issue' }
      }
    }),
    stderr: ''
  }, ['1124066']);

  assert.equal(exitCode, 0);
  assert.deepEqual(output, ['allowed: 1124066 sharp known issue\n']);
});
