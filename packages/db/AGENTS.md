# @monrep/db

Before touching DO schemas, collections, or generated files here, load:

`bunx @tanstack/intent@latest load @monrep/agent-skills#codegen-electric`

Never hand-edit `*.gen.ts`. After the hub, use `#tanstack-db` for live-query API details.

Pipeline: edit `src/do/*.ts` → `bun run codegen` → import from `@monrep/db/do`, `@monrep/db/types`, `@monrep/db/collections`.
