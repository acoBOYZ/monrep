# `@monrep/db`: Stream runtime + DO DSL

Library package (copy-pasteable). App catalogs live in Worker packages (e.g. `packages/main`).

**DO** = Durable Streams module (stream + StreamDB), not a Cloudflare DO class name.

## Imports

| Path | Role |
| --- | --- |
| `@monrep/db/module` | `createDoModule` / `doTable` DSL |
| `@monrep/db/registry` | `bindDoRegistry` / `getDoRegistry` |
| `@monrep/db/collections` | `createDoStreamDB`, stream action helpers |
| `@monrep/db/stream` | `StreamDbHost`, acquire, paths (needs bind) |

## App pipeline

1. Define modules in `packages/<app>/src/db/do/*.ts`
2. `bun run codegen` → gens under `src/db/codegen/` + public barrels
3. Import `@/db/registry` once at entry

App cookbook (examples): [`packages/main/README.md`](../main/README.md).  
CLI / config: [`packages/codegen/README.md`](../codegen/README.md).

See [`AGENTS.md`](./AGENTS.md).
