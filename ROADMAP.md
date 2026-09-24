# Roadmap

Living checklist for monrep. Check things off when they ship. Order can change that’s fine.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Now / foundation

Work that makes the control plane possible without lying about “production ready.”

- [x] Monorepo shell (Bun, Turbo, packages)
- [x] Web app package (`packages/main`) — TanStack Start playground
- [x] Stream / DO module codegen (`createDoModule`, live collections)
- [x] Realtime stream path solid enough for dashboard live UI
- [ ] Control plane app shape clear (auth, orgs/servers list, no product Postgres required)
- [ ] Durable Streams on CF wired for control-plane collections (servers, agents, jobs)

---

## Control plane (web)

One page (ok, a few routes) that feels like “my fleet.”

- [ ] Server list: register / revoke machines
- [ ] Per-server overview (status, last seen, agent version)
- [ ] Docker panel: list containers, start / stop / restart
- [ ] Live shell: send commands, stream stdout/stderr
- [ ] Live logs: attach to a service; optional error history store
- [ ] Monitors: basic CPU / mem / disk (agent reports)
- [ ] Kill switch: disable one service or all public access from the UI
- [ ] Manual deploy / update trigger: talks to agent + CI artifacts

---

## CLI agent (server)

Install on Linux. Stays connected. Does the dirty work.

- [ ] Decide runtime (Bun compile vs Rust vs both) and publish story
- [ ] Single binary build in GitHub Actions
- [ ] Install docs (`README` + one-liner when ready)
- [ ] Persistent connection to control plane (WebSocket / stream)
- [ ] Exec: shell, docker compose / docker CLI wrappers
- [ ] Stream logs and command output back to the web app
- [ ] Self update when a new agent version ships
- [ ] Safe defaults: auth, least privilege, no open remote shell without you

---

## Ship & update loop

Feel like CF / Vercel for **your** servers.

- [ ] GitHub Actions build images / binaries (opaque, no monorepo source on the box)
- [ ] Agent can pull and roll a new image / binary
- [ ] Web UI: “deploy this” / “restart that” without SSH
- [ ] Caddy (or similar) on the box managed in a monorepo-friendly way: drop static nginx configs over time

---

## Observability (later)

- [ ] OpenTelemetry inputs (accept OTLP or scrape from agent)
- [ ] Error history searchable in the dashboard
- [ ] Alerts (webhook / email TBD)
- [ ] Deeper resource graphs

---

## Nice to have

- [ ] Multi-user / team permissions on the control plane
- [ ] Portal shell that feels like a real terminal in the browser
- [ ] Windows / macOS agents (Linux first)
- [ ] Mobile-friendly dashboard pass

---

## How we use this file

1. When you finish something, flip `[ ]` → `[x]` (or `[~]` while it’s half done).  
2. New big ideas go in the right section — don’t invent a second roadmap.  
3. README stays the pitch; **this file stays the truth of progress**.

Last intent: fleet control plane + Linux agent + live web. Everything else is detail.
