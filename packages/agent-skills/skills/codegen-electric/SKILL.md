---
name: codegen-electric
description: >
  Singleton Electric/codegen pipeline for this monorepo—SQL+Electric bind,
  @core/shared schemas (tables/rpc/streams), db:diff→migrate→codegen, generated
  routes/types/collections under @react/db. Use before editing **/*.sql,
  @core/shared/src/schemas/**, @react/db/**, services/api/src/routes/crud/**, services/api/src/routes/rcp/**, or codegen scripts; when adding a
  table/RPC/stream; or when the user mentions codegen, Electric bind, db:diff,
  db:migrate, or collections. Not for pure UI polish. After the hub, use
  #tanstack-db for live-query API details.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/codegen-electric/SKILL.md'
---

# Codegen + Electric (hub)

Single source of truth for the monorepo data pipeline. **Load this skill before**
editing SQL, shared Zod schemas, or `@react/db` collections/gens.

## Pipeline (only legal order)

1. Write / change table SQL under `@core/database/src/schemas/*.sql` (with Electric bind).
2. `bun run db:diff` then `bun run db:migrate`.
3. `bun run codegen` (SQL → types).
4. Define / update Zod under `@core/shared/src/schemas/{tables,rpc,streams}`.
5. `bun run codegen` again (routes, collections, exports).

Legal **writes**: `.sql` + Electric bind, schemas under `@core/shared/src/schemas/{tables,rpc,streams}`.
Legal **reads** for rows/RPC/collections/route mounts: generated types from `@core/shared` / `@react/db` / `services/api/src/routes/crud|rcp` gens only.

## Leaves (thin — load after hub when needed)

| Leaf | When |
| --- | --- |
| sql-electric-bind (future) | Table SQL + Electric publication/bind rules |
| shared-schema (future) | Zod folder placement (`tables` / `rpc` / `streams`) |
| collections (future) | Safe `@react/db` barrel exports |
| `#tanstack-db` (existing) | `useLiveQuery` / `useLiveInfiniteQuery`, `createIndex`, `setWindow` |

## Failure modes

### CRITICAL

1. Hand-edit `@react/db` gens, `*.gen.ts`, or API route gens (`services/api/src/routes/crud/routes.gen.ts`, etc.)
2. Invent parallel `T*` / DTO interfaces next to codegen
3. Skip pipeline order (`diff` → `migrate` → `codegen` → schema → `codegen`)
4. Table SQL without Electric bind
5. UI/mutate via raw SQL instead of generated collections
6. Import non-gen row/RPC types in apps

### HIGH

7. Schema under the wrong folder (`tables` / `rpc` / `streams`)
8. Live-query without `#tanstack-db` rules (`orderBy` index, `createIndex`, `setWindow`)
9. Touch gens then “fix types” instead of regenerating
10. Commit with stale gens (sql/schema ≠ output) — run codegen and diff
11. Load `#tanstack-db` but skip this hub when adding a table/RPC
12. Export collections outside the safe `@react/db` barrel
15. Cast/launder (`as T…`, `as any`, hand-built objects into collection mutate types) bypassing codegen/Zod

### MEDIUM

13. Paste this skill body into root `AGENTS.md`
14. Catch-all Intent `for:` that never gates sql / schemas / `@react/db` paths
