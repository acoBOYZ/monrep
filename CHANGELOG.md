# Changelog

All notable changes to this project are documented in this file.

## [0.7.1] - 2026-09-28

### 🐛 Bug Fixes

- Agent loop gets real ops: PTY + Docker/Services + fleet charts. playground/`testm` out. session WS bridges browser ↔ agent. by @acoBOYZ

- Install one-liner pipes to `bash`, not `sh` (script is bash + `set -euo pipefail`). by @acoBOYZ

- Required check needs run by @acoBOYZ

- Per-deploy brand config. install URL / assets / CSP come from local `brand.json`, not hardcoded workers.dev. by @acoBOYZ

- Per-deploy brand config. install URL / assets / CSP come from local `brand.json`, not hardcoded workers.dev. by @acoBOYZ


### ⚙️ Miscellaneous Tasks

- Merge pull request #38 from acoBOYZ/fix-agent-loop by @acoBOYZ in #38

- Merge pull request #37 from acoBOYZ/fix-install-command-as-bash by @acoBOYZ in #37

- Merge pull request #36 from acoBOYZ/chore-drop-env by @acoBOYZ in #36

- Drop fixed env by @acoBOYZ

- Merge pull request #35 from acoBOYZ/chore-branding-domain by @acoBOYZ in #35

- Domain branding by @acoBOYZ

- Merge pull request #34 from acoBOYZ/fix-agents-checks by @acoBOYZ in #34

- Close agent checks on actions for main by @acoBOYZ

- Merge pull request #33 from acoBOYZ/fix-monrep-statics by @acoBOYZ in #33

- Forgatten fmt by @acoBOYZ


## [0.7.0] - 2026-09-27

### 🚀 Features

- Big one: Linux `monrep` agent + control-plane fleet UI. streams split client/server. effect-solutions out. by @acoBOYZ

- Big one: Linux `monrep` agent + control-plane fleet UI. streams split client/server. effect-solutions out. by @acoBOYZ

- *(template)* `bun run create:app <name>` scaffolds a second Worker from `packages/.templates/app`. by @acoBOYZ


### 🎨 Styling

- Public landing page + auth UI tidy. copy button grows a `block` variant. by @acoBOYZ


### ⚙️ Miscellaneous Tasks

- Merge pull request #31 from acoBOYZ/feat-agent-cli by @acoBOYZ in #31

- Merge pull request #30 from acoBOYZ/style-ui-polish by @acoBOYZ in #30

- Merge pull request #29 from acoBOYZ/security-enrol-totp-if-passkey-available by @acoBOYZ in #29

- Passkey verify: full session if TOTP already on; otherwise force `enroll_totp`. no more totp challenge after a good passkey. by @acoBOYZ

- Merge pull request #28 from acoBOYZ/security-more-layers by @acoBOYZ in #28

- Admin login gets real layers: Turnstile → password → TOTP → passkey. pending cookies between steps. by @acoBOYZ

- Merge pull request #27 from acoBOYZ/feat-new-app-template by @acoBOYZ in #27


## [0.6.0] - 2026-09-25

### 🚀 Features

- *(monrep)* New-codegen-layer by @acoBOYZ


### 🐛 Bug Fixes

- *(cli)* Richer git-cliff changelogs: `@user`, `#PR`, New Contributors. include non-conventional commits. by @acoBOYZ

- *(codegen)* Stop side-effect `import "@/db/registry"`. explicit host bind: client `DOHost`, server `bindDoApp()`. by @acoBOYZ

- Forgotten fmt by @acoBOYZ

- *(monrep)* Tiny polish + stream typing cleanup. bump durable-streams long-poll wait. by @acoBOYZ


### ⚙️ Miscellaneous Tasks

- Merge pull request #25 from acoBOYZ/fix-cliff by @acoBOYZ in #25

- Merge pull request #24 from acoBOYZ/fix-db-registry-sideeffects by @acoBOYZ in #24

- Merge pull request #23 from acoBOYZ/feat-new-codegen-layer by @acoBOYZ in #23

- Merge pull request #22 from acoBOYZ/fix-small by @acoBOYZ in #22


## [0.5.0] - 2026-09-25

### 🚀 Features

- *(main)* Add monrep favicon and app icons

### 🐛 Bug Fixes

- Partial stream upserts were wiping `createdAt` (StreamDB replaces the row). preserve audits on update.
- *(db)* Preserve createdAt on stream upsert updates

## [0.4.8] - 2026-09-24
