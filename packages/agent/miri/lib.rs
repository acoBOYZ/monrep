//! Host crate for `bun run rust:miri`.
//!
//! Pulls std-only agent source via `#[path]` so Miri exercises the same code
//! the binary uses: version compare and update-artifact names (`version`),
//! control-URL normalization and WebSocket mapping (`ws_url`), PTY
//! dimension/cwd validation (`pty_spec`), and metrics aggregation parse
//! (`query_agg`). No FFI, syscalls, tokio runtime IO, or sqlite.
#![cfg(test)]

#[path = "../src/version.rs"]
mod version;

#[path = "../src/ws_url.rs"]
mod ws_url;

#[path = "../src/pty_spec.rs"]
mod pty_spec;

#[path = "../src/metrics/query_agg.rs"]
mod query_agg;
