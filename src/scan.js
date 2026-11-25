import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { discover } from './files.js';
import * as rules from './rules.js';

export function scan(root) {
  const findings = [];
  for (const file of discover(root)) {
    const lines = readFileSync(join(root, file), 'utf8').split(/\r?\n/);
    findings.push(...rules.paths(lines, file, root));
    findings.push(...rules.scripts(lines, file, root));
    findings.push(...rules.links(lines, file, root));
    findings.push(...rules.duplicates(lines, file, root));
    findings.push(...rules.fences(lines, file, root));
  }
  return findings.sort((a, b) =>
    a.path.localeCompare(b.path) || a.line - b.line || a.rule.localeCompare(b.rule));
}
