<!-- intent-skills:start -->
# TanStack Intent - before editing files, run the matching guidance command.
tanstackIntent:
  - id: "@monrep/agent-skills#agents-sdk"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#agents-sdk"
    for: "Build, debug, or review Cloudflare Agents SDK applications using the agents package."
  - id: "@monrep/agent-skills#cloudflare"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#cloudflare"
    for: "Discover and choose Cloudflare products for apps, APIs, AI agents, storage, networking, and security. Use for architecture and product selection, including when the user describes a need without naming a Cloudflare product; then find the relevant skill or documentation."
  - id: "@monrep/agent-skills#cloudflare-email-service"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#cloudflare-email-service"
    for: "Implement or troubleshoot Cloudflare Email Sending and Email Routing integrations and their delivery configuration."
  - id: "@monrep/agent-skills#codegen-electric"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#codegen-electric"
    for: "Singleton Electric/codegen pipeline for this monorepo—SQL+Electric bind, @core/shared schemas (tables/rpc/streams), db:diff→migrate→codegen, generated routes/types/collections under @react/db. Use before editing **/*.sql, @core/shared/src/schemas/**, @react/db/**, services/api/src/routes/crud/**, services/api/src/routes/rcp/**, or codegen scripts; when adding a table/RPC/stream; or when the user mentions codegen, Electric bind, db:diff, db:migrate, or collections. Not for pure UI polish. After the hub, use #tanstack-db for live-query API details."
  - id: "@monrep/agent-skills#durable-objects"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#durable-objects"
    for: "Build, debug, or review Cloudflare Durable Objects code for persistent state and coordination."
  - id: "@monrep/agent-skills#oxfmt"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#oxfmt"
    for: "Oxfmt polish for this monorepo—readable formatting, import statement sort via .oxfmtrc, then lint --fix for named import members. Use after edits, before commit, or when the user mentions fmt, fmtcheck, oxfmt, polish, formatting, or import order. Not a substitute for typecheck or react-doctor."
  - id: "@monrep/agent-skills#react-defaults"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#react-defaults"
    for: "Default React and TypeScript standards for this monorepo—architecture, lean size budgets, reuse-first workflow, useLiveQueries, accessibility, import house style (separate type imports; fmt + lint --fix), and quality gates. Use for any React/TS UI work, refactors, new components or hooks, or when the user mentions react-development, react-lean, or pre-commit checks."
  - id: "@monrep/agent-skills#react-doctor"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#react-doctor"
    for: "Run after making React changes to catch issues early. Use when reviewing code, finishing a feature, or fixing bugs in a React project."
  - id: "@monrep/agent-skills#rust-defaults"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#rust-defaults"
    for: "Default Rust quality gates for all first-party Rust crates in this monorepo (e.g. packages/agent, future crates)— rustfmt, clippy, cargo check, miri, doctor:rust (rust-doctor CLI). Use for any Cargo.toml/src under those crates, or when the user mentions rust, agent, clippy, doctor:rust, or rust-doctor. Never edit upstream/. Never run package build as a quality gate."
  - id: "@monrep/agent-skills#sandbox-sdk"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#sandbox-sdk"
    for: "Build sandboxed applications for secure code execution. Load when building AI code execution, code interpreters, CI/CD systems, interactive dev environments, or executing untrusted code. Covers Sandbox SDK lifecycle, commands, files, code interpreter, and preview URLs. Biases towards retrieval from Cloudflare docs over pre-trained knowledge."
  - id: "@monrep/agent-skills#tanstack-db"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#tanstack-db"
    for: "TanStack DB / Electric collection conventions for this monorepo—useLiveQuery, useLiveInfiniteQuery, orderBy indexes, bootstrap createIndex, and sync-safe pagination. Use when writing or debugging live queries, infinite lists, collection indexes, setWindow/load-more issues, or when the user mentions tanstack-db, useLiveInfiniteQuery, createIndex, or orderBy."
  - id: "@monrep/agent-skills#web-perf"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#web-perf"
    for: "Audit, diagnose, or optimize website loading and interaction performance, Core Web Vitals, and Lighthouse performance scores."
  - id: "@monrep/agent-skills#workers-best-practices"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#workers-best-practices"
    for: "Cloudflare Workers best practices for production applications. Use when writing, reviewing, or configuring Workers."
  - id: "@monrep/agent-skills#wrangler"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#wrangler"
    for: "Run or troubleshoot Wrangler CLI commands and configure Worker projects for local development, deployment, and Cloudflare resource management."
<!-- intent-skills:end -->

## oxfmt (hard)

- Polish only (`oxfmt`). Root: `bun run fmtcheck` (what would change) then `bun run fmt` (`turbo`, all packages in parallel).
- One package: `bun run --cwd <package> fmtcheck` / `bun run --cwd <package> fmt` (or `bun run fmt` inside that package).
- Do **not** skip polish; do **not** rewrite root `fmt` / `fmtcheck`; do not invent one-off format commands that bypass package scripts.

## imports / polish (hard)

- Always use **top-level** `import type { … }` — never inline `import { type X }`. Matches `.oxlintrc` `prefer-type-imports` + `prefer-top-level`.
- When adding imports, follow house order **while writing** so fmt/lint stay clean:
  - **Statements / groups:** oxfmt `sortImports` (root [`.oxfmtrc.jsonc`](.oxfmtrc.jsonc)).
  - **Named members `{ … }`:** case-sensitive alphanumeric — **uppercase wins** (e.g. `STREAM_MODULE_IDS, acquireStreamModule, releaseStreamModule`). Enforced by oxlint `eslint/sort-imports` (`ignoreDeclarationSort: true`, `ignoreCase: false`).
- After TS/TSX edits (scoped to the package you changed):
  1. `bun run --cwd <package> fmt`
  2. `bun run --cwd <package> lint -- --fix` (member reorder lives here — oxfmt does **not** sort `{ … }` members)
- Do **not** fmt or lint-fix `**/*.gen.ts` / `**/*.gen.*` — leave generated alone (already ignored / rule-off in configs).
- Do not invent one-off format/lint commands that bypass package scripts. Full polish detail: load `@monrep/agent-skills#oxfmt`.

## react-doctor (hard)

- From repo root: `bun run doctor` (root `package.json`). Config: [`doctor.config.ts`](doctor.config.ts) (`scope: "full"` here; per-workspace overrides under `packages/*`).
- Do **not** invent per-package `doctor` scripts or reintroduce an agent wrapper.
- Fix diagnostics until clean. **Forbidden:** interactive prompts; hanging after the run finishes; rewriting root `doctor` without being asked.

## rust-defaults (hard)

- Applies to **first-party Rust crates** under `packages/*` (today: [`packages/agent`](packages/agent) — fleet CLI agent).
- After edits in a crate, from repo root until clean (swap `<crate>` for the package path):
  - `bun run --cwd <crate> fmtcheck` then `fmt` if needed
  - `bun run --cwd <crate> lint` or `lint:rust` (per that package’s scripts)
  - `bun run --cwd <crate> typecheck` or `typecheck:rust`
  - `bun run doctor:rust` (root / turbo) or `bun run --cwd <crate> doctor:rust` — bun script name is **`doctor:rust`**; it runs the **`rust-doctor`** CLI with `--yes`. Do **not** invent a package `doctor` script; do **not** tell agents to `bun run rust-doctor`.
- Do **not** run package `build` / `build:rust` as a quality gate.
- Do **not** skip this set; do not invent one-off `cargo fmt` / `clippy` commands that bypass the package scripts.

## Cloudflare skills (lazy)

- Load via Intent when `for:` matches; never preload the set, never paste SKILL.md bodies or `references/` into this file.
- Load **one** matching skill (`bunx @tanstack/intent@latest load @monrep/agent-skills#<name>`). Load a second only if the task is both (e.g. new Worker + wrangler.jsonc).
- Do **not** load `#cloudflare` when a focused skill matches (`wrangler`, `durable-objects`, `agents-sdk`, `cloudflare-email-service`, `sandbox-sdk`, `workers-best-practices`, `web-perf`). `#cloudflare` is last-resort for other platform products (KV, D1, R2, Tunnel, WAF, Pages, …).
- After a skill is loaded, read **one** relevant `references/<file>` if needed. Never dump the platform `references/` tree.
- Upgrade: `bun run skills:cf-up && bun run skills:check`. Do not hand-edit vendored bodies.

## Agent skills sync (hard)

- Root [`AGENTS.md`](AGENTS.md) is the source of truth for `tanstackIntent` + hard guidance sections.
- Cursor skill mirror: `~/.cursor/skills/monrep/SKILL.md` (user skill **monrep**).
- Whenever Intent entries or hard sections in this file change, **also update monrep** to match (same body after its YAML frontmatter).
- Package skills live in [`packages/agent-skills/skills/`](packages/agent-skills/skills/); validate with `bun run skills:check`.

## shell / background jobs (hard)

- Do **not** sit waiting on shell “healthcheck” / completion notifications. If a command was backgrounded, the result is often **already** in the terminals folder — read that file once and continue.
- **Forbidden:** long `AwaitShell` polls, repeated status checks, or idle turns while hoping for a notify. Prefer ending the turn and relying on the end-of-turn completion notification, or a single non-blocking read of the terminal output file.
- Size `block_until_ms` to expected runtime; when backgrounded, do not treat “no notify yet” as “still running” without checking the terminal file header/footer (`exit_code`, `running_for_ms`).

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
