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
mod ops;
mod proto;
mod settings;
mod store;
mod supervisor;
mod tls;
mod tunnel;
mod update;

#[cfg(test)]
mod mock_cp_tests;

use clap::Parser;
use cli::Cli;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  let cli = Cli::parse();
  cli::run(cli).await
}
