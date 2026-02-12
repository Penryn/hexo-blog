#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(process.cwd(), 'source', '_posts');
const INTERNAL_LINK_RE = /\[[^\]]+\]\((\/[^)]+|https?:\/\/blog\.phlin\.cn[^)]*)\)/i;
const EXTENDED_READING_HEADING_RE = /^##\s+延伸阅读\s*$/m;
const AUTO_MARKER = '<!-- auto-internal-links -->';

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {
      hasFrontMatter: false,
      frontMatter: '',
      body: content
    };
  }

  return {
    hasFrontMatter: true,
    frontMatter: match[1],
    body: content.slice(match[0].length)
  };
}

function parseCategories(frontMatter) {
  const lines = frontMatter.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const single = line.match(/^categories:\s*(.*)$/);
    if (!single) {
      continue;
    }

    const value = single[1].trim();
    if (value === '') {
      const categories = [];
      let j = i + 1;
      while (j < lines.length) {
        const item = lines[j].match(/^\s*-\s+(.+)$/);
        if (!item) {
          break;
        }
        categories.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
        j++;
      }
      return categories.filter(Boolean);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      return value
        .slice(1, -1)
        .split(',')
        .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }

    return [value.replace(/^['"]|['"]$/g, '')].filter(Boolean);
  }

  return [];
}

function toCategoryUrl(category) {
  return `/categories/${encodeURIComponent(category).replace(/%2F/g, '/')}/`;
}

function hasInternalLinks(markdown) {
  return INTERNAL_LINK_RE.test(markdown);
}

function normalizeTrailingWhitespace(text) {
  return text.replace(/\s*$/, '');
}

function buildSection(firstCategory) {
  const categoryLine = firstCategory
    ? `\n- [同分类更多内容](${toCategoryUrl(firstCategory)})`
    : '';

  return `\n\n${AUTO_MARKER}\n## 延伸阅读\n- [文章归档](/archives/)\n- [分类导航](/categories/)\n- [标签导航](/tags/)${categoryLine}\n`;
}

function processFile(filePath, checkOnly) {
  const original = fs.readFileSync(filePath, 'utf8');
  const { frontMatter, body } = parseFrontMatter(original);
  const categories = parseCategories(frontMatter);
  const firstCategory = categories[0];

  const hasManualSection = EXTENDED_READING_HEADING_RE.test(body) || body.includes(AUTO_MARKER);
  const needsSection = !hasInternalLinks(body) && !hasManualSection;

  if (!needsSection) {
    return { changed: false, missingInternalLinks: false };
  }

  if (checkOnly) {
    return { changed: false, missingInternalLinks: true };
  }

  const nextBody = normalizeTrailingWhitespace(body) + buildSection(firstCategory);
  const updated = original.replace(body, nextBody);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    return { changed: true, missingInternalLinks: false };
  }

  return { changed: false, missingInternalLinks: false };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has('--check');

  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR)
    .filter(name => name.endsWith('.md'))
    .map(name => path.join(POSTS_DIR, name));

  const changedFiles = [];
  const missingFiles = [];

  for (const file of files) {
    const result = processFile(file, checkOnly);
    if (result.changed) {
      changedFiles.push(path.relative(process.cwd(), file));
    }
    if (result.missingInternalLinks) {
      missingFiles.push(path.relative(process.cwd(), file));
    }
  }

  if (checkOnly) {
    if (missingFiles.length === 0) {
      console.log('OK: all posts contain internal links or a dedicated extended-reading section.');
      return;
    }
    console.log('Missing internal links / extended-reading section:');
    for (const file of missingFiles) {
      console.log(`- ${file}`);
    }
    process.exit(1);
  }

  console.log(`Updated files: ${changedFiles.length}`);
  if (changedFiles.length > 0) {
    for (const file of changedFiles) {
      console.log(`- ${file}`);
    }
  }
}

main();
