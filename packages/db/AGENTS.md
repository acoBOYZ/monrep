# @monrep/db

Library: DO module DSL (`@monrep/db/module`), stream runtime, and `bindDoRegistry`.

App catalogs live in each Worker package under `src/db/` (`do/` + `schemas/` hand; `codegen/` gen).

Pipeline:

1. Edit `packages/<app>/src/db/do/*.ts` (+ schemas as needed)
2. `bun run codegen` or `bun run codegen -- --package <app>`
3. Import `@/db/registry` once at app entry (binds gens into `@monrep/db`)

Safe to delete `src/db/codegen/` and rerun codegen. Never hand-edit `*.gen.ts`.

Second Worker: add `codegen.config.ts` (`doDir` + `outDir`) + `src/db/do` — codegen discovers it automatically.

Cookbooks: [`packages/codegen/README.md`](../codegen/README.md), [`packages/main/README.md`](../main/README.md).

Before deep changes, load:

`bunx @tanstack/intent@latest load @monrep/agent-skills#codegen-electric`

After the hub, use `#tanstack-db` for live-query API details.
