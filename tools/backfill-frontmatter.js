#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(process.cwd(), 'source', '_posts');

function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {
      hasFrontMatter: false,
      frontMatter: '',
      body: content,
      frontMatterRaw: ''
    };
  }

  return {
    hasFrontMatter: true,
    frontMatter: match[1],
    body: content.slice(match[0].length),
    frontMatterRaw: match[0]
  };
}

function hasKey(frontMatter, key) {
  return new RegExp(`^${key}:\\s*(?:.*)$`, 'm').test(frontMatter);
}

function getScalar(frontMatter, key) {
  const match = frontMatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!match) {
    return '';
  }
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function parseList(frontMatter, key) {
  const lines = frontMatter.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(new RegExp(`^${key}:\\s*(.*)$`));
    if (!m) {
      continue;
    }

    const value = m[1].trim();
    if (value === '') {
      const out = [];
      let j = i + 1;
      while (j < lines.length) {
        const item = lines[j].match(/^\s*-\s+(.+)$/);
        if (!item) {
          break;
        }
        out.push(item[1].trim().replace(/^['"]|['"]$/g, ''));
        j++;
      }
      return out.filter(Boolean);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1)
        .split(',')
        .map(item => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    }

    return [value.replace(/^['"]|['"]$/g, '')].filter(Boolean);
  }
  return [];
}

function escapeYamlString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ');
}

function cleanPlainText(input) {
  let text = String(input || '');
  text = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\[[^\]]+\]\]/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^!\[\[[^\]]+\]\]\s*$/gm, ' ')
    .replace(/^[ \t]*\d+\.\s+/gm, ' ')
    .replace(/^[ \t]*[-*+|>]+\s*/gm, ' ')
    .replace(/[*_~>#`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

function normalizeDescription(text, fallbackTitle) {
  const cleaned = cleanPlainText(text) || cleanPlainText(fallbackTitle) || '';
  if (!cleaned) {
    return '';
  }
  if (cleaned.length > 120) {
    return `${cleaned.slice(0, 117)}...`;
  }
  return cleaned;
}

function extractDescription(body, fallbackTitle) {
  const text = cleanPlainText(body);

  const candidates = text
    .split(/(?<=[。！？.!?])\s+/)
    .map(item => item.trim())
    .filter(Boolean);

  const chosen = candidates.find(item => item.length >= 24) || candidates[0] || '';
  return normalizeDescription(chosen, fallbackTitle);
}

function buildKeywords(frontMatter, title) {
  const tags = parseList(frontMatter, 'tags');
  const categories = parseList(frontMatter, 'categories');
  const merged = [...new Set([...tags, ...categories].map(item => item.trim()).filter(Boolean))];

  if (merged.length > 0) {
    return merged.slice(0, 8);
  }

  const cleanTitle = (title || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '').slice(0, 16);
  if (cleanTitle) {
    return [cleanTitle, '技术博客'];
  }
  return ['技术博客', '学习笔记'];
}

function stripDeprecatedFields(frontMatter) {
  const lines = frontMatter.split('\n');
  const out = [];
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^index_img:\s*/.test(line)) {
      changed = true;
      continue;
    }

    out.push(line);
  }

  return {
    changed,
    frontMatter: out.join('\n')
  };
}

function sanitizeDescriptionField(frontMatter, fallbackTitle) {
  const lines = frontMatter.split('\n');
  let changed = false;
  let hasDescription = false;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^description:\s*(.*)$/);
    if (!m) {
      continue;
    }

    const raw = m[1].trim().replace(/^['"]|['"]$/g, '');
    const normalized = normalizeDescription(raw, fallbackTitle);
    if (!normalized) {
      lines.splice(i, 1);
      changed = true;
      hasDescription = false;
      break;
    }

    hasDescription = true;
    const expectedLine = `description: "${escapeYamlString(normalized)}"`;
    if (lines[i] !== expectedLine) {
      lines[i] = expectedLine;
      changed = true;
    }
    break;
  }

  return {
    changed,
    hasDescription,
    frontMatter: lines.join('\n')
  };
}

function insertMissingFields(frontMatter, body) {
  const stripped = stripDeprecatedFields(frontMatter);
  let cleanFrontMatter = stripped.frontMatter;
  const title = getScalar(cleanFrontMatter, 'title');
  const descSanitized = sanitizeDescriptionField(cleanFrontMatter, title);
  cleanFrontMatter = descSanitized.frontMatter;

  const date = getScalar(cleanFrontMatter, 'date');
  const hasUpdated = hasKey(cleanFrontMatter, 'updated');
  const hasDescription = descSanitized.hasDescription || hasKey(cleanFrontMatter, 'description');
  const hasKeywords = hasKey(cleanFrontMatter, 'keywords');

  const missing = {
    updated: !hasUpdated,
    description: !hasDescription,
    keywords: !hasKeywords
  };

  if (!missing.updated && !missing.description && !missing.keywords && !stripped.changed && !descSanitized.changed) {
    return { changed: false, frontMatter: cleanFrontMatter };
  }

  const lines = cleanFrontMatter.split('\n');
  const inserts = [];

  if (missing.updated) {
    inserts.push(`updated: ${date || new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
  }
  if (missing.description) {
    const description = extractDescription(body, title);
    inserts.push(`description: "${escapeYamlString(description)}"`);
  }
  if (missing.keywords) {
    const keywords = buildKeywords(cleanFrontMatter, title);
    inserts.push('keywords:');
    for (const kw of keywords) {
      inserts.push(`  - "${escapeYamlString(kw)}"`);
    }
  }

  if (inserts.length > 0) {
    let insertAt = lines.findIndex(line => /^date:\s*/.test(line));
    if (insertAt === -1) {
      insertAt = lines.findIndex(line => /^title:\s*/.test(line));
    }
    insertAt = insertAt === -1 ? 0 : insertAt + 1;

    lines.splice(insertAt, 0, ...inserts);
  }
  return { changed: true, frontMatter: lines.join('\n') };
}

function processFile(filePath, checkOnly) {
  const original = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontMatter(original);

  if (!parsed.hasFrontMatter) {
    return { changed: false, missing: false };
  }

  const next = insertMissingFields(parsed.frontMatter, parsed.body);
  if (!next.changed) {
    return { changed: false, missing: false };
  }

  if (checkOnly) {
    return { changed: false, missing: true };
  }

  const rebuilt = `---\n${next.frontMatter}\n---\n${parsed.body}`;
  if (rebuilt !== original) {
    fs.writeFileSync(filePath, rebuilt, 'utf8');
    return { changed: true, missing: false };
  }

  return { changed: false, missing: false };
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

  const changed = [];
  const missing = [];

  for (const file of files) {
    const result = processFile(file, checkOnly);
    if (result.changed) {
      changed.push(path.relative(process.cwd(), file));
    }
    if (result.missing) {
      missing.push(path.relative(process.cwd(), file));
    }
  }

  if (checkOnly) {
    if (missing.length === 0) {
      console.log('OK: all posts have updated/description/keywords and no index_img.');
      return;
    }
    console.log('Front-matter needs normalization (updated/description/keywords or deprecated fields) in:');
    for (const file of missing) {
      console.log(`- ${file}`);
    }
    process.exit(1);
  }

  console.log(`Backfilled files: ${changed.length}`);
  if (changed.length > 0) {
    for (const file of changed) {
      console.log(`- ${file}`);
    }
  }
}

main();
