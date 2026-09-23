---
name: effect-schema
description: >
  Effect Schema / data modeling for backend code—decode rows and payloads,
  branded types, Schema vs hand casts. Use when validating SQL/API shapes, or
  when the user mentions effect-schema, Schema.decode, or data-modeling.
  Backend only.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/effect-schema/SKILL.md'
  - 'monrep/monrep-mono:packages/effect-solutions/upstream/packages/website/docs/05-data-modeling.md'
---

# Effect Schema / data modeling (backend only)

**Backend only** (`services/*`, `@core/*`). Do not edit
`packages/effect-solutions/upstream/`.

After load, read **one** doc:

[`packages/effect-solutions/upstream/packages/website/docs/05-data-modeling.md`](packages/effect-solutions/upstream/packages/website/docs/05-data-modeling.md)

Raw Bun SQL still needs an explicit row type or Schema decode—Effect does not
infer SQL shapes. Prefer Schema decode for critical boundaries over unchecked
casts.
