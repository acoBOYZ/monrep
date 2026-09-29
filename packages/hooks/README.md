# `@monrep/hooks`

Shared React hooks. Import as source from apps and other packages.

## What’s inside

Main exports from `@monrep/hooks`:

- UI helpers: `useDisclosure`, `useHover`, `useClickOutside`, `useCopy`, `useMediaQuery`
- Storage / channel: `useLocalStorage`, `useBroadcastChannel`
- Document: `useDocumentHead`, `setDocumentTitle`, favicon helpers
- Motion / paint: `useAutoAnimate`, `useImpactOnChange`, `useAfterPaint`
- State: `useObjectReducer`, `useCoalescedPair`, `useLazyRef`, `useParallelQueue`
- Misc: `useAnchorInDocument`, object URL cache helpers

Peer: React 19.

## How to use

```ts
import { useDisclosure, useCopy } from "@monrep/hooks";
```

```bash
bun run --cwd packages/hooks typecheck
bun run --cwd packages/hooks lint
bun run --cwd packages/hooks fmt
```

## Related

- Runtime env hosts that sit on top of these hooks: [packages/runtime/README.md](../runtime/README.md)
- UI that consumes hooks: [packages/ui/README.md](../ui/README.md)
