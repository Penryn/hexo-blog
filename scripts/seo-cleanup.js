'use strict';

const fs = require('fs');
const path = require('path');

const STALE_OUTPUT_FILES = [
  path.join('xml', 'local-search.xml'),
  'Google Search Console Verification File.html'
];

function removeEmptyParentDirs(startDir, stopDir) {
  let current = startDir;

  while (current.startsWith(stopDir) && current !== stopDir) {
    let entries;
    try {
      entries = fs.readdirSync(current);
    } catch (error) {
      break;
    }

    if (entries.length > 0) {
      break;
    }

    try {
      fs.rmdirSync(current);
    } catch (error) {
      break;
    }

    current = path.dirname(current);
  }
}

hexo.extend.filter.register('after_generate', function() {
  const publicDir = hexo.public_dir;
  const routes = new Set(Array.from(hexo.route.list()));

  for (const relativePath of STALE_OUTPUT_FILES) {
    if (routes.has(relativePath)) {
      hexo.route.remove(relativePath);
      hexo.log.info(`[seo-cleanup] removed route ${relativePath}`);
    }

    const targetPath = path.join(publicDir, relativePath);
    if (!fs.existsSync(targetPath)) {
      continue;
    }

    try {
      fs.unlinkSync(targetPath);
      removeEmptyParentDirs(path.dirname(targetPath), publicDir);
      hexo.log.info(`[seo-cleanup] removed ${relativePath}`);
    } catch (error) {
      hexo.log.warn(`[seo-cleanup] failed to remove ${relativePath}: ${error.message}`);
    }
  }
});
