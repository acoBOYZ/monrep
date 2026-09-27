//! monrep — outbound tunnel agent (1:1 control plane).

#[path = "brand.gen.rs"]
mod brand;
mod cli;
mod config;
mod dispatch;
mod error;
mod health;
mod http;
mod ops;
mod proto;
mod settings;
mod store;
mod supervisor;
mod tunnel;
mod update;

use clap::Parser;
use cli::Cli;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  let cli = Cli::parse();
  cli::run(cli).await
}
