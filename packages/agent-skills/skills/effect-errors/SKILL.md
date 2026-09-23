---
name: effect-errors
description: >
  Effect error handling for backend code—Schema.TaggedError, typed failure
  channels, Result/Effect matching, static API error returns. Use when modeling
  domain errors, mapping Effect failures to HTTP, or when the user mentions
  TaggedError, effect-errors, or typed API errors. Backend only.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/effect-errors/SKILL.md'
  - 'monrep/monrep-mono:packages/effect-solutions/upstream/packages/website/docs/06-error-handling.md'
---

# Effect errors (backend only)

**Backend only** (`services/*`, `@core/*`). Do not edit
`packages/effect-solutions/upstream/`.

After load, read **one** doc:

[`packages/effect-solutions/upstream/packages/website/docs/06-error-handling.md`](packages/effect-solutions/upstream/packages/website/docs/06-error-handling.md)

Prefer `Schema.TaggedError` / typed failure channels over stringly `throw` /
ad-hoc `{ error: "..." }` bodies. Map once at the HTTP edge to stable status +
payload.
