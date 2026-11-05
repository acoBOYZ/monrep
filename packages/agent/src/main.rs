//! monrep — outbound tunnel agent (1:1 control plane).

#[path = "brand.gen.rs"]
mod brand;
mod cli;
mod config;
mod dispatch;
mod error;
mod health;
mod http;
mod init;
mod metrics;
mod ops;
mod proto;
mod pty_spec;
mod runtime;
mod settings;
mod store;
mod supervisor;
mod tls;
mod tunnel;
mod update;
mod version;
mod ws_url;

#[cfg(test)]
mod mock_cp_tests;

use clap::Parser;
use cli::Cli;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  let cli = Cli::parse();
  cli::run(cli).await
}
