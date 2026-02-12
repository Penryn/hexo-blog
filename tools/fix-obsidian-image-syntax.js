#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(process.cwd(), 'source');
const OBSIDIAN_IMAGE_RE = /!\[\[([^\]|]+?)(?:\|([^\]]+))?\]\]/g;

function listMarkdownFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function toMarkdownImage(match, target, altText) {
  const url = target.trim();
  if (!url) {
    return match;
  }
  const alt = (altText || '').trim().replace(/]/g, '\\]');
  return `![${alt}](${url})`;
}

function transformContent(content) {
  const lines = content.split('\n');
  let inFence = false;
  let changed = false;
  let hasResidual = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) {
      continue;
    }

    let next = line.replace(OBSIDIAN_IMAGE_RE, toMarkdownImage);
    if (next !== line) {
      changed = true;
    }

    const trimmedNext = next.trim();
    const brokenImageOnly = trimmedNext.startsWith('![[') && !trimmedNext.includes(']]');
    if (brokenImageOnly) {
      next = '';
      changed = true;
    }

    if (next.includes('![[')) {
      hasResidual = true;
    }

    lines[i] = next;
  }

  return {
    changed,
    hasResidual,
    content: lines.join('\n')
  };
}

function processFile(filePath, checkOnly) {
  const original = fs.readFileSync(filePath, 'utf8');
  const transformed = transformContent(original);

  if (!transformed.changed) {
    return { changed: false, hasResidual: transformed.hasResidual };
  }

  if (checkOnly) {
    return { changed: false, hasResidual: true };
  }

  fs.writeFileSync(filePath, transformed.content, 'utf8');
  return { changed: true, hasResidual: transformed.hasResidual };
}

function main() {
  const checkOnly = process.argv.includes('--check');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = listMarkdownFiles(SOURCE_DIR);
  const changedFiles = [];
  const residualFiles = [];

  for (const file of files) {
    const result = processFile(file, checkOnly);
    if (result.changed) {
      changedFiles.push(path.relative(process.cwd(), file));
    }
    if (result.hasResidual) {
      residualFiles.push(path.relative(process.cwd(), file));
    }
  }

  if (checkOnly) {
    if (residualFiles.length === 0) {
      console.log('OK: no Obsidian image syntax residue found.');
      return;
    }
    console.log('Obsidian image syntax residue found in:');
    for (const file of residualFiles) {
      console.log(`- ${file}`);
    }
    process.exit(1);
  }

  console.log(`Fixed files: ${changedFiles.length}`);
  if (changedFiles.length > 0) {
    for (const file of changedFiles) {
      console.log(`- ${file}`);
    }
  }

  if (residualFiles.length > 0) {
    console.log('Residual patterns still present (manual cleanup needed):');
    for (const file of residualFiles) {
      console.log(`- ${file}`);
    }
  }
}

main();
