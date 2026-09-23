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
    for: "TanStack DB / Electric collection conventions for this monorepo—useLiveQuery, useLiveInfiniteQuery, orderBy indexes, bootstrap createIndex, and sync-safe pagination. Use when writing or debugging live queries, infinite lists, collection indexes, setWindow/load-more issues, or when the user mentions tanstack-db, useLiveInfiniteQuery, createIndex, or orderBy."
  - id: "@monrep/agent-skills#codegen-electric"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#codegen-electric"
    for: "Electric/codegen pipeline (when restored)—schemas, migrate, codegen, collections under packages/db (@monrep/db). Load before editing **/*.sql, packages/db/**, or codegen scripts. Not for pure UI polish; use #tanstack-db for live-query API details after the hub."
  - id: "@monrep/agent-skills#oxfmt"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#oxfmt"
    for: "Oxfmt polish only—readable formatting via turbo fmt/fmtcheck. Use after edits, before commit, or when the user mentions fmt, fmtcheck, oxfmt, polish, or formatting. Not a substitute for typecheck, lint, or react-doctor."
  - id: "@monrep/agent-skills#rust-defaults"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#rust-defaults"
    for: "Default Rust quality gates for all first-party Rust crates in this monorepo (e.g. packages/whatsapp-rust, services/voice, future crates)—rustfmt, clippy, cargo check, miri, doctor:rust (rust-doctor CLI). Use for any Cargo.toml/src under those crates, voip/voice, or when the user mentions rust, rustwa, voice, clippy, doctor:rust, or rust-doctor. Never edit upstream/. Never run package build as a quality gate."
  - id: "@monrep/agent-skills#effect-defaults"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#effect-defaults"
    for: "Backend-only Effect guidance—Effect/Result/Schema in packages/* services when present, typed errors, Layers, doc routing to pinned Effect Solutions docs. Use for API/DB Effect work, or when the user mentions Effect, Effect.tryPromise, Result, or effect-defaults. Do not load when a focused effect-* skill already matches. Not for React UI."
  - id: "@monrep/agent-skills#effect-errors"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#effect-errors"
    for: "Effect error handling for backend—Schema.TaggedError, typed failure channels, static API error returns. Use when modeling domain errors, mapping Effect failures to HTTP, or when the user mentions TaggedError or effect-errors."
  - id: "@monrep/agent-skills#effect-services"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#effect-services"
    for: "Effect services and Layers for backend—Context Tag, Layer composition, injecting SQL/clients. Use when wiring services/Layers, or when the user mentions effect-services, Context.Tag, or Layer."
  - id: "@monrep/agent-skills#effect-schema"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#effect-schema"
    for: "Effect Schema / data modeling for backend—decode rows and payloads. Use when validating SQL/API shapes, or when the user mentions effect-schema, Schema.decode, or data-modeling."
  - id: "@monrep/agent-skills#effect-http"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#effect-http"
    for: "Effect HTTP clients for backend—typed outbound fetch and error channels. Use when wrapping HTTP in Effect, or when the user mentions effect-http or HttpClient."
  - id: "@monrep/agent-skills#effect-use-pattern"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#effect-use-pattern"
    for: "Effect service use pattern for backend—wrapping Promise-based third-party clients with interruption-safe callbacks. Use when integrating libraries into Effect services, or when the user mentions effect-use-pattern or service use pattern."
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
    for: "Cloudflare Agents SDK, packages/main, or stateful agents on Workers."
  - id: "@monrep/agent-skills#cloudflare-email-service"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#cloudflare-email-service"
    for: "Cloudflare Email Sending or Email Routing."
  - id: "@monrep/agent-skills#sandbox-sdk"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#sandbox-sdk"
    for: "Cloudflare Sandbox SDK for isolated code execution."
  - id: "@monrep/agent-skills#web-perf"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#web-perf"
    for: "Core Web Vitals, Lighthouse, or page-speed audits."
  - id: "@monrep/agent-skills#cloudflare"
    run: "bunx @tanstack/intent@latest load @monrep/agent-skills#cloudflare"
    for: "Other Cloudflare platform products when no focused skill matches—KV, D1, R2, Tunnel, WAF, Pages, and similar. Do not load this when wrangler, durable-objects, agents-sdk, cloudflare-email-service, sandbox-sdk, workers-best-practices, or web-perf already matches."
<!-- intent-skills:end -->

## oxfmt (hard)

- Polish only (`oxfmt`). Root: `bun run fmtcheck` (what would change) then `bun run fmt` (`turbo`, all packages in parallel).
- One package: `bun run --cwd <package> fmtcheck` / `bun run --cwd <package> fmt` (or `bun run fmt` inside that package).
- Do **not** skip polish; do **not** rewrite root `fmt` / `fmtcheck`; do not invent one-off format commands that bypass package scripts.

## react-doctor (hard)

- From repo root: `bun run doctor` (root `package.json`). Config: [`doctor.config.ts`](doctor.config.ts) (`scope: "full"` here; per-workspace overrides under `packages/*`).
- Do **not** invent per-package `doctor` scripts or reintroduce an agent wrapper.
- Fix diagnostics until clean. **Forbidden:** interactive prompts; hanging after the run finishes; rewriting root `doctor` without being asked.

## rust-defaults (hard)

- Applies to **first-party Rust crates** when present under `packages/*` (none in this slim tree yet). Not only rustwa.
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

## Effect skills (lazy)

- Backend only (`packages/*` services / Effect code) — not React UI.
- Load via Intent when `for:` matches; never preload the set; never paste SKILL.md or Effect Solutions doc bodies into this file.
- Load **one** matching skill (`bunx @tanstack/intent@latest load @monrep/agent-skills#<name>`). Load a second only if the task is both (e.g. errors + services).
- Do **not** load `#effect-defaults` when a focused skill already matches (`effect-errors`, `effect-services`, `effect-schema`, `effect-http`, `effect-use-pattern`). `#effect-defaults` is the catch-all / entry hub.
- After a skill is loaded, read **one** relevant file under [`packages/effect-solutions/upstream/packages/website/docs/`](packages/effect-solutions/upstream/packages/website/docs/). Never dump the docs tree.
- Docs come from the git submodule pin; upgrade with `bun run scripts/upgrade/upstream.ts --only effect-solutions`. Do **not** hand-edit `packages/effect-solutions/upstream/`.

## Agent skills sync (hard)

- Root [`AGENTS.md`](AGENTS.md) is the source of truth for `tanstackIntent` + hard guidance sections.
- Cursor skill mirror: `~/.cursor/skills/monrep/SKILL.md` (user skill **monrep**).
- Whenever Intent entries or hard sections in this file change, **also update monrep** to match (same body after its YAML frontmatter).
- Package skills live in [`packages/agent-skills/skills/`](packages/agent-skills/skills/); validate with `bun run skills:check`.
- Effect Solutions docs pin: `packages/effect-solutions/upstream` — upgrade via `bun run scripts/upgrade/upstream.ts --only effect-solutions` (do not hand-edit upstream docs).

## shell / background jobs (hard)

- Do **not** sit waiting on shell “healthcheck” / completion notifications. If a command was backgrounded, the result is often **already** in the terminals folder — read that file once and continue.
- **Forbidden:** long `AwaitShell` polls, repeated status checks, or idle turns while hoping for a notify. Prefer ending the turn and relying on the end-of-turn completion notification, or a single non-blocking read of the terminal output file.
- Size `block_until_ms` to expected runtime; when backgrounded, do not treat “no notify yet” as “still running” without checking the terminal file header/footer (`exit_code`, `running_for_ms`).
