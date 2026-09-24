---
name: oxfmt
description: >
  Oxfmt polish for this monorepo—readable formatting, import statement sort via
  .oxfmtrc, then lint --fix for named import members. Use after edits, before
  commit, or when the user mentions fmt, fmtcheck, oxfmt, polish, formatting, or
  import order. Not a substitute for typecheck or react-doctor.
metadata:
  type: lifecycle
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/oxfmt/SKILL.md'
  - 'monrep/monrep-mono:.oxfmtrc.jsonc'
  - 'monrep/monrep-mono:.oxlintrc.json'
  - 'monrep/monrep-mono:turbo.json'
---

# Oxfmt (polish + import house style)

Oxfmt is **formatting / readability polish** — print width, indent, script layout,
and **import statement / group** order (`sortImports` in [`.oxfmtrc.jsonc`](.oxfmtrc.jsonc)).
It does **not** replace `typecheck`, `lint` (oxlint), or `doctor`.

Config: root [`.oxfmtrc.jsonc`](.oxfmtrc.jsonc) (`printWidth: 100`, `indentWidth: 2`).
Package scripts typically run `oxfmt src` / `oxfmt --check src` (some packages use
`scripts` instead of `src`).

## Import house style (write this way; polish enforces)

1. **Separate type imports** — always top-level `import type { … }`, never
   inline `import { type X }` (oxlint `prefer-type-imports` + `prefer-top-level`).
2. **Statement / group order** — oxfmt `sortImports` (node → react → npm →
   `@react`/`@core` → relatives → type mirror → `@/` last). See `.oxfmtrc.jsonc`.
3. **Named members `{ … }`** — oxfmt does **not** reorder these. Case-sensitive
   alphanumeric; **uppercase wins** (e.g.
   `STREAM_MODULE_IDS, acquireStreamModule, releaseStreamModule`). Enforced by
   oxlint `eslint/sort-imports` (`ignoreDeclarationSort: true`, `ignoreCase: false`).
4. **Generated** — never fmt or lint-fix `**/*.gen.ts` / `**/*.gen.*`.

After TS/TSX edits that touch imports (scoped to the package):

```bash
bun run --cwd <package> fmt
bun run --cwd <package> lint -- --fix
```

## When to run

- After substantive edits to a package (especially scripts and TS/TSX)
- Before committing, so polish is not left dirty
- When diffs look noisy from wrap/indent only — format instead of hand-fighting layout
- When import statement or named-member order may be dirty

## Root (all packages, parallel via turbo)

From repo root:

```bash
# Check what would change (no write) — preferred first
bun run fmtcheck

# Apply polish everywhere turbo knows about
bun run fmt
```

Root `package.json`: `fmt` → `turbo fmt`, `fmtcheck` → `turbo fmtcheck`.
Turbo runs each workspace’s `fmt` / `fmtcheck` **in parallel**.

## Single package

Prefer scoped polish when only one workspace changed:

```bash
bun run --cwd apps/web fmtcheck
bun run --cwd apps/web fmt

# Or from inside the package:
cd apps/web && bun run fmtcheck && bun run fmt
```

Same pattern for `@react/*`, `@core/*`, `services/*`, etc. — use that package’s
directory / workspace name with `--cwd`.

## Agent rules (hard)

1. **Polish only** — do not “fix” type errors or lint by reformatting; run the
   real gates for those. Named import members need `lint -- --fix`, not fmt alone.
2. **Prefer `fmtcheck` before `fmt`** when you need to see impact; then `fmt` to apply.
3. **Scope when possible** — one package → `bun run --cwd <package> fmt` / `fmtcheck`.
   Broad root `bun run fmt` when many packages changed or polish was skipped repo-wide.
4. **Do not rewrite** root `fmt` / `fmtcheck` scripts or invent per-file `oxfmt`
   one-offs that bypass package scripts (keeps scripts readable and consistent).
5. **Do not skip** — polish is part of the quality gate sequence; leaving
   unformatted scripts/source is a miss.
6. **Do not touch generated** — skip `**/*.gen.ts` / `**/*.gen.*` for fmt and
   lint `--fix`.

## Gate order (with other skills)

1. `typecheck` → 2. `fmtcheck` / `fmt` → 3. `lint` (add `-- --fix` if imports dirty) → 4. `doctor` (React only)

Load `@monrep/agent-skills#react-defaults` for architecture/lean; this skill for
oxfmt polish, import statement sort, and the fmt + lint `--fix` pair.
