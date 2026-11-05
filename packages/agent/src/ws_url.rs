//! Control-plane URL normalization and WebSocket mapping (std-only).

/// Trim whitespace and trailing slashes.
pub fn normalize_control_url(url: &str) -> &str {
  url.trim().trim_end_matches('/')
}

/// Control URL was not `http(s)` or `ws(s)`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnsupportedControlUrl {
  pub input: String,
}

impl std::fmt::Display for UnsupportedControlUrl {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "control_url must be http(s) or ws(s): {}", self.input)
  }
}

impl std::error::Error for UnsupportedControlUrl {}

/// Map an HTTP(S) or WS(S) control URL to the agent WebSocket endpoint.
pub fn to_ws_url(control_url: &str) -> Result<String, UnsupportedControlUrl> {
  let base = normalize_control_url(control_url);
  let ws = if let Some(rest) = base.strip_prefix("https://") {
    format!("wss://{rest}/api/agent/ws")
  } else if let Some(rest) = base.strip_prefix("http://") {
    format!("ws://{rest}/api/agent/ws")
  } else if base.starts_with("wss://") || base.starts_with("ws://") {
    format!("{base}/api/agent/ws")
  } else {
    return Err(UnsupportedControlUrl {
      input: control_url.to_string(),
    });
  };
  Ok(ws)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn ws_url_https() {
    assert_eq!(
      to_ws_url("https://monrep.dev").unwrap(),
      "wss://monrep.dev/api/agent/ws"
    );
    assert_eq!(
      to_ws_url("https://monrep.dev/").unwrap(),
      "wss://monrep.dev/api/agent/ws"
    );
    assert_eq!(
      to_ws_url("  https://monrep.dev/  ").unwrap(),
      "wss://monrep.dev/api/agent/ws"
    );
  }

  #[test]
  fn ws_url_http() {
    assert_eq!(
      to_ws_url("http://127.0.0.1:5274").unwrap(),
      "ws://127.0.0.1:5274/api/agent/ws"
    );
  }

  #[test]
  fn ws_url_already_websocket() {
    assert_eq!(
      to_ws_url("wss://monrep.dev").unwrap(),
      "wss://monrep.dev/api/agent/ws"
    );
    assert_eq!(
      to_ws_url("ws://127.0.0.1:5274/").unwrap(),
      "ws://127.0.0.1:5274/api/agent/ws"
    );
  }

  #[test]
  fn ws_url_rejects_other_schemes() {
    let err = to_ws_url("ftp://example").unwrap_err().to_string();
    assert!(err.contains("ftp://example"));
    assert!(err.starts_with("control_url must be http(s) or ws(s):"));
    assert!(to_ws_url("").is_err());
    assert!(to_ws_url("monrep.dev").is_err());
    assert!(to_ws_url("HTTPS://monrep.dev").is_err());
  }

  #[test]
  fn normalize_trims_and_strips_slash() {
    assert_eq!(normalize_control_url("  https://x/  "), "https://x");
    assert_eq!(normalize_control_url("https://x///"), "https://x");
    assert_eq!(normalize_control_url("https://x"), "https://x");
  }
}
