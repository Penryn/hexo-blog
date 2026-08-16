'use strict';

const fs = require('node:fs');
const path = require('node:path');

function getBrowserModulePath() {
  let manifestPath;
  try {
    manifestPath = require.resolve('@vercel/speed-insights/package.json');
  } catch (error) {
    throw new Error('Speed Insights vendor route cannot resolve @vercel/speed-insights/package.json', {
      cause: error
    });
  }

  const browserModulePath = path.join(path.dirname(manifestPath), 'dist', 'index.mjs');
  if (!fs.existsSync(browserModulePath)) {
    throw new Error('Speed Insights vendor route expected installed browser module at ' + browserModulePath);
  }
  return browserModulePath;
}

hexo.extend.generator.register('speed_insights_vendor', function() {
  const browserModulePath = getBrowserModulePath();
  return {
    path: 'scripts/vendor/speed-insights.mjs',
    data: fs.readFileSync(browserModulePath, 'utf8')
  };
});
