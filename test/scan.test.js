import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { scan } from '../src/scan.js';
import { discover } from '../src/files.js';

function fixture(files, t) {
  const root = mkdtempSync(join(tmpdir(), 'agent-lint-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

test('reports a backticked path that does not exist', (t) => {
  const root = fixture({ 'CLAUDE.md': 'Use `scripts/missing.sh` to start.\n' }, t);
  const found = scan(root).filter((f) => f.rule === 'missing-path');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 1);
});

test('ignores backticked globs', (t) => {
  const root = fixture({ 'CLAUDE.md': 'See `src/*.ts` for code.\n' }, t);
  assert.equal(scan(root).filter((f) => f.rule === 'missing-path').length, 0);
});

test('reports a script missing from package.json', (t) => {
  const root = fixture({
    'AGENTS.md': 'Run `npm run missing-task` first.\n',
    'package.json': '{"scripts":{"build":"tsc"}}\n',
  }, t);
  const found = scan(root).filter((f) => f.rule === 'missing-script');
  assert.equal(found.length, 1);
  assert.equal(found[0].line, 1);
});

test('skips script checks when package.json is absent', (t) => {
  const root = fixture({ 'AGENTS.md': 'Run `npm run missing-task` first.\n' }, t);
  assert.equal(scan(root).filter((f) => f.rule === 'missing-script').length, 0);
});

test('discovers all five instruction filenames including nested skills', (t) => {
  const root = fixture({
    'AGENTS.md': '',
    'CLAUDE.md': '',
    '.cursorrules': '',
    '.github/copilot-instructions.md': '',
    'skills/demo/SKILL.md': '',
    'node_modules/pkg/AGENTS.md': '',
  }, t);
  assert.deepEqual(discover(root), [
    '.cursorrules',
    '.github/copilot-instructions.md',
    'AGENTS.md',
    'CLAUDE.md',
    'skills/demo/SKILL.md',
  ]);
});
