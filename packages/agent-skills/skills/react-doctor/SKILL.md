---
name: react-doctor
description: >
  Run after making React changes to catch issues early. Use when reviewing code,
  finishing a feature, or fixing bugs in a React project.
metadata:
  type: lifecycle
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/react-doctor/SKILL.md'
  - 'monrep/monrep-mono:doctor.config.ts'
  - 'monrep/monrep-mono:apps/web/doctor.config.ts'
---

# React Doctor

Scans your React codebase for security, performance, correctness, and architecture issues. Outputs a 0-100 score with actionable diagnostics.

## Configuration

- Root `doctor.config.ts` exports `sharedDoctorConfig` + `defineConfig(...)` — universal rule baseline (`scope: "changed"` by default)
- Per-workspace `apps/web/doctor.config.ts` — `import { sharedDoctorConfig } from "../../doctor.config.ts"` + `defineConfig(...)`; override only when a package differs
- Docs: https://www.react.doctor/docs/configuration/config-files

## Usage

From **repo root** only:

```bash
bun run doctor
```

Root script: `env -u CODEX_CI bunx react-doctor --verbose`. File scope comes from config (`scope: "changed"`), not from per-package scripts.

Do **not** add package-level `doctor` scripts or an agent wrapper script.

## Workflow

After React changes, verify before finishing.

### 1. Typecheck

Prefer turbo / package `typecheck` scripts (they already pass the right flags).

```bash
# From repo root
turbo typecheck --filter=<package-name>

# Or inside the package
bun run typecheck
```

If you invoke `tsc` **directly** (not via turbo or a package `typecheck` script):

```bash
tsc --noEmit --singleThreaded
```

### 2. Lint (oxlint)

Root `bun lint` = `turbo run lint` (type-aware oxlint). Doctor skips adopting `.oxlintrc` (`adoptExistingLintConfig: false`).

```bash
# From repo root
turbo run lint --filter=<package-name>

# Or inside the package
bun run lint
```

### 3. react-doctor

Only for React-related edits (`.tsx`, hooks, providers, UI logic):

```bash
bun run doctor
```

Fix errors first, then re-run until clean (zero diagnostics). Target **100%** / no issues.
If you ever need to use useReducer use useObjectReducer from @react/hooks package.

## How to run (agents)

1. From repo root: `bun run doctor`.
2. Fix every diagnostic (including uncategorized).
3. **Forbidden:** interactive prompts; inventing per-package `doctor` scripts; hanging after the run finishes.
