# `@monrep/main`

Cloudflare Worker app (TanStack Start + Durable Streams). This is the **app package**. Schemas, DO modules, routes, and Worker entry live here. Shared runtime stays in `@monrep/db` / `@monrep/codegen`.

## Scripts

```bash
bun run --cwd packages/main dev
bun run --cwd packages/main typecheck
bun run --cwd packages/main build
bun run codegen -- --package main
```

## App DB catalog (`src/db` / `@/db`)

Hand code vs generated codegen for this Worker.

### Layout

```
src/db/
  schemas/          # HAND → rbac, capabilities
  do/               # HAND → createDoModule("…") files
  codegen/          # GEN → safe to delete; regenerate with bun run codegen
  host.ts           # barrel → DOHost + bindDoApp
  useStreamDb.ts    # barrel → typed hook
  collections.ts    # barrel → factories
  types.ts          # barrel → T*Do types
```

Never import `@/db/codegen/*` or `*.gen.ts` in app code.

### Pipeline

1. Edit `src/db/do/*.ts` and/or `src/db/schemas/`
2. `bun run codegen` (or `-- --package main`)
3. Wire the catalog:

**Client** — import + mount the host (not a provider). Importing `DOHost` runs `bindDoApp()` at module load so hooks like `useStreamsReady` see a bound catalog; `<DOHost />` only acquires streams.

```tsx
import { DOHost } from "@/db/host";

<DOHost />
```

**Worker / serverFn** — call `bindDoApp()` once (avoids pulling the React host into the isolate):

```ts
import { bindDoApp } from "@/db/host";

bindDoApp();
```

### Examples

#### Typed live query

```tsx
import { useStreamDb } from "@/db/useStreamDb";
import { useLiveQuery } from "@tanstack/react-db";

function Presence() {
  const { db, isReady } = useStreamDb("testm");
  const live = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ p: db.collections.presence }).orderBy(({ p }) => p.userId, "asc");
    },
  });
  if (!isReady) return null;
  return <pre>{JSON.stringify(live.data, null, 2)}</pre>;
}
```

#### Server write via factory

```ts
import { bindDoApp } from "@/db/host";
import { DO_MODULE_DB_FACTORIES } from "@/db/collections";
import type { TUserDo } from "@/db/types";

bindDoApp();

const db = DO_MODULE_DB_FACTORIES.auth({ stream });
await db.preload();
// db.collections.user / db.actions.upsertUser …
```

#### Add a module

1. Create `src/db/do/session.ts` with `export default createDoModule("session")({ … })`
2. `bun run codegen`
3. `useStreamDb("session")` / `DO_MODULE_DB_FACTORIES.session`

### Delete & regenerate

```bash
rm -rf packages/main/src/db/codegen
# optional: rm packages/main/src/db/{host,useStreamDb,collections,types}.ts
bun run codegen -- --package main
```

## Related

- [`@monrep/codegen` README](../codegen/README.md). CLI, config, multi-package
- [`@monrep/db` README](../db/README.md). DSL + stream runtime library
