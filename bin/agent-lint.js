#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { scan } from '../src/scan.js';

const HELP = `agent-lint — check AI agent instruction files

Usage: agent-lint [path] [--json] [--no-color]

Flags:
  --json       print findings as JSON
  --no-color   plain text output
  --help       show this help
  --version    print the version
`;

export function formatHuman(findings) {
  return findings.map((f) => `${f.path}:${f.line}  ${f.rule}  ${f.message}\n`).join('');
}

export function formatJson(findings) {
  return `${JSON.stringify(findings, null, 2)}\n`;
}

export function run(argv, stdout = process.stdout, stderr = process.stderr) {
  let json = false;
  let color = true;
  const positional = [];

  for (const arg of argv) {
    if (arg === '--json') json = true;
    else if (arg === '--no-color') color = false;
    else if (arg === '--help') {
      stdout.write(HELP);
      return 0;
    } else if (arg === '--version') {
      stdout.write('0.1.0\n');
      return 0;
    } else if (arg.startsWith('--')) {
      stderr.write(`unknown flag: ${arg}\n`);
      return 2;
    } else positional.push(arg);
  }

  const root = positional[0] || process.cwd();
  let findings;
  try {
    findings = scan(root);
  } catch (error) {
    stderr.write(`cannot read ${root}: ${error.code || error.message}\n`);
    return 2;
  }
  stdout.write(json ? formatJson(findings) : formatHuman(findings));
  return findings.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = run(process.argv.slice(2));
}
