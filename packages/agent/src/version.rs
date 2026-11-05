//! Semver-ish version compare and update-artifact filename parsing (std-only).

pub(crate) const UPDATE_TMP_PREFIX: &str = ".monrep-update-";
pub(crate) const UPDATE_TMP_SUFFIX: &str = ".tmp";
pub(crate) const PREV_PREFIX: &str = ".monrep-prev-";

pub(crate) fn strip_v(tag: &str) -> &str {
  tag.strip_prefix('v').unwrap_or(tag)
}

/// Compare semver-ish strings (digits and dots). Returns true if `remote` is newer than `local`.
pub fn is_newer(remote: &str, local: &str) -> bool {
  let parse = |s: &str| -> Vec<u64> {
    strip_v(s)
      .split('.')
      .filter_map(|p| p.parse::<u64>().ok())
      .collect()
  };
  let remote_parts = parse(remote);
  let local_parts = parse(local);
  let n = remote_parts.len().max(local_parts.len());
  for i in 0..n {
    let remote_n = remote_parts.get(i).copied().unwrap_or(0);
    let local_n = local_parts.get(i).copied().unwrap_or(0);
    if remote_n != local_n {
      return remote_n > local_n;
    }
  }
  false
}

pub(crate) fn is_update_artifact(name: &str) -> bool {
  (name.starts_with(UPDATE_TMP_PREFIX) && name.ends_with(UPDATE_TMP_SUFFIX))
    || name.starts_with(PREV_PREFIX)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn newer_compares() {
    assert!(is_newer("0.2.0", "0.1.0"));
    assert!(is_newer("v1.0.1", "1.0.0"));
    assert!(is_newer("1.0.1", "v1.0.0"));
    assert!(is_newer("1.10.0", "1.9.0"));
    assert!(is_newer("2", "1.9.9"));
    assert!(is_newer("1.0.1", "1.0"));
    assert!(is_newer("1.0.0.1", "1.0.0"));
    assert!(!is_newer("0.1.0", "0.1.0"));
    assert!(!is_newer("0.1.0", "0.2.0"));
    assert!(!is_newer("1.0", "1.0.0"));
    assert!(!is_newer("1.0.0", "1.0"));
    assert!(!is_newer("v1.2.3", "v1.2.3"));
  }

  #[test]
  fn newer_compares_non_numeric_segments() {
    // Non-numeric segments are dropped (`filter_map` parse).
    assert!(!is_newer("", ""));
    assert!(!is_newer("abc", "1.0.0"));
    assert!(is_newer("1.0.0", "abc"));
    assert!(!is_newer("1.2.3-beta", "1.2.3"));
    assert!(is_newer("1.2.3", "1.2.3-beta"));
    // Only a lowercase `v` prefix is stripped.
    assert!(!is_newer("V1.0.1", "1.0.0"));
    assert!(!is_newer(" 1.0.1", "1.0.0"));
  }

  #[test]
  fn update_artifact_names() {
    assert!(is_update_artifact(".monrep-update-123.tmp"));
    assert!(is_update_artifact(".monrep-prev-456"));
    assert!(is_update_artifact(".monrep-update-.tmp"));
    assert!(is_update_artifact(".monrep-prev-"));
    assert!(is_update_artifact(".monrep-prev-x.tmp"));
    assert!(!is_update_artifact("monrep"));
    assert!(!is_update_artifact(".monrep-update-123"));
    assert!(!is_update_artifact("monrep-update-123.tmp"));
    assert!(!is_update_artifact(".tmp"));
    assert!(!is_update_artifact(""));
    assert!(!is_update_artifact(".monrep-update-123.TMP"));
  }
}
