//! Host scrapers — structured points (Linux /proc + portable libc fallbacks).

use super::db::MetricPoint;
use super::now_ms;
use std::fs;
use std::sync::Mutex;

/// Previous CPU tick counters for delta-based `cpu.used_pct`.
static PREV_CPU_TICKS: Mutex<Option<(u64, u64)>> = Mutex::new(None);

pub fn scrape_host() -> Vec<MetricPoint> {
  let at = now_ms();
  let mut out = Vec::with_capacity(16);
  scrape_load(at, &mut out);
  scrape_cpu_used(at, &mut out);
  scrape_mem(at, &mut out);
  scrape_disk(at, &mut out);
  scrape_host_meta(at, &mut out);
  out
}

fn push(out: &mut Vec<MetricPoint>, at: i64, name: &str, value: f64, dims: &str) {
  if !value.is_finite() {
    return;
  }
  out.push(MetricPoint {
    at,
    name: name.into(),
    value,
    dims: dims.into(),
  });
}

fn scrape_load(at: i64, out: &mut Vec<MetricPoint>) {
  // Portable: getloadavg on Linux + macOS/BSD.
  #[cfg(unix)]
  {
    let mut loads = [0f64; 3];
    // SAFETY: `loads` is a stack `[f64; 3]` and `nelem` is 3, so the pointer is
    // valid for three writable `f64`s. `getloadavg` writes at most `nelem`
    // samples and does not retain the pointer.
    let n = unsafe { libc::getloadavg(loads.as_mut_ptr(), 3) };
    if n == 3 {
      push(out, at, "cpu.load.1m", loads[0], "{}");
      push(out, at, "cpu.load.5m", loads[1], "{}");
      push(out, at, "cpu.load.15m", loads[2], "{}");
      return;
    }
  }
  let Ok(raw) = fs::read_to_string("/proc/loadavg") else {
    return;
  };
  let mut parts = raw.split_whitespace();
  let Some(l1) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
    return;
  };
  let Some(l5) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
    return;
  };
  let Some(l15) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
    return;
  };
  push(out, at, "cpu.load.1m", l1, "{}");
  push(out, at, "cpu.load.5m", l5, "{}");
  push(out, at, "cpu.load.15m", l15, "{}");
}

/// Busy/(busy+idle) over the scrape interval — comparable to Activity Monitor / CleanMyMac.
fn scrape_cpu_used(at: i64, out: &mut Vec<MetricPoint>) {
  let Some((idle, total)) = read_cpu_ticks() else {
    return;
  };
  let Ok(mut guard) = PREV_CPU_TICKS.lock() else {
    return;
  };
  if let Some((prev_idle, prev_total)) = *guard {
    let di = idle.saturating_sub(prev_idle);
    let dt = total.saturating_sub(prev_total);
    if dt > 0 {
      let busy = dt.saturating_sub(di) as f64;
      let used_pct = (busy / dt as f64) * 100.0;
      push(out, at, "cpu.used_pct", used_pct, "{}");
    }
  }
  *guard = Some((idle, total));
}

fn read_cpu_ticks() -> Option<(u64, u64)> {
  if let Some(t) = read_cpu_ticks_proc() {
    return Some(t);
  }
  #[cfg(target_os = "macos")]
  {
    read_cpu_ticks_macos()
  }
  #[cfg(not(target_os = "macos"))]
  {
    None
  }
}

fn read_cpu_ticks_proc() -> Option<(u64, u64)> {
  let raw = fs::read_to_string("/proc/stat").ok()?;
  let line = raw.lines().next()?;
  if !line.starts_with("cpu ") {
    return None;
  }
  let mut parts = line.split_whitespace().skip(1);
  let user: u64 = parts.next()?.parse().ok()?;
  let nice: u64 = parts.next()?.parse().ok()?;
  let system: u64 = parts.next()?.parse().ok()?;
  let idle: u64 = parts.next()?.parse().ok()?;
  let iowait: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let irq: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let softirq: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let steal: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let idle_all = idle.saturating_add(iowait);
  let total = user
    .saturating_add(nice)
    .saturating_add(system)
    .saturating_add(idle_all)
    .saturating_add(irq)
    .saturating_add(softirq)
    .saturating_add(steal);
  Some((idle_all, total))
}

#[cfg(target_os = "macos")]
fn host_port() -> libc::mach_port_t {
  static HOST: std::sync::OnceLock<libc::mach_port_t> = std::sync::OnceLock::new();
  *HOST.get_or_init(|| {
    // SAFETY: `mach_host_self` returns a send right to this task's host port.
    // Caching it for process lifetime avoids leaking a new send right on every
    // scrape (`mach_port_deallocate` is not exported by libc).
    unsafe { mach_host_self() }
  })
}

#[cfg(target_os = "macos")]
fn read_cpu_ticks_macos() -> Option<(u64, u64)> {
  let mut info = libc::host_cpu_load_info {
    cpu_ticks: [0; libc::CPU_STATE_MAX as usize],
  };
  let mut count = libc::HOST_CPU_LOAD_INFO_COUNT;
  // SAFETY: `info` is a stack `host_cpu_load_info` whose size matches
  // `HOST_CPU_LOAD_INFO_COUNT`. `host_port()` is a cached `mach_host_self`
  // send right. The kernel writes at most `count` `integer_t`s into `info`
  // and does not retain either pointer.
  let kr = unsafe {
    libc::host_statistics(
      host_port(),
      libc::HOST_CPU_LOAD_INFO,
      std::ptr::from_mut(&mut info).cast(),
      std::ptr::from_mut(&mut count),
    )
  };
  if kr != 0 {
    return None;
  }
  let user = u64::from(info.cpu_ticks[libc::CPU_STATE_USER as usize]);
  let system = u64::from(info.cpu_ticks[libc::CPU_STATE_SYSTEM as usize]);
  let idle = u64::from(info.cpu_ticks[libc::CPU_STATE_IDLE as usize]);
  let nice = u64::from(info.cpu_ticks[libc::CPU_STATE_NICE as usize]);
  let total = user
    .saturating_add(system)
    .saturating_add(idle)
    .saturating_add(nice);
  Some((idle, total))
}

fn scrape_mem(at: i64, out: &mut Vec<MetricPoint>) {
  if !scrape_mem_proc(at, out) {
    #[cfg(target_os = "macos")]
    scrape_mem_macos(at, out);
  }
}

fn scrape_mem_proc(at: i64, out: &mut Vec<MetricPoint>) -> bool {
  let Ok(raw) = fs::read_to_string("/proc/meminfo") else {
    return false;
  };
  let mut total_kb = None;
  let mut avail_kb = None;
  let mut free_kb = None;
  for line in raw.lines() {
    let mut parts = line.split_whitespace();
    let Some(key) = parts.next() else { continue };
    let Some(val) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
      continue;
    };
    match key {
      "MemTotal:" => total_kb = Some(val),
      "MemAvailable:" => avail_kb = Some(val),
      "MemFree:" => free_kb = Some(val),
      _ => {}
    }
  }
  let Some(total_kb) = total_kb else {
    return false;
  };
  let avail = avail_kb.or(free_kb).unwrap_or(0.0);
  let used = (total_kb - avail).max(0.0);
  push(out, at, "mem.total_bytes", total_kb * 1024.0, "{}");
  push(out, at, "mem.used_bytes", used * 1024.0, "{}");
  if total_kb > 0.0 {
    push(out, at, "mem.used_pct", (used / total_kb) * 100.0, "{}");
  }
  true
}

#[cfg(target_os = "macos")]
fn scrape_mem_macos(at: i64, out: &mut Vec<MetricPoint>) {
  let Some(total) = sysctl_u64("hw.memsize") else {
    return;
  };
  if total == 0 {
    return;
  }
  let Some(page_size) = sysctl_u64("hw.pagesize").filter(|&s| s > 0) else {
    return;
  };
  let Some(vm) = host_vm_stats64() else {
    return;
  };
  // Darwin: free_count includes speculative. Available ≈ free + inactive + purgeable
  // (Activity Monitor / CleanMyMac style). free-only looks ~99% "used" and is wrong.
  let free = vm.free_count as u64;
  let inactive = vm.inactive_count as u64;
  let purgeable = vm.purgeable_count as u64;
  let avail_pages = free.saturating_add(inactive).saturating_add(purgeable);
  let avail = avail_pages.saturating_mul(page_size).min(total);
  let used = total.saturating_sub(avail);
  let used_pct = (used as f64 / total as f64) * 100.0;
  push(out, at, "mem.total_bytes", total as f64, "{}");
  push(out, at, "mem.used_bytes", used as f64, "{}");
  push(out, at, "mem.used_pct", used_pct, "{}");
}

#[cfg(target_os = "macos")]
fn sysctl_u64(name: &str) -> Option<u64> {
  let cname = std::ffi::CString::new(name).ok()?;
  let mut val: u64 = 0;
  let mut len = std::mem::size_of_val(&val);
  // SAFETY: `cname` is a NUL-terminated `CString`. `val` and `len` are valid
  // stack values for the duration of this call. `newp`/`newlen` are null/0, so
  // this is a read-only query; the kernel writes at most `len` bytes into `val`.
  let rc = unsafe {
    libc::sysctlbyname(
      cname.as_ptr(),
      std::ptr::from_mut(&mut val).cast(),
      std::ptr::from_mut(&mut len),
      std::ptr::null_mut(),
      0,
    )
  };
  if rc == 0 { Some(val) } else { None }
}

// libc exports `host_statistics` / `host_statistics64` and the Mach info
// types. `mach_host_self` is deprecated there (favoring the `mach2` crate);
// keep a tiny local symbol so we do not take a new dependency.
#[cfg(target_os = "macos")]
#[link(name = "System")]
unsafe extern "C" {
  fn mach_host_self() -> libc::mach_port_t;
}

#[cfg(target_os = "macos")]
fn host_vm_stats64() -> Option<libc::vm_statistics64> {
  let mut stats = std::mem::MaybeUninit::<libc::vm_statistics64>::zeroed();
  let mut count = libc::HOST_VM_INFO64_COUNT;
  // SAFETY: `stats` is a zeroed `vm_statistics64` whose size is at least
  // `HOST_VM_INFO64_COUNT` `integer_t`s. `host_port()` is a cached
  // `mach_host_self` send right. The kernel writes at most `count` units
  // into `stats` and does not retain the pointers.
  let kr = unsafe {
    libc::host_statistics64(
      host_port(),
      libc::HOST_VM_INFO64,
      stats.as_mut_ptr().cast(),
      std::ptr::from_mut(&mut count),
    )
  };
  if kr != 0 {
    return None;
  }
  // SAFETY: `host_statistics64` returned success, so the flavor prefix is
  // initialized; any tail beyond what the kernel wrote stayed zeroed.
  Some(unsafe { stats.assume_init() })
}

fn scrape_disk(at: i64, out: &mut Vec<MetricPoint>) {
  #[cfg(unix)]
  {
    scrape_disk_unix(at, out);
  }
  #[cfg(not(unix))]
  {
    let _ = (at, out);
  }
}

#[cfg(unix)]
fn scrape_disk_unix(at: i64, out: &mut Vec<MetricPoint>) {
  use std::ffi::CString;
  let mounts = ["/"];
  for mount in mounts {
    let Ok(cpath) = CString::new(mount) else {
      continue;
    };
    let mut s = std::mem::MaybeUninit::<libc::statvfs>::uninit();
    // SAFETY: `cpath` is a valid NUL-terminated `CString`. `statvfs` writes a
    // complete `statvfs` into `s` when it returns 0.
    let rc = unsafe { libc::statvfs(cpath.as_ptr(), s.as_mut_ptr()) };
    if rc != 0 {
      continue;
    }
    // SAFETY: `statvfs` returned 0, so `s` is fully initialized.
    let s = unsafe { s.assume_init() };
    let bsize = s.f_frsize as f64;
    let total = s.f_blocks as f64 * bsize;
    let avail = s.f_bavail as f64 * bsize;
    let used = (total - avail).max(0.0);
    let dims = format!(r#"{{"mount":"{mount}"}}"#);
    if total > 0.0 {
      push(out, at, "disk.used_pct", (used / total) * 100.0, &dims);
    }
  }
}

fn scrape_host_meta(at: i64, out: &mut Vec<MetricPoint>) {
  if let Ok(raw) = fs::read_to_string("/proc/cpuinfo") {
    let n = raw.lines().filter(|l| l.starts_with("processor")).count() as f64;
    if n > 0.0 {
      push(out, at, "host.nproc", n, "{}");
      return;
    }
  }
  if let Ok(n) = std::thread::available_parallelism() {
    push(out, at, "host.nproc", n.get() as f64, "{}");
  }
}
