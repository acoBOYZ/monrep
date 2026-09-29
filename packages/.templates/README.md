# `packages/.templates`

Seeds for new packages. Not a workspace package you import.

## What’s inside

| Folder | Role |
| --- | --- |
| `app/` | TanStack Start + Durable Streams Worker scaffold (`.tpl` files) |
| `upstream/` | Shared upstream seed bits |

`.tpl` files get filled with vars when you scaffold.

## Create a new app

```bash
bun run create:app <kebab-name>
```

Name must match `/^[a-z][a-z0-9-]*$/` (example: `playground`, `demo-app`).

Reserved names (and anything already under `packages/`): `.templates`, `agent`, `agent-skills`, `codegen`, `db`, `hooks`, `main`, `runtime`, `ui`, `utils`.

The script ([scripts/pkg/create-app.ts](../../scripts/pkg/create-app.ts)):

1. Copies `app/` into `packages/<name>`
2. Runs `bun install`
3. Runs codegen for that package
4. Runs `generate-routes` and `cf-typegen`

Then:

```bash
cp packages/<name>/.dev.vars.example packages/<name>/.dev.vars
bun run --cwd packages/<name> dev
```

Login: `/login`. Playground: `/playground/streams`.

## Template vars

| Var | Example |
| --- | --- |
| `{{name}}` | `playground` |
| `{{package}}` | `@monrep/playground` |
| `{{dev_port}}` | `5280` |

The generated app README comes from [app/README.md.tpl](./app/README.md.tpl).

## Related

- Worker cookbook: [packages/main/README.md](../main/README.md)
- Codegen: [packages/codegen/README.md](../codegen/README.md)
- Streams DSL: [packages/db/README.md](../db/README.md)
