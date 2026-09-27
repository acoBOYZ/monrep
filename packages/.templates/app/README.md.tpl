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
- Playground: `/playground/streams`, `/playground/presence`, `/playground/terminal`
- DO catalog: `src/db/do/demo.ts` (presence · message · typing · line) → codegen → `@/db/host`
- Runtime hosts: `@monrep/runtime` (`ThemeEnv`, `NetworkEnv`, `TimerEnv`, `ViewportEnv`)

Never hand-edit `src/db/codegen/*` or import gens directly.
