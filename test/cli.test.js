import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../bin/agent-lint.js';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function capture() {
  const out = [];
  const err = [];
  return {
    out,
    err,
    stdout: { write: (s) => { out.push(s); return true; } },
    stderr: { write: (s) => { err.push(s); return true; } },
    text: () => out.join(''),
    error: () => err.join(''),
  };
}

test('--help prints usage and exits 0', () => {
  const c = capture();
  assert.equal(run(['--help'], c.stdout, c.stderr), 0);
  assert.match(c.text(), /agent-lint/);
});

test('unknown flag exits 2 with a message on stderr', () => {
  const c = capture();
  assert.equal(run(['--bogus'], c.stdout, c.stderr), 2);
  assert.match(c.error(), /unknown flag/);
});

function dirWith(files) {
  const root = mkdtempSync(join(tmpdir(), 'agent-lint-cli-'));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
  return root;
}

test('a clean directory exits 0 with no output', () => {
  const root = dirWith({ 'AGENTS.md': 'Everything is fine.\n' });
  const c = capture();
  assert.equal(run([root], c.stdout, c.stderr), 0);
  assert.equal(c.text(), '');
});

test('a finding exits 1 and prints file:line rule', () => {
  const root = dirWith({ 'AGENTS.md': 'Use `scripts/no-file.sh`.\n' });
  const c = capture();
  assert.equal(run([root], c.stdout, c.stderr), 1);
  assert.match(c.text(), /AGENTS\.md:1  missing-path/);
});

test('--json emits only a parseable finding array', () => {
  const root = dirWith({ 'AGENTS.md': 'Use `scripts/no-file.sh`.\n' });
  const c = capture();
  assert.equal(run([root, '--json'], c.stdout, c.stderr), 1);
  const parsed = JSON.parse(c.text());
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].rule, 'missing-path');
  assert.equal(c.error(), '');
});

test('a missing root exits 2 with stderr only', () => {
  const root = join(tmpdir(), `agent-lint-absent-${process.pid}`);
  const c = capture();
  assert.equal(run([root], c.stdout, c.stderr), 2);
  assert.match(c.error(), /cannot read|no such/i);
  assert.equal(c.text(), '');
});

test('the broken example fixture triggers all five rules via the binary', () => {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const result = spawnSync(process.execPath, ['bin/agent-lint.js', 'examples/broken', '--json'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(result.status, 1, result.stderr);
  const findings = JSON.parse(result.stdout);
  const rules = new Set(findings.map((f) => f.rule));
  for (const rule of ['missing-path', 'missing-script', 'broken-link', 'duplicate-rule', 'unclosed-fence']) {
    assert.ok(rules.has(rule), `missing rule ${rule}`);
  }
});

