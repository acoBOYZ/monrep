# `@monrep/agent` (`monrep`)

Outbound tunnel agent for one monrep control plane. The binary is dumb: product features (logs, CPU, charts, scripts) live in the Worker/UI and ride generic wire ops.

## Install (Linux)

Use **bash** (not `sh` — Ubuntu `/bin/sh` is dash and breaks `set -o pipefail`):

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

## Local (main + agent)

One entrypoint binds the agent to Vite main with the repo Vite CA (fixes `UnknownIssuer` on WSS) and turns off auto-update:

```bash
bun run setup:dev
bun run --cwd packages/main dev          # terminal A — https://localhost:5274
# UI → Add server → copy enroll token
bun run --cwd packages/agent local -- --token <token>   # terminal B
# already enrolled (daemon only; pass --token again to unenroll + re-bind):
bun run --cwd packages/agent local
```

Override URL with `MONREP_CONTROL_URL` (default `https://localhost:5274`). CA via `MONREP_DEV_CA` or auto `certs/vite-dev-root.crt`. Iterate: edit Rust → ctrl-c → re-run `local` (cargo rebuilds).

## How to use

From the dashboard **Add server** flow, copy the minted command, then:

```bash
monrep enroll --url https://your-app.example --token <one-time>
monrep status
monrep daemon   # supervised loop; ctrl-c to stop
```

### Re-bind after revoke

App revoke deletes the cloud device credential only. The host still has `cred.json`, so a new enroll token will refuse until you clear it:

```bash
monrep unenroll   # clears cred.json (keeps config.json / auto-update prefs)
monrep enroll --url https://your-app.example --token <new-token>
monrep daemon
```

If the daemon is still running after revoke, token refresh returns `DeviceUnknown`: the agent clears `cred.json`, emits `not_enrolled`, and stops the retry loop — then enroll again as above.
### Self-update

- Auto-update is **on by default** (`~/.config/monrep/agent/config.json` → `auto_update`). Toggle:

```bash
monrep config --auto-update false   # disable (prints settings path)
monrep config                       # show current + path
monrep update --check
monrep update
```

- Release CI asserts `monrep --version` matches the tag / `Cargo.toml` so assets are never mis-stamped.
- For debugging a hung dial, disable auto-update first so the supervisor is not restarting on a bad loop.
- The control plane can push `config` / `update` wire ops (UI: Auto-update + Update now).

### systemd (continuous daemon)

After enroll, install the unit from this package:

```bash
sudo cp packages/agent/systemd/monrep.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now monrep
```

`ExecStart` defaults to `/usr/local/bin/monrep daemon`. Adjust `User=` / paths if the binary or config dir is not root-owned.

## Local tests

Mock control plane (token + WSS hello/`run`/`result`) without Cloudflare:

```bash
bun run --cwd packages/agent test
# or: cargo test --all-targets
```

## Security

- **Main-only peer** — no local control API; nothing else connects in.
- **Outbound only** — `daemon` dials the pinned control plane (HTTPS/WSS). No inbound bind.
- **1:1 binding** — one enrolled agent ↔ one `control_url`. Second enroll is refused until `monrep unenroll`.
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

PRs that touch `packages/agent/**` run [`.github/workflows/agent-checks.yml`](../../.github/workflows/agent-checks.yml): `fmtcheck`, `lint:rust`, `typecheck:rust` (incl. miri), `doctor:rust`, `test`. Tag releases attach linux binaries via [`.github/workflows/release.yml`](../../.github/workflows/release.yml) and assert `monrep --version` matches the tag / `Cargo.toml`.

## Status

Phase 4: install.sh, release assets, self-update (CLI + auto + app). Phase 5+: Docker / PTY product surfaces.
