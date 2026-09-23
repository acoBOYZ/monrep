---
name: react-defaults
description: >
  Default React and TypeScript standards for this monorepo—architecture, lean
  size budgets, reuse-first workflow, useLiveQueries, accessibility, and quality
  gates. Use for any React/TS UI work, refactors, new components or hooks, or
  when the user mentions react-development, react-lean, or pre-commit checks.
metadata:
  type: core
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/react-defaults/SKILL.md'
  - 'monrep/monrep-mono:doctor.config.ts'
  - 'monrep/monrep-mono:apps/web/doctor.config.ts'
---

# React defaults (this repo)

## Technical stack

- React (latest stable patterns; React 19 where it improves UX/state flow)
- TypeScript — no `any`, no unsafe `as` casts; fix all TS and react-doctor findings (errors and warnings) until **100%** score. Prefer `turbo typecheck` / `bun run typecheck`. If you invoke `tsc` directly, use `tsc --noEmit --singleThreaded`.
- Modular components, shared hooks and providers
- Live data: `useLiveQueries` with joins when subscribing to multiple collections; avoid redundant subscriptions; structure queries to limit re-renders
- **TanStack DB details** (orderBy indexes, non-null sort keys, `useLiveInfiniteQuery`): load `@monrep/agent-skills#tanstack-db` — do not duplicate those rules here

## React standards

- Functional components and hooks only; no legacy lifecycle APIs
- Prefer composition and clarity over cleverness
- Follow existing provider, modal, and dropdown patterns in the app
- Preserve unrelated behavior; avoid regressions in context/detail flows
- Use the typesafe `useObjectReducer` hook instead of React's default `useReducer`
- Responsive UI; accessible (keyboard, focus, ARIA)

## React Compiler & react-doctor (do not repeat)

These rules come from real `react-doctor` / React Compiler failures in `app-web`. They are the most common categories—not an exhaustive fix list. **Every** doctor warning must be resolved, including items with no `category` field.

### Architecture

- **Name handlers by intent** — never `handleClick`, `handleChange`, or `handleSubmit` alone. Use names like `handleSidebarFeatureActivate`, `handleAddFeatureAtDate`, `handleCreateMarkerFromHover`.

### Correctness (SSR / hydration)

- **No live clock in render paths** — do not call `Date.now()` or bare `new Date()` inside `useMemo`, JSX, or callbacks invoked while building JSX (e.g. `renderHeaderItem` passed to a child that calls it in `useMemo`).
- **Calendar labels** — derive from integer year/month in `timelineData`; build formatted strings in `useMemo` and pass precomputed `cells` / labels to children instead of `new Date(...)` inside render props.
- **Relative time ("ongoing")** — snapshot once: `const [asOfMs] = useState(() => Date.now())` and use `new Date(asOfMs)` for `formatDistance`, not `new Date()` each render.
- **Optional dates in UI** — if state may be null, omit the label or use a fixed placeholder; do not fall back with `?? new Date()` in JSX.

### State & Effects

- **No synchronous `setState` in `useEffect`** for values you can derive during render (pagination clamp, focused index cap, clearing lists when a flag is false).
- **Reset UI on events**, not on `open` via effect — e.g. modal draft reset in `onOpenChange(true)` / open handler, dialog form reset in `handleOpenChange(true)`, not `useEffect([open])`.
- **Async-only in effects** — effects may `setState` in `.then` / subscriptions; do not `setState([])` synchronously at the top of an effect when you can derive `visibleItems = enabled ? items : []`.
- **Batch related resets** — use `useObjectReducer` `reset()` / `assign()` instead of multiple `setState` calls in one effect.
- **One network/state commit per effect** when syncing external data (e.g. location options: compute then single `setItems`).

### React Compiler — refs

- **Do not read or write `ref.current` during render** — not for hotkey `target`/`enabled`, not `displayedItemsRef.current = items` every render.
- **Hotkeys / DOM targets** — callback ref + `useState` for the element: `setRootRef` updates ref and `setHotkeyTarget(node)`.
- **Latest value for handlers** — sync ref in `useEffect([value])`, read ref only in event handlers.

### React Compiler — memoization & purity

- **`useMemo` / `useCallback` deps** — match what the compiler infers (e.g. depend on `user`, not only `user?.email`; depend on `context`, not only `context?.created_by`).
- **No impure `useMemo`** — no `Date.now()` inside memo bodies; snapshot time in state or compute expiry outside memo.
- **Avoid self-referential `useCallback`** — e.g. `removeEventListener("mouseup", handleMouseUp)` inside the same callback's body; prefer `{ once: true }`, a stable ref updated in `useEffect`, or split listeners.

### React Compiler — hooks style

- **No `try` / `finally` for control flow** in hooks — use `try` / `catch` and explicit cleanup after.
- **No `throw` for expected user errors** in hooks — `toast.error` + early `return`.
- **No `??` defaults on destructured hook parameters** — default in the function body so the compiler can analyze params.

## File discipline

- `.tsx` — UI only
- `.ts` — hooks, utilities, logic only
- Do not mix component + hook + utility exports in one file

## Architecture

- Components: modular, reusable, single responsibility; split complex UIs into composable pieces
- Hooks: shared logic only, no UI rendering
- Utilities: pure and isolated
- Before adding anything: search for existing component → hook → provider; create only if nothing fits

### Long lists and tables

Use `LazyItem` from `@react/ui/func` for scrollable row lists:

```tsx
<ul className="divide-y divide-border/60 overflow-hidden rounded-lg border">
  {rows.map((row) => (
    <LazyItem key={row.id} id="my-row-kind" recycle animate={false} minHeight={68}>
      <RowContent row={row} />
    </LazyItem>
  ))}
</ul>
```

- **`recycle`** + **`animate={false}`** for settings/admin lists
- Stable **`id`** per row kind (for bench/recycle)
- **`minHeight`** tuned to row content (~48–72px)
- For `<table>` rows, use **`asChild`** on `<tr>` (see `security-auth-activity-card.tsx`)

## `@core/shared` boundaries (never violate)

`@core/shared` is for **schemas, types, enums, permissions, and RPC contracts** only — not runtime utilities.

- **Never** add helper/utility modules under `@core/shared` (no `src/utils/`, no phone parsers, no spreadsheet helpers, no formatters).
- Put utilities in the **package that owns the behavior**:
  - API-only logic → `services/api/src/utils/`
  - Web-only logic → `apps/web/src/lib/` (or feature-local `utils/` when single-use)
  - Cross-package React helpers → `@react/utils`
- If two packages need the same small pure function, **duplicate** it (≤ ~40 LOC) or extract to the correct domain package — do **not** centralize in `@core/shared`.
- Importing `@core/shared` for `zod` schemas / table types is correct; importing it for `normalizeWaPhone`-style helpers is **wrong**.

## Lean mission (pre-commit mindset)

Minimize code while preserving behavior and UX unless the user asks otherwise. Reuse architecture first; prefer net-negative LOC when refactoring.

### Size budgets (targets)

- UI (`.tsx`): **≤ 220 lines** (split earlier if growing); hard ceiling **300 lines** before mandatory split
- Hook file: **≤ 180 lines**
- Utility file: **≤ 140 lines**
- Function body: **≤ 45 lines**
- Props per component: **≤ 12**
- New exported symbols in one change: **≤ 6**
- Per-file changed LOC: target **≤ 120** unless justified in the final report

### Lean rules

- No new abstraction without at least two call sites
- Prefer deletion over addition; remove dead code, unused props/exports/imports/constants/i18n keys
- Merge duplicated branches; dedupe handlers and derived state
- Extract repeated state/effects into reusable hooks
- Inline thin prop-only wrappers
- Keep conditional rendering shallow and explicit; prefer composition over prop explosion

### Reuse-first protocol

1. Search the codebase (`rg`) for equivalent behavior
2. Reuse or adapt an existing primitive
3. Add only when no safe reuse exists
4. After substantive refactors: note what was reused vs not reused (with reason)

### Refactor sequence

1. `git diff --stat` — tackle largest or most complex files first
2. Split mixed responsibility (UI vs logic)
3. Deduplicate handlers and derived state
4. Trim public API surface
5. Re-run quality gates until clean

## Quality gates (must pass)

After editing code, run checks **scoped to the workspace package(s) you changed**. Script names live in root / package `package.json` (`typecheck`, `lint`, `fmt` / `fmtcheck`). React doctor is root-only: `bun run doctor`. Oxfmt polish details: load `@monrep/agent-skills#oxfmt`.

### 1. Typecheck changed code

Prefer turbo / package `typecheck` scripts (they already pass the right flags).

From repo root (preferred — turbo scopes to affected packages):

```bash
turbo typecheck --filter=<package-name>
```

Or from the changed package directory:

```bash
bun run typecheck
```

Root fan-out: `bun typecheck` → `turbo typecheck`.

If you invoke `tsc` **directly** (not via turbo or a package `typecheck` script):

```bash
tsc --noEmit --singleThreaded
```

### 2. Lint changed code (oxlint)

Root `bun lint` is `turbo run lint`. Package `lint` runs oxlint with root `.oxlintrc.json` (`typeAware: true`, `--threads=1` — turbo already parallelizes packages). Doctor does **not** re-adopt that config.

Scoped from root:

```bash
turbo run lint --filter=<package-name>
```

Or from the changed package:

```bash
bun run lint
```

### 3. Format / polish (oxfmt)

Root fan-out (all packages in parallel via turbo):

```bash
bun run fmtcheck   # check what would change
bun run fmt        # apply polish
```

Single package:

```bash
bun run --cwd apps/web fmtcheck
bun run --cwd apps/web fmt
```

Polish only — not a substitute for typecheck/lint/doctor. Do not skip; do not rewrite root `fmt` / `fmtcheck`. Full skill: `@monrep/agent-skills#oxfmt`.

### 4. react-doctor (React-related changes only)

Run when you touched `.tsx`, React hooks, providers, or UI logic — skip for non-React packages (e.g. pure `@core/*` utilities with no React).

From **repo root**:

```bash
bun run doctor
```

Config: root `doctor.config.ts` (`scope: "changed"` by default); per-workspace overrides in e.g. `apps/web/doctor.config.ts`. **Target: 100% score, zero diagnostics** — not "good enough." No per-package `doctor` scripts.

- Fix **all** errors and warnings, including Performance, Dead Code, and any finding **without** a `category` (do not skip uncategorized items).
- Common categories (examples tied to rules above): `React Compiler`, `State & Effects`, `Architecture`, `Correctness` — but never stop after only those; the report is the source of truth.
- No interactive prompts; no hanging after the run finishes.

### Gate order

1. `typecheck` → 2. `lint` → 3. `fmtcheck` / `fmt` → 4. `doctor` (if React-related). Re-run until all pass.

## Final report (required for refactors / multi-file PRs)

- Net LOC: added, deleted, delta
- Files simplified and resulting sizes
- Reuse decisions (what existing code was reused or skipped and why)
- Splits performed and rationale
- Removed symbols (exports, props, utils)
- Any budget exceptions with justification
- Confirmation that all quality gates passed (react-doctor **100%**, zero diagnostics)
