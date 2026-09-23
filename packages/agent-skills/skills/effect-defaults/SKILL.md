---
name: effect-defaults
description: >
  Backend-only Effect guidance for this monorepo—Effect/Result/Schema in
  services/* and @core/*, typed errors, Layers, and doc routing to the pinned
  Effect Solutions manual. Use for API/DB Effect work, or when the user mentions
  Effect, Effect.tryPromise, Result, Schema.TaggedError, or effect-defaults.
  Do not load when a focused effect-* skill already matches. Not for React UI.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/effect-defaults/SKILL.md'
  - 'monrep/monrep-mono:packages/effect-solutions/upstream/packages/website/docs/03-basics.md'
  - 'monrep/monrep-mono:services/api/src/graceful.ts'
---

# Effect defaults (backend only)

Pinned field manual (git submodule — **do not edit** upstream):

[`packages/effect-solutions/upstream/packages/website/docs/`](packages/effect-solutions/upstream/packages/website/docs/)

## Scope (hard)

- **Backend only** — `services/*`, `@core/*`. Not React / `apps/web` UI.
- Prefer `effect` (`Effect`, `Result`, `Schema`) over inventing wrappers.
- After load: **read one** doc below. Never dump the docs tree.
- Repo setup / Effect LS / `effect-solutions` CLI (`00`–`02`, `13`) is out of scope for app code.
- Skip draft outline [`10-incremental-adoption.md`](packages/effect-solutions/upstream/packages/website/docs/10-incremental-adoption.md).

## Async → Result (this repo)

`Result` is sync-only (`Result.try`). Promises:

```ts
import { Effect, Result, pipe } from "effect";

const result = await pipe(
  Effect.tryPromise(() => someAsyncWork()),
  Effect.result,
  Effect.runPromise,
);

Result.match(result, {
  onSuccess: (value) => value,
  onFailure: (error) => {
    /* map to API response */
  },
});
```

See [`services/api/src/graceful.ts`](services/api/src/graceful.ts).

## Doc routing (read one)

| Topic | Doc |
|-------|-----|
| Basics (start here) | [`03-basics.md`](packages/effect-solutions/upstream/packages/website/docs/03-basics.md) |
| Services / Layers | Load `#effect-services` → [`04-services-and-layers.md`](packages/effect-solutions/upstream/packages/website/docs/04-services-and-layers.md) |
| Schema / data | Load `#effect-schema` → [`05-data-modeling.md`](packages/effect-solutions/upstream/packages/website/docs/05-data-modeling.md) |
| Errors / TaggedError | Load `#effect-errors` → [`06-error-handling.md`](packages/effect-solutions/upstream/packages/website/docs/06-error-handling.md) |
| Config | [`07-config.md`](packages/effect-solutions/upstream/packages/website/docs/07-config.md) |
| Testing | [`08-testing.md`](packages/effect-solutions/upstream/packages/website/docs/08-testing.md) |
| Project structure | [`09-project-structure.md`](packages/effect-solutions/upstream/packages/website/docs/09-project-structure.md) |
| HTTP clients | Load `#effect-http` → [`11-http-clients.md`](packages/effect-solutions/upstream/packages/website/docs/11-http-clients.md) |
| Observability | [`12-observability.md`](packages/effect-solutions/upstream/packages/website/docs/12-observability.md) |
| Service `use` pattern | Load `#effect-use-pattern` → [`14-use-pattern.md`](packages/effect-solutions/upstream/packages/website/docs/14-use-pattern.md) |

Prefer a **focused** `#effect-*` skill when the topic matches; this hub is the catch-all.

## Upgrade pin

```bash
bun run scripts/upgrade/upstream.ts --only effect-solutions
```
