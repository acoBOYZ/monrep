//! PTY open/resize dimension and cwd validation (std-only).

pub const DEFAULT_COLS: u16 = 80;
pub const DEFAULT_ROWS: u16 = 24;

/// Map an optional dimension to `u16`, falling back to `default` when missing or out of range.
pub fn pty_dimension(value: Option<u64>, default: u16) -> u16 {
  value.and_then(|n| u16::try_from(n).ok()).unwrap_or(default)
}

/// Require a PTY dimension (`cols` / `rows`) for resize.
pub fn required_pty_dimension(value: Option<u64>, name: &str) -> Result<u16, String> {
  let n = value.ok_or_else(|| format!("{name} required"))?;
  u16::try_from(n).map_err(|_| format!("{name} out of range"))
}

/// Treat missing/blank cwd as unset; require a Unix absolute path otherwise.
pub fn normalize_pty_cwd(cwd: Option<&str>) -> Result<Option<String>, &'static str> {
  let Some(path) = cwd.map(str::trim).filter(|s| !s.is_empty()) else {
    return Ok(None);
  };
  if !path.starts_with('/') {
    return Err("pty cwd must be an absolute path");
  }
  Ok(Some(path.to_string()))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn pty_dimension_defaults_and_clamps() {
    assert_eq!(pty_dimension(None, DEFAULT_COLS), 80);
    assert_eq!(pty_dimension(Some(0), DEFAULT_COLS), 0);
    assert_eq!(pty_dimension(Some(120), DEFAULT_ROWS), 120);
    assert_eq!(pty_dimension(Some(u16::MAX as u64), 24), u16::MAX);
    assert_eq!(pty_dimension(Some(u16::MAX as u64 + 1), DEFAULT_COLS), 80);
    assert_eq!(pty_dimension(Some(u64::MAX), DEFAULT_ROWS), 24);
  }

  #[test]
  fn required_pty_dimension_errors() {
    assert_eq!(required_pty_dimension(Some(80), "cols").unwrap(), 80);
    assert_eq!(required_pty_dimension(Some(0), "rows").unwrap(), 0);
    assert_eq!(
      required_pty_dimension(None, "cols").unwrap_err(),
      "cols required"
    );
    assert_eq!(
      required_pty_dimension(Some(u16::MAX as u64 + 1), "cols").unwrap_err(),
      "cols out of range"
    );
    assert_eq!(
      required_pty_dimension(Some(u64::MAX), "rows").unwrap_err(),
      "rows out of range"
    );
  }

  #[test]
  fn normalize_pty_cwd_absolute_only() {
    assert_eq!(normalize_pty_cwd(None).unwrap(), None);
    assert_eq!(normalize_pty_cwd(Some("")).unwrap(), None);
    assert_eq!(normalize_pty_cwd(Some("   ")).unwrap(), None);
    assert_eq!(
      normalize_pty_cwd(Some("/tmp")).unwrap().as_deref(),
      Some("/tmp")
    );
    assert_eq!(
      normalize_pty_cwd(Some("  /var/tmp  ")).unwrap().as_deref(),
      Some("/var/tmp")
    );
    assert_eq!(normalize_pty_cwd(Some("/")).unwrap().as_deref(), Some("/"));
    assert_eq!(
      normalize_pty_cwd(Some("relative")).unwrap_err(),
      "pty cwd must be an absolute path"
    );
    assert_eq!(
      normalize_pty_cwd(Some("tmp/foo")).unwrap_err(),
      "pty cwd must be an absolute path"
    );
    assert_eq!(
      normalize_pty_cwd(Some("./here")).unwrap_err(),
      "pty cwd must be an absolute path"
    );
  }
}
