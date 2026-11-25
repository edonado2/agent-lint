import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const NAMES = new Set(['AGENTS.md', 'CLAUDE.md', '.cursorrules', '.github/copilot-instructions.md', 'SKILL.md']);
const SKIPS = new Set(['node_modules', '.git', 'dist']);

export function discover(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (SKIPS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) {
        const rel = relative(root, full).split(sep).join('/');
        if (NAMES.has(rel) || (entry.name === 'SKILL.md' && /(^|\/)skills\//.test(rel))) found.push(rel);
      }
    }
  };
  walk(root);
  return found.sort();
}
