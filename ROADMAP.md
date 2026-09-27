# Roadmap

Living checklist for monrep. Check things off when they ship. Order can change that’s fine.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done

---

## Now / foundation

Work that makes the control plane possible without lying about “production ready.”

- [x] Monorepo shell (Bun, Turbo, packages)
- [x] Web app package (`packages/main`). TanStack Start playground
- [x] Stream / DO module codegen (`createDoModule`, live collections)
- [x] Realtime stream path solid enough for dashboard live UI
- [x] Control plane app shape clear (auth, servers list, no product Postgres required)
- [x] Durable Streams on CF wired for control-plane modules (auth + agent: servers, enroll, device_cred, runtime_config, sample)
- [ ] Job / deploy collections on streams (later)

---

## Phased delivery

Order of product slices. Detail lives in the sections below.

### Phase 1–2 — Control spine `[x]`

Enroll / token / outbound WSS / async `run`+`cancel` / collector alarm → samples / stone backpressure. Server list + Ping smoke.

### Phase 3 — Server workspace `[x]`

- [x] Per-server detail (`/servers/$id`): status, device, last seen, agent version
- [x] Multi-tab line terminal (`@monrep/ui` Terminal + React `Activity`; background tabs stay live)
- [x] serverFn run / cancel; live output via samples keyed by `runId`
- [x] Collectors / `runtime_config` settings UI
- [x] Sample viewers + lean charts (monitor / error / overload)
- [x] Persist `agentVersion` from hello
- [x] Pending gate until enroll binds; hard revoke (danger-delete) removes fleet row

Out of Phase 3: `install.sh`, Docker lifecycle UI, true PTY.

### Phase 4 — Install & publish `[x]`

- [x] Install one-liner (`https://app.monrep.com/install`, from `brand.json` `installPath`)
- [x] Single-binary CI publish (GitHub Actions release assets)
- [x] Install docs (root README + `packages/agent` README)
- [x] Agent self-update (CLI + auto default on + app trigger)
- [x] Path-filtered Rust healthchecks on `packages/agent/**`

### Phase 5+ — Ops depth

- [ ] Docker panel: list containers, start / stop / restart
- [ ] True interactive PTY / portal shell (xterm-class)
- [ ] Kill switch: disable one service or all public access from the UI
- [ ] Manual deploy / update trigger: agent + CI artifacts
- [ ] Live logs attach to a service; searchable error history
- [ ] OpenTelemetry inputs, alerts, deeper graphs

---

## Control plane (web)

One page (ok, a few routes) that feels like “my fleet.”

- [x] Server list: register / revoke machines
- [x] Per-server overview (status, last seen, agent version) + pending gate
- [x] Live shell: multi-tab line terminal, run / cancel, samples by `runId`
- [ ] Docker panel: list containers, start / stop / restart (Phase 5+)
- [ ] Live logs: attach to a service; optional error history store (Phase 5+)
- [x] Monitors: collectors + samples + lean charts UI
- [ ] Kill switch: disable one service or all public access from the UI (Phase 5+)
- [ ] Manual deploy / update trigger: talks to agent + CI artifacts (Phase 5+)

---

## CLI agent (server)

Install on Linux. Stays connected. Does the dirty work.

- [x] Runtime: Rust `packages/agent` (binary `monrep`)
- [x] Single binary build in GitHub Actions (Phase 4)
- [x] Install docs (`README` + one-liner) / install route from `brand.json` (Phase 4)
- [x] Persistent outbound connection to control plane (WSS + supervisor reconnect)
- [x] Stone backpressure: bounded out queue, `MAX_RUNS`, line cap, pending TTL on DO
- [x] Exec: generic `run` / `cancel` (Worker owns argv; no agent product modules)
- [x] Stream command output back — frames → `sample` rows + web terminal
- [ ] Docker compose / docker CLI product wrappers (Phase 5)
- [x] Self update when a new agent version ships (Phase 4)
- [x] Safe defaults (Phase 1–2): enroll token, hashed device secret, HMAC access token, pinned `control_url`, no inbound bind

---

## Ship & update loop

Feel like CF / Vercel for **your** servers. (Mostly Phase 4–5.)

- [x] GitHub Actions build images / binaries (opaque, no monorepo source on the box) — Phase 4
- [x] Agent can pull and roll a new binary (Phase 4 self-update)
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
- [ ] True PTY portal shell in the browser (Phase 5+; Phase 3 uses line Terminal + tabs)
- [ ] Windows / macOS agents (Linux first)
- [ ] Mobile-friendly dashboard pass

---

## How we use this file

1. When you finish something, flip `[ ]` → `[x]` (or `[~]` while it’s half done).
2. New big ideas go in the right section. Don’t invent a second roadmap.
3. README stays the pitch; **this file stays the truth of progress**.

Last intent: fleet control plane + Linux agent + live web. Delivery order: Phase 5+ Docker/PTY/ops.
