# `@monrep/ui`

Shared UI. React + Tailwind. Consumed as **source** by apps (no build step in this package).

## What’s inside

| Import | Role |
| --- | --- |
| `@monrep/ui/base` | Primitives: Button, Input, Table, Badge, Dialog, … |
| `@monrep/ui/components` | Higher-level composed pieces |
| `@monrep/ui/func` | Functional UI: `ImpactFlash`, virtualizers, … |
| `@monrep/ui/terminal` | Terminal surface |
| `@monrep/ui/globals.css` | Design tokens + base styles |

## How to use

In the app CSS (see `packages/main/src/tailwind.css`):

```css
@import "tailwindcss";
@import "@monrep/ui/globals.css";
```

Apps use `@tailwindcss/vite`. That scans workspace source, including this package, so you do not maintain a separate old-style `content: []` list of dead packages.

```tsx
import { Button } from "@monrep/ui/base";
import { ImpactFlash } from "@monrep/ui/func";

<Button variant="outline">Refresh</Button>
```

```bash
bun run --cwd packages/ui typecheck
bun run --cwd packages/ui lint
bun run --cwd packages/ui fmt
```

## Related

- Hooks used inside UI: [packages/hooks/README.md](../hooks/README.md)
- Utils (`cn`, …): [packages/utils/README.md](../utils/README.md)
- Main app: [packages/main/README.md](../main/README.md)
