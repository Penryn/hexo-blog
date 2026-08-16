const { spawnSync } = require('node:child_process');
const pkg = require('../package.json');

function evaluateAuditResult(result, auditAllowlist = [], write = message => process.stderr.write(message)) {
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch (error) {
    write(result.stderr || result.stdout || '');
    throw new Error(`Unable to parse pnpm audit JSON: ${error.message}`);
  }

  const allowed = new Set(auditAllowlist.map(Number));
  const severe = Object.values(report.advisories || {}).filter(advisory =>
    advisory.severity === 'high' || advisory.severity === 'critical'
  );
  const unexpected = severe.filter(advisory => !allowed.has(Number(advisory.id)));
  for (const advisory of severe) {
    const state = allowed.has(Number(advisory.id)) ? 'allowed' : 'unexpected';
    write(`${state}: ${advisory.id} ${advisory.module_name} ${advisory.title}\n`);
  }
  return unexpected.length ? 1 : 0;
}

function runProductionAudit() {
  const result = spawnSync('pnpm', ['audit', '--prod', '--json'], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024
  });
  if (result.error) throw result.error;
  return evaluateAuditResult(result, pkg.auditAllowlist);
}

if (require.main === module) {
  process.exitCode = runProductionAudit();
}

module.exports = { evaluateAuditResult, runProductionAudit };
