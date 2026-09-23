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
  doCollection(mod,name) = SSR + useLiveQuery descriptor
  createDoStreamDB       = transport + upsert/delete actions
        ↓ browser
  StreamDbHost          = acquire modules → streamDbStore
  DbProvider / hydrate  = SSR snapshot on shared descriptors
  useLiveQuery(desc)    = paint hydrate → sync mirrors StreamDB → handoff
  useStreamDb(id)       = actions (mutations) once stream ready
```

Example: `session.ts` can hold `presence`, `typing`, `users` together. Same live transport, same offset, same connection.

---

## Where things live

| Path | Role |
| --- | --- |
| [`src/do/*.ts`](./src/do/) | Hand-authored modules (`createDoModule`) — **edit these** |
| [`src/do/create-do-module.gen.ts`](./src/do/create-do-module.gen.ts) | Factory (from codegen template) |
| [`src/do/index.gen.ts`](./src/do/index.gen.ts) | `TDoModuleId`, `DO_MODULES`, `*DoSchema`, `DO_MODULE_LIVE` / `PERSIST` |
| [`src/collections/collections.do.gen.ts`](./src/collections/collections.do.gen.ts) | Registry: `doCollection(...)` + factory map |
| [`src/types/index.gen.ts`](./src/types/index.gen.ts) | `TPresenceDo`, … |
| [`src/stream/`](./src/stream/) | Host, acquire, paths, Worker handler |

Never hand-edit `*.gen.ts`. Change a module file → `bun run codegen`.

---

## Define a module

File name **must** match the module id (`session.ts` → `"session"`).

```ts
// packages/db/src/do/session.ts
import { z } from "zod";
import { createDoModule } from "./create-do-module.gen";

export default createDoModule("session")({
  streamLive: "sse",          // or omit → "long-poll"
  streamPersist: false,       // true → sessionStorage resume across reloads
  // streamEpoch: "utc-hour", // optional rolling stream id window
  collections: {
    presence: {
      type: "presence",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
        name: z.string().optional(),
      },
    },
    typing: {
      type: "typing",
      primaryKey: "userId",
      schema: {
        userId: z.string(),
      },
    },
  },
});
```

Flags (`streamLive`, `streamEpoch`, `streamPersist`) sit **once** on the module. Adding another shape = another key under `collections`, not another file with the same module id.

Then:

```bash
bun run codegen
```

You get things like `PresenceDoSchema`, `TPresenceDo`, `DO_MODULE_DB_FACTORIES["session"]`, actions `upsertPresence` / `deletePresence`.

---

## Client: wire the host

Once at the app root (see `packages/main`):

```tsx
// packages/main/src/routes/__root.tsx
import { StreamDbHost } from "@monrep/db/stream";

function RootComponent() {
  return (
    <Fragment>
      <Outlet />
      <StreamDbHost />
    <Fragment>
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

```tsx
import { sessionPresenceCollection } from "@monrep/db/collections";
import { useStreamDb } from "@monrep/db/stream";
import { useLiveQuery } from "@tanstack/react-db";

function PresencePlayground() {
  const { db, isReady } = useStreamDb("session");

  // Shared descriptor → SSR hydrate paint, then StreamDB mirror handoff
  const live = useLiveQuery({
    query: (q) =>
      q.from({ p: sessionPresenceCollection }).orderBy(({ p }) => p.userId, "asc"),
  });

  const insert = () => {
    if (!db) return;
    void db.actions.upsertPresence({ userId: "ada", name: "Ada" });
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
| **Actions append events** | Upsert/delete append to the stream; StreamDB materializes collections. Not a replacement for huge analytical history — use epochs / GC when streams should roll. |

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
