//! Host crate for `bun run rust:miri`. Std-only modules only — no FFI.
#![allow(dead_code)]
#![cfg(test)]

#[test]
fn miri_host_boots() {
  assert_eq!(2 + 2, 4);
}
