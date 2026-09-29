# `@monrep/runtime`

Client runtime env **hosts** and stores. Theme, network, timer, viewport. They return `null`. No children. Mount them next to the app tree (siblings), not as providers.

## What’s inside

| Import | Role |
| --- | --- |
| `@monrep/runtime` | Re-exports all subpaths |
| `@monrep/runtime/theme` | `ThemeEnv`, `storeTheme`, `setTheme`, bootstrap |
| `@monrep/runtime/network` | `NetworkEnv` + network store |
| `@monrep/runtime/timer` | `TimerEnv` + `storeTimer` (second tick, etc.) |
| `@monrep/runtime/view` | `ViewportEnv` + viewport store |

Depends on `@monrep/hooks` and `@tanstack/react-store`.

## How to use

Same pattern as [`packages/main/src/App.tsx`](../main/src/App.tsx):

```tsx
import { NetworkEnv, ThemeEnv, TimerEnv, ViewportEnv } from "@monrep/runtime";

<>
  <NetworkEnv />
  <ThemeEnv />
  <TimerEnv />
  <ViewportEnv />
  {children}
</>
```

Read stores with `@tanstack/react-store` `useSelector` where needed (example: `storeTimer` for relative times).

```bash
bun run --cwd packages/runtime typecheck
bun run --cwd packages/runtime lint
bun run --cwd packages/runtime fmt
```

## Related

- Hooks underneath: [packages/hooks/README.md](../hooks/README.md)
- App shell: [packages/main/README.md](../main/README.md)
