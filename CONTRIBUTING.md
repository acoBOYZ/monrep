# Contributing

Issues and PRs welcome. Keep changes lean and scoped.

## Before you open a PR

1. Prefer one concern per PR.
2. Do **not** hand-edit generated files (`**/*.gen.ts`, `**/gen/**`). Change the source and run `bun run codegen`.
3. Run quality gates on what you touched (from repo root, or scoped with `--cwd <package>`):

```bash
bun run typecheck
bun run lint
bun run fmtcheck   # then: bun run fmt
bun run doctor     # React / UI changes
```

Or the all-in-one health check:

```bash
bun run ok
```

## Import / polish house style

Follow these while writing so fmt and lint stay clean:

- Always **top-level** `import type { … }` — never inline `import { type X }`.
- **Import statements / groups:** oxfmt `sortImports` (see [`.oxfmtrc.jsonc`](./.oxfmtrc.jsonc)).
- **Named members `{ … }`:** case-sensitive alphanumeric; **uppercase wins**  
  (e.g. `STREAM_MODULE_IDS, acquireStreamModule, releaseStreamModule`).
- After TS/TSX edits:

```bash
bun run --cwd <package> fmt
bun run --cwd <package> lint -- --fix
```

- Never fmt or lint-fix `**/*.gen.ts` / `**/*.gen.*`.

Authoritative agent copy: [`AGENTS.md`](./AGENTS.md) → **imports / polish (hard)**.

## Coding with an AI agent (Cursor / Intent)

If you (or your agent) work in this repo with Cursor, install and keep the **monrep** skill + Intent skills in sync. Agents should not miss the hard rules in `AGENTS.md`.

### Install / map skills

From the repo root (after `bun install`):

```bash
# Map workspace @monrep/agent-skills into the agent (Intent)
bun run skills:install

# List / load a skill
bun run skills:list
bun run skills:load @monrep/agent-skills#react-defaults
# or: bunx @tanstack/intent@latest load @monrep/agent-skills#oxfmt
```

`skills:install` runs `intent install --map` (see root [`package.json`](./package.json) scripts).

### Cursor user skill: `/monrep`

The Cursor skill **monrep** (`~/.cursor/skills/monrep/SKILL.md`) mirrors root [`AGENTS.md`](./AGENTS.md) (Intent entries + hard sections).

- Attach **`/monrep`** (or ensure that skill is installed) when the agent should follow repo-wide hard rules.
- Whenever you change Intent entries or hard sections in `AGENTS.md`, **update the monrep skill to match** (same body after its YAML frontmatter). See **Agent skills sync (hard)** in `AGENTS.md`.

### Validate / update skills

```bash
# Sync versions + validate + stale check (run after editing skills)
bun run skills:check

# Individually:
bun run skills:sync-versions
bun run skills:validate
bun run skills:stale

# Refresh vendored Cloudflare skill bodies (then check)
bun run skills:cf-up && bun run skills:check
```

Package skills live under [`packages/agent-skills/skills/`](./packages/agent-skills/skills/). Do not hand-edit vendored Cloudflare bodies; use `skills:cf-up`.

## Docs agents should load

| Topic | Where |
|--------|--------|
| Always-on hard rules | [`AGENTS.md`](./AGENTS.md) + Cursor **`/monrep`** |
| React / TS defaults + gates | `@monrep/agent-skills#react-defaults` |
| Format + import polish | `@monrep/agent-skills#oxfmt` |
| DB / streams / codegen | `@monrep/agent-skills#codegen-electric`, `#tanstack-db` |

## License

MIT — see `package.json`.
