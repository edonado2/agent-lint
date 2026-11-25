import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

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

export const links = () => [];
export const duplicates = () => [];
export const fences = () => [];
