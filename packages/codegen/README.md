# `@monrep/codegen`

Multi-package DO catalog generator. Discovers every `packages/*/codegen.config.ts` and emits gens into that package’s `outDir`.

## Commands

```bash
bun run codegen                      # all discovered packages
bun run codegen -- --package main    # one package by name
bun run --cwd packages/codegen watch
bun run --cwd packages/codegen watch -- --package main
```

Unknown `--package` names fail with the list of discovered packages.

## Config

[`defineConfig`](./src/config.ts) in the app package (paths relative to the config file):

```ts
import { defineConfig } from "@monrep/codegen/config";

export default defineConfig({
  doDir: "./src/db/do",
  outDir: "./src/db/codegen",
});
```

Fixed outputs under `outDir`:

| File | Role |
| --- | --- |
| `do.gen.ts` | `DO_MODULES`, epoch/live/persist/state |
| `types.gen.ts` | `T*Do` row types |
| `collections.gen.ts` | `DO_MODULE_DB_FACTORIES` |
| `bind.gen.ts` | `DO_BINDINGS` + `bindDoApp` |
| `host.gen.tsx` | `DOHost` + module-load `bindDoApp()` |
| `useStreamDb.gen.ts` | typed `useStreamDb` |

Public barrels next to `outDir` (created if missing, never overwritten): `host.ts`, `useStreamDb.ts`, `collections.ts`, `types.ts`.

`host.gen.tsx` calls `bindDoApp()` at module scope so importing `DOHost` binds before React hooks. `<DOHost />` is a stream **host** (acquires modules), not a context provider.

## Rules

- Edit hand modules under `doDir` (+ app schemas). **Never** edit `*.gen.ts` / `*.gen.tsx`.
- Safe to delete the entire `outDir` (e.g. `src/db/codegen/`). Rerun codegen to recreate gens + missing barrels.
- App code imports barrels only (`@/db/host`, `@/db/useStreamDb`, …). Never `@/db/codegen/*`.
- With `bun run --cwd packages/codegen watch`, deleting a public barrel under `dbRoot` recreates it via `ensureBarrels` (no full pipeline).

## Second Worker

1. Add `packages/<name>/codegen.config.ts` (`doDir` + `outDir`)
2. Add hand `src/db/do/*.ts` (+ schemas)
3. `bun run codegen -- --package <name>`
4. Client: `import { DOHost } from "@/db/host"` + mount `<DOHost />`. Server: `bindDoApp()` once.
