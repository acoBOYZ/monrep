# `@monrep/utils`

Pure helpers. No UI. Fine on Worker or client when the export allows it.

## What’s inside

| Import | Role |
| --- | --- |
| `@monrep/utils` | `cn`, time formatters, hash, base64, OS detect, search text, `tryCatch`, refs, … |
| `@monrep/utils/graceful` | Graceful shutdown / queue helpers |
| `@monrep/utils/ulid` | ULID helpers |

## How to use

```ts
import { cn, formatRelative, tryCatch } from "@monrep/utils";
import { nextUlid } from "@monrep/utils/ulid";
```

```bash
bun run --cwd packages/utils typecheck
bun run --cwd packages/utils lint
bun run --cwd packages/utils fmt
```

## Related

- UI `cn` consumers: [packages/ui/README.md](../ui/README.md)
- App: [packages/main/README.md](../main/README.md)
