import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PATH_EXTENSIONS = /\.(sh|js|mjs|cjs|ts|tsx|jsx|json|md|yml|yaml|py|swift|css|html)$/;
const scriptCache = new Map();

function find(path, line, rule, message) {
  return { path, line, rule, message };
}

export function paths(lines, file, root) {
  const found = [];
  lines.forEach((text, index) => {
    for (const match of text.matchAll(/`([^`]+)`/g)) {
      const token = match[1];
      if (/[*?\[\]:]/.test(token)) continue;
      if (!token.includes('/') && !PATH_EXTENSIONS.test(token)) continue;
      if (existsSync(join(root, token))) continue;
      found.push(find(file, index + 1, 'missing-path', `path does not exist: ${token}`));
    }
  });
  return found;
}

function scriptsFor(root) {
  if (scriptCache.has(root)) return scriptCache.get(root);
  let scripts = {};
  try {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    scripts = pkg.scripts || {};
  } catch {
    scripts = null;
  }
  scriptCache.set(root, scripts);
  return scripts;
}

export function scripts(lines, file, root) {
  const known = scriptsFor(root);
  if (!known) return [];
  const found = [];
  lines.forEach((text, index) => {
    for (const match of text.matchAll(/\b(?:npm run|pnpm|yarn)\s+([\w:-]+)/g)) {
      const name = match[1];
      if (Object.hasOwn(known, name)) continue;
      found.push(find(file, index + 1, 'missing-script', `script not in package.json: ${name}`));
    }
  });
  return found;
}

export function links(lines, file, root) {
  const found = [];
  const base = join(root, file);
  let inFence = false;
  lines.forEach((text, index) => {
    if (text.trim().startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].trim();
      if (/^(?:https?:|mailto:|#|\/)/.test(target)) continue;
      if (existsSync(join(dirname(base), target))) continue;
      found.push(find(file, index + 1, 'broken-link', `link target does not exist: ${target}`));
    }
  });
  return found;
}

const duplicateCache = new Map();

export function duplicates(lines, file, root) {
  let seen = duplicateCache.get(root);
  if (!seen) {
    seen = new Map();
    duplicateCache.set(root, seen);
  }
  const found = [];
  lines.forEach((text, index) => {
    const key = text.trim();
    if (!key) return;
    const first = seen.get(key);
    if (first && first.file !== file) {
      found.push(find(file, index + 1, 'duplicate-rule', `duplicate instruction, first in ${first.file}:${first.line}`));
    } else if (!first) {
      seen.set(key, { file, line: index + 1 });
    }
  });
  return found;
}

export function fences(lines, file, root) {
  const found = [];
  let opener = null;
  lines.forEach((text, index) => {
    if (!text.trim().startsWith('```')) return;
    if (opener === null) opener = index + 1;
    else opener = null;
  });
  if (opener !== null) found.push(find(file, opener, 'unclosed-fence', 'code fence has no closing marker'));
  return found;
}
