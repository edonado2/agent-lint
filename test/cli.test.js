import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from '../bin/agent-lint.js';

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
