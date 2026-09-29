# `@monrep/agent` (`monrep`)

Outbound tunnel agent for one monrep control plane. The binary is dumb: product features (logs, CPU, charts, scripts) live in the Worker/UI and ride generic wire ops.

## Install (Linux)

Use **bash** (not `sh`. Ubuntu `/bin/sh` is dash and breaks `set -o pipefail`):

```bash
curl -fsSL https://monrep.dev/install | bash
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
bun run --cwd packages/main dev          # terminal A: https://localhost:5274
# UI → Add server → copy enroll token
bun run --cwd packages/agent local -- --token <token>   # terminal B
# already linked (run only; pass --token again to unlink + re-bind):
bun run --cwd packages/agent local
```

Override URL with `MONREP_CONTROL_URL` (default `https://localhost:5274`). CA via `MONREP_DEV_CA` or auto `certs/vite-dev-root.crt`. Iterate: edit Rust → ctrl-c → re-run `local` (cargo rebuilds).

## How to use

From the dashboard **Add server** flow, copy the minted command, then (production):

```bash
sudo monrep init --url https://your-app.example --token <one-time>
monrep status
```

`init` links the host (as root), writes the systemd unit, and `enable --now`. For foreground debug without systemd:

```bash
monrep link --url https://your-app.example --token <one-time>
monrep run
```

### Re-bind after revoke

App revoke deletes the cloud device credential only. The host still has `cred.json`, so a new enroll token will refuse until you clear it:

```bash
sudo monrep unlink   # clears cred.json (keeps config.json / auto-update prefs)
sudo monrep init --url https://your-app.example --token <new-token> --force
```

If the agent service is still running after revoke, token refresh returns `DeviceUnknown`: the agent clears `cred.json`, emits `not_enrolled`, and stops the retry loop. Then `init` / `link` again as above.

### Self-upgrade

- Auto-update is **on by default** (`~/.config/monrep/agent/config.json` → `auto_update`). Toggle:

```bash
monrep settings --auto-update false   # disable (prints settings path)
monrep settings                       # show current + path
monrep upgrade --check
monrep upgrade
```

- Release CI asserts `monrep --version` matches the tag / `Cargo.toml` so assets are never mis-stamped.
- For debugging a hung dial, disable auto-update first so the supervisor is not restarting on a bad loop.
- The control plane can push `config` / `update` wire ops (UI: Auto-update + Update now).

### systemd

Prefer `sudo monrep init …` (above). Manual unit install:

```bash
sudo cp packages/agent/systemd/monrep.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now monrep
```

`ExecStart` defaults to `/usr/local/bin/monrep run`. Production should use **root** for both `link`/`init` and the service so XDG creds match (`/root/.config/monrep/agent/`). Do not mix a normal-user `link` with a root unit.

## Local tests

Mock control plane (token + WSS hello/`run`/`result`) without Cloudflare:

```bash
bun run --cwd packages/agent test
# or: cargo test --all-targets
```

## Security

- **Main-only peer:** no local control API. Nothing else connects in.
- **Outbound only:** `run` dials the pinned control plane (HTTPS/WSS). No inbound bind.
- **1:1 binding:** one linked agent ↔ one `control_url`. Second link is refused until `monrep unlink`.
- **Device credential:** stored under the XDG config dir as `cred.json` mode `0600`. Secrets are never printed.

## Control-plane HTTP (main)

| Route | Body | Result |
| --- | --- | --- |
| `POST /api/agent/enroll` | `{ "token" }` | `{ deviceId, deviceSecret, controlUrl }` |
| `POST /api/agent/token` | `{ deviceId, deviceSecret }` | `{ accessToken, expiresAt }` |
| `GET /api/agent/ws` | Bearer access token | outbound WSS tunnel |

## Wire API

Envelope:

```json
{ "v": 1, "id": "…", "op": "hello|heartbeat|run|cancel|update|config|agent.health|metrics.*|result|error|event", "body": { } }
```

| Op | Direction | Role |
| --- | --- | --- |
| `hello` | agent → main | session hello (+ version) |
| `config` | main → agent | push `autoUpdate` + metrics prefs |
| `update` | main → agent | trigger self-update |
| `heartbeat` | both | liveness |
| `run` / `cancel` | main → agent | spawn / stop argv |
| `metrics.query` / `metrics.latest` / `events.query` | main → agent | local SQLite timeseries |
| `agent.health` | agent → main | health events |
| `result` / `error` / `event` | agent → main | outcomes + streams |

## CI

PRs that touch `packages/agent/**` run [`.github/workflows/agent-checks.yml`](../../.github/workflows/agent-checks.yml): `fmtcheck`, `lint:rust`, `typecheck:rust` (incl. miri), `doctor:rust`, `test`. Tag releases attach linux binaries via [`.github/workflows/release.yml`](../../.github/workflows/release.yml) and assert `monrep --version` matches the tag / `Cargo.toml`.

## Related

- Control plane app: [packages/main/README.md](../main/README.md)
- Brand / install script: root `brand.json` + `bun run sync:brand`
