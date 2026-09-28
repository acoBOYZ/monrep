//! Shared error types for the agent binary.

use thiserror::Error;

#[derive(Debug, Error)]
pub enum AgentError {
  #[error("not linked; run `monrep link --url <url> --token <token>` first")]
  NotEnrolled,

  #[error("device unknown or revoked; cleared local credentials — run `monrep link` again")]
  DeviceUnknown,

  #[error("credential store is corrupt: {0}")]
  CorruptStore(String),

  #[error("binding mismatch: refused to follow {attempted} (pinned {pinned})")]
  BindingMismatch { pinned: String, attempted: String },

  #[error(transparent)]
  Io(#[from] std::io::Error),

  #[error(transparent)]
  Json(#[from] serde_json::Error),

  #[error(transparent)]
  Other(#[from] anyhow::Error),
}

pub type Result<T> = std::result::Result<T, AgentError>;
