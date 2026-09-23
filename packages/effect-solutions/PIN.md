# effect-solutions pin

- Upstream: https://github.com/kitlangton/effect-solutions
- Commit: `09f82e6c5c928e7232cd32daf04d7c6a830b63f7` (short `09f82e6c5c92`, branch `origin/main`)

## Pin history

Previous pins we used in this monorepo (newest first). Kept so we can roll the submodule back safely.

<!-- effect-solutions-pin-history:start -->
<!-- effect-solutions-pin-history:end -->

## Upgrade

Run via `bun run scripts/stack/up-dev.ts` (calls `scripts/upgrade/upstream.ts`), or manually:

```bash
bun run scripts/upgrade/upstream.ts --only effect-solutions
```

On each successful tip change, `upgrade/upstream.ts` moves the previous pin into **Pin history** with an ISO timestamp.
