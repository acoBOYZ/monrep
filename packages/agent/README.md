# `@monrep/agent` (`monrep`)

Outbound tunnel agent for one monrep control plane. The binary is dumb: product features (logs, CPU, charts, scripts) live in the Worker/UI and ride generic wire ops.

## Install (Linux)

```bash
curl -fsSL https://app.monrep.com/install | bash
```

Downloads the latest `monrep-linux-x86_64` or `monrep-linux-aarch64` asset from GitHub Releases into `/usr/local/bin` (or `~/.local/bin`). Domains, install path, repo, and asset prefix live in **local** root `brand.json` (gitignored; start from [`brand.json.example`](../../brand.json.example)). `bun run setup:dev`, `bun run up`, builds, and CI all run `bun run sync:brand`.

Dev from this repo:

```bash
bun run --cwd packages/agent dev
# or release binary → packages/agent/dist/monrep
bun run --cwd packages/agent build
```

## How to use

From the dashboard **Add server** flow, copy the minted command, then:

```bash
monrep enroll --url https://your-app.example --token <one-time>
monrep status
monrep daemon   # supervised loop; ctrl-c to stop
```

### Self-update

- Auto-update is **on by default** (`config.json` → `autoUpdate`). Toggle from the server detail UI or:

```bash
monrep config --auto-update true|false
monrep update --check
monrep update
```

- The control plane can push `config` / `update` wire ops (UI: Auto-update + Update now).
- After a successful binary replace the process **re-execs** itself so the new binary keeps running.

## Security

- **Main-only peer** — no local control API; nothing else connects in.
- **Outbound only** — `daemon` dials the pinned control plane (HTTPS/WSS). No inbound bind.
- **1:1 binding** — one enrolled agent ↔ one `control_url`. Second enroll is refused.
- **Device credential** — stored under the XDG config dir as `cred.json` mode `0600`. Secrets are never printed.

## Control-plane HTTP (main)

| Route | Body | Result |
| --- | --- | --- |
| `POST /api/agent/enroll` | `{ "token" }` | `{ deviceId, deviceSecret, controlUrl }` |
| `POST /api/agent/token` | `{ deviceId, deviceSecret }` | `{ accessToken, expiresAt }` |
| `GET /api/agent/ws` | Bearer access token | outbound WSS tunnel |

## Wire API

Envelope:

```json
{ "v": 1, "id": "…", "op": "hello|heartbeat|run|cancel|update|config|agent.health|result|error|event", "body": { } }
```

| Op | Direction | Role |
| --- | --- | --- |
| `hello` | agent → main | session hello (+ version) |
| `config` | main → agent | push `autoUpdate` |
| `update` | main → agent | trigger self-update |
| `heartbeat` | both | liveness |
| `run` / `cancel` | main → agent | spawn / stop argv |
| `agent.health` | agent → main | health events |
| `result` / `error` / `event` | agent → main | outcomes + streams |

## CI

PRs that touch `packages/agent/**` run [`.github/workflows/agent-checks.yml`](../../.github/workflows/agent-checks.yml): `fmtcheck`, `lint:rust`, `typecheck:rust` (incl. miri), `doctor:rust`. Tag releases attach linux binaries via [`.github/workflows/release.yml`](../../.github/workflows/release.yml).

## Status

Phase 4: install.sh, release assets, self-update (CLI + auto + app). Phase 5+: Docker / PTY product surfaces.
