---
name: effect-http
description: >
  Effect HTTP clients for backend code—typed outbound fetch, retries, and
  error channels. Use when wrapping HTTP calls in Effect, or when the user
  mentions effect-http, HttpClient, or Effect fetch. Backend only.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/effect-http/SKILL.md'
  - 'monrep/monrep-mono:packages/effect-solutions/upstream/packages/website/docs/11-http-clients.md'
---

# Effect HTTP clients (backend only)

**Backend only** (`services/*`, `@core/*`). Do not edit
`packages/effect-solutions/upstream/`.

After load, read **one** doc:

[`packages/effect-solutions/upstream/packages/website/docs/11-http-clients.md`](packages/effect-solutions/upstream/packages/website/docs/11-http-clients.md)

Prefer Effect HTTP client patterns over bare `fetch` + untyped catch when the
call site needs typed failures and composition.
