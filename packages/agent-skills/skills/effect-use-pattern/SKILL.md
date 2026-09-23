---
name: effect-use-pattern
description: >
  Effect service `use` pattern for backend code—wrapping Promise-based third-
  party clients (SQL SDKs, cloud SDKs, fs) with interruption-safe callbacks.
  Use when integrating libraries into Effect services, or when the user
  mentions effect-use-pattern, service use pattern, or wrapping Prisma/Drizzle.
  Backend only.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/effect-use-pattern/SKILL.md'
  - 'monrep/monrep-mono:packages/effect-solutions/upstream/packages/website/docs/14-use-pattern.md'
---

# Effect service `use` pattern (backend only)

**Backend only** (`services/*`, `@core/*`). Do not edit
`packages/effect-solutions/upstream/`.

After load, read **one** doc:

[`packages/effect-solutions/upstream/packages/website/docs/14-use-pattern.md`](packages/effect-solutions/upstream/packages/website/docs/14-use-pattern.md)

Use this when wrapping multi-method Promise APIs (with `AbortSignal`) behind an
Effect service. For a few methods only, prefer per-method `Effect.tryPromise`.
