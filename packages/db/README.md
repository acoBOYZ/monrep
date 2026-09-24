# `@monrep/db` — DO modules & live streams

How realtime collections work in monrep.

**DO** here means **Durable Streams modules** (stream + StreamDB), not “Cloudflare Durable Object class name.” Schemas live under `packages/db/src/do/`. The browser talks to `/_streams/<moduleId>` on the Worker.

Package: [`packages/db`](./) · imports: `@monrep/db`, `@monrep/db/do`, `@monrep/db/stream`, …

---

## Mental model

```
one file in src/do/     = one stream module (one URL, one connection)
  └── collections.*     = many shapes on that same stream
        ↓ codegen (registry)
  createDoStreamDB      = transport + upsert/delete actions
        ↓ browser (auth layout only)
  StreamDbHost          = acquire modules → streamDbStore
  useStreamDb(id)       = db.collections + db.actions once ready
  useLiveQuery(db.col)  = live read on StreamDB collections directly
```

Modules today:

| Id | Role |
| --- | --- |
| `testm` | Playground presence (test only) |
| `auth` | `user` rows + role/capabilities (RBAC) |
| `audit` | `security` login attempts (ip, success, …) |

Example: `testm.ts` holds `presence` for the playground. Auth gates live in `packages/main` (session cookie + capabilities) — StreamDbHost mounts only under `_authenticated`.

There is **no** second TanStack mirror (`doCollection` / `createDoCollectionSync`). StreamDB already materializes TanStack collections — query those.

---

## Where things live

| Path | Role |
| --- | --- |
| [`src/do/*.ts`](./src/do/) | Hand-authored modules (`createDoModule`) — **edit these** |
| [`src/do/create-do-module.gen.ts`](./src/do/create-do-module.gen.ts) | Factory (from codegen template) |
| [`src/do/index.gen.ts`](./src/do/index.gen.ts) | `TDoModuleId`, `DO_MODULES`, `*DoSchema`, `DO_MODULE_LIVE` / `PERSIST` |
| [`src/collections/collections.do.gen.ts`](./src/collections/collections.do.gen.ts) | `DO_MODULE_DB_FACTORIES` + per-module `create*StreamDB` |
| [`src/types/index.gen.ts`](./src/types/index.gen.ts) | `TPresenceDo`, … |
| [`src/stream/`](./src/stream/) | Host, acquire, paths, Worker handler |

Never hand-edit `*.gen.ts`. Change a module file → `bun run codegen`.

---

## Define a module

File name **must** match the module id (`testm.ts` → `"testm"`).

```ts
// packages/db/src/do/testm.ts
import { z } from "zod";
import { createDoModule, doTable } from "./create-do-module.gen";

export default createDoModule("testm")({
  streamLive: "sse",
  streamPersist: false,
  collections: {
    presence: doTable({
      type: "presence",
      primaryKey: "userId",
      indexes: ["userId"],
      schema: {
        userId: z.ulid(),
        name: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
      },
      onInsert: ({ ctx }) => ({
        userId: ctx.ulid,
        createdAt: ctx.now,
        updatedAt: ctx.now,
      }),
      onUpdate: ({ ctx }) => ({
        updatedAt: ctx.now,
      }),
    }),
  },
});
```

Then: `bun run codegen`.

---

## Client: wire the host

Once at the app root (see `packages/main`):

```tsx
// packages/main/src/routes/_authenticated.tsx
import { StreamDbHost } from "@monrep/db/stream";

function AuthenticatedLayout() {
  return (
    <>
      <StreamDbHost />
      <Outlet />
    </>
  );
}
```

`StreamDbHost` acquires **every** module id, preloads StreamDB, and shares sessions across the tree (StrictMode-safe refcount).

Worker must mount streams (already hooked in main):

```ts
// packages/main/src/server/worker.ts (idea)
import { isStreamsPath } from "@monrep/db/stream/paths";
import { publicStreamsHandler } from "@monrep/db/stream/streams.server";
// route /_streams/* → publicStreamsHandler
```

Browser URL: `origin/_streams/<moduleId>` ([`browserStreamUrl`](./src/stream/paths.ts)).

---

## Client: read + write

Query StreamDB collections directly. Disable the live query until `db` is ready (`return null` from the query factory).

```tsx
import { useStreamDb } from "@monrep/db/stream";
import { SchemaValidationError, useLiveQuery } from "@tanstack/react-db";

function PresencePlayground() {
  const { db, isReady } = useStreamDb("testm");

  const live = useLiveQuery({
    query: (q) => {
      if (!db) return null;
      return q.from({ p: db.collections.presence }).orderBy(({ p }) => p.userId, "asc");
    },
  });

  const insert = () => {
    if (!db) return;
    // Omit audits — `onInsert` fills createdAt/updatedAt (and userId if empty).
    // Stream upserts parse the table schema and throw `SchemaValidationError` on failure
    // (catch + optional `toast.error` — see playground / useSafeMutation).
    try {
      db.actions.upsertPresence({ userId: "", name: "Ada" });
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        // toast.error(error.message)
        console.error(error);
      }
    }
  };

  const remove = (userId: string) => {
    if (!db) return;
    void db.actions.deletePresence(userId);
  };

  // …
}
```

Full playground: [`packages/main/src/routes/playground/presence.tsx`](../main/src/routes/playground/presence.tsx).

Open two tabs — both share the same stream; upserts show up live.

---

## SSR

**Stream modules: no dehydrate.** First paint waits until `useStreamDb` is ready, then `useLiveQuery` on `db.collections.*`. That is intentional — lean and correct for ephemeral realtime (presence, typing).

TanStack SSR (`dehydrate` / `HydrationBoundary`) only applies to collections owned by a request/browser `DbClient` via `collectionOptions` descriptors. StreamDB instances are not on that client, so hydrate cannot paint the same live query.

**Do not** reintroduce a StreamDB → TanStack mirror sync (`doCollection` / `createDoCollectionSync`). That dual path caused `DuplicateKeySyncError`.

**When SSR is worth building:** the first collection that is truly `collectionOptions` on `DbClient` (likely Electric/SQL):

1. Per-request `new DbClient()` → `preload()` or `preloadLiveQuery(...)` → `dehydrate()`
2. Browser: `DbProvider` + `HydrationBoundary` (app already keeps an empty `DbClient` for this)
3. Optional later: `@tanstack/react-router-with-db` + `useLiveSuspenseQuery` for Start streaming

A stream collection can join that recipe only if **reads** move onto the same descriptor (single owner) — not a second forever-sync mirror.

---

## Performance / cost (keep it lean)

| Choice | Effect |
| --- | --- |
| **One module = one connection** | Put shapes that always travel together in the same module. Don’t invent a module per tiny table. |
| **`streamLive: "long-poll"` (default)** | Catch-up then long-poll. Fine for many dashboards; less open sockets than SSE. CF long-poll wait is short (~2s) so you get frequent round-trips — expected. |
| **`streamLive: "sse"`** | One live SSE after catch-up. Better for chatty UIs (presence, typing). Costs a held connection per module per tab. |
| **`streamPersist: false` (default)** | No `sessionStorage`. Offset stays in memory for the open session (`Stream-Next-Offset`). Reload starts catch-up from `-1` (or whatever the stream still has). |
| **`streamPersist: true`** | Resume key `stream-resume:<moduleId>`. Survives reload in that tab. Only turn on when you need it — less storage chatter, clearer privacy. |
| **In-tab offset always** | Even without persist, the live consumer advances offset for the lifetime of the session. |
| **Host acquires all modules** | Today every module opens when the app mounts. Keep the module list small until we add lazy acquire. |
| **Actions append events** | Upsert/delete append to the stream; StreamDB materializes collections. `onInsert` / `onUpdate` gens fill unset fields (shared `applyDoWriteFields` — same helper future RPC middleware will call). |

Rule of thumb for the control plane: **few modules**, **many collections inside**, SSE only where the UI is actually live.

---

## Exports cheat sheet

```ts
import { /* schemas / DO_MODULE_* */ } from "@monrep/db";
import { StreamDbHost, useStreamDb } from "@monrep/db/stream";
import type { TDoModuleId, TPresenceDo } from "@monrep/db/types";
```

---

Back to the product pitch: [root README](../../README.md) · progress: [ROADMAP.md](../../ROADMAP.md).
