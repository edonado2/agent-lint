# agent-lint

Agent instruction files rot silently. `agent-lint` finds stale paths, renamed scripts, broken links and malformed rules before an agent reads them.

```bash
npx github:edonado2/agent-lint
```

Zero dependencies. Node 18+. No config file.

## What it looks like

The bundled broken example triggers every rule:

```bash
npx github:edonado2/agent-lint examples/broken
```

Real output:

```text
AGENTS.md:3  missing-script  script not in package.json: deploy
AGENTS.md:5  missing-path  path does not exist: docs/missing-guide.md
AGENTS.md:7  broken-link  link target does not exist: ./notes.md
AGENTS.md:9  unclosed-fence  code fence has no closing marker
CLAUDE.md:1  duplicate-rule  duplicate instruction, first in AGENTS.md:1
```

## Rules

| Rule | Finds |
| --- | --- |
| `missing-path` | A backticked file path that does not exist |
| `missing-script` | `npm run`, `pnpm` or `yarn` calling a script absent from `package.json` |
| `broken-link` | A relative Markdown link to a missing local file |
| `duplicate-rule` | The same instruction line in two instruction files |
| `unclosed-fence` | A code fence with no closing marker |

Instruction files are discovered by name: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md` and `skills/**/SKILL.md`. `node_modules`, `.git` and `dist` are skipped.

## Usage

```bash
agent-lint [path] [--json] [--no-color]
agent-lint --help
agent-lint --version
```

Exit codes: `0` clean, `1` findings, `2` usage or I/O error. With `--json`, stdout is only a JSON array of `{ path, line, rule, message }`; errors go to stderr.

## GitHub Action

```yaml
- uses: edonado2/agent-lint@v0.1.0
  with:
    path: .
```

The step fails when findings exist.

## Limits

Contradiction detection is not in v1 — a keyword heuristic would generate false positives, and a linter that cries wolf stops being read. Globs such as `src/*.ts` are skipped rather than guessed. npm install via `npx agent-lint` becomes available once the package is published; the GitHub install above works today.

## License

MIT — Ernesto Donado
