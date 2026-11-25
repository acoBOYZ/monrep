<!-- intent-skills:start -->

# TanStack Intent - before editing files, run the matching guidance command.

tanstackIntent:

- id: "@monrep/agent-skills#react-defaults"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#react-defaults"
  for: "Default React and TypeScript standards for this monorepo—architecture, lean size budgets, reuse-first workflow, useLiveQueries, accessibility, and quality gates. Use for any React/TS UI work, refactors, new components or hooks, or when the user mentions react-development, react-lean, or pre-commit checks."
- id: "@monrep/agent-skills#react-doctor"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#react-doctor"
  for: "Run after making React changes to catch issues early. Use when reviewing code, finishing a feature, or fixing bugs in a React project."
- id: "@monrep/agent-skills#tanstack-db"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#tanstack-db"
  for: "TanStack DB / Electric collection conventions for this monorepo—useLiveQuery, useLiveInfiniteQuery, orderBy indexes, bootstrap createIndex, sync-safe pagination, and hard batch collection mutations (insert/update/delete arrays). Use when writing or debugging live queries, infinite lists, collection indexes, setWindow/load-more issues, collection.insert/update/delete, batch mutations, or when the user mentions tanstack-db, useLiveInfiniteQuery, createIndex, orderBy, or collection batch ops."
- id: "@monrep/agent-skills#codegen-electric"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#codegen-electric"
  for: "Singleton Electric/codegen pipeline—SQL+Electric bind, @core/shared schemas (tables/rpc/streams), db:diff→migrate→codegen, generated routes/types/collections under @react/db and API mounts under services/api/src/routes/crud|rcp. Load before editing **/\*.sql, @core/shared/src/schemas/**, @react/db/**, services/api/src/routes/crud/**, services/api/src/routes/rcp/**, or codegen scripts. Not for pure UI polish or unrelated React; use #tanstack-db for live-query API details after the hub."
- id: "@monrep/agent-skills#oxfmt"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#oxfmt"
  for: "Oxfmt polish only—readable formatting via turbo fmt/fmtcheck. Use after edits, before commit, or when the user mentions fmt, fmtcheck, oxfmt, polish, or formatting. Not a substitute for typecheck, lint, or react-doctor."
- id: "@monrep/agent-skills#rust-defaults"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#rust-defaults"
  for: "Default Rust quality gates for all first-party Rust crates in this monorepo (e.g. packages/whatsapp-rust, services/voice, future crates)—rustfmt, clippy, cargo check, miri, doctor:rust (rust-doctor CLI). Use for any Cargo.toml/src under those crates, voip/voice, or when the user mentions rust, rustwa, voice, clippy, doctor:rust, or rust-doctor. Never edit upstream/. Never run package build as a quality gate."
- id: "@monrep/agent-skills#wrangler"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#wrangler"
  for: "Wrangler CLI, wrangler.jsonc, wrangler types, deploy, D1, R2, or KV commands. Load before running or reviewing wrangler commands."
- id: "@monrep/agent-skills#workers-best-practices"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#workers-best-practices"
  for: "Writing or reviewing Cloudflare Worker handlers, bindings, or wrangler.jsonc anti-patterns."
- id: "@monrep/agent-skills#durable-objects"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#durable-objects"
  for: "Cloudflare Durable Objects, DO SQLite, alarms, or Durable Object WebSockets."
- id: "@monrep/agent-skills#agents-sdk"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#agents-sdk"
  for: "Cloudflare Agents SDK, apps/rai, or stateful agents on Workers."
- id: "@monrep/agent-skills#cloudflare-email-service"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#cloudflare-email-service"
  for: "Cloudflare Email Sending or Email Routing."
- id: "@monrep/agent-skills#sandbox-sdk"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#sandbox-sdk"
  for: "Cloudflare Sandbox SDK for isolated code execution."
- id: "@monrep/agent-skills#web-perf"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#web-perf"
  for: "Core Web Vitals, Lighthouse, or page-speed audits."
- id: "@monrep/agent-skills#modern-web-guidance"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#modern-web-guidance"
  for: "Modern web platform guidance for native HTML/CSS/JS APIs (dialogs, popovers, view transitions, forms, accessibility, security, sanitization, implementing CWV platform APIs). Load when implementing or modernizing those platform patterns. Do not load first for ordinary React/TS UI work—use react-defaults first. Do not load for Core Web Vitals / Lighthouse audits (use web-perf). Do not load for backend, infra, or tooling."
- id: "@monrep/agent-skills#how"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#how"
  for: "Code walkthroughs and placement questions—how a subsystem works, where something should live, which package owns it. Use for 'how does X work' before changing it. Not for design rationale or 'why we picked Y'."
- id: "@monrep/agent-skills#blast-radius"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#blast-radius"
  for: "Before shipping a change, find what it could break beyond the diff and prove the one safety fact by running real code. Use for 'blast radius of X', 'what could this break', or reviewing a small diff you don't trust. Work from the working tree; do not pull PRs or run arena/swarms. Not a substitute for react-doctor or lint."
- id: "@monrep/agent-skills#no-comments"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#no-comments"
  for: "Strip narrating comments and comment-backed workarounds from a scoped diff. Use when the user asks to remove comments or clean comment noise. The skill folder includes references/comment-sicko.md. Do not run git or unvendored pstack playbooks (architect, poteto-mode)."
- id: "@monrep/agent-skills#unslop"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#unslop"
  for: "Cut AI writing tells from prose (docs, explanations, commit or PR text). Use when editing writing or when another skill says to write through unslop. Not for code architecture."
- id: "@monrep/agent-skills#typescript-best-practices"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#typescript-best-practices"
  for: "TypeScript type-system patterns (discriminated unions, brands, no unchecked `as`, boundary parse, schema-derived types). Load for focused type-design work. Do not load first for ordinary React/TS UI—use react-defaults first (no redundant memo/useMemo; full useEffect deps). See #principle-type-system-discipline and #principle-boundary-discipline."
- id: "@monrep/agent-skills#principle-laziness-protocol"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-laziness-protocol"
  for: "Bias toward deletion and the smallest change when refactoring, judging diff size, or tempted to add abstractions or layers."
- id: "@monrep/agent-skills#principle-fix-root-causes"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-fix-root-causes"
  for: "When debugging, trace each symptom to the first wrong decision in the code and fix it there. Do not add symptom guards for states that should never exist."
- id: "@monrep/agent-skills#principle-subtract-before-you-add"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-subtract-before-you-add"
  for: "When sequencing an addition, refactor, or rewrite, remove dead code and redundancy first, then build on the simpler base."
- id: "@monrep/agent-skills#principle-prove-it-works"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-prove-it-works"
  for: "After finishing a task, verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy or 'it compiles.'"
- id: "@monrep/agent-skills#principle-type-system-discipline"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-type-system-discipline"
  for: "When designing types or reviewing signatures in a statically typed language: make illegal states unrepresentable, brand semantic primitives, parse at boundaries, exhaust variants, derive from schemas. For TypeScript syntax details use #typescript-best-practices."
- id: "@monrep/agent-skills#principle-boundary-discipline"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-boundary-discipline"
  for: "When wiring validation, error handling, or framework adapters: concentrate guards at system boundaries and trust internal types. Keep business logic in pure functions."
- id: "@monrep/agent-skills#principle-minimize-reader-load"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#principle-minimize-reader-load"
  for: "When reviewing or shaping hard-to-trace code: collapse one-caller wrappers and shrink mutable state so a reader can quickly find where X comes from and what can change it."
- id: "@monrep/agent-skills#cloudflare"
  run: "bunx @tanstack/intent@latest load @monrep/agent-skills#cloudflare"
  for: "Other Cloudflare platform products when no focused skill matches—KV, D1, R2, Tunnel, WAF, Pages, and similar. Do not load this when wrangler, durable-objects, agents-sdk, cloudflare-email-service, sandbox-sdk, workers-best-practices, or web-perf already matches."

<!-- intent-skills:end -->

## typecheck (hard)

- From repo root: `bun run typecheck` (`bun check`, then workspace `typecheck` scripts sequentially).
- One package: `bun run --cwd <package> typecheck` (or that package’s `typecheck` / `typecheck:rust` script). Package TS scripts use `bun check`.
- Fix errors until clean. Do **not** skip typecheck after TS/TSX or schema edits; do **not** rewrite root `typecheck`; do not invent one-off `tsc` / `bun check` commands that bypass package scripts.
- Rust crates: follow **rust-defaults (hard)** (`typecheck:rust`), not this TS gate alone.

## lint (hard)

- From repo root: `bun run lint` (`turbo run lint`, typically oxlint).
- One package: `bun run --cwd <package> lint` (use `lint:rust` / clippy only via **rust-defaults** for Cargo crates).
- Fix diagnostics until clean. Prefer `lint -- --fix` when the package script supports autofix for import member order; do **not** skip lint; do **not** rewrite root `lint`; do not invent one-off oxlint/eslint commands that bypass package scripts.

## oxfmt (hard)

- Polish only (`oxfmt`). Root: `bun run fmtcheck` (what would change) then `bun run fmt` (`turbo`, all packages in parallel).
- One package: `bun run --cwd <package> fmtcheck` / `bun run --cwd <package> fmt` (or `bun run fmt` inside that package).
- Do **not** skip polish; do **not** rewrite root `fmt` / `fmtcheck`; do not invent one-off format commands that bypass package scripts.

## react-doctor (hard)

- From repo root: `bun run doctor` (root `package.json`). Config: [`doctor.config.ts`](doctor.config.ts) (`scope: "changed"` by default; per-workspace overrides under `apps/*` / `@react/*`).
- Do **not** invent per-package `doctor` scripts or reintroduce an agent wrapper.
- Fix diagnostics until clean. **Forbidden:** interactive prompts; hanging after the run finishes; rewriting root `doctor` without being asked.

## rust-defaults (hard)

- Applies to **all first-party Rust crates** (today: [`packages/whatsapp-rust`](packages/whatsapp-rust), [`services/voice`](services/voice); more later). Not only rustwa.
- After edits in a crate, from repo root until clean (swap `<crate>` for the package path):
  - `bun run --cwd <crate> fmtcheck` then `fmt` if needed
  - `bun run --cwd <crate> lint` or `lint:rust` (per that package’s scripts)
  - `bun run --cwd <crate> typecheck` or `typecheck:rust`
  - `bun run doctor:rust` (root / turbo) or `bun run --cwd <crate> doctor:rust` — bun script name is **`doctor:rust`**; it runs the **`rust-doctor`** CLI with `--yes`. Do **not** invent a package `doctor` script; do **not** tell agents to `bun run rust-doctor`.
- **whatsapp-rust wrap only:** edit `packages/whatsapp-rust/src/` + wrap `Cargo.toml`. Toolchain: wrap [`rust-toolchain.toml`](packages/whatsapp-rust/rust-toolchain.toml) **stable**. Never merge with `upstream/` nightly. Never edit `upstream/`. Config: [`rust-doctor.toml`](packages/whatsapp-rust/rust-doctor.toml) — do **not** point rust-doctor at `upstream/`.
- Do **not** run package `build` / `build:rust` (`scripts/build.ts`) as a quality gate.
- `rust:miri` uses nightly **only** for each crate’s `miri/` host (std-only). Do not add FFI modules (LiveKit, rusty-opus, rusqlite, Ogg) to that host.
- Do **not** skip this set; do not invent one-off `cargo fmt` / `clippy` commands that bypass the package scripts.

## Cloudflare skills (lazy)

- Load via Intent when `for:` matches; never preload the set, never paste SKILL.md bodies or `references/` into this file.
- Load **one** matching skill (`bunx @tanstack/intent@latest load @monrep/agent-skills#<name>`). Load a second only if the task is both (e.g. new Worker + wrangler.jsonc).
- Do **not** load `#cloudflare` when a focused skill matches (`wrangler`, `durable-objects`, `agents-sdk`, `cloudflare-email-service`, `sandbox-sdk`, `workers-best-practices`, `web-perf`). `#cloudflare` is last-resort for other platform products (KV, D1, R2, Tunnel, WAF, Pages, …).
- After a skill is loaded, read **one** relevant `references/<file>` if needed. Never dump the platform `references/` tree.
- Upgrade: `bun run skills:cf-up && bun run skills:check`. Do not hand-edit vendored bodies.

## pstack skills (lazy)

- Load via Intent when `for:` matches; never preload the set, never paste SKILL.md bodies or `references/` into this file.
- Load **one** matching skill (`bunx @tanstack/intent@latest load @monrep/agent-skills#<name>`).
- These skills do not authorize git, PRs, GitHub posting, or parallel swarms. Repo hard rules win over pstack playbooks.
- For ordinary React/TS UI work, `#react-defaults` still wins over `#typescript-best-practices` (no redundant memo/useMemo; full useEffect deps).
- Upgrade: `bun run skills:pstack-up && bun run skills:check`. Do not hand-edit vendored bodies.

## Agent skills sync (hard)

- Root [`AGENTS.md`](AGENTS.md) is the source of truth for `tanstackIntent` + hard guidance sections.
- Cursor skill mirror: `~/.cursor/skills/monrep/SKILL.md` (user skill **monrep**).
- Whenever Intent entries or hard sections in this file change, **also update monrep** to match (same body after its YAML frontmatter).
- Package skills live in [`packages/agent-skills/skills/`](packages/agent-skills/skills/); check with `bun run skills:check` (version sync + stale). Do not run `intent validate` on the mixed tree — vendored Cloudflare skills fail Intent’s reference-link rules by design; [Intent v0.5.5](https://github.com/TanStack/intent/releases/tag/v0.5.5) `review.ignore` does not apply to validate.

## shell / background jobs (hard)

- Do **not** sit waiting on shell “healthcheck” / completion notifications. If a command was backgrounded, the result is often **already** in the terminals folder — read that file once and continue.
- **Forbidden:** long `AwaitShell` polls, repeated status checks, or idle turns while hoping for a notify. Prefer ending the turn and relying on the end-of-turn completion notification, or a single non-blocking read of the terminal output file.
- Size `block_until_ms` to expected runtime; when backgrounded, do not treat “no notify yet” as “still running” without checking the terminal file header/footer (`exit_code`, `running_for_ms`).

## Lean shipping mode (hard)

Lean shipping mode:

- Smallest change that solves the stated problem. No speculative abstractions.
- Reuse existing patterns/files before adding packages, layers, or helpers.
- No drive-by refactors, no unrelated fmt of the repo, no new docs unless asked.
- Prefer delete/simplify over add. If two designs work, pick the one with fewer files and fewer knobs.
- After edits: package fmt + typecheck + lint (and doctor / rust gates when those areas apply). Do not skip.
- Ask only when a decision changes architecture; otherwise choose the lean default and state it in one line.
- Generated docker files under `docker/` are outputs of `scripts/stack/generate-infra.ts`; edit only `docker/templates/` (and `@core/config` env), then re-render — never hand-edit generated compose/Caddy/Dockerfile/init SQL.

(Lean shipping mode continued) Defaults when unsure:

1. Extend existing module > new package
2. Explicit teardown/cleanup > clever global cache
3. Config env already present > new flag
4. Refuse new dependency unless compile/runtime pain is proven

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
