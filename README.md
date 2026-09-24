# monrep

Manage your server infra from one web page. Realtime.

You install a small CLI on the box (mostly Linux). That agent stays connected to the web app. From the browser you can do the stuff you’d normally SSH for: Docker containers, restarts, shell, logs, monitors. Later we plug in OpenTelemetry and more.

One control plane. Many servers. No jumping between terminals every time something breaks.

## The idea


| Piece                   | What it does                                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Web app**             | Dashboard. Live view. Trigger updates, restarts, open a shell, watch logs.                                                         |
| **CLI agent**           | Runs on the server as a single binary. Talks to the web app over a realtime channel. Executes what you ask.                        |
| **CI (GitHub for now)** | Builds images / binaries. When source changes you can push updates the same way CF / Vercel / Netlify feel — but for *your* fleet. |


You are not SSH’d into five machines at once. You open the page, pick a server, do the job.

## What you can do (goals)

- Create / start / stop / restart Docker containers  
- Run shell commands and see output **live**  
- Watch service logs in realtime; keep error history when you need it  
- Resource monitors (CPU, mem, etc.)  
- Disable one service or everything from the outside world when you need a kill switch  
- Later: OpenTelemetry inputs, richer metrics, alerts

Exact UI and CLI packaging are still moving — see [ROADMAP.md](./ROADMAP.md).

## Why this repo looks like a monorepo

Because the control plane is not a random Node script. We want:

- **TanStack Start** on Cloudflare (app + API + realtime in one deploy)  
- **Durable Streams** + TanStack DB for live state (containers, jobs, log tails)  
- A **publishable CLI** you `install` on the server, always connected back to that app

The packages under `packages/` are the building blocks for that path (web shell, db/stream codegen, UI, etc.). Product surface grows as the roadmap items land.

## Status

Early. Public so people can follow along and contribute. Expect breakage; expect the roadmap to move.

If you just cloned this: start from [ROADMAP.md](./ROADMAP.md) for “what exists vs what’s next,” then poke `packages/main` for the web app side.

**Realtime / DO streams** (how `createDoModule`, StreamDB, and the client hooks work — with examples and performance notes): **[packages/db/README.md](./packages/db/README.md)**.

## Local (dev)

```bash
bun install
bun run codegen   # when you touch DO / stream schemas (watch mode activated by default on dev)
bun run up        # upgrade bun, update all deps, sync upstreams if there any (stack helpers optional)
bun run ok        # check all health checks are passing (typecheck, lint, react-doctor)
bun run dev
```

Need Bun. Exact ports and env files will settle as the agent + control plane land — don’t treat this section as production install docs yet.

## CLI (coming)

Plan is roughly:

1. Build a single binary (Bun and/or Rust — TBD).
2. Ship it so you can install on Linux.
3. Agent connects to the control plane and waits.
4. Web UI sends work; agent runs it; streams results back.

Until that package is published, there is nothing to `curl | sh` yet. When it exists, install steps will live here and in the CLI package README.

## Contributing

Issues and PRs welcome. Keep changes lean.

Full rules (quality gates, import/polish house style, and **installing `/monrep` + Intent skills** for AI agents): **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

Short version: don’t hand-edit generated files under `packages/db` — change the source and run `bun run codegen`. Agent hard rules live in [`AGENTS.md`](./AGENTS.md); if you code with Cursor, run `bun run skills:install` and keep the **monrep** skill in sync.

## License

MIT — see `package.json`.

---

Built by [Ahmet Cevdet Öztürk](https://github.com/acoBOYZ).  
Questions or ideas → open an issue, or say hi in a PR.