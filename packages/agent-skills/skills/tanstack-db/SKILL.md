---
name: tanstack-db
description: >
  TanStack DB / Electric collection conventions for this monorepo—useLiveQuery,
  useLiveInfiniteQuery, orderBy indexes, bootstrap createIndex, and sync-safe
  pagination. Use when writing or debugging live queries, infinite lists,
  collection indexes, setWindow/load-more issues, or when the user mentions
  tanstack-db, useLiveInfiniteQuery, createIndex, or orderBy.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'kangrux/kangrux-mono:packages/agent-skills/skills/tanstack-db/SKILL.md'
  - 'kangrux/kangrux-mono:apps/web/src/bootstrap.ts'
---

# TanStack DB (this repo)

Live data uses `@tanstack/react-db` collections from `@react/db` (Electric). Indexes
are registered in `apps/web/src/bootstrap.ts` via `initCollections()`.

## Critical: `orderBy` + indexes (infinite / windowed queries)

**`orderBy` fields must be indexed, and they must be non-nullable columns.**

`useLiveInfiniteQuery` paginates with `setWindow`. That path only keeps loading
pages when the **first `orderBy` field** has a collection index that supports
range scans (`gt`). Without a matching index, load-more may work once (or not
at all) and then stop—`hasNextPage` dies after the first page.

Nullable order keys (e.g. `display_name`) break the ordered-load cursor: null
clusters make `loadMoreIfNeeded` underfill windows and drop the load-more
button after a small second page.

### Rules

1. **Index the first `orderBy` field** in `apps/web/src/bootstrap.ts`:
   ```ts
   c.waContactsCollection.createIndex((r) => r.name);
   ```
2. **Order by a non-null column** (required string/number/date—not `.nullish()` /
   `.optional()` in `@core/shared` schemas). Prefer `name`, `created_at`, `id`,
   `updated_at` over display labels that can be null.
3. **Add a stable tiebreaker** when values can collide:
   ```ts
   return query.orderBy(({ c }) => c.name, "asc").orderBy(({ c }) => c.id, "asc");
   ```
   The **first** `orderBy` is what must be indexed.
4. Mirror the working audit pattern: index `created_at` ↔ `orderBy created_at`.

### Anti-patterns

```ts
// BAD — nullable + often unindexed
.orderBy(({ c }) => c.display_name, "asc")

// GOOD — non-null + indexed in bootstrap
.orderBy(({ c }) => c.name, "asc").orderBy(({ c }) => c.id, "asc")
```

## Live query identity (`{ query }` only)

**Hard rule:** always call `useLiveQuery` / `useLiveInfiniteQuery` with a **config
object**. Prefer `{ query }` always. **`(fn, deps)` is forbidden** — it warns in
development and is removed in TanStack DB v1.

```ts
// FORBIDDEN
useLiveQuery((q) => q.from({ t: teamsCollection }).where(...), [teamId]);

// REQUIRED
useLiveQuery({
  query: (q) => q.from({ t: teamsCollection }).where(...),
});
```

## Shape with `.select` (hard)

**Hard rule:** project the row shape **inside the query** with `.select(...)`
(and joins / `materialize` as needed). **Do not** remap `live.data` after
`useLiveQuery`.

```ts
// FORBIDDEN — post-map DTO after the query
const live = useLiveQuery({
  query: (q) =>
    q.from({ p: organizationProfilesCollection }).where(...).findOne(),
});
return {
  ...live,
  data: live.data
    ? { org: { id: live.data.org_id, name: live.data.display_name ?? "" } }
    : undefined,
};

// REQUIRED — shape in `.select`, return the live query
return useLiveQuery({
  query: (q) =>
    q
      .from({ p: organizationProfilesCollection })
      .where(...)
      .select(({ p }) => ({
        org: {
          id: p.org_id,
          name: p.display_name ?? "",
          phone: p.phone ?? "",
          timezone: p.timezone,
        },
      }))
      .findOne(),
});
```

- `findOne()` → `data` is one row | `undefined` (not `data[0]`).
- List queries → `data` is always `T[]` (do not `?? []` when typed non-nullish).
- Domain derives that need calendar math / multi-source merge may run on
  **already-selected** rows; they must not invent the live row shape.

### Prop types from hooks (hard)

Do **not** hand-write nested live-row prop shapes. Derive them from the domain
hook return type so props stay strict with `.select`:

```ts
type Detail = NonNullable<ReturnType<typeof useSalonNutritionAssignment>["data"]>;
type Days = Detail["days"];
// props: { days: Days }
```

Identity is derived from structured query IR by default. Captured `eq` /
`inArray` / `ilike` values are part of the IR — no React deps array, and usually
no `queryKey`.

`useLiveQuery` may `return null` / `undefined` to disable (`if (!open) return null`).
Those gates are often not predicates; disabled vs built query is a different
identity (gate-only values like `kind` do **not** need `queryKey`).

### When to add `queryKey`

Use `queryKey` only for:

- opaque logic (`.fn.where` / `.fn.select` / `.fn.having`)
- idle vs live infinite identity
- hot paths where derived IR hashing is expensive (large `inArray`, big `or(ilike…)` trees)

**Important:** an explicit `queryKey` **disables** IR dep resolution. Identity
comes only from the key — put every value that should rebuild the query in
`queryKey`.

### Infinite disable — check upstream first

Before writing or changing a `useLiveInfiniteQuery` disable path, check
[TanStack/db#1729](https://github.com/TanStack/db/issues/1729):

```bash
gh issue view 1729 --repo TanStack/db --json state,closedAt,title
```

- **`OPEN`** (or `gh` / network failed): infinite callbacks **cannot** return
  `null`. Do **not** use `pageSize: 0` (DB normalizes it to `20` and still
  subscribes). Use the idle / `as never` patterns below.
- **`CLOSED`**: once the installed `@tanstack/react-db` types accept
  `QueryBuilder | null | undefined`, disable with `return null` (same as
  `useLiveQuery`). Then update **this skill** (drop the workarounds) and migrate
  `useMessageArchivePages`, `useLiveConversations`, and `useWaContacts`.

Do **not** bump `@tanstack/react-db` only because the issue closed. Confirm the
installed version actually supports nullable infinite callbacks.

While **#1729 is OPEN**, disable infinite queries like this (always keep `.orderBy`):

```ts
// GOOD — useLiveQuery: { query }; IR identity; disable gate; no deps / usually no queryKey
useLiveQuery({
  query: (q) => {
    if (!teamId || !open) return null;
    return q.from({ j: waAccountTeamsCollection }).where(({ j }) => eq(j.team_id, teamId));
  },
});

// GOOD — infinite, same row type: idle localOnly collection (useMessageArchivePages)
const idleArchiveCollection = createCollection(
  localOnlyCollectionOptions<TWaMessagesArchive>({
    id: "users:archive:idle",
    getKey: (row) => row.id,
  }),
);
useLiveInfiniteQuery({
  query: (q) => {
    if (!enabled) {
      return q.from({ msg: idleArchiveCollection }).orderBy(({ msg }) => msg.id_uuid, "desc");
    }
    return q.from({ msg: waMessagesArchiveCollection }).orderBy(({ msg }) => msg.id_uuid, "desc");
  },
  pageSize: 25,
  queryKey: enabled ? [conversationIdUuid] : ["idle"],
});

// GOOD — infinite, select shape ≠ idle table: impossible filter + `as never` (useLiveConversations)
useLiveInfiniteQuery({
  query: (q) => {
    if (!teamId || tab === "pinned") {
      return q
        .from({ j: waAccountTeamsCollection })
        .where(({ j }) => eq(j.team_id, "__no_team__"))
        .orderBy(({ j }) => j.id, "asc") as never;
    }
    return q
      .from({ j: waAccountTeamsCollection })
      .innerJoin(/* conversations + contacts + accounts */)
      .select(/* sidebar row */)
      .orderBy(({ c }) => c.last_activity_at, "desc");
  },
  pageSize: 25,
  queryKey: [teamId ?? "", tab],
});
```

## `useLiveInfiniteQuery` checklist

- [ ] Query always has `.orderBy(...)` (required for `setWindow`)
- [ ] First order field is non-null and indexed in `bootstrap.ts`
- [ ] `pageSize` is a real page size (never `0` — DB normalizes it to `20`)
- [ ] Disable: `return null` if [db#1729](https://github.com/TanStack/db/issues/1729)
  is closed **and** installed types allow it; otherwise idle localOnly, or
  impossible-filter + `as never` if the select type does not match (see above)
- [ ] UI: keep Load more visible while fetching (`hasNextPage || isFetchingNextPage`)
  so a stale `hasNextPage` during `setWindow` does not hide the button
- [ ] Prefer hook `data` (flat window) over reinventing page math when possible

## Collections & indexes

- Define schemas in `@core/shared` (types only—no utils)
- Collections are generated / created under `@react/db`
- Register query-critical indexes in `apps/web/src/bootstrap.ts` inside
  `initCollections()` (idempotent guard already present)
- Index filter columns used in hot `where` clauses (`org_id`, `team_id`,
  foreign keys) in addition to order keys
