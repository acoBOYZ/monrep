fn main() {
  println!("cargo:rerun-if-changed=build.rs");
  let os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
  if os == "macos" || os == "ios" {
    // libwebrtc ships NSString/H264 helpers as ObjC categories. Without this
    // the rustwa binary dies in dyld before main (`stringForStdString:`).
    println!("cargo:rustc-link-arg=-ObjC");
  }
}
