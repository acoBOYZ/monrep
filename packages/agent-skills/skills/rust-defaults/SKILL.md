---
name: rust-defaults
description: >
  Default Rust quality gates for all first-party Rust crates in this
  monorepo (e.g. packages/agent, future crates)—rustfmt, clippy, cargo
  check, miri, doctor:rust (rust-doctor CLI). Use for any Cargo.toml/src
  under those crates, or when the user mentions rust, agent, clippy,
  doctor:rust, or rust-doctor. Never edit upstream/. Never run package
  build as a quality gate.
metadata:
  type: lifecycle
  library: agent-skills
  library_version: '0.5.2'
sources:
  - 'monrep/monrep-mono:packages/agent-skills/skills/rust-defaults/SKILL.md'
  - 'monrep/monrep-mono:packages/agent/package.json'
  - 'monrep/monrep-mono:packages/agent/rust-toolchain.toml'
  - 'monrep/monrep-mono:packages/agent/rust-doctor.toml'
---

# Rust defaults (this repo)

Quality gates for **all first-party Rust crates**. Today that includes
[`packages/agent`](packages/agent) (fleet CLI agent binary `monrep`); more
crates later use the same pattern.

## Naming

| What | Name |
| --- | --- |
| bun / turbo script | `doctor:rust` |
| CLI package / binary | `rust-doctor` |

Always invoke via `bun run doctor:rust` or
`bun run --cwd <crate> doctor:rust`. Do **not** tell agents to
`bun run rust-doctor`.

## After edits in a crate

From repo root, use that package’s scripts until clean (`<crate>` =
`packages/agent`, etc.):

```bash
bun run --cwd <crate> fmtcheck
bun run --cwd <crate> fmt   # if fmtcheck fails
bun run --cwd <crate> lint  # or lint:rust — see package.json
bun run --cwd <crate> typecheck  # or typecheck:rust
bun run doctor:rust         # or: bun run --cwd <crate> doctor:rust
```

- `fmt` / `fmtcheck`: package scripts (`oxfmt` where present + `cargo fmt`)
- `lint` / `lint:rust`: `cargo clippy --all-targets -- -D warnings` (+ oxlint where present)
- `typecheck` / `typecheck:rust`: `cargo check --all-targets` + `rust:miri` where defined
- `doctor:rust`: runs `rust-doctor --yes` (script already passes `--yes`). Do **not**
  invent a package `doctor` script.

Do **not** run package `build` / `build:rust` (`scripts/build.ts`) as a quality gate.

Do **not** skip this set. Do **not** invent one-off `cargo fmt` / `clippy`
commands that bypass the package scripts. Do **not** put these gates in
`react-defaults`.

## packages/agent miri

`rust:miri` uses nightly **only** for [`miri/`](packages/agent/miri/) (std-only
host). Do **not** add FFI / native deps to that host.

Config: [`rust-doctor.toml`](packages/agent/rust-doctor.toml). Toolchain:
[`rust-toolchain.toml`](packages/agent/rust-toolchain.toml) (stable).
