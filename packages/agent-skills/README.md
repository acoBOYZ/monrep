# `@monrep/agent-skills`

Workspace Agent Skills for TanStack Intent. Not a runtime dep of the web app. Agents load these for house rules (React, oxfmt, Rust, Cloudflare, …).

## What’s inside

Skills live under `skills/`. Examples:

- `react-defaults`, `react-doctor`, `oxfmt`, `tanstack-db`
- `rust-defaults`, `codegen-electric`
- Cloudflare set: `cloudflare`, `wrangler`, `durable-objects`, `agents-sdk`, …

Root [AGENTS.md](../../AGENTS.md) lists which skill to load for which task.

## How to use

Load one skill (from repo root or anywhere Intent can resolve the workspace package):

```bash
bunx @tanstack/intent@latest load @monrep/agent-skills#react-defaults
```

Validate / keep versions in sync:

```bash
bun run --cwd packages/agent-skills validate
bun run skills:check   # from repo root (see package.json / CONTRIBUTING)
```

If you use Cursor, install the **monrep** skill mirror: `bun run skills:install`. Keep it in sync when Intent entries in `AGENTS.md` change.

## Related

- Hard agent rules: [AGENTS.md](../../AGENTS.md)
- Contributing: [CONTRIBUTING.md](../../CONTRIBUTING.md)
