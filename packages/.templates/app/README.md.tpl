# `{{package}}`

Showcase Worker app (TanStack Start + Durable Streams). Scaffolded via `bun run create:app {{name}}`.

## Setup

```bash
cp .dev.vars.example .dev.vars
bun run codegen -- --package {{name}}   # if gens missing
bun run cf-typegen
bun run generate-routes
bun run dev
```

- Sign in: `/login` (credentials from `.dev.vars`)
- Playground: `/playground/streams`, `/playground/presence`
- DO catalog: `src/db/do/` → codegen → `@/db/host` (`DOHost` / `bindDoApp`)

Never hand-edit `src/db/codegen/*` or import gens directly.
